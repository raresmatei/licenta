/* netlify/functions/createCheckoutSession.js */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const withCors = require('../withCors');
const connectToDatabase = require('../db');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const jwt = require('jsonwebtoken');
const Mailjet = require('node-mailjet');

const JWT_SECRET = process.env.JWT_SECRET;

/** ------------------------------------------------------------------ *
 * Send Mailjet confirmation e-mail and return the API response body.
 * ------------------------------------------------------------------ */
async function sendConfirmationEmail(order) {
    console.log('Preparing e-mail for order', order._id);

    const mailjet = new Mailjet({
        apiKey: process.env.MAILJET_PUBLIC_API_KEY,
        apiSecret: process.env.MAILJET_PRIVATE_API_KEY,
    });

    const payload = {
        Messages: [
            {
                From: { Email: 'maracosmetics12@gmail.com', Name: 'Mara Cosmetics' },
                To: [{ Email: order.userEmail, Name: 'Customer' }],
                Subject: 'Order Confirmation',
                TextPart: 'Dear customer, thank you for your order!',
                HTMLPart: `
          <h1>Thank you for your order!</h1>
          <p>Your order ID: <strong>${order._id}</strong></p>
          <p>Total: ${order.totalAmount.toFixed(2)} lei</p>
          <p>Shipping to: ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}</p>
        `,
            },
        ],
    };

    try {
        const res = await mailjet.post('send', { version: 'v3.1' }).request(payload);
        console.log('Mailjet response status', res.response.status);
        return res.body;
    } catch (err) {
        console.error('Mailjet error', err.statusCode, err.message, err.response?.body);
        throw err; // propagate so the function fails (optional: handle gracefully)
    }
}

/** ------------------------------------------------------------------ *
 * Serverless function handler
 * ------------------------------------------------------------------ */
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

    /* 4. Save order */
    const newOrder = new Order({
        userId: decoded.userId,
        userEmail: orderData.userEmail,
        products: orderData.products,
        totalAmount: orderData.totalAmount,
        shippingAddress: orderData.shippingAddress,
        paymentInfo: {
            paymentId: session.id,
            paymentMethod: orderData.paymentInfo.paymentMethod,
        },
    });

    try {
        await newOrder.save();
    } catch (err) {
        console.error('Order save error', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Order save failed' }) };
    }

    /* 5. Send e-mail (await!) */
    await sendConfirmationEmail(newOrder);

    /* 6. Clear cart */
    try {
        await Cart.findOneAndUpdate({ userId: decoded.userId }, { items: [], itemCount: 0 });
    } catch (err) {
        console.error('Cart clear error', err);
    }

    /* 7. Success response */
    return {
        statusCode: 200,
        body: JSON.stringify({
            url: session.url,
            message: 'Checkout session created; order saved; cart cleared.',
        }),
    };
});
