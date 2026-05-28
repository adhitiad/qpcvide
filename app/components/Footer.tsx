import { Link } from "react-router";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-night-card border-t border-night-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-serif text-xl font-bold gradient-text">
              AUISO
            </span>
            <p className="text-sm text-night-muted">
              &copy; {currentYear} AUISO. All rights reserved.
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-night-muted">
            <Link
              to="/privacy"
              className="hover:text-night-accent transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-night-accent transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/dmca"
              className="hover:text-night-accent transition-colors"
            >
              DMCA
            </Link>
            <Link
              to="/contact"
              className="hover:text-night-accent transition-colors"
            >
              Contact Us
            </Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-xs text-night-border">
          Disclaimer: This site contains mature content. You must be 18 years or
          older to enter.
        </div>
      </div>
    </footer>
  );
}
