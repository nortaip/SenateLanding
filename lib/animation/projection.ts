export type Point = readonly [number, number];

/**
 * Unit square corners in texture order: top-left, top-right, bottom-right, bottom-left.
 * Maps a quad of pixel coordinates to a CSS `matrix3d()` string.
 *
 * The DOM element is `width` x `height` CSS px with `transform-origin: 0 0`. Its local
 * (x, y) pixel is projected by the homography H = quad <- unit square, so the element
 * lands exactly on the projected quad, including perspective foreshortening.
 */
export function quadToMatrix3d(quad: readonly [Point, Point, Point, Point], width: number, height: number): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;

  // Heckbert's closed form for the square -> quad homography.
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const c = x0;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  const f = y0;

  // Fold the element-pixel -> unit-square scale into the matrix.
  const n00 = a / width;
  const n01 = b / height;
  const n02 = c;
  const n10 = d / width;
  const n11 = e / height;
  const n12 = f;
  const n20 = g / width;
  const n21 = h / height;
  const n22 = 1;

  // CSS matrix3d is column-major; z is unused for a flat plane.
  const values = [
    n00, n10, 0, n20,
    n01, n11, 0, n21,
    0, 0, 1, 0,
    n02, n12, 0, n22,
  ];
  return `matrix3d(${values.map((v) => (Number.isFinite(v) ? v.toFixed(6) : "0")).join(",")})`;
}

/** Largest rectangle with the given aspect ratio that fits inside `box`, centred. */
export function containRect(
  box: { x: number; y: number; w: number; h: number },
  aspect: number,
): { x: number; y: number; w: number; h: number } {
  let w = box.w;
  let h = w / aspect;
  if (h > box.h) {
    h = box.h;
    w = h * aspect;
  }
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

/** Linear interpolation between two quads, corner by corner. */
export function lerpQuad(
  from: readonly [Point, Point, Point, Point],
  to: readonly [Point, Point, Point, Point],
  t: number,
): [Point, Point, Point, Point] {
  const lerp = (p: Point, q: Point): Point => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  return [lerp(from[0], to[0]), lerp(from[1], to[1]), lerp(from[2], to[2]), lerp(from[3], to[3])];
}
