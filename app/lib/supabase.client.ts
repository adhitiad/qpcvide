import { createBrowserClient } from "@supabase/ssr";

export const getBrowserClient = () => {
  const env = (typeof window !== "undefined" && (window as any).ENV) || {};
  
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.warn("Supabase credentials not found in window.ENV");
  }

  return createBrowserClient(
    env.SUPABASE_URL || "",
    env.SUPABASE_ANON_KEY || ""
  );
};
