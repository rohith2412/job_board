"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

const ADMIN_EMAIL = "rohithra75@gmail.com";

interface User {
  email: string;
  name: string;
  image: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    fetch("/api/admin/users")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load users");
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-800 mb-2">Access Denied</p>
          <p className="text-sm text-gray-500">You don&apos;t have permission to view this page.</p>
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
      <div className="mx-auto max-w-2xl flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <span className="text-xs text-gray-400">{users.length} users</span>
        </div>

        <div className="px-6 py-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Registered Users
          </h2>

          {users.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No users yet</p>
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
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
