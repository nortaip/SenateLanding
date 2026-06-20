"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { LANGS } from "@/lib/i18n";
import { useI18n } from "./LanguageProvider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-mist-200 transition-colors hover:text-mist-100 ${
          compact ? "w-full justify-center" : ""
        }`}
      >
        <Globe className="h-4 w-4 text-gold-400" />
        <span>{current.short}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-mist-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            role="listbox"
            className="glass absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl p-1.5 shadow-2xl"
          >
            {LANGS.map((l) => {
              const active = l.code === lang;
              return (
                <li key={l.code}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setLang(l.code);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      active ? "bg-white/5 text-mist-100" : "text-mist-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-gold-400">{l.short}</span>
                      {l.label}
                    </span>
                    {active && <Check className="h-4 w-4 text-gold-400" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
