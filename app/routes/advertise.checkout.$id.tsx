import type { Route } from "./+types/advertise.checkout.$id";
import { useLoaderData, redirect, Form } from "react-router";
import { prisma } from "../lib/db.server";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";

export const meta = () => {
  return [
    { title: "Checkout - Video Hub Ads" },
  ];
};

export async function loader({ params }: Route.LoaderArgs) {
  const purchase = await prisma.adPurchase.findUnique({
    where: { id: params.id },
    include: { slot: true }
  });

  if (!purchase) {
    throw new Response("Purchase not found", { status: 404 });
  }

  const durationDays = Math.round((purchase.endDate.getTime() - purchase.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalCost = durationDays * purchase.slot.price;

  return { purchase, totalCost, durationDays };
}

export async function action({ request, params }: Route.ActionArgs) {
  // Simulate payment confirmation
  // In reality, you would verify a blockchain transaction hash here
  
  await prisma.adPurchase.update({
    where: { id: params.id },
    data: { status: "PENDING" } // Just to be explicit, it's already PENDING
  });

  return redirect(`/advertise/success`);
}

export default function AdvertiseCheckout() {
  const { purchase, totalCost, durationDays } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-night-bg text-white flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 flex justify-center items-center">
        <div className="max-w-xl w-full bg-night-card border border-night-border rounded-xl p-8 text-center shadow-xl">
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-night-muted mb-8">Pay with Cryptocurrency</p>

          <div className="bg-night-bg border border-night-border rounded-lg p-6 mb-8 text-left">
            <h3 className="font-bold text-lg mb-4 border-b border-night-border pb-2">Order Summary</h3>
            <div className="flex justify-between mb-2">
              <span className="text-night-muted">Ad Slot</span>
              <span className="font-medium">{purchase.slot.name} ({purchase.slot.position})</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-night-muted">Duration</span>
              <span className="font-medium">{durationDays} Days</span>
            </div>
            <div className="flex justify-between font-bold text-xl mt-4 pt-4 border-t border-night-border">
              <span>Total Cost</span>
              <span className="text-night-success">${totalCost.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <h3 className="font-bold mb-2">Send Payment To (BEP20 / Solana):</h3>
            
            <div className="p-4 bg-night-bg rounded-lg border border-night-border flex justify-between items-center">
              <div>
                <p className="text-sm text-night-muted">USDT (BEP20) / BNB</p>
                <code className="text-night-cyan">0x1234567890abcdef1234567890abcdef12345678</code>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText("0x1234567890abcdef1234567890abcdef12345678")}>
                Copy
              </Button>
            </div>

            <div className="p-4 bg-night-bg rounded-lg border border-night-border flex justify-between items-center">
              <div>
                <p className="text-sm text-night-muted">Solana (SOL)</p>
                <code className="text-night-cyan">8sF3G9y...dummy...address</code>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText("8sF3G9y...")}>
                Copy
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-night-border">
            <p className="text-sm text-night-muted mb-4">
              Once you have sent the transaction, click the button below. Our team will verify the payment and approve your ad shortly.
            </p>
            <Form method="post">
              <Button type="submit" className="w-full bg-night-accent hover:bg-night-accent-light text-white font-bold py-6">
                I Have Sent The Payment
              </Button>
            </Form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
