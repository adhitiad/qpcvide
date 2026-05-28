import React, { createContext, useContext } from "react";

type I18nContextType = {
  locale: string;
  dictionary: Record<string, string>;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: string;
  dictionary: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, dictionary }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }

  const { locale, dictionary } = context;

  const t = (key: string, params?: Record<string, string | number>) => {
    let translation = dictionary[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(
          new RegExp(`{{${paramKey}}}`, "g"),
          String(paramValue)
        );
      });
    }

    return translation;
  };

  return { t, locale };
}
