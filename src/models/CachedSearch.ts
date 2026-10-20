import mongoose, { Schema, models } from "mongoose";

interface JobData {
  title: string;
  company: string;
  location: string;
  snippet: string;
  link: string;
  salary: string;
  source: string;
}

export interface ICachedSearch {
  key: string;
  jobs: JobData[];
  createdAt: Date;
}

const CachedSearchSchema = new Schema<ICachedSearch>(
  {
    key: { type: String, required: true, unique: true },
    jobs: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

CachedSearchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

export const CachedSearch =
  models.CachedSearch ||
  mongoose.model<ICachedSearch>("CachedSearch", CachedSearchSchema);
