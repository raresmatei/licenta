/* netlify/functions/stripeWebhook.js */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const connectToDatabase = require('../db');
const Order = require('../models/Order');
const Cart  = require('../models/Cart');
const Mailjet = require('node-mailjet');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/* helper ----------------------------------------------------------- */
async function sendConfirmationEmail(order) {
  const mailjet = new Mailjet({
    apiKey: process.env.MAILJET_PUBLIC_API_KEY,
    apiSecret: process.env.MAILJET_PRIVATE_API_KEY,
  });

  await mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: { Email: 'maracosmetics12@gmail.com', Name: 'Mara Cosmetics' },
          To:   [{ Email: order.userEmail, Name: 'Customer' }],
          Subject: 'Order Confirmation',
          TextPart: 'Dear customer, thank you for your order!',
          HTMLPart: `
            <h1>Thank you for your order!</h1>
            <p>Order ID: <strong>${order._id}</strong></p>
            <p>Total: ${order.totalAmount.toFixed(2)} lei</p>
            <p>Shipping to: ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}</p>`,
        },
      ],
    });
}

/* Netlify must receive the raw body to verify Stripe’s signature */
exports.handler = async (event) => {
  const sig  = event.headers['stripe-signature'];
  const body = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body;           // raw string

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  /* Handle the checkout-success event */
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    try {
      await connectToDatabase();

      // 1. mark order as paid
      const order = await Order.findOneAndUpdate(
        { 'paymentInfo.paymentId': session.id },
        {
          status: 'paid',
          'paymentInfo.paymentStatus': session.payment_status,
        },
        { new: true }
      );

      if (!order) {
        console.warn('Order not found for session', session.id);
        return { statusCode: 200, body: 'ok' };
      }

      // 2. clear cart
      await Cart.findOneAndUpdate({ userId: order.userId }, { items: [], itemCount: 0 });

      // 3. send e-mail
      await sendConfirmationEmail(order);
    } catch (err) {
      console.error('Error processing checkout.session.completed', err);
      return { statusCode: 500, body: 'Webhook handler failure' };
    }
  }

  return { statusCode: 200, body: 'ok' };
};
