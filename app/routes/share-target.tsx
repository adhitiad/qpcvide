import type { Route } from "./+types/share-target";
import { redirect } from "react-router";
import { prisma } from "../lib/db.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const formData = await request.formData();
  const url = formData.get("url") as string;
  const title = formData.get("title") as string;
  const text = formData.get("text") as string;

  if (!url) {
    return redirect("/");
  }

  try {
    // If it's an internal link (e.g. auiso.com/video/something), redirect to it
    const requestUrl = new URL(request.url);
    const sharedUrl = new URL(url);

    if (sharedUrl.hostname === requestUrl.hostname) {
      return redirect(sharedUrl.pathname + sharedUrl.search);
    }
  } catch (e) {
    // Ignore invalid URLs
  }

  // Otherwise, it's an external link or text, save it as a SharedLink
  try {
    await prisma.sharedLink.create({
      data: {
        url,
        title,
        text,
      }
    });
  } catch (e) {
    console.error("Failed to save shared link", e);
  }

  // Redirect to home after saving
  return redirect("/?shared=success");
}

// Optional: GET method fallback or redirect
export async function loader() {
  return redirect("/");
}
