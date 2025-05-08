const mongoose = require('mongoose');
const Cart = require('./models/Cart');
require('dotenv').config();

let isConnected;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    isConnected = db.connections[0].readyState;

    Cart.syncIndexes()
      .then(() => console.log('Indexes are in sync'))
      .catch(console.error);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

module.exports = connectToDatabase;
