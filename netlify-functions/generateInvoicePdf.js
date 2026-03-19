/**
 * generateInvoicePdf.js
 * ---------------------
 * Builds a professional-looking invoice / bill PDF using PDFKit and returns
 * the result as a Buffer (suitable for e-mail attachment).
 *
 * @param {Object} order – Mongoose Order document (products should be populated)
 * @returns {Promise<Buffer>}
 */

const PDFDocument = require('pdfkit');
const path = require('path');

/* ---- font paths (Roboto supports Romanian diacritics) ---- */
const FONT_REGULAR = path.join(__dirname, 'functions', 'fonts', 'Roboto-Regular.ttf');
const FONT_BOLD    = path.join(__dirname, 'functions', 'fonts', 'Roboto-Bold.ttf');

/* ---- colour palette (matches Mara Cosmetics branding) ---- */
const BRAND      = '#8C5E6B';
const DARK       = '#2D2A2E';
const GREY       = '#6B6369';
const LIGHT_BG   = '#FBF8F6';
const LINE_COLOR = '#E8DDD9';

/* ---- helper: collect PDF stream into a Buffer ---- */
function docToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

/* ---- draw a horizontal rule ---- */
function hr(doc, y, width) {
  doc
    .strokeColor(LINE_COLOR)
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(50 + width, y)
    .stroke();
}

/* ---- main export ---- */
async function generateInvoicePdf(order) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const bufferPromise = docToBuffer(doc);

  /* Register Roboto fonts (supports Romanian diacritics: ă, â, î, ș, ț) */
  doc.registerFont('Roboto', FONT_REGULAR);
  doc.registerFont('Roboto-Bold', FONT_BOLD);

  const pageWidth = doc.page.width - 100; // 50 margin each side

  /* ==================================================================
     HEADER
     ================================================================== */
  doc
    .fillColor(BRAND)
    .fontSize(22)
    .font('Roboto-Bold')
    .text('Mara Cosmetics', 50, 50);

  doc
    .fillColor(GREY)
    .fontSize(9)
    .font('Roboto')
    .text('maracosmetics12@gmail.com', 50, 76)
    .text('https://mara-cosmetics.netlify.app', 50, 88);

  /* "INVOICE" label – right-aligned */
  doc
    .fillColor(BRAND)
    .fontSize(28)
    .font('Roboto-Bold')
    .text('INVOICE', 350, 50, { width: pageWidth - 300, align: 'right' });

  /* ==================================================================
     ORDER META
     ================================================================== */
  const metaTop = 120;

  doc.fillColor(DARK).fontSize(10).font('Roboto-Bold');
  doc.text('Invoice No:', 50, metaTop);
  doc.font('Roboto').fillColor(GREY);
  doc.text(`#${order._id}`, 130, metaTop);

  doc.font('Roboto-Bold').fillColor(DARK);
  doc.text('Date:', 50, metaTop + 16);
  doc.font('Roboto').fillColor(GREY);
  doc.text(new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB'), 130, metaTop + 16);

  doc.font('Roboto-Bold').fillColor(DARK);
  doc.text('Status:', 50, metaTop + 32);
  doc.font('Roboto').fillColor(GREY);
  doc.text('Paid', 130, metaTop + 32);

  /* Shipping address block – right side */
  const addr = order.shippingAddress || {};
  doc.font('Roboto-Bold').fontSize(10).fillColor(DARK);
  doc.text('Ship To:', 350, metaTop);
  doc.font('Roboto').fillColor(GREY);
  doc.text(addr.fullName || '', 350, metaTop + 16);
  doc.text(addr.addressLine1 || '', 350, metaTop + 28);
  doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}`, 350, metaTop + 40);
  doc.text(addr.country || '', 350, metaTop + 52);

  /* ==================================================================
     TABLE HEADER
     ================================================================== */
  const tableTop = metaTop + 80;

  // Column positions
  const col = {
    num:   50,
    name:  80,
    qty:   340,
    price: 400,
    total: 470,
  };

  // Header background
  doc
    .rect(50, tableTop, pageWidth, 22)
    .fill(BRAND);

  doc.fillColor('#fff').fontSize(9).font('Roboto-Bold');
  doc.text('#',        col.num  + 6, tableTop + 6, { width: 25 });
  doc.text('Product',  col.name + 4, tableTop + 6, { width: 250 });
  doc.text('Qty',      col.qty  + 4, tableTop + 6, { width: 50 });
  doc.text('Price',    col.price+ 4, tableTop + 6, { width: 60 });
  doc.text('Total',    col.total+ 4, tableTop + 6, { width: 70 });

  /* ==================================================================
     TABLE ROWS
     ================================================================== */
  let y = tableTop + 26;
  const products = order.products || [];

  products.forEach((item, i) => {
    // Alternate row background
    if (i % 2 === 0) {
      doc.rect(50, y - 2, pageWidth, 20).fill(LIGHT_BG);
    }

    const productData = item.product; // populated Product document or plain obj
    const name  = (productData && productData.name) || 'Product';
    const price = (productData && productData.price) || 0;
    const qty   = item.quantity || 1;
    const lineTotal = price * qty;

    doc.fillColor(DARK).fontSize(9).font('Roboto');
    doc.text(String(i + 1),              col.num  + 6, y + 2, { width: 25 });
    doc.text(name,                       col.name + 4, y + 2, { width: 250 });
    doc.text(String(qty),                col.qty  + 4, y + 2, { width: 50 });
    doc.text(`${price.toFixed(2)} lei`,  col.price+ 4, y + 2, { width: 60 });
    doc.text(`${lineTotal.toFixed(2)} lei`, col.total+ 4, y + 2, { width: 70 });

    y += 22;
  });

  /* ==================================================================
     TOTALS
     ================================================================== */
  y += 6;
  hr(doc, y, pageWidth);
  y += 12;

  const subtotal = products.reduce((sum, item) => {
    const price = (item.product && item.product.price) || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  // Subtotal
  doc.font('Roboto').fontSize(10).fillColor(GREY);
  doc.text('Subtotal:', col.price - 20, y, { width: 80, align: 'right' });
  doc.text(`${subtotal.toFixed(2)} lei`, col.total + 4, y, { width: 80 });

  y += 18;

  // Shipping
  doc.text('Shipping:', col.price - 20, y, { width: 80, align: 'right' });
  doc.text('Free', col.total + 4, y, { width: 80 });

  y += 22;
  hr(doc, y, pageWidth);
  y += 10;

  // Grand Total
  doc.font('Roboto-Bold').fontSize(13).fillColor(BRAND);
  doc.text('Total:', col.price - 20, y, { width: 80, align: 'right' });
  doc.text(`${order.totalAmount.toFixed(2)} lei`, col.total + 4, y, { width: 100 });

  /* ==================================================================
     FOOTER
     ================================================================== */
  y += 50;
  hr(doc, y, pageWidth);
  y += 14;
  doc.font('Roboto').fontSize(8).fillColor(GREY);
  doc.text(
    'Thank you for shopping with Mara Cosmetics! If you have any questions about your order, please contact us at maracosmetics12@gmail.com.',
    50, y,
    { width: pageWidth, align: 'center' }
  );

  /* ---- finalize ---- */
  doc.end();
  return bufferPromise;
}

module.exports = generateInvoicePdf;
