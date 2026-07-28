/*
  The Tropical Coffee House - App Logic
*/

class TropicalLandingApp {
  constructor() {
    this.cart = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
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
    document.getElementById('btn-our-menu')?.addEventListener('click', openDrawer);
    document.getElementById('btn-start-pickup')?.addEventListener('click', openDrawer);
    document.getElementById('btn-location-start-order')?.addEventListener('click', openDrawer);
    
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
      this.quickAdd('Buckeye Roast Whole Bean 12oz', 14.00);
      openDrawer();
    });
    document.getElementById('btn-view-bakery')?.addEventListener('click', () => {
      this.quickAdd('Hunny Bunny Bakery Pastry', 3.75);
      openDrawer();
    });
    document.getElementById('btn-order-bakery')?.addEventListener('click', () => {
      this.quickAdd('Hunny Bunny Bakery Pastry', 3.75);
      openDrawer();
    });

    document.getElementById('close-drawer-btn')?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);
  }

  quickAdd(title, price) {
    this.cart.push({ title, price });
    this.updateCartUI();
  }

  removeFromCart(index) {
    this.cart.splice(index, 1);
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
          <button onclick="app.removeFromCart(${idx})" style="color:var(--text-eyebrow); font-weight:700; font-size:1.1rem; padding:0.2rem 0.5rem;">&times;</button>
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
    alert(`Thank you ${name}! Order #${orderId} received. Pick up at 12302 Buckeye Rd counter at The Tropical Coffee House!`);
    this.cart = [];
    this.updateCartUI();
    document.getElementById('drawer-overlay')?.classList.remove('active');
    document.getElementById('cart-drawer')?.classList.remove('open');
  }
}

const app = new TropicalLandingApp();
