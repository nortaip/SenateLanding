"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cinematicConfig, type QualityLevel } from "@/config/cinematicConfig";
import { seeded } from "@/lib/animation/proceduralTextures";
import type { CinematicState } from "@/lib/animation/cinematicTimeline";
import type { RestaurantMaterials } from "./restaurantMaterials";

interface TableSpec {
  x: number;
  z: number;
  radius: number;
  /** Angles (radians) of chairs placed around the table. */
  chairAngles: number[];
  status?: "green" | "amber";
  /** Key for the mobile subset. */
  key: string;
}

/** Table layout. Aisles stay clear so the camera path never crosses furniture. */
export const TABLES: TableSpec[] = [
  { key: "A", x: -2.3, z: 3.2, radius: 0.42, chairAngles: [0, Math.PI / 2, Math.PI, -Math.PI / 2], status: "green" },
  { key: "C", x: -2.3, z: -4.6, radius: 0.42, chairAngles: [0, Math.PI / 2, Math.PI, -Math.PI / 2], status: "amber" },
  { key: "D", x: -4.3, z: 1.2, radius: 0.4, chairAngles: [Math.PI / 2 + 0.0, -Math.PI / 2] },
  { key: "B", x: -2.3, z: -0.6, radius: 0.42, chairAngles: [0, Math.PI / 2, Math.PI, -Math.PI / 2] },
  { key: "E", x: -4.3, z: -3.2, radius: 0.4, chairAngles: [Math.PI / 2, -Math.PI / 2], status: "green" },
];

const SEAT_HEIGHT = 0.45;
const TABLE_HEIGHT = 0.75;

interface FurnitureProps {
  mats: RestaurantMaterials;
  state: CinematicState;
  quality: QualityLevel;
}

export function RestaurantFurniture({ mats, state, quality }: FurnitureProps) {
  const tables = quality === "desktop" ? TABLES : TABLES.filter((t) => ["A", "C", "D"].includes(t.key));
  return (
    <group>
      {tables.map((t) => (
        <DiningTable key={t.key} spec={t} mats={mats} state={state} />
      ))}
      <Booths mats={mats} />
      <Bar mats={mats} />
      <Stools mats={mats} />
      <Backbar mats={mats} quality={quality} />
    </group>
  );
}

function DiningTable({ spec, mats, state }: { spec: TableSpec; mats: RestaurantMaterials; state: CinematicState }) {
  return (
    <group position={[spec.x, 0, spec.z]}>
      {/* Top with a slim edge, pedestal and foot */}
      <mesh position={[0, TABLE_HEIGHT, 0]} material={mats.wood}>
        <cylinderGeometry args={[spec.radius, spec.radius, 0.04, 40]} />
      </mesh>
      <mesh position={[0, TABLE_HEIGHT - 0.03, 0]} material={mats.woodDark}>
        <cylinderGeometry args={[spec.radius + 0.005, spec.radius + 0.005, 0.02, 40]} />
      </mesh>
      <mesh position={[0, TABLE_HEIGHT / 2, 0]} material={mats.woodDark}>
        <cylinderGeometry args={[0.035, 0.05, TABLE_HEIGHT, 12]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={mats.chrome}>
        <cylinderGeometry args={[0.24, 0.26, 0.03, 24]} />
      </mesh>

      {/* Table setting: a candle and a glass */}
      <mesh position={[0, TABLE_HEIGHT + 0.08, 0]} material={mats.amberGlass}>
        <cylinderGeometry args={[0.035, 0.035, 0.12, 14]} />
      </mesh>
      <mesh position={[0.14, TABLE_HEIGHT + 0.1, 0.08]} material={mats.glass}>
        <cylinderGeometry args={[0.03, 0.025, 0.12, 14]} />
      </mesh>

      {spec.chairAngles.map((a, i) => (
        <Chair key={i} angle={a} radius={spec.radius + 0.36} mats={mats} />
      ))}

      {spec.status && (
        <StatusBeacon
          position={[0.22, TABLE_HEIGHT + 0.025, -0.18]}
          material={spec.status === "green" ? mats.statusGreen : mats.statusAmber}
          state={state}
        />
      )}
    </group>
  );
}

/** A dining chair facing the table centre. `angle` is measured around the table. */
function Chair({ angle, radius, mats }: { angle: number; radius: number; mats: RestaurantMaterials }) {
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  return (
    <group position={[x, 0, z]} rotation={[0, angle + Math.PI, 0]}>
      <mesh position={[0, SEAT_HEIGHT, 0]} material={mats.velvet}>
        <boxGeometry args={[0.44, 0.07, 0.44]} />
      </mesh>
      <mesh position={[0, SEAT_HEIGHT + 0.5, -0.2]} material={mats.velvet}>
        <boxGeometry args={[0.44, 0.9, 0.05]} />
      </mesh>
      {[
        [-0.19, -0.19],
        [0.19, -0.19],
        [-0.19, 0.19],
        [0.19, 0.19],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, SEAT_HEIGHT / 2, lz]} material={mats.woodDark}>
          <cylinderGeometry args={[0.018, 0.018, SEAT_HEIGHT, 8]} />
        </mesh>
      ))}
    </group>
  );
}

/** Small glowing indicator on a table. It grows in during the "entering" phase and pulses gently. */
function StatusBeacon({
  position,
  material,
  state,
}: {
  position: [number, number, number];
  material: THREE.Material;
  state: CinematicState;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const reveal = THREE.MathUtils.smoothstep(state.progress, 0.2, 0.3);
    const pulse = 1 + 0.12 * Math.sin(clock.elapsedTime * 2.2);
    g.scale.setScalar(Math.max(0.0001, reveal * pulse));
    g.visible = reveal > 0.001;
  });
  return (
    <group ref={ref} position={position}>
      <mesh material={material}>
        <cylinderGeometry args={[0.03, 0.03, 0.006, 20]} />
      </mesh>
    </group>
  );
}

/** Two banquettes in navy velvet along the left wall, sitting behind the booth tables. */
function Booths({ mats }: { mats: RestaurantMaterials }) {
  const z0 = -5.2;
  const z1 = 3.8;
  const len = z1 - z0;
  const cz = (z0 + z1) / 2;
  return (
    <group>
      <mesh position={[-5.36, SEAT_HEIGHT / 2 - 0.02, cz]} material={mats.velvet}>
        <boxGeometry args={[0.72, SEAT_HEIGHT - 0.02, len]} />
      </mesh>
      <mesh position={[-5.36, SEAT_HEIGHT + 0.03, cz]} material={mats.velvet}>
        <boxGeometry args={[0.7, 0.06, len]} />
      </mesh>
      <mesh position={[-5.78, 0.92, cz]} material={mats.velvet}>
        <boxGeometry args={[0.2, 0.96, len]} />
      </mesh>
      {/* Brass tabletop line for the banquette */}
      <mesh position={[-5.78, 1.42, cz]} material={mats.brass}>
        <boxGeometry args={[0.03, 0.02, len]} />
      </mesh>
    </group>
  );
}

/** Marble counter with a dark wood body and a brass foot rail, running along the right side. */
function Bar({ mats }: { mats: RestaurantMaterials }) {
  const x = 3.55;
  const z0 = -8.2;
  const z1 = 2.6;
  const len = z1 - z0;
  const cz = (z0 + z1) / 2;
  return (
    <group>
      <mesh position={[x, 0.5, cz]} material={mats.woodDark}>
        <boxGeometry args={[0.62, 1.0, len]} />
      </mesh>
      {/* Marble top with a small overhang toward the room */}
      <mesh position={[x - 0.02, 1.04, cz]} material={mats.marble}>
        <boxGeometry args={[0.76, 0.06, len]} />
      </mesh>
      {/* Brass foot rail */}
      <mesh position={[x - 0.42, 0.22, cz]} rotation={[Math.PI / 2, 0, 0]} material={mats.brass}>
        <cylinderGeometry args={[0.018, 0.018, len, 12]} />
      </mesh>
      {/* Under-counter warm light */}
      <mesh position={[x - 0.32, 0.9, cz]} material={mats.warmLed}>
        <boxGeometry args={[0.012, 0.012, len - 0.2]} />
      </mesh>
    </group>
  );
}

function Stools({ mats }: { mats: RestaurantMaterials }) {
  const positions = [
    [2.6, -0.8],
    [2.6, -2.2],
  ];
  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.76, 0]} material={mats.leather}>
            <cylinderGeometry args={[0.18, 0.18, 0.06, 28]} />
          </mesh>
          <mesh position={[0, 0.38, 0]} material={mats.brass}>
            <cylinderGeometry args={[0.025, 0.03, 0.74, 10]} />
          </mesh>
          <mesh position={[0, 0.24, 0]} material={mats.brass}>
            <cylinderGeometry args={[0.16, 0.16, 0.02, 28]} />
          </mesh>
          <mesh position={[0, 0.02, 0]} material={mats.chrome}>
            <cylinderGeometry args={[0.2, 0.22, 0.03, 28]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Backbar: wood cabinetry with lit shelves, a navy Senate strip on top, and bottles. */
function Backbar({ mats, quality }: { mats: RestaurantMaterials; quality: QualityLevel }) {
  const shelfYs = [1.45, 1.9, 2.35, 2.8];
  const z0 = -8.4;
  const z1 = 2.2;
  const len = z1 - z0;
  const cz = (z0 + z1) / 2;
  const bottleCount = cinematicConfig.quality[quality].bottles;
  return (
    <group>
      <mesh position={[5.58, 1.1, cz]} material={mats.woodDark}>
        <boxGeometry args={[0.6, 0.6, len]} />
      </mesh>
      <mesh position={[5.5, 1.95, cz]} material={mats.woodDark}>
        <boxGeometry args={[0.7, 2.4, len]} />
      </mesh>
      {shelfYs.map((y, i) => (
        <group key={i}>
          <mesh position={[5.36, y, cz]} material={mats.wood}>
            <boxGeometry args={[0.36, 0.035, len - 0.2]} />
          </mesh>
          <mesh position={[5.18, y - 0.03, cz]} material={i % 2 === 0 ? mats.senateLed : mats.warmLed}>
            <boxGeometry args={[0.01, 0.01, len - 0.4]} />
          </mesh>
        </group>
      ))}
      <Bottles mats={mats} count={bottleCount} shelfYs={shelfYs} z0={z0 + 0.5} z1={z1 - 0.5} />
    </group>
  );
}

function Bottles({
  mats,
  count,
  shelfYs,
  z0,
  z1,
}: {
  mats: RestaurantMaterials;
  count: number;
  shelfYs: number[];
  z0: number;
  z1: number;
}) {
  const amberRef = useRef<THREE.InstancedMesh>(null);
  const clearRef = useRef<THREE.InstancedMesh>(null);
  const counts = useMemo(() => {
    const amber = Math.floor(count * 0.45);
    return { amber, clear: count - amber };
  }, [count]);

  useLayoutEffect(() => {
    const rnd = seeded(203);
    const m = new THREE.Matrix4();
    const place = (mesh: THREE.InstancedMesh | null, n: number, startIdx: number) => {
      if (!mesh) return;
      for (let i = 0; i < n; i++) {
        const shelf = shelfYs[Math.floor(rnd() * shelfYs.length)];
        const z = z0 + rnd() * (z1 - z0);
        const h = 0.22 + rnd() * 0.14;
        m.makeTranslation(5.33 + (rnd() - 0.5) * 0.12, shelf + h / 2 + 0.02, z);
        mesh.setMatrixAt(startIdx + i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    place(amberRef.current, counts.amber, 0);
    place(clearRef.current, counts.clear, 0);
  }, [counts, shelfYs, z0, z1]);

  return (
    <group>
      <instancedMesh ref={amberRef} args={[undefined, undefined, counts.amber]} material={mats.amberGlass}>
        <cylinderGeometry args={[0.034, 0.04, 0.3, 10]} />
      </instancedMesh>
      <instancedMesh ref={clearRef} args={[undefined, undefined, counts.clear]} material={mats.glass}>
        <cylinderGeometry args={[0.03, 0.03, 0.26, 10]} />
      </instancedMesh>
    </group>
  );
}
