import mongoose, { Schema, models } from "mongoose";

export interface ISavedJob {
  slug: string;
  title: string;
  company: string;
  location: string;
  snippet: string;
  link: string;
  salary: string;
  source: string;
  featured: boolean;
  experienceType: string;
  description: string;
  applyUrl: string;
  postedByEmail: string;
  createdAt: Date;
}

const SavedJobSchema = new Schema<ISavedJob>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    company: { type: String, default: "" },
    location: { type: String, default: "" },
    snippet: { type: String, default: "" },
    link: { type: String, required: true, unique: true },
    salary: { type: String, default: "" },
    source: { type: String, required: true },
    featured: { type: Boolean, default: false },
    experienceType: { type: String, default: "Full-time" },
    description: { type: String, default: "" },
    applyUrl: { type: String, default: "" },
    postedByEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

export const SavedJob =
  models.SavedJob || mongoose.model<ISavedJob>("SavedJob", SavedJobSchema);
