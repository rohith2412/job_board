import mongoose, { Schema, models } from "mongoose";

export interface IFeaturedStudent {
  email: string;
  name: string;
  school: string;
  gradYear: string;
  headline: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  resume?: string;
  portfolio?: string;
  links?: string[];
  image?: string;
  active: boolean;
  stripeSessionId?: string;
  paidAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const FeaturedStudentSchema = new Schema<IFeaturedStudent>(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    school: { type: String, required: true },
    gradYear: { type: String, required: true },
    headline: { type: String, required: true },
    skills: [{ type: String }],
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    resume: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    links: [{ type: String }],
    image: { type: String, default: "" },
    active: { type: Boolean, default: false },
    stripeSessionId: { type: String, default: "" },
    paidAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export const FeaturedStudent =
  models.FeaturedStudent ||
  mongoose.model<IFeaturedStudent>("FeaturedStudent", FeaturedStudentSchema);
