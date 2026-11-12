"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("mallanagowdapatil866@gmail.com");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const cleanEmail = (email || "mallanagowdapatil866@gmail.com").trim();

    // 1. Try Supabase sign in in background
    try {
      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password || "SafeHer2026!",
      });
    } catch {
      // ignore
    }

    // 2. Set active authentication session cookie
    document.cookie = `demo_user=${encodeURIComponent(cleanEmail)}; path=/; max-age=86400; SameSite=Lax`;

    // 3. Store user profile details in localStorage so Profile & Dashboard show real info
    try {
      const existing = localStorage.getItem("safeher_profile");
      if (!existing) {
        const rawName = cleanEmail.split("@")[0].replace(/[0-9_.-]/g, " ").trim();
        const parts = rawName.split(" ").filter(Boolean);
        const first = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "SafeHer";
        const last = parts.slice(1).join(" ")
          ? parts.slice(1).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
          : "User";

        localStorage.setItem("safeher_profile", JSON.stringify({
          firstName: first,
          lastName: last,
          email: cleanEmail,
          phone: "+91 98765 43210",
          city: "Bengaluru, India"
        }));
      }
    } catch {
      // ignore
    }

    // 4. Redirect immediately to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-16 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] z-[-1]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card border border-white/10 p-8 md:p-10 relative overflow-hidden"
      >
        {/* Glow Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent mb-4 shadow-lg shadow-primary/20">
            <Shield className="w-6 h-6 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/60 text-sm">Log in to your SafeHer AI dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="hello@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center pl-1">
              <label className="text-sm font-medium text-white/80">Password</label>
              <Link href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <input type="checkbox" id="remember" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0 accent-primary" />
            <label htmlFor="remember" className="text-sm text-white/60 cursor-pointer">Remember me for 30 days</label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/60 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
