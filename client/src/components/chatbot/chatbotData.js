/**
 * Chatbot Q&A data for Mara Cosmetics.
 *
 * Structure:
 *  - categories  → shown as the first set of quick-reply buttons
 *  - Each category has questions (shown as follow-up quick-replies)
 *  - Each question has an answer string (supports simple markdown-ish bold via **)
 */

const chatbotData = {
  greeting:
    'Hi there! 💄 Welcome to our cosmetics shop. How can I help you today? Pick a topic below or type your question.',

  categories: [
    {
      id: 'orders',
      label: '📦 Orders & Shipping',
      questions: [
        {
          id: 'orders-how',
          label: 'How do I place an order?',
          answer:
            'Browse our products on the home page, click **Add to Cart**, then go to your cart and click **Checkout**. You\'ll enter your shipping address and pay securely with your card via Stripe.',
        },
        {
          id: 'orders-track',
          label: 'Can I track my order?',
          answer:
            'Once your order is confirmed, you\'ll receive a confirmation email with your order ID. We\'re working on adding real-time tracking — stay tuned!',
        },
        {
          id: 'orders-shipping-time',
          label: 'How long does shipping take?',
          answer:
            'Standard shipping within Romania takes **2–5 business days**. International orders may take **7–14 business days** depending on your location.',
        },
        {
          id: 'orders-shipping-cost',
          label: 'How much does shipping cost?',
          answer:
            'We offer **free shipping** on orders over 150 lei. For orders under that, a flat rate of **15 lei** applies for domestic shipping.',
        },
      ],
    },
    {
      id: 'payments',
      label: '💳 Payments',
      questions: [
        {
          id: 'payments-methods',
          label: 'What payment methods do you accept?',
          answer:
            'We accept all major **credit and debit cards** (Visa, Mastercard, American Express) through our secure Stripe checkout.',
        },
        {
          id: 'payments-secure',
          label: 'Is my payment secure?',
          answer:
            'Absolutely! We use **Stripe**, a PCI-compliant payment processor. Your card details never touch our servers — everything is encrypted end-to-end.',
        },
        {
          id: 'payments-currency',
          label: 'What currency are prices in?',
          answer:
            'All prices on Mara Cosmetics are displayed in **RON (Romanian Lei)**.',
        },
      ],
    },
    {
      id: 'returns',
      label: '🔄 Returns & Refunds',
      questions: [
        {
          id: 'returns-policy',
          label: 'What is your return policy?',
          answer:
            'You can return **unopened products** within **30 days** of delivery for a full refund. Please contact us at maracosmetics12@gmail.com to initiate a return.',
        },
        {
          id: 'returns-damaged',
          label: 'What if my product arrives damaged?',
          answer:
            'We\'re sorry about that! Send a photo of the damaged item to **maracosmetics12@gmail.com** and we\'ll send a replacement or issue a full refund within 48 hours.',
        },
        {
          id: 'returns-refund-time',
          label: 'How long do refunds take?',
          answer:
            'Refunds are processed within **5–7 business days** after we receive the returned item. The amount will be credited back to your original payment method.',
        },
      ],
    },
    {
      id: 'account',
      label: '👤 My Account',
      questions: [
        {
          id: 'account-create',
          label: 'How do I create an account?',
          answer:
            'Click the **Register** button in the top navigation bar. Fill in your username, email, and password — and you\'re all set!',
        },
        {
          id: 'account-guest',
          label: 'Can I shop without an account?',
          answer:
            'Yes! You can browse products and add items to your cart as a guest. However, you\'ll need to **log in** to complete the checkout process.',
        },
        {
          id: 'account-password',
          label: 'I forgot my password',
          answer:
            'Password reset is coming soon. For now, please email **maracosmetics12@gmail.com** with your registered email and we\'ll help you regain access.',
        },
      ],
    },
    {
      id: 'products',
      label: '🧴 Products',
      questions: [
        {
          id: 'products-authentic',
          label: 'Are your products authentic?',
          answer:
            'Yes — we only sell **100% authentic** cosmetics sourced directly from authorized distributors and brands.',
        },
        {
          id: 'products-filter',
          label: 'How do I find a specific product?',
          answer:
            'On the home page, click the filter panel on the left to filter by **category**, **brand**, and **price range**. You can also sort products by price.',
        },
        {
          id: 'products-stock',
          label: 'What if a product is out of stock?',
          answer:
            'If a product is currently unavailable, check back regularly as we restock frequently. You can also email us to ask about specific items.',
        },
        {
          id: 'products-ingredients',
          label: 'Where can I see product ingredients?',
          answer:
            'Product ingredients and details are shown on each **product detail page**. Click on any product card to view its full description.',
        },
      ],
    },
    {
      id: 'contact',
      label: '📧 Contact & Support',
      questions: [
        {
          id: 'contact-email',
          label: 'How can I contact you?',
          answer:
            'You can reach us at **maracosmetics12@gmail.com**. We aim to respond within 24 hours on business days.',
        },
        {
          id: 'contact-hours',
          label: 'What are your support hours?',
          answer:
            'Our support team is available **Monday–Friday, 9:00 AM – 6:00 PM (EET)**. We\'ll get back to you as soon as possible!',
        },
      ],
    },
  ],
};

export default chatbotData;
