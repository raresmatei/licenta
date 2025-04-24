const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const withCors = require('../withCors');
const connectToDatabase = require('../db');
const Order = require('../models/Order');
const Cart = require('../models/Cart');  // Make sure Cart model is imported
const jwt = require('jsonwebtoken');
const Mailjet = require('node-mailjet');

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// A helper function to send a confirmation email asynchronously.
async function sendConfirmationEmail(order) {
    console.log('preparing email...');
    console.log('key public : ', process.env.MAILJET_PUBLIC_API_KEY);
    console.log('private key: ', process.env.MAILJET_PRIVATE_API_KEY);
    const mailjet = new Mailjet({
        apiKey: process.env.MAILJET_PUBLIC_API_KEY,
        apiSecret: process.env.MAILJET_PRIVATE_API_KEY
    });

    console.log('mailjet instantiated');

    const request = mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
            "Messages": [
                {
                    "From": {
                        "Email": "maracosmetics12@gmail.com",
                        "Name": "Mara Cosmetics"
                    },
                    "To": [
                        {
                            "Email": "rares.matei171@gmail.com",
                            "Name": "Rares"
                        }
                    ],
                    "Subject": 'Order Confirmation',
                    "TextPart": "Dear customer, thank you for your order!",
                    "HTMLPart": `<h1>Thank You for Your Order!</h1>
                                <p>Your order with ID <strong>${order._id}</strong> has been successfully placed.</p>
                                <p>Total Amount: ${order.totalAmount.toFixed(2)} lei</p>
                                <p>We will ship your order to ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city} shortly.</p>`
                }
            ]
        });
    request
        .then((result) => {
            console.log("Email sent. Mailjet response:", result.body);
        })
        .catch((err) => {
            console.log("Mailjet error status:", err.statusCode);
        });
}

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

    // Expect the following fields in the request:
    // - lineItems: array for Stripe
    // - successUrl, cancelUrl: URLs for redirection
    // - orderData: an object containing:
    //      { products, totalAmount, shippingAddress, paymentInfo, userEmail }
    const { lineItems, successUrl, cancelUrl, orderData } = data;
    if (!lineItems || !successUrl || !cancelUrl || !orderData) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Missing required fields: lineItems, successUrl, cancelUrl, or orderData',
            }),
        };
    }

    // Create a Stripe Checkout Session.
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
        console.error('Error creating Stripe Checkout Session:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }

    // Ensure database connection is established.
    try {
        await connectToDatabase();
    } catch (dbError) {
        console.error('Database connection error:', dbError);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Database connection error' }),
        };
    }

    // Verify the JWT token to get the user ID.
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const tokenAuth = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(tokenAuth, JWT_SECRET);
    } catch (err) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid token' }),
        };
    }

    // Create a new Order object and store the order in the database.
    // Here, we use the session.id as a placeholder paymentId.
    const newOrder = new Order({
        userId: decoded.userId,
        userEmail: orderData.userEmail,
        products: orderData.products,
        totalAmount: orderData.totalAmount,
        shippingAddress: orderData.shippingAddress,
        paymentInfo: {
            paymentId: session.id,  // session id as the payment identifier
            paymentMethod: orderData.paymentInfo.paymentMethod,
        }
    });

    console.log('order: ', newOrder);

    try {
        await newOrder.save();
    } catch (saveError) {
        console.error('Error saving order:', saveError);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Order saving failed' }),
        };
    }

    // Send confirmation email asynchronously (fire and forget)
    await sendConfirmationEmail(newOrder).catch(err =>
        console.error('Error sending confirmation email:', err)
    );

    // Now, remove the ordered cart items.
    try {
        // Find the user's cart and clear items.
        await Cart.findOneAndUpdate(
            { userId: decoded.userId },
            { items: [], itemCount: 0 }
        );
        console.log('User cart cleared after order.');
    } catch (clearError) {
        console.error('Error clearing cart:', clearError);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            url: session.url,
            message: 'Checkout session created; order is saved and cart cleared.'
        }),
    };
});
