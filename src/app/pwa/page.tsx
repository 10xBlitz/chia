"use client";
import { subscribeUser, unsubscribeUser, sendNotification } from "./actions";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Smartphone, Download } from "lucide-react";

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Page() {
  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PWA Settings</h1>
        <p className="text-gray-600">
          Manage your app installation and push notifications
        </p>
      </div>
      <PushNotificationManager />
      <InstallPrompt />
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  }

  async function subscribeToPush() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      await subscribeUser(serializedSub);
    } catch (error) {
      console.error("Push subscription failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      await unsubscribeUser();
    } catch (error) {
      console.error("Unsubscribe failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendTestNotification() {
    if (subscription && message.trim()) {
      setIsLoading(true);
      try {
        await sendNotification(message);
        setMessage("");
      } catch (error) {
        console.error("Send notification failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }

  if (!isSupported) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <BellOff className="h-5 w-5 text-red-500" />
            <p className="text-red-700">
              Push notifications are not supported in this browser.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                ✓ Subscribed
              </Badge>
              <p className="text-sm text-gray-600">
                You will receive push notifications from this app.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="test-message" className="text-sm font-medium">
                  Test Notification Message:
                </label>
                <Input
                  id="test-message"
                  type="text"
                  placeholder="Enter notification message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={sendTestNotification}
                  disabled={!message.trim() || isLoading}
                  className="flex-1"
                >
                  Send Test Notification
                </Button>
                <Button
                  variant="outline"
                  onClick={unsubscribeFromPush}
                  disabled={isLoading}
                >
                  <BellOff className="h-4 w-4 mr-2" />
                  Unsubscribe
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Not Subscribed</Badge>
              <p className="text-sm text-gray-600">
                Enable notifications to stay updated.
              </p>
            </div>
            <Button
              onClick={subscribeToPush}
              disabled={isLoading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Subscribe to Notifications
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setIsIOS(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-green-600" />
            <p className="text-green-700 font-medium">
              ✓ App is already installed!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Install App
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Install this app on your device for a better experience with offline
          access and quick launch.
        </p>

        {deferredPrompt ? (
          <Button onClick={handleInstallClick} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Add to Home Screen
          </Button>
        ) : (
          <Button disabled className="w-full">
            Install Option Not Available
          </Button>
        )}

        {isIOS && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>iOS Installation:</strong>
              <br />
              Tap the share button{" "}
              <span role="img" aria-label="share icon" className="mx-1">
                ⎋
              </span>{" "}
              and then &quot;Add to Home Screen&quot;{" "}
              <span role="img" aria-label="plus icon" className="mx-1">
                ➕
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
