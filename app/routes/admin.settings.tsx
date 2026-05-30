import type { Route } from "./+types/admin.settings";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { prisma } from "../lib/db.server";
import { requireAdmin } from "../lib/auth.server";
import { encryptSetting, decryptSetting } from "../lib/encryption.server";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Save, ShieldCheck } from "lucide-react";

export const meta = () => {
  return [{ title: "System Settings - Admin Panel" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);

  // Load settings
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] },
    },
  });

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    // Decrypt the value so it can be displayed (partially) or used in the form
    // We will pass it decrypted to the UI, but it will be hidden inside a password field
    settingsMap[s.key] = decryptSetting(s.value);
  });

  return { settings: settingsMap };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const token = formData.get("telegramToken")?.toString() || "";
  const chatId = formData.get("telegramChatId")?.toString() || "";

  try {
    // Upsert Token (Encrypted)
    if (token) {
      await prisma.systemSetting.upsert({
        where: { key: "TELEGRAM_BOT_TOKEN" },
        update: { value: encryptSetting(token) },
        create: { key: "TELEGRAM_BOT_TOKEN", value: encryptSetting(token) },
      });
    } else {
      // If empty, delete it
      await prisma.systemSetting.deleteMany({
        where: { key: "TELEGRAM_BOT_TOKEN" },
      });
    }

    // Upsert Chat ID (Encrypted)
    if (chatId) {
      await prisma.systemSetting.upsert({
        where: { key: "TELEGRAM_CHAT_ID" },
        update: { value: encryptSetting(chatId) },
        create: { key: "TELEGRAM_CHAT_ID", value: encryptSetting(chatId) },
      });
    } else {
      await prisma.systemSetting.deleteMany({
        where: { key: "TELEGRAM_CHAT_ID" },
      });
    }

    return {
      success: true,
      message: "Pengaturan berhasil disimpan dengan aman!",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menyimpan pengaturan",
    };
  }
}

export default function AdminSettings() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white mb-2">
          System Settings
        </h1>
        <p className="text-night-muted">
          Kelola konfigurasi rahasia sistem. Semua data sensitif (API Keys,
          Tokens) akan di-enkripsi secara otomatis di database.
        </p>
      </div>

      {actionData?.success && (
        <div className="p-4 bg-night-accent/20 border border-night-accent rounded-lg text-white flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-night-accent" />
          {actionData.message}
        </div>
      )}

      {actionData?.error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-white">
          {actionData.error}
        </div>
      )}

      <Card className="bg-night-card border-night-border">
        <CardHeader>
          <CardTitle className="text-white">
            Telegram Notification Bot
          </CardTitle>
          <CardDescription className="text-night-muted">
            Konfigurasi bot Telegram untuk menyiarkan video baru ke grup Anda.
            Token akan disimpan dalam format terenkripsi (AES-256).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="telegramToken" className="text-night-text">
                Telegram Bot Token
              </Label>
              <Input
                id="telegramToken"
                name="telegramToken"
                type="password"
                defaultValue={settings.TELEGRAM_BOT_TOKEN || ""}
                placeholder="12********************************"
                className="bg-night-bg border-night-border text-white"
              />
              <p className="text-xs text-night-muted mt-1">
                Dapatkan dari @BotFather di Telegram.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegramChatId" className="text-night-text">
                Telegram Chat ID
              </Label>
              <Input
                id="telegramChatId"
                name="telegramChatId"
                type="text"
                defaultValue={settings.TELEGRAM_CHAT_ID || ""}
                placeholder="-100***********************************"
                className="bg-night-bg border-night-border text-white font-mono"
              />
              <p className="text-xs text-night-muted mt-1">
                ID grup/channel tempat bot akan mengirim pesan. Gunakan
                @RawDataBot untuk mencari ID.
              </p>
            </div>

            <Button
              type="submit"
              className="bg-night-accent hover:bg-night-accent/80 text-white w-full sm:w-auto flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>Menyimpan...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan & Enkripsi Pengaturan
                </>
              )}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
