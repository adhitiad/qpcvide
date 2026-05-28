import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function AntiAdBlock() {
  const [adblockDetected, setAdblockDetected] = useState(false);

  useEffect(() => {
    // 1. Create a "bait" element with classes commonly blocked by AdBlockers
    const bait = document.createElement("div");
    bait.className =
      "ad-banner adsense sponsor pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links";
    
    // Visually hide it but keep it in the DOM tree
    bait.style.position = "absolute";
    bait.style.left = "-9999px";
    bait.style.top = "-9999px";
    bait.style.height = "10px";
    bait.style.width = "10px";
    bait.setAttribute("aria-hidden", "true");

    document.body.appendChild(bait);

    // 2. Wait a brief moment to let extensions modify the DOM
    const timer = setTimeout(() => {
      // Check if the element was hidden, resized, or removed
      const isBlocked =
        !document.body.contains(bait) ||
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0 ||
        window.getComputedStyle(bait).display === "none";

      if (isBlocked) {
        setAdblockDetected(true);
      }

      // Cleanup
      if (document.body.contains(bait)) {
        document.body.removeChild(bait);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Dialog open={adblockDetected} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md bg-night-card border-night-border text-white [&>button]:hidden outline-none"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-6 mt-4">
            <div className="p-4 bg-red-500/10 rounded-full">
              <ShieldAlert className="w-16 h-16 text-red-500" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center font-serif text-white tracking-wide">
            AdBlocker Detected!
          </DialogTitle>
          <DialogDescription className="text-center text-night-muted text-base mt-4 leading-relaxed">
            It looks like you are using an AdBlocker. We rely on ads to keep our servers running and provide you with high-quality content. 
            <br className="my-2" />
            Please disable your AdBlocker to continue watching, or upgrade to Premium for an ad-free experience.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-8 mb-2">
          <Button 
            className="w-full bg-night-accent hover:bg-night-accent-light text-white font-bold py-6 text-lg transition-all shadow-lg hover:shadow-night-accent/50"
            onClick={() => window.location.reload()}
          >
            I have disabled my AdBlocker
          </Button>
          <Button 
            variant="outline"
            className="w-full border-night-border text-night-muted hover:text-white py-6 bg-transparent hover:bg-night-hover transition-colors"
            asChild
          >
            <Link to="/upgrade">Upgrade to Premium (Ad-Free)</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
