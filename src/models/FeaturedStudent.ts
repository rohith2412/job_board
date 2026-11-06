import mongoose, { Schema, models } from "mongoose";
import { HIGHLIGHT_KINDS, type Highlight } from "@/lib/highlights";

export interface IFeaturedStudent {
  email: string;
  name: string;
  school: string;
  gradYear: string;
  headline: string;
  highlights: Highlight[];
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
    school: { type: String, default: "" },
    gradYear: { type: String, default: "" },
    headline: { type: String, default: "" },
    highlights: [
      {
        _id: false,
        kind: { type: String, enum: HIGHLIGHT_KINDS.map((k) => k.value), required: true },
        text: { type: String, required: true },
      },
    ],
    skills: [{ type: String }],
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    resume: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    links: [{ type: String }],
    image: { type: String, default: "" },
    active: { type: Boolean, default: false },
    stripeSessionId: { type: String, unique: true, sparse: true },
    paidAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export const FeaturedStudent =
  models.FeaturedStudent ||
  mongoose.model<IFeaturedStudent>("FeaturedStudent", FeaturedStudentSchema);
