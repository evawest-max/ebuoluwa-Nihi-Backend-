import mongoose from "mongoose";

const proofOfPaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    proofUrl: { type: String, required: true }, // Pinata URL
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProofOfPayment", proofOfPaymentSchema);
