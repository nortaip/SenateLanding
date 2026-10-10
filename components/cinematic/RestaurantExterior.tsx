"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { CinematicState } from "@/lib/animation/cinematicTimeline";
import { ROOM } from "./RestaurantEnvironment";
import type { RestaurantMaterials } from "./restaurantMaterials";

/** Doorway in the front wall, in metres. */
export const DOOR = { halfWidth: 1.2, height: 2.7, z: ROOM.maxZ } as const;
const PAVING_DEPTH = 12;

interface ExteriorProps {
  mats: RestaurantMaterials;
  state: CinematicState;
}

/**
 * Street-facing entrance: dark stone pilasters, a slim glass door, an illuminated brand sign,
 * olive trees in planters and a marble forecourt. The doors swing open from `state.doorOpen`,
 * which the timeline drives, so they reverse on scroll.
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
  const leftX = minX + sideWidth / 2;
  const rightX = DOOR.halfWidth + sideWidth / 2;

  return (
    <group>
      {/* Stone pilasters beside the doorway */}
      <Pilaster x={leftX} width={sideWidth} height={height} z={z} material={stone} />
      <Pilaster x={rightX} width={sideWidth} height={height} z={z} material={stone} />

      {/* Lintel band with a warm LED reveal underneath */}
      <mesh position={[0, (DOOR.height + height) / 2, z + 0.02]} material={stone}>
        <boxGeometry args={[DOOR.halfWidth * 2 + 0.6, height - DOOR.height, 0.3]} />
      </mesh>
      <mesh position={[0, DOOR.height + 0.02, z + 0.17]} material={mats.warmLed}>
        <boxGeometry args={[DOOR.halfWidth * 2 + 0.4, 0.02, 0.02]} />
      </mesh>

      <Doors mats={mats} state={state} />
      <WallLights mats={mats} />
      <BrandSign mats={mats} />
      <BetterSign mats={mats} />
      <Forecourt mats={mats} />
      <Planters mats={mats} />
      <WelcomeMat />
    </group>
  );
}

function Pilaster({
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
    <mesh position={[x, height / 2, z + 0.02]} material={material}>
      <boxGeometry args={[width, height, 0.3]} />
    </mesh>
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
      {/* Head and jamb frame */}
      <mesh position={[0, DOOR.height + 0.05, DOOR.z + 0.04]} material={frame}>
        <boxGeometry args={[DOOR.halfWidth * 2 + 0.08, 0.1, 0.08]} />
      </mesh>
      <mesh position={[-DOOR.halfWidth - 0.03, DOOR.height / 2, DOOR.z + 0.04]} material={frame}>
        <boxGeometry args={[0.06, DOOR.height, 0.08]} />
      </mesh>
      <mesh position={[DOOR.halfWidth + 0.03, DOOR.height / 2, DOOR.z + 0.04]} material={frame}>
        <boxGeometry args={[0.06, DOOR.height, 0.08]} />
      </mesh>
    </group>
  );
}

/** Slim vertical wall lights either side of the doorway. Emissive only, so no extra lights. */
function WallLights({ mats }: { mats: RestaurantMaterials }) {
  return (
    <group>
      {[-1.95, 1.95].map((x) => (
        <mesh key={x} position={[x, 2.2, DOOR.z + 0.12]} material={mats.warmLed}>
          <boxGeometry args={[0.05, 0.9, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

/** Builds a glowing text texture on a dark panel (for brand signage). */
function makeSignTexture(lines: { text: string; size: number; color: string; weight?: string; spacing?: number }[], w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#0f0d0b";
    ctx.fillRect(0, 0, w, h);
    const blockHeight = lines.reduce((sum, line) => sum + line.size * 1.5, 0);
    let y = (h - blockHeight) / 2 + lines[0].size * 0.85;
    for (const line of lines) {
      ctx.font = `${line.weight ?? "400"} ${line.size}px Inter, Arial, sans-serif`;
      ctx.fillStyle = line.color;
      ctx.letterSpacing = `${line.spacing ?? 0}px`;
      ctx.textAlign = "center";
      ctx.fillText(line.text, w / 2, y);
      y += line.size * 1.5;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Illuminated "Senate POS" sign on the left pilaster. */
function BrandSign({ mats }: { mats: RestaurantMaterials }) {
  const tex = useMemo(
    () =>
      makeSignTexture(
        [{ text: "Senate POS", size: 120, color: "#f3e3b5", weight: "600" }],
        1024,
        256,
      ),
    [],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group position={[-3.6, 3.3, DOOR.z + 0.2]}>
      <mesh>
        <planeGeometry args={[2.2, 0.55]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.42, 0.005]} material={mats.warmLed}>
        <boxGeometry args={[0.5, 0.01, 0.01]} />
      </mesh>
    </group>
  );
}

/**
 * "Better food / Better people / Better moments" panel on the right pilaster. It is a button:
 * clicking it scrolls to the Senate ecosystem section.
 */
function BetterSign({ mats }: { mats: RestaurantMaterials }) {
  const hover = useRef(false);
  const tex = useMemo(
    () =>
      makeSignTexture(
        [
          { text: "BETTER", size: 56, color: "#e7c98a", spacing: 8 },
          { text: "FOOD", size: 56, color: "#e7c98a", spacing: 8 },
          { text: "BETTER", size: 56, color: "#e7c98a", spacing: 8 },
          { text: "PEOPLE", size: 56, color: "#e7c98a", spacing: 8 },
          { text: "BETTER", size: 56, color: "#e7c98a", spacing: 8 },
          { text: "MOMENTS", size: 56, color: "#e7c98a", spacing: 8 },
        ],
        512,
        768,
      ),
    [],
  );
  useEffect(() => () => tex.dispose(), [tex]);

  const onClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.getElementById("ecosystem")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover.current = true;
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    hover.current = false;
    document.body.style.cursor = "";
  };

  return (
    <group position={[3.95, 2.6, DOOR.z + 0.2]}>
      <mesh onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        <planeGeometry args={[1.25, 2.1]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.1, 0.005]} material={mats.warmLed}>
        <boxGeometry args={[0.5, 0.012, 0.01]} />
      </mesh>
    </group>
  );
}

/** Marble-look forecourt that reflects the lights. */
function Forecourt({ mats }: { mats: RestaurantMaterials }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, DOOR.z + PAVING_DEPTH / 2]} material={mats.marble}>
      <planeGeometry args={[9, PAVING_DEPTH]} />
    </mesh>
  );
}

/** Dark planters with olive trees, lit from below. */
function Planters({ mats }: { mats: RestaurantMaterials }) {
  const canopy = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3d4a2c", roughness: 0.9 }), []);
  const trunk = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3b2a1c", roughness: 0.8 }), []);
  useEffect(
    () => () => {
      canopy.dispose();
      trunk.dispose();
    },
    [canopy, trunk],
  );
  return (
    <group>
      {[-2.5, 2.5].map((x) => (
        <group key={x} position={[x, 0, DOOR.z + 1.2]} scale={0.8}>
          <mesh position={[0, 0.45, 0]} material={mats.terminalBody}>
            <boxGeometry args={[1.5, 0.9, 1.5]} />
          </mesh>
          <mesh position={[0, 1.2, 0]} material={trunk}>
            <cylinderGeometry args={[0.04, 0.07, 1.4, 8]} />
          </mesh>
          <mesh position={[0, 2.0, 0]} material={canopy}>
            <icosahedronGeometry args={[0.7, 1]} />
          </mesh>
          <mesh position={[0.3, 1.8, 0.2]} material={canopy}>
            <icosahedronGeometry args={[0.45, 1]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Branded doormat in front of the entrance. */
function WelcomeMat() {
  const tex = useMemo(
    () => makeSignTexture([{ text: "Senate POS", size: 90, color: "#c9a25a", weight: "500" }], 1024, 256),
    [],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, DOOR.z + 1.1]}>
      <planeGeometry args={[2.4, 0.6]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}
