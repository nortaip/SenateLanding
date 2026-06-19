import { workflow } from "@/lib/data";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { ArrowRight } from "lucide-react";

export function Workflow() {
  return (
    <section className="relative py-24 sm:py-32">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="How It Works"
          title={
            <>
              From the first tap to{" "}
              <span className="text-gradient-gold">the final report.</span>
            </>
          }
          subtitle="Every order flows through one connected pipeline — no double entry, no lost tickets, no blind spots."
        />

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {workflow.map((w, i) => {
              const Icon = w.icon;
              return (
                <Reveal key={w.step} delay={i} className="relative">
                  <div className="group relative h-full rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300 hover:border-gold-500/30 hover:bg-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 text-ink-900 shadow-lg">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="font-display text-2xl font-bold text-white/5 transition-colors group-hover:text-gold-500/20">
                        {w.step}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-sm font-semibold text-mist-100">
                      {w.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-mist-400">
                      {w.description}
                    </p>
                  </div>

                  {/* connector arrow */}
                  {i < workflow.length - 1 && (
                    <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                      <span className="grid h-6 w-6 place-items-center rounded-full border border-gold-500/20 bg-ink-900 text-gold-400">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
