// netlify-functions/hello.js
const connectToDatabase = require('../db');

exports.handler = async (event, context) => {
  try {
    await connectToDatabase(); // Ensure the DB connection is established

    // You can now perform database operations here, e.g., querying a collection

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Hello from Netlify Functions with DB connection!" }),
    };
  } catch (error) {
    console.error('Error in function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
