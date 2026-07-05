"use client";

import { testimonialMeta } from "@/lib/data";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { Quote, Star } from "lucide-react";
import { useI18n } from "./i18n/LanguageProvider";

/** Initials from a restaurant name, e.g. "Cedar & Sage Group" → "CS". */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function Testimonials() {
  const { t } = useI18n();
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t.testimonials.eyebrow}
          title={
            <>
              {t.testimonials.titleTop}
              <span className="text-gradient-gold">{t.testimonials.titleAccent}</span>
            </>
          }
          subtitle={t.testimonials.subtitle}
        />

        <div className="mt-16 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {testimonialMeta.map((meta, i) => {
            const item = t.testimonials.items[i];
            return (
              <Reveal as="article" key={meta.company} delay={i % 3} className="break-inside-avoid">
                <div className="glass relative rounded-2xl p-6">
                  <Quote className="h-7 w-7 text-gold-500/30" />
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-mist-200">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-sm font-bold text-ink-900">
                      {initials(meta.company)}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-mist-100">{meta.company}</div>
                      <div className="text-xs text-mist-400">{item.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
