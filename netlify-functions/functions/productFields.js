const connectToDatabase = require('../db');
const Product = require('../models/Product');
const withCors = require('../withCors');
require('dotenv').config();

const handler = async (event, context) => {
  // Extract the "field" query parameter.
  const { field } = event.queryStringParameters || {};
  if (!field) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required query parameter: field" }),
    };
  }

  try {
    await connectToDatabase();
    // Aggregate: group products by the specified field and count them.
    const values = await Product.aggregate([
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    return {
      statusCode: 200,
      body: JSON.stringify({ values }),
    };
  } catch (err) {
    console.error('Error fetching distinct field values:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

exports.handler = withCors(handler);
