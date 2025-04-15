const connectToDatabase = require('../db');
const Product = require('../models/Product');
const withCors = require('../withCors');
require('dotenv').config();

const handler = async (event, context) => {
  // Extract query parameters.
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
    } else if (field === "price") {
      // For price, include filters for category and brand if provided.
      const match = {};
      if (queryParams.category) {
        match.category = queryParams.category;
      }
      if (queryParams.brand) {
        // If multiple brands are selected (comma-separated), split and use $in.
        if (queryParams.brand.indexOf(',') !== -1) {
          match.brand = { $in: queryParams.brand.split(',').map(b => b.trim()) };
        } else {
          match.brand = queryParams.brand;
        }
      }
      // Aggregate to find the minimum and maximum price in the matching products.
      values = await Product.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" }
          }
        }
      ]);
      if (values && values.length > 0) {
        // Return an object with minPrice and maxPrice.
        values = values[0];
      } else {
        values = { minPrice: 0, maxPrice: 0 };
      }
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
