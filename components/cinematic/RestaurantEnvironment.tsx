"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { cinematicConfig, type QualityLevel } from "@/config/cinematicConfig";
import { lightLevelFor, type CinematicState } from "@/lib/animation/cinematicTimeline";
import { seeded } from "@/lib/animation/proceduralTextures";
import type { RestaurantMaterials } from "./restaurantMaterials";

/** Room bounds in metres. The camera enters from +Z and walks towards the bar at +X. */
export const ROOM = { minX: -6, maxX: 6, minZ: -9, maxZ: 6, height: 4.2 } as const;

/** Pendant lamp positions (x, z). Lamps are hung at PENDANT_Y above the furniture. */
export const PENDANTS: readonly { x: number; z: number }[] = [
  { x: -2.3, z: 3.2 },
  { x: -2.3, z: -4.6 },
  { x: -4.3, z: -0.6 },
  { x: 3.55, z: -2.0 },
  { x: 3.55, z: -6.6 },
];
export const PENDANT_Y = 2.75;

interface EnvProps {
  mats: RestaurantMaterials;
  state: CinematicState;
  quality: QualityLevel;
}

/** Walls, floor, ceiling, slats, painting, LED cove and dust. Architectural, not decorative cubes. */
export function RestaurantEnvironment({ mats, state, quality }: EnvProps) {
  const { minX, maxX, minZ, maxZ, height } = ROOM;
  const depth = maxZ - minZ;
  const width = maxX - minX;
  const centerZ = (minZ + maxZ) / 2;

  return (
    <group>
      {/* Floor and ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, centerZ]} material={mats.floor}>
        <planeGeometry args={[width, depth]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, centerZ]} material={mats.ceiling}>
        <planeGeometry args={[width, depth]} />
      </mesh>

      {/* Walls */}
      <mesh position={[minX, height / 2, centerZ]} rotation={[0, Math.PI / 2, 0]} material={mats.plaster}>
        <planeGeometry args={[depth, height]} />
      </mesh>
      <mesh position={[maxX, height / 2, centerZ]} rotation={[0, -Math.PI / 2, 0]} material={mats.plaster}>
        <planeGeometry args={[depth, height]} />
      </mesh>
      <mesh position={[0, height / 2, minZ]} material={mats.plaster}>
        <planeGeometry args={[width, height]} />
      </mesh>

      <WoodSlats mats={mats} quality={quality} />
      <WallPainting mats={mats} />
      <LedCove mats={mats} />
      <ChainInstallations mats={mats} quality={quality} />

      {/* Front wall trim around the entrance */}
      <mesh position={[0, 0.06, maxZ - 0.02]} material={mats.brass}>
        <boxGeometry args={[2.4, 0.12, 0.04]} />
      </mesh>

      <DustMotes state={state} quality={quality} />
    </group>
  );
}

/** Vertical wood slats on the back wall, mirroring the reference's slatted panelling. */
function WoodSlats({ mats, quality }: { mats: RestaurantMaterials; quality: QualityLevel }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = quality === "desktop" ? 74 : 40;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const span = 9.6;
    for (let i = 0; i < count; i++) {
      const x = -span / 2 + (i * span) / (count - 1);
      m.makeTranslation(x, 2.0, ROOM.minZ + 0.04);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={mats.woodDark}>
      <boxGeometry args={[0.07, 3.4, 0.08]} />
    </instancedMesh>
  );
}

/** A dark framed canvas on the back wall, lit by a small brass spot bar. */
function WallPainting({ mats }: { mats: RestaurantMaterials }) {
  return (
    <group position={[-2.6, 2.05, ROOM.minZ + 0.03]}>
      <mesh material={mats.woodDark} position={[0, 0, -0.01]}>
        <boxGeometry args={[1.66, 1.2, 0.04]} />
      </mesh>
      <mesh material={mats.painting}>
        <planeGeometry args={[1.5, 1.04]} />
      </mesh>
      <mesh position={[0, 0.7, 0.03]} material={mats.brass}>
        <boxGeometry args={[0.7, 0.025, 0.025]} />
      </mesh>
    </group>
  );
}

/** Recessed warm LED cove along the ceiling, plus the navy Senate accent over the back bar. */
function LedCove({ mats }: { mats: RestaurantMaterials }) {
  const len = ROOM.maxZ - ROOM.minZ;
  return (
    <group>
      <mesh position={[ROOM.minX + 0.06, ROOM.height - 0.05, (ROOM.minZ + ROOM.maxZ) / 2]} material={mats.warmLed}>
        <boxGeometry args={[0.03, 0.03, len]} />
      </mesh>
      <mesh position={[ROOM.maxX - 0.06, ROOM.height - 0.05, (ROOM.minZ + ROOM.maxZ) / 2]} material={mats.senateLed}>
        <boxGeometry args={[0.03, 0.03, len]} />
      </mesh>
      <mesh position={[5.2, 3.35, -3.2]} material={mats.senateLed}>
        <boxGeometry args={[0.02, 0.02, 9]} />
      </mesh>
    </group>
  );
}

/**
 * Hanging chain-fringe installations over the dining room and the bar, after the reference.
 * Built as one InstancedMesh per panel, with positions from a seeded generator (stable across loads).
 */
function ChainInstallations({ mats, quality }: { mats: RestaurantMaterials; quality: QualityLevel }) {
  const perPanel = quality === "desktop" ? cinematicConfig.quality.desktop.chainStrands / 2 : cinematicConfig.quality.mobile.chainStrands / 2;
  const panels = [
    { cx: -2.4, cz: 0.6, w: 4.6, d: 2.6, top: ROOM.height - 0.02 },
    { cx: 4.4, cz: -4.2, w: 2.0, d: 6.0, top: ROOM.height - 0.02 },
  ];
  return (
    <group>
      {panels.map((p, i) => (
        <ChainPanel key={i} panel={p} count={perPanel} seed={11 + i * 17} mats={mats} />
      ))}
    </group>
  );
}

function ChainPanel({
  panel,
  count,
  seed,
  mats,
}: {
  panel: { cx: number; cz: number; w: number; d: number; top: number };
  count: number;
  seed: number;
  mats: RestaurantMaterials;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rnd = seeded(seed);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const x = panel.cx + (rnd() - 0.5) * panel.w;
      const z = panel.cz + (rnd() - 0.5) * panel.d;
      const len = 0.55 + rnd() * 0.85;
      p.set(x, panel.top - len / 2, z);
      s.set(1, len, 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, seed, panel]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={mats.brass}>
      <cylinderGeometry args={[0.006, 0.006, 1, 4]} />
    </instancedMesh>
  );
}

/** Slow ambient dust motes, drifting through the warm light. */
function DustMotes({ state, quality }: { state: CinematicState; quality: QualityLevel }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (g) g.visible = state.progress < 0.9;
  });
  return (
    <group ref={ref}>
      <Sparkles
        count={quality === "desktop" ? 90 : 30}
        scale={[11, 3.6, 13]}
        position={[0, 1.8, -1.5]}
        size={2.4}
        speed={0.12}
        opacity={0.45}
        color="#ffd9a0"
      />
    </group>
  );
}

/** Pendant lamps with point lights. Only the first `quality.pointLights` shine on mobile. */
export function RestaurantLights({ mats, state, quality }: EnvProps) {
  const lampCount = cinematicConfig.quality[quality].pointLights;
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const accentRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const level = lightLevelFor(state.progress, state.intro);
    lightRefs.current.forEach((light, i) => {
      if (light) light.intensity = (i < lampCount ? 16 : 0) * level;
    });
    if (hemiRef.current) hemiRef.current.intensity = 0.35 + 0.35 * level;
    if (accentRef.current) accentRef.current.intensity = 3.2 * state.intro;
  });

  return (
    <group>
      <hemisphereLight ref={hemiRef} args={["#2a3d66", "#2a1a10", 0.5]} />
      <pointLight ref={accentRef} position={[5.1, 2.4, -3.2]} color={cinematicConfig.palette.senateBlue} distance={6} decay={2} intensity={0} />
      {PENDANTS.map((p, i) => (
        <group key={i} position={[p.x, PENDANT_Y, p.z]}>
          {/* Cord */}
          <mesh position={[0, (ROOM.height - PENDANT_Y) / 2, 0]} material={mats.chrome}>
            <cylinderGeometry args={[0.008, 0.008, ROOM.height - PENDANT_Y, 6]} />
          </mesh>
          {/* Shade and bulb */}
          <mesh position={[0, 0.1, 0]} material={mats.brass}>
            <cylinderGeometry args={[0.07, 0.2, 0.2, 24, 1, true]} />
          </mesh>
          <mesh position={[0, -0.02, 0]} material={mats.bulb}>
            <sphereGeometry args={[0.055, 16, 12]} />
          </mesh>
          <pointLight
            ref={(el) => {
              lightRefs.current[i] = el;
            }}
            position={[0, -0.12, 0]}
            color={cinematicConfig.palette.warm}
            distance={9}
            decay={2}
            intensity={0}
          />
        </group>
      ))}
    </group>
  );
}
