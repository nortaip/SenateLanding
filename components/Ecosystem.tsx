"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ecosystemMeta } from "@/lib/data";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { useI18n } from "./i18n/LanguageProvider";

export function Ecosystem() {
  const { t } = useI18n();
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="ecosystem" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t.ecosystem.eyebrow}
          title={
            <>
              {t.ecosystem.titleTop}
              <span className="text-gradient-gold">{t.ecosystem.titleAccent}</span>
            </>
          }
          subtitle={t.ecosystem.subtitle}
        />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ecosystemMeta.map((meta, i) => {
            const item = t.ecosystem.items[i];
            const Icon = meta.icon;
            const isActive = active === meta.id;
            return (
              <Reveal as="article" key={meta.id} delay={i % 4}>
                <motion.div
                  onHoverStart={() => setActive(meta.id)}
                  onHoverEnd={() => setActive(null)}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className={`group relative h-full overflow-hidden rounded-2xl border p-6 transition-colors duration-300 ${
                    isActive
                      ? "border-gold-500/40 bg-white/[0.05]"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  {/* glow */}
                  <div
                    className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.35), transparent)" }}
                    aria-hidden
                  />

                  <div className="relative flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-gold-300/90 to-gold-600/90 text-ink-900 shadow-lg">
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-mist-400">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="relative mt-5 font-display text-lg font-semibold text-mist-100">
                    {item.name}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-mist-400">
                    {item.description}
                  </p>

                  <ul className="relative mt-4 space-y-2">
                    {item.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-xs text-mist-300">
                        <Check className="h-3.5 w-3.5 shrink-0 text-gold-400" strokeWidth={3} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
