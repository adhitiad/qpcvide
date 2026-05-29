import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "~/components/ui/button";

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Cek jika prompt sudah disimpan di root.tsx
    if (typeof window !== "undefined" && (window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (typeof window !== "undefined") {
        (window as any).deferredPrompt = e;
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      if (typeof window !== "undefined") {
        (window as any).deferredPrompt = null;
      }
    }
  };

  if (!deferredPrompt) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden sm:flex items-center gap-2 border-night-accent text-night-accent hover:bg-night-accent hover:text-white transition-colors"
      onClick={handleInstallClick}
      title="Install App"
    >
      <Download className="h-4 w-4" />
      <span className="font-bold">Install</span>
    </Button>
  );
}
