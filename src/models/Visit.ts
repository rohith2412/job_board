import mongoose, { Schema, models } from "mongoose";

export interface IVisit {
  path: string;
  country: string;
  city: string;
  region: string;
  ip: string;
  userAgent: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  // Only set for visitors who accepted cookies: identifies returning visitors and sessions.
  visitorId?: string;
  sessionId?: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device?: "mobile" | "tablet" | "desktop";
  browser?: string;
  os?: string;
  language?: string;
  timezone?: string;
  durationMs?: number;
  // Visits by the site owner (any device that has opened /admin) are excluded from analytics.
  internal?: boolean;
  // false until the page sees real input (tap, mouse, key); visits stored before this field existed have none.
  human?: boolean;
  createdAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    path: { type: String, required: true },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    region: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    userId: { type: String },
    userName: { type: String },
    userEmail: { type: String },
    visitorId: { type: String },
    sessionId: { type: String },
    referrerHost: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    device: { type: String, enum: ["mobile", "tablet", "desktop"] },
    browser: { type: String },
    os: { type: String },
    language: { type: String },
    timezone: { type: String },
    durationMs: { type: Number },
    internal: { type: Boolean },
    human: { type: Boolean },
  },
  { timestamps: true }
);

VisitSchema.index({ userEmail: 1, createdAt: -1 });
VisitSchema.index({ createdAt: -1 });
VisitSchema.index({ visitorId: 1, createdAt: 1 });
VisitSchema.index({ sessionId: 1 });

export const Visit =
  models.Visit || mongoose.model<IVisit>("Visit", VisitSchema);
