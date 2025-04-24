/* netlify/functions/stripeWebhook.js */

/**
 * Stripe Webhook handler – production‑ready
 * -----------------------------------------
 * Handles `checkout.session.completed` events, verifies the signature, updates
 * the corresponding Order to `paid`, clears the user's Cart, and sends a
 * confirmation e‑mail via Mailjet.
 */

const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY);
const connectToDatabase = require('../db');
const Order    = require('../models/Order');
const Cart     = require('../models/Cart');
const Mailjet  = require('node-mailjet');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // whsec_...

/* -------------------------------------------------------------------------- */
/* Helper: send confirmation e‑mail                                           */
/* -------------------------------------------------------------------------- */
async function sendConfirmationEmail(order) {
  const mailjet = new Mailjet({
    apiKey:   process.env.MAILJET_PUBLIC_API_KEY,
    apiSecret: process.env.MAILJET_PRIVATE_API_KEY,
  });

  const payload = {
    Messages: [
      {
        From: { Email: 'maracosmetics12@gmail.com', Name: 'Mara Cosmetics' },
        To:   [{ Email: order.userEmail, Name: 'Customer' }],
        Subject: 'Order Confirmation',
        TextPart: 'Thank you for your purchase!',
        HTMLPart: `
          <h1>Thank you for your order!</h1>
          <p>Order ID: <strong>${order._id}</strong></p>
          <p>Total: ${order.totalAmount.toFixed(2)} lei</p>
          <p>Shipping to: ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}</p>
        `,
      },
    ],
  };

  const res = await mailjet.post('send', { version: 'v3.1' }).request(payload);
  console.log('[Mailjet] sent – status', res.response.status);
}

/* -------------------------------------------------------------------------- */
/* Netlify Function entry point                                              */
/* -------------------------------------------------------------------------- */
exports.handler = async (event) => {
  // Stripe sends the signature in lowercase header on Netlify
  const signature = event.headers['stripe-signature'];

  // Re‑create the exact raw body Stripe signed
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body, 'utf8');

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    console.error('[Stripe] Signature verification failed', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  /* ------------------------------------------------------------------------ */
  /* Handle event types                                                      */
  /* ------------------------------------------------------------------------ */
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object; // Checkout Session

    try {
      await connectToDatabase();

      // 1. Mark order as paid
      const order = await Order.findOneAndUpdate(
        { 'paymentInfo.paymentId': session.id },
        {
          status: 'paid',
          'paymentInfo.paymentStatus': session.payment_status,
        },
        { new: true }
      );

      if (!order) {
        console.warn('[StripeWebhook] Order not found for session', session.id);
        return { statusCode: 200, body: 'no‑match' }; // Acknowledge anyway
      }

      // 2. Clear cart (best‑effort)
      await Cart.findOneAndUpdate({ userId: order.userId }, { items: [], itemCount: 0 });

      // 3. Send confirmation e‑mail – fail‑loud so we see errors in logs
      await sendConfirmationEmail(order);

      console.log('[StripeWebhook] Order', order._id, 'marked paid & e‑mail sent');
    } catch (err) {
      console.error('[StripeWebhook] Handler error', err);
      // Let Stripe retry by returning 500 – unless you store retries elsewhere
      return { statusCode: 500, body: 'Webhook handler failure' };
    }
  }

  // Return a 200 to tell Stripe the event was received successfully
  return { statusCode: 200, body: 'ok' };
};
