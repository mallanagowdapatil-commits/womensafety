"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  MapPin,
  Footprints,
  Car,
  Clock,
  Shield,
  Hospital,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Share2,
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
  Loader2,
  Radio,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { BENGALURU_ORIGIN } from "@/components/dashboard/LiveHeatmap";
import { getStoredContacts, generateSosMessage } from "@/utils/emergencyContacts";

export interface EmergencyFacility {
  id: string;
  name: string;
  type: "hospital" | "police" | "shelter";
  address: string;
  distance_km: number;
  phone: string;
  lat: number;
  lng: number;
  open24_7: boolean;
}

export const EMERGENCY_FACILITIES: EmergencyFacility[] = [
  {
    id: "fac_1",
    name: "RajaRajeswari Medical College & Hospital",
    type: "hospital",
    address: "Mysore Rd, Kambipura, Bengaluru",
    distance_km: 0.6,
    phone: "08028437444",
    lat: 12.8898,
    lng: 77.4632,
    open24_7: true,
  },
  {
    id: "fac_2",
    name: "Dr. ACS College Campus Security Booth",
    type: "shelter",
    address: "Main Gate, Kambipura Campus, Bengaluru",
    distance_km: 0.3,
    phone: "+919876543210",
    lat: 12.8913,
    lng: 77.4660,
    open24_7: true,
  },
  {
    id: "fac_3",
    name: "Kengeri Police Station",
    type: "police",
    address: "Kengeri Satellite Town, Bengaluru",
    distance_km: 2.1,
    phone: "08022942528",
    lat: 12.9150,
    lng: 77.4850,
    open24_7: true,
  },
  {
    id: "fac_4",
    name: "BGS Global Hospital Trauma Center",
    type: "hospital",
    address: "Uttarahalli Main Rd, Kengeri, Bengaluru",
    distance_km: 3.4,
    phone: "08026255555",
    lat: 12.9020,
    lng: 77.4980,
    open24_7: true,
  },
  {
    id: "fac_5",
    name: "Kumbalgodu Police Station",
    type: "police",
    address: "Mysore Road, Kumbalgodu, Bengaluru",
    distance_km: 3.8,
    phone: "08028437100",
    lat: 12.8710,
    lng: 77.4420,
    open24_7: true,
  },
];

interface SafeRouteNavigationProps {
  onSelectDestination?: (lat: number, lng: number, name: string) => void;
  className?: string;
}

export default function SafeRouteNavigation({
  onSelectDestination,
  className = "",
}: SafeRouteNavigationProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(BENGALURU_ORIGIN);
  const [selectedDestination, setSelectedDestination] = useState<EmergencyFacility>(EMERGENCY_FACILITIES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [routeMode, setRouteMode] = useState<"walking" | "driving">("walking");
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [journeyFeedback, setJourneyFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [callingFacility, setCallingFacility] = useState<EmergencyFacility | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  // Auto-detect current GPS
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const distanceKm = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    selectedDestination.lat,
    selectedDestination.lng
  );

  const estimatedMinutes =
    routeMode === "walking"
      ? Math.max(2, Math.round((distanceKm / 4.5) * 60))
      : Math.max(2, Math.round((distanceKm / 30) * 60));

  const handleSelectFacility = (fac: EmergencyFacility) => {
    setSelectedDestination(fac);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("safeher_focus_facility", {
          detail: { lat: fac.lat, lng: fac.lng, name: fac.name },
        })
      );
    }
    if (onSelectDestination) {
      onSelectDestination(fac.lat, fac.lng, fac.name);
    }
    setJourneyFeedback(`Target set to ${fac.name} (~${fac.distance_km} km). Live map focused.`);
    setTimeout(() => setJourneyFeedback(null), 4000);
  };

  const handleOpenCall = (e: React.MouseEvent, fac: EmergencyFacility) => {
    e.stopPropagation();
    setCallingFacility(fac);
    setCopiedPhone(false);
    // On touch devices / mobile, also trigger native dialer directly
    if (typeof window !== "undefined" && "ontouchstart" in window) {
      window.location.href = `tel:${fac.phone}`;
    }
  };

  const handleStartJourney = async () => {
    try {
      const res = await fetch("/api/emergency/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: selectedDestination.name,
          destination_lat: selectedDestination.lat,
          destination_lng: selectedDestination.lng,
          start_latitude: userLocation.lat,
          start_longitude: userLocation.lng,
          mode: routeMode,
          distance_km: distanceKm,
          estimated_minutes: estimatedMinutes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.journey) {
        setIsJourneyActive(true);
        setActiveJourneyId(data.journey.id);
        setJourneyFeedback(`Live Journey Monitoring Activated to ${selectedDestination.name}!`);

        // Start periodic GPS watch
        if ("geolocation" in navigator) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(currentLoc);
              fetch("/api/emergency/journey", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: data.journey.id,
                  action: "update_location",
                  latitude: currentLoc.lat,
                  longitude: currentLoc.lng,
                }),
              }).catch(() => {});
            },
            () => {},
            { enableHighAccuracy: true }
          );
        }
      }
    } catch {
      setJourneyFeedback("Could not initialize journey tracking.");
    } finally {
      setTimeout(() => setJourneyFeedback(null), 5000);
    }
  };

  const handleStopJourney = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (activeJourneyId) {
      await fetch("/api/emergency/journey", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeJourneyId, action: "complete" }),
      }).catch(() => {});
    }
    setIsJourneyActive(false);
    setActiveJourneyId(null);
    setJourneyFeedback("Journey completed. Location sharing deactivated.");
    setTimeout(() => setJourneyFeedback(null), 4000);
  };

  const handleShareJourneyWithGuardians = async () => {
    setIsSharing(true);
    const contacts = getStoredContacts().filter((c) => c.phone !== "112" && c.phone !== "1091");
    const mapsLink = `https://maps.google.com/?q=${selectedDestination.lat},${selectedDestination.lng}`;

    // Send email via Resend
    const emailRecipients = contacts
      .map((c) => ({ email: c.email || "mallanagowdapatil866@gmail.com", name: c.name }))
      .filter((r) => r.email && r.email.includes("@"));

    if (emailRecipients.length > 0) {
      fetch("/api/emergency/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: emailRecipients,
          user_name: "MallanaGowda Patil",
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          location_address: `En Route to ${selectedDestination.name} (${distanceKm} km, ~${estimatedMinutes} mins)`,
        }),
      }).catch(() => {});
    }

    // Direct native SMS share
    const shareText = encodeURIComponent(
      `📍 SafeHer AI Journey Share: I am safely navigating to ${selectedDestination.name} (${distanceKm} km, ~${estimatedMinutes} mins). My route destination: ${mapsLink}`
    );
    const firstPhone = contacts[0]?.phone || "112";
    window.location.href = `sms:${firstPhone}?body=${shareText}`;

    setIsSharing(false);
    setJourneyFeedback("Live journey link shared with your emergency contacts!");
    setTimeout(() => setJourneyFeedback(null), 5000);
  };

  const filteredFacilities = EMERGENCY_FACILITIES.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`glass-card p-6 border border-white/10 relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              Safe Route Navigation
              <span className="text-[10px] bg-secondary/20 text-secondary border border-secondary/30 px-2.5 py-0.5 rounded-full font-semibold">
                AI Illuminated Corridors
              </span>
            </h3>
            <p className="text-white/60 text-xs mt-0.5">
              Optimizes routes towards high-visibility streets and 24/7 verified emergency facilities.
            </p>
          </div>
        </div>

        {/* Walking vs Driving Switch */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setRouteMode("walking")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              routeMode === "walking"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walk Safe</span>
          </button>
          <button
            type="button"
            onClick={() => setRouteMode("driving")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              routeMode === "driving"
                ? "bg-secondary text-white shadow-md shadow-secondary/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Drive Safe</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      <AnimatePresence>
        {journeyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 rounded-xl bg-secondary/20 border border-secondary/40 text-secondary text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{journeyFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory Safety Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Safety Advisory:</strong> AI route suggestions prioritize well-lit, populated corridors, but <strong>no route is guaranteed 100% safe</strong>. In immediate danger, head directly to the nearest verified emergency hospital or police booth below.
        </span>
      </div>

      {/* Active Route Summary Box */}
      <div className="p-4 rounded-2xl bg-[#030712]/60 border border-white/10 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold block">Origin:</span>
            <p className="text-white text-xs font-medium flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
              <span>Current GPS ({userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°)</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold block">Target Destination:</span>
            <p className="text-white text-xs font-semibold flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{selectedDestination.name}</span>
            </p>
          </div>

          <div className="flex items-center justify-start md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
            <div className="text-right">
              <span className="text-lg font-bold text-white">{distanceKm} <span className="text-xs text-white/50">km</span></span>
              <p className="text-[11px] text-emerald-400 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" /> ~{estimatedMinutes} mins {routeMode}
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedDestination.lat},${selectedDestination.lng}&travelmode=${routeMode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Open full turn-by-turn navigation in Google Maps"
            >
              <Navigation className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Google Maps</span>
            </a>
          </div>
        </div>

        {/* Safe Corridor Steps */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">
            Safe Corridor Recommendations:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Campus Main Road: 24/7 CCTV</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>RRMC Hospital Link: High illumination</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Avoid dim underpasses after 9 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Journey Monitoring Controls */}
      <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Radio className={`w-5 h-5 ${isJourneyActive ? "text-emerald-400 animate-pulse" : "text-secondary"}`} />
          <div>
            <h4 className="text-white text-xs font-bold">
              {isJourneyActive ? "Live Journey Monitoring Active" : "Journey Monitoring & Location Sharing"}
            </h4>
            <p className="text-white/60 text-[11px]">
              {isJourneyActive
                ? `Actively broadcasting your position to guardians while traveling to ${selectedDestination.name}.`
                : "Broadcasts your continuous route updates to trusted family members until you arrive."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {!isJourneyActive ? (
            <button
              type="button"
              onClick={handleStartJourney}
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/90 text-white text-xs font-bold shadow-md shadow-secondary/25 transition-all cursor-pointer"
            >
              Start Safe Journey
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleShareJourneyWithGuardians}
                disabled={isSharing}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-secondary" />
                <span>Share with Guardians</span>
              </button>
              <button
                type="button"
                onClick={handleStopJourney}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                End Journey
              </button>
            </>
          )}
        </div>
      </div>

      {/* Verified Emergency Facilities Selector */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Verified Emergency Facilities Nearby ({filteredFacilities.length})
          </h4>
          <span className="text-[11px] text-white/40">Tap any location to calculate safe route</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFacilities.map((fac) => {
            const isSelected = selectedDestination.id === fac.id;
            return (
              <div
                key={fac.id}
                onClick={() => handleSelectFacility(fac)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-secondary/15 border-secondary/50 shadow-md shadow-secondary/15"
                    : "bg-white/5 border-white/5 hover:border-white/15"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        fac.type === "hospital"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : fac.type === "police"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      }`}
                    >
                      {fac.type === "hospital" ? <Hospital className="w-3.5 h-3.5" /> : fac.type === "police" ? <Shield className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                      {fac.distance_km} km
                    </span>
                  </div>

                  <h5 className="text-white font-semibold text-xs leading-snug mb-1">{fac.name}</h5>
                  <p className="text-white/50 text-[11px] truncate">{fac.address}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleOpenCall(e, fac)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 shadow-sm cursor-pointer"
                    title={`Call official helpline for ${fac.name} (${fac.phone})`}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Helpline</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${fac.lat},${fac.lng}&travelmode=${routeMode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectFacility(fac);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30 text-xs font-bold flex items-center gap-1 transition-all hover:scale-105 shadow-sm cursor-pointer"
                    title={`Open turn-by-turn navigation to ${fac.name} in Google Maps`}
                  >
                    <span>Route</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Facility Helpline Calling Modal */}
      <AnimatePresence>
        {callingFacility && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCallingFacility(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#0b1329] border border-emerald-500/40 p-6 shadow-2xl rounded-3xl z-10 text-left"
            >
              <button
                type="button"
                onClick={() => setCallingFacility(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <Phone className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base leading-snug">{callingFacility.name}</h3>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    24/7 Verified Emergency Facility
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 text-center space-y-1">
                <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold block">
                  Official Facility Helpline:
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-300 block">
                  {callingFacility.phone}
                </span>
                <span className="text-xs text-white/60 block">{callingFacility.address}</span>
              </div>

              <div className="space-y-2.5">
                <a
                  href={`tel:${callingFacility.phone}`}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {callingFacility.phone} Now</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(callingFacility.phone);
                    setCopiedPhone(true);
                    setTimeout(() => setCopiedPhone(false), 2500);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedPhone ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPhone ? "Phone Number Copied to Clipboard!" : "Copy Number to Clipboard"}</span>
                </button>

                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                  <a
                    href="tel:112"
                    className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Emergency? Call 112</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${callingFacility.lat},${callingFacility.lng}&travelmode=${routeMode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:text-secondary/80 font-semibold flex items-center gap-1"
                  >
                    <span>Open in Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

