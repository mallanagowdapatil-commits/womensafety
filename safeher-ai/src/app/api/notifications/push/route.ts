import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const registeredTokens: Array<{ token: string; user_email: string; device_type: string }> = [];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "mallanagowdapatil866@gmail.com";
  const tokens = registeredTokens.filter((t) => t.user_email === email);
  return NextResponse.json({ success: true, count: tokens.length, tokens });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, device_type = "web", user_email = "mallanagowdapatil866@gmail.com", user_agent } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Deduplicate
    const exists = registeredTokens.some((t) => t.token === token);
    if (!exists) {
      registeredTokens.push({ token, user_email, device_type });
    }

    try {
      const supabase = await createClient();
      await supabase.from("device_tokens").upsert({
        token,
        user_email,
        device_type,
        user_agent,
        updated_at: new Date().toISOString(),
      }, { onConflict: "token" });
    } catch {
      // fallback
    }

    return NextResponse.json({
      success: true,
      message: "Device registered for push notifications.",
      token,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

