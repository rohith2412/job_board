import mongoose, { Schema, models } from "mongoose";

// Logos for companies whose jobs come from public job feeds (employers who post directly use Company.logo).
export interface ICompanyLogo {
  name: string;
  domain: string;
  logo: string;
}

const CompanyLogoSchema = new Schema<ICompanyLogo>(
  {
    name: { type: String, required: true, unique: true },
    domain: { type: String, required: true },
    logo: { type: String, required: true },
  },
  { timestamps: true }
);

export const CompanyLogo = models.CompanyLogo || mongoose.model<ICompanyLogo>("CompanyLogo", CompanyLogoSchema);
