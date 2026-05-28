import type { Route } from "./+types/advertise.success";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const meta = () => {
  return [
    { title: "Success - Video Hub Ads" },
  ];
};

export default function AdvertiseSuccess() {
  return (
    <div className="min-h-screen bg-night-bg text-white flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 flex justify-center items-center">
        <div className="max-w-md w-full bg-night-card border border-night-border rounded-xl p-8 text-center shadow-xl">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-20 h-20 text-night-success" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Payment Pending</h1>
          <p className="text-night-muted mb-8">
            Thank you! Your payment is currently being verified by our team. 
            Once confirmed, your ad will go live automatically on the selected date.
          </p>

          <Button asChild className="w-full bg-night-accent hover:bg-night-accent-light text-white">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
