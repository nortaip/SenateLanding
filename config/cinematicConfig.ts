/**
 * Tunable parameters for the cinematic opening.
 * Everything that controls timing, camera framing, lighting and quality lives here
 * so the experience can be adjusted without touching the scene code.
 */

export const cinematicConfig = {
  copy: {
    scrollHint: "Scroll to explore",
    phases: [
      { id: "arrival", start: 0.03, end: 0.13, text: "Hər möhtəşəm xidmət bir addımla başlayır." },
      { id: "awakening", start: 0.2, end: 0.34, text: "Hər restoranın bir hekayəsi var." },
      { id: "entering", start: 0.4, end: 0.54, text: "Hər sifariş bir hərəkətlə başlayır." },
      { id: "approach", start: 0.6, end: 0.78, text: "Bütün proseslər bir sistemdə birləşir." },
    ],
    brandLine: "Senate POS — restoranınızın rəqəmsal idarəetmə sistemi.",
    productHeadline: "Tam Restoran Əməliyyat Sistemi",
    primaryCta: { label: "Demo tələb et", href: "#demo" },
    secondaryCta: { label: "Sistemi kəşf et", href: "#ecosystem" },
    staticAlt: "Senate POS back office interface",
  },

  timing: {
    /** Pinned distance, in viewport heights of scroll. */
    scrollViewports: 3.4,
    /** ScrollTrigger scrub smoothing in seconds (0 = exact, deterministic follow). */
    scrubSmoothing: 0.8,
    /** Timeline position at which the 3D screen is handed to the HTML layer. */
    handoffStart: 0.8,
    /** Timeline position at which the handoff reaches its final rectangle. */
    handoffEnd: 0.94,
    /** Timeline position at which the product copy starts to appear. */
    heroRevealStart: 0.86,
    /** Autoplay light reveal on first load, in seconds. */
    introDuration: 2.4,
  },

  lighting: {
    /** Interior lights stay low while the camera is still outside at dusk. */
    dimLevel: 0.12,
    /** Progress range over which the interior lights come up, as the camera enters. */
    onStart: 0.14,
    onEnd: 0.3,
  },

  /** Doorway opening, in timeline progress. */
  door: { start: 0.04, duration: 0.09 },

  camera: {
    fov: { desktop: 42, mobile: 56 },
    eyeHeight: 1.5,
    /** Minimum camera distance from the POS screen at the end of the path. */
    minFinalDistance: 0.34,
    /** Waypoints: position and look-at target, sampled along the path in order. */
    waypoints: [
      // Exterior, at dusk: approach the doors along the paving
      { position: [0.0, 1.5, 14.0], target: [0.0, 1.5, 6.0] },
      { position: [0.1, 1.5, 9.5], target: [0.0, 1.45, 6.0] },
      // Through the doorway and into the room
      { position: [0.6, 1.55, 5.2], target: [0.0, 1.1, 0.0] },
      { position: [0.0, 1.5, 2.6], target: [0.4, 1.1, -1.0] },
      { position: [0.5, 1.5, 0.0], target: [1.8, 1.2, -3.0] },
      { position: [1.6, 1.5, -2.6], target: [3.4, 1.2, -4.6] },
      { position: [2.2, 1.5, -4.2], target: [3.35, 1.3, -5.0] },
    ],
  },

  pos: {
    /** Base of the terminal, standing on the counter top. */
    basePosition: [3.45, 1.05, -5.0] as [number, number, number],
    /** Screen centre height above the counter top. */
    screenCenterY: 0.45,
    /** Screen plane size in metres. */
    width: 0.42,
    aspect: 2.8,
    textureUrl: "/cinematic/senate-pos-screen.png",
  },

  /**
   * Final rectangle of the product presentation, as fractions of the stage.
   * The screen is contain-fitted inside this box so its aspect ratio never distorts.
   */
  handoffTarget: {
    desktop: { left: 0.36, top: 0.08, width: 0.6, height: 0.84 },
    mobile: { left: 0.04, top: 0.06, width: 0.92, height: 0.5 },
  },

  quality: {
    desktop: { dpr: 1.75, tables: 5, pointLights: 4, chainStrands: 520, bottles: 90 },
    mobile: { dpr: 1.25, tables: 3, pointLights: 2, chainStrands: 160, bottles: 36 },
  },

  palette: {
    background: "#060b16",
    fog: "#0a111f",
    navy: "#1b2a4a",
    navyVelvet: "#1d2940",
    woodDark: "#2e1b12",
    woodMid: "#4a2c1b",
    marble: "#2a1d18",
    brass: "#c9a25a",
    warm: "#ffb36b",
    senateBlue: "#3b82f6",
  },
} as const;

export type CinematicConfig = typeof cinematicConfig;
export type QualityLevel = "desktop" | "mobile";
