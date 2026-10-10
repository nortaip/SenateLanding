"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CinematicState } from "@/lib/animation/cinematicTimeline";
import { ROOM } from "./RestaurantEnvironment";
import type { RestaurantMaterials } from "./restaurantMaterials";

/** Doorway in the front wall, in metres. */
export const DOOR = { halfWidth: 1.2, height: 2.7, z: ROOM.maxZ } as const;

interface ExteriorProps {
  mats: RestaurantMaterials;
  state: CinematicState;
}

/**
 * The room's front wall with its doorway and glass doors. The street-side look of the
 * entrance is the photographic plate (EntrancePlate); in 3D the camera only ever sees this
 * threshold from inside, at the moment the plate dissolves.
 */
export function RestaurantExterior({ mats, state }: ExteriorProps) {
  const { minX, maxX, height } = ROOM;
  const z = DOOR.z;
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3b3631", roughness: 0.55, metalness: 0.05 }),
    [],
  );
  useEffect(() => () => stone.dispose(), [stone]);

  const sideWidth = maxX - DOOR.halfWidth;
  return (
    <group>
      <mesh position={[minX + sideWidth / 2, height / 2, z + 0.02]} material={stone}>
        <boxGeometry args={[sideWidth, height, 0.3]} />
      </mesh>
      <mesh position={[DOOR.halfWidth + sideWidth / 2, height / 2, z + 0.02]} material={stone}>
        <boxGeometry args={[sideWidth, height, 0.3]} />
      </mesh>
      <mesh position={[0, (DOOR.height + height) / 2, z + 0.02]} material={stone}>
        <boxGeometry args={[DOOR.halfWidth * 2, height - DOOR.height, 0.3]} />
      </mesh>
      <Doors mats={mats} state={state} />
    </group>
  );
}

/** Two glass leaves hinged at the doorway edges, framed in slim dark metal. */
function Doors({ mats, state }: { mats: RestaurantMaterials; state: CinematicState }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const leaf = DOOR.halfWidth - 0.02;
  const frame = mats.terminalBody;

  useFrame(() => {
    const t = state.doorOpen;
    if (left.current) left.current.rotation.y = t * 1.25;
    if (right.current) right.current.rotation.y = -t * 1.25;
  });

  return (
    <group>
      <group ref={left} position={[-DOOR.halfWidth, DOOR.height / 2 - 0.02, DOOR.z + 0.04]}>
        <mesh position={[leaf / 2, 0, 0]} material={mats.glass}>
          <boxGeometry args={[leaf, DOOR.height - 0.04, 0.02]} />
        </mesh>
        <mesh position={[0.03, 0, 0]} material={frame}>
          <boxGeometry args={[0.05, DOOR.height - 0.04, 0.05]} />
        </mesh>
      </group>
      <group ref={right} position={[DOOR.halfWidth, DOOR.height / 2 - 0.02, DOOR.z + 0.04]}>
        <mesh position={[-leaf / 2, 0, 0]} material={mats.glass}>
          <boxGeometry args={[leaf, DOOR.height - 0.04, 0.02]} />
        </mesh>
        <mesh position={[-0.03, 0, 0]} material={frame}>
          <boxGeometry args={[0.05, DOOR.height - 0.04, 0.05]} />
        </mesh>
      </group>
      <mesh position={[0, DOOR.height + 0.05, DOOR.z + 0.04]} material={frame}>
        <boxGeometry args={[DOOR.halfWidth * 2 + 0.08, 0.1, 0.08]} />
      </mesh>
    </group>
  );
}
