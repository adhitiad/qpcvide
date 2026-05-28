import { useEffect } from "react";

interface FacebookAdProps {
  placementId: string;
  className?: string;
}

export function FacebookAd({ placementId, className }: FacebookAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      if (window.FB && window.FB.XFBML) {
        // @ts-ignore
        window.FB.XFBML.parse();
      }
    } catch (e) {
      console.error("Facebook Ads error", e);
    }
  }, []);

  return (
    <div className={`my-4 flex justify-center ${className || ""}`}>
      <div
        className="fb-ad"
        data-placementid={placementId}
        data-format="native"
        data-nativeadid="ad_root"
      >
        {/* The Facebook JS SDK will render the ad inside this div */}
      </div>
    </div>
  );
}
