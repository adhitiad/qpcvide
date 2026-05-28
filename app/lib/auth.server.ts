import { redirect } from "react-router";
import { getSupabaseClient } from "./supabase.server";
import { prisma } from "./db.server";
import { ageVerificationStorage } from "./cookie.server";

export async function requireAgeVerification(request: Request) {
  const session = await ageVerificationStorage.getSession(request.headers.get("Cookie"));
  if (session.get("age_verified") !== true) {
    throw redirect("/");
  }
}

export async function signUp(email: string, password: string, username: string, request: Request) {
  const { supabase, headers } = getSupabaseClient(request);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Create the user in Prisma
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email,
          username,
        }
      });
    } catch (e) {
      return { error: "User already exists in database." };
    }
  }

  return { data, headers };
}

export async function signIn(email: string, password: string, request: Request) {
  const { supabase, headers } = getSupabaseClient(request);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { data, headers };
}

export async function signOut(request: Request) {
  const { supabase, headers } = getSupabaseClient(request);
  await supabase.auth.signOut();
  return redirect("/", { headers });
}

export async function getUser(request: Request) {
  const { supabase } = getSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUserId(request: Request, redirectTo: string = new URL(request.url).pathname) {
  const user = await getUser(request);
  
  if (!user) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  
  return user.id;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, role: true },
  });

  if (!user) {
    throw await signOut(request);
  }

  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  
  if (user.role !== "admin") {
    throw redirect("/");
  }
  
  return user;
}
