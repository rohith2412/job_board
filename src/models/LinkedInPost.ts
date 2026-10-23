import mongoose, { Schema, models } from "mongoose";

export interface ILinkedInPost {
  content: string;
  profile: "company" | "personal1" | "personal2";
  status: "draft" | "scheduled" | "posted";
  jobSlugs: string[];
  scheduledFor?: Date;
  postedAt?: Date;
  createdAt: Date;
}

const LinkedInPostSchema = new Schema<ILinkedInPost>(
  {
    content: { type: String, required: true },
    profile: {
      type: String,
      enum: ["company", "personal1", "personal2"],
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "posted"],
      default: "draft",
    },
    jobSlugs: [{ type: String }],
    scheduledFor: { type: Date },
    postedAt: { type: Date },
  },
  { timestamps: true }
);

export const LinkedInPost =
  models.LinkedInPost ||
  mongoose.model<ILinkedInPost>("LinkedInPost", LinkedInPostSchema);
