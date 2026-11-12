"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Menu, X, User as UserIcon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      // Check for demo user cookie
      if (typeof document !== "undefined" && document.cookie.includes("demo_user=")) {
        setIsLoggedIn(true);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        // Supabase unreachable
      }
    };
    checkUser();

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const authListener = supabase.auth.onAuthStateChange((event, session) => {
        const hasDemo = typeof document !== "undefined" && document.cookie.includes("demo_user=");
        setIsLoggedIn(!!session || hasDemo);
      });
      subscription = authListener.data.subscription;
    } catch {
      // Supabase unreachable
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    document.cookie = "demo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    setIsLoggedIn(false);
    router.push("/");
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/#features" },
    { name: "AI Prediction", href: "/#prediction" },
    { name: "Safety Map", href: "/safety-map" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-[#020617]/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/40 py-3.5"
          : "bg-[#020617]/85 backdrop-blur-md border-b border-white/5 py-5"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <Shield className="w-6 h-6 text-white" />
          </motion.div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 group-hover:to-primary transition-all duration-300">
            SafeHer <span className="text-primary glow-text">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-white/70 hover:text-white hover:text-shadow-sm transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons / Profile */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full transition-all border border-white/10 hover:border-primary/50"
              >
                Dashboard
              </Link>
              <Link href="/profile" className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center hover:border-primary transition-all">
                <UserIcon className="w-5 h-5 text-primary" />
              </Link>
              <button onClick={handleSignOut} className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-all text-red-500">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="relative group text-sm font-medium text-white px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden absolute top-full left-0 right-0 glass border-t border-white/10 p-6 flex flex-col gap-4"
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-white/80 hover:text-primary transition-colors py-2 border-b border-white/5"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex flex-col gap-3 mt-4">
            {isLoggedIn ? (
               <>
                 <Link href="/dashboard" className="text-center bg-white/10 py-3 rounded-xl">Dashboard</Link>
                 <Link href="/profile" className="text-center border border-white/10 py-3 rounded-xl">Profile</Link>
                 <button onClick={handleSignOut} className="text-center text-red-400 border border-red-500/30 bg-red-500/10 py-3 rounded-xl">Sign Out</button>
               </>
            ) : (
              <>
                <Link href="/login" className="text-center py-3 border border-white/10 rounded-xl hover:bg-white/5">
                  Log in
                </Link>
                <Link href="/register" className="text-center py-3 bg-gradient-to-r from-primary to-accent rounded-xl text-white font-medium">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
