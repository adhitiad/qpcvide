import { Mail, MapPin, MessageSquare } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export const meta = () => [
  { title: "Contact Us - Auiso" },
  { name: "description", content: "Get in touch with the Auiso team." },
];

export default function Contact() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl text-night-text">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-white mb-4">
          Contact Us
        </h1>
        <p className="text-night-muted text-lg max-w-2xl mx-auto">
          Have a question, feedback, or need to report an issue? We're here to
          help. Reach out to our support team and we'll get back to you as soon
          as possible.
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
                Email Support
              </h3>
              <p className="text-night-muted mb-2">
                For general inquiries and support:
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
                Legal & DMCA
              </h3>
              <p className="text-night-muted mb-2">
                For copyright takedown notices and legal matters:
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
            Send us a message
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
                Name
              </label>
              <Input
                required
                placeholder="Your name"
                className="bg-night-bg border-night-border text-white"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-night-muted mb-1">
                Email
              </Label>
              <Input
                type="email"
                required
                placeholder="your.email@example.com"
                className="bg-night-bg border-night-border text-white"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-night-muted mb-1">
                Subject
              </Label>
              <select className="w-full h-10 px-3 rounded-md bg-night-bg border border-night-border text-white focus:ring-1 focus:ring-night-accent focus:border-night-accent outline-none">
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Issue</option>
                <option value="report">Report Content</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-night-muted mb-1">
                Message
              </Label>
              <Textarea
                required
                rows={5}
                className="w-full p-3 rounded-md bg-night-bg border border-night-border text-white focus:ring-1 focus:ring-night-accent focus:border-night-accent outline-none resize-none"
                placeholder="How can we help you?"
              ></Textarea>
            </div>
            <Button
              type="submit"
              className="w-full bg-night-accent hover:bg-night-accent-light text-white font-bold py-6"
            >
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
