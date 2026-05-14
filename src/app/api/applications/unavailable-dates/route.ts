import { NextResponse } from "next/server";
import { getTodayVisitDateString, getUnavailableVisitDates } from "@/server/airtableApplications";

export async function GET() {
  try {
    const result = await getUnavailableVisitDates();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      unavailableDates: result.unavailableDates,
      today: getTodayVisitDateString(),
    });
  } catch {
    return NextResponse.json({ error: "Unable to load visit date availability." }, { status: 500 });
  }
}
