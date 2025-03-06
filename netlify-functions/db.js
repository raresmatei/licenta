// netlify-functions/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Loads environment variables from .env

// Optional: Prevent creating multiple connections in a serverless environment
let isConnected;

const connectToDatabase = async () => {
  if (isConnected) {
    // Use existing database connection
    return;
  }
  
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    isConnected = db.connections[0].readyState;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

module.exports = connectToDatabase;
