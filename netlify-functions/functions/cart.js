const connectToDatabase = require('../db');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const withCors = require('../withCors');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const cartHandler = async (event, context) => {
    // Verify that an Authorization header is provided
    console.log('headers: ', event.headers)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Missing Authorization header' })
        };
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid token' })
        };
    }

    // Use the decoded token's userId
    const userId = decoded.userId;

    // Ensure database connection is established
    try {
        await connectToDatabase();
    } catch (dbError) {
        console.error('Database connection error:', dbError);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Database connection error' })
        };
    }

    // Switch based on HTTP method
    switch (event.httpMethod) {
        case 'GET': {
            let cart = await Cart.findOne({ userId }).populate('items');
            if (!cart) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ cart: { items: [], itemCount: 0 } }),
                };
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ cart }),
            };
        }

        case 'POST': {
            let data;
            try {
                data = JSON.parse(event.body);
            } catch (err) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid JSON' }),
                };
            }
            if (!data.productId || !data.quantity) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Missing productId or quantity' }),
                };
            }

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = new Cart({ userId, items: [] });
            }

            // Check if the product already exists in the cart
            const index = cart.items.findIndex(
                item => item.product.toString() === data.productId
            );
            if (index > -1) {
                // Increase the quantity if product exists
                cart.items[index].quantity += data.quantity;
            } else {
                // Otherwise, add the product to the cart
                cart.items.push({ product: data.productId, quantity: data.quantity });
            }

            // Update the total item count
            cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            await cart.save();

            return {
                statusCode: 200,
                body: JSON.stringify({ cart }),
            };
        }

        case 'PATCH': {
            let data;
            try {
                data = JSON.parse(event.body);
            } catch (err) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid JSON' }),
                };
            }
            if (!data.productId || typeof data.quantity !== 'number') {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Missing productId or quantity' }),
                };
            }

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Cart not found' }),
                };
            }

            const index = cart.items.findIndex(
                item => item.product.toString() === data.productId
            );
            if (index === -1) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Product not found in cart' }),
                };
            }

            if (data.quantity <= 0) {
                // Remove the item if quantity is 0
                cart.items.splice(index, 1);
            } else {
                // Update the quantity
                cart.items[index].quantity = data.quantity;
            }

            // Recalculate and update the total item count.
            cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            await cart.save();

            return {
                statusCode: 200,
                body: JSON.stringify({ cart }),
            };
        }


        default:
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
    }
};

exports.handler = withCors(cartHandler);
