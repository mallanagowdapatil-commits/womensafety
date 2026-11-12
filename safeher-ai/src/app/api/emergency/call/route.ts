import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export type CallStatus =
  | "Initiated"
  | "Ringing"
  | "Answered"
  | "Completed"
  | "Failed"
  | "Busy"
  | "No Answer";

export interface EmergencyCallRecord {
  id: string;
  emergency_id?: string;
  user_email: string;
  user_phone?: string;
  contact_id?: string;
  recipient_phone: string;
  recipient_name: string;
  call_type: "automated_message" | "two_way" | "direct";
  call_status: CallStatus;
  call_sid?: string;
  duration_seconds: number;
  message_played?: string;
  is_live_provider: boolean;
  provider_note?: string;
  created_at: string;
  updated_at: string;
}

// Global in-memory cache for call records
declare global {
  // eslint-disable-next-line no-var
  var __safeher_calls: EmergencyCallRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __safeher_call_timestamps: Map<string, number> | undefined;
}

if (!globalThis.__safeher_calls) {
  globalThis.__safeher_calls = [];
}
if (!globalThis.__safeher_call_timestamps) {
  globalThis.__safeher_call_timestamps = new Map<string, number>();
}

const callStore = globalThis.__safeher_calls;
const callTimestamps = globalThis.__safeher_call_timestamps;

export const EMERGENCY_VOICE_MESSAGE =
  "Emergency Alert! Your registered family member has activated an SOS alert through SafeHer AI. Please contact them immediately. Their emergency location has been shared with you.";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || "mallanagowdapatil866@gmail.com";
    const incidentId = searchParams.get("incident_id");

    // Try Supabase first
    try {
      const supabase = await createClient();
      let query = supabase
        .from("emergency_calls")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false })
        .limit(20);

      if (incidentId) {
        query = query.eq("emergency_id", incidentId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ success: true, count: data.length, calls: data });
      }
    } catch {
      // fallback to memory store
    }

    const filtered = callStore.filter((c) => {
      const matchEmail = c.user_email.toLowerCase() === email.toLowerCase();
      if (incidentId) {
        return matchEmail && c.emergency_id === incidentId;
      }
      return matchEmail;
    });

    return NextResponse.json({ success: true, count: filtered.length, calls: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      contacts = [], // array of selected contacts to call
      recipient_phone,
      recipient_name = "Family Contact",
      contact_id,
      user_email = "mallanagowdapatil866@gmail.com",
      user_phone = "+91 98765 43210",
      user_name = "MallanaGowda Patil",
      incident_id,
      call_type = "automated_message", // 'automated_message' | 'two_way'
    } = body;

    // Normalizing targets: can accept either a single contact or an array of contacts
    interface TargetContact {
      phone: string;
      name: string;
      id?: string;
    }

    const rawTargets: TargetContact[] =
      Array.isArray(contacts) && contacts.length > 0
        ? contacts.map((c: any) => ({
            phone: c.phone || "",
            name: c.name || "Family Contact",
            id: c.id,
          }))
        : recipient_phone
        ? [{ phone: recipient_phone, name: recipient_name, id: contact_id }]
        : [];

    if (rawTargets.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient phone number is required to place an emergency call." },
        { status: 400 }
      );
    }

    const governmentHelplines = ["112", "100", "101", "102", "108", "1091", "181", "911"];
    const exotelSid = process.env.EXOTEL_ACCOUNT_SID;
    const exotelApiKey = process.env.EXOTEL_API_KEY;
    const exotelApiToken = process.env.EXOTEL_API_TOKEN;
    const exotelCallerId = process.env.EXOTEL_CALLER_ID || "08047192837";
    const exotelAppId = process.env.EXOTEL_APP_ID;

    const isExotelConfigured = Boolean(exotelSid && exotelApiKey && exotelApiToken);

    const results: EmergencyCallRecord[] = [];
    const now = Date.now();

    for (const target of rawTargets) {
      const sanitizedPhone = target.phone.replace(/[^0-9]/g, "");

      // Safety constraint: Never place automated robocalls to government emergency numbers
      if (governmentHelplines.includes(sanitizedPhone)) {
        continue;
      }

      if (sanitizedPhone.length < 10) {
        continue;
      }

      // Anti-duplicate call prevention (prevent spamming within 45s per number per incident)
      const dedupeKey = `${sanitizedPhone}_${incident_id || "general"}`;
      const lastCallTime = callTimestamps.get(dedupeKey);
      if (lastCallTime && now - lastCallTime < 45000) {
        // Return existing active record if already placed
        const existing = callStore.find(
          (c) => c.recipient_phone.replace(/[^0-9]/g, "") === sanitizedPhone
        );
        if (existing) {
          results.push(existing);
          continue;
        }
      }

      callTimestamps.set(dedupeKey, now);

      let finalStatus: CallStatus = "Initiated";
      let callSid = "exotel_call_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
      let providerNote = "";

      if (isExotelConfigured) {
        try {
          const authHeader = Buffer.from(`${exotelApiKey}:${exotelApiToken}`).toString("base64");
          const endpoint = `https://api.exotel.com/v1/Accounts/${exotelSid}/Calls/connect.json`;

          const formData = new URLSearchParams();
          formData.append("CallerId", exotelCallerId);
          formData.append("To", target.phone.trim());

          if (call_type === "two_way") {
            // Connect two numbers: User phone <-> Emergency Contact phone
            formData.append("From", user_phone.trim());
          } else {
            // Automated Voice message flow
            formData.append("From", exotelCallerId);
            formData.append("CallType", "trans");

            if (exotelAppId) {
              formData.append(
                "Url",
                `http://my.exotel.com/${exotelSid}/exoml/start_voice/${exotelAppId}`
              );
            }
          }

          // Optional callback URL
          if (process.env.NEXT_PUBLIC_APP_URL) {
            formData.append(
              "StatusCallback",
              `${process.env.NEXT_PUBLIC_APP_URL}/api/emergency/call-status`
            );
            formData.append("StatusCallbackEvents[0]", "terminal");
          }

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Basic ${authHeader}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          const exotelData = await response.json();
          if (response.ok && exotelData?.Call?.Sid) {
            callSid = exotelData.Call.Sid;
            finalStatus = "Ringing";
            providerNote = `Connected to Exotel Live Voice Gateway. Call SID: ${callSid}`;
          } else {
            console.warn("Exotel Voice API response:", exotelData);
            finalStatus = "Failed";
            providerNote = exotelData?.RestException?.Message || "Exotel rejected call request";
          }
        } catch (err: any) {
          console.error("Exotel Voice dispatch error:", err);
          finalStatus = "Failed";
          providerNote = err.message || "Failed to reach Exotel API";
        }
      } else {
        // Safe sandbox simulation when API keys are being set up
        finalStatus = "Answered";
        providerNote =
          "Exotel credentials not configured in .env.local. Simulated voice alert delivered successfully in sandbox mode.";
      }

      const callRecord: EmergencyCallRecord = {
        id: "call_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        emergency_id: incident_id,
        user_email,
        user_phone,
        contact_id: target.id,
        recipient_phone: target.phone,
        recipient_name: target.name,
        call_type,
        call_status: finalStatus,
        call_sid: callSid,
        duration_seconds: finalStatus === "Answered" ? 18 : 0,
        message_played: EMERGENCY_VOICE_MESSAGE,
        is_live_provider: isExotelConfigured,
        provider_note: providerNote,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      callStore.unshift(callRecord);
      results.push(callRecord);

      // Save to Supabase emergency_calls table if available
      try {
        const supabase = await createClient();
        await supabase.from("emergency_calls").insert([
          {
            emergency_id: incident_id || null,
            user_email,
            contact_id: target.id || null,
            recipient_phone: target.phone,
            recipient_name: target.name,
            call_sid: callSid,
            call_status: finalStatus,
            duration_seconds: callRecord.duration_seconds,
          },
        ]);
      } catch {
        // Supabase table optional fallback
      }
    }

    return NextResponse.json({
      success: results.some((r) => r.call_status !== "Failed"),
      count: results.length,
      is_live_provider: isExotelConfigured,
      calls: results,
      voice_message: EMERGENCY_VOICE_MESSAGE,
      config_status: isExotelConfigured
        ? "Exotel Live API Connected"
        : "Sandbox Mode (EXOTEL_ACCOUNT_SID / EXOTEL_API_KEY required in .env.local for real telco calls)",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
