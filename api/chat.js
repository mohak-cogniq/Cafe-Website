// Vercel Serverless Function to proxy Gemini API requests securely
// Keeps GEMINI_API_KEY hidden on the server side

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in environment variables.'
      });
    }

    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'Message body parameter is required.' });
    }

    const systemPromptText = `You are BrewSmith AI, an enthusiastic, friendly, and helpful AI assistant for The Tropical Coffee House located in Cleveland, OH.

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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPromptText }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ]
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Gemini API Error details:', data);
      return res.status(apiResponse.status).json({
        error: data.error?.message || 'Gemini API Error'
      });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
