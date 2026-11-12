// Browser Push Notification Helper for SafeHer AI

export async function requestPushNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("Notifications not supported in this browser.");
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      registerServiceWorkerAndToken();
    }
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
}

export function getNotificationPermissionStatus(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

export async function registerServiceWorkerAndToken() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("SafeHer AI Notification Service Worker registered with scope:", registration.scope);

    // Generate local device token
    const token = "web_token_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

    // Save token to backend
    fetch("/api/notifications/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        device_type: "web",
        user_agent: navigator.userAgent,
      }),
    }).catch(() => {});
  } catch (err) {
    console.warn("Service worker registration skipped:", err);
  }
}

export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        icon: "/shield.png",
        badge: "/badge.png",
        ...options,
      });
    } catch {
      // In mobile Chrome, direct new Notification() may throw; serviceWorker registration is used instead
      navigator.serviceWorker?.ready.then((reg) => {
        reg.showNotification(title, options);
      }).catch(() => {});
    }
  }
}

