import Link from "next/link";
import { Shield, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md pt-16 pb-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-primary/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                SafeHer <span className="text-primary glow-text">AI</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              Empowering women with real-time AI risk prediction and environmental intelligence to ensure safer journeys everywhere.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Platform</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/safety-map" className="text-white/60 hover:text-primary transition-colors text-sm">Safety Map</Link></li>
              <li><Link href="/dashboard" className="text-white/60 hover:text-primary transition-colors text-sm">AI Dashboard</Link></li>
              <li><Link href="/#prediction" className="text-white/60 hover:text-primary transition-colors text-sm">Risk Prediction</Link></li>
              <li><Link href="/#features" className="text-white/60 hover:text-primary transition-colors text-sm">Features</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/about" className="text-white/60 hover:text-primary transition-colors text-sm">About Us</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-primary transition-colors text-sm">Contact</Link></li>
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors text-sm">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Legal</h4>
            <ul className="flex flex-col gap-3">
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors text-sm">Data Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} SafeHer AI. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="text-white/40 text-sm flex items-center gap-1">
              Made with <span className="text-primary animate-pulse">❤️</span> for women's safety
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
