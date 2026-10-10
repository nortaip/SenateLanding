import { cinematicConfig } from "@/config/cinematicConfig";
import { containRect, lerpQuad, quadToMatrix3d, type Point } from "./projection";

type Quad = [Point, Point, Point, Point];

/**
 * Places the interface element on the POS screen in the photo, then morphs it to the final
 * product rectangle.
 *
 * The screen corners are four zero-size markers inside the zoomed photo, so their client
 * rects already include every transform (drift, close-up, handheld). A homography maps the
 * element onto that quad, which keeps the interface pinned to the physical screen while the
 * camera moves. `morph` (0..1) blends the quad towards the final rectangle.
 */
export function placeHandoff(
  stage: HTMLElement,
  el: HTMLElement,
  markers: (HTMLElement | null)[],
  morph: number,
): void {
  const s = stage.getBoundingClientRect();
  if (s.width === 0 || s.height === 0 || markers.length !== 4 || markers.some((m) => !m)) return;

  const screen = markers.map((m) => {
    const r = (m as HTMLElement).getBoundingClientRect();
    return [r.left - s.left, r.top - s.top] as Point;
  }) as Quad;

  const { handoff, handoffTarget } = cinematicConfig;
  const box = s.width / s.height < 1 ? handoffTarget.mobile : handoffTarget.desktop;
  const rect = containRect(
    { x: box.left * s.width, y: box.top * s.height, w: box.width * s.width, h: box.height * s.height },
    handoff.width / handoff.height,
  );
  const target: Quad = [
    [rect.x, rect.y],
    [rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y + rect.h],
    [rect.x, rect.y + rect.h],
  ];

  el.style.transform = quadToMatrix3d(lerpQuad(screen, target, morph), handoff.width, handoff.height);
}
