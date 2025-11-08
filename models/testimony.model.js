import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imageURL: { type: String, required: true },
  message: { type: String, required: true },
  approved: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Testimony", testSchema);