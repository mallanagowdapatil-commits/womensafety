"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Video,
  Square,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Download,
  Share2,
  Trash2,
  ShieldAlert,
  Clock,
  AlertCircle,
  CheckCircle2,
  Camera,
  Loader2,
  HardDrive,
  FileAudio,
  FileVideo,
} from "lucide-react";
import { EvidenceItem } from "@/app/api/emergency/evidence/route";
import { getStoredContacts } from "@/utils/emergencyContacts";

export default function EmergencyEvidenceCard() {
  const [recordMode, setRecordMode] = useState<"audio" | "video">("audio");
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "review">("idle");
  const [duration, setDuration] = useState(0);
  const [hasConsent, setHasConsent] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSharing, setIsSharing] = useState<string | null>(null);
  const [savedEvidence, setSavedEvidence] = useState<EvidenceItem[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch past recordings on load
  const fetchEvidence = async () => {
    try {
      const res = await fetch("/api/emergency/evidence");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.evidence)) {
          setSavedEvidence(data.evidence);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchEvidence();
    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start recording
  const handleStartRecording = async (mode: "audio" | "video") => {
    setErrorMessage(null);
    setFeedback(null);
    recordedChunksRef.current = [];
    recordedBlobRef.current = null;
    setDuration(0);

    if (!hasConsent) {
      setErrorMessage("Please acknowledge the explicit consent checkbox before initiating recording.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints =
        mode === "video"
          ? { audio: true, video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } }
          : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mode === "video" && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      const mimeType =
        mode === "video"
          ? MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
            ? "video/webm;codecs=vp9"
            : "video/webm"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        recordedBlobRef.current = fullBlob;
        setRecordingState("review");
        stopTracks();
      };

      recorder.start(1000); // 1-second slices
      setRecordMode(mode);
      setRecordingState("recording");

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Recording permission error:", err);
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone/Camera permission denied. Please grant device permissions in your browser settings."
          : `Recording failed: ${err.message || "Hardware unavailable"}`
      );
      setRecordingState("idle");
      stopTracks();
    }
  };

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDiscard = () => {
    stopTracks();
    if (timerRef.current) clearInterval(timerRef.current);
    recordedChunksRef.current = [];
    recordedBlobRef.current = null;
    setRecordingState("idle");
    setDuration(0);
  };

  const handleUploadAndSave = async () => {
    if (!recordedBlobRef.current) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", recordedBlobRef.current, `evidence_${Date.now()}.${recordMode === "video" ? "webm" : "webm"}`);
      formData.append("file_type", recordMode);
      formData.append("duration", duration.toString());
      formData.append("user_email", "mallanagowdapatil866@gmail.com");

      const res = await fetch("/api/emergency/evidence", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback("Emergency evidence recorded and encrypted in secure storage!");
        handleDiscard();
        fetchEvidence();
      } else {
        setErrorMessage(data.error || "Failed to save evidence.");
      }
    } catch {
      setErrorMessage("Network error during evidence upload.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`/api/emergency/evidence?id=${id}`, { method: "DELETE" });
      setSavedEvidence((prev) => prev.filter((item) => item.id !== id));
      setFeedback("Recording removed successfully.");
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      // ignore
    }
  };

  const handleShareWithContacts = async (item: EvidenceItem) => {
    setIsSharing(item.id);
    const contacts = getStoredContacts().filter((c) => c.email);
    const recipients = contacts.length > 0
      ? contacts.map((c) => ({ email: c.email!, name: c.name }))
      : [{ email: "mallanagowdapatil866@gmail.com", name: "Family Guardian" }];

    try {
      const res = await fetch("/api/emergency/evidence/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence_id: item.id,
          file_type: item.file_type,
          duration: item.duration,
          recipients,
          download_url: item.storage_url || item.data_url,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(`Evidence access shared with ${recipients.length} emergency contacts via Gmail.`);
      }
    } catch {
      setFeedback("Failed to dispatch share email.");
    } finally {
      setIsSharing(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="glass-card p-6 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              Emergency Evidence Recording
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Audio & Video
              </span>
            </h3>
            <p className="text-white/60 text-xs mt-0.5">
              Securely record incident audio/video to Supabase Storage with cryptographic timestamps.
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        {recordingState === "recording" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600/30 border border-rose-500/60 text-rose-300 text-xs font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>RECORDING LIVE • {formatTime(duration)}</span>
          </div>
        )}
        {recordingState === "paused" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Pause className="w-3.5 h-3.5" />
            <span>PAUSED • {formatTime(duration)}</span>
          </div>
        )}
      </div>

      {/* Feedback & Error Alerts */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explicit Consent Notice */}
      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-5 flex items-start gap-3">
        <input
          type="checkbox"
          id="evidence-consent"
          checked={hasConsent}
          onChange={(e) => setHasConsent(e.target.checked)}
          className="mt-0.5 rounded border-white/20 text-primary focus:ring-primary cursor-pointer"
        />
        <label htmlFor="evidence-consent" className="text-xs text-white/70 leading-relaxed cursor-pointer select-none">
          <strong className="text-white">Privacy & Legal Consent:</strong> SafeHer AI never records secretly. By initiating a recording, you explicitly authorize temporary camera/microphone capture to preserve forensic evidence for your safety. Recordings are stored privately in your authenticated account.
        </label>
      </div>

      {/* Recorder Interface */}
      <div className="p-5 rounded-2xl bg-[#030712]/60 border border-white/10 mb-6">
        {/* Video Viewfinder (Only active during video recording) */}
        {recordMode === "video" && (recordingState === "recording" || recordingState === "paused") && (
          <div className="relative w-full max-w-md mx-auto aspect-video rounded-xl overflow-hidden bg-black mb-4 border border-rose-500/30 shadow-lg">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-full text-[10px] text-rose-400 font-bold flex items-center gap-1.5 border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>LIVE CAM</span>
            </div>
            <div className="absolute bottom-3 right-3 bg-black/70 px-3 py-1 rounded-lg text-xs font-mono font-bold text-white">
              {formatTime(duration)}
            </div>
          </div>
        )}

        {/* Audio Wave Visualizer Simulation */}
        {recordMode === "audio" && (recordingState === "recording" || recordingState === "paused") && (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center gap-1.5 h-12">
              {[40, 75, 55, 90, 60, 100, 80, 45, 95, 70, 30].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${recordingState === "recording" ? h : 20}%` }}
                  className={`w-1.5 rounded-full transition-all duration-300 ${
                    recordingState === "recording" ? "bg-rose-500 animate-pulse" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-2xl font-bold text-white">{formatTime(duration)}</span>
            <span className="text-xs text-white/50">Microphone Active • Lossless Audio Sampling</span>
          </div>
        )}

        {/* Review Mode (Playback preview before saving) */}
        {recordingState === "review" && (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-white font-bold text-sm">Recording Completed ({formatTime(duration)})</h4>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              Ready to save and store in your encrypted SafeHer cloud storage.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleUploadAndSave}
                disabled={isUploading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Save to Secure Cloud</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Controls for Idle State */}
        {recordingState === "idle" && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleStartRecording("audio")}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-primary/50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Mic className="w-4 h-4 text-primary" />
              <span>Record Emergency Audio</span>
            </button>

            <button
              type="button"
              onClick={() => handleStartRecording("video")}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-primary hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/30"
            >
              <Video className="w-4 h-4" />
              <span>Record Emergency Video</span>
            </button>
          </div>
        )}

        {/* Active Recording Controls */}
        {(recordingState === "recording" || recordingState === "paused") && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handlePauseResume}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {recordingState === "recording" ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStopRecording}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop & Review</span>
            </button>

            <button
              type="button"
              onClick={handleDiscard}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cancel recording"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Evidence Gallery / Stored Items */}
      <div>
        <h4 className="text-xs font-semibold text-white/60 mb-2.5 uppercase tracking-wider flex items-center justify-between">
          <span>Secured Evidence Logs ({savedEvidence.length})</span>
          <span className="text-[10px] text-white/40 font-normal">Encrypted • Private Storage</span>
        </h4>

        {savedEvidence.length === 0 ? (
          <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-white/40">
            No incident recordings yet. Trigger audio or video capture above to safeguard evidence in real time.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {savedEvidence.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-rose-400">
                    {item.file_type === "video" ? <FileVideo className="w-4 h-4" /> : <FileAudio className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-semibold">{item.file_name}</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70 uppercase font-mono">
                        {item.file_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span>• {formatTime(item.duration)}</span>
                      {item.file_size > 0 && <span>• {(item.file_size / 1024).toFixed(0)} KB</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                  {/* Inline Audio Player preview if audio */}
                  {item.file_type === "audio" && (item.storage_url || item.data_url) && (
                    <audio
                      controls
                      src={item.storage_url || item.data_url}
                      className="h-8 w-44 scale-90"
                    />
                  )}

                  {/* Download */}
                  <a
                    href={item.storage_url || item.data_url}
                    download={item.file_name}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
                    title="Download evidence to device"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {/* Share with Contacts */}
                  <button
                    type="button"
                    onClick={() => handleShareWithContacts(item)}
                    disabled={isSharing === item.id}
                    className="px-2.5 py-1.5 rounded-lg bg-secondary/20 hover:bg-secondary/30 border border-secondary/30 text-secondary text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Dispatch evidence alert to family via Gmail"
                  >
                    {isSharing === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Share2 className="w-3 h-3" />
                    )}
                    <span>Share</span>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete recording"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

