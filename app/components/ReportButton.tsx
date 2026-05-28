import { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "./ui/button";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ReportButtonProps {
  targetId: string;
  type: "video" | "comment";
}

export function ReportButton({ targetId, type }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();
  
  const isSubmitting = fetcher.state !== "idle";
  const isSuccess = fetcher.data?.success;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-night-muted hover:text-red-500" title="Laporkan Konten">
          <Flag className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-night-card border-night-border text-night-text sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Laporkan {type === "video" ? "Video" : "Komentar"}</DialogTitle>
          <DialogDescription className="text-night-muted">
            Beri tahu kami mengapa konten ini bermasalah.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center text-green-500 font-medium">
            Laporan Anda telah diterima. Terima kasih!
          </div>
        ) : (
          <fetcher.Form method="post" action="/api/report" className="space-y-4">
            <input type="hidden" name="targetId" value={targetId} />
            <input type="hidden" name="type" value={type} />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan Pelaporan</label>
              <Select name="reason" required>
                <SelectTrigger className="w-full bg-night-bg border-night-border">
                  <SelectValue placeholder="Pilih alasan..." />
                </SelectTrigger>
                <SelectContent className="bg-night-card border-night-border text-night-text">
                  <SelectItem value="spam">Spam atau Menyesatkan</SelectItem>
                  <SelectItem value="illegal">Konten Ilegal / Dibawah Umur</SelectItem>
                  <SelectItem value="copyright">Pelanggaran Hak Cipta / Pembajakan</SelectItem>
                  <SelectItem value="harassment">Pelecehan atau Bullying</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="sm:justify-end mt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                {isSubmitting ? "Mengirim..." : "Laporkan"}
              </Button>
            </DialogFooter>
          </fetcher.Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
