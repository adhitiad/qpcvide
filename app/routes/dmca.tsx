import { Link } from "react-router";
import { useTranslation } from "~/context/I18nContext";

export const meta = () => [
  { title: "DMCA Policy - Auiso" },
  { name: "description", content: "Digital Millennium Copyright Act (DMCA) Notice and Policy." }
];

export default function DMCA() {
  const { t } = useTranslation();
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl text-night-text">
      <h1 className="text-4xl font-serif font-bold text-white mb-8 border-b border-night-border pb-4">{t("legal.dmca")}</h1>
      
      <div className="space-y-6 text-night-muted leading-relaxed">
        <section>
          <p className="text-lg">Auiso respects the intellectual property rights of others. It is our policy to respond promptly to any claim that content posted on the site infringes the copyright or other intellectual property infringement of any person.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">Submitting a Takedown Notice</h2>
          <p>If you believe in good faith that any content hosted on Auiso infringes your copyright, please provide our Copyright Agent with the following written information:</p>
          <ul className="list-decimal pl-6 mt-4 space-y-3">
            <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
            <li>Identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works are covered by a single notification, a representative list of such works.</li>
            <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material (e.g., the exact URL).</li>
            <li>Information reasonably sufficient to permit us to contact you, such as an address, telephone number, and, if available, an electronic mail address.</li>
            <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
            <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">Where to Send the Notice</h2>
          <p>Please send your complete DMCA takedown notice to our designated copyright agent via our Contact page or directly via email at:</p>
          <div className="bg-night-card p-4 mt-4 border border-night-border rounded-lg inline-block">
            <p className="font-bold text-white">Email: legal@auiso.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">Counter-Notice</h2>
          <p>If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, you may send a counter-notice containing the necessary details to our Copyright Agent.</p>
        </section>

        <div className="mt-8 pt-8 border-t border-night-border text-sm">
          <p>Note: We will terminate the accounts of repeat infringers in appropriate circumstances.</p>
        </div>
      </div>
    </main>
  );
}
