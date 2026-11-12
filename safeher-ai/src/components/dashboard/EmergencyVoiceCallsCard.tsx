"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall,
  PhoneForwarded,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Volume2,
  UserCheck,
} from "lucide-react";
import { Contact, getStoredContacts } from "@/utils/emergencyContacts";
import { CallStatus, EmergencyCallRecord, EMERGENCY_VOICE_MESSAGE } from "@/app/api/emergency/call/route";

export default function EmergencyVoiceCallsCard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [calls, setCalls] = useState<EmergencyCallRecord[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadContacts = () => {
    const list = getStoredContacts().filter(
      (c) => c.phone !== "112" && c.phone !== "1091" && c.phone !== "108"
    );
    setContacts(list);
    // Default select all registered family contacts
    if (selectedContactIds.length === 0 && list.length > 0) {
      setSelectedContactIds(list.map((c) => c.id));
    }
  };

  const fetchCallLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/emergency/call");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.calls)) {
          setCalls(data.calls);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadContacts();
    fetchCallLogs();

    const handleSync = () => loadContacts();
    window.addEventListener("safeher_contacts_updated", handleSync);
    const interval = setInterval(fetchCallLogs, 15000);

    return () => {
      window.removeEventListener("safeher_contacts_updated", handleSync);
      clearInterval(interval);
    };
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleInitiateCalls = async () => {
    const targetContacts = contacts.filter((c) => selectedContactIds.includes(c.id));
    if (targetContacts.length === 0) {
      setFeedback("Please select at least one contact to receive emergency calls.");
      return;
    }

    setIsCalling(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/emergency/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: targetContacts,
          user_name: "MallanaGowda Patil",
          call_type: "automated_message",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(
          `Emergency voice calls dispatched to ${data.count || targetContacts.length} contacts via ${
            data.is_live_provider ? "Exotel Live API" : "Simulated Sandbox"
          }.`
        );
        fetchCallLogs();
      } else {
        setFeedback(data.error || "Unable to initiate call. Please retry or use direct calling.");
      }
    } catch {
      setFeedback("Network error. Please use direct mobile calling for immediate safety.");
    } finally {
      setIsCalling(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const getStatusBadge = (status: CallStatus) => {
    switch (status) {
      case "Initiated":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "Ringing":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse";
      case "Answered":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Completed":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      case "Busy":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "No Answer":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "Failed":
      default:
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    }
  };

  return (
    <div className="glass-card p-6 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              Emergency Voice Calling (Exotel API)
              <span className="text-[10px] bg-secondary/20 text-secondary border border-secondary/30 px-2.5 py-0.5 rounded-full font-semibold">
                Programmable Voice
              </span>
            </h3>
            <p className="text-white/60 text-xs mt-0.5">
              Automated high-priority voice dispatch with text-to-speech emergency warning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCallLogs}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Refresh Call Statuses"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleInitiateCalls}
            disabled={isCalling || contacts.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isCalling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Calling...</span>
              </>
            ) : (
              <>
                <PhoneForwarded className="w-4 h-4" />
                <span>Call Selected Contacts</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voice Message Alert Box */}
      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-5 flex items-start gap-3">
        <Volume2 className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="text-white/40 uppercase tracking-wider font-semibold text-[10px] block mb-0.5">
            Automated Spoken Message (Played on Answer):
          </span>
          <span className="text-white/90 italic font-mono">&ldquo;{EMERGENCY_VOICE_MESSAGE}&rdquo;</span>
        </div>
      </div>

      {/* Feedback Alert */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 rounded-xl bg-primary/20 border border-primary/40 text-white text-xs flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Selection Row */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-white/70 block mb-2 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-primary" />
          Select contacts authorized to receive emergency voice calls:
        </label>
        <div className="flex flex-wrap gap-2">
          {contacts.map((contact) => {
            const isSelected = selectedContactIds.includes(contact.id);
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => toggleSelect(contact.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-secondary/20 border-secondary/50 text-white shadow-md shadow-secondary/15"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSelected ? "bg-secondary" : "bg-white/20"
                  }`}
                />
                <span>{contact.name}</span>
                <span className="text-[11px] text-white/50">({contact.phone})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Call History / Status Feed */}
      <div>
        <h4 className="text-xs font-semibold text-white/60 mb-2.5 uppercase tracking-wider">
          Real-Time Call Status Feed:
        </h4>

        {calls.length === 0 ? (
          <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-white/40">
            No emergency calls initiated yet. Calls placed via SOS or the button above will appear here with live Exotel status updates.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {calls.map((call) => (
              <div
                key={call.id}
                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-secondary text-xs">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-semibold">{call.recipient_name}</span>
                      <span className="text-white/40 text-[11px]">{call.recipient_phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(call.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                      {call.duration_seconds > 0 && <span>• Duration: {call.duration_seconds}s</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span
                    className={`px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide uppercase ${getStatusBadge(
                      call.call_status
                    )}`}
                  >
                    {call.call_status}
                  </span>
                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {call.is_live_provider ? "Exotel Live" : "Sandbox"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

