import React from 'react';
import { Link } from 'react-router-dom';
import { logComponent, logInteraction } from '../../../utils/logger';
import styles from './Footer.module.css';

const Footer = () => {
  React.useEffect(() => {
    logComponent('Footer', 'mounted');
  }, []);

  const handleLinkClick = (linkName) => {
    logInteraction(document.createElement('link'), 'footer_link_clicked', { linkName });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <Link 
              to="/" 
              className={styles.logo}
              onClick={() => handleLinkClick('logo')}
            >
              <div className={styles.logoIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className={styles.logoText}>TimeSlice</span>
            </Link>
            
            <p className={styles.tagline}>
              The micro time marketplace where professionals exchange knowledge, 
              skills, and experience in focused sessions.
            </p>

            {/* Social Links */}
            <div className={styles.socialLinks}>
              <a 
                href="https://twitter.com/timeslice" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
                onClick={() => handleLinkClick('twitter')}
                aria-label="Follow us on Twitter"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>

              <a 
                href="https://linkedin.com/company/timeslice" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
                onClick={() => handleLinkClick('linkedin')}
                aria-label="Follow us on LinkedIn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>

              <a 
                href="https://github.com/timeslice-app" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
                onClick={() => handleLinkClick('github')}
                aria-label="View our code on GitHub"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>

              <a 
                href="mailto:hello@timeslice.app" 
                className={styles.socialLink}
                onClick={() => handleLinkClick('email')}
                aria-label="Send us an email"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 4v16h24V4H0zm2 2h20l-10 8L2 6zm0 2.828L12 16l10-7.172V18H2V8.828z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className={styles.linksSection}>
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Platform</h3>
              <ul className={styles.linkList}>
                <li>
                  <Link 
                    to="/explore" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('explore')}
                  >
                    Browse Sessions
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/signup" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('become_mentor')}
                  >
                    Become a Mentor
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/signup" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('find_mentor')}
                  >
                    Find a Mentor
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/how-it-works" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('how_it_works')}
                  >
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Resources</h3>
              <ul className={styles.linkList}>
                <li>
                  <Link 
                    to="/help" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('help_center')}
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/blog" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('blog')}
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/community" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('community')}
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/api" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('api_docs')}
                  >
                    API Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Company</h3>
              <ul className={styles.linkList}>
                <li>
                  <Link 
                    to="/about" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('about')}
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/careers" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('careers')}
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/press" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('press')}
                  >
                    Press Kit
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('contact')}
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Legal</h3>
              <ul className={styles.linkList}>
                <li>
                  <Link 
                    to="/privacy" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('privacy')}
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('terms')}
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/cookies" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('cookies')}
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/security" 
                    className={styles.footerLink}
                    onClick={() => handleLinkClick('security')}
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottom}>
          <div className={styles.bottomContent}>
            <p className={styles.copyright}>
              © {currentYear} TimeSlice. All rights reserved.
            </p>
            
            <div className={styles.bottomLinks}>
              <Link 
                to="/sitemap" 
                className={styles.bottomLink}
                onClick={() => handleLinkClick('sitemap')}
              >
                Sitemap
              </Link>
              <Link 
                to="/accessibility" 
                className={styles.bottomLink}
                onClick={() => handleLinkClick('accessibility')}
              >
                Accessibility
              </Link>
              <button 
                className={styles.bottomLink}
                onClick={() => {
                  handleLinkClick('scroll_to_top');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-label="Scroll to top"
              >
                Back to Top ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;