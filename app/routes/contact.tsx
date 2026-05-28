import { Mail, MapPin, MessageSquare } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useTranslation } from "~/context/I18nContext";

export const meta = () => [
  { title: "Contact Us - Auiso" },
  { name: "description", content: "Get in touch with the Auiso team." },
];

export default function Contact() {
  const { t } = useTranslation();
  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl text-night-text">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-white mb-4">
          {t("contact.title")}
        </h1>
        <p className="text-night-muted text-lg max-w-2xl mx-auto">
          {t("contact.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="bg-night-card p-6 rounded-xl border border-night-border flex items-start gap-4">
            <div className="bg-night-accent/20 p-3 rounded-full">
              <Mail className="w-6 h-6 text-night-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {t("contact.emailSupport")}
              </h3>
              <p className="text-night-muted mb-2">
                {t("contact.generalInquiries")}
              </p>
              <Link
                to="mailto:support@auiso.com"
                className="text-night-cyan hover:underline font-bold"
              >
                support@auiso.com
              </Link>
            </div>
          </div>

          <div className="bg-night-card p-6 rounded-xl border border-night-border flex items-start gap-4">
            <div className="bg-red-500/20 p-3 rounded-full">
              <MessageSquare className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {t("contact.legalDmca")}
              </h3>
              <p className="text-night-muted mb-2">
                {t("contact.legalInquiries")}
              </p>
              <Link
                to="mailto:legal@auiso.com"
                className="text-night-cyan hover:underline font-bold"
              >
                legal@auiso.com
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-night-card p-8 rounded-xl border border-night-border shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            {t("contact.sendMessage")}
          </h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Message sent successfully!");
            }}
          >
            <div>
              <label className="block text-sm font-medium text-night-muted mb-1">
                {t("contact.name")}
              </label>
              <Input
                required
                placeholder={t("contact.placeholderName")}
                className="bg-night-bg border-night-border text-white"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-night-muted mb-1">
                {t("contact.email")}
              </Label>
              <Input
                type="email"
                required
                placeholder={t("contact.placeholderEmail")}
                className="bg-night-bg border-night-border text-white"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-night-muted mb-1">
                {t("contact.subject")}
              </Label>
              <select className="w-full h-10 px-3 rounded-md bg-night-bg border border-night-border text-white focus:ring-1 focus:ring-night-accent focus:border-night-accent outline-none">
                <option value="general">{t("contact.general")}</option>
                <option value="support">{t("contact.support")}</option>
                <option value="billing">{t("contact.billing")}</option>
                <option value="report">{t("contact.report")}</option>
                <option value="other">{t("contact.other")}</option>
              </select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-night-muted mb-1">
                {t("contact.message")}
              </Label>
              <Textarea
                required
                rows={5}
                className="w-full p-3 rounded-md bg-night-bg border border-night-border text-white focus:ring-1 focus:ring-night-accent focus:border-night-accent outline-none resize-none"
                placeholder={t("contact.placeholderMessage")}
              ></Textarea>
            </div>
            <Button
              type="submit"
              className="w-full bg-night-accent hover:bg-night-accent-light text-white font-bold py-6"
            >
              {t("contact.submit")}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
