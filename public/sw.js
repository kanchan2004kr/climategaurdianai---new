/* ClimateGuardian AI service worker — handles Web Push display and clicks. */

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "ClimateGuardian AI", body: event.data.text() };
  }

  const title = payload.title || "ClimateGuardian AI";
  const options = {
    body: payload.body || "",
    icon: "/icon.png",
    badge: "/icon.png",
    tag: payload.tag, // same tag replaces an existing notification instead of stacking duplicates
    data: { url: payload.url || "/alerts" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/alerts";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
