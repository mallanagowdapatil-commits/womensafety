import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName = "", lastName = "", email = "", message = "" } = body;

    if (!firstName.trim()) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }
    if (!email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (!message.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || "mallanagowdapatil866@gmail.com";
    const fromAddress = process.env.RESEND_FROM_EMAIL || "SafeHer AI <onboarding@resend.dev>";
    const senderFullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    let resendMessageId: string | null = null;
    let emailStatus = "pending";

    if (resendApiKey) {
      // 1. Send the contact inquiry email to the admin / user's Gmail
      const inquiryHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SafeHer AI Contact Inquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #020617; padding: 24px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0f172a; border: 1px solid rgba(244, 63, 94, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #f43f5e 0%, #f97316 100%); padding: 22px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">
                📬 New SafeHer AI Contact Inquiry
              </h1>
              <p style="margin: 4px 0 0 0; color: #fee2e2; font-size: 13px; font-weight: 500;">
                Received via SafeHer AI Portal
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 24px 20px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #f1f5f9;">
                You received a new message from <strong>${senderFullName}</strong>:
              </p>

              <!-- Details Table -->
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; margin-bottom: 20px; font-size: 13px;">
                <tr>
                  <td width="30%" style="color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">Sender:</td>
                  <td style="color: #ffffff; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${senderFullName}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">Email Address:</td>
                  <td style="color: #38bdf8; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Received At:</td>
                  <td style="color: #cbd5e1;">${timestamp}</td>
                </tr>
              </table>

              <!-- Message Card -->
              <div style="background-color: rgba(244, 63, 94, 0.06); border-left: 4px solid #f43f5e; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #f43f5e; letter-spacing: 0.5px;">
                  Message:
                </h4>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #f8fafc; white-space: pre-wrap;">
${message.trim()}
                </p>
              </div>

              <!-- Reply Action -->
              <div style="text-align: center; margin-bottom: 16px;">
                <a href="mailto:${email}?subject=Re:%20SafeHer%20AI%20Inquiry" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #f97316 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px;">
                  Reply to ${senderFullName}
                </a>
              </div>

              <p style="margin: 0; font-size: 11px; color: #64748b; text-align: center;">
                SafeHer AI • Women's Safety & AI Threat Detection Platform
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

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [adminEmail],
            reply_to: email.trim(),
            subject: `📩 SafeHer AI Message from ${senderFullName}`,
            html: inquiryHtml,
          }),
        });

        const resendData = await resendRes.json();
        if (resendRes.ok && resendData?.id) {
          resendMessageId = resendData.id;
          emailStatus = "delivered";
        } else {
          console.warn("Resend contact delivery note:", resendData);
          emailStatus = "mocked";
        }
      } catch (err) {
        console.warn("Resend call error:", err);
        emailStatus = "failed";
      }
    }

    // Try storing in Supabase if accessible
    try {
      const supabase = await createClient();
      await supabase.from("contact_messages").insert([
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          message: message.trim(),
          provider_id: resendMessageId,
          status: emailStatus,
        },
      ]);
    } catch {
      // Supabase table optional fallback
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your message has been sent successfully to the SafeHer team.",
      id: resendMessageId || "msg_" + Date.now(),
      status: emailStatus,
      timestamp,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

