import { testimonials } from "@/lib/data";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { Quote, Star } from "lucide-react";

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Loved by Operators"
          title={
            <>
              Owners, managers, and cashiers{" "}
              <span className="text-gradient-gold">all agree.</span>
            </>
          }
          subtitle="From single-location cafes to 30-branch chains, teams run smoother on Senate POS."
        />

        <div className="mt-16 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {testimonials.map((t, i) => (
            <Reveal as="article" key={t.name} delay={i % 3} className="break-inside-avoid">
              <div className="glass relative rounded-2xl p-6">
                <Quote className="h-7 w-7 text-gold-500/30" />
                <div className="mt-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-mist-200">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-sm font-bold text-ink-900">
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-mist-100">{t.name}</div>
                    <div className="text-xs text-mist-400">
                      {t.role} · {t.company}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
