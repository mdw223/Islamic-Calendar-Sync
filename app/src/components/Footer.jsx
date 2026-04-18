import { useContext } from "react";
import { Link } from "react-router";
import { ThemeContext } from "../contexts/ThemeContext";
import "../pages/landing.css";

const Footer = () => {
  const themeContext = useContext(ThemeContext);
  const themeMode = themeContext?.themeMode ?? "light";

  return (
    <footer className="lp-root lp-footer" data-lp-theme={themeMode}>
      <div className="lp-footer-inner">
        <div className="lp-footer-columns">

          {/* Brand */}
          <div className="lp-footer-col">
            <p className="lp-footer-brand">Islamic Calendar Sync</p>
            <p className="lp-footer-brand-desc">
              Empowering the Ummah with precise Islamic calendar synchronization
              management since 2026.
            </p>
          </div>

          {/* Product */}
          <div className="lp-footer-col">
            <p className="lp-footer-col-heading">Product</p>
            <Link to="/features" className="lp-footer-link">Features</Link>
            <Link to="/guide" className="lp-footer-link">Guide</Link>
            <Link to="/methods" className="lp-footer-link">Methods</Link>
            <a href="/#faq" className="lp-footer-link">FAQs</a>
          </div>

          {/* Legal */}
          <div className="lp-footer-col">
            <p className="lp-footer-col-heading">Legal</p>
            <Link to="/privacy" className="lp-footer-link">Privacy</Link>
            <Link to="/terms" className="lp-footer-link">Terms</Link>
            <Link to="/data-policy" className="lp-footer-link">Data Policy</Link>
          </div>

          {/* Connect */}
          <div className="lp-footer-col">
            <p className="lp-footer-col-heading">Connect</p>
            <div className="lp-footer-icons">
              <a
                className="lp-footer-icon-btn"
                href="https://github.com/mdw223/IslamicCalendarSync"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open GitHub repository"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
              <a
                className="lp-footer-icon-btn"
                href="mailto:malik.code@proton.me"
                aria-label="Email malik.code@proton.me"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        <hr className="lp-footer-divider" />

        <div className="lp-footer-bottom">
          <p className="lp-footer-copy">
            © 2026 Islamic Calendar Sync. Developed for the community.
          </p>
          <p className="lp-footer-copy lp-footer-copy-italic">
            Built with Barakah and Modern Engineering
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
