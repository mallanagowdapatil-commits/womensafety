"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, ShieldAlert, Brain, MapPin, BellRing, Route, Users, BarChart3, Star, ShieldCheck, Map, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FADE_UP_ANIMATION_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-[-1] bg-[#020617]" />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] animate-blob z-[-1]" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px] animate-blob animation-delay-2000 z-[-1]" />
      <div className="fixed top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-accent/20 blur-[150px] animate-blob animation-delay-4000 z-[-1]" />

      {/* Hero Section */}
      <section className="w-full min-h-screen flex items-center justify-center pt-24 pb-16 px-6 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-[-1]" />
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.15,
                },
              },
            }}
            className="text-center flex flex-col items-center"
          >
            <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30">
              <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-white/90">AI Risk Prediction Engine v2.0 Live</span>
            </motion.div>

            <motion.h1 variants={FADE_UP_ANIMATION_VARIANTS} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl">
              AI-Powered <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">Women Safety</span> Risk Prediction System
            </motion.h1>

            <motion.p variants={FADE_UP_ANIMATION_VARIANTS} className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
              Analyze crime patterns, environmental conditions, and live safety signals to help women make safer decisions in real time.
            </motion.p>

            <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center gap-2 group">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/safety-map" className="w-full sm:w-auto px-8 py-4 rounded-full glass border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5 text-secondary" />
                Explore Safety Map
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, type: "spring" }}
            className="mt-20 relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[2.5rem] glass-card overflow-hidden border border-white/10 shadow-2xl p-1 glow-border"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />
            <div className="w-full h-full bg-[#0a1128] rounded-[2rem] overflow-hidden relative">
              {/* Mock Dashboard UI */}
              <div className="absolute inset-0 p-6 flex flex-col opacity-80">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="px-4 py-1 rounded-full bg-white/5 text-xs text-white/50 border border-white/10">Live Monitoring</div>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-6">
                  <div className="col-span-1 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col gap-4">
                     <div className="h-8 w-1/2 bg-white/10 rounded-md animate-pulse" />
                     <div className="h-32 w-full bg-white/5 rounded-md relative overflow-hidden">
                       <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/30 to-transparent" />
                     </div>
                     <div className="h-4 w-3/4 bg-white/10 rounded-md animate-pulse" />
                  </div>
                  <div className="col-span-2 rounded-xl bg-white/5 border border-white/5 p-4 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20 mix-blend-overlay" />
                    <div className="w-32 h-32 rounded-full border border-primary/50 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
                      <div className="text-center z-10">
                         <div className="text-3xl font-bold text-white">94%</div>
                         <div className="text-xs text-primary">Safe Zone</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Advanced <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">Intelligence</span></h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">Our system uses cutting-edge machine learning to process millions of data points and ensure your safety.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Brain, title: "AI Risk Prediction", desc: "Real-time analysis of locations predicting safety scores using ML models.", color: "text-primary" },
              { icon: BarChart3, title: "Crime Data Intelligence", desc: "Historical data synthesis to identify high-risk patterns and areas.", color: "text-secondary" },
              { icon: BellRing, title: "Real-Time Alerts", desc: "Instant push notifications when entering potentially dangerous zones.", color: "text-accent" },
              { icon: Map, title: "Environmental Risk", desc: "Analysis of street lighting, crowd density, and time-based factors.", color: "text-green-400" },
              { icon: ShieldAlert, title: "Emergency SOS", desc: "One-tap emergency trigger to alert contacts and local authorities.", color: "text-red-400" },
              { icon: Route, title: "Safe Route Recon", desc: "Navigation system prioritizing safety over speed during night travel.", color: "text-purple-400" },
              { icon: Users, title: "Community Reports", desc: "Crowdsourced safety updates from trusted users nearby.", color: "text-yellow-400" },
              { icon: ShieldCheck, title: "Smart Classification", desc: "Clear Safe, Moderate, High, and Dangerous zone tagging.", color: "text-teal-400" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-card p-6 border border-white/5 hover:border-white/20 transition-all group"
              >
                <div className={cn("w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", feature.color)}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Classification Section */}
      <section id="prediction" className="w-full py-24 px-6 relative bg-black/40 border-y border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-full lg:w-1/2">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Real-Time Area <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Risk Classification</span></h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                Our AI continuously evaluates zones based on current parameters and historical data, providing easy-to-understand safety ratings before you travel.
              </p>
              <div className="space-y-4">
                {[
                  { level: "Safe Zone", conf: "98% AI Confidence", color: "from-emerald-500 to-green-400", border: "border-green-500/30", bg: "bg-green-500/10" },
                  { level: "Moderate Risk", conf: "76% AI Confidence", color: "from-yellow-500 to-amber-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
                  { level: "High Risk", conf: "82% AI Confidence", color: "from-orange-500 to-red-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
                  { level: "Dangerous Zone", conf: "95% AI Confidence", color: "from-red-600 to-rose-500", border: "border-red-500/30", bg: "bg-red-500/10" },
                ].map((risk, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={cn("flex items-center justify-between p-4 rounded-xl border glass", risk.border, risk.bg)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-3 h-3 rounded-full bg-gradient-to-r shadow-lg", risk.color, `shadow-${risk.color.split('-')[1]}/50`)} />
                      <span className="font-semibold text-white">{risk.level}</span>
                    </div>
                    <span className="text-sm text-white/50">{risk.conf}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-1/2 relative h-[500px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 blur-[100px] rounded-full" />
              <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] relative">
                <div className="absolute inset-0 border-[4px] border-white/5 rounded-full border-dashed animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 border-[2px] border-secondary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full glass border border-primary/30 flex items-center justify-center flex-col relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 animate-pulse-slow" />
                    <Brain className="w-12 h-12 text-primary mb-2 z-10" />
                    <span className="text-2xl font-bold text-white z-10">AI Active</span>
                    <span className="text-xs text-primary z-10">Analyzing 24M+ Data Points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">Works</span></h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">A seamless pipeline from data ingestion to real-time protection.</p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-white/10 -translate-y-1/2 z-0" />
            
            {[
              { step: "01", title: "Collect Data", icon: BarChart3 },
              { step: "02", title: "AI Processing", icon: Brain },
              { step: "03", title: "Predict Safety", icon: ShieldCheck },
              { step: "04", title: "Alert & Protect", icon: BellRing },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 flex flex-col items-center mb-8 md:mb-0"
              >
                <div className="w-20 h-20 rounded-full glass-card border border-primary/30 flex items-center justify-center mb-4 relative group">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity" />
                  <item.icon className="w-8 h-8 text-white group-hover:text-primary transition-colors" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-white">{item.title}</h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-24 px-6 relative bg-black/40 border-y border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Women Everywhere</span></h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">Real stories from our community members.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sarah J.", role: "Night Shift Nurse", text: "SafeHer AI changed how I commute. The real-time safety map helps me choose the brightest and safest routes home at 2 AM." },
              { name: "Emily R.", role: "College Student", text: "I feel so much more secure walking across campus. The risk alerts and emergency SOS give my parents and me peace of mind." },
              { name: "Priya M.", role: "Frequent Traveler", text: "Exploring new cities used to be daunting. Now, the AI prediction engine acts like a local friend telling me which areas to avoid." }
            ].map((test, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="glass-card p-6 border border-white/10 relative"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
                </div>
                <p className="text-white/80 mb-6 text-sm leading-relaxed">"{test.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg">
                    {test.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{test.name}</h4>
                    <span className="text-white/50 text-xs">{test.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
