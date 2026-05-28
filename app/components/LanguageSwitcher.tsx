import { useTranslation } from "~/context/I18nContext";
import { useLocation } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale } = useTranslation();
  const location = useLocation();

  const languages = [
    { code: "en", label: "English" },
    { code: "id", label: "Bahasa Indonesia" },
    { code: "ja", label: "日本語" },
  ];

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return;

    // Set cookie and reload
    document.cookie = `lang=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-night-text hover:bg-night-hover" aria-label="Switch Language">
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-night-card border-night-border text-night-text">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={`cursor-pointer hover:bg-night-hover ${
              locale === lang.code ? "bg-night-hover text-night-accent font-bold" : ""
            }`}
            onClick={() => handleLanguageChange(lang.code)}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
