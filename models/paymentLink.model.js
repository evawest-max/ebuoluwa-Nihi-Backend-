import mongoose from "mongoose";

const paymentLinkSchema = new mongoose.Schema({
  paymentLink: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PaymentLink", paymentLinkSchema);
