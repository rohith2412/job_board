import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Visit } from "@/models/Visit";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const excludeSelf = { $nor: [{ city: /Sudbury/i, country: "CA" }] };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalVisits, todayVisits, weekVisits, monthVisits] = await Promise.all([
    Visit.countDocuments(excludeSelf),
    Visit.countDocuments({ createdAt: { $gte: today }, ...excludeSelf }),
    Visit.countDocuments({ createdAt: { $gte: weekAgo }, ...excludeSelf }),
    Visit.countDocuments({ createdAt: { $gte: monthAgo }, ...excludeSelf }),
  ]);

  const topPages = await Visit.aggregate([
    { $match: excludeSelf },
    { $group: { _id: "$path", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const topLocations = await Visit.aggregate([
    { $match: { country: { $ne: "" }, ...excludeSelf } },
    {
      $group: {
        _id: { country: "$country", city: "$city" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 15 },
  ]);

  const dailyVisits = await Visit.aggregate([
    {
      $match: { createdAt: { $gte: monthAgo }, ...excludeSelf },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const uniqueVisitors = await Visit.distinct("ip", {
    ip: { $ne: "" },
    ...excludeSelf,
  });

  return NextResponse.json({
    totalVisits,
    todayVisits,
    weekVisits,
    monthVisits,
    uniqueVisitors: uniqueVisitors.length,
    topPages,
    topLocations,
    dailyVisits,
  });
}
