import { Reveal } from "./ui/Reveal";
import { ArrowRight, PlayCircle } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="demo" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-gold-500/20 bg-gradient-to-br from-ink-800 to-ink-900 px-6 py-16 text-center sm:px-12 sm:py-24">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div
              className="animate-aurora pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.25), transparent)" }}
              aria-hidden
            />

            <div className="relative">
              <h2 className="mx-auto max-w-3xl font-display text-3xl font-bold leading-[1.1] tracking-tight text-mist-100 sm:text-5xl">
                Ready to Transform Your{" "}
                <span className="text-gradient-gold">Restaurant Operations?</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-mist-300 sm:text-lg">
                Join 14,000+ restaurants running smarter, faster service on Senate POS.
                See it live in a personalized demo.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 px-8 py-4 text-sm font-semibold text-ink-900 shadow-xl transition-transform hover:scale-[1.03] sm:w-auto"
                >
                  Request Demo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#"
                  className="glass group inline-flex w-full items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-semibold text-mist-100 hover:bg-white/5 sm:w-auto"
                >
                  <PlayCircle className="h-5 w-5 text-gold-400" />
                  Watch Video
                </a>
              </div>
              <p className="mt-5 text-xs text-mist-500">
                14-day free trial · No credit card · Cancel anytime
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
