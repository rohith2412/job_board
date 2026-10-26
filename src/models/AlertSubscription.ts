import mongoose from "mongoose";

const alertSubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  status: {
    type: String,
    enum: ["active", "cancelled", "past_due", "incomplete"],
    default: "incomplete",
  },
  preferences: {
    keywords: { type: [String], default: [] },
    location: { type: String, default: "" },
    remote: { type: Boolean, default: false },
  },
  lastSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const AlertSubscription =
  mongoose.models.AlertSubscription ||
  mongoose.model("AlertSubscription", alertSubscriptionSchema);
