import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  itemCategory: { type: String, required: true }, // clothing, electronics, furniture, etc.
  transactionType: { type: String, enum: ["donation", "sale", "request"], required: true },
  images: [String],
  price: { type: Number, default: 0 },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approved: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  urgency: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low",
  },
  contactInfo: {
    type: String,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
    },
  },
  status: {
    type: String,
      enum: ["available", "fulfilled", "pending"],
      default: "pending",
    },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export default mongoose.model("Item", itemSchema);  

// itemSchema.index({ location: "2dsphere" });