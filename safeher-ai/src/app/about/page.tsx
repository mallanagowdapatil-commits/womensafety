"use client";

import { motion } from "framer-motion";
import { Shield, Target, Users, Heart } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-32 pb-16 px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] z-[-1]" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent mb-6 shadow-lg shadow-primary/20"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Empowering Women with <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Data-Driven Safety</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            SafeHer AI was founded on a simple belief: everyone deserves to feel safe. By combining cutting-edge AI risk prediction with real-time community intelligence, we're building a world where women can navigate confidently.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-square md:aspect-[4/3] rounded-[2rem] overflow-hidden glass-card border border-white/10 glow-border p-2"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-10" />
            <div className="w-full h-full bg-[#0a1128] rounded-[1.5rem] flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000')] bg-cover bg-center opacity-40 mix-blend-luminosity" />
              <div className="z-20 text-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-2">Our Mission</h3>
                <p className="text-white/80 text-sm">To eliminate fear from the journey.</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {[
              { icon: Target, title: "Precision AI", desc: "Our models analyze crime data, light levels, and crowd density to provide accurate risk scores." },
              { icon: Users, title: "Community First", desc: "We rely on a trusted network of users to verify and report real-time conditions." },
              { icon: Heart, title: "Privacy Focused", desc: "Your location data is anonymized. We prioritize your privacy as much as your physical safety." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-white/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
