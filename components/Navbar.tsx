"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Crown } from "lucide-react";

const links = [
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Screenshots", href: "#screenshots" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-300 sm:px-8 ${
          scrolled ? "my-2.5" : "my-4"
        }`}
      >
        <div
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 ${
            scrolled ? "glass shadow-xl" : ""
          }`}
        >
          <a href="#top" className="flex items-center gap-2.5" aria-label="Senate POS home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 shadow-lg">
              <Crown className="h-5 w-5 text-ink-900" strokeWidth={2.4} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-mist-100">
              Senate<span className="text-gradient-gold"> POS</span>
            </span>
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-mist-300 transition-colors hover:text-mist-100"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="#"
              className="text-sm font-medium text-mist-300 transition-colors hover:text-mist-100"
            >
              Sign in
            </a>
            <a
              href="#demo"
              className="rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 px-4 py-2 text-sm font-semibold text-ink-900 shadow-lg transition-transform hover:scale-[1.03]"
            >
              Request Demo
            </a>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl text-mist-100 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-5 md:hidden"
          >
            <div className="glass space-y-1 rounded-2xl p-3 shadow-xl">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-mist-200 hover:bg-white/5"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#demo"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 px-4 py-3 text-center text-sm font-semibold text-ink-900"
              >
                Request Demo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
