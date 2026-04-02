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
const Product  = require('../models/Product'); // needed so Mongoose can populate
const Mailjet  = require('node-mailjet');
const generateInvoicePdf = require('../generateInvoicePdf');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // whsec_...

/* -------------------------------------------------------------------------- */
/* Helper: send confirmation e‑mail                                           */
/* -------------------------------------------------------------------------- */
async function sendConfirmationEmail(order) {
  const mailjet = new Mailjet({
    apiKey:   process.env.MAILJET_PUBLIC_API_KEY,
    apiSecret: process.env.MAILJET_PRIVATE_API_KEY,
  });

  // Generate the invoice PDF as a Buffer
  const pdfBuffer = await generateInvoicePdf(order);
  const pdfBase64 = pdfBuffer.toString('base64');

  // Build product rows for the HTML body
  const productRows = (order.products || []).map((item, i) => {
    const p = item.product || {};
    const name = p.name || 'Product';
    const price = p.price || 0;
    const qty = item.quantity || 1;
    const lineTotal = price * qty;
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #E8DDD9;">${i + 1}</td>
      <td style="padding:8px;border-bottom:1px solid #E8DDD9;">${name}</td>
      <td style="padding:8px;border-bottom:1px solid #E8DDD9;text-align:center;">${qty}</td>
      <td style="padding:8px;border-bottom:1px solid #E8DDD9;text-align:right;">${price.toFixed(2)} lei</td>
      <td style="padding:8px;border-bottom:1px solid #E8DDD9;text-align:right;">${lineTotal.toFixed(2)} lei</td>
    </tr>`;
  }).join('');

  const payload = {
    Messages: [
      {
        From: { Email: 'maracosmetics12@gmail.com', Name: 'Mara Cosmetics' },
        To:   [{ Email: order.userEmail, Name: order.shippingAddress?.fullName || 'Customer' }],
        Subject: `Order Confirmation – #${order._id}`,
        TextPart: 'Thank you for your purchase! Your invoice is attached.',
        HTMLPart: `
          <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:auto;">
            <h1 style="color:#8C5E6B;">Thank you for your order!</h1>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB')}</p>
            <p><strong>Shipping to:</strong> ${order.shippingAddress.fullName}, ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <thead>
                <tr style="background:#8C5E6B;color:#fff;">
                  <th style="padding:8px;text-align:left;">#</th>
                  <th style="padding:8px;text-align:left;">Product</th>
                  <th style="padding:8px;text-align:center;">Qty</th>
                  <th style="padding:8px;text-align:right;">Price</th>
                  <th style="padding:8px;text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>${productRows}</tbody>
            </table>
            <p style="font-size:18px;font-weight:bold;color:#8C5E6B;">Total: ${order.totalAmount.toFixed(2)} lei</p>
            <hr style="border:none;border-top:1px solid #E8DDD9;margin:24px 0;" />
            <p style="font-size:12px;color:#6B6369;">A detailed invoice PDF is attached to this email. If you have any questions, reply to this email.</p>
          </div>
        `,
        Attachments: [
          {
            ContentType: 'application/pdf',
            Filename: `invoice-${order._id}.pdf`,
            Base64Content: pdfBase64,
          },
        ],
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
      ).populate('products.product');

      if (!order) {
        console.warn('[StripeWebhook] Order not found for session', session.id);
        return { statusCode: 200, body: 'no‑match' }; // Acknowledge anyway
      }

      // 2. Clear cart (best‑effort)
      await Cart.findOneAndUpdate({ userId: order.userId }, { items: [], itemCount: 0 });

      // 2b. Decrease stock for each product in the order
      for (const item of order.products) {
        const productId = item.product._id || item.product;
        await Product.findByIdAndUpdate(productId, {
          $inc: { stock: -(item.quantity) }
        });
      }

      // 3. Send confirmation e‑mail – fail‑loud so we see errors in logs
      try {
        await sendConfirmationEmail(order);
        console.log('[StripeWebhook] Order', order._id, 'marked paid & e‑mail sent');
      } catch (emailErr) {
        console.error('[StripeWebhook] Email/PDF error:', emailErr.message, emailErr.stack);
        // Don't fail the whole webhook — order is already marked paid
      }
    } catch (err) {
      console.error('[StripeWebhook] Handler error', err);
      // Let Stripe retry by returning 500 – unless you store retries elsewhere
      return { statusCode: 500, body: 'Webhook handler failure' };
    }
  }

  // Return a 200 to tell Stripe the event was received successfully
  return { statusCode: 200, body: 'ok' };
};
