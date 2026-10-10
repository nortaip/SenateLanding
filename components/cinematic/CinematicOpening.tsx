"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cinematicConfig } from "@/config/cinematicConfig";
import {
  buildCinematicTimeline,
  createCinematicState,
  type CinematicState,
  type TimelineRefs,
} from "@/lib/animation/cinematicTimeline";
import { CinematicOverlay, StaticOpeningPanel } from "./CinematicOverlay";
import { HANDOFF_HEIGHT, HANDOFF_WIDTH } from "./ScreenTransition";

/** The WebGL bundle (three.js, R3F, drei) is loaded only once the stage is about to mount. */
const RestaurantScene = dynamic(() => import("./RestaurantScene"), {
  ssr: false,
  loading: () => null,
});

gsap.registerPlugin(ScrollTrigger);

type Mode = "pending" | "cinematic" | "static";

/**
 * Catches failures inside the 3D tree (missing assets, shader or context errors) and
 * switches to the static panel, so the page never goes blank.
 */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[cinematic] 3D scene failed, showing static opening", error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The cinematic opening. A pinned stage holds one WebGL canvas, the overlay text, and the DOM
 * layer for the handoff. ScrollTrigger scrubs a single timeline, so scroll controls every
 * visual state. Reduced motion or missing WebGL fall back to a static panel.
 */
export function CinematicOpening() {
  const [mode, setMode] = useState<Mode>("pending");
  const state = useMemo<CinematicState>(() => createCinematicState("desktop"), []);
  const wrapRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const handoffRef = useRef<HTMLDivElement>(null);
  const refs = useRef<TimelineRefs>({
    canvas: null,
    scrim: null,
    hint: null,
    headlines: [null, null, null],
    hero: [null, null, null, null],
    handoff: null,
  }).current;

  // Decide the mode once on the client. Mobile gets the simplified quality profile.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !supportsWebGL()) {
      setMode("static");
      return;
    }
    // Only mount the 3D stage once the screen texture is available. A missing asset
    // would otherwise fail inside the canvas.
    const image = new Image();
    image.onload = () => {
      state.quality = window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
      setMode("cinematic");
    };
    image.onerror = () => setMode("static");
    image.src = cinematicConfig.pos.textureUrl;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [state]);

  // Scroll-scrubbed timeline. GSAP context cleanup reverts the pin and the triggers on unmount.
  useEffect(() => {
    if (mode !== "cinematic") return;
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;

    state.handoffEl = handoffRef.current;
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

    // One-off autoplay light reveal. After it, scroll alone drives the scene.
    const intro = gsap.to(state, {
      intro: 1,
      duration: cinematicConfig.timing.introDuration,
      ease: "power2.out",
      delay: 0.1,
    });

    return () => {
      intro.kill();
      ctx.revert();
      state.handoffEl = null;
      state.handoffActive = false;
    };
  }, [mode, state, refs]);

  if (mode !== "cinematic") {
    return (
      <section ref={wrapRef} id="top" aria-label={cinematicConfig.copy.productHeadline}>
        <StaticOpeningPanel />
      </section>
    );
  }

  return (
    <section ref={wrapRef} id="top" aria-label={cinematicConfig.copy.productHeadline}>
      <div ref={stageRef} className="relative h-[100svh] w-full overflow-hidden bg-[#060b16]">
        <div
          ref={(el) => {
            refs.canvas = el;
          }}
          className="absolute inset-0"
        >
          <SceneBoundary onError={() => setMode("static")}>
            <RestaurantScene
              state={state}
              quality={state.quality}
              onContextLost={() => setMode("static")}
            />
          </SceneBoundary>
        </div>

        <div
          ref={(el) => {
            refs.scrim = el;
          }}
          style={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#060b16]/40 via-[#060b16]/70 to-[#060b16]/95 md:bg-gradient-to-r md:from-[#060b16]/92 md:via-[#060b16]/60 md:to-transparent"
        />

        {/* Senate POS interface: aligned to the 3D screen, then morphed into the product rectangle. */}
        <div
          ref={handoffRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-[2] overflow-hidden rounded-[6px] shadow-[0_0_60px_rgba(59,130,246,0.18)]"
          style={{ width: HANDOFF_WIDTH, height: HANDOFF_HEIGHT, transformOrigin: "0 0", visibility: "hidden" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cinematicConfig.pos.textureUrl}
            alt=""
            draggable={false}
            className="block h-full w-full select-none"
          />
        </div>

        <CinematicOverlay refs={refs} />
      </div>
    </section>
  );
}
