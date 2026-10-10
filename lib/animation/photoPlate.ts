import type { CSSProperties } from "react";

/** Slight oversize so the handheld drift never reveals an edge. */
const OVERSCAN = 1.03;

/**
 * Style for a photo frame that keeps the image's aspect ratio and covers its container
 * (which must set `container-type: size`). The frame is positioned so that `crop` (image
 * percentages) stays in view on narrow screens, but it never uncovers the container.
 * Children laid out with `inset-0` share the frame's box, so percentages inside it are
 * image percentages, and `origin` is the zoom origin in image percentages.
 */
export function coverFrameStyle(
  aspect: number,
  crop: { x: number; y: number },
  origin: { x: number; y: number },
): CSSProperties {
  const w = `(max(100cqw, 100cqh * ${aspect}) * ${OVERSCAN})`;
  const h = `(max(100cqw / ${aspect}, 100cqh) * ${OVERSCAN})`;
  return {
    position: "absolute",
    width: `calc${w}`,
    height: `calc${h}`,
    left: `clamp(calc(100cqw - ${w}), calc(50cqw - ${w} * ${crop.x / 100}), 0px)`,
    top: `clamp(calc(100cqh - ${h}), calc(50cqh - ${h} * ${crop.y / 100}), 0px)`,
    transformOrigin: `${origin.x}% ${origin.y}%`,
    willChange: "transform",
  };
}
