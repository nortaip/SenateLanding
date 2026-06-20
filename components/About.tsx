"use client";

import { Heart, Layers, LifeBuoy, TrendingUp, Crown, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { trustStatValues } from "@/lib/data";
import { useI18n } from "./i18n/LanguageProvider";

const pillarIcons: LucideIcon[] = [Heart, Layers, LifeBuoy, TrendingUp];

export function About() {
  const { t } = useI18n();

  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.10), transparent)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div>
            <SectionHeading
              eyebrow={t.about.eyebrow}
              align="left"
              title={
                <>
                  {t.about.titleTop}
                  <span className="text-gradient-gold">{t.about.titleAccent}</span>
                </>
              }
              subtitle={t.about.description}
            />

            <div className="mt-8 grid grid-cols-2 gap-3">
              {trustStatValues.map((value, i) => (
                <Reveal key={i} delay={i} className="glass rounded-xl p-4">
                  <div className="font-display text-xl font-bold text-gradient-gold sm:text-2xl">
                    {value}
                  </div>
                  <div className="mt-1 text-xs text-mist-400">{t.trusted.statLabels[i]}</div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Pillars */}
          <div className="grid gap-4 sm:grid-cols-2">
            {t.about.pillars.map((pillar, i) => {
              const Icon = pillarIcons[i];
              return (
                <Reveal as="article" key={pillar.title} delay={i}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300 hover:border-gold-500/30 hover:bg-white/[0.04]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold-300/90 to-gold-600/90 text-ink-900 shadow-lg">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <h3 className="mt-4 font-display text-base font-semibold text-mist-100">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-mist-400">
                      {pillar.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Brand band */}
        <Reveal className="mt-14">
          <div className="glass-gold flex flex-col items-center gap-3 rounded-2xl px-6 py-6 text-center sm:flex-row sm:justify-center sm:gap-4 sm:text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 shadow-lg">
              <Crown className="h-5 w-5 text-ink-900" strokeWidth={2.4} />
            </span>
            <p className="text-sm text-mist-200">
              <span className="font-display font-semibold text-mist-100">Senate POS</span>{" "}
              — <span className="text-gold-300">Senate Group</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
