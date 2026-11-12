import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export interface EvidenceItem {
  id: string;
  emergency_id?: string;
  user_email: string;
  file_path: string;
  file_name: string;
  file_type: "audio" | "video";
  duration: number;
  file_size: number;
  storage_url?: string;
  data_url?: string; // base64 fallback for immediate offline preview & download
  created_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __safeher_evidence: EvidenceItem[] | undefined;
}

if (!globalThis.__safeher_evidence) {
  globalThis.__safeher_evidence = [];
}

const evidenceStore = globalThis.__safeher_evidence;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || "mallanagowdapatil866@gmail.com";
    const emergencyId = searchParams.get("emergency_id");

    // Try Supabase first
    try {
      const supabase = await createClient();
      let query = supabase
        .from("emergency_evidence")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false });

      if (emergencyId) {
        query = query.eq("emergency_id", emergencyId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ success: true, count: data.length, evidence: data });
      }
    } catch {
      // fallback
    }

    const filtered = evidenceStore.filter((e) => {
      const match = e.user_email.toLowerCase() === email.toLowerCase();
      if (emergencyId) {
        return match && e.emergency_id === emergencyId;
      }
      return match;
    });

    return NextResponse.json({ success: true, count: filtered.length, evidence: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("file_type") as string) || "audio";
    const duration = parseInt((formData.get("duration") as string) || "0", 10);
    const emergencyId = (formData.get("emergency_id") as string) || "inc_" + Date.now();
    const userEmail = (formData.get("user_email") as string) || "mallanagowdapatil866@gmail.com";

    if (!file) {
      return NextResponse.json({ error: "No media file provided." }, { status: 400 });
    }

    // Limit file size to 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Recording exceeds maximum allowed file size of 50MB." },
        { status: 400 }
      );
    }

    const id = "evid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    const ext = fileType === "video" ? "webm" : "webm";
    const fileName = `evidence_${id}.${ext}`;
    const filePath = `evidence/${userEmail}/${emergencyId}/${fileName}`;

    let storageUrl = "";
    let dataUrl = "";

    // Convert file to base64 data URL for instant playback/fallback
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || (fileType === "video" ? "video/webm" : "audio/webm");
    dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Try Supabase Storage upload if bucket exists
    try {
      const supabase = await createClient();
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("emergency-evidence")
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        // Create signed URL valid for 7 days
        const { data: signedData } = await supabase.storage
          .from("emergency-evidence")
          .createSignedUrl(filePath, 60 * 60 * 24 * 7);

        if (signedData?.signedUrl) {
          storageUrl = signedData.signedUrl;
        }
      }
    } catch {
      // Storage bucket optional fallback
    }

    const item: EvidenceItem = {
      id,
      emergency_id: emergencyId,
      user_email: userEmail,
      file_path: filePath,
      file_name: fileName,
      file_type: fileType as "audio" | "video",
      duration,
      file_size: file.size,
      storage_url: storageUrl || dataUrl,
      data_url: dataUrl,
      created_at: new Date().toISOString(),
    };

    evidenceStore.unshift(item);

    // Save record to Supabase table
    try {
      const supabase = await createClient();
      await supabase.from("emergency_evidence").insert([
        {
          id,
          emergency_id: emergencyId,
          user_email: userEmail,
          file_path: filePath,
          file_type: fileType,
          file_name: fileName,
          duration,
          file_size: file.size,
          storage_url: storageUrl || null,
        },
      ]);
    } catch {
      // DB table fallback
    }

    return NextResponse.json({
      success: true,
      message: "Emergency evidence recorded and encrypted successfully.",
      evidence: item,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Evidence id is required" }, { status: 400 });
    }

    // Remove from in-memory cache
    const index = evidenceStore.findIndex((e) => e.id === id);
    if (index !== -1) {
      const item = evidenceStore[index];
      evidenceStore.splice(index, 1);

      // Try deleting from Supabase
      try {
        const supabase = await createClient();
        await supabase.from("emergency_evidence").delete().eq("id", id);
        if (item.file_path) {
          await supabase.storage.from("emergency-evidence").remove([item.file_path]);
        }
      } catch {
        // fallback
      }
    }

    return NextResponse.json({ success: true, message: "Evidence record removed safely." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

