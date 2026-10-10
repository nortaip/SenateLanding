import { gsap } from "gsap";
import { cinematicConfig } from "@/config/cinematicConfig";

/**
 * Mutable state written by the timeline and read every frame by the handoff ticker,
 * so scrolling never triggers React renders.
 */
export interface CinematicState {
  /** Scroll-scrubbed timeline progress, 0..1. */
  progress: number;
  /** Interface handoff from the POS screen to the final rectangle, 0..1. */
  morph: number;
}

export function createCinematicState(): CinematicState {
  return { progress: 0, morph: 0 };
}

export interface TimelineRefs {
  entrance: HTMLElement | null;
  entranceZoom: HTMLElement | null;
  entranceImage: HTMLElement | null;
  entranceBloom: HTMLElement | null;
  interior: HTMLElement | null;
  interiorDrift: HTMLElement | null;
  interiorZoom: HTMLElement | null;
  interiorImage: HTMLElement | null;
  screenGlow: HTMLElement | null;
  /** POS screen corners in the photo: TL, TR, BR, BL. */
  screenMarkers: (HTMLElement | null)[];
  handoff: HTMLElement | null;
  scrim: HTMLElement | null;
  hint: HTMLElement | null;
  railFill: HTMLElement | null;
  headlines: (HTMLElement | null)[];
  hero: (HTMLElement | null)[];
}

export function createTimelineRefs(): TimelineRefs {
  return {
    entrance: null,
    entranceZoom: null,
    entranceImage: null,
    entranceBloom: null,
    interior: null,
    interiorDrift: null,
    interiorZoom: null,
    interiorImage: null,
    screenGlow: null,
    screenMarkers: [null, null, null, null],
    handoff: null,
    scrim: null,
    hint: null,
    railFill: null,
    headlines: cinematicConfig.copy.phases.map(() => null),
    hero: [null, null, null, null],
  };
}

/**
 * One timeline spanning 0..1, scrubbed by ScrollTrigger. Every visual change is a function of
 * this single timeline, so scrolling backwards reproduces exactly the same frames.
 */
export function buildCinematicTimeline(state: CinematicState, refs: TimelineRefs): gsap.core.Timeline {
  const { copy, timing, entrance, interior, handoff } = cinematicConfig;
  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  const at = <T,>(el: T | null, fn: (el: T) => void) => {
    if (el) fn(el);
  };

  tl.to(state, { progress: 1, duration: 1 }, 0);

  // 1. Entrance: walk into the open doorway, warm light floods in, the plate dissolves.
  at(refs.entranceZoom, (el) =>
    tl.fromTo(el, { scale: 1 }, { scale: entrance.zoom, duration: entrance.walkEnd, ease: "power2.in" }, 0),
  );
  at(refs.entranceImage, (el) =>
    tl.fromTo(
      el,
      { filter: "blur(0px) brightness(1)" },
      { filter: "blur(6px) brightness(1.3)", duration: entrance.walkEnd * 0.4, ease: "power1.in" },
      entrance.walkEnd * 0.6,
    ),
  );
  at(refs.entranceBloom, (el) =>
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: entrance.walkEnd * 0.5, ease: "power1.in" }, entrance.walkEnd * 0.5),
  );
  at(refs.entrance, (el) =>
    tl.fromTo(
      el,
      { autoAlpha: 1 },
      { autoAlpha: 0, duration: entrance.dissolveEnd - entrance.dissolveStart, ease: "power1.inOut" },
      entrance.dissolveStart,
    ),
  );

  // 2. Interior: comes into focus as the entrance dissolves, then a slow push towards the bar.
  at(refs.interiorImage, (el) => {
    tl.fromTo(
      el,
      { filter: "blur(10px) brightness(1.25)" },
      { filter: "blur(0px) brightness(1)", duration: entrance.dissolveEnd - entrance.dissolveStart + 0.02, ease: "power1.out" },
      entrance.dissolveStart,
    );
    // Depth of field during the close-up: the room softens, the screen stays sharp.
    tl.to(el, { filter: "blur(4px) brightness(0.8)", duration: interior.zoom.end - interior.wake.start, ease: "power1.in" }, interior.wake.start);
  });
  at(refs.interiorDrift, (el) =>
    tl.fromTo(
      el,
      { scale: interior.drift.from },
      { scale: interior.drift.to, duration: interior.drift.end - interior.drift.start, ease: "sine.inOut" },
      interior.drift.start,
    ),
  );

  // 3. Close-up on the POS terminal; the screen glows, then the interface wakes up on it.
  at(refs.interiorZoom, (el) =>
    tl.fromTo(
      el,
      { scale: 1 },
      { scale: interior.zoom.scale, duration: interior.zoom.end - interior.zoom.start, ease: "power2.inOut" },
      interior.zoom.start,
    ),
  );
  at(refs.screenGlow, (el) => {
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "power1.out" }, interior.zoom.start + 0.03);
    tl.to(el, { opacity: 0, duration: 0.04 }, interior.wake.end);
  });
  at(refs.handoff, (el) =>
    tl.fromTo(
      el,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: interior.wake.end - interior.wake.start, ease: "power1.inOut" },
      interior.wake.start,
    ),
  );

  // 4. The interface leaves the screen and settles into the product presentation.
  tl.to(state, { morph: 1, duration: handoff.end - handoff.start, ease: "power2.inOut" }, handoff.start);
  at(refs.interior, (el) => tl.to(el, { opacity: 0.4, duration: 0.08 }, handoff.start + 0.02));
  at(refs.scrim, (el) =>
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: "power1.out" }, handoff.start + 0.03),
  );
  const hero = refs.hero.filter((el): el is HTMLElement => el !== null);
  if (hero.length) {
    tl.fromTo(
      hero,
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 0.05, stagger: 0.01, ease: "power2.out" },
      timing.heroRevealStart,
    );
  }

  // Story copy: each headline fades in, holds, and fades out within its phase.
  copy.phases.forEach((phase, i) => {
    const el = refs.headlines[i];
    if (!el) return;
    const fade = 0.025;
    tl.fromTo(el, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: fade, ease: "power2.out" }, phase.start);
    tl.to(el, { autoAlpha: 0, y: -16, duration: fade, ease: "power2.in" }, phase.end - fade);
  });

  at(refs.hint, (el) => tl.to(el, { autoAlpha: 0, duration: 0.02 }, 0.015));
  at(refs.railFill, (el) => tl.fromTo(el, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0));

  return tl;
}
