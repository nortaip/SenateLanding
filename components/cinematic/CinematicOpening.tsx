"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cinematicConfig } from "@/config/cinematicConfig";
import {
  buildCinematicTimeline,
  createCinematicState,
  createTimelineRefs,
  type CinematicState,
} from "@/lib/animation/cinematicTimeline";
import { placeHandoff } from "@/lib/animation/screenHandoff";
import { CinematicOverlay, StaticOpeningPanel } from "./CinematicOverlay";
import { EntrancePlate } from "./EntrancePlate";
import { InteriorPlate } from "./InteriorPlate";

gsap.registerPlugin(ScrollTrigger);

type Mode = "pending" | "cinematic" | "static";

/**
 * The cinematic opening: street entrance → walk through the doors → dining room and bar →
 * close-up on the POS terminal → the Senate POS interface leaves the screen and becomes the
 * product presentation.
 *
 * A pinned stage holds two photographic plates, the interface layer and the copy. One
 * ScrollTrigger-scrubbed timeline drives everything, so scrolling back reverses it exactly.
 * Reduced motion falls back to a static panel.
 */
export function CinematicOpening() {
  const [mode, setMode] = useState<Mode>("pending");
  const state = useMemo<CinematicState>(() => createCinematicState(), []);
  const wrapRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const refs = useRef(createTimelineRefs()).current;

  // Decide the mode once on the client.
  useEffect(() => {
    // Local development only: ignore the OS reduced-motion setting, so the opening can be
    // reviewed on machines where animations are off. ?reduced=1 previews the static fallback.
    // Production always respects prefers-reduced-motion.
    const params = new URLSearchParams(window.location.search);
    const reduced =
      process.env.NODE_ENV !== "production"
        ? params.has("reduced")
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) console.info("[cinematic] static opening: reducedMotion=true");
    setMode(reduced ? "static" : "cinematic");
  }, []);

  // Scroll-scrubbed timeline, plus a ticker that keeps the interface on the POS screen.
  // GSAP context cleanup reverts the pin and the triggers on unmount.
  useEffect(() => {
    if (mode !== "cinematic") return;
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;

    const ctx = gsap.context(() => {
      const tl = buildCinematicTimeline(state, refs);
      ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: () => `+=${window.innerHeight * cinematicConfig.timing.scrollViewports}`,
        pin: stage,
        pinSpacing: true,
        scrub: cinematicConfig.timing.scrubSmoothing,
        animation: tl,
        invalidateOnRefresh: true,
      });
    }, wrap);

    const wakeStart = cinematicConfig.interior.wake.start;
    const tick = () => {
      const el = refs.handoff;
      if (!el || state.progress < wakeStart - 0.02) return;
      placeHandoff(stage, el, refs.screenMarkers, state.morph);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      ctx.revert();
    };
  }, [mode, state, refs]);

  if (mode === "static") {
    return (
      <section ref={wrapRef} id="top" aria-label={cinematicConfig.copy.productHeadline}>
        <StaticOpeningPanel />
      </section>
    );
  }

  // Until the client decides, show the entrance's first frame, so there is no visual swap.
  if (mode === "pending") {
    return (
      <section ref={wrapRef} id="top" aria-label={cinematicConfig.copy.productHeadline}>
        <div className="relative h-[100svh] w-full overflow-hidden bg-[#0b0806]">
          <EntrancePlate />
        </div>
      </section>
    );
  }

  const { handoff } = cinematicConfig;
  return (
    <section ref={wrapRef} id="top" aria-label={cinematicConfig.copy.productHeadline}>
      <div ref={stageRef} className="relative h-[100svh] w-full overflow-hidden bg-[#0b0806]">
        {/* z-1 interior, z-2 entrance, z-3 scrim, z-4 interface, z-5 copy */}
        <InteriorPlate refs={refs} />
        <EntrancePlate refs={refs} />

        <div
          ref={(el) => {
            refs.scrim = el;
          }}
          style={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-b from-[#060b16]/40 via-[#060b16]/70 to-[#060b16]/95 md:bg-gradient-to-r md:from-[#060b16]/92 md:via-[#060b16]/60 md:to-transparent"
        />

        {/* Senate POS interface: pinned to the POS screen in the photo, then the product presentation */}
        <div
          ref={(el) => {
            refs.handoff = el;
          }}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-[4] overflow-hidden rounded-[10px] bg-[#091220] shadow-[0_30px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(59,130,246,0.18)]"
          style={{
            width: handoff.width,
            height: handoff.height,
            transformOrigin: "0 0",
            visibility: "hidden",
            opacity: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={handoff.imageUrl}
            alt=""
            draggable={false}
            className="block h-full w-full select-none object-contain"
          />
        </div>

        <CinematicOverlay refs={refs} />
      </div>
    </section>
  );
}
