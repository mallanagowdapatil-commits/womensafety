import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// In-memory fallback incident store for demo resilience when database tables are initializing
let activeIncidentStore: Record<string, any> = {};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || "mallanagowdapatil866@gmail.com";

    // Try Supabase first
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("emergency_incidents")
        .select("*")
        .eq("user_email", email)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ active: true, incident: data });
      }
    } catch {
      // fallback
    }

    const localActive = activeIncidentStore[email];
    if (localActive && localActive.status === "active") {
      return NextResponse.json({ active: true, incident: localActive });
    }

    return NextResponse.json({ active: false, incident: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      user_email = "mallanagowdapatil866@gmail.com",
      user_name = "MallanaGowda Patil",
      trigger_source = "sos_button",
      latitude = 12.8895,
      longitude = 77.4655,
      location_address = "Kambipura / Doddabele, Bengaluru",
    } = body;

    const incidentData = {
      id: "inc_" + Date.now(),
      user_email,
      user_name,
      status: "active",
      trigger_source,
      initial_latitude: latitude,
      initial_longitude: longitude,
      current_latitude: latitude,
      current_longitude: longitude,
      location_address,
      created_at: new Date().toISOString(),
    };

    activeIncidentStore[user_email] = incidentData;

    // Try persisting to Supabase
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("emergency_incidents")
        .insert([{
          user_email,
          user_name,
          status: "active",
          trigger_source,
          initial_latitude: latitude,
          initial_longitude: longitude,
          current_latitude: latitude,
          current_longitude: longitude,
          location_address,
        }])
        .select()
        .single();

      if (data) {
        activeIncidentStore[user_email] = data;
        return NextResponse.json({ success: true, incident: data });
      }
    } catch {
      // DB table fallback
    }

    return NextResponse.json({ success: true, incident: incidentData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, user_email = "mallanagowdapatil866@gmail.com", action, latitude, longitude, note } = body;

    if (action === "resolve") {
      if (activeIncidentStore[user_email]) {
        activeIncidentStore[user_email].status = "resolved";
        activeIncidentStore[user_email].resolved_at = new Date().toISOString();
        activeIncidentStore[user_email].resolution_note = note || "Emergency safely resolved by user";
      }

      try {
        const supabase = await createClient();
        await supabase
          .from("emergency_incidents")
          .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
            resolution_note: note || "Resolved by user",
          })
          .eq("user_email", user_email)
          .eq("status", "active");
      } catch {
        // fallback
      }

      return NextResponse.json({ success: true, message: "Emergency incident marked as resolved." });
    }

    if (action === "update_location") {
      if (activeIncidentStore[user_email]) {
        activeIncidentStore[user_email].current_latitude = latitude;
        activeIncidentStore[user_email].current_longitude = longitude;
      }

      try {
        const supabase = await createClient();
        if (id) {
          await supabase
            .from("location_updates")
            .insert([{ incident_id: id, user_email, latitude, longitude }]);
        }
      } catch {
        // fallback
      }

      return NextResponse.json({ success: true, message: "Location updated." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

