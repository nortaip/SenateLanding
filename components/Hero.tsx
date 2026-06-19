"use client";

import { motion } from "framer-motion";
import { PlayCircle, ArrowRight, Sparkles } from "lucide-react";
import {
  BrowserFrame,
  DashboardMockup,
  PhoneMockup,
  KitchenMockup,
} from "./ui/Mockups";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 sm:pt-40">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <div
        className="animate-aurora pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(212,175,55,0.30), transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-40 top-40 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(59,130,246,0.18), transparent)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Copy */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.a
            href="#ecosystem"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="glass-gold group inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-gold-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            The restaurant operating system, reimagined
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.a>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.06, ease }}
            className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-mist-100 sm:text-6xl md:text-7xl"
          >
            The Complete
            <br />
            <span className="text-gradient-gold">Restaurant Operating System</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.14, ease }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-mist-300 sm:text-lg"
          >
            Manage sales, tables, kitchen operations, inventory, staff, and
            reporting from a single platform — built for restaurants, cafes, food
            courts, lounges, and chains.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.22, ease }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <a
              href="#demo"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-semibold text-ink-900 shadow-xl transition-transform hover:scale-[1.03] sm:w-auto"
            >
              Request Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#"
              className="glass group inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-mist-100 transition-colors hover:bg-white/5 sm:w-auto"
            >
              <PlayCircle className="h-5 w-5 text-gold-400" />
              Watch Video
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-5 text-xs text-mist-500"
          >
            No credit card required · 14-day trial · Setup in under an hour
          </motion.p>
        </div>

        {/* Device showcase */}
        <div className="relative mx-auto mt-16 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease }}
            className="relative"
          >
            {/* Glow under devices */}
            <div
              className="pointer-events-none absolute inset-x-10 -bottom-10 top-10 rounded-[2rem] blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(212,175,55,0.22), transparent)",
              }}
              aria-hidden
            />

            {/* Desktop Back Office */}
            <div className="relative z-10">
              <BrowserFrame label="app.senatepos.com · Back Office">
                <DashboardMockup />
              </BrowserFrame>
              <div className="mt-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-mist-500">
                Desktop Back Office
              </div>
            </div>

            {/* Floating Mobile POS */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.6, ease }}
              className="animate-float absolute -bottom-10 -left-4 z-20 hidden w-[180px] sm:block lg:-left-12"
            >
              <div className="scale-90">
                <PhoneMockup />
              </div>
              <div className="mt-1 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-mist-500">
                Mobile POS
              </div>
            </motion.div>

            {/* Floating Kitchen Display */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 1, delay: 0.7, ease }}
              className="absolute -right-6 -top-10 z-20 hidden w-[300px] lg:block"
              style={{ animation: "float 8s var(--ease-soft) infinite" }}
            >
              <div className="glass overflow-hidden rounded-2xl shadow-2xl">
                <KitchenMockup />
              </div>
              <div className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-mist-500">
                Kitchen Display
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
