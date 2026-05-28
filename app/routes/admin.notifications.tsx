import { data, Form, useActionData, useNavigation } from "react-router";
import { requireAdmin } from "../lib/auth.server";
import { sendPushNotification } from "../lib/push.server";
import { prisma } from "../lib/db.server";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export async function action({ request }: any) {
  await requireAdmin(request);
  const formData = await request.formData();

  const title = formData.get("title");
  const body = formData.get("body");
  const url = formData.get("url") || "/";

  if (!title || !body) {
    return data({ error: "Title and body are required." }, { status: 400 });
  }

  const payload = {
    title: title.toString(),
    body: body.toString(),
    url: url.toString(),
    icon: "/icon-192.png",
  };

  try {
    // Get all users who have at least one subscription
    const uniqueUsers = await (prisma as any).pushSubscription.groupBy({
      by: ["userId"],
    });

    let successCount = 0;

    // Broadcast to all uniquely subscribed users
    const broadcastPromises = uniqueUsers.map(async (u: any) => {
      const success = await sendPushNotification(u.userId, payload);
      if (success) successCount++;
    });

    await Promise.all(broadcastPromises);

    return data({
      success: true,
      message: `Notification sent to ${successCount} user(s)!`,
    });
  } catch (error) {
    console.error("Broadcast failed:", error);
    return data(
      { error: "Failed to broadcast notifications." },
      { status: 500 },
    );
  }
}

export default function AdminNotifications() {
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-serif font-bold mb-6 text-night-accent">
        Broadcast Notification
      </h2>
      <p className="text-night-muted mb-8">
        Send a web push notification to all users who have subscribed.
      </p>

      {actionData?.success && (
        <div className="bg-green-500/20 border border-green-500 text-green-500 p-4 rounded-lg mb-6">
          {actionData.message}
        </div>
      )}

      {actionData?.error && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
          {actionData.error}
        </div>
      )}

      <Form
        method="post"
        className="space-y-6 bg-night-card p-6 rounded-xl border border-night-border"
      >
        <div>
          <label className="block text-sm font-medium mb-2 text-night-text">
            Title
          </label>
          <Input
            name="title"
            placeholder="e.g. New Video Available!"
            required
            className="bg-night-bg border-night-border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-night-text">
            Message Body
          </label>
          <Input
            name="body"
            placeholder="e.g. Check out the latest exclusive content now."
            required
            className="bg-night-bg border-night-border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-night-text">
            Action URL (Optional)
          </label>
          <Input
            name="url"
            placeholder="e.g. /video/new-video-slug"
            className="bg-night-bg border-night-border"
          />
          <p className="text-xs text-night-muted mt-2">
            Where the user goes when they click the notification.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-night-accent hover:bg-night-accent-light text-white font-bold"
        >
          {isSubmitting ? "Sending..." : "Send Broadcast"}
        </Button>
      </Form>
    </div>
  );
}
