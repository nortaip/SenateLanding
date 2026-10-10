"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cinematicConfig } from "@/config/cinematicConfig";
import { containRect, lerpQuad, quadToMatrix3d, type Point } from "@/lib/animation/projection";
import type { CinematicState } from "@/lib/animation/cinematicTimeline";

/** Pixel size of the handoff element. Matches the screen texture so the image is never resampled. */
export const HANDOFF_WIDTH = 1600;
export const HANDOFF_HEIGHT = Math.round(HANDOFF_WIDTH / cinematicConfig.pos.aspect);

type Quad = [Point, Point, Point, Point];

/**
 * Lives inside the R3F canvas. Every frame it projects the POS screen's four corners to
 * stage pixels and places the DOM handoff element on that quad with a homography.
 *
 * Until `handoffStart` the DOM element stays hidden. From that point the element is already
 * on the 3D screen pixel for pixel, so the switch is invisible. It then morphs to the final
 * product rectangle, driven by `state.morph`.
 */
export function ScreenProjector({ state }: { state: CinematicState }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const local = [
    new THREE.Vector3(-0.5, 0.5, 0),
    new THREE.Vector3(0.5, 0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
    new THREE.Vector3(-0.5, -0.5, 0),
  ];

  useFrame(() => {
    const el = state.handoffEl;
    const screen = state.screenMesh as THREE.Mesh | null;
    const active = state.progress >= cinematicConfig.timing.handoffStart && !!screen;
    state.handoffActive = active;
    if (!el) return;
    el.style.visibility = active ? "visible" : "hidden";
    if (!screen) return;

    const { width, height } = size;
    if (width === 0 || height === 0) return;

    // Screen corners in stage pixels, in texture order: TL, TR, BR, BL.
    const geo = screen.geometry as THREE.PlaneGeometry;
    const w = geo.parameters.width;
    const h = geo.parameters.height;
    screen.updateWorldMatrix(true, false);
    camera.updateMatrixWorld();
    const sx = [-0.5, 0.5, 0.5, -0.5];
    const sy = [0.5, 0.5, -0.5, -0.5];
    const project = (i: number): Point => {
      const p = local[i].clone().set(sx[i] * w, sy[i] * h, 0).applyMatrix4(screen.matrixWorld);
      p.project(camera);
      return [((p.x + 1) / 2) * width, ((1 - p.y) / 2) * height];
    };
    const screenQuad: Quad = [project(0), project(1), project(2), project(3)];

    // Final product rectangle, contain-fitted so the screenshot keeps its aspect ratio.
    const portrait = width / height < 1;
    const box = portrait ? cinematicConfig.handoffTarget.mobile : cinematicConfig.handoffTarget.desktop;
    const rect = containRect(
      { x: box.left * width, y: box.top * height, w: box.width * width, h: box.height * height },
      cinematicConfig.pos.aspect,
    );
    const targetQuad: Quad = [
      [rect.x, rect.y],
      [rect.x + rect.w, rect.y],
      [rect.x + rect.w, rect.y + rect.h],
      [rect.x, rect.y + rect.h],
    ];

    const quad = lerpQuad(screenQuad, targetQuad, state.morph);
    el.style.transform = quadToMatrix3d(quad, HANDOFF_WIDTH, HANDOFF_HEIGHT);
  });

  return null;
}
