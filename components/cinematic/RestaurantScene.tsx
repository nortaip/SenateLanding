"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { cinematicConfig, type QualityLevel } from "@/config/cinematicConfig";
import type { CinematicState } from "@/lib/animation/cinematicTimeline";
import { CinematicCamera } from "./CinematicCamera";
import { POSTerminal } from "./POSTerminal";
import { RestaurantEnvironment, RestaurantLights, ROOM } from "./RestaurantEnvironment";
import { RestaurantFurniture } from "./RestaurantFurniture";
import { useRestaurantMaterials } from "./restaurantMaterials";
import { ScreenProjector } from "./ScreenTransition";

interface RestaurantSceneProps {
  state: CinematicState;
  quality: QualityLevel;
  onContextLost: () => void;
}

/**
 * The single persistent WebGL canvas for the whole opening. Cameras, lights and the
 * handoff all read the same `state`, so no separate canvases are needed for each shot.
 */
export default function RestaurantScene({ state, quality, onContextLost }: RestaurantSceneProps) {
  const { camera, palette, quality: q } = cinematicConfig;
  const envRef = useRef<THREE.Texture | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      envRef.current?.dispose();
      cleanupRef.current?.();
    },
    [],
  );

  return (
    <Canvas
      dpr={[1, cinematicConfig.quality[quality].dpr]}
      frameloop="always"
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: camera.fov.desktop, near: 0.05, far: 80, position: [0.6, 1.55, 5.2] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = false;

        // Procedural room reflections, so no network HDRI is needed.
        const pmrem = new THREE.PMREMGenerator(gl);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
        scene.environment = env.texture;
        scene.environmentIntensity = 0.25;
        envRef.current = env.texture;
        pmrem.dispose();

        const canvas = gl.domElement;
        const onLost = (e: Event) => {
          e.preventDefault();
          onContextLost();
        };
        canvas.addEventListener("webglcontextlost", onLost);
        cleanupRef.current = () => canvas.removeEventListener("webglcontextlost", onLost);
      }}
    >
      <color attach="background" args={[palette.background]} />
      <fogExp2 attach="fog" args={[palette.fog, 0.04]} />
      <SceneContents state={state} quality={quality} />
    </Canvas>
  );
}

function SceneContents({ state, quality }: { state: CinematicState; quality: QualityLevel }) {
  const mats = useRestaurantMaterials();
  return (
    <>
      <RestaurantLights mats={mats} state={state} quality={quality} />
      <RestaurantEnvironment mats={mats} state={state} quality={quality} />
      <RestaurantFurniture mats={mats} state={state} quality={quality} />
      <POSTerminal mats={mats} state={state} />
      <ContactShadows
        position={[0, 0.005, (ROOM.minZ + ROOM.maxZ) / 2]}
        opacity={0.55}
        scale={[ROOM.maxX - ROOM.minX, ROOM.maxZ - ROOM.minZ]}
        blur={2.2}
        far={1.2}
        frames={1}
        resolution={512}
        color="#000000"
      />
      <CinematicCamera state={state} />
      <ScreenProjector state={state} />
    </>
  );
}
