import mongoose, { Schema, models } from "mongoose";

export interface ILinkedInPost {
  content: string;
  profile: "personal1" | "personal2";
  status: "draft" | "scheduled" | "publishing" | "posted" | "failed";
  jobSlugs: string[];
  scheduledFor?: Date;
  postedAt?: Date;
  lastError?: string;
  publishedUrns?: string[];
  createdAt: Date;
}

const LinkedInPostSchema = new Schema<ILinkedInPost>(
  {
    content: { type: String, required: true },
    profile: {
      type: String,
      enum: ["personal1", "personal2"],
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "publishing", "posted", "failed"],
      default: "draft",
    },
    jobSlugs: [{ type: String }],
    scheduledFor: { type: Date },
    postedAt: { type: Date },
    lastError: { type: String },
    publishedUrns: [{ type: String }],
  },
  { timestamps: true }
);

export const LinkedInPost =
  models.LinkedInPost ||
  mongoose.model<ILinkedInPost>("LinkedInPost", LinkedInPostSchema);
