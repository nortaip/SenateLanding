"use client";

import { featureIcons } from "@/lib/data";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { useI18n } from "./i18n/LanguageProvider";

export function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t.features.eyebrow}
          title={
            <>
              {t.features.titleTop}
              <span className="text-gradient-gold">{t.features.titleAccent}</span>
            </>
          }
          subtitle={t.features.subtitle}
        />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureIcons.map((Icon, i) => {
            const f = t.features.items[i];
            return (
              <Reveal as="article" key={f.title} delay={i % 4}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-gold-500/30 hover:bg-white/[0.04]">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-gold-500/20 bg-gold-500/10 text-gold-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-500/20">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-mist-100">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist-400">
                    {f.description}
                  </p>
                  <div className="mt-5 h-px w-full bg-gradient-to-r from-gold-500/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
