import { en } from "../i18n/en";
import { id } from "../i18n/id";
import { ja } from "../i18n/ja";
import { es } from "../i18n/es";
import { pt } from "../i18n/pt";
import { fr } from "../i18n/fr";

const dictionaries: Record<string, typeof en> = {
  en,
  id,
  ja,
  es,
  pt,
  fr,
};

export const defaultLocale = "en";
export const supportedLocales = Object.keys(dictionaries);

export function getLocale(request: Request): string {
  const acceptLanguage = request.headers.get("Accept-Language");
  if (!acceptLanguage) return defaultLocale;

  // accept-language is like: fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5
  const langs = acceptLanguage.split(",").map((lang) => {
    const [locale, q] = lang.split(";");
    const weight = q ? parseFloat(q.split("=")[1]) : 1.0;
    const code = locale.trim().split("-")[0].toLowerCase();
    return { code, weight };
  });

  langs.sort((a, b) => b.weight - a.weight);

  for (const lang of langs) {
    if (supportedLocales.includes(lang.code)) {
      return lang.code;
    }
  }

  return defaultLocale;
}

export function getDictionary(request: Request) {
  const locale = getLocale(request);
  return {
    locale,
    dict: dictionaries[locale] || dictionaries[defaultLocale],
  };
}
