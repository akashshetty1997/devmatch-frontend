/**
 * @file src/components/common/Footer.tsx
 * @description Dark premium footer (matches Home page bg-[#070A12])
 */

import Link from "next/link";
import { Github, Linkedin, Twitter, Sparkles } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Jobs", href: "/jobs" },
      { label: "Developers", href: "/developers" },
      { label: "Search Repos", href: "/search" },
      { label: "Feed", href: "/feed" },
    ],
    company: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  };

  const socialLinks = [
    { label: "GitHub", href: "https://github.com", icon: Github },
    { label: "Twitter", href: "https://twitter.com", icon: Twitter },
    { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-[#070A12] text-white">
      <div className="h-[1px] w-full bg-gradient-to-r from-sky-400/50 via-fuchsia-400/35 to-emerald-400/35" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <div className="absolute -top-24 left-[10%] h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -top-24 right-[12%] h-64 w-64 rounded-full bg-fuchsia-500/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="group inline-flex items-center gap-2">
              <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <span className="absolute inset-0 bg-gradient-to-br from-sky-500/25 via-fuchsia-500/15 to-emerald-500/10" />
                <Sparkles size={16} className="relative text-white/85" />
              </span>
              <span className="text-base font-semibold tracking-tight text-white/90 group-hover:text-white">
                DevMatch
              </span>
            </Link>

            <p className="mt-3 text-sm text-white/65">
              Connecting developers with opportunities — with less noise and
              better signals.
            </p>

            <div className="mt-5 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white/90">Product</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white/90">Company</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white/90">Legal</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-white/55">
            © {currentYear} DevMatch. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              Next.js
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              Framer Motion
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              Tailwind
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
