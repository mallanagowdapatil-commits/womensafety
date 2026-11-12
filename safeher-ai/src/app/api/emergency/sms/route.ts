import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface SmsRecord {
  id: string;
  user_email: string;
  recipient_phone: string;
  message: string;
  status: "sent" | "delivered" | "failed" | "simulated";
  timestamp: string;
}

const smsHistory: SmsRecord[] = [];
const recentSmsMap = new Map<string, number>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "mallanagowdapatil866@gmail.com";
  const userHistory = smsHistory.filter((s) => s.user_email === email);
  return NextResponse.json({ success: true, history: userHistory });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      contacts = [],
      user_name = "MallanaGowda Patil",
      user_email = "mallanagowdapatil866@gmail.com",
      latitude = 12.8895,
      longitude = 77.4655,
      incident_id,
    } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "No recipient contacts provided" }, { status: 400 });
    }

    // Rate-limiting / deduplication: prevent duplicate triggers within 20 seconds
    const dedupKey = `${user_email}_${Math.floor(latitude * 1000)}_${Math.floor(longitude * 1000)}`;
    const lastSent = recentSmsMap.get(dedupKey);
    const now = Date.now();
    if (lastSent && now - lastSent < 20000) {
      return NextResponse.json({
        success: true,
        message: "Emergency alert already dispatched recently. Suppressed duplicate within 20s window.",
        deduplicated: true,
      });
    }
    recentSmsMap.set(dedupKey, now);

    const timestamp = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

    // DLT-compliant emergency SMS format
    const alertMessage = `EMERGENCY ALERT: ${user_name} triggered SafeHer AI SOS at ${timestamp}. Live Location: ${mapsLink} . Please contact immediately!`;

    const exotelSid = process.env.EXOTEL_ACCOUNT_SID;
    const exotelApiKey = process.env.EXOTEL_API_KEY;
    const exotelApiToken = process.env.EXOTEL_API_TOKEN;
    const exotelSenderId = process.env.EXOTEL_SENDER_ID || "SAFEHR";

    const results = [];

    for (const contact of contacts) {
      const phone = contact.phone || contact;
      if (!phone || phone === "112" || phone === "1091" || phone === "108") {
        continue; // Never send automated SMS to emergency helplines
      }

      let deliveryStatus: SmsRecord["status"] = "simulated";
      let providerId = "sim_sms_" + Date.now();
      let live = false;

      if (exotelSid && exotelApiKey && exotelApiToken) {
        try {
          const authHeader = Buffer.from(`${exotelApiKey}:${exotelApiToken}`).toString("base64");
          const endpoint = `https://api.exotel.com/v1/Accounts/${exotelSid}/Sms/send.json`;

          const formData = new URLSearchParams();
          formData.append("From", exotelSenderId);
          formData.append("To", phone);
          formData.append("Body", alertMessage);
          formData.append("DltEntityId", process.env.EXOTEL_DLT_ENTITY_ID || "");
          formData.append("DltTemplateId", process.env.EXOTEL_DLT_TEMPLATE_ID || "");

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Basic ${authHeader}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          const data = await res.json();
          if (res.ok && data?.SMSMessage?.Sid) {
            deliveryStatus = "sent";
            providerId = data.SMSMessage.Sid;
            live = true;
          } else {
            deliveryStatus = "failed";
          }
        } catch {
          deliveryStatus = "failed";
        }
      }

      const record: SmsRecord = {
        id: "sms_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        user_email,
        recipient_phone: phone,
        message: alertMessage,
        status: deliveryStatus,
        timestamp: new Date().toISOString(),
      };

      smsHistory.unshift(record);
      results.push({
        phone,
        status: deliveryStatus,
        provider_id: providerId,
        live_provider: live,
      });

      // Save to Supabase if available
      try {
        const supabase = await createClient();
        await supabase.from("emergency_notifications").insert([{
          incident_id: incident_id || null,
          user_email,
          recipient_phone: phone,
          recipient_name: contact.name || "Guardian",
          channel: "sms",
          message: alertMessage,
          status: deliveryStatus === "failed" ? "failed" : "sent",
          provider_id: providerId,
        }]);
      } catch {
        // fallback
      }
    }

    return NextResponse.json({
      success: true,
      sent_count: results.length,
      recipients: results,
      message_preview: alertMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

