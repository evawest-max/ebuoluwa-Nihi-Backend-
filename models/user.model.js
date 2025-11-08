// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    amountDonated: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    accountType: {
      type: String,
      enum: ["individual", "organisation", "government"],
      default: "individual",
    },
    state: { type: String },
    lga: { type: String },
    logo: { type: String },
    phone: { type: String },
    bio: { type: String },
    emailNofication: { type: Boolean, default: true },
    pushNotification: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    idType: { type: String },
    idNumber: { type: String },
    bvn: { type: String },
    idDocument: { type: String },
    selfieDocument: { type: String },

    suspended: { type: Boolean, default: false },
    activityLog: [String],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);