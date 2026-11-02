import mongoose, { Schema, models } from "mongoose";

export interface IUser {
  email: string;
  name: string;
  image: string;
  password?: string;
  region?: string;
  lastLoginCity?: string;
  lastLoginCountry?: string;
  lastLoginRegion?: string;
  emailConsent?: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    password: { type: String },
    region: { type: String, default: "" },
    lastLoginCity: { type: String, default: "" },
    lastLoginCountry: { type: String, default: "" },
    lastLoginRegion: { type: String, default: "" },
    emailConsent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = models.User || mongoose.model<IUser>("User", UserSchema);
