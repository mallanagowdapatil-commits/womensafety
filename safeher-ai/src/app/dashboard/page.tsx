"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, MapPin, AlertTriangle, Lightbulb, Map as MapIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import LiveHeatmap from "@/components/dashboard/LiveHeatmap";
import EmergencyContactsCard from "@/components/dashboard/EmergencyContactsCard";
import ActiveEmergencyBanner from "@/components/dashboard/ActiveEmergencyBanner";
import EmergencyVoiceCallsCard from "@/components/dashboard/EmergencyVoiceCallsCard";
import EmergencyEvidenceCard from "@/components/dashboard/EmergencyEvidenceCard";
import SafeRouteNavigation from "@/components/map/SafeRouteNavigation";

export default function DashboardPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] z-[-1]" />
      
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Safety Dashboard</h1>
            <p className="text-white/60">Live monitoring, risk prediction, and emergency response for your area.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-white/80">System Active</span>
          </div>
        </div>

        {/* Active Emergency SOS Banner (Displays in real-time when an incident is active) */}
        <ActiveEmergencyBanner />

        {/* First Row: Status & Assistant */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Safety Score */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 glass-card p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px]" />
            <div className="flex justify-between items-start mb-8 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Current Area Status</h3>
                  <p className="text-white/50 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-secondary" /> Kambipura / Doddabele, Bengaluru
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold">
                SAFE ZONE
              </div>
            </div>

            <div className="flex items-end gap-6 z-10">
              <div>
                <div className="text-6xl font-bold text-white tracking-tighter">92<span className="text-2xl text-white/50">%</span></div>
                <div className="text-green-400 text-sm font-medium">Safety Score</div>
              </div>
              <div className="flex-1 space-y-2 mb-2">
                <div className="flex justify-between text-xs text-white/50">
                  <span>AI Confidence</span>
                  <span>High</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "92%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400" 
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Recommendation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 border border-white/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-white font-semibold">AI Assistant</h3>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 relative z-10">
              <p className="text-white/80 text-sm leading-relaxed mb-3">
                &ldquo;Conditions around Dr. ACS and RRMC campuses are currently optimal. Street lighting along Anchepalya stretch is reported dim. Consider main road if walking.&rdquo;
              </p>
              <Link href="/safety-map" className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
                View Route Suggestion
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Second Row: Risk Alerts & Live Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nearby Alerts */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 border border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <h3 className="text-white font-semibold">Risk Alerts</h3>
              </div>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">2km radius</span>
            </div>
            
            <div className="flex flex-col gap-4 flex-1">
              {[
                { title: "Suspicious Activity", loc: "Anchepalya Stretch", time: "10 mins ago", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
                { title: "Broken Streetlights", loc: "Doddabele Link Rd", time: "2 hours ago", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
                { title: "High Crowd Density", loc: "Kambipura Bus Stand", time: "Just now", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
              ].map((alert, i) => (
                <div key={i} className={cn("p-3 rounded-lg border flex flex-col gap-1", alert.bg, alert.border)}>
                  <div className="flex justify-between items-start">
                    <span className={cn("text-sm font-semibold", alert.color)}>{alert.title}</span>
                    <span className="text-[10px] text-white/40">{alert.time}</span>
                  </div>
                  <span className="text-xs text-white/60 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {alert.loc}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Interactive Live Heatmap */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass-card p-6 border border-white/10 flex flex-col relative min-h-[440px]"
          >
            <div className="flex items-center justify-between mb-4 z-10">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-secondary" />
                <h3 className="text-white font-semibold">Live Heatmap</h3>
              </div>
              <Link 
                href="/safety-map" 
                className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1 group"
              >
                <span>Expand Map</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
            
            <div className="flex-1 w-full relative min-h-[360px]">
              <LiveHeatmap />
            </div>
          </motion.div>
        </div>

        {/* Third Row: Safe Route Navigation & Verified Emergency Facilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <SafeRouteNavigation />
        </motion.div>

        {/* Fourth Row: Emergency Voice Calling Status (Exotel API) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <EmergencyVoiceCallsCard />
        </motion.div>

        {/* Fifth Row: Emergency Evidence Recording (Audio & Video) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <EmergencyEvidenceCard />
        </motion.div>

        {/* Sixth Row: Emergency Family Contacts & Rapid SOS Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <EmergencyContactsCard />
        </motion.div>
      </div>
    </div>
  );
}
