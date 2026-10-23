import mongoose, { Schema, models } from "mongoose";

export interface ILinkedInAccount {
  profileKey: "company" | "personal1" | "personal2";
  linkedinId: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  createdAt: Date;
}

const LinkedInAccountSchema = new Schema<ILinkedInAccount>(
  {
    profileKey: {
      type: String,
      enum: ["company", "personal1", "personal2"],
      required: true,
      unique: true,
    },
    linkedinId: { type: String, required: true },
    name: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const LinkedInAccount =
  models.LinkedInAccount ||
  mongoose.model<ILinkedInAccount>("LinkedInAccount", LinkedInAccountSchema);
