import { Suspense } from "react";
import ApplyForm from "@/components/ApplyForm";

export const instant = false;

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </main>
      }
    >
      <ApplyForm id={id} />
    </Suspense>
  );
}
