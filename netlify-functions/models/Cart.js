const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const CartSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  items: [CartItemSchema],
  itemCount: { type: Number, default: 0 }  // New field for total product count
}, { timestamps: true });

module.exports = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
