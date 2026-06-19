import { trustedLogos, trustStats } from "@/lib/data";
import { Reveal } from "./ui/Reveal";
import { UtensilsCrossed } from "lucide-react";

export function TrustedBy() {
  const logos = [...trustedLogos, ...trustedLogos];
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-mist-500">
            Trusted by ambitious restaurants & chains worldwide
          </p>
        </Reveal>

        {/* Logo marquee */}
        <div className="marquee-mask relative mt-10 overflow-hidden">
          <div className="animate-marquee flex w-max gap-4">
            {logos.map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="glass flex shrink-0 items-center gap-2.5 rounded-xl px-6 py-3.5"
              >
                <UtensilsCrossed className="h-4 w-4 text-gold-400" />
                <span className="whitespace-nowrap font-display text-sm font-semibold text-mist-200">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 md:grid-cols-4">
          {trustStats.map((s, i) => (
            <Reveal key={s.label} delay={i} className="bg-ink-900/70 p-6 text-center sm:p-8">
              <div className="font-display text-2xl font-bold text-gradient-gold sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1.5 text-xs text-mist-400 sm:text-sm">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
