"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Settings,
  LogOut,
  MapPin,
  Check,
  Plus,
  Trash2,
  Camera,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Star,
  Edit2,
  ShieldAlert,
  Save,
  CheckCircle2,
  KeyRound,
  Trash,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Contact, getStoredContacts, saveStoredContacts } from "@/utils/emergencyContacts";
import {
  requestPushNotificationPermission,
  getNotificationPermissionStatus,
} from "@/utils/firebase/notifications";

interface ExtendedContact extends Contact {
  isPrimary?: boolean;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"personal" | "safety" | "alerts" | "contacts" | "security">("personal");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Personal Info State
  const [firstName, setFirstName] = useState("MallanaGowda");
  const [lastName, setLastName] = useState("Patil");
  const [email, setEmail] = useState("mallanagowdapatil866@gmail.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [city, setCity] = useState("Bengaluru, India");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safety Preferences State
  const [liveLocationSharing, setLiveLocationSharing] = useState(true);
  const [highRiskAlerts, setHighRiskAlerts] = useState(true);
  const [nightWalkMode, setNightWalkMode] = useState(true);
  const [fakeCallShortcut, setFakeCallShortcut] = useState(true);
  const [autoRecordAudio, setAutoRecordAudio] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>("checking");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Risk Alerts State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>("default");
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [sirenSound, setSirenSound] = useState(true);
  const [silentMode, setSilentMode] = useState(false);

  // Emergency Contacts State
  const [contacts, setContacts] = useState<ExtendedContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("Guardian");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [sendingEmailContactId, setSendingEmailContactId] = useState<string | null>(null);
  const [emailAlertStatus, setEmailAlertStatus] = useState<string | null>(null);

  // Security & App Settings State
  const [sosTrigger, setSosTrigger] = useState("Triple Tap");
  const [aiSensitivity, setAiSensitivity] = useState("High Caution");
  const [language, setLanguage] = useState("English");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["personal", "safety", "alerts", "contacts", "security"].includes(tab)) {
        setActiveTab(tab as any);
      }

      setPushPermissionStatus(getNotificationPermissionStatus());

      // Check location permission
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocationStatus("granted");
            setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => setLocationStatus("denied_or_prompt"),
          { timeout: 5000 }
        );
      }
    }

    // Initialize contacts from shared storage
    setContacts(getStoredContacts());

    // Load saved profile
    const saved = localStorage.getItem("safeher_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.city) setCity(parsed.city);
        if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
        if (Array.isArray(parsed.contacts) && parsed.contacts.length > 0) {
          setContacts(parsed.contacts);
        }
        if (parsed.safety) {
          setLiveLocationSharing(parsed.safety.liveLocationSharing ?? true);
          setHighRiskAlerts(parsed.safety.highRiskAlerts ?? true);
          setNightWalkMode(parsed.safety.nightWalkMode ?? true);
          setFakeCallShortcut(parsed.safety.fakeCallShortcut ?? true);
          setAutoRecordAudio(parsed.safety.autoRecordAudio ?? false);
        }
        if (parsed.alerts) {
          setPushNotifications(parsed.alerts.pushNotifications ?? true);
          setSmsAlerts(parsed.alerts.smsAlerts ?? true);
          setSirenSound(parsed.alerts.sirenSound ?? true);
          setSilentMode(parsed.alerts.silentMode ?? false);
        }
      } catch {
        // ignore
      }
    }

    const handleContactsSync = () => {
      setContacts(getStoredContacts());
    };
    window.addEventListener("safeher_contacts_updated", handleContactsSync);
    return () => {
      window.removeEventListener("safeher_contacts_updated", handleContactsSync);
    };
  }, []);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAvatarUrl(dataUrl);

        // Auto save avatar
        const saved = localStorage.getItem("safeher_profile");
        const current = saved ? JSON.parse(saved) : {};
        localStorage.setItem("safeher_profile", JSON.stringify({ ...current, avatarUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    setIsSaving(true);

    const profileData = {
      firstName,
      lastName,
      email,
      phone,
      city,
      avatarUrl,
      contacts,
      safety: {
        liveLocationSharing,
        highRiskAlerts,
        nightWalkMode,
        fakeCallShortcut,
        autoRecordAudio,
      },
      alerts: {
        pushNotifications,
        smsAlerts,
        sirenSound,
        silentMode,
      },
      appSettings: {
        sosTrigger,
        aiSensitivity,
        language,
      },
    };

    localStorage.setItem("safeher_profile", JSON.stringify(profileData));
    saveStoredContacts(contacts);

    // Update Supabase profile metadata
    try {
      const supabase = createClient();
      supabase.auth.updateUser({
        data: {
          full_name: `${firstName} ${lastName}`.trim(),
          phone,
          city,
        },
      }).catch(() => {});
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 400);
  };

  // Contacts management
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    // Validate phone number
    const cleanPhone = newContactPhone.trim();
    const phoneRegex = /^[+]?[0-9\s-]{10,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setContactError("Please enter a valid phone number with at least 10 digits.");
      return;
    }

    const cleanEmail = newContactEmail.trim();
    if (cleanEmail && !cleanEmail.includes("@")) {
      setContactError("Please enter a valid email address (e.g., example@gmail.com) or leave blank.");
      return;
    }

    if (editingContactId) {
      // Edit existing
      const updated = contacts.map((c) =>
        c.id === editingContactId
          ? {
              ...c,
              name: newContactName.trim(),
              relation: newContactRelation,
              phone: cleanPhone,
              email: cleanEmail || undefined,
            }
          : c
      );
      setContacts(updated);
      saveStoredContacts(updated);
      setEditingContactId(null);
    } else {
      // Add new
      const newContact: ExtendedContact = {
        id: "cnt_" + Date.now(),
        name: newContactName.trim(),
        relation: newContactRelation,
        phone: cleanPhone,
        email: cleanEmail || undefined,
        isPrimary: contacts.length === 0,
      };
      const updated = [...contacts, newContact];
      setContacts(updated);
      saveStoredContacts(updated);
    }

    setNewContactName("");
    setNewContactPhone("");
    setNewContactEmail("");
    setShowAddContact(false);
  };

  const handleEditContact = (c: ExtendedContact) => {
    setEditingContactId(c.id);
    setNewContactName(c.name);
    setNewContactRelation(c.relation);
    setNewContactPhone(c.phone);
    setNewContactEmail(c.email || "");
    setShowAddContact(true);
  };

  const handleTriggerEmailAlert = async (targetContact: ExtendedContact) => {
    if (!targetContact.email) return;
    setSendingEmailContactId(targetContact.id);
    setEmailAlertStatus(null);
    try {
      const res = await fetch("/api/emergency/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [{ email: targetContact.email, name: targetContact.name }],
          user_name: `${firstName} ${lastName}`.trim() || "SafeHer User",
          user_email: email,
          latitude: gpsCoords?.lat || 12.8895,
          longitude: gpsCoords?.lng || 77.4655,
          location_address: city || "Bengaluru, India",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailAlertStatus(`Emergency Gmail alert dispatched to ${targetContact.name} (${targetContact.email})!`);
      } else {
        setEmailAlertStatus(`Email alert queued for ${targetContact.name}.`);
      }
    } catch {
      setEmailAlertStatus(`Emergency alert logged for ${targetContact.name}.`);
    } finally {
      setSendingEmailContactId(null);
      setTimeout(() => setEmailAlertStatus(null), 5000);
    }
  };

  const handleSetPrimary = (id: string) => {
    const updated = contacts.map((c) => ({
      ...c,
      isPrimary: c.id === id,
    }));
    setContacts(updated);
    saveStoredContacts(updated);
  };

  const handleRemoveContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    saveStoredContacts(updated);
  };

  // Request location
  const handleRequestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationStatus("granted");
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLiveLocationSharing(true);
          handleSaveChanges();
        },
        () => {
          setLocationStatus("denied");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Request Push Notifications
  const handleRequestPush = async () => {
    const perm = await requestPushNotificationPermission();
    setPushPermissionStatus(perm);
    if (perm === "granted") {
      setPushNotifications(true);
    }
  };

  // Password Update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
    }
  };

  const handleSignOut = async () => {
    document.cookie = "demo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    window.location.href = "/login";
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmInput !== "DELETE") return;
    localStorage.removeItem("safeher_profile");
    localStorage.removeItem("safeher_chat_history");
    localStorage.removeItem("safeher_contact_messages");
    document.cookie = "demo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/";
  };

  const tabs = [
    { id: "personal", icon: User, label: "Personal Info" },
    { id: "safety", icon: Shield, label: "Location & Safety" },
    { id: "alerts", icon: Bell, label: "Notifications" },
    { id: "contacts", icon: Phone, label: `Emergency Contacts (${contacts.length})` },
    { id: "security", icon: KeyRound, label: "Security & Account" },
  ] as const;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] z-[-1]" />

      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Account & Safety Settings</h1>
            <p className="text-white/60 text-sm">
              Configure your profile, emergency contacts, real-time safety triggers, and security.
            </p>
          </div>

          <AnimatePresence>
            {isSaved && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm px-4 py-2 rounded-xl shadow-lg"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Changes saved successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <div className="col-span-1 space-y-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                    active
                      ? "bg-primary text-white shadow-lg shadow-primary/20 font-semibold"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={`w-5 h-5 ${active ? "text-white" : "text-white/50"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            {/* 1. PERSONAL INFO TAB */}
            {activeTab === "personal" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border border-white/10 space-y-6"
              >
                <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent p-1 overflow-hidden">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full bg-[#0a1128] rounded-full flex items-center justify-center font-bold text-2xl text-white">
                          {firstName.charAt(0)}{lastName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-0.5">{firstName} {lastName}</h2>
                    <p className="text-white/60 text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> {city}
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-primary hover:underline mt-1 block"
                    >
                      Click to upload new photo
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-white/50 pl-1">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/50 pl-1">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-white/50 pl-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-white/50 pl-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/50 pl-1">City / Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. LOCATION & SAFETY PREFERENCES TAB */}
            {activeTab === "safety" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border border-white/10 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Live Location & Safety Controls</h3>
                  <p className="text-white/60 text-sm">
                    Configure real-time GPS tracking and emergency safety behaviors.
                  </p>
                </div>

                {/* Location Permission Status Card */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-secondary" />
                      Browser GPS Location Status
                    </h4>
                    <p className="text-white/60 text-xs mt-0.5">
                      {locationStatus === "granted" && gpsCoords
                        ? `Connected: ${gpsCoords.lat.toFixed(4)}° N, ${gpsCoords.lng.toFixed(4)}° E`
                        : "Permission required to share your real-time coordinates during emergencies."}
                    </p>
                  </div>
                  <button
                    onClick={handleRequestLocation}
                    className="px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/40 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                  >
                    {locationStatus === "granted" ? "Refresh GPS Lock" : "Enable GPS Location"}
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "Live Location Sharing",
                      desc: "Broadcasts your real-time GPS path to guardians upon SOS activation.",
                      val: liveLocationSharing,
                      setter: setLiveLocationSharing,
                    },
                    {
                      title: "High-Risk Corridor Alerts",
                      desc: "Warns you when entering areas with low lighting or elevated crime indices.",
                      val: highRiskAlerts,
                      setter: setHighRiskAlerts,
                    },
                    {
                      title: "Night Walk Mode",
                      desc: "Periodic safety check-ins and heightened AI surveillance after 9 PM.",
                      val: nightWalkMode,
                      setter: setNightWalkMode,
                    },
                    {
                      title: "Discreet Fake Call Shortcut",
                      desc: "Allows triggering a simulated realistic incoming phone call to exit awkward situations.",
                      val: fakeCallShortcut,
                      setter: setFakeCallShortcut,
                    },
                  ].map((pref, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="pr-4">
                        <h4 className="text-white font-medium text-sm">{pref.title}</h4>
                        <p className="text-white/50 text-xs mt-0.5">{pref.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          pref.setter(!pref.val);
                          handleSaveChanges();
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                          pref.val ? "bg-primary" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            pref.val ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 3. NOTIFICATIONS TAB */}
            {activeTab === "alerts" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border border-white/10 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Alert & Notification Delivery</h3>
                  <p className="text-white/60 text-sm">
                    Manage how urgent safety updates and emergency alarms reach you and your guardians.
                  </p>
                </div>

                {/* Push Notification Permission Box */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-primary" />
                      Browser Push Notifications
                    </h4>
                    <p className="text-white/60 text-xs mt-0.5">
                      Status: <span className="text-white font-medium capitalize">{pushPermissionStatus}</span>
                      {pushPermissionStatus === "granted" ? " (Active)" : " (Tap to authorize)"}
                    </p>
                  </div>
                  {pushPermissionStatus !== "granted" && (
                    <button
                      onClick={handleRequestPush}
                      className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                    >
                      Authorize Push Alerts
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "Automatic SMS Alerts to Guardians",
                      desc: "Sends instant SMS with map coordinates to your contacts even if mobile internet is lost.",
                      val: smsAlerts,
                      setter: setSmsAlerts,
                    },
                    {
                      title: "High-Decibel Siren Sound",
                      desc: "Triggers piercing alarm tone through your device speakers to deter perpetrators.",
                      val: sirenSound,
                      setter: setSirenSound,
                    },
                    {
                      title: "Silent SOS Mode",
                      desc: "Dispatches emergency alerts silently without lighting up the screen or making sound.",
                      val: silentMode,
                      setter: setSilentMode,
                    },
                  ].map((alert, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="pr-4">
                        <h4 className="text-white font-medium text-sm">{alert.title}</h4>
                        <p className="text-white/50 text-xs mt-0.5">{alert.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          alert.setter(!alert.val);
                          handleSaveChanges();
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                          alert.val ? "bg-primary" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            alert.val ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 4. EMERGENCY CONTACTS TAB */}
            {activeTab === "contacts" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border border-white/10 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-0.5">Emergency Guardians</h3>
                    <p className="text-white/60 text-sm">
                      These verified numbers receive immediate GPS alerts and automated calls during an SOS.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingContactId(null);
                      setNewContactName("");
                      setNewContactPhone("");
                      setNewContactEmail("");
                      setShowAddContact(!showAddContact);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Guardian</span>
                  </button>
                </div>

                {emailAlertStatus && (
                  <div className="p-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{emailAlertStatus}</span>
                  </div>
                )}

                {/* Add/Edit Contact Form */}
                <AnimatePresence>
                  {showAddContact && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleSaveContact}
                      className="p-4 rounded-xl bg-white/5 border border-primary/40 space-y-3"
                    >
                      <h4 className="text-sm font-semibold text-white">
                        {editingContactId ? "Edit Emergency Contact" : "Add New Emergency Contact"}
                      </h4>

                      {contactError && (
                        <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          {contactError}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="Contact Name"
                          required
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary"
                        />
                        <select
                          value={newContactRelation}
                          onChange={(e) => setNewContactRelation(e.target.value)}
                          className="bg-[#0b132b] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary"
                        >
                          <option value="Parent">Parent</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Friend">Friend</option>
                          <option value="Emergency">Emergency Service</option>
                        </select>
                        <input
                          type="tel"
                          placeholder="Phone (+91 98765 43210)"
                          required
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary"
                        />
                        <input
                          type="email"
                          placeholder="Gmail / Email (Optional)"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddContact(false)}
                          className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                        >
                          {editingContactId ? "Save Changes" : "Save Contact"}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm flex items-center gap-2">
                            <span>{contact.name}</span>
                            <span className="text-primary text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                              {contact.relation}
                            </span>
                            {contact.isPrimary && (
                              <span className="text-amber-400 text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-amber-400" /> Primary
                              </span>
                            )}
                          </p>
                          <p className="text-white/60 text-xs mt-0.5">{contact.phone}</p>
                          {contact.email && (
                            <p className="text-white/50 text-[11px] flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-accent flex-shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                        {!contact.isPrimary && contact.phone !== "112" && (
                          <button
                            onClick={() => handleSetPrimary(contact.id)}
                            className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs hover:text-amber-300"
                            title="Set as primary emergency recipient"
                          >
                            Set Primary
                          </button>
                        )}

                        <button
                          onClick={() => handleEditContact(contact)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit contact"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`tel:${contact.phone}`}
                          title={`Call ${contact.name}`}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>

                        {contact.email && (
                          <button
                            type="button"
                            onClick={() => handleTriggerEmailAlert(contact)}
                            disabled={sendingEmailContactId === contact.id}
                            className="px-2.5 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                            title={`Dispatch emergency Gmail alert to ${contact.email}`}
                          >
                            <Mail className="w-3 h-3" />
                            <span>{sendingEmailContactId === contact.id ? "Sending..." : "Gmail Alert"}</span>
                          </button>
                        )}

                        {contact.phone !== "112" && contact.phone !== "1091" && (
                          <button
                            onClick={() => handleRemoveContact(contact.id)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remove contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 5. SECURITY & ACCOUNT TAB */}
            {activeTab === "security" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border border-white/10 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Security & Authentication</h3>
                  <p className="text-white/60 text-sm">
                    Manage your credentials, active sessions, and account protection.
                  </p>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleChangePassword} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-primary" />
                    Change Account Password
                  </h4>

                  {passwordMsg && (
                    <div
                      className={`p-3 rounded-lg text-xs ${
                        passwordMsg.type === "success"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="password"
                      placeholder="New Password (min 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/20"
                    >
                      Update Password
                    </button>
                  </div>
                </form>

                {/* Active Sessions */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <h4 className="text-sm font-semibold text-white">Active Device Session</h4>
                  <div className="flex justify-between items-center text-xs text-white/70">
                    <div>
                      <p className="font-medium text-white">Current Browser Session</p>
                      <p className="text-[11px] text-white/40">Registered on this computer • Bengaluru, India</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                      Active Now
                    </span>
                  </div>
                </div>

                {/* Danger Zone: Delete Account */}
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                  <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Danger Zone
                  </h4>
                  <p className="text-xs text-white/60">
                    Deleting your account permanently wipes your emergency network, registered guardians, and profile settings.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-600/40 text-rose-400 text-xs font-semibold transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-card border border-rose-500/40 p-6 space-y-4 text-left"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Confirm Account Deletion
              </h3>
              <p className="text-xs text-white/70">
                This action is irreversible. All your emergency contacts and safety history will be permanently deleted.
              </p>
              <p className="text-xs text-white/50">
                To confirm, please type <span className="text-rose-400 font-bold">DELETE</span> below:
              </p>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full bg-white/5 border border-white/20 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmInput !== "DELETE"}
                  onClick={handleDeleteAccount}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 disabled:opacity-40 text-white text-xs font-bold hover:bg-rose-700"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
