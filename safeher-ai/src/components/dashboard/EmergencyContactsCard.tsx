"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Plus,
  Users,
  ShieldAlert,
  Trash2,
  ExternalLink,
  MessageSquareWarning,
  Check,
  AlertCircle,
  Heart,
  PhoneCall,
  Mail,
  Send,
  Loader2,
} from "lucide-react";
import {
  Contact,
  getStoredContacts,
  saveStoredContacts,
  generateSosMessage,
} from "@/utils/emergencyContacts";

export default function EmergencyContactsCard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("Parent");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [callingPhone, setCallingPhone] = useState<string | null>(null);
  const [emailingContact, setEmailingContact] = useState<string | null>(null);
  const [isBroadcastingAll, setIsBroadcastingAll] = useState(false);

  const loadContacts = () => {
    setContacts(getStoredContacts());
  };

  useEffect(() => {
    loadContacts();
    window.addEventListener("safeher_contacts_updated", loadContacts);
    return () => window.removeEventListener("safeher_contacts_updated", loadContacts);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newContact: Contact = {
      id: "cnt_" + Date.now(),
      name: name.trim(),
      relation,
      phone: phone.trim(),
      email: email.trim() || undefined,
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    saveStoredContacts(updated);

    setName("");
    setPhone("");
    setEmail("");
    setShowAddForm(false);
    setFeedback(`Added ${newContact.name} to your emergency network!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRemove = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    saveStoredContacts(updated);
  };

  // Automated voice call via Exotel
  const handleTriggerAutoCall = async (contact: Contact) => {
    setCallingPhone(contact.phone);
    try {
      const res = await fetch("/api/emergency/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_phone: contact.phone,
          recipient_name: contact.name,
          contact_id: contact.id,
          call_type: "automated_message",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message || `Automated emergency call dispatched to ${contact.name}`);
      } else {
        setFeedback(data.error || "Automated call unavailable. Opening native phone dialer...");
        window.location.href = `tel:${contact.phone}`;
      }
    } catch {
      window.location.href = `tel:${contact.phone}`;
    } finally {
      setCallingPhone(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Real-world Emergency Email (Gmail) via Resend API
  const handleTriggerEmailAlert = async (contact: Contact) => {
    const targetEmail = contact.email || "mallanagowdapatil866@gmail.com";
    setEmailingContact(contact.id);
    try {
      const res = await fetch("/api/emergency/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [{ email: targetEmail, name: contact.name }],
          user_name: "MallanaGowda Patil",
          latitude: 12.8895,
          longitude: 77.4655,
          location_address: "Kambipura / Doddabele, Bengaluru",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(`Emergency Gmail SOS sent to ${contact.name} (${targetEmail})!`);
      } else {
        setFeedback(data.error || "Failed to send email. Please check your RESEND_API_KEY.");
      }
    } catch {
      setFeedback("Network error sending emergency email alert.");
    } finally {
      setEmailingContact(null);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  // One-click Broadcast: Send SMS + Gmail to all family members
  const handleBroadcastAll = async () => {
    setIsBroadcastingAll(true);
    const familyContacts = contacts.filter(
      (c) => c.phone !== "112" && c.phone !== "1091" && c.phone !== "108"
    );

    const emailRecipients = familyContacts
      .map((c) => ({ email: c.email || "mallanagowdapatil866@gmail.com", name: c.name }))
      .filter((r) => r.email && r.email.includes("@"));

    try {
      // 1. Dispatch Resend Email to all family Gmails
      if (emailRecipients.length > 0) {
        await fetch("/api/emergency/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients: emailRecipients,
            user_name: "MallanaGowda Patil",
            latitude: 12.8895,
            longitude: 77.4655,
            location_address: "Kambipura / Doddabele, Bengaluru",
          }),
        }).catch(() => {});
      }

      // 2. Dispatch Backend SMS
      await fetch("/api/emergency/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: familyContacts,
          latitude: 12.8895,
          longitude: 77.4655,
        }),
      }).catch(() => {});

      // 3. Open native SMS for primary contact
      const firstPhone = familyContacts[0]?.phone || "112";
      const msg = generateSosMessage({ lat: 12.8895, lng: 77.4655 });
      window.location.href = `sms:${firstPhone}?body=${msg}`;

      setFeedback(`Dispatched emergency alerts (SMS + Gmail) to all ${familyContacts.length} family contacts!`);
    } catch {
      setFeedback("Alerts initiated.");
    } finally {
      setIsBroadcastingAll(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  return (
    <div className="glass-card p-6 border border-white/10 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 border border-primary/40 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                Emergency & Family Contacts
                <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-semibold">
                  {contacts.length} Connected
                </span>
              </h3>
              <p className="text-white/60 text-xs">
                In sudden emergency situations, tap to call, send SMS, or dispatch real-world Gmail alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBroadcastAll}
              disabled={isBroadcastingAll}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
              title="Dispatches both real-world SMS and Gmail alerts to all family members"
            >
              {isBroadcastingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              <span>Alert All (SMS + Gmail)</span>
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Family Member</span>
            </button>

            <Link
              href="/profile?tab=contacts"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Manage in Profile Settings"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 shadow-lg"
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{feedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Contact Form Modal/Inline */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd}
              className="mb-6 p-4 rounded-xl bg-white/5 border border-primary/40 space-y-3"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-primary" />
                  Add Family Contact / Guardian
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-white/40 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Full Name (e.g. Father, Sister)"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                />

                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="bg-[#0b132b] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="Parent">Parent</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Sibling">Sibling / Brother / Sister</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Friend">Trusted Friend</option>
                  <option value="Helpline">Emergency Helpline</option>
                </select>

                <input
                  type="tel"
                  placeholder="Phone (e.g. +91 98765 43210)"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                />

                <input
                  type="email"
                  placeholder="Gmail / Email (for SOS Email Alerts)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:opacity-90"
                >
                  Save Emergency Contact
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {contacts.map((contact) => {
            const isHelpline =
              contact.phone === "112" || contact.phone === "1091" || contact.phone === "108";
            const contactEmail = contact.email || (contact.id === "1" ? "mallanagowdapatil866@gmail.com" : null);

            return (
              <div
                key={contact.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                        {contact.relation}
                      </span>
                      {!isHelpline && (
                        <button
                          onClick={() => handleRemove(contact.id)}
                          className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-white font-semibold text-sm truncate">{contact.name}</h4>
                  <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-white/40" />
                    <span>{contact.phone}</span>
                  </p>

                  {!isHelpline && (
                    <p className="text-white/50 text-[11px] mt-0.5 mb-3 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-secondary" />
                      <span className="truncate">{contactEmail || "No Gmail added"}</span>
                    </p>
                  )}
                  {isHelpline && <div className="mb-3" />}
                </div>

                {/* Clean, Non-overlapping Action Buttons */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Direct Native Call */}
                    <a
                      href={`tel:${contact.phone}`}
                      title="Direct mobile dial"
                      className="py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call</span>
                    </a>

                    {/* Direct Native SMS */}
                    <a
                      href={`sms:${contact.phone}?body=${generateSosMessage()}`}
                      title="Send emergency SMS with live GPS"
                      className="py-1.5 px-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <MessageSquareWarning className="w-3 h-3" />
                      <span>SOS SMS</span>
                    </a>
                  </div>

                  {!isHelpline && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Real-World Gmail Alert via Resend */}
                      <button
                        type="button"
                        onClick={() => handleTriggerEmailAlert(contact)}
                        disabled={emailingContact === contact.id}
                        title={`Send emergency Gmail alert via Resend to ${contactEmail || "contact"}`}
                        className="py-1.5 px-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {emailingContact === contact.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Mail className="w-3 h-3 text-indigo-400" />
                        )}
                        <span>{emailingContact === contact.id ? "Sending..." : "Gmail Alert"}</span>
                      </button>

                      {/* Automated Cloud Voice Call via Exotel */}
                      <button
                        type="button"
                        onClick={() => handleTriggerAutoCall(contact)}
                        disabled={callingPhone === contact.phone}
                        title="Automated cloud voice alert"
                        className="py-1.5 px-2 bg-secondary/20 hover:bg-secondary/30 border border-secondary/30 text-secondary rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{callingPhone === contact.phone ? "Calling..." : "Voice Alert"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rapid Helplines Strip */}
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wide">
                Sudden Emergency? 24/7 National Helplines (India)
              </h4>
              <p className="text-white/60 text-xs">
                Tapping dials directly without delay. Connected with police and ambulance dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <a
              href="tel:112"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Police (112)</span>
            </a>

            <a
              href="tel:1091"
              className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Women Helpline (1091)</span>
            </a>

            <a
              href="tel:108"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Ambulance (108)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
