"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  MapPin,
  Clock,
  Phone,
  MessageSquareWarning,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  XCircle,
  Radio,
} from "lucide-react";
import { getStoredContacts } from "@/utils/emergencyContacts";

export default function ActiveEmergencyBanner() {
  const [activeIncident, setActiveIncident] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const checkActiveIncident = async () => {
    try {
      const res = await fetch("/api/emergency/incident");
      if (res.ok) {
        const data = await res.json();
        if (data.active && data.incident) {
          setActiveIncident(data.incident);
          if (data.incident.current_latitude && data.incident.current_longitude) {
            setLiveCoords({
              lat: data.incident.current_latitude,
              lng: data.incident.current_longitude,
            });
          }
        } else {
          setActiveIncident(null);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkActiveIncident();
    const interval = setInterval(checkActiveIncident, 10000);
    const handleActivated = () => checkActiveIncident();
    window.addEventListener("safeher_emergency_activated", handleActivated);
    return () => {
      clearInterval(interval);
      window.removeEventListener("safeher_emergency_activated", handleActivated);
    };
  }, []);

  // Timer for active emergency
  useEffect(() => {
    if (activeIncident) {
      const startTime = new Date(activeIncident.created_at || Date.now()).getTime();
      const timer = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeIncident]);

  // Watch position during active emergency
  useEffect(() => {
    if (activeIncident && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLiveCoords({ lat, lng });

          // Send location update to backend
          fetch("/api/emergency/incident", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: activeIncident.id,
              action: "update_location",
              latitude: lat,
              longitude: lng,
            }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [activeIncident]);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await fetch("/api/emergency/incident", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeIncident?.id,
          action: "resolve",
          note: "User marked safe from Emergency Dashboard",
        }),
      });
      setActiveIncident(null);
      setShowResolveModal(false);
    } catch (err) {
      console.error("Failed to resolve emergency:", err);
    } finally {
      setIsResolving(false);
    }
  };

  if (!activeIncident) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-black/80 border-2 border-red-500/60 p-5 shadow-[0_0_40px_rgba(239,68,68,0.35)] relative overflow-hidden backdrop-blur-xl mb-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/50 flex-shrink-0 animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-xs tracking-wider uppercase animate-pulse">
                  Active Emergency SOS
                </span>
                <span className="text-white/60 text-xs flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  Elapsed: {formatTimer(elapsedSeconds)}
                </span>
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Radio className="w-3 h-3 animate-ping" /> Live GPS Broadcast
                </span>
              </div>

              <h3 className="text-white font-bold text-lg mt-1">
                Emergency Protocol In Progress for {activeIncident.user_name || "User"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                <div className="flex items-center gap-1.5 text-white/80">
                  <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>
                    {liveCoords
                      ? `${liveCoords.lat.toFixed(4)}° N, ${liveCoords.lng.toFixed(4)}° E`
                      : activeIncident.location_address || "Locating..."}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-white/80">
                  <MessageSquareWarning className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Guardians Alerted with Live Link</span>
                </div>

                <div className="flex items-center gap-1.5 text-white/80">
                  <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Call Helplines: <a href="tel:112" className="underline font-bold text-white hover:text-red-400">112 (Police)</a></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowResolveModal(true)}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Am Safe (Resolve SOS)</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal to Resolve Emergency */}
      <AnimatePresence>
        {showResolveModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResolveModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-card border border-emerald-500/40 p-6 space-y-4 text-left shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-white">Resolve Active Emergency?</h4>
                <p className="text-white/70 text-xs mt-1">
                  This will mark the current incident as safely resolved and notify your emergency network that you are in a safe environment.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                >
                  Keep Active
                </button>
                <button
                  type="button"
                  disabled={isResolving}
                  onClick={handleResolve}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  {isResolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Confirm I Am Safe</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

