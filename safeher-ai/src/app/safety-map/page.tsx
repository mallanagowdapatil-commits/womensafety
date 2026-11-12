"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Crosshair, Navigation, AlertCircle, Compass, X } from "lucide-react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { cn } from "@/lib/utils";
import SafeRouteNavigation from "@/components/map/SafeRouteNavigation";

// Original location from user screenshot (Dr. ACS College / RRMC / Doddabele, Bengaluru)
const BENGALURU_ORIGIN = { lat: 12.8895, lng: 77.4655 };

// Hotspots around original location
const riskHotspots = [
  { lat: 12.8913, lng: 77.4660, risk: "safe", title: "Dr. ACS College Campus" },
  { lat: 12.8898, lng: 77.4632, risk: "safe", title: "RRMC Hospital Zone" },
  { lat: 12.8945, lng: 77.4615, risk: "high", title: "Anchepalya Link" },
  { lat: 12.8840, lng: 77.4690, risk: "moderate", title: "NICE Road Underpass" },
  { lat: 12.8820, lng: 77.4580, risk: "moderate", title: "Kambipura Bus Stand" },
];

export default function SafetyMapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [center, setCenter] = useState(BENGALURU_ORIGIN);
  const [zoom, setZoom] = useState(14);
  const [showSafeRoutes, setShowSafeRoutes] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
        },
        () => {
          // Keep default Bengaluru origin
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const locateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          setCenter(newLocation);
          setZoom(15);
        },
        () => {
          setCenter(BENGALURU_ORIGIN);
          setZoom(14);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const recenterOrigin = () => {
    setCenter(BENGALURU_ORIGIN);
    setZoom(14);
  };

  return (
    <div className="min-h-screen pt-24 pb-0 flex flex-col h-screen overflow-hidden">
      <div className="container mx-auto px-6 mb-4 flex-shrink-0 z-10">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass p-4 rounded-2xl border border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Global Safety Map</h1>
            <p className="text-white/60 text-sm">Real-time risk zones and AI-analyzed routes.</p>
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text"
                placeholder="Search location (e.g. Kengeri, Kambipura)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowSafeRoutes(!showSafeRoutes)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                showSafeRoutes
                  ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/30"
                  : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Compass className="w-4 h-4 text-secondary" />
              <span>Safe Routes</span>
            </button>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Safe Routes Drawer */}
      {showSafeRoutes && (
        <div className="container mx-auto px-6 mb-4 z-20 max-h-[48vh] overflow-y-auto">
          <SafeRouteNavigation
            onSelectDestination={(lat, lng) => {
              setCenter({ lat, lng });
              setZoom(16);
            }}
          />
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 relative bg-[#050a15] overflow-hidden rounded-t-[2rem] border-t border-white/10">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
          <div className="absolute inset-0">
            <Map 
              style={{ width: '100%', height: '100%' }}
              center={center} 
              zoom={zoom} 
              disableDefaultUI={true}
              colorScheme="DARK"
              mapId="DEMO_MAP_ID"
            >
              {riskHotspots.map((spot, i) => (
                <AdvancedMarker key={i} position={{ lat: spot.lat, lng: spot.lng }}>
                  <div className={cn(
                    "w-7 h-7 rounded-full border-2 border-white shadow-[0_0_20px_rgba(0,0,0,0.8)] relative flex items-center justify-center cursor-pointer",
                    spot.risk === "high"
                      ? "bg-red-500 shadow-red-500/60"
                      : spot.risk === "moderate"
                      ? "bg-yellow-500 shadow-yellow-500/60"
                      : "bg-green-500 shadow-green-500/60"
                  )}>
                    <div className={cn(
                      "absolute inset-[-8px] rounded-full border animate-ping pointer-events-none",
                      spot.risk === "high"
                        ? "border-red-500/50"
                        : spot.risk === "moderate"
                        ? "border-yellow-500/50"
                        : "border-green-500/50"
                    )} />
                  </div>
                </AdvancedMarker>
              ))}

              {/* User Marker or Default Origin Anchor */}
              <AdvancedMarker position={userLocation || BENGALURU_ORIGIN}>
                <div className="relative flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full border-4 border-secondary shadow-[0_0_18px_rgba(14,165,233,0.95)] z-10" />
                  <div className="absolute inset-[-10px] rounded-full border-2 border-secondary animate-ping pointer-events-none" />
                </div>
              </AdvancedMarker>
            </Map>
          </div>
        </APIProvider>
        
        {/* Floating UI Elements */}
        <div className="absolute bottom-32 left-6 right-6 md:right-auto md:w-80 glass-card p-4 border border-white/10 z-10 pointer-events-none">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            Legend
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                <span className="text-white/70">Safe Zone</span>
              </div>
              <span className="text-white/40">High</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                <span className="text-white/70">Moderate</span>
              </div>
              <span className="text-white/40">Medium</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                <span className="text-white/70">High Risk</span>
              </div>
              <span className="text-white/40">Low</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-32 right-6 flex flex-col gap-3 z-10">
          <button 
            type="button"
            onClick={locateUser}
            title="Locate my position"
            className="w-12 h-12 rounded-full glass flex items-center justify-center border border-white/10 text-white hover:text-primary transition-colors hover:bg-white/5 shadow-lg pointer-events-auto"
          >
            <Crosshair className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={recenterOrigin}
            title="Recenter to original location"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform pointer-events-auto"
          >
            <Navigation className="w-5 h-5 ml-[-2px] mb-[-2px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
