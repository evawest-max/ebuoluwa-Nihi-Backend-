import mongoose from "mongoose";

const FinancialDonationPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reference: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  email: {
    type: String,
    required: true,
  },
  items: [mongoose.Schema.Types.Mixed],
  paidAt: { type: Date },
  metadata: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Financial Donation Payments", FinancialDonationPaymentSchema);
