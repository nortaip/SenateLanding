"use client";

import { Crown, Twitter, Linkedin, Instagram, Facebook, Youtube } from "lucide-react";
import { useI18n } from "./i18n/LanguageProvider";

const socials = [
  { Icon: Twitter, label: "Twitter" },
  { Icon: Linkedin, label: "LinkedIn" },
  { Icon: Instagram, label: "Instagram" },
  { Icon: Facebook, label: "Facebook" },
  { Icon: Youtube, label: "YouTube" },
];

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative border-t border-white/5 bg-ink-950/60">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand */}
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 shadow-lg">
                <Crown className="h-5 w-5 text-ink-900" strokeWidth={2.4} />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-mist-100">
                Senate<span className="text-gradient-gold"> POS</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-400">
              {t.footer.brandDesc}
            </p>
            <div className="mt-6 flex gap-2.5">
              {socials.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="glass grid h-9 w-9 place-items-center rounded-lg text-mist-300 transition-colors hover:text-gold-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {t.footer.columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-semibold text-mist-100">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-mist-400 transition-colors hover:text-gold-400"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-mist-500">
            {t.footer.copyright.replace("{year}", String(new Date().getFullYear()))}
          </p>
          <div className="flex gap-6">
            {t.footer.legal.map((l) => (
              <a key={l} href="#" className="text-xs text-mist-500 transition-colors hover:text-mist-300">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
