import mongoose, { Schema, models } from "mongoose";

export interface IUser {
  email: string;
  name: string;
  image: string;
  region?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    region: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User = models.User || mongoose.model<IUser>("User", UserSchema);
