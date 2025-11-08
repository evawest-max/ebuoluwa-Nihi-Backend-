// models/RequestItem.js
import mongoose from "mongoose";

const requestItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // reason: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    location: {
      type: String,
      required: true,
    },
    contactInfo: {
      type: String,
    },
    // image: {
    //   type: String,
    //   default: null,
    // },
    status: {
      type: String,
      enum: ["available", "fulfilled", "pending"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const RequestItem = mongoose.model("RequestItem", requestItemSchema);
export default RequestItem;
