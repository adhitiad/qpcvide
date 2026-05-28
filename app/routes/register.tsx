import { Form, Link, useActionData, useNavigation } from "react-router";
import { data, redirect } from "react-router";
import { z } from "zod";
import { prisma } from "../lib/db.server";
import { signUp } from "../lib/auth.server";
import type { Route } from "./+types/register";

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

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username too long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Register - qpcvide" },
    { name: "description", content: "Create a new account on qpcvide" },
  ];
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const payload = Object.fromEntries(formData);

  const result = registerSchema.safeParse(payload);

  if (!result.success) {
    return data(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { username, email, password } = result.data;

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    return data(
      {
        errors: {
          email:
            existingUser.email === email ? ["Email already exists"] : undefined,
          username:
            existingUser.username === username
              ? ["Username already exists"]
              : undefined,
        } as Record<string, string[] | undefined>,
      },
      { status: 400 },
    );
  }

  const authResult = await signUp(email, password, username, request);

  if (authResult.error) {
    return data(
      {
        errors: {
          email: [authResult.error],
        } as Record<string, string[] | undefined>,
      },
      { status: 400 },
    );
  }

  return redirect("/", {
    headers: authResult.headers,
  });
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md bg-night-card border-night-border text-night-text">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-night-accent text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-night-muted text-center">
            Join us to track and watch your favorite video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="username">
                Username
              </label>
              <Input
                id="username"
                name="username"
                placeholder="OtakuBoy99"
                className="bg-night-bg border-night-border focus:ring-night-accent"
                autoComplete="username"
              />
              {actionData?.errors?.username && (
                <p className="text-sm text-red-500">
                  {actionData.errors.username[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m.otaku@example.com"
                className="bg-night-bg border-night-border focus:ring-night-accent"
                autoComplete="email"
              />
              {actionData?.errors?.email && (
                <p className="text-sm text-red-500">
                  {actionData.errors.email[0]}
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
                autoComplete="new-password"
              />
              {actionData?.errors?.password && (
                <p className="text-sm text-red-500">
                  {actionData.errors.password[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="bg-night-bg border-night-border focus:ring-night-accent"
                autoComplete="new-password"
              />
              {actionData?.errors?.confirmPassword && (
                <p className="text-sm text-red-500">
                  {actionData.errors.confirmPassword[0]}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-night-accent hover:bg-night-accent-light text-white transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Register"}
            </Button>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-night-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-night-accent hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
