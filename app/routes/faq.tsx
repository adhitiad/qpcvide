import type { Route } from "./+types/faq";
import { useTranslation } from "~/context/I18nContext";
import { Link } from "react-router";
import { Shield, Globe, Lock, Rss } from "lucide-react";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Help & FAQ — Auiso" },
    {
      name: "description",
      content:
        "Find answers to common questions and guides to access Auiso if it's blocked in your region.",
    },
  ];
};

export default function FAQ() {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t("faq.q1"),
      answer: t("faq.a1"),
      icon: <Shield className="h-6 w-6 text-night-cyan" />,
    },
    {
      question: t("faq.q2"),
      answer: t("faq.a2"),
      icon: <Globe className="h-6 w-6 text-night-cyan" />,
    },
    {
      question: t("faq.q3"),
      answer: t("faq.a3"),
      icon: <Lock className="h-6 w-6 text-night-cyan" />,
    },
    {
      question: t("faq.q4"),
      answer: t("faq.a4"),
      icon: <Rss className="h-6 w-6 text-night-cyan" />,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif text-night-text">
          {t("faq.title")}
        </h1>
        <p className="text-night-muted text-lg max-w-2xl mx-auto">
          {t("faq.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-night-card border border-night-border rounded-xl p-6 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-shadow duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-night-hover rounded-lg shrink-0">
                {faq.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-night-text">
                  {faq.question}
                </h3>
                <p className="text-night-muted leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-night-card border border-night-border rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-night-text">
          Still need help?
        </h2>
        <p className="text-night-muted mb-6">
          If you couldn't find the answer to your question, feel free to contact
          our support team.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-night-accent text-white hover:bg-night-accent/90 h-10 py-2 px-4"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
