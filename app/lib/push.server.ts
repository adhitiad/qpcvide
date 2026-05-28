import webpush from "web-push";
import { prisma } from "./db.server";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@auiso.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
} else {
  console.warn("VAPID keys not configured. Web Push will not work.");
}

export async function sendPushNotification(userId: string, payload: any) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("Cannot send push notification: VAPID keys missing.");
    return false;
  }

  try {
    const subscriptions = await (prisma as any).pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return false;

    const payloadString = JSON.stringify(payload);
    const sendPromises = subscriptions.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payloadString);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription has expired or is no longer valid
          await (prisma as any).pushSubscription.delete({
            where: { id: sub.id },
          });
        } else {
          console.error("Error sending push notification:", error);
        }
      }
    });

    await Promise.all(sendPromises);
    return true;
  } catch (error) {
    console.error("Failed to send push notifications to user", userId, error);
    return false;
  }
}
