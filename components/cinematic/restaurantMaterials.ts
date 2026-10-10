import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { cinematicConfig } from "@/config/cinematicConfig";
import {
  createFloorTexture,
  createMarbleTexture,
  createPaintingTexture,
  createPlasterTexture,
  createWoodTexture,
} from "@/lib/animation/proceduralTextures";

export interface RestaurantMaterials {
  floor: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  marble: THREE.MeshStandardMaterial;
  velvet: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  amberGlass: THREE.MeshPhysicalMaterial;
  painting: THREE.MeshStandardMaterial;
  bulb: THREE.MeshBasicMaterial;
  warmLed: THREE.MeshBasicMaterial;
  senateLed: THREE.MeshBasicMaterial;
  statusGreen: THREE.MeshBasicMaterial;
  statusAmber: THREE.MeshBasicMaterial;
  screenBezel: THREE.MeshStandardMaterial;
  terminalBody: THREE.MeshStandardMaterial;
}

/**
 * Creates every material and procedural texture the restaurant uses, once.
 * Everything is disposed when the scene unmounts, so GPU memory is released.
 */
export function useRestaurantMaterials(): RestaurantMaterials {
  const bundle = useMemo(() => {
    const textures: THREE.Texture[] = [];
    const track = <T extends THREE.Texture>(t: T): T => {
      textures.push(t);
      return t;
    };

    const floorTex = track(createFloorTexture());
    floorTex.repeat.set(5, 6);
    const plasterTex = track(createPlasterTexture());
    plasterTex.repeat.set(4, 2);
    const woodTex = track(createWoodTexture(cinematicConfig.palette.woodMid));
    woodTex.repeat.set(2, 1);
    const woodDarkTex = track(createWoodTexture(cinematicConfig.palette.woodDark));
    woodDarkTex.repeat.set(1, 1);
    const marbleTex = track(createMarbleTexture());
    marbleTex.repeat.set(2, 1);
    const paintingTex = track(createPaintingTexture());

    const materials = {
      floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.42, metalness: 0.02 }),
      ceiling: new THREE.MeshStandardMaterial({ color: "#0c1220", roughness: 0.92 }),
      plaster: new THREE.MeshStandardMaterial({ map: plasterTex, roughness: 0.85, color: "#8d96a8" }),
      wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55, metalness: 0.05 }),
      woodDark: new THREE.MeshStandardMaterial({ map: woodDarkTex, roughness: 0.5, metalness: 0.05 }),
      marble: new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.22, metalness: 0.02 }),
      velvet: new THREE.MeshStandardMaterial({ color: cinematicConfig.palette.navyVelvet, roughness: 0.95 }),
      brass: new THREE.MeshStandardMaterial({ color: cinematicConfig.palette.brass, roughness: 0.32, metalness: 0.9 }),
      leather: new THREE.MeshStandardMaterial({ color: "#2b1a14", roughness: 0.6 }),
      chrome: new THREE.MeshStandardMaterial({ color: "#c9d2e0", roughness: 0.18, metalness: 1 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#dfe9f5",
        roughness: 0.04,
        metalness: 0,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
      amberGlass: new THREE.MeshPhysicalMaterial({
        color: "#c27a2c",
        roughness: 0.08,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
      painting: new THREE.MeshStandardMaterial({ map: paintingTex, roughness: 0.7 }),
      bulb: new THREE.MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false }),
      warmLed: new THREE.MeshBasicMaterial({ color: "#ffb36b", toneMapped: false }),
      senateLed: new THREE.MeshBasicMaterial({ color: cinematicConfig.palette.senateBlue, toneMapped: false }),
      statusGreen: new THREE.MeshBasicMaterial({ color: "#4ade80", toneMapped: false }),
      statusAmber: new THREE.MeshBasicMaterial({ color: "#fbbf24", toneMapped: false }),
      screenBezel: new THREE.MeshStandardMaterial({ color: "#05080f", roughness: 0.35, metalness: 0.3 }),
      terminalBody: new THREE.MeshStandardMaterial({ color: "#1a1f2b", roughness: 0.4, metalness: 0.45 }),
    };

    return {
      materials,
      dispose: () => {
        textures.forEach((t) => t.dispose());
        Object.values(materials).forEach((m) => m.dispose());
      },
    };
  }, []);

  useEffect(() => () => bundle.dispose(), [bundle]);

  return bundle.materials;
}
