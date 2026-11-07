import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getLiveFeaturedStudents } from "@/lib/featured";

export async function GET() {
  await connection();
  const students = await getLiveFeaturedStudents();
  return NextResponse.json(
    { students },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
