/*
  The Tropical Coffee House - App Logic
*/

class TropicalLandingApp {
  constructor() {
    this.cart = this.loadCartFromStorage();
    this.orders = this.loadOrdersFromStorage();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupStickyHeader();
    this.setupScrollReveal();
    this.setupScrollToTop();
    this.setupAIChatbot();
    this.updateCartUI();
  }

  // --- LocalStorage persistence for Cart and Orders ---
  loadCartFromStorage() {
    try {
      const saved = localStorage.getItem('tropical_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error reading cart from localStorage', e);
      return [];
    }
  }

  saveCartToStorage() {
    try {
      localStorage.setItem('tropical_cart', JSON.stringify(this.cart));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  }

  loadOrdersFromStorage() {
    try {
      const saved = localStorage.getItem('tropical_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error reading orders from localStorage', e);
      return [];
    }
  }

  saveOrdersToStorage() {
    try {
      localStorage.setItem('tropical_orders', JSON.stringify(this.orders));
    } catch (e) {
      console.error('Error saving orders to localStorage', e);
    }
  }

  getSavedOrders() {
    return this.orders;
  }

  // --- Scroll to top button functionality ---
  setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (!scrollToTopBtn) return;

    const toggleVisibility = () => {
      if (window.scrollY > 250) {
        scrollToTopBtn.classList.add('visible');
        scrollToTopBtn.classList.add('is-visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
        scrollToTopBtn.classList.remove('is-visible');
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // --- AI Chatbot Implementation with Google Gemini API & Strict Guardrails ---
  setupAIChatbot() {
    const triggerBtn = document.getElementById('ai-chatbot-btn');
    const modal = document.getElementById('ai-chatbot-window');
    const closeBtn = document.getElementById('close-chatbot-btn');
    const messagesContainer = document.getElementById('chatbot-messages');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');

    if (!triggerBtn || !modal) return;

    // Load API Key from Environment Variables
    this.geminiApiKey = (typeof window !== 'undefined' && window.ENV && window.ENV.GEMINI_API_KEY) ||
                        (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) || "";
    this.systemPromptText = `You are BrewSmith AI, an enthusiastic, friendly, and helpful AI assistant for The Tropical Coffee House located in Cleveland, OH.

CAFE KNOWLEDGE BASE:
- Address & Location: 12302 Buckeye Rd, Cleveland, OH 44120.
- Operating Hours: Monday to Friday: 6:00 AM - 7:00 PM | Saturday & Sunday: 7:00 AM - 6:00 PM.
- Best Celeb / Featured Signature Special: The "Tropical's Favorite" Signature Latte ($5.00 - $6.00, 100mg caffeine, rich espresso poured over silky steamed milk with customizable syrups).
- Other Popular Beverages: Buckeye Cold Brew ($4.25, 18-hr steeped), Handcrafted Espresso Shots ($5.00, 5 cal).
- Coffee Bags: Buckeye Roast Whole Bean 12oz Bag ($14.00).
- Bakery Items: Handcrafted daily by local partner Hunny Bunny Bakery (Fresh Blueberry Muffins $3.75, pastries, chocolate croissants, sandwiches).
- Online Pickup Orders: Customers can order online via the website's cart drawer for counter pickup at 12302 Buckeye Rd.
- eClub: Joining the eClub via "FRESHEN UP YOUR INBOX" provides exclusive updates and a free coffee voucher.

STRICT HYPER GUARD-RAILS:
You must ONLY discuss topics directly related to The Tropical Coffee House, coffee, cafe drinks, bakery items, operating hours, location, catering, ordering, or visiting the cafe.
If the user prompts or asks about ANYTHING NOT related to the cafe, reply EXACTLY:
"We can only answer queries related to The Tropical Coffee House (our menu, signature drinks, working hours, location, bakery pastries, and pickup orders). How can I assist you with your cafe visit today?"
Keep your answers friendly, concise, warm, and formatted nicely using HTML bolding (<strong>) or markdown.`;

    const toggleModal = () => {
      const isActive = modal.classList.contains('active');
      if (isActive) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      } else {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        input?.focus();
      }
    };

    triggerBtn.addEventListener('click', toggleModal);
    closeBtn?.addEventListener('click', toggleModal);

    messagesContainer?.addEventListener('click', (e) => {
      const chip = e.target.closest('.chat-chip');
      if (chip) {
        const query = chip.dataset.query;
        if (query) {
          this.handleUserChatMessage(query, messagesContainer);
        }
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.handleUserChatMessage(text, messagesContainer);
    });
  }

  async handleUserChatMessage(userQuery, container) {
    // 1. Append User Message
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'chat-msg user-msg';
    userMsgEl.innerHTML = `<div class="chat-bubble">${this.escapeHTML(userQuery)}</div>`;
    container.appendChild(userMsgEl);
    container.scrollTop = container.scrollHeight;

    // 2. CASE 2: Check if user prompt is outside cafe context
    const isCafeQuery = this.checkCafeRelevance(userQuery);

    if (!isCafeQuery) {
      // Off-Topic Guardrail: decline without wasting tokens
      const offTopicMsgEl = document.createElement('div');
      offTopicMsgEl.className = 'chat-msg bot-msg';
      offTopicMsgEl.innerHTML = `<div class="chat-bubble">⚠️ We can only answer queries related to <strong>The Tropical Coffee House</strong> (our menu, signature drinks, working hours, location, bakery pastries, and pickup orders). How can I assist you with your cafe visit today?</div>`;
      container.appendChild(offTopicMsgEl);
      container.scrollTop = container.scrollHeight;
      return;
    }

    // 3. CASE 1: Cafe-Related Question -> Append Typing Indicator and Call Gemini API
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-msg bot-msg';
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = `
      <div class="chat-bubble typing">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;

    // Fetch Gemini 2.5 Flash Response
    const botReply = await this.fetchGeminiResponse(userQuery);

    // Remove Typing Indicator and append Bot Answer
    document.getElementById('typing-indicator')?.remove();

    const botMsgEl = document.createElement('div');
    botMsgEl.className = 'chat-msg bot-msg';
    botMsgEl.innerHTML = `<div class="chat-bubble">${botReply}</div>`;
    container.appendChild(botMsgEl);
    container.scrollTop = container.scrollHeight;
  }

  checkCafeRelevance(query) {
    const q = query.toLowerCase().trim();
    const cafeKeywords = [
      'tropical', 'coffee', 'latte', 'espresso', 'brew', 'buckeye', 'drink', 'beverage',
      'menu', 'food', 'bakery', 'muffin', 'pastry', 'pastries', 'hunny bunny', 'bag',
      'bean', 'roast', 'price', 'cost', 'hour', 'hours', 'open', 'close', 'time',
      'schedule', 'location', 'address', 'cleveland', 'road', 'where', 'find', 'place',
      'order', 'cart', 'pickup', 'checkout', 'catering', 'gift card', 'eclub', 'subscribe',
      'special', 'celeb', 'best', 'recommend', 'popular', 'contact', 'phone', 'email', 'wifi', 'seat',
      'hi', 'hello', 'hey', 'help', 'thanks', 'thank'
    ];

    return cafeKeywords.some(keyword => q.includes(keyword));
  }

  async fetchGeminiResponse(userQuery) {
    // 1. Try serverless proxy endpoint /api/chat (Secure production method - Hides API Key)
    try {
      const proxyResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userQuery })
      });

      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        if (data.reply) {
          return this.formatMarkdown(data.reply);
        }
      } else {
        const errData = await proxyResponse.json().catch(() => ({}));
        if (errData.error) {
          console.warn('Serverless endpoint /api/chat returned error:', errData.error);
        }
      }
    } catch (proxyErr) {
      console.warn('Serverless endpoint /api/chat unreachable, trying fallbacks.', proxyErr);
    }

    // 2. Direct client key fallback (For local standalone testing if window.ENV key is set)
    if (this.geminiApiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: this.systemPromptText }] },
            contents: [{ role: 'user', parts: [{ text: userQuery }] }]
          })
        });

        const data = await response.json();
        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return this.formatMarkdown(text);
        }
      } catch (err) {
        console.error('Direct Gemini API Fetch Exception:', err);
      }
    }

    // 3. Smart Barista offline/fallback answer
    return this.generateSmartBaristaAnswer(userQuery);
  }

  generateSmartBaristaAnswer(query) {
    const q = query.toLowerCase();

    if (q.includes('signature') || q.includes('best') || q.includes('celeb') || q.includes('special') || q.includes('popular') || q.includes('recommend')) {
      return `⭐ Our top featured signature special is <strong>The "Tropical's Favorite" Signature Latte</strong> ($5.00 – $6.00, 100mg caffeine)! We also highly recommend our 18-hr steeped <strong>Buckeye Cold Brew</strong> ($4.25) and handcrafted espresso shots!`;
    }

    if (q.includes('hour') || q.includes('open') || q.includes('close') || q.includes('time') || q.includes('schedule')) {
      return `🕒 <strong>Working Hours:</strong><br>&bull; <strong>Monday &ndash; Friday:</strong> 6:00 AM &ndash; 7:00 PM<br>&bull; <strong>Saturday &ndash; Sunday:</strong> 7:00 AM &ndash; 6:00 PM<br>We serve fresh coffee every morning!`;
    }

    if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('cleveland') || q.includes('find')) {
      return `📍 <strong>Our Address:</strong><br>12302 Buckeye Rd, Cleveland, OH 44120.<br>Come on in—we saved you a seat!`;
    }

    if (q.includes('bakery') || q.includes('muffin') || q.includes('pastry') || q.includes('pastries') || q.includes('food') || q.includes('hunny bunny')) {
      return `🥐 Every pastry we serve is handcrafted daily by local partner <strong>Hunny Bunny Bakery</strong>! Try our popular fresh Blueberry Muffin ($3.75), chocolate croissants, and bakery treats!`;
    }

    if (q.includes('bag') || q.includes('bean') || q.includes('roast') || q.includes('whole bean')) {
      return `☕ Take our brew home! Grab a 12oz bag of <strong>Buckeye Roast Whole Bean Coffee</strong> for $14.00. You can add it directly to your pickup cart!`;
    }

    if (q.includes('order') || q.includes('cart') || q.includes('pickup') || q.includes('buy') || q.includes('checkout')) {
      return `🛒 You can place an online pickup order right here! Click 'Order Online' or 'Start Order' in the header to open your cart, add items, and select 'Place Pickup Order' for instant counter pickup.`;
    }

    if (q.includes('eclub') || q.includes('subscribe') || q.includes('discount') || q.includes('voucher') || q.includes('email')) {
      return `🎁 Join our eClub! Click 'FRESHEN UP YOUR INBOX' in our footer to join and receive a free coffee voucher in your inbox!`;
    }

    if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
      return `👋 Hello neighbor! Welcome to The Tropical Coffee House. Ask me about our lattes, bakery items, hours, or location!`;
    }

    if (q.includes('thank')) {
      return `☕ You're very welcome! Have a wonderful day, and see you soon at The Tropical Coffee House!`;
    }

    return `☕ <strong>The Tropical Coffee House</strong> is Cleveland's premier local coffee shop at 12302 Buckeye Rd. We offer signature lattes, 18-hr cold brew, Hunny Bunny Bakery pastries, and whole-bean coffee bags! How can I assist your order today?`;
  }

  formatMarkdown(str) {
    if (!str) return '';
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // --- Sticky header: adds a shadow + shrinks the logo once you scroll past the hero ---
  setupStickyHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const SCROLL_THRESHOLD = 40;

    const onScroll = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set correct state on load (e.g. if page opens mid-scroll)
  }

  // --- Scroll-reveal: fades/slides elements in as they enter the viewport ---
  setupScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback for very old browsers: just show everything
      revealEls.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // animate once, then leave it
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
  }

  setupEventListeners() {
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('cart-drawer');

    const openDrawer = () => {
      overlay?.classList.add('active');
      drawer?.classList.add('open');
    };

    const closeDrawer = () => {
      overlay?.classList.remove('active');
      drawer?.classList.remove('open');
    };

    document.getElementById('nav-cart-btn')?.addEventListener('click', openDrawer);
    document.getElementById('btn-header-order-online')?.addEventListener('click', openDrawer);
    document.getElementById('btn-order-ahead')?.addEventListener('click', openDrawer);
    document.getElementById('btn-start-pickup')?.addEventListener('click', openDrawer);
    document.getElementById('btn-location-start-order')?.addEventListener('click', openDrawer);
    document.getElementById('btn-location-start-order-menu')?.addEventListener('click', openDrawer);
    
    document.getElementById('btn-subscribe')?.addEventListener('click', () => {
      const email = prompt("Enter your email address to join The Tropical Coffee House eClub:", "neighbor@cleveland.com");
      if (email) {
        alert(`Welcome to the eClub, ${email}! Check your inbox for your first free coffee voucher.`);
      }
    });

    document.getElementById('link-card-order')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.quickAdd('The Tropical Favorite Signature Latte', 5.00);
      openDrawer();
    });

    document.getElementById('btn-buy-bag')?.addEventListener('click', () => {
      this.quickAdd('12 oz Coffee Bag', 14.00);
      openDrawer();
    });

    document.getElementById('close-drawer-btn')?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);
  }

  quickAdd(title, price) {
    this.cart.push({ title, price });
    this.saveCartToStorage();
    this.updateCartUI();

    // Auto open drawer to give feedback
    document.getElementById('drawer-overlay')?.classList.add('active');
    document.getElementById('cart-drawer')?.classList.add('open');
  }

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.saveCartToStorage();
    this.updateCartUI();
  }

  updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const badgeEl = document.getElementById('cart-badge-count');
    const listEl = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');

    if (countEl) countEl.textContent = this.cart.length;
    if (badgeEl) badgeEl.textContent = this.cart.length;

    if (!listEl) return;

    if (this.cart.length === 0) {
      listEl.innerHTML = `<p style="color:var(--text-body); font-size:0.9rem;">Your cart is empty. Click an item to add!</p>`;
      if (totalEl) totalEl.textContent = '$0.00';
      return;
    }

    let total = 0;
    listEl.innerHTML = this.cart.map((item, idx) => {
      total += item.price;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#FFF; padding:0.6rem 0.8rem; border-radius:4px; margin-bottom:0.5rem; font-size:0.88rem;">
          <div>
            <strong>${item.title}</strong>
            <div style="color:var(--text-eyebrow); font-size:0.8rem;">$${item.price.toFixed(2)}</div>
          </div>
          <button onclick="app.removeFromCart(${idx})" style="color:var(--text-eyebrow); font-weight:700; font-size:1.1rem; padding:0.2rem 0.5rem; border:none; background:transparent; cursor:pointer;">&times;</button>
        </div>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  checkout() {
    if (this.cart.length === 0) {
      alert("Your cart is empty! Select an item first.");
      return;
    }
    const name = prompt("Enter your name for pickup order:", "Marcus");
    if (!name) return;

    const orderId = 'TROP-' + Math.floor(1000 + Math.random() * 9000);
    const totalAmount = this.cart.reduce((sum, item) => sum + item.price, 0);

    const newOrder = {
      orderId: orderId,
      customerName: name,
      items: [...this.cart],
      total: totalAmount,
      date: new Date().toLocaleString(),
      timestamp: Date.now()
    };

    this.orders.push(newOrder);
    this.saveOrdersToStorage();

    alert(`Thank you ${name}! Order #${orderId} received. Pick up at 12302 Buckeye Rd counter at The Tropical Coffee House!`);
    this.cart = [];
    this.saveCartToStorage();
    this.updateCartUI();
    document.getElementById('drawer-overlay')?.classList.remove('active');
    document.getElementById('cart-drawer')?.classList.remove('open');
  }
}

const app = new TropicalLandingApp();
