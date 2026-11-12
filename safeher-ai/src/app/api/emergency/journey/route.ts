import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export interface JourneyRecord {
  id: string;
  user_email: string;
  destination: string;
  destination_lat: number;
  destination_lng: number;
  start_latitude: number;
  start_longitude: number;
  current_latitude: number;
  current_longitude: number;
  mode: "walking" | "driving";
  distance_km: number;
  estimated_minutes: number;
  tracking_status: "active" | "completed" | "cancelled";
  shared_with: string[];
  created_at: string;
  updated_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __safeher_journeys: JourneyRecord[] | undefined;
}

if (!globalThis.__safeher_journeys) {
  globalThis.__safeher_journeys = [];
}

const journeyStore = globalThis.__safeher_journeys;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || "mallanagowdapatil866@gmail.com";

    // Try Supabase first
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("journey_tracking")
        .select("*")
        .eq("user_email", email)
        .eq("tracking_status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ success: true, active: true, journey: data });
      }
    } catch {
      // fallback
    }

    const active = journeyStore.find(
      (j) => j.user_email.toLowerCase() === email.toLowerCase() && j.tracking_status === "active"
    );

    return NextResponse.json({ success: true, active: Boolean(active), journey: active || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      user_email = "mallanagowdapatil866@gmail.com",
      destination = "RajaRajeswari Medical College & Hospital",
      destination_lat = 12.8898,
      destination_lng = 77.4632,
      start_latitude = 12.8895,
      start_longitude = 77.4655,
      current_latitude = 12.8895,
      current_longitude = 77.4655,
      mode = "walking",
      distance_km = 0.6,
      estimated_minutes = 8,
      shared_with = ["mallanagowdapatil866@gmail.com"],
    } = body;

    const id = "jrn_" + Date.now();
    const journey: JourneyRecord = {
      id,
      user_email,
      destination,
      destination_lat,
      destination_lng,
      start_latitude,
      start_longitude,
      current_latitude,
      current_longitude,
      mode,
      distance_km,
      estimated_minutes,
      tracking_status: "active",
      shared_with,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Close any previous active journey
    journeyStore.forEach((j) => {
      if (j.user_email === user_email && j.tracking_status === "active") {
        j.tracking_status = "completed";
      }
    });

    journeyStore.unshift(journey);

    // Save to Supabase
    try {
      const supabase = await createClient();
      await supabase.from("journey_tracking").insert([
        {
          id,
          user_email,
          destination,
          start_latitude,
          start_longitude,
          current_latitude,
          current_longitude,
          tracking_status: "active",
          shared_with,
        },
      ]);
    } catch {
      // fallback
    }

    return NextResponse.json({
      success: true,
      message: "Safe journey monitoring initialized. Location sharing active.",
      journey,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, action, latitude, longitude } = body;

    const target = journeyStore.find((j) => j.id === id);

    if (action === "update_location" && latitude && longitude) {
      if (target) {
        target.current_latitude = latitude;
        target.current_longitude = longitude;
        target.updated_at = new Date().toISOString();
      }

      try {
        const supabase = await createClient();
        await supabase
          .from("journey_tracking")
          .update({
            current_latitude: latitude,
            current_longitude: longitude,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
      } catch {
        // fallback
      }

      return NextResponse.json({ success: true, message: "Location synchronized." });
    }

    if (action === "complete" || action === "stop") {
      if (target) {
        target.tracking_status = "completed";
        target.updated_at = new Date().toISOString();
      }

      try {
        const supabase = await createClient();
        await supabase
          .from("journey_tracking")
          .update({
            tracking_status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
      } catch {
        // fallback
      }

      return NextResponse.json({ success: true, message: "Journey tracking completed and location sharing stopped." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

