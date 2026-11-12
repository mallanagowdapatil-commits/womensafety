// Firebase Cloud Messaging Service Worker for SafeHer AI
// Handles background emergency notifications

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker if configured
const firebaseConfig = {
  apiKey: "AIzaSy_SafeHerDemoKey",
  authDomain: "safeher-ai.firebaseapp.com",
  projectId: "safeher-ai",
  storageBucket: "safeher-ai.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background emergency message:', payload);
    const notificationTitle = payload.notification?.title || 'SafeHer AI Emergency Alert';
    const notificationOptions = {
      body: payload.notification?.body || 'Emergency alert triggered. Tap to open SafeHer AI.',
      icon: '/icon-192.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200, 100, 400],
      data: payload.data || { url: '/dashboard' },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('[SafeHer AI] Service worker background listener initialized in standalone mode.');
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

