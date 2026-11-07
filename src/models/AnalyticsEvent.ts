import mongoose, { Schema, models } from "mongoose";

export type AnalyticsEventType = "apply_click";

export interface IAnalyticsEvent {
  type: AnalyticsEventType;
  path: string;
  jobSlug?: string;
  targetHost?: string;
  visitorId?: string;
  sessionId?: string;
  userEmail?: string;
  country?: string;
  internal?: boolean;
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    type: { type: String, enum: ["apply_click"], required: true },
    path: { type: String, required: true },
    jobSlug: { type: String },
    targetHost: { type: String },
    visitorId: { type: String },
    sessionId: { type: String },
    userEmail: { type: String },
    country: { type: String },
    internal: { type: Boolean },
  },
  { timestamps: true }
);

AnalyticsEventSchema.index({ type: 1, createdAt: -1 });
AnalyticsEventSchema.index({ jobSlug: 1 });

export const AnalyticsEvent =
  models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>("AnalyticsEvent", AnalyticsEventSchema);
