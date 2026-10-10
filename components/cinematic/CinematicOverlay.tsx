"use client";

import { ArrowRight, PlayCircle } from "lucide-react";
import { cinematicConfig } from "@/config/cinematicConfig";
import type { TimelineRefs } from "@/lib/animation/cinematicTimeline";

const { copy, handoff, interior } = cinematicConfig;

/**
 * Text layer for the stage. Elements are written into `refs` through callback refs, and the
 * timeline animates them. React never re-renders them during scroll.
 */
export function CinematicOverlay({ refs }: { refs: TimelineRefs }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {copy.phases.map((phase, i) => (
        <div
          key={phase.id}
          ref={(el) => {
            refs.headlines[i] = el;
          }}
          style={{ opacity: 0 }}
          className="absolute inset-x-6 bottom-[13vh] max-w-[36rem] drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] md:left-[7vw] md:right-auto"
        >
          <span className="mb-5 block h-px w-12 bg-gold-400/90" aria-hidden />
          <p className="font-display text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-mist-100 sm:text-4xl md:text-[2.75rem]">
            {phase.text}
          </p>
          {phase.sub && <p className="mt-4 text-sm text-mist-300 sm:text-base">{phase.sub}</p>}
        </div>
      ))}

      {/* Scroll rail: fills as the opening progresses */}
      <div className="absolute bottom-[9vh] right-8 hidden flex-col items-center gap-4 md:flex lg:right-12" aria-hidden>
        <span className="rotate-180 text-[10px] font-medium uppercase tracking-[0.35em] text-mist-300/80 [writing-mode:vertical-rl]">
          {copy.railLabel}
        </span>
        <span className="relative h-32 w-px bg-white/15">
          <span
            ref={(el) => {
              refs.railFill = el;
            }}
            className="absolute inset-0 origin-top bg-gold-400"
            style={{ transform: "scaleY(0)" }}
          />
        </span>
      </div>

      <div
        ref={(el) => {
          refs.hint = el;
        }}
        className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-mist-400"
      >
        <span>{copy.scrollHint}</span>
        <span className="relative h-8 w-px overflow-hidden bg-white/10" aria-hidden>
          <span className="absolute inset-x-0 top-0 h-3 animate-[scrollline_1.8s_ease-in-out_infinite] bg-gold-400" />
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none">
        <HeroCopy refs={refs} />
      </div>
    </div>
  );
}

/** Product reveal, shown once the camera has reached the screen. Interactive, unlike the rest of the stage. */
function HeroCopy({ refs }: { refs: TimelineRefs }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-end px-6 pb-[8vh] pt-[8vh] sm:px-10 md:items-center md:pb-0 md:pt-0 md:pl-[6vw] md:pr-[64%]">
      <div className="pointer-events-auto w-full max-w-xl">
        <div
          ref={(el) => {
            if (el) refs.hero[0] = el;
          }}
          style={{ opacity: 0 }}
          className="flex items-center gap-3"
        >
          <img src="/favicon.svg" alt="" width={36} height={36} className="h-9 w-9" aria-hidden />
          <span className="font-display text-sm font-semibold tracking-[0.22em] text-mist-100">SENATE POS</span>
        </div>
        <h1
          ref={(el) => {
            if (el) refs.hero[1] = el;
          }}
          style={{ opacity: 0 }}
          className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-mist-100 sm:text-5xl md:text-6xl"
        >
          <span className="text-gradient-gold">{copy.productHeadline}</span>
        </h1>
        <p
          ref={(el) => {
            if (el) refs.hero[2] = el;
          }}
          style={{ opacity: 0 }}
          className="mt-5 max-w-lg text-base leading-relaxed text-mist-300 sm:text-lg"
        >
          {copy.brandLine}
        </p>
        <CtaRow
          wrap={(el) => {
            if (el) refs.hero[3] = el;
          }}
        />
      </div>
    </div>
  );
}

function CtaRow({ wrap }: { wrap: (el: HTMLDivElement | null) => void }) {
  return (
    <div ref={wrap} style={{ opacity: 0 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
      <a
        href={copy.primaryCta.href}
        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-semibold text-ink-900 shadow-xl transition-transform hover:scale-[1.03]"
      >
        <PlayCircle className="h-5 w-5" aria-hidden />
        {copy.primaryCta.label}
      </a>
      <a
        href={copy.secondaryCta.href}
        className="glass group inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-mist-100 transition-colors hover:bg-white/5"
      >
        {copy.secondaryCta.label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </a>
    </div>
  );
}

/**
 * Static opening for reduced motion, missing WebGL and first paint. Same copy, same product
 * image, no pinning or 3D.
 */
export function StaticOpeningPanel() {
  return (
    <div className="relative flex h-[100svh] min-h-[560px] w-full items-center overflow-hidden bg-[#060b16]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={interior.imageUrl}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
        style={{ objectPosition: `${interior.crop.x}% ${interior.crop.y}%` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#060b16] via-[#060b16]/80 to-[#060b16]/30" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-8 md:grid-cols-[1fr_1.4fr]">
        <div className="pt-24 md:pt-0">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" width={36} height={36} className="h-9 w-9" aria-hidden />
            <span className="font-display text-sm font-semibold tracking-[0.22em] text-mist-100">SENATE POS</span>
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            <span className="text-gradient-gold">{copy.productHeadline}</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-mist-300 sm:text-lg">{copy.brandLine}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={copy.primaryCta.href}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-semibold text-ink-900 shadow-xl"
            >
              {copy.primaryCta.label}
            </a>
            <a
              href={copy.secondaryCta.href}
              className="glass inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-mist-100"
            >
              {copy.secondaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
        <div className="glass overflow-hidden rounded-2xl shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={handoff.imageUrl}
            alt={copy.staticAlt}
            width={handoff.width}
            height={handoff.height}
            className="aspect-[16/10] h-auto w-full bg-[#091220] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
