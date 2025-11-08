import mongoose from "mongoose";

const donationRequestedSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  reason: { type: String, required: true },
  type: { type: String, enum: ['request'], default: 'request' },
  category: { type: String, required: true },
  image: { type: String },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  useremail: { type: String, required: true },
  donorname: { type: String, default: 'anonymous' },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

// Use existing model if already compiled to avoid OverwriteModelError
const DonationRequest = mongoose.models.DonationRequest || mongoose.model("DonationRequest", donationRequestedSchema);

export default DonationRequest;
