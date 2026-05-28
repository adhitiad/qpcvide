import { data, type ActionFunctionArgs } from "react-router";
import { prisma } from "../lib/db.server";
import { getUser } from "../lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const { subscription } = payload;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return data({ error: "Invalid subscription payload" }, { status: 400 });
  }

  try {
    await (prisma as any).pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: user.id,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return data({ success: true });
  } catch (error) {
    console.error("Failed to save push subscription", error);
    return data({ error: "Internal server error" }, { status: 500 });
  }
}
