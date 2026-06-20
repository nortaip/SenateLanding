"use client";

import { planMeta } from "@/lib/data";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { Check, Sparkles } from "lucide-react";
import { useI18n } from "./i18n/LanguageProvider";

export function Pricing() {
  const { t } = useI18n();
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t.pricing.eyebrow}
          title={
            <>
              {t.pricing.titleTop}
              <span className="text-gradient-gold">{t.pricing.titleAccent}</span>
            </>
          }
          subtitle={t.pricing.subtitle}
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {planMeta.map((meta, i) => {
            const plan = t.pricing.plans[i];
            return (
              <Reveal as="article" key={plan.name} delay={i}>
                <div
                  className={`relative flex h-full flex-col rounded-3xl border p-8 transition-transform duration-300 hover:-translate-y-1 ${
                    meta.highlighted
                      ? "glow-gold border-gold-500/40 bg-gradient-to-b from-gold-500/[0.08] to-white/[0.02]"
                      : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  {meta.highlighted && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-900">
                      <Sparkles className="h-3 w-3" />
                      {t.pricing.mostPopular}
                    </span>
                  )}

                  <h3 className="font-display text-xl font-bold text-mist-100">{plan.name}</h3>
                  <p className="mt-2 min-h-10 text-sm text-mist-400">{plan.tagline}</p>

                  <div className="mt-6 flex items-end gap-1.5">
                    <span className="font-display text-4xl font-bold text-mist-100">
                      {plan.price}
                    </span>
                    <span className="mb-1.5 text-sm text-mist-400">{plan.cadence}</span>
                  </div>

                  <a
                    href="#demo"
                    className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                      meta.highlighted
                        ? "bg-gradient-to-br from-gold-300 to-gold-600 text-ink-900 shadow-lg"
                        : "glass text-mist-100 hover:bg-white/5"
                    }`}
                  >
                    {plan.cta}
                  </a>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-mist-300">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-500/15 text-gold-400">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <p className="mt-10 text-center text-sm text-mist-500">{t.pricing.footnote}</p>
        </Reveal>
      </div>
    </section>
  );
}
