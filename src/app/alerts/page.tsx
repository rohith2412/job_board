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
      <div className="mx-auto max-w-xl px-6 py-12">
        <Suspense>
          <AlertsManager />
        </Suspense>
      </div>
    </main>
  );
}
