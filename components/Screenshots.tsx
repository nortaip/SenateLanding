"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ArrowUpRight, MousePointerClick } from "lucide-react";
import { screenshotMeta, type ScreenshotMeta } from "@/lib/data";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import {
  BrowserFrame,
  DashboardMockup,
  PhoneMockup,
  KitchenMockup,
} from "./ui/Mockups";
import { useI18n } from "./i18n/LanguageProvider";

function Preview({
  device,
  accent,
  title,
}: {
  device: ScreenshotMeta["device"];
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

/** A single scroll "stop". Reports itself active when it crosses viewport center. */
function ScrollRow({
  index,
  active,
  onActive,
  meta,
  title,
  blurb,
}: {
  index: number;
  active: boolean;
  onActive: (i: number) => void;
  meta: ScreenshotMeta;
  title: string;
  blurb: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-50% 0px -50% 0px" });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div ref={ref} className="lg:flex lg:min-h-[62vh] lg:items-center">
      <div className="w-full py-6 lg:py-0">
        <div
          className={`flex items-center gap-4 transition-all duration-500 ${
            active ? "opacity-100" : "opacity-100 lg:opacity-40"
          }`}
        >
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg font-display text-xs font-bold transition-all duration-500"
            style={{
              background: active ? meta.accent : "rgba(255,255,255,0.05)",
              color: active ? "#081120" : "#8392ad",
              transform: active ? "scale(1.05)" : "scale(1)",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1">
            <h3
              className={`font-display text-lg font-semibold transition-colors duration-500 sm:text-xl ${
                active ? "text-mist-100" : "text-mist-300"
              }`}
            >
              {title}
            </h3>
            <p className="mt-1 text-sm text-mist-400">{blurb}</p>
          </div>
          <ArrowUpRight
            className={`hidden h-5 w-5 shrink-0 transition-all duration-500 lg:block ${
              active ? "text-gold-400 opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Mobile inline preview (sticky panel is desktop-only) */}
        <div className="mt-6 lg:hidden">
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-4 rounded-[2rem] blur-3xl"
              style={{ background: `radial-gradient(closest-side, ${meta.accent}22, transparent)` }}
              aria-hidden
            />
            <div className="relative">
              <Preview device={meta.device} accent={meta.accent} title={title} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Screenshots() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const current = screenshotMeta[active];
  const currentText = t.screenshots.items[active];

  return (
    <section id="screenshots" className="relative py-24 sm:py-32">
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[700px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.10), transparent)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t.screenshots.eyebrow}
          title={
            <>
              {t.screenshots.titleTop}
              <span className="text-gradient-gold">{t.screenshots.titleAccent}</span>
            </>
          }
          subtitle={t.screenshots.subtitle}
        />

        <Reveal className="mt-6 flex justify-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-mist-300">
            <MousePointerClick className="h-3.5 w-3.5 text-gold-400" />
            {t.screenshots.scrollHint}
          </span>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Scroll list */}
          <div className="relative">
            {/* progress rail (desktop) */}
            <div className="pointer-events-none absolute left-5 top-0 hidden h-full w-px bg-white/5 lg:block">
              <motion.div
                className="w-px bg-gradient-to-b from-gold-400 to-gold-600"
                initial={false}
                animate={{
                  height: `${((active + 1) / screenshotMeta.length) * 100}%`,
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <div className="lg:pl-12">
              {screenshotMeta.map((meta, i) => (
                <ScrollRow
                  key={meta.id}
                  index={i}
                  active={i === active}
                  onActive={setActive}
                  meta={meta}
                  title={t.screenshots.items[i].title}
                  blurb={t.screenshots.items[i].blurb}
                />
              ))}
            </div>
          </div>

          {/* Sticky preview (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-28 flex h-[calc(100vh-12rem)] items-center">
              <div className="relative w-full">
                <div
                  className="pointer-events-none absolute -inset-6 rounded-[2rem] blur-3xl transition-colors duration-500"
                  style={{ background: `radial-gradient(closest-side, ${current.accent}22, transparent)` }}
                  aria-hidden
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.97 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                  >
                    <Preview
                      device={current.device}
                      accent={current.accent}
                      title={currentText.title}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
