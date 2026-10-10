"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CinematicState } from "@/lib/animation/cinematicTimeline";
import { ROOM } from "./RestaurantEnvironment";
import type { RestaurantMaterials } from "./restaurantMaterials";

/** Doorway in the front wall, in metres. */
export const DOOR = { halfWidth: 1.2, height: 2.7, z: ROOM.maxZ } as const;
const EXTERIOR_DEPTH = 12;

interface ExteriorProps {
  mats: RestaurantMaterials;
  state: CinematicState;
}

/**
 * Facade, doorway with glass doors, paving and lanterns in front of the restaurant.
 * The doors swing open from `state.doorOpen`, which the timeline drives, so they reverse on scroll.
 */
export function RestaurantExterior({ mats, state }: ExteriorProps) {
  const { minX, maxX, height } = ROOM;
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6b6259", roughness: 0.8 }), []);
  useEffect(() => () => stone.dispose(), [stone]);
  const z = DOOR.z;
  const sideWidth = maxX - DOOR.halfWidth; // same width on both sides of the doorway
  const leftX = minX + sideWidth / 2;
  const rightX = DOOR.halfWidth + sideWidth / 2;

  return (
    <group>
      {/* Facade walls beside the doorway, facing the street */}
      <FacadeWall x={leftX} width={sideWidth} height={height} z={z} material={stone} />
      <FacadeWall x={rightX} width={sideWidth} height={height} z={z} material={stone} />
      {/* Lintel above the door */}
      <mesh position={[0, (DOOR.height + height) / 2, z]} material={stone}>
        <boxGeometry args={[DOOR.halfWidth * 2, height - DOOR.height, 0.24]} />
      </mesh>

      <Doors mats={mats} state={state} />
      <Lanterns mats={mats} />
      <Paving mats={mats} />
      <Planters mats={mats} />
    </group>
  );
}

function FacadeWall({
  x,
  width,
  height,
  z,
  material,
}: {
  x: number;
  width: number;
  height: number;
  z: number;
  material: THREE.Material;
}) {
  return (
    <mesh position={[x, height / 2, z]} material={material}>
      <planeGeometry args={[width, height]} />
    </mesh>
  );
}

/** Two glass leaves hinged at the outer edges of the doorway. */
function Doors({ mats, state }: { mats: RestaurantMaterials; state: CinematicState }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const leaf = DOOR.halfWidth - 0.02;

  useFrame(() => {
    const t = state.doorOpen;
    if (left.current) left.current.rotation.y = t * 1.25;
    if (right.current) right.current.rotation.y = -t * 1.25;
  });

  return (
    <group>
      <group ref={left} position={[-DOOR.halfWidth, DOOR.height / 2 - 0.02, DOOR.z]}>
        <mesh position={[leaf / 2, 0, 0]} material={mats.glass}>
          <boxGeometry args={[leaf, DOOR.height - 0.04, 0.03]} />
        </mesh>
      </group>
      <group ref={right} position={[DOOR.halfWidth, DOOR.height / 2 - 0.02, DOOR.z]}>
        <mesh position={[-leaf / 2, 0, 0]} material={mats.glass}>
          <boxGeometry args={[leaf, DOOR.height - 0.04, 0.03]} />
        </mesh>
      </group>
      {/* Door frame */}
      <mesh position={[0, DOOR.height + 0.04, DOOR.z]} material={mats.terminalBody}>
        <boxGeometry args={[DOOR.halfWidth * 2 + 0.12, 0.08, 0.12]} />
      </mesh>
      <mesh position={[-DOOR.halfWidth - 0.04, DOOR.height / 2, DOOR.z]} material={mats.terminalBody}>
        <boxGeometry args={[0.08, DOOR.height, 0.12]} />
      </mesh>
      <mesh position={[DOOR.halfWidth + 0.04, DOOR.height / 2, DOOR.z]} material={mats.terminalBody}>
        <boxGeometry args={[0.08, DOOR.height, 0.12]} />
      </mesh>
    </group>
  );
}

/** Warm wall lanterns beside the doorway. Emissive only, so they add no lights. */
function Lanterns({ mats }: { mats: RestaurantMaterials }) {
  return (
    <group>
      {[-2.1, 2.1].map((x) => (
        <group key={x} position={[x, 2.1, DOOR.z + 0.06]}>
          <mesh material={mats.terminalBody}>
            <boxGeometry args={[0.16, 0.36, 0.1]} />
          </mesh>
          <mesh position={[0, 0, 0.06]} material={mats.bulb}>
            <boxGeometry args={[0.08, 0.2, 0.02]} />
          </mesh>
          <pointLight position={[0, 0, 0.6]} color="#ffb36b" intensity={4} distance={6} decay={2} />
        </group>
      ))}
    </group>
  );
}

/** Stone paving leading from the street to the door. */
function Paving({ mats }: { mats: RestaurantMaterials }) {
  const length = EXTERIOR_DEPTH;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, DOOR.z + length / 2]} material={mats.floor}>
      <planeGeometry args={[9, length]} />
    </mesh>
  );
}

/** Low planters with clipped shrubs on either side of the path. */
function Planters({ mats }: { mats: RestaurantMaterials }) {
  const shrub = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1f3b2e", roughness: 0.9 }), []);
  useEffect(() => () => shrub.dispose(), [shrub]);
  const sides = [-3.4, 3.4];
  return (
    <group>
      {sides.map((x) => (
        <group key={x} position={[x, 0, DOOR.z + 1.4]}>
          <mesh position={[0, 0.2, 0]} material={mats.woodDark}>
            <boxGeometry args={[1.6, 0.4, 2.4]} />
          </mesh>
          {[-0.5, 0, 0.5].map((dz) => (
            <mesh key={dz} position={[0, 0.62, dz * 1.6]} material={shrub}>
              <sphereGeometry args={[0.36, 14, 10]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
