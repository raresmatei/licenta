// netlify-functions/models/Product.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }], // Updated to store multiple images
  description: { type: String },
}, { timestamps: true });


module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
