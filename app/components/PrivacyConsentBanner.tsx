import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export function PrivacyConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("auiso_privacy_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-night-card border-t border-night-border shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-night-text max-w-3xl">
        <strong className="text-night-accent">Privacy Notice:</strong> We use an
        anonymous fingerprinting technology to provide personalized video
        recommendations. No personally identifiable information (PII) is stored.
        By continuing to use Auiso, you consent to this anonymous tracking.
      </div>
      <Button
        onClick={() => {
          localStorage.setItem("auiso_privacy_consent", "true");
          setShow(false);
        }}
        className="bg-night-accent hover:bg-night-accent/90 text-white whitespace-nowrap"
      >
        I Understand
      </Button>
    </div>
  );
}
