import { Form, Link, useActionData, useNavigation } from "react-router";
import { data, redirect } from "react-router";
import { z } from "zod";
import { prisma } from "../lib/db.server";
import { signIn } from "../lib/auth.server";
import type { Route } from "./+types/login";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Login - qpcvide" },
    { name: "description", content: "Login to your account" },
  ];
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const payload = Object.fromEntries(formData);

  const result = loginSchema.safeParse(payload);

  if (!result.success) {
    return data(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { identifier, password } = result.data;

  // Search by either email or username
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    return data(
      {
        errors: {
          identifier: [
            "Invalid credentials: Username or email is not registered",
          ],
        } as Record<string, string[] | undefined>,
      },
      { status: 400 },
    );
  }

  const authResult = await signIn(user.email, password, request);

  if (authResult.error) {
    return data(
      {
        errors: {
          identifier: [`Invalid credentials: ${authResult.error}`],
        } as Record<string, string[] | undefined>,
      },
      { status: 400 },
    );
  }

  return redirect("/", {
    headers: authResult.headers,
  });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md bg-night-card border-night-border text-night-text">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-night-accent text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-night-muted text-center">
            Login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="identifier">
                Email or Username
              </label>
              <Input
                id="identifier"
                name="identifier"
                placeholder="m.otaku@example.com"
                className="bg-night-bg border-night-border focus:ring-night-accent"
                autoComplete="username"
              />
              {actionData?.errors?.identifier && (
                <p className="text-sm text-red-500">
                  {actionData.errors.identifier[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                className="bg-night-bg border-night-border focus:ring-night-accent"
                autoComplete="current-password"
              />
              {actionData?.errors?.password && (
                <p className="text-sm text-red-500">
                  {actionData.errors.password[0]}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-night-accent hover:bg-night-accent-light text-white transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-night-muted">
            Don't have an account?{" "}
            <Link to="/register" className="text-night-accent hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
