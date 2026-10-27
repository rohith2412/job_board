import type { Metadata } from "next";
import { Suspense } from "react";
import AlertsManager from "@/components/AlertsManager";

export const metadata: Metadata = {
  title: "Premium Job Alerts | Reblet",
  description: "Get daily personalized software engineering job alerts delivered to your inbox for $4.99/month.",
};

export default function AlertsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-6 pt-8 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Premium Job Alerts</h1>
          <p className="text-gray-500">We email you 5 personalized SWE jobs every morning</p>
        </div>
        <Suspense>
          <AlertsManager />
        </Suspense>
      </div>
    </main>
  );
}
