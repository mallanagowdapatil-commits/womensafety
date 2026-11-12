"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  User,
  Bot,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Phone,
  Trash2,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredContacts, generateSosMessage } from "@/utils/emergencyContacts";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actionPills?: Array<{
    label: string;
    href?: string;
    action?: () => void;
    variant?: "primary" | "danger" | "safe";
  }>;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sosSuccess, setSosSuccess] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("safeher_chat_history");
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Initial friendly greeting
        setMessages([
          {
            id: "welcome_1",
            role: "assistant",
            content:
              "Hello! I am **SafeHer AI**, your 24/7 personal safety assistant. How can I protect or advise you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      // ignore
    }

    // Capture location for safety engine
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserCoords({ lat: 12.8895, lng: 77.4655 }),
        { timeout: 5000 }
      );
    }
  }, []);

  // Save history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("safeher_chat_history", JSON.stringify(messages.slice(-30)));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const clearChat = () => {
    const welcome: Message = {
      id: "welcome_" + Date.now(),
      role: "assistant",
      content: "Chat history cleared. I'm ready to assist you anytime. Stay safe!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcome]);
    try {
      localStorage.setItem("safeher_chat_history", JSON.stringify([welcome]));
    } catch {
      // ignore
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: "usr_" + Date.now(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          location: userCoords || { lat: 12.8895, lng: 77.4655 },
        }),
      });

      if (!response.ok) {
        throw new Error("Chat response failed");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: "ai_" + Date.now(),
        role: "assistant",
        content: data.content || "I am with you. In an emergency, dial 112 or activate the red SOS button.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Graceful local safety fallback
      const fallbackMessage: Message = {
        id: "ai_fallback_" + Date.now(),
        role: "assistant",
        content:
          "🚨 **Safety Alert:** If you feel threatened or in distress, please head immediately to a populated, well-lit place and call **[Police 112](tel:112)** or **[Women Helpline 1091](tel:1091)**.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // 1. "I DON'T FEEL SAFE" Button Action
  const handleNotFeelingSafe = () => {
    handleSend("I don't feel safe right now. Please guide me.");
  };

  // 2. "I AM IN DANGER" Button Action
  const handleInDanger = () => {
    handleSend("I am in immediate danger! What should I do right now?");
  };

  // 3. "ACTIVATE SOS" Button Action
  const handleActivateSos = async () => {
    setIsTyping(true);
    try {
      const coords = userCoords || { lat: 12.8895, lng: 77.4655 };

      // Log incident via backend
      const incidentRes = await fetch("/api/emergency/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger_source: "chatbot",
          latitude: coords.lat,
          longitude: coords.lng,
          location_address: "Live Tracking via SafeHer AI Chatbot",
        }),
      });

      const incidentData = await incidentRes.json();
      const contacts = getStoredContacts();

      // Dispatch emergency SMS via backend
      await fetch("/api/emergency/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts,
          latitude: coords.lat,
          longitude: coords.lng,
          incident_id: incidentData?.incident?.id,
        }),
      });

      // Dispatch emergency Email / Gmail via Resend
      const emailRecipients = contacts
        .filter((c) => c.email && c.email.includes("@"))
        .map((c) => ({ email: c.email!, name: c.name }));

      const finalEmailRecipients =
        emailRecipients.length > 0
          ? emailRecipients
          : [{ email: "mallanagowdapatil866@gmail.com", name: "Family Primary" }];

      await fetch("/api/emergency/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: finalEmailRecipients,
          user_name: "SafeHer User",
          latitude: coords.lat,
          longitude: coords.lng,
          location_address: "Live Tracking via SafeHer AI Chatbot",
          incident_id: incidentData?.incident?.id,
        }),
      }).catch((err) => console.warn("Email alert error:", err));

      setSosSuccess("SOS Dispatched! Live GPS broadcasted to guardians via SMS & Gmail.");
      setTimeout(() => setSosSuccess(null), 5000);

      const sosMsg: Message = {
        id: "sos_" + Date.now(),
        role: "assistant",
        content: `🚨 **EMERGENCY SOS ACTIVATED**\n\n* **Live Coordinates Locked:** ${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E\n* **Emergency Alerts Dispatched:** Sent with Google Maps tracking link to guardians via **SMS & Gmail**.\n* **Next Step:** Stay in place if safe, or head directly into a public building.\n\n[**Tap Here to Call Police (112)**](tel:112)`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, sosMsg]);
    } catch (err) {
      console.error("SOS Activation error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // 4. "FIND SAFE PLACES" Button Action
  const handleFindSafePlaces = () => {
    handleSend("Find verified safe places, hospitals, and police booths near me.");
  };

  // 5. "EMERGENCY HELP" Button Action
  const handleEmergencyHelp = () => {
    handleSend("Show emergency helpline numbers and fast contact options.");
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        title="Open SafeHer AI Safety Assistant"
        className={cn(
          "fixed bottom-28 right-8 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.35)] border border-primary/40 group transition-all cursor-pointer",
          isOpen
            ? "bg-primary text-white"
            : "bg-gradient-to-tr from-primary to-accent hover:shadow-[0_0_35px_rgba(244,63,94,0.6)]"
        )}
      >
        <div className="absolute inset-0 rounded-full animate-ping bg-primary/25 pointer-events-none" />
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {/* Status Dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#020617]" />
      </motion.button>

      {/* Redesigned Premium Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.94 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-28 right-4 sm:right-8 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[84vh] flex flex-col glass-card border border-white/15 overflow-hidden shadow-2xl backdrop-blur-2xl rounded-3xl"
          >
            {/* Top Ambient Glow */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/15 via-transparent to-transparent pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-primary/30">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#020617] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
                    SafeHer AI
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      Assistant
                    </span>
                  </h3>
                  <p className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Protection
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SOS Feedback Banner */}
            <AnimatePresence>
              {sosSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-emerald-400 text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{sosSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 relative text-xs">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-2.5 max-w-[88%]",
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm",
                        isUser
                          ? "bg-white/15 border border-white/20"
                          : "bg-gradient-to-tr from-primary to-accent"
                      )}
                    >
                      {isUser ? <User className="w-3.5 h-3.5 text-white/80" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                    </div>

                    <div className="space-y-1">
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-md backdrop-blur-sm",
                          isUser
                            ? "bg-primary text-white rounded-tr-none font-medium"
                            : "glass-card border border-white/10 text-white/90 rounded-tl-none prose prose-invert prose-sm"
                        )}
                        dangerouslySetInnerHTML={{
                          __html: m.content
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\*(.*?)\*/g, "<em>$1</em>")
                            .replace(
                              /\[(.*?)\]\((.*?)\)/g,
                              `<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline font-semibold hover:text-white">$1</a>`
                            )
                            .replace(/\n/g, "<br />"),
                        }}
                      />
                      <span
                        className={cn(
                          "text-[10px] text-white/40 block px-1",
                          isUser ? "text-right" : "text-left"
                        )}
                      >
                        {m.timestamp}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {isTyping && (
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white flex-shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl glass-card border border-white/10 rounded-tl-none flex items-center gap-1.5">
                    <motion.div
                      className="w-1.5 h-1.5 bg-primary rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 bg-primary rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 bg-primary rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Professional Emergency Quick-Action Action Strip */}
            <div className="px-3 py-2 border-t border-white/10 bg-black/50 overflow-x-auto flex gap-1.5 no-scrollbar flex-shrink-0">
              <button
                type="button"
                onClick={handleNotFeelingSafe}
                className="px-2.5 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all"
              >
                <AlertTriangle className="w-3 h-3 text-orange-400" />
                <span>I DON&apos;T FEEL SAFE</span>
              </button>

              <button
                type="button"
                onClick={handleInDanger}
                className="px-2.5 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-500/40 text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-all"
              >
                <Flame className="w-3 h-3 text-red-400" />
                <span>I AM IN DANGER</span>
              </button>

              <button
                type="button"
                onClick={handleActivateSos}
                className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold whitespace-nowrap flex items-center gap-1 shadow-md shadow-red-600/40 hover:bg-red-700 transition-all"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>ACTIVATE SOS</span>
              </button>

              <button
                type="button"
                onClick={handleFindSafePlaces}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all"
              >
                <MapPin className="w-3 h-3 text-secondary" />
                <span>FIND SAFE PLACES</span>
              </button>

              <button
                type="button"
                onClick={handleEmergencyHelp}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all"
              >
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>EMERGENCY HELP</span>
              </button>
            </div>

            {/* Input Form Area */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="p-3 border-t border-white/10 bg-black/60 relative z-10">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message or safety inquiry..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-4 pr-11 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1.5 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-md shadow-primary/20"
                >
                  {isTyping ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
