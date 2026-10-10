"use client";

import type { CSSProperties } from "react";
import { cinematicConfig } from "@/config/cinematicConfig";
import type { TimelineRefs } from "@/lib/animation/cinematicTimeline";

const { entrance } = cinematicConfig;
const ASPECT = entrance.imageWidth / entrance.imageHeight;
/** Slight oversize so the handheld drift never reveals an edge. */
const OVERSCAN = 1.03;

/**
 * The image keeps its own aspect ratio and covers the stage, centred. Overlays inside it are
 * placed in image percentages, so they stay pinned to the right spot at any viewport size.
 * Container query units make this independent of scrollbars and of the page width.
 */
const frameStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: `calc(max(100cqw, 100cqh * ${ASPECT}) * ${OVERSCAN})`,
  height: `calc(max(100cqw / ${ASPECT}, 100cqh) * ${OVERSCAN})`,
  marginLeft: `calc(max(100cqw, 100cqh * ${ASPECT}) * ${OVERSCAN} / -2)`,
  marginTop: `calc(max(100cqw / ${ASPECT}, 100cqh) * ${OVERSCAN} / -2)`,
  transformOrigin: `${entrance.focus.x}% ${entrance.focus.y}%`,
  willChange: "transform",
};

/**
 * Photographic entrance. The timeline scales the frame around the corridor's vanishing point
 * (walking in), floods it with warm light and then dissolves it into the 3D room.
 * Without `refs` it renders the first frame only (used before the 3D stage mounts).
 */
export function EntrancePlate({ refs }: { refs?: TimelineRefs }) {
  const panel = entrance.betterPanel;
  return (
    <div
      ref={(el) => {
        if (refs) refs.entrance = el;
      }}
      className="absolute inset-0 z-[2] overflow-hidden bg-[#0b0806]"
      style={{ containerType: "size" }}
    >
      <div className="absolute inset-0 motion-safe:animate-[handheld_11s_ease-in-out_infinite]">
        <div
          ref={(el) => {
            if (refs) refs.entranceZoom = el;
          }}
          style={frameStyle}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={(el) => {
              if (refs) refs.entranceImage = el;
            }}
            src={entrance.imageUrl}
            alt={entrance.alt}
            width={entrance.imageWidth}
            height={entrance.imageHeight}
            fetchPriority="high"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />

          {/* Wall sconces breathe softly */}
          {entrance.sconces.map((s) => (
            <span
              key={s.x}
              aria-hidden
              className="pointer-events-none absolute h-[34%] w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen motion-safe:animate-[sconce_6s_ease-in-out_infinite]"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                background: "radial-gradient(closest-side, rgba(255,196,120,0.55), rgba(255,170,90,0.12) 60%, transparent)",
              }}
            />
          ))}

          {/* Warm light spilling out of the doorway; grows as the camera walks in */}
          <span
            ref={(el) => {
              if (refs) refs.entranceBloom = el;
            }}
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{
              opacity: 0,
              background: `radial-gradient(ellipse 22% 30% at ${entrance.focus.x}% ${entrance.focus.y}%, rgba(255,226,180,0.95), rgba(255,190,120,0.45) 45%, transparent 75%)`,
            }}
          />

          {/* "Better food / Better people / Better moments": a real button on the pillar */}
          <a
            href={panel.href}
            aria-label="Better food, better people, better moments — Sistemi kəşf et"
            className="group absolute rounded-[3px] outline-none transition-[background-color,box-shadow] duration-500 hover:bg-[rgba(231,201,138,0.06)] hover:shadow-[0_0_0_1px_rgba(231,201,138,0.45),0_0_48px_rgba(255,190,110,0.28)] focus-visible:bg-[rgba(231,201,138,0.06)] focus-visible:shadow-[0_0_0_1px_rgba(231,201,138,0.7),0_0_48px_rgba(255,190,110,0.3)]"
            style={{
              left: `${panel.left}%`,
              top: `${panel.top}%`,
              width: `${panel.width}%`,
              height: `${panel.height}%`,
            }}
          >
            <span className="absolute left-1/2 top-[calc(100%+0.9cqh)] -translate-x-1/2 whitespace-nowrap text-[clamp(9px,0.72cqw,12px)] font-medium uppercase tracking-[0.32em] text-[#e7c98a] opacity-70 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
              Kəşf et →
            </span>
          </a>
        </div>
      </div>

      {/* Legibility: soft top band under the navbar, and a low band for the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-black/45 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/60 via-black/20 to-transparent"
      />
    </div>
  );
}
