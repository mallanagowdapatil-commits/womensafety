export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string; // Gmail / Email address for real-world emergency email alerts
  isPrimary?: boolean;
}

export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Family Primary",
    relation: "Guardian",
    phone: "+91 98765 43210",
    email: "mallanagowdapatil866@gmail.com",
    isPrimary: true,
  },
  {
    id: "2",
    name: "Police Emergency Helpline",
    relation: "Emergency",
    phone: "112",
  },
  {
    id: "3",
    name: "Women Safety Helpline",
    relation: "Support",
    phone: "1091",
  },
  {
    id: "4",
    name: "Emergency Ambulance",
    relation: "Medical",
    phone: "108",
  },
];

export function getStoredContacts(): Contact[] {
  if (typeof window === "undefined") return DEFAULT_CONTACTS;
  try {
    const saved = localStorage.getItem("safeher_profile");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.contacts) && parsed.contacts.length > 0) {
        // Ensure first contact has email if missing
        return parsed.contacts.map((c: Contact, idx: number) => {
          if (idx === 0 && !c.email && c.phone !== "112") {
            return { ...c, email: parsed.email || "mallanagowdapatil866@gmail.com" };
          }
          return c;
        });
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_CONTACTS;
}

export function saveStoredContacts(contacts: Contact[]): void {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem("safeher_profile");
    const current = saved ? JSON.parse(saved) : {};
    current.contacts = contacts;
    localStorage.setItem("safeher_profile", JSON.stringify(current));
    window.dispatchEvent(new Event("safeher_contacts_updated"));
  } catch {
    // ignore
  }
}

export function generateSosMessage(userLocation?: { lat: number; lng: number } | null): string {
  if (userLocation) {
    return encodeURIComponent(
      `🚨 EMERGENCY SOS from SafeHer AI! I need urgent help. My live GPS location: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng} - Please contact me immediately!`
    );
  }
  return encodeURIComponent(
    `🚨 EMERGENCY SOS from SafeHer AI! I am in immediate danger and need urgent help. Please reach out to me immediately!`
  );
}
