"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { screenshots } from "@/lib/data";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import {
  BrowserFrame,
  DashboardMockup,
  PhoneMockup,
  KitchenMockup,
} from "./ui/Mockups";

function Preview({
  device,
  accent,
  title,
}: {
  device: string;
  accent: string;
  title: string;
}) {
  if (device === "mobile") {
    return (
      <div className="grid place-items-center py-6">
        <PhoneMockup accent={accent} />
      </div>
    );
  }
  if (device === "tablet") {
    return (
      <BrowserFrame label={`Senate POS · ${title}`}>
        <KitchenMockup accent={accent} />
      </BrowserFrame>
    );
  }
  return (
    <BrowserFrame label={`app.senatepos.com · ${title}`}>
      <DashboardMockup accent={accent} />
    </BrowserFrame>
  );
}

export function Screenshots() {
  const [active, setActive] = useState(0);
  const current = screenshots[active];

  return (
    <section id="screenshots" className="relative py-24 sm:py-32">
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[700px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.10), transparent)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Product Tour"
          title={
            <>
              Designed to be lived in,{" "}
              <span className="text-gradient-gold">shift after shift.</span>
            </>
          }
          subtitle="A look inside the interfaces your team will use every day — clear, fast, and built for the pace of a real restaurant."
        />

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Tabs */}
          <Reveal className="order-2 lg:order-1">
            <div className="space-y-2">
              {screenshots.map((s, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(i)}
                    className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300 ${
                      isActive
                        ? "border-gold-500/40 bg-white/[0.05]"
                        : "border-transparent hover:border-white/10 hover:bg-white/[0.02]"
                    }`}
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-xs font-bold transition-colors"
                      style={{
                        background: isActive ? s.accent : "rgba(255,255,255,0.05)",
                        color: isActive ? "#081120" : "#8392ad",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span
                        className={`block font-display text-sm font-semibold ${
                          isActive ? "text-mist-100" : "text-mist-300"
                        }`}
                      >
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-mist-500">{s.blurb}</span>
                    </span>
                    <ArrowUpRight
                      className={`h-4 w-4 shrink-0 transition-all ${
                        isActive ? "text-gold-400 opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Preview */}
          <div className="order-1 lg:order-2">
            <Reveal>
              <div className="relative">
                <div
                  className="pointer-events-none absolute -inset-6 rounded-[2rem] blur-3xl transition-colors duration-500"
                  style={{ background: `radial-gradient(closest-side, ${current.accent}22, transparent)` }}
                  aria-hidden
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                  >
                    <Preview device={current.device} accent={current.accent} title={current.title} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
