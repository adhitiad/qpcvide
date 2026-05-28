import type { Route } from "./+types/api.report";
import { data } from "react-router";
import { prisma } from "../lib/db.server";
import { getUser } from "../lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await getUser(request);
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const type = formData.get("type") as string;
  const targetId = formData.get("targetId") as string;
  const reason = formData.get("reason") as string;

  if (!type || !targetId || !reason) {
    return data({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await prisma.report.create({
      data: {
        type,
        targetId,
        reason,
        status: "PENDING",
      },
    });

    return data({ success: true });
  } catch (error) {
    console.error("Failed to create report:", error);
    return data({ error: "Internal server error" }, { status: 500 });
  }
}
