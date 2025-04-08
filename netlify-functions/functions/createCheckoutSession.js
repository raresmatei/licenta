
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const withCors = require('../withCors'); // Your existing CORS helper if needed

/**
 * Expects a POST request with JSON:
 * {
 *   "lineItems": [
 *     {
 *       "price_data": {
 *         "currency": "usd",
 *         "product_data": { "name": "Example Product" },
 *         "unit_amount": 1500
 *       },
 *       "quantity": 2
 *     },
 *     ...
 *   ],
 *   "successUrl": "http://localhost:3000/checkout-success",
 *   "cancelUrl": "http://localhost:3000/cart"
 * }
 */
exports.handler = withCors(async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (err) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        };
    }

    const { lineItems, successUrl, cancelUrl } = data;
    if (!lineItems || !successUrl || !cancelUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Missing required fields: lineItems, successUrl, cancelUrl',
            }),
        };
    }

    try {
        // Create a new Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment', // or 'subscription' for recurring
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        // Return the session URL to the client
        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url }),
        };
    } catch (err) {
        console.error('Error creating Stripe Checkout Session:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
});