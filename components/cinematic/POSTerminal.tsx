"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { cinematicConfig } from "@/config/cinematicConfig";
import type { CinematicState } from "@/lib/animation/cinematicTimeline";
import type { RestaurantMaterials } from "./restaurantMaterials";

/** Local-space offset of the screen in front of the bezel. Matches `getScreenCenter()`. */
const SCREEN_FRONT_OFFSET = 0.012;

/**
 * The physical POS terminal on the bar counter. The screen is an unlit plane, so its
 * pixels equal the DOM image used for the handoff, and the switch is invisible.
 */
export function POSTerminal({ mats, state }: { mats: RestaurantMaterials; state: CinematicState }) {
  const { pos } = cinematicConfig;
  const texture = useTexture(pos.textureUrl);
  const screenRef = useRef<THREE.Mesh>(null);
  const screenHeight = pos.width / pos.aspect;

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  useEffect(() => {
    state.screenMesh = screenRef.current;
    return () => {
      state.screenMesh = null;
    };
  }, [state]);

  // Hidden once the DOM handoff takes over, so the two never overlap.
  useFrame(() => {
    if (screenRef.current) screenRef.current.visible = !state.handoffActive;
  });

  const [bx, by, bz] = pos.basePosition;
  return (
    // Local +Z faces -X, the room side of the counter.
    <group position={[bx, by, bz]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Base plate and stand */}
      <mesh position={[0, 0.012, 0]} material={mats.terminalBody}>
        <boxGeometry args={[0.32, 0.024, 0.26]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={mats.terminalBody}>
        <cylinderGeometry args={[0.03, 0.04, 0.36, 16]} />
      </mesh>

      {/* Bezel and screen */}
      <mesh position={[0, pos.screenCenterY, -0.01]} material={mats.screenBezel}>
        <boxGeometry args={[pos.width + 0.04, screenHeight + 0.03, 0.03]} />
      </mesh>
      <mesh ref={screenRef} position={[0, pos.screenCenterY, SCREEN_FRONT_OFFSET]}>
        <planeGeometry args={[pos.width, screenHeight]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* Keypad tray and card reader */}
      <mesh position={[0, 0.034, 0.075]} material={mats.terminalBody}>
        <boxGeometry args={[0.2, 0.02, 0.12]} />
      </mesh>
      <mesh position={[0.1, 0.05, -0.06]} material={mats.screenBezel}>
        <boxGeometry args={[0.09, 0.03, 0.07]} />
      </mesh>
    </group>
  );
}
