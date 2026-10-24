import mongoose, { Schema, models } from "mongoose";

export interface ICompany {
  name: string;
  logo: string;
  description: string;
  location: string;
  website: string;
  userEmail: string;
  createdAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    logo: { type: String, default: "" },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    userEmail: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Company =
  models.Company || mongoose.model<ICompany>("Company", CompanySchema);
