const connectToDatabase = require('../db');
const Product = require('../models/Product');
const withCors = require('../withCors');
require('dotenv').config();

const handler = async (event, context) => {
  // Extract the query parameters.
  const queryParams = event.queryStringParameters || {};
  const { field } = queryParams;
  if (!field) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required query parameter: field" }),
    };
  }
  
  try {
    await connectToDatabase();
    
    let values;
    if (field === "brand") {
      const match = {};
      if (queryParams.category) {
        match.category = queryParams.category;
      }
      // If price filters are provided, add them to the match criteria.
      if (queryParams.minPrice && queryParams.maxPrice) {
        match.price = {
          $gte: Number(queryParams.minPrice),
          $lte: Number(queryParams.maxPrice),
        };
      }
      values = await Product.aggregate([
        { $match: match },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    } else if (field === "category") {
      values = await Product.aggregate([
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    } else {
      const distinct = await Product.distinct(field);
      values = distinct.map(val => ({ _id: val, count: 0 }));
    }
    
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
