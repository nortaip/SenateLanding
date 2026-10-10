import { gsap } from "gsap";
import { cinematicConfig, type QualityLevel } from "@/config/cinematicConfig";
import type { Object3D } from "three";

/**
 * Mutable state shared between the GSAP timeline, the R3F render loop and the DOM.
 * It is written by GSAP and read every frame, so scrolling never triggers React renders.
 */
export interface CinematicState {
  /** Scroll-scrubbed timeline progress, 0..1. Drives the camera and lights. */
  progress: number;
  /** Autoplay intro multiplier, 0..1. Runs once on load, then stays at 1. */
  intro: number;
  /** Front door opening, 0 (closed) .. 1 (open). Scrubbed by the timeline. */
  doorOpen: number;
  /** Screen-to-interface handoff, 0..1. */
  morph: number;
  /** True once the handoff overlay has taken over from the 3D screen. */
  handoffActive: boolean;
  quality: QualityLevel;
  /** Set by POSTerminal; the POS screen mesh the camera is heading for. */
  screenMesh: Object3D | null;
  /** Set by CinematicOpening; the DOM element that carries the Senate POS interface. */
  handoffEl: HTMLDivElement | null;
}

export function createCinematicState(quality: QualityLevel): CinematicState {
  return {
    progress: 0,
    intro: 0,
    doorOpen: 0,
    morph: 0,
    handoffActive: false,
    quality,
    screenMesh: null,
    handoffEl: null,
  };
}

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Light level for a given progress and intro value. Pure, so it is easy to reason about. */
export function lightLevelFor(progress: number, intro: number): number {
  const { dimLevel, onStart, onEnd } = cinematicConfig.lighting;
  const on = dimLevel + (1 - dimLevel) * smoothstep(onStart, onEnd, progress);
  return on * intro;
}

export interface TimelineRefs {
  canvas: HTMLElement | null;
  scrim: HTMLElement | null;
  hint: HTMLElement | null;
  headlines: (HTMLElement | null)[];
  hero: (HTMLElement | null)[];
  handoff: HTMLElement | null;
}

/**
 * One timeline spanning 0..1, scrubbed by ScrollTrigger.
 * Every visual change (camera, text, handoff) is a function of this single timeline,
 * so scrolling forward and backward always reproduces the same frame for a given position.
 */
export function buildCinematicTimeline(
  state: CinematicState,
  refs: TimelineRefs,
): gsap.core.Timeline {
  const { copy, timing } = cinematicConfig;
  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

  // Camera and lights follow the raw progress value.
  tl.to(state, { progress: 1, duration: 1 }, 0);

  // The doors swing open as the camera reaches them.
  tl.to(state, { doorOpen: 1, duration: cinematicConfig.door.duration, ease: "power1.inOut" }, cinematicConfig.door.start);

  // Overlay headlines fade in and out at their configured phase boundaries.
  copy.phases.forEach((phase, i) => {
    const el = refs.headlines[i];
    if (!el) return;
    const fade = 0.05;
    tl.fromTo(
      el,
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: fade, ease: "power2.out" },
      phase.start,
    );
    tl.to(el, { autoAlpha: 0, y: -16, duration: fade, ease: "power2.in" }, phase.end - fade);
  });

  if (refs.hint) {
    tl.to(refs.hint, { autoAlpha: 0, duration: 0.03 }, 0.02);
  }

  // Handoff: the morph value drives the overlay rectangle, and the scrim darkens the copy side.
  const morphDuration = timing.handoffEnd - timing.handoffStart;
  tl.to(state, { morph: 1, duration: morphDuration, ease: "power2.inOut" }, timing.handoffStart);
  if (refs.scrim) {
    tl.fromTo(
      refs.scrim,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.1, ease: "power1.out" },
      timing.handoffStart + 0.02,
    );
  }
  const hero = refs.hero.filter((el): el is HTMLElement => el !== null);
  if (hero.length) {
    tl.fromTo(
      hero,
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 0.06, stagger: 0.012, ease: "power2.out" },
      timing.heroRevealStart,
    );
  }
  if (refs.canvas) {
    // The restaurant stays faintly visible behind the product copy.
    tl.to(refs.canvas, { opacity: 0.45, duration: 0.08 }, timing.handoffStart + 0.04);
  }

  return tl;
}
