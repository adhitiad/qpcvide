import { Form, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { data, redirect } from "react-router";
import { prisma } from "../lib/db.server";
import type { Route } from "./+types/advertise";
import { z } from "zod";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useState } from "react";
import { useTranslation } from "~/context/I18nContext";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Advertise with Us - qpcvide" },
    { name: "description", content: "Reach thousands of video fans" },
  ];
};

const advertiseSchema = z.object({
  advertiserName: z.string().min(2, "Company/Advertiser name is required"),
  bannerUrl: z.string().url("Must be a valid URL for the banner image"),
  targetUrl: z.string().url("Must be a valid target URL"),
  slotId: z.string().min(1, "Please select an ad slot"),
  durationDays: z.coerce.number().min(1).max(365),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

export async function loader() {
  const slots = await prisma.adSlot.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });

  return { slots };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const payload = Object.fromEntries(formData);

  const result = advertiseSchema.safeParse(payload);

  if (!result.success) {
    return data(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { advertiserName, bannerUrl, targetUrl, slotId, durationDays } = result.data;

  const slot = await prisma.adSlot.findUnique({ where: { id: slotId } });
  if (!slot) {
    return data(
      { errors: { slotId: ["Invalid slot"] } as Record<string, string[] | undefined> },
      { status: 400 },
    );
  }

  // MOCK PAYMENT PROCESSING
  // In a real app, this would verify a crypto transaction or webhook.
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  await prisma.adPurchase.create({
    data: {
      advertiserName,
      bannerUrl,
      targetUrl,
      slotId,
      startDate,
      endDate,
      active: true, // Auto-approve for this mock implementation
    },
  });

  return redirect("/?ad_purchased=true");
}

export default function Advertise({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { slots } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const [slotId, setSlotId] = useState<string>("");
  const [duration, setDuration] = useState<number>(7);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const selectedSlot = slots.find((s) => s.id === slotId);
  const totalPrice = selectedSlot ? selectedSlot.price * duration : 0;

  const handlePay = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const method = fd.get("paymentMethod") as string;
    
    if (!method) {
      alert("Please select a payment method");
      return;
    }
    
    setSelectedMethod(method);
    setFormData(fd);
    setShowQR(true);
  };

  const handleVerify = () => {
    if (formData) {
      submit(formData, { method: "post" });
    }
  };

  const getWalletAddress = () => {
    switch (selectedMethod) {
      case "SOL": return "SolanaAdsWalletAddress123456789";
      case "BNB": return "0xBNBAdsWalletAddress987654321";
      case "USDT": return "0xUSDTAdsWalletAddress456789123";
      default: return "";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 py-12">
      <Card className="w-full max-w-2xl bg-night-card border-night-border text-night-text">
        <CardHeader>
          <CardTitle className="text-3xl font-serif text-night-accent text-center">
            {t("advertise.title")}
          </CardTitle>
          <CardDescription className="text-night-muted text-center text-lg mt-2">
            {t("advertise.subtitle")}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!showQR ? (
            <Form method="post" onSubmit={handlePay} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("advertise.advertiserName")}</label>
                  <Input
                    name="advertiserName"
                    placeholder={t("advertise.advertiserNamePlaceholder")}
                    className="bg-night-bg border-night-border focus:ring-night-accent"
                    required
                  />
                  {actionData?.errors?.advertiserName && (
                    <p className="text-sm text-red-500">{actionData.errors.advertiserName[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("advertise.bannerUrl")}</label>
                  <Input
                    name="bannerUrl"
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    className="bg-night-bg border-night-border focus:ring-night-accent"
                    required
                  />
                  {actionData?.errors?.bannerUrl && (
                    <p className="text-sm text-red-500">{actionData.errors.bannerUrl[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("advertise.targetUrl")}</label>
                <Input
                  name="targetUrl"
                  type="url"
                  placeholder="https://example.com"
                  className="bg-night-bg border-night-border focus:ring-night-accent"
                  required
                />
                {actionData?.errors?.targetUrl && (
                  <p className="text-sm text-red-500">{actionData.errors.targetUrl[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("advertise.slotPosition")}</label>
                  <Select name="slotId" value={slotId} onValueChange={setSlotId} required>
                    <SelectTrigger className="bg-night-bg border-night-border">
                      <SelectValue placeholder={t("advertise.selectSlot")} />
                    </SelectTrigger>
                    <SelectContent withPortal={false} className="bg-night-card border-night-border">
                      {slots.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="focus:bg-night-hover">
                          {s.name} (${s.price}/{t("advertise.day")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {actionData?.errors?.slotId && (
                    <p className="text-sm text-red-500">{actionData.errors.slotId[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("advertise.duration")}</label>
                  <Input
                    name="durationDays"
                    type="number"
                    min="1"
                    max="365"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    className="bg-night-bg border-night-border focus:ring-night-accent"
                    required
                  />
                  {actionData?.errors?.durationDays && (
                    <p className="text-sm text-red-500">{actionData.errors.durationDays[0]}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-night-border">
                <h3 className="font-medium text-lg mb-4">{t("advertise.totalAmount")} ${totalPrice.toFixed(2)}</h3>
                
                <p className="text-sm font-medium mb-2">{t("advertise.selectPayment")}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {["SOL", "BNB", "USDT"].map((method) => (
                    <div key={method} className="flex items-center">
                      <input 
                        type="radio" 
                        id={`pay-${method}`} 
                        name="paymentMethod" 
                        value={method} 
                        className="peer hidden" 
                        required
                      />
                      <label 
                        htmlFor={`pay-${method}`}
                        className="w-full text-center p-3 rounded-lg border border-night-border bg-night-bg hover:bg-night-hover peer-checked:border-night-accent peer-checked:bg-night-hover cursor-pointer transition-all font-bold"
                      >
                        {method}
                      </label>
                    </div>
                  ))}
                </div>
                {actionData?.errors?.paymentMethod && (
                  <p className="text-sm text-red-500 mb-4">{actionData.errors.paymentMethod[0]}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-night-accent hover:bg-night-accent-light text-white transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
                  disabled={!slotId || duration <= 0}
                >
                  {t("advertise.proceed")}
                </Button>
              </div>
            </Form>
          ) : (
            <div className="space-y-6 text-center py-8">
              <h3 className="font-medium text-xl">Send ${totalPrice.toFixed(2)} via {selectedMethod}</h3>
              
              <div className="bg-white p-4 w-56 h-56 mx-auto rounded-xl flex items-center justify-center">
                {/* Placeholder for QR Code */}
                <div className="text-black font-bold text-2xl">QR CODE</div>
              </div>
              
              <div className="bg-night-bg p-4 rounded-lg flex items-center justify-between border border-night-border mx-auto max-w-sm">
                <span className="text-sm font-mono text-night-muted truncate max-w-[250px]">
                  {getWalletAddress()}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(getWalletAddress())}
                >
                  {t("advertise.copy")}
                </Button>
              </div>

              <p className="text-sm text-night-muted max-w-sm mx-auto">
                {t("advertise.afterSent")}
              </p>

              <div className="w-full max-w-sm mx-auto space-y-3 pt-4">
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  onClick={handleVerify}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("advertise.verifying") : t("advertise.iHavePaid")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-night-muted hover:text-white"
                  onClick={() => setShowQR(false)}
                  disabled={isSubmitting}
                >
                  {t("advertise.cancel")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
