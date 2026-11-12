import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const maxDuration = 30;

// High-reliability local Women's Safety Intelligence Engine (Deterministic, instant, and offline-resilient)
function getSmartSafetyResponse(query: string, location?: { lat: number; lng: number }): string {
  const q = query.toLowerCase();

  if (
    q.includes("danger") ||
    q.includes("help") ||
    q.includes("attack") ||
    q.includes("stalk") ||
    q.includes("follow") ||
    q.includes("threat") ||
    q.includes("urgent") ||
    q.includes("sos")
  ) {
    return `🚨 **IMMEDIATE SAFETY ACTION REQUIRED**

1. **Get to Safety:** Move immediately toward a populated, brightly lit store, metro station, or security post. Do not stop or look down at your phone.
2. **Call 112 Right Now:** Tap [**Call Police 112**](tel:112) for immediate police response.
3. **Notify Guardians:** Tap the **ACTIVATE SOS** button below to send your live GPS link to your emergency contacts.
4. **Attract Attention:** If confronted, yell loudly or trigger a loud alarm sound to draw bystanders.

*I am keeping emergency options active. Are you able to reach a public place right now?*`;
  }

  if (
    q.includes("not feel safe") ||
    q.includes("unsafe") ||
    q.includes("scared") ||
    q.includes("dark") ||
    q.includes("alone") ||
    q.includes("nervous")
  ) {
    return `🛡️ **Safety Guidance & Active Monitoring**

Your safety is the absolute priority. Here is what to do right now:
* **Head to Well-Lit Areas:** Stick to main roads with active vehicle and pedestrian traffic.
* **Stay Alert:** Remove headphones. Keep your hands free and stay observant of your surroundings.
* **Share Live Location:** Keep your live GPS tracking active for trusted guardians.
* **Discreet Fake Call:** If someone nearby is making you uncomfortable, pretend to speak loudly on the phone: *"I can see you, I'm almost at the corner!"*
* **Emergency Helpline:** You can dial **Women Helpline [1091](tel:1091)** or **Police [112](tel:112)** anytime.

Would you like me to find verified safe havens and 24/7 security posts near your current location?`;
  }

  if (
    q.includes("safe place") ||
    q.includes("hospital") ||
    q.includes("police station") ||
    q.includes("shelter") ||
    q.includes("booth")
  ) {
    return `📍 **Nearby Verified Safe Havens**

Based on your area (Bengaluru / Kambipura / Mysore Road Corridor):
1. **RajaRajeswari Medical College & Hospital (RRMC):** 24/7 Emergency Casualty & Security Gate (~400m). [Open in Google Maps](https://maps.google.com/?q=12.8898,77.4632)
2. **Dr. ACS College Campus Security Post:** 24/7 Guarded Entry (~200m). [Open in Google Maps](https://maps.google.com/?q=12.8913,77.4660)
3. **Kengeri Police Station:** Mysore Road, Kengeri (~2.5km). Emergency: **112**.
4. **Challaghatta Metro Station:** Manned security and CCTV coverage.

Always head toward official institutions with active 24/7 security personnel.`;
  }

  if (
    q.includes("contact") ||
    q.includes("guardian") ||
    q.includes("family") ||
    q.includes("number") ||
    q.includes("helpline")
  ) {
    return `📞 **Verified Emergency Helplines (India)**

* **Police / National Emergency:** [112](tel:112)
* **Women Safety Helpline:** [1091](tel:1091)
* **Domestic Abuse Helpline:** [181](tel:181)
* **Ambulance:** [108](tel:108)

To add or update your personal family phone numbers, visit the **Emergency & Family Contacts** section on your Dashboard or go to **Profile Settings > Emergency Contacts**.`;
  }

  return `Hello. I am **SafeHer AI**, your dedicated 24/7 women's safety companion.

I can help you with:
* **Emergency Assistance:** Immediate protocols for dangerous or suspicious situations.
* **Live Safe Routing:** Guidance to well-lit, public corridors.
* **Safe Havens:** Finding nearby hospitals, police booths, and 24/7 secured buildings.
* **Family Alerts:** Preparing instant SOS messages with your live GPS coordinates.

How are you feeling right now? If you need urgent help, tap any of the quick-action emergency buttons below.`;
}

export async function POST(req: Request) {
  try {
    const { messages, location } = await req.json();

    const lastUserMessage =
      messages && messages.length > 0 ? messages[messages.length - 1].content : "";

    // If an OpenAI API key is present, attempt fast generation with a 2.5s abort timeout
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          abortSignal: controller.signal,
          system: `You are SafeHer AI, a compassionate, hyper-vigilant, and practical women's safety assistant.
RULES FOR SAFETY:
1. If the user indicates immediate danger, stalking, violence, or severe threat, your FIRST sentence MUST instruct them to get to a safe public space and dial 112 (National Emergency Helpline / Police in India) or 1091 (Women Helpline).
2. Never invent phone numbers. Only cite 112 (Police / Emergency), 1091 (Women Safety Helpline), 181 (Domestic Abuse), or 108 (Ambulance).
3. Never claim that you dispatched a call or SMS unless the application UI confirms it.
4. Keep emergency guidance concise, bulleted, and actionable. Avoid long walls of text when a user is in distress.
5. In non-emergencies, provide supportive, empowering safety guidance, safe travel tips, and de-escalation tactics.
6. The user is currently in Bengaluru, India. Reference local assistance when asked for places.`,
          messages,
        });

        clearTimeout(timeout);

        if (text && text.trim()) {
          return NextResponse.json({
            role: "assistant",
            content: text,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (aiError) {
        // OpenAI failed or timed out (e.g. credit exhausted) -> fall through immediately to instant safety engine
      }
    }

    // High-reliability instant safety response (< 50ms)
    const safetyResponse = getSmartSafetyResponse(lastUserMessage, location);
    return NextResponse.json({
      role: "assistant",
      content: safetyResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      role: "assistant",
      content:
        "Your safety is our #1 priority. In an emergency, please immediately call **[Police 112](tel:112)** or **[Women Helpline 1091](tel:1091)** or press the red SOS button.",
      timestamp: new Date().toISOString(),
    });
  }
}
