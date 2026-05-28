import { data } from "react-router";
import type { Route } from "./+types/api.verify-age";
import { ageVerificationStorage } from "~/lib/cookie.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const session = await ageVerificationStorage.getSession(request.headers.get("Cookie"));
  session.set("age_verified", true);

  return data({ success: true }, {
    headers: {
      "Set-Cookie": await ageVerificationStorage.commitSession(session),
    }
  });
}
