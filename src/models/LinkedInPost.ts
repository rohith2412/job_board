import mongoose, { Schema, models } from "mongoose";

export const POST_KINDS = ["spotlight", "roundup", "popular", "blog", "student", "custom"] as const;
export type PostKind = (typeof POST_KINDS)[number];

export interface ILinkedInPost {
  content: string;
  profile: "personal1" | "personal2";
  status: "draft" | "scheduled" | "publishing" | "posted" | "failed";
  jobSlugs: string[];
  // What the post is about; ref names the blog slug or featured student it shares.
  kind?: PostKind;
  ref?: string;
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
    kind: { type: String, enum: POST_KINDS },
    ref: { type: String },
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
