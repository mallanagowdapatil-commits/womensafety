"use client";

import { useState, useEffect, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import {
  AlertCircle,
  Crosshair,
  Navigation,
  Shield,
  AlertTriangle,
  Hospital,
  ShieldCheck,
  Phone,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EMERGENCY_FACILITIES, EmergencyFacility } from "@/components/map/SafeRouteNavigation";

// Original location from user screenshot (Dr. ACS College / RRMC / Doddabele, Bengaluru)
export const BENGALURU_ORIGIN = { lat: 12.8895, lng: 77.4655 };

export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  risk: "safe" | "moderate" | "high";
  title: string;
  desc: string;
}

export const BENGALURU_HOTSPOTS: Hotspot[] = [
  {
    id: "1",
    lat: 12.8913,
    lng: 77.4660,
    risk: "safe",
    title: "Dr. ACS College Campus",
    desc: "Active security patrol, verified safe zone with 24/7 surveillance.",
  },
  {
    id: "2",
    lat: 12.8898,
    lng: 77.4632,
    risk: "safe",
    title: "RajaRajeswari Medical College & Hospital",
    desc: "Emergency medical hub, continuous lighting and transit connectivity.",
  },
  {
    id: "3",
    lat: 12.8945,
    lng: 77.4615,
    risk: "high",
    title: "Anchepalya / Chellaqatta Link",
    desc: "Reported broken street lights after 9 PM. Caution advised.",
  },
  {
    id: "4",
    lat: 12.8840,
    lng: 77.4690,
    risk: "moderate",
    title: "NICE Road Underpass Stretch",
    desc: "Moderate evening pedestrian traffic. AI recommendation: stay on main road.",
  },
  {
    id: "5",
    lat: 12.8820,
    lng: 77.4580,
    risk: "moderate",
    title: "Kambipura Bus Stand",
    desc: "High transit crowd density with regular police mobile checkpoints.",
  },
];

export default function LiveHeatmap() {
  const [center, setCenter] = useState(BENGALURU_ORIGIN);
  const [zoom, setZoom] = useState(14);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Hotspot | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<EmergencyFacility | null>(null);

  // Focus map when user selects facility from SafeRouteNavigation
  useEffect(() => {
    const handleFocusFacility = (e: any) => {
      if (e.detail?.lat && e.detail?.lng) {
        setCenter({ lat: e.detail.lat, lng: e.detail.lng });
        setZoom(16);
        const match = EMERGENCY_FACILITIES.find(
          (f) => Math.abs(f.lat - e.detail.lat) < 0.001 && Math.abs(f.lng - e.detail.lng) < 0.001
        );
        if (match) {
          setSelectedFacility(match);
          setSelectedSpot(null);
        }
      }
    };
    window.addEventListener("safeher_focus_facility", handleFocusFacility);
    return () => window.removeEventListener("safeher_focus_facility", handleFocusFacility);
  }, []);

  // Auto-detect live location if permitted; default to Bengaluru origin
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
        },
        () => {
          // If permission denied or fallback, stay on original location
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const handleLocateUser = useCallback(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setCenter(loc);
          setZoom(15);
        },
        () => {
          setCenter(BENGALURU_ORIGIN);
          setZoom(14);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const handleRecenterOrigin = useCallback(() => {
    setCenter({ ...BENGALURU_ORIGIN });
    setZoom(14);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden bg-[#050a15] border border-white/5">
      <APIProvider apiKey={apiKey}>
        <div className="absolute inset-0">
          <Map
            style={{ width: "100%", height: "100%" }}
            center={center}
            zoom={zoom}
            disableDefaultUI={true}
            colorScheme="DARK"
            mapId="DEMO_MAP_ID"
          >
            {/* Hotspot Markers */}
            {BENGALURU_HOTSPOTS.map((spot) => (
              <AdvancedMarker
                key={spot.id}
                position={{ lat: spot.lat, lng: spot.lng }}
                onClick={() => setSelectedSpot(spot)}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.8)] relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125",
                    spot.risk === "high"
                      ? "bg-red-500 shadow-red-500/60"
                      : spot.risk === "moderate"
                      ? "bg-yellow-500 shadow-yellow-500/60"
                      : "bg-green-500 shadow-green-500/60"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-[-6px] rounded-full border animate-ping pointer-events-none",
                      spot.risk === "high"
                        ? "border-red-500/50"
                        : spot.risk === "moderate"
                        ? "border-yellow-500/50"
                        : "border-green-500/50"
                    )}
                  />
                </div>
              </AdvancedMarker>
            ))}

            {/* Verified Emergency Facilities Markers */}
            {EMERGENCY_FACILITIES.map((fac) => (
              <AdvancedMarker
                key={fac.id}
                position={{ lat: fac.lat, lng: fac.lng }}
                onClick={() => {
                  setSelectedFacility(fac);
                  setSelectedSpot(null);
                }}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.85)] relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-10",
                    fac.type === "hospital"
                      ? "bg-emerald-600 text-white shadow-emerald-500/50"
                      : fac.type === "police"
                      ? "bg-blue-600 text-white shadow-blue-500/50"
                      : "bg-purple-600 text-white shadow-purple-500/50"
                  )}
                  title={`${fac.name} (~${fac.distance_km} km)`}
                >
                  {fac.type === "hospital" ? (
                    <Hospital className="w-4 h-4" />
                  ) : fac.type === "police" ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
              </AdvancedMarker>
            ))}

            {/* User Live Marker or Anchor Marker */}
            <AdvancedMarker position={userLocation || BENGALURU_ORIGIN}>
              <div className="relative flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full border-4 border-secondary shadow-[0_0_18px_rgba(14,165,233,0.95)] z-10" />
                <div className="absolute inset-[-10px] rounded-full border-2 border-secondary animate-ping pointer-events-none" />
              </div>
            </AdvancedMarker>
          </Map>
        </div>
      </APIProvider>

      {/* Selected Facility Popup */}
      {selectedFacility && (
        <div className="absolute top-4 left-4 right-4 md:right-auto md:w-80 glass-card p-4 border border-emerald-500/40 z-20 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start mb-2">
            <span
              className={cn(
                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                selectedFacility.type === "hospital"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : selectedFacility.type === "police"
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-purple-500/20 text-purple-300 border-purple-500/30"
              )}
            >
              {selectedFacility.type === "hospital" ? (
                <Hospital className="w-3 h-3" />
              ) : selectedFacility.type === "police" ? (
                <Shield className="w-3 h-3" />
              ) : (
                <ShieldCheck className="w-3 h-3" />
              )}
              {selectedFacility.type === "hospital"
                ? "Emergency Hospital"
                : selectedFacility.type === "police"
                ? "Police Station"
                : "Safe Shelter"}
            </span>
            <button
              onClick={() => setSelectedFacility(null)}
              className="text-white/50 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <h4 className="text-white text-sm font-semibold">{selectedFacility.name}</h4>
          <p className="text-white/60 text-xs mt-1">{selectedFacility.address}</p>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">
            Distance: ~{selectedFacility.distance_km} km • 24/7 Open
          </div>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={`tel:${selectedFacility.phone}`}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Helpline</span>
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat || BENGALURU_ORIGIN.lat},${userLocation?.lng || BENGALURU_ORIGIN.lng}&destination=${selectedFacility.lat},${selectedFacility.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 px-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30 text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <span>Route</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Selected Marker Popup */}
      {selectedSpot && (
        <div className="absolute top-4 left-4 right-4 md:right-auto md:w-72 glass-card p-3.5 border border-white/10 z-20 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start mb-1.5">
            <span
              className={cn(
                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                selectedSpot.risk === "high"
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : selectedSpot.risk === "moderate"
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/30"
              )}
            >
              {selectedSpot.risk === "high"
                ? "High Risk Alert"
                : selectedSpot.risk === "moderate"
                ? "Moderate Caution"
                : "Verified Safe Zone"}
            </span>
            <button
              onClick={() => setSelectedSpot(null)}
              className="text-white/50 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <h4 className="text-white text-xs font-semibold">{selectedSpot.title}</h4>
          <p className="text-white/60 text-[11px] mt-1 leading-relaxed">{selectedSpot.desc}</p>
        </div>
      )}

      {/* Floating Legend (Matching Pic 2) */}
      <div className="absolute bottom-4 left-4 glass-card p-3 border border-white/10 z-10 pointer-events-none max-w-[200px] shadow-lg">
        <h4 className="text-white font-semibold text-xs mb-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-primary" />
          Legend
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]" />
              <span className="text-white/70">Safe Zone</span>
            </div>
            <span className="text-white/40 text-[10px]">High</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.6)]" />
              <span className="text-white/70">Moderate</span>
            </div>
            <span className="text-white/40 text-[10px]">Medium</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]" />
              <span className="text-white/70">High Risk</span>
            </div>
            <span className="text-white/40 text-[10px]">Low</span>
          </div>
        </div>
      </div>

      {/* Floating Controls (Matching Pic 2) */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
          type="button"
          onClick={handleLocateUser}
          title="Locate my position"
          className="w-10 h-10 rounded-full glass flex items-center justify-center border border-white/10 text-white hover:text-primary transition-all hover:bg-white/10 shadow-lg pointer-events-auto"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleRecenterOrigin}
          title="Recenter to original location"
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform pointer-events-auto"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

