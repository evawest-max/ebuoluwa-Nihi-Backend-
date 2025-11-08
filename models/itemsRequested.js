import mongoose from "mongoose";
const itemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['donation', 'sale', 'request'],
    required: true,
  },
  image: {
    type: String,
  },
  location: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available',
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;