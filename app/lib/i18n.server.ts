import { createCookie } from "react-router";

export const supportedLocales = ["en", "id", "ja"] as const;
export type Locale = typeof supportedLocales[number];

export const langCookie = createCookie("lang", {
  maxAge: 60 * 60 * 24 * 365, // 1 year
  path: "/",
  sameSite: "lax",
});

export async function getLocale(request: Request): Promise<Locale> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // 1. Check URL Path (e.g. /en/something)
  const pathLang = pathParts[0] as Locale;
  if (supportedLocales.includes(pathLang)) {
    return pathLang;
  }

  // 2. Check Cookie
  const cookieHeader = request.headers.get("Cookie");
  const cookieLang = await langCookie.parse(cookieHeader);
  if (cookieLang && supportedLocales.includes(cookieLang)) {
    return cookieLang as Locale;
  }

  // 3. Check Accept-Language Header
  const acceptLang = request.headers.get("Accept-Language");
  if (acceptLang) {
    const preferredLang = acceptLang.split(",")[0].split("-")[0] as Locale;
    if (supportedLocales.includes(preferredLang)) {
      return preferredLang;
    }
  }

  // 4. Default Fallback
  return "en";
}

export async function getDictionary(locale: Locale) {
  try {
    const dict = await import(`../i18n/${locale}.json`);
    return dict.default;
  } catch (error) {
    console.error(`Failed to load dictionary for locale: ${locale}`, error);
    const fallback = await import(`../i18n/en.json`);
    return fallback.default;
  }
}
