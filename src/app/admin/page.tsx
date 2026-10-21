"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ADMIN_EMAIL = "rohithra75@gmail.com";

interface User {
  email: string;
  name: string;
  image: string;
  region?: string;
  createdAt: string;
}

const REGION_LABELS: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  CH: "Switzerland",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
  IN: "India",
  OTHER: "Other",
};

interface Analytics {
  totalVisits: number;
  todayVisits: number;
  weekVisits: number;
  monthVisits: number;
  uniqueVisitors: number;
  topPages: { _id: string; count: number }[];
  topLocations: { _id: { country: string; city: string }; count: number }[];
  dailyVisits: { _id: string; count: number }[];
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 flex-1 min-w-[120px]">
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IN: "India",
  AU: "Australia",
  JP: "Japan",
  BR: "Brazil",
  NL: "Netherlands",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<"users" | "analytics">("analytics");
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/admin/users").then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch("/api/admin/analytics").then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
    ])
      .then(([userData, analyticsData]) => {
        setUsers(userData.users || []);
        setAnalytics(analyticsData);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load data");
        setLoading(false);
      });
  }, [status, isAdmin]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </p>
          <p className="text-sm text-gray-500">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab("analytics")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer ${
              tab === "analytics"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer ${
              tab === "users"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Users ({users.length})
          </button>
        </div>

        {tab === "analytics" && analytics && (
          <div className="px-6 py-6 flex flex-col gap-6">
            <div className="flex flex-wrap gap-3">
              <StatCard label="Today" value={analytics.todayVisits} />
              <StatCard label="This Week" value={analytics.weekVisits} />
              <StatCard label="This Month" value={analytics.monthVisits} />
              <StatCard label="All Time" value={analytics.totalVisits} sub={`${analytics.uniqueVisitors} unique`} />
            </div>

            {analytics.dailyVisits.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Daily Visits (Last 30 Days)
                </h2>
                <div className="flex items-end gap-[3px] h-28 p-4 rounded-xl bg-gray-50">
                  {analytics.dailyVisits.map((day) => {
                    const max = Math.max(
                      ...analytics.dailyVisits.map((d) => d.count)
                    );
                    const height = max > 0 ? (day.count / max) * 100 : 0;
                    return (
                      <div
                        key={day._id}
                        className="flex-1 bg-gray-900 rounded-sm min-h-[2px] group relative"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day._id}: ${day.count} visits`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {day._id.slice(5)}: {day.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Top Pages
              </h2>
              <div className="flex flex-col gap-1.5">
                {analytics.topPages.map((page) => (
                  <div
                    key={page._id}
                    className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-gray-50"
                  >
                    <span className="text-sm text-gray-700 font-mono truncate mr-4">
                      {page._id}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {page.count}
                    </span>
                  </div>
                ))}
                {analytics.topPages.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    No page views yet
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Visitor Locations
              </h2>
              <div className="flex flex-col gap-1.5">
                {analytics.topLocations.map((loc, i) => {
                  const country =
                    COUNTRY_NAMES[loc._id.country] || loc._id.country;
                  const label = loc._id.city
                    ? `${loc._id.city}, ${country}`
                    : country || "Unknown";
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-gray-50"
                    >
                      <span className="text-sm text-gray-700 truncate mr-4">
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {loc.count}
                      </span>
                    </div>
                  );
                })}
                {analytics.topLocations.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    No location data yet (available on Vercel)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="px-6 py-6">
            {users.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                No users yet
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {users.map((user, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                        {user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {user.region && (
                        <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {REGION_LABELS[user.region] || user.region}
                        </span>
                      )}
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
