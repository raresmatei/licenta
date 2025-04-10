const connectToDatabase = require('../db');
const Product = require('../models/Product');
const withCors = require('../withCors');
require('dotenv').config();

const handler = async (event, context) => {
  // Extract the "field" query parameter.
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
    // For brand, check if a "category" filter is provided.
    if (field === "brand") {
      const match = {};
      if (queryParams.category) {
        match.category = queryParams.category;
      }
      values = await Product.aggregate([
        { $match: match },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    } else if (field === "category") {
      // For category, simply group by the field.
      values = await Product.aggregate([
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    } else {
      // If other fields are requested, use the distinct method.
      const distinct = await Product.distinct(field);
      values = distinct.map(val => ({ _id: val, count: 0 })); // count can be omitted or computed if needed.
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
