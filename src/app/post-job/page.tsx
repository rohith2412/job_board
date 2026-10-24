"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Step = "loading" | "company" | "dashboard" | "job" | "edit" | "success";

interface PostedJob {
  _id: string;
  slug: string;
  title: string;
  location: string;
  salary: string;
  experienceType: string;
  description: string;
  applyUrl: string;
  featured: boolean;
  applicationCount: number;
  createdAt: string;
}

interface AppEntry {
  _id: string;
  jobSlug: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  resumeUrl: string;
  note: string;
  createdAt: string;
}

export default function PostJobPage() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState<Step>("loading");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [postedJobs, setPostedJobs] = useState<PostedJob[]>([]);
  const [applications, setApplications] = useState<AppEntry[]>([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [companyExists, setCompanyExists] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [applyUrl, setApplyUrl] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [editSlug, setEditSlug] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setStep("loading");
      return;
    }
    fetch("/api/company")
      .then((r) => r.json())
      .then((data) => {
        if (data.company) {
          setCompanyName(data.company.name);
          setCompanyLogo(data.company.logo || "");
          setCompanyDesc(data.company.description || "");
          setCompanyLocation(data.company.location || "");
          setCompanyWebsite(data.company.website || "");
          setCompanyExists(true);
          loadDashboard();
        } else {
          setStep("company");
        }
      })
      .catch(() => setStep("company"));
  }, [session, status]);

  async function loadDashboard() {
    setDashLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch("/api/company/jobs"),
        fetch("/api/company/applications"),
      ]);
      const jobsData = await jobsRes.json();
      const appsData = await appsRes.json();
      setPostedJobs(jobsData.jobs || []);
      setApplications(appsData.applications || []);
    } catch {}
    setDashLoading(false);
    setStep("dashboard");
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "logos");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        setCompanyLogo(data.url);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          logo: companyLogo,
          description: companyDesc,
          location: companyLocation,
          website: companyWebsite,
        }),
      });
      const data = await res.json();
      if (data.company) {
        loadDashboard();
      } else {
        alert(data.error || "Failed to save company");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleJobSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle?.trim() || !jobDesc?.trim()) return;
    setSaving(true);
    try {
      if (editSlug) {
        const res = await fetch("/api/company/jobs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: editSlug,
            title: jobTitle,
            description: jobDesc,
            location: jobLocation,
            salary: jobSalary,
            experienceType: jobType,
            applyUrl,
          }),
        });
        const data = await res.json();
        if (data.job) {
          setEditSlug("");
          loadDashboard();
        } else {
          alert(data.error || "Failed to update job");
        }
      } else {
        const res = await fetch("/api/jobs/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: jobTitle,
            description: jobDesc,
            location: jobLocation,
            salary: jobSalary,
            experienceType: jobType,
            applyUrl,
          }),
        });
        const data = await res.json();
        if (data.job) {
          setCreatedSlug(data.job.slug);
          setStep("success");
        } else {
          alert(data.error || "Failed to post job");
        }
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(job: PostedJob) {
    setEditSlug(job.slug);
    setJobTitle(job.title);
    setJobDesc(job.description || "");
    setJobLocation(job.location || "");
    setJobSalary(job.salary || "");
    setJobType(job.experienceType || "Full-time");
    setApplyUrl(job.applyUrl || "");
    setStep("edit");
  }

  function startNewJob() {
    setEditSlug("");
    setJobTitle("");
    setJobDesc("");
    setJobLocation("");
    setJobSalary("");
    setJobType("Full-time");
    setApplyUrl("");
    setStep("job");
  }

  async function toggleJobVisibility(job: PostedJob) {
    await fetch("/api/company/jobs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: job.slug, featured: !job.featured }),
    });
    loadDashboard();
  }

  if (status === "loading" || step === "loading") {
    if (!session && status !== "loading") {
      return (
        <main className="min-h-screen bg-white">
          <div className="mx-auto max-w-xl flex flex-col min-h-screen px-6">
            <nav className="py-5">
              <Link
                href="/"
                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                &larr; Back
              </Link>
            </nav>
            <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-800 mb-2">Sign in to post a job</h1>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">Create a company profile and start hiring on Reblet.</p>
              <button onClick={() => signIn("google")} className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity">
                <img src="/google-signin-button.svg" alt="Sign in with Google" className="h-[40px]" />
              </button>
            </div>
          </div>
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl flex flex-col min-h-screen px-6">
        <nav className="flex items-center justify-between py-5">
          <Link
            href={step === "dashboard" ? "/profile" : ""}
            onClick={(e) => {
              if (step !== "dashboard" && step !== "company") {
                e.preventDefault();
                loadDashboard();
              }
            }}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            &larr; {step === "dashboard" || step === "company" ? "Back" : "Dashboard"}
          </Link>
          {(step === "job" || step === "edit") && (
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {step === "edit" ? "Edit Job" : "New Job"}
            </span>
          )}
        </nav>

        {step === "company" && (
          <form onSubmit={handleCompanySubmit} className="flex-1 flex flex-col gap-6 py-4 max-w-xl mx-auto w-full">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{companyExists ? "Edit company profile" : "Set up your company"}</h1>
              <p className="text-sm text-gray-500 mt-1">{companyExists ? "Update your company details visible to candidates." : "Tell candidates about your company before posting a job."}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Company Name <span className="text-red-400">*</span></label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Inc." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Company Logo</label>
              <div className="flex items-center gap-4">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo preview" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploading} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors cursor-pointer disabled:opacity-50">
                  {uploading ? "Uploading..." : companyLogo ? "Change" : "Upload"}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea value={companyDesc} onChange={(e) => setCompanyDesc(e.target.value)} placeholder="What does your company do?" rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <input type="text" value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} placeholder="e.g. San Francisco, CA" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Website</label>
              <input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://yourcompany.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
            </div>

            <button type="submit" disabled={saving || !companyName.trim()} className="mt-4 w-full py-3.5 rounded-full text-black text-base font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer">
              {saving ? "Saving..." : companyExists ? "Save Changes" : "Continue"}
            </button>
          </form>
        )}

        {step === "dashboard" && (
          <div className="flex-1 flex flex-col gap-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {companyLogo && (
                  <img src={companyLogo} alt={companyName} className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Employer Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setStep("company")}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            </div>

            <button
              onClick={startNewJob}
              className="w-full py-3.5 rounded-full text-black text-base font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all cursor-pointer"
            >
              + Post a New Job
            </button>

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Your Jobs ({postedJobs.length})
              </h2>
              {dashLoading ? (
                <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
              ) : postedJobs.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No jobs posted yet. Post your first job above.</p>
              ) : (
                postedJobs.map((job) => (
                  <div key={job._id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link href={`/jobs/${job.slug}`} className="text-base font-semibold text-gray-900 hover:text-gray-600 transition-colors">
                          {job.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                          {job.location && <span>{job.location}</span>}
                          {job.salary && <span>{job.salary}</span>}
                          <span>{job.experienceType}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${job.featured ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {job.featured ? "Live" : "Hidden"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                        {job.applicationCount} application{job.applicationCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-400">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => startEdit(job)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleJobVisibility(job)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                      >
                        {job.featured ? "Hide" : "Make Live"}
                      </button>
                      <Link
                        href={`/jobs/${job.slug}`}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {applications.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Applications ({applications.length})
                </h2>
                {applications.map((app) => (
                  <div key={app._id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{app.applicantName}</p>
                        <p className="text-xs text-gray-400">{app.applicantEmail}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Applied for <span className="font-medium text-gray-700">{app.jobTitle}</span>
                    </p>
                    {app.note && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mt-1">{app.note}</p>
                    )}
                    {app.resumeUrl && (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 mt-1 w-fit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download Resume
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(step === "job" || step === "edit") && (
          <form onSubmit={handleJobSubmit} className="flex-1 flex flex-col gap-6 py-4 max-w-xl mx-auto w-full">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {step === "edit" ? "Edit job" : "Post a job"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Posting as <span className="font-medium text-gray-700">{companyName}</span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Job Title <span className="text-red-400">*</span></label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Description <span className="text-red-400">*</span></label>
              <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Describe the role, responsibilities, and requirements..." rows={6} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <input type="text" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="e.g. Remote, New York" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Salary</label>
                <input type="text" value={jobSalary} onChange={(e) => setJobSalary(e.target.value)} placeholder="e.g. $120k - $180k" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Job Type</label>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                External Apply URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input type="url" value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="https://yourcompany.com/careers/apply" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
              <p className="text-xs text-gray-400">Redirect applicants to your website. Leave blank to collect applications on Reblet.</p>
            </div>

            <button type="submit" disabled={saving || !jobTitle?.trim() || !jobDesc?.trim()} className="mt-4 w-full py-3.5 rounded-full text-black text-base font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer">
              {saving ? "Saving..." : step === "edit" ? "Save Changes" : "Post Job"}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-20 gap-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job posted!</h1>
              <p className="text-sm text-gray-500 mt-2">Your job listing is now live on Reblet.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <Link href={`/jobs/${createdSlug}`} className="flex-1 py-3 rounded-full text-center text-black text-sm font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all">
                View Listing
              </Link>
              <button
                onClick={() => loadDashboard()}
                className="flex-1 py-3 rounded-full text-center text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
