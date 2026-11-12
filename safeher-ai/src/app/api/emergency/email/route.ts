import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  status: "sent" | "delivered" | "failed";
  provider_id?: string;
  timestamp: string;
}

const emailLogs: EmailLog[] = [];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const filtered = email ? emailLogs.filter((l) => l.recipient_email === email) : emailLogs;
  return NextResponse.json({ success: true, count: filtered.length, logs: filtered });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      recipients = [],
      user_name = "MallanaGowda Patil",
      user_email = "mallanagowdapatil866@gmail.com",
      latitude = 12.8895,
      longitude = 77.4655,
      location_address = "Kambipura / Doddabele, Bengaluru",
      incident_id,
    } = body;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    // Ensure array of recipients
    const targetEmails: Array<{ email: string; name?: string }> = Array.isArray(recipients)
      ? recipients.map((r) => (typeof r === "string" ? { email: r } : r))
      : [{ email: recipients }];

    const validEmails = targetEmails.filter(
      (r) => r.email && r.email.includes("@") && !r.email.includes("112")
    );

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid recipient email / Gmail address provided" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

    const results = [];

    for (const target of validEmails) {
      const recipientEmail = target.email.trim();
      const recipientName = target.name || "Guardian";

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SafeHer AI Emergency Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #020617; padding: 24px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0f172a; border: 2px solid #ef4444; border-radius: 16px; overflow: hidden; box-shadow: 0 0 35px rgba(239, 68, 68, 0.4);">
          
          <!-- Urgent Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
                🚨 URGENT EMERGENCY SOS ALERT
              </h1>
              <p style="margin: 4px 0 0 0; color: #fee2e2; font-size: 13px; font-weight: 600;">
                SafeHer AI Rapid Emergency Response Network
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 24px 20px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #f1f5f9;">
                Hello <strong>${recipientName}</strong>,
              </p>

              <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #fca5a5;">
                  <strong>${user_name}</strong> has triggered an active <strong>Emergency SOS</strong> from SafeHer AI and requires immediate contact or assistance!
                </p>
              </div>

              <!-- Details Table -->
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; margin-bottom: 24px; font-size: 13px;">
                <tr>
                  <td width="35%" style="color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">User In Distress:</td>
                  <td style="color: #ffffff; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${user_name} (${user_email})</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">Activation Time:</td>
                  <td style="color: #ffffff; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${timestamp}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">GPS Coordinates:</td>
                  <td style="color: #38bdf8; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Reported Area:</td>
                  <td style="color: #ffffff; font-weight: 600;">${location_address}</td>
                </tr>
              </table>

              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${googleMapsUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #f97316 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 20px rgba(244, 63, 94, 0.4);">
                  📍 Open Live GPS Location in Google Maps
                </a>
              </div>

              <!-- Recommended Next Steps -->
              <div style="background-color: rgba(255, 255, 255, 0.04); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #f43f5e; text-transform: uppercase; letter-spacing: 0.5px;">
                  Immediate Actions Required:
                </h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                  <li>Call <strong>${user_name}</strong> on their phone immediately to verify their status.</li>
                  <li>If they do not answer, call <strong>National Emergency Helpline: 112</strong> or <strong>Women Helpline: 1091</strong>.</li>
                  <li>Track their live movement using the Google Maps link above.</li>
                </ol>
              </div>

              <p style="margin: 0; font-size: 11px; color: #64748b; text-align: center;">
                This urgent email was automatically generated by SafeHer AI upon user SOS activation.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      let providerId = "resend_sim_" + Date.now();
      let status: EmailLog["status"] = "sent";

      try {
        const fromAddress = process.env.RESEND_FROM_EMAIL || "SafeHer AI <onboarding@resend.dev>";
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [recipientEmail],
            subject: `🚨 EMERGENCY SOS: ${user_name} Needs Immediate Help!`,
            html: emailHtml,
          }),
        });

        const resendData = await resendRes.json();
        if (resendRes.ok && resendData?.id) {
          providerId = resendData.id;
          status = "sent";
        } else {
          console.warn("Resend API error:", resendData);
          status = "failed";
        }
      } catch (err) {
        console.error("Resend fetch error:", err);
        status = "failed";
      }

      const log: EmailLog = {
        id: "eml_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: `🚨 EMERGENCY SOS: ${user_name} Needs Immediate Help!`,
        status,
        provider_id: providerId,
        timestamp: new Date().toISOString(),
      };

      emailLogs.unshift(log);
      results.push({
        email: recipientEmail,
        status,
        provider_id: providerId,
      });

      // Save to Supabase notifications table if available
      try {
        const supabase = await createClient();
        await supabase.from("emergency_notifications").insert([{
          incident_id: incident_id || null,
          user_email,
          recipient_phone: recipientEmail,
          recipient_name: recipientName,
          channel: "email",
          message: `EMERGENCY SOS: ${user_name} triggered alert at ${timestamp}. Location: ${googleMapsUrl}`,
          status: status === "failed" ? "failed" : "sent",
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
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

