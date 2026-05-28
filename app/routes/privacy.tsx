import { Link } from "react-router";

export const meta = () => [
  { title: "Privacy Policy - Auiso" },
  { name: "description", content: "Privacy Policy and Data Protection at Auiso." }
];

export default function PrivacyPolicy() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl text-night-text">
      <h1 className="text-4xl font-serif font-bold text-white mb-8 border-b border-night-border pb-4">Privacy Policy</h1>
      
      <div className="space-y-6 text-night-muted leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">1. Introduction</h2>
          <p>Welcome to Auiso. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">2. Data We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Identity Data:</strong> username, email address.</li>
            <li><strong>Technical Data:</strong> IP address, browser type and version, time zone setting, and operating system.</li>
            <li><strong>Usage Data:</strong> information about how you use our website, including your watch history and interactions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">3. How We Use Your Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>To register you as a new user.</li>
            <li>To deliver relevant website content and advertisements to you.</li>
            <li>To use data analytics to improve our website, products/services, marketing, customer relationships, and experiences.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">4. Cookies</h2>
          <p>You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-night-accent mb-3">5. Third-Party Links</h2>
          <p>This website may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.</p>
        </section>

        <div className="mt-8 pt-8 border-t border-night-border text-sm">
          <p>Last updated: {new Date().toLocaleDateString("id-ID")}</p>
          <p className="mt-2">If you have any questions about this privacy policy, please <Link to="/contact" className="text-night-cyan hover:underline">contact us</Link>.</p>
        </div>
      </div>
    </main>
  );
}
