import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Button } from "./ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fetcher = useFetcher();

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (e) {
      console.error("Error checking subscription:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function subscribe() {
    setIsLoading(true);
    try {
      const vapidPublicKey = (window as any).ENV?.VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not found in window.ENV");
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send to server
      fetcher.submit(
        { subscription: JSON.stringify(subscription) },
        { method: "post", action: "/api/push-subscribe", encType: "application/json" }
      );
      
      setIsSubscribed(true);
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      alert("Failed to subscribe to notifications. Please ensure permissions are granted.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 border-night-border bg-night-card hover:bg-night-hover text-night-text"
      disabled={isLoading || isSubscribed}
      onClick={subscribe}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <>
          <Bell className="w-4 h-4 text-green-500" />
          Subscribed
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4 text-night-muted" />
          Enable Notifications
        </>
      )}
    </Button>
  );
}
