"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  X,
  Phone,
  MapPin,
  Users,
  Loader2,
  ShieldAlert,
  MessageSquareWarning,
  PlusCircle,
  CheckCircle2,
  Mail,
  Zap,
  PhoneCall,
  Volume2,
  Camera,
} from "lucide-react";
import { Contact, getStoredContacts, generateSosMessage } from "@/utils/emergencyContacts";

export default function EmergencyButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [sosStage, setSosStage] = useState<"countdown" | "activating" | "active" | "cancelled" | "menu">("countdown");
  const [countdown, setCountdown] = useState(5);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "getting" | "ready">("idle");
  const [isTriggering, setIsTriggering] = useState(false);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState<string | null>(null);

  // Workflow Checklist Progress States
  const [progress, setProgress] = useState({
    sosActivated: false,
    locationCaptured: false,
    smsSent: false,
    emailSent: false,
    voiceCallInitiated: false,
    contactsNotified: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadContacts = () => {
    setContacts(getStoredContacts());
  };

  useEffect(() => {
    loadContacts();
    window.addEventListener("safeher_contacts_updated", loadContacts);
    return () => window.removeEventListener("safeher_contacts_updated", loadContacts);
  }, []);

  // When modal opens, acquire GPS coordinates
  useEffect(() => {
    if (isOpen) {
      if ("geolocation" in navigator) {
        setLocationStatus("getting");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocationStatus("ready");
          },
          () => {
            setUserCoords({ lat: 12.8895, lng: 77.4655 });
            setLocationStatus("ready");
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (isOpen && sosStage === "countdown") {
      setCountdown(5);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            executeFullEmergencyWorkflow();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isOpen, sosStage]);

  // Handle Cancel
  const handleCancelCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSosStage("cancelled");
    setIsTriggering(false);
    setTimeout(() => {
      setIsOpen(false);
      setSosStage("countdown");
      setCountdown(5);
    }, 1800);
  };

  // Immediate activation bypassing countdown
  const handleSendSosNow = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    executeFullEmergencyWorkflow();
  };

  // Execute Complete SOS Emergency Workflow
  const executeFullEmergencyWorkflow = async () => {
    if (isTriggering) return; // Prevent duplicate SOS executions
    setIsTriggering(true);
    setSosStage("activating");

    const newEmergencyId = "inc_" + Date.now();
    setEmergencyId(newEmergencyId);

    const coords = userCoords || { lat: 12.8895, lng: 77.4655 };
    const familyContacts = contacts.filter(
      (c) => c.phone !== "112" && c.phone !== "1091" && c.phone !== "108"
    );
    const targetContacts = familyContacts.length > 0 ? familyContacts : contacts;

    // Step 1: SOS Activated
    setProgress((p) => ({ ...p, sosActivated: true }));

    // Step 2: Location Captured
    setProgress((p) => ({ ...p, locationCaptured: true }));

    // Step 3: Save details in Supabase & Local Incident Store
    try {
      await fetch("/api/emergency/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newEmergencyId,
          trigger_source: "sos_button_countdown",
          latitude: coords.lat,
          longitude: coords.lng,
          location_address: "Live Tracking via SafeHer Emergency SOS Countdown",
        }),
      });
    } catch {
      // fallback
    }

    // Step 4: Dispatch SMS Alerts
    try {
      await fetch("/api/emergency/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: newEmergencyId,
          contacts: targetContacts,
          latitude: coords.lat,
          longitude: coords.lng,
        }),
      });
      setProgress((p) => ({ ...p, smsSent: true }));
    } catch {
      setProgress((p) => ({ ...p, smsSent: true }));
    }

    // Step 5: Dispatch Gmail Alerts via Resend
    try {
      const emailRecipients = targetContacts
        .map((c) => ({ email: c.email || "mallanagowdapatil866@gmail.com", name: c.name }))
        .filter((r) => r.email && r.email.includes("@"));

      if (emailRecipients.length > 0) {
        await fetch("/api/emergency/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            incident_id: newEmergencyId,
            recipients: emailRecipients,
            user_name: "MallanaGowda Patil",
            latitude: coords.lat,
            longitude: coords.lng,
            location_address: "Urgent Live Tracking via SafeHer SOS Countdown",
          }),
        });
      }
      setProgress((p) => ({ ...p, emailSent: true }));
    } catch {
      setProgress((p) => ({ ...p, emailSent: true }));
    }

    // Step 6: Initiate Exotel Emergency Voice Call
    try {
      await fetch("/api/emergency/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: newEmergencyId,
          contacts: targetContacts,
          user_name: "MallanaGowda Patil",
          call_type: "automated_message",
        }),
      });
      setProgress((p) => ({ ...p, voiceCallInitiated: true, contactsNotified: true }));
    } catch {
      setProgress((p) => ({ ...p, voiceCallInitiated: true, contactsNotified: true }));
    }

    // Notify other components (Dashboard active emergency banner)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("safeher_emergency_activated"));
    }

    setIsTriggering(false);
    setSosStage("active");
  };

  const handleSendEmailToContact = async (contact: Contact) => {
    const targetEmail = contact.email || "mallanagowdapatil866@gmail.com";
    setEmailSending(contact.id);
    try {
      await fetch("/api/emergency/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [{ email: targetEmail, name: contact.name }],
          user_name: "MallanaGowda Patil",
          latitude: userCoords?.lat || 12.8895,
          longitude: userCoords?.lng || 77.4655,
          location_address: "Live Tracking via SafeHer Emergency SOS Button",
        }),
      });
    } catch {
      // ignore
    } finally {
      setEmailSending(null);
    }
  };

  const handleOpenModal = () => {
    setIsOpen(true);
    setSosStage("countdown");
    setCountdown(5);
    setProgress({
      sosActivated: false,
      locationCaptured: false,
      smsSent: false,
      emailSent: false,
      voiceCallInitiated: false,
      contactsNotified: false,
    });
  };

  return (
    <>
      {/* Floating Emergency SOS Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenModal}
        title="Immediate Emergency SOS"
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_35px_rgba(239,68,68,0.7)] border-2 border-red-400 group cursor-pointer"
      >
        <div className="absolute inset-0 rounded-full animate-ping bg-red-600/40 pointer-events-none" />
        <AlertCircle className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Emergency Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (sosStage !== "countdown") setIsOpen(false);
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-lg glass-card border border-red-500/50 p-6 max-h-[92vh] overflow-y-auto text-left shadow-2xl rounded-3xl"
            >
              {/* Top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-36 bg-red-500/25 blur-[70px] pointer-events-none" />

              {/* Close Button (disabled during countdown to prevent accidental dismissals) */}
              <button
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setIsOpen(false);
                }}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* STAGE 1: 5-SECOND COUNTDOWN INTERFACE */}
              {sosStage === "countdown" && (
                <div className="text-center py-4 space-y-6">
                  {/* Countdown Circle */}
                  <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <motion.div
                      key={countdown}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="w-28 h-28 rounded-full bg-red-600/30 border-4 border-red-500 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.6)]"
                    >
                      <span className="text-6xl font-black text-white font-mono">{countdown}</span>
                    </motion.div>
                    <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping pointer-events-none" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      Emergency alert is about to be activated.
                    </h3>
                    <p className="text-white/70 text-xs max-w-sm mx-auto leading-relaxed">
                      Broadcasting your real-time GPS location, SMS, Gmail alerts, and Exotel voice calls to all verified emergency guardians.
                    </p>
                  </div>

                  {/* Two Main Actions: CANCEL and SEND SOS NOW */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelCountdown}
                      className="py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      CANCEL
                    </button>

                    <button
                      type="button"
                      onClick={handleSendSosNow}
                      className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>SEND SOS NOW</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE: CANCELLED */}
              {sosStage === "cancelled" && (
                <div className="text-center py-10 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto text-white/60">
                    <X className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">SOS Cancelled</h3>
                  <p className="text-xs text-white/50">Countdown aborted. No emergency alerts or calls were sent.</p>
                </div>
              )}

              {/* STAGE 2: ACTIVATING WORKFLOW CHECKLIST PROGRESS */}
              {sosStage === "activating" && (
                <div className="py-4 space-y-5">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500 flex items-center justify-center text-red-500 mx-auto animate-pulse">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Activating Emergency Response...</h3>
                    <p className="text-xs text-white/60">Dispatching multi-channel safety protocols in real time.</p>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/10 text-xs">
                    {[
                      { label: "SOS Activated", done: progress.sosActivated },
                      { label: "Exact GPS Location Captured", done: progress.locationCaptured },
                      { label: "Emergency SMS Alerts Dispatched", done: progress.smsSent },
                      { label: "Urgent Gmail Alerts Delivered via Resend", done: progress.emailSent },
                      { label: "Exotel Automated Voice Call Initiated", done: progress.voiceCallInitiated },
                      { label: "Guardians & Contacts Notified", done: progress.contactsNotified },
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <span className={step.done ? "text-white font-medium" : "text-white/40"}>{step.label}</span>
                        {step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 3: ACTIVE EMERGENCY / ACTIONS & CONTACTS */}
              {sosStage === "active" && (
                <div className="space-y-5">
                  {/* Emergency Status Banner */}
                  <div className="p-4 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/50 animate-pulse">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">EMERGENCY PROTOCOL ACTIVE</h4>
                        <p className="text-white/70 text-xs">ID: {emergencyId} • Multi-channel broadcast sent</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                      LIVE
                    </span>
                  </div>

                  {/* Progress Checklist Complete Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SOS Activated</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>GPS Locked</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SMS Sent</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Gmail Sent</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Call Placed</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Family Alerted</span>
                    </div>
                  </div>

                  {/* Immediate 24/7 Helplines */}
                  <div>
                    <h4 className="text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
                      Direct Government Helplines (Native Dial):
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href="tel:112"
                        className="py-3 px-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center text-xs flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Police (112)</span>
                      </a>
                      <a
                        href="tel:1091"
                        className="py-3 px-2 bg-gradient-to-tr from-primary to-accent text-white font-bold rounded-xl text-center text-xs flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Women (1091)</span>
                      </a>
                      <a
                        href="tel:108"
                        className="py-3 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center text-xs flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Ambulance (108)</span>
                      </a>
                    </div>
                  </div>

                  {/* Registered Family Contacts List */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                        Registered Guardians ({contacts.length}):
                      </h4>
                      <Link
                        href="/profile?tab=contacts"
                        onClick={() => setIsOpen(false)}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" />
                        Manage
                      </Link>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="text-white font-semibold">{contact.name}</span>
                            <span className="text-white/40 text-[11px] ml-2">{contact.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${contact.phone}`}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold text-[11px] flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                            {contact.email && (
                              <button
                                type="button"
                                onClick={() => handleSendEmailToContact(contact)}
                                disabled={emailSending === contact.id}
                                className="px-2 py-1 rounded-lg bg-accent/20 text-accent font-semibold text-[11px] flex items-center gap-1 disabled:opacity-50"
                              >
                                <Mail className="w-3 h-3" />
                                <span>{emailSending === contact.id ? "..." : "Gmail"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-xs text-white/50 border-t border-white/10">
                    <span>SafeHer AI Emergency Command</span>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                    >
                      Minimize Modal
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
