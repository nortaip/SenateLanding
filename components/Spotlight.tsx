"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Tablet, Boxes, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { BrowserFrame, KioskMockup, DashboardMockup } from "./ui/Mockups";
import { useI18n } from "./i18n/LanguageProvider";

const ease = [0.22, 1, 0.36, 1] as const;

type BlockMeta = {
  icon: LucideIcon;
  accent: string;
  label: string;
  mockup: (accent: string, label: string) => React.ReactNode;
};

const blockMeta: BlockMeta[] = [
  {
    icon: Tablet,
    accent: "#d4af37",
    label: "Kiosk",
    mockup: (accent, label) => (
      <BrowserFrame label={`Senate POS · ${label}`}>
        <KioskMockup accent={accent} />
      </BrowserFrame>
    ),
  },
  {
    icon: Boxes,
    accent: "#86efac",
    label: "Inventory",
    mockup: (accent, label) => (
      <BrowserFrame label={`app.senatepos.com · ${label}`}>
        <DashboardMockup accent={accent} />
      </BrowserFrame>
    ),
  },
];

export function Spotlight() {
  const { t } = useI18n();

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t.spotlight.eyebrow}
          title={
            <>
              {t.spotlight.titleTop}
              <span className="text-gradient-gold">{t.spotlight.titleAccent}</span>
            </>
          }
          subtitle={t.spotlight.subtitle}
        />

        <div className="mt-16 space-y-20 sm:space-y-28">
          {blockMeta.map((meta, i) => {
            const block = t.spotlight.blocks[i];
            const Icon = meta.icon;
            const reversed = i % 2 === 1;

            return (
              <div
                key={i}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                {/* Copy */}
                <Reveal className={reversed ? "lg:order-2" : ""}>
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                      borderColor: `${meta.accent}40`,
                      background: `${meta.accent}14`,
                      color: meta.accent,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {block.tag}
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-mist-100 sm:text-3xl">
                    {block.name}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-mist-300">
                    {block.description}
                  </p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {block.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-mist-200">
                        <span
                          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                          style={{ background: `${meta.accent}26`, color: meta.accent }}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#demo"
                    className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                    style={{ color: meta.accent }}
                  >
                    {t.spotlight.learnMore}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Reveal>

                {/* Visual */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.8, ease }}
                  className={`relative ${reversed ? "lg:order-1" : ""}`}
                >
                  <div
                    className="pointer-events-none absolute -inset-6 rounded-[2rem] blur-3xl"
                    style={{ background: `radial-gradient(closest-side, ${meta.accent}22, transparent)` }}
                    aria-hidden
                  />
                  <div className="relative">{meta.mockup(meta.accent, block.tag)}</div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
