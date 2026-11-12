// SafeHer AI Service Worker for Push Notifications and Offline Resilience
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || '🚨 SafeHer Emergency Alert: Immediate Attention Required.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200, 100, 200],
      data: {
        url: data.url || '/dashboard',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title || 'SafeHer AI Emergency', options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/dashboard')
  );
});

