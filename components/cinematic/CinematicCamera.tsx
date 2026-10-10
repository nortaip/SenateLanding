"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cinematicConfig } from "@/config/cinematicConfig";
import { buildCameraPath, sampleCameraPath } from "@/lib/animation/cameraPath";
import type { CinematicState } from "@/lib/animation/cinematicTimeline";

/**
 * Drives the camera from the scrubbed progress value. Pose depends only on `state.progress`,
 * so scrolling backwards retraces the exact same frames.
 */
export function CinematicCamera({ state }: { state: CinematicState }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const portrait = aspect < 1;
  const fov = portrait ? cinematicConfig.camera.fov.mobile : cinematicConfig.camera.fov.desktop;
  const aspectKey = Math.round(aspect * 50) / 50;

  const path = useMemo(() => buildCameraPath(aspectKey, fov), [aspectKey, fov]);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    sampleCameraPath(path, state.progress, camera.position, target);
    camera.lookAt(target);
  });

  return null;
}
