import mongoose, { Schema, models } from "mongoose";

export interface IVisit {
  path: string;
  country: string;
  city: string;
  region: string;
  ip: string;
  userAgent: string;
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
  },
  { timestamps: true }
);

export const Visit =
  models.Visit || mongoose.model<IVisit>("Visit", VisitSchema);
