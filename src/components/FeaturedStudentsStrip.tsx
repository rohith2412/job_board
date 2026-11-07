import Link from "next/link";
import FeaturedStudentsRow from "@/components/FeaturedStudentsRow";
import { getLiveFeaturedStudents } from "@/lib/featured";

export default async function FeaturedStudentsStrip() {
  const students = await getLiveFeaturedStudents();
  if (students.length === 0) return null;

  return (
    <section id="featured-students" aria-labelledby="featured-students-heading" className="scroll-mt-20 px-6 pt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="featured-students-heading" className="text-lg font-bold text-gray-900">
          Star students
        </h2>
        <Link href="/featured" className="shrink-0 text-sm font-semibold text-green-700 hover:text-green-800">
          Get featured now →
        </Link>
      </div>
      <p className="mt-0.5 text-sm text-gray-500">Standout students open to SWE roles right now.</p>

      <FeaturedStudentsRow students={students} />
    </section>
  );
}
