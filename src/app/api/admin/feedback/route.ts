import { NextResponse } from "next/server";
import { validateAdminSession } from "@/server/adminAuth";
import { getAllFeedback, type FeedbackStatus } from "@/server/airtableFeedback";

export async function GET(request: Request) {
  const auth = await validateAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  const validStatuses: FeedbackStatus[] = ["Pending", "Approved", "Rejected"];
  const statusFilter = validStatuses.includes(statusParam as FeedbackStatus)
    ? (statusParam as FeedbackStatus)
    : undefined;

  try {
    const result = await getAllFeedback(statusFilter);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ feedback: result.feedback });
  } catch {
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
  }
}
