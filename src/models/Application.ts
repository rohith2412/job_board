import mongoose, { Schema, models } from "mongoose";

export interface IApplication {
  jobSlug: string;
  jobTitle: string;
  companyEmail: string;
  applicantName: string;
  applicantEmail: string;
  resumeUrl: string;
  note: string;
  createdAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobSlug: { type: String, required: true },
    jobTitle: { type: String, required: true },
    companyEmail: { type: String, default: "" },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    resumeUrl: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Application =
  models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);
