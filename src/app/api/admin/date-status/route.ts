import { NextResponse } from "next/server";
import { validateAdminSession } from "@/server/adminAuth";
import { getVisitDateCounts, getTodayVisitDateString } from "@/server/airtableApplications";
import { getBlockedDates } from "@/server/larkBlockedDates";

export async function GET() {
  const auth = await validateAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const [countsResult, blockedResult] = await Promise.all([
      getVisitDateCounts(),
      getBlockedDates(),
    ]);

    if (!countsResult.ok) {
      return NextResponse.json({ error: countsResult.error }, { status: countsResult.status });
    }

    if (!blockedResult.ok) {
      console.error("[date-status] BlockedDates fetch failed:", blockedResult.error);
    }

    return NextResponse.json({
      dateCounts: countsResult.dateCounts,
      maxPerDate: countsResult.maxPerDate,
      blockedDates: blockedResult.ok ? blockedResult.blockedDates : [],
      today: getTodayVisitDateString(),
    });
  } catch (e) {
    console.error("[date-status] Unexpected error:", e);
    return NextResponse.json({ error: "Failed to fetch date status." }, { status: 500 });
  }
}
