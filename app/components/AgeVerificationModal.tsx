import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

interface AgeVerificationModalProps {
  isVerified: boolean;
}

export function AgeVerificationModal({ isVerified }: AgeVerificationModalProps) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();

  useEffect(() => {
    // Only open if not verified
    if (!isVerified) {
      setOpen(true);
    }
  }, [isVerified]);

  const handleVerify = () => {
    fetcher.submit(
      {},
      { method: "post", action: "/api/verify-age" }
    );
    setOpen(false);
  };

  const handleReject = () => {
    window.location.href = "https://google.com";
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Prevent closing the dialog by clicking outside or pressing Escape
      if (!val && !isVerified) return;
      setOpen(val);
    }}>
      <DialogContent className="w-[100vw] h-[100dvh] max-w-none p-6 rounded-none flex flex-col justify-center sm:w-auto sm:h-auto sm:max-w-[425px] sm:rounded-lg sm:block bg-night-card border-night-border text-night-text [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-night-accent text-center">Age Verification Required</DialogTitle>
          <DialogDescription className="text-night-muted text-center pt-4 text-base">
            This website contains age-restricted content. You must be 18 years or older to enter.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <p className="text-center font-medium">Are you 18 or older?</p>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="border-night-border text-night-muted hover:bg-night-hover hover:text-night-text w-full sm:w-auto"
          >
            I am under 18
          </Button>
          <Button 
            onClick={handleVerify}
            className="bg-night-accent hover:bg-night-accent-light text-white w-full sm:w-auto"
          >
            I am 18 or older
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
