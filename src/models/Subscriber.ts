import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  unsubscribeToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Subscriber =
  mongoose.models.Subscriber || mongoose.model("Subscriber", subscriberSchema);
