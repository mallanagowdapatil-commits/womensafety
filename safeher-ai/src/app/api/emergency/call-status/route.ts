import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { CallStatus, EmergencyCallRecord } from "../call/route";

export async function POST(req: Request) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      try {
        body = await req.json();
      } catch {
        // fallback
      }
    }

    const {
      CallSid,
      Status,
      RecordingUrl,
      Duration,
      StartTime,
      EndTime,
      Cause,
    } = body;

    if (!CallSid) {
      return NextResponse.json({ error: "Missing CallSid in callback" }, { status: 400 });
    }

    // Map Exotel callback status to standard 7 CallStatus values
    let mappedStatus: CallStatus = "Initiated";
    const rawStatus = (Status || "").toLowerCase();

    if (rawStatus === "ringing") {
      mappedStatus = "Ringing";
    } else if (rawStatus === "in-progress" || rawStatus === "answered") {
      mappedStatus = "Answered";
    } else if (rawStatus === "completed") {
      mappedStatus = "Completed";
    } else if (rawStatus === "busy") {
      mappedStatus = "Busy";
    } else if (rawStatus === "no-answer") {
      mappedStatus = "No Answer";
    } else if (rawStatus === "failed" || rawStatus === "canceled") {
      mappedStatus = "Failed";
    }

    const durationSeconds = Duration ? parseInt(Duration, 10) : 0;

    // Update in-memory cache if present
    if (globalThis.__safeher_calls) {
      const existing = globalThis.__safeher_calls.find((c) => c.call_sid === CallSid);
      if (existing) {
        existing.call_status = mappedStatus;
        if (durationSeconds) existing.duration_seconds = durationSeconds;
        existing.updated_at = new Date().toISOString();
      }
    }

    // Update Supabase emergency_calls table
    try {
      const supabase = await createClient();
      await supabase
        .from("emergency_calls")
        .update({
          call_status: mappedStatus,
          duration_seconds: durationSeconds,
          recording_url: RecordingUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("call_sid", CallSid);
    } catch {
      // fallback
    }

    return NextResponse.json({
      success: true,
      call_sid: CallSid,
      call_status: mappedStatus,
      duration: durationSeconds,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sid = searchParams.get("call_sid");

  if (!sid) {
    return NextResponse.json({ error: "call_sid query parameter is required" }, { status: 400 });
  }

  const existing = (globalThis.__safeher_calls || []).find((c) => c.call_sid === sid);
  return NextResponse.json({
    success: true,
    call: existing || null,
    status: existing?.call_status || "Initiated",
  });
}

