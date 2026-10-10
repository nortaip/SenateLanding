/**
 * Tunable parameters for the cinematic opening.
 * Everything that controls timing, framing and copy lives here, so the experience can be
 * adjusted without touching the components. Progress values are fractions of the pinned
 * scroll (0 = top of the page, 1 = end of the opening).
 */

export const cinematicConfig = {
  copy: {
    scrollHint: "Scroll to explore",
    railLabel: "Scroll",
    /** Each headline holds for roughly one viewport of scroll, so it can be read. */
    phases: [
      { id: "arrival", start: 0.02, end: 0.12, text: "Hər möhtəşəm xidmət bir addımla başlayır.", sub: "" },
      { id: "story", start: 0.22, end: 0.34, text: "Hər restoranın bir hekayəsi var.", sub: "" },
      {
        id: "order",
        start: 0.38,
        end: 0.5,
        text: "Hər sifariş bir hərəkətlə başlayır.",
        sub: "Qonaq rahatlığı. Texnologiyanın görünməyən gücü.",
      },
      { id: "system", start: 0.54, end: 0.66, text: "Bütün proseslər bir sistemdə birləşir.", sub: "" },
    ],
    brandLine: "Senate POS — restoranınızın rəqəmsal idarəetmə sistemi.",
    productHeadline: "Tam Restoran Əməliyyat Sistemi",
    primaryCta: { label: "Demo tələb et", href: "#demo" },
    secondaryCta: { label: "Sistemi kəşf et", href: "#ecosystem" },
    staticAlt: "Senate POS back office interface",
  },

  timing: {
    /** Pinned distance, in viewport heights of scroll. Longer = slower, more time to read. */
    scrollViewports: 9,
    /** ScrollTrigger scrub smoothing in seconds (0 = exact follow). */
    scrubSmoothing: 1,
    /** Product copy appears once the interface has reached its final rectangle. */
    heroRevealStart: 0.89,
  },

  /**
   * Street entrance (photographic plate). Scroll walks the camera into the open doorway by
   * scaling around the corridor's vanishing point, then the plate dissolves into the interior.
   * Image coordinates are percentages.
   */
  entrance: {
    imageUrl: "/cinematic/entrance.webp",
    imageWidth: 1672,
    imageHeight: 941,
    alt: "Senate POS restoranının axşam girişi: daş sütunlar, açıq şüşə qapılar və isti işıqlı zal",
    /** Vanishing point of the corridor seen through the doors. */
    focus: { x: 50, y: 47 },
    /** Crop centre on narrow (portrait) screens. */
    crop: { x: 50, y: 50 },
    zoom: 2.4,
    walkEnd: 0.17,
    dissolveStart: 0.15,
    dissolveEnd: 0.2,
    sconces: [
      { x: 23.7, y: 19.9 },
      { x: 76.7, y: 19.9 },
    ],
    /** "Better food / Better people / Better moments" panel on the right pillar: a link. */
    betterPanel: { left: 84.2, top: 10.8, width: 7.8, height: 26.2, href: "#ecosystem" },
  },

  /**
   * Dining room and bar (photographic plate). A slow push towards the bar while the story
   * copy plays, then the camera closes in on the POS terminal and enters its screen.
   */
  interior: {
    imageUrl: "/cinematic/interior.webp",
    imageWidth: 1672,
    imageHeight: 941,
    alt: "Senate POS restoranının zalı: mərmər bar, barın üzərində Senate POS terminalı, məxmər oturacaqlar",
    /** Crop centre on narrow (portrait) screens: keep the bar and the POS in view. */
    crop: { x: 72, y: 50 },
    /** Slow push while the story copy plays. */
    drift: { start: 0.15, end: 0.66, from: 1.06, to: 1.16, origin: { x: 68, y: 50 } },
    /** POS screen corners in the photo, in texture order: TL, TR, BR, BL (percent). */
    screen: [
      [73.27, 43.78],
      [80.2, 43.57],
      [77.63, 54.09],
      [70.81, 53.24],
    ] as [number, number][],
    /** Close-up on the POS screen. */
    zoom: { start: 0.64, end: 0.8, scale: 4.2 },
    /** The Senate POS interface fades in on the screen ("the POS wakes up"). */
    wake: { start: 0.72, end: 0.78 },
  },

  /** The interface leaves the screen and settles into the product presentation. */
  handoff: {
    imageUrl: "/cinematic/senate-pos-screen.png",
    /** CSS pixel size of the handoff element; matches a 16:10 POS display. */
    width: 1600,
    height: 1000,
    start: 0.8,
    end: 0.9,
  },

  /**
   * Final rectangle of the product presentation, as fractions of the stage.
   * The interface is contain-fitted inside this box so it never distorts.
   */
  handoffTarget: {
    desktop: { left: 0.4, top: 0.12, width: 0.56, height: 0.76 },
    mobile: { left: 0.05, top: 0.1, width: 0.9, height: 0.42 },
  },
} as const;

export type CinematicConfig = typeof cinematicConfig;
