"use client";

import { cinematicConfig } from "@/config/cinematicConfig";
import type { TimelineRefs } from "@/lib/animation/cinematicTimeline";
import { coverFrameStyle } from "@/lib/animation/photoPlate";

const { interior } = cinematicConfig;
const frameStyle = coverFrameStyle(interior.imageWidth / interior.imageHeight, interior.crop, interior.drift.origin);

/** Centre of the POS screen in the photo: the origin of the close-up. */
const screenCenter = {
  x: interior.screen.reduce((sum, [x]) => sum + x, 0) / 4,
  y: interior.screen.reduce((sum, [, y]) => sum + y, 0) / 4,
};

/**
 * Dining room and bar. The drift layer pushes slowly towards the bar while the story plays;
 * the zoom layer then closes in on the POS screen. Four zero-size markers sit on the screen's
 * corners so the interface can be mapped onto it exactly (see `placeHandoff`).
 */
export function InteriorPlate({ refs }: { refs: TimelineRefs }) {
  return (
    <div
      ref={(el) => {
        refs.interior = el;
      }}
      className="absolute inset-0 z-[1] overflow-hidden bg-[#0b0806]"
      style={{ containerType: "size" }}
    >
      <div className="absolute inset-0 motion-safe:animate-[handheld_13s_ease-in-out_infinite]">
        <div
          ref={(el) => {
            refs.interiorDrift = el;
          }}
          style={frameStyle}
        >
          <div
            ref={(el) => {
              refs.interiorZoom = el;
            }}
            className="absolute inset-0 will-change-transform"
            style={{ transformOrigin: `${screenCenter.x}% ${screenCenter.y}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(el) => {
                refs.interiorImage = el;
              }}
              src={interior.imageUrl}
              alt={interior.alt}
              width={interior.imageWidth}
              height={interior.imageHeight}
              draggable={false}
              className="absolute inset-0 h-full w-full select-none"
            />

            {/* Soft light from the POS screen as the camera closes in */}
            <span
              ref={(el) => {
                refs.screenGlow = el;
              }}
              aria-hidden
              className="pointer-events-none absolute h-[22%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
              style={{
                left: `${screenCenter.x}%`,
                top: `${screenCenter.y}%`,
                opacity: 0,
                background: "radial-gradient(closest-side, rgba(96,150,255,0.45), rgba(59,130,246,0.12) 60%, transparent)",
              }}
            />

            {interior.screen.map(([x, y], i) => (
              <i
                key={i}
                ref={(el) => {
                  refs.screenMarkers[i] = el;
                }}
                aria-hidden
                className="pointer-events-none absolute block h-0 w-0"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legibility bands for the navbar and the headline */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-black/45 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
    </div>
  );
}
