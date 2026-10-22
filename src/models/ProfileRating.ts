import mongoose, { Schema, models } from "mongoose";

export interface IProfileRating {
  userEmail: string;
  github?: string;
  linkedin?: string;
  otherLinks?: string[];
  bio?: string;
  score: number;
  grade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  tip: string;
  ratedAt: Date;
}

const ProfileRatingSchema = new Schema<IProfileRating>({
  userEmail: { type: String, required: true, index: true },
  github: String,
  linkedin: String,
  otherLinks: [String],
  bio: String,
  score: { type: Number, required: true },
  grade: { type: String, required: true },
  summary: { type: String, required: true },
  strengths: [String],
  improvements: [String],
  tip: { type: String, required: true },
  ratedAt: { type: Date, default: Date.now },
});

export const ProfileRating =
  models.ProfileRating ||
  mongoose.model<IProfileRating>("ProfileRating", ProfileRatingSchema);
