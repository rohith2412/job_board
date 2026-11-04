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
  },
  { timestamps: true }
);

VisitSchema.index({ userEmail: 1, createdAt: -1 });

export const Visit =
  models.Visit || mongoose.model<IVisit>("Visit", VisitSchema);
