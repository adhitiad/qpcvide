import { useEffect } from "react";

interface GoogleAdProps {
  slot: string;
  className?: string;
}

export function GoogleAd({ slot, className }: GoogleAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  const clientId = "ca-pub-XXXXXXXXXXXXX"; // You'd normally pass this via env to window

  return (
    <div className={`my-4 flex justify-center ${className || ""}`}>
      <ins
        className="adsbygoogle block"
        style={{ display: "block", minWidth: "250px", minHeight: "250px" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
