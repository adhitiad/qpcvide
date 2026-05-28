import { redirect, data } from "react-router";
import type { Route } from "./+types/logout";
import { signOut } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  return signOut(request);
}

export async function loader() {
  return redirect("/");
}
