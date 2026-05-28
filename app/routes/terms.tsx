import { Link } from "react-router";
import { useTranslation } from "~/context/I18nContext";

export const meta = () => [
  { title: "Terms of Service - Auiso" },
  { name: "description", content: "Terms of Service and User Agreement for Auiso." }
];

export default function TermsOfService() {
  const { t } = useTranslation();
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl text-night-text">
      <h1 className="text-4xl font-serif font-bold text-white mb-8 border-b border-night-border pb-4">{t("legal.terms")}</h1>
      
      <div className="space-y-6 text-night-muted leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using Auiso ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. Furthermore, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">2. Age Requirement</h2>
          <p>You must be at least 18 years of age, or the age of legal majority in your jurisdiction (whichever is greater), to use this Service. By using the Service, you represent and warrant that you meet these age requirements.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">3. User Conduct</h2>
          <p>You agree to not use the Service to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Upload, post, or transmit any content that is illegal, harmful, threatening, abusive, harassing, or otherwise objectionable.</li>
            <li>Upload any content featuring minors, non-consensual acts, or any material that violates applicable laws.</li>
            <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
            <li>Attempt to bypass any security measures or age-restriction gateways implemented on the Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">4. Intellectual Property</h2>
          <p>All content included on this site, such as text, graphics, logos, button icons, images, audio clips, digital downloads, data compilations, and software, is the property of Auiso or its content suppliers and protected by international copyright laws.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">5. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        </section>

        <div className="mt-8 pt-8 border-t border-night-border text-sm">
          <p>{t("legal.lastUpdated")} {new Date().toLocaleDateString("id-ID")}</p>
          <p className="mt-2">If you do not agree to these terms, please do not use our Service. For inquiries, <Link to="/contact" className="text-night-cyan hover:underline">contact us</Link>.</p>
        </div>
      </div>
    </main>
  );
}
