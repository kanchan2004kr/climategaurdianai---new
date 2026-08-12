"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type Support = "checking" | "unsupported" | "supported";

export function PushNotificationManager() {
  const [support, setSupport] = useState<Support>("checking");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      const ok =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        Boolean(VAPID_PUBLIC_KEY);
      if (!ok) {
        if (active) setSupport("unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (active) {
          setSupport("supported");
          setSubscribed(Boolean(sub));
        }
      } catch {
        if (active) setSupport("supported");
      }
    }
    check();
    return () => {
      active = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setStatus(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(
          permission === "denied"
            ? "Notifications are blocked. Enable them for this site in your browser settings."
            : "Notification permission was not granted."
        );
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error("Failed to save subscription");
      setSubscribed(true);
      setStatus("Notifications enabled on this device.");
    } catch {
      setStatus("Could not enable notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setStatus(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setStatus("Notifications disabled on this device.");
    } catch {
      setStatus("Could not disable notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      setStatus(res.ok ? "Test notification sent." : "Could not send a test notification.");
    } finally {
      setBusy(false);
    }
  }

  if (support === "unsupported") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted/40 px-3 py-2 text-sm text-foreground-muted">
        <BellOff className="size-4" />
        Push notifications aren&apos;t supported in this browser. In-app alerts still work.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-sm">
        <Bell className={subscribed ? "size-4 text-risk-low" : "size-4 text-foreground-muted"} />
        <span className="text-foreground">
          Push notifications are <span className="font-medium">{subscribed ? "on" : "off"}</span> for this device
        </span>
      </div>
      <p className="text-xs text-foreground-muted">
        Get notified about severe climate risk (dangerous air quality, extreme heat, flood/disaster) even when this tab
        is closed. We only ask for permission when you turn this on.
      </p>
      <div className="flex flex-wrap gap-2">
        {subscribed ? (
          <>
            <Button size="sm" variant="outline" onClick={disable} disabled={busy}>
              Disable notifications
            </Button>
            <Button size="sm" variant="ghost" onClick={sendTest} disabled={busy}>
              Send test
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={enable} disabled={busy}>
            Enable notifications
          </Button>
        )}
      </div>
      {status && <p className="text-xs text-foreground-muted">{status}</p>}
    </div>
  );
}
