// netlify-functions/products.js
const connectToDatabase = require('../db');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const withCors = require('../withCors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const JWT_SECRET = process.env.JWT_SECRET;

const multipart = require('lambda-multipart-parser');

const handler = async (event, context) => {
  // Verify the admin token from the Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader && ['PUT', 'POST', 'DELETE'].includes(event.httpMethod)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing Authorization header' }),
    };
  }

  if (['PUT', 'POST', 'DELETE'].includes(event.httpMethod)) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded.admin && event.httpMethod !== 'GET') {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'Forbidden: Admins only' }),
        };
      }
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }
  }

  // Ensure database connection is established
  try {
    await connectToDatabase();
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database connection error' }),
    };
  }

  // Process the request based on HTTP method
  try {
    switch (event.httpMethod) {
      case 'GET': {
        // Get all query parameters as filters
        const filters = event.queryStringParameters || {};

        // Extract pagination parameters
        const page = parseInt(filters.page, 10) || 1;
        const limit = parseInt(filters.limit, 10) || 30;
        const skip = (page - 1) * limit;
        delete filters.page;
        delete filters.limit;

        // If an "id" filter is provided, map it to _id
        if (filters.id) {
          filters._id = filters.id;
          delete filters.id;
        }

        // Build price filter if minPrice and/or maxPrice are provided
        if (filters.minPrice || filters.maxPrice) {
          const priceFilter = {};
          if (filters.minPrice) {
            priceFilter.$gte = parseFloat(filters.minPrice);
          }
          if (filters.maxPrice) {
            priceFilter.$lte = parseFloat(filters.maxPrice);
          }
          filters.price = priceFilter;
          delete filters.minPrice;
          delete filters.maxPrice;
        }

        // Query with pagination
        const products = await Product.find(filters).skip(skip).limit(limit);
        const totalCount = await Product.countDocuments(filters);

        return {
          statusCode: 200,
          body: JSON.stringify({ products, totalCount, page, limit }),
        };
      }

      case 'POST': {
        // Parse the multipart form data using lambda-multipart-parser
        const result = await multipart.parse(event);

        // Ensure at least one file was uploaded
        if (!result.files || result.files.length === 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No files uploaded' }),
          };
        }
        // Enforce a maximum of 5 images
        if (result.files.length > 5) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Maximum 5 images allowed' }),
          };
        }
        // Upload each file to Cloudinary and collect the secure URLs
        const imageUrls = [];
        for (const file of result.files) {
          const fileBase64 = file.content.toString('base64');
          const dataUri = `data:${file.contentType};base64,${fileBase64}`;
          const uploadResult = await cloudinary.uploader.upload(dataUri);
          imageUrls.push(uploadResult.secure_url);
        }
        // Extract text fields from the parsed result
        const { name, price, description, category, brand } = result;
        const newProduct = new Product({
          name,
          price,
          description,
          category,
          brand,
          images: imageUrls,
        });
        await newProduct.save();
        return {
          statusCode: 201,
          body: JSON.stringify({ product: newProduct }),
        };
      }

      case 'PUT': {
        // Parse the multipart form data using lambda-multipart-parser
        const result = await multipart.parse(event);

        // Extract text fields; expected fields: id, name, price, description, existingImages
        const { id, name, price, description, existingImages, category } = result;
        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Product ID is required' }),
          };
        }

        // Determine the array of existing image URLs
        let existingImagesArray = [];
        if (existingImages) {
          try {
            // existingImages may be sent as a JSON string
            existingImagesArray = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
          } catch (err) {
            existingImagesArray = [];
          }
        }

        // Process new image files (if any)
        const newImageUrls = [];
        if (result.files && result.files.length > 0) {
          // Enforce a maximum of 5 images total
          if (existingImagesArray.length + result.files.length > 5) {
            return {
              statusCode: 400,
              body: JSON.stringify({ error: 'Maximum 5 images allowed' }),
            };
          }
          for (const file of result.files) {
            const fileBase64 = file.content.toString('base64');
            const dataUri = `data:${file.contentType};base64,${fileBase64}`;
            const uploadResult = await cloudinary.uploader.upload(dataUri);
            newImageUrls.push(uploadResult.secure_url);
          }
        }

        // Merge existing images with new uploads
        const mergedImages = [...existingImagesArray, ...newImageUrls];

        // Build the update data object with text fields and merged images array
        const updateData = {
          name,
          price,
          description,
          category,
          images: mergedImages
        };

        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedProduct) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Product not found' }),
          };
        }

        return {
          statusCode: 200,
          body: JSON.stringify({ product: updatedProduct }),
        };
      }

      case 'DELETE': {
        // Delete a product; expect product id as query parameter: /?id=...
        const id = event.queryStringParameters && event.queryStringParameters.id;
        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Product ID is required' }),
          };
        }
        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Product not found' }),
          };
        }
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Product deleted successfully' }),
        };
      }

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Products CRUD error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

exports.handler = withCors(handler);
