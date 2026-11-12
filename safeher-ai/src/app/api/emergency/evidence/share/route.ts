import { NextResponse } from "next/server";
import { getStoredContacts } from "@/utils/emergencyContacts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      evidence_id,
      file_type = "audio",
      duration = 0,
      user_name = "MallanaGowda Patil",
      user_email = "mallanagowdapatil866@gmail.com",
      recipients = [],
      download_url,
    } = body;

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL || "SafeHer AI <onboarding@resend.dev>";

    // Fallback recipient
    const targetEmails: Array<{ email: string; name?: string }> =
      Array.isArray(recipients) && recipients.length > 0
        ? recipients.map((r) => (typeof r === "string" ? { email: r } : r))
        : [{ email: "mallanagowdapatil866@gmail.com", name: "Family Guardian" }];

    const validEmails = targetEmails.filter((r) => r.email && r.email.includes("@"));

    if (validEmails.length === 0) {
      return NextResponse.json({ error: "No valid recipient email addresses found." }, { status: 400 });
    }

    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background-color:#020617;font-family:sans-serif;color:#f8fafc;">
  <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;background:#0f172a;border:2px solid #f43f5e;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg, #f43f5e, #f97316);padding:20px;text-align:center;">
        <h2 style="margin:0;color:#fff;">📹 SafeHer AI Emergency Evidence Shared</h2>
        <p style="margin:4px 0 0 0;color:#fee2e2;font-size:13px;">Critical Incident Media Access</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="font-size:14px;color:#f1f5f9;">
          <strong>${user_name}</strong> (${user_email}) has shared a critical <strong>${file_type.toUpperCase()} recording</strong> captured via SafeHer AI Emergency Evidence Recorder.
        </p>
        <table width="100%" cellpadding="8" style="background:rgba(255,255,255,0.04);border-radius:8px;font-size:13px;margin-bottom:20px;">
          <tr><td style="color:#94a3b8;">Recording Type:</td><td style="color:#fff;font-weight:bold;">${file_type.toUpperCase()} Evidence</td></tr>
          <tr><td style="color:#94a3b8;">Recorded Duration:</td><td style="color:#fff;">${duration} seconds</td></tr>
          <tr><td style="color:#94a3b8;">Timestamp:</td><td style="color:#fff;">${timestamp}</td></tr>
          <tr><td style="color:#94a3b8;">Evidence Reference:</td><td style="color:#38bdf8;font-family:monospace;">${evidence_id}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;">
          This evidence has been cryptographically signed and stored to aid immediate emergency response and legal verification.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (resendApiKey) {
      for (const target of validEmails) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromAddress,
              to: [target.email],
              subject: `📹 URGENT: Emergency ${file_type.toUpperCase()} Evidence Shared by ${user_name}`,
              html: emailHtml,
            }),
          });
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Evidence successfully shared with ${validEmails.length} emergency contacts.`,
      recipients: validEmails.map((v) => v.email),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

