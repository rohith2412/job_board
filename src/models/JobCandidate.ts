import mongoose, { Schema, models } from "mongoose";

// A role found in a company's public job feed, waiting for the admin to approve it onto Reblet.
export interface IJobCandidate {
  key: string;
  ats: "greenhouse" | "lever" | "ashby" | "smartrecruiters";
  token: string;
  company: string;
  title: string;
  location: string;
  applyUrl: string;
  description: string;
  salary: string;
  postedAt?: Date;
  status: "pending" | "approved" | "rejected";
  jobSlug?: string;
  closed: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

const JobCandidateSchema = new Schema<IJobCandidate>(
  {
    key: { type: String, required: true, unique: true },
    ats: { type: String, enum: ["greenhouse", "lever", "ashby", "smartrecruiters"], required: true },
    token: { type: String, required: true },
    company: { type: String, required: true },
    title: { type: String, required: true },
    location: { type: String, default: "" },
    applyUrl: { type: String, required: true },
    description: { type: String, default: "" },
    salary: { type: String, default: "" },
    postedAt: { type: Date },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    jobSlug: { type: String },
    closed: { type: Boolean, default: false },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

JobCandidateSchema.index({ status: 1, firstSeenAt: -1 });

export const JobCandidate =
  models.JobCandidate || mongoose.model<IJobCandidate>("JobCandidate", JobCandidateSchema);
