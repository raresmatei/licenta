/* netlify/functions/createCheckoutSession.js */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const withCors = require('../withCors');
const connectToDatabase = require('../db');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/* ------------------------------------------------------------------
   Create a Stripe Checkout session and save a *pending* order.
   E‑mail sending & cart clearing now happen in stripeWebhook.js after
   we receive the `checkout.session.completed` event.
   ------------------------------------------------------------------ */
exports.handler = withCors(async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) };
  }

  const { lineItems, successUrl, cancelUrl, orderData } = data;
  if (!lineItems || !successUrl || !cancelUrl || !orderData) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  /* 1. Create Stripe Checkout session */
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  } catch (err) {
    console.error('Stripe session error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe error' }) };
  }

  /* 2. Connect to MongoDB */
  try {
    await connectToDatabase();
  } catch (err) {
    console.error('DB connection error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Database connection error' }) };
  }

  /* 3. Decode JWT */
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const tokenAuth = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(tokenAuth, JWT_SECRET);
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  /* 4. Save order with status "pending" */
  const newOrder = new Order({
    userId: decoded.userId,
    userEmail: orderData.userEmail,
    products: orderData.products,
    totalAmount: orderData.totalAmount,
    shippingAddress: orderData.shippingAddress,
    status: 'pending',
    paymentInfo: {
      paymentId: session.id, // we'll match this in the webhook
      paymentMethod: orderData.paymentInfo.paymentMethod,
      paymentStatus: 'pending',
    },
  });

  try {
    await newOrder.save();
  } catch (err) {
    console.error('Order save error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Order save failed' }) };
  }

  /* 5. Respond with the Checkout URL */
  return {
    statusCode: 200,
    body: JSON.stringify({
      url: session.url,
      message: 'Checkout session created; order saved as pending.',
    }),
  };
});
