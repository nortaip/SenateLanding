import * as THREE from "three";
import { cinematicConfig } from "@/config/cinematicConfig";

export interface CameraPath {
  position: THREE.CatmullRomCurve3;
  target: THREE.CatmullRomCurve3;
  /** Final camera position, perpendicular to the POS screen. */
  finalPosition: THREE.Vector3;
  /** Centre of the POS screen in world space. */
  screenCenter: THREE.Vector3;
}

/** World-space centre of the POS screen (the screen faces -X into the room). */
export function getScreenCenter(): THREE.Vector3 {
  const [bx, by, bz] = cinematicConfig.pos.basePosition;
  // Screen sits 1.2 cm in front of the terminal body along its normal (-X).
  return new THREE.Vector3(bx - 0.012, by + cinematicConfig.pos.screenCenterY, bz);
}

/**
 * Distance from the screen at which it fills the viewport height, for a given aspect.
 * Keeps the screen at least ~90% of the frame width on narrow (mobile) viewports.
 */
export function finalCameraDistance(aspect: number, fovDeg: number): number {
  const { width } = cinematicConfig.pos;
  const halfV = Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
  const needed = (width * 1.1) / (2 * halfV * aspect);
  return Math.max(cinematicConfig.camera.minFinalDistance, needed);
}

/**
 * Builds the deterministic camera spline. The last waypoint is computed from the
 * screen geometry, so the camera always ends perpendicular to the POS display.
 */
export function buildCameraPath(aspect: number, fovDeg: number): CameraPath {
  const screenCenter = getScreenCenter();
  const distance = finalCameraDistance(aspect, fovDeg);
  const finalPosition = new THREE.Vector3(
    screenCenter.x - distance,
    cinematicConfig.camera.eyeHeight,
    screenCenter.z,
  );

  const waypoints = cinematicConfig.camera.waypoints;
  const positions = [
    ...waypoints.map((w) => new THREE.Vector3(...w.position)),
    finalPosition,
  ];
  const targets = [
    ...waypoints.map((w) => new THREE.Vector3(...w.target)),
    screenCenter.clone(),
  ];

  return {
    position: new THREE.CatmullRomCurve3(positions, false, "centripetal"),
    target: new THREE.CatmullRomCurve3(targets, false, "centripetal"),
    finalPosition,
    screenCenter,
  };
}

/** Writes the camera pose for a normalised progress value (0..1) into `out`. */
export function sampleCameraPath(
  path: CameraPath,
  progress: number,
  outPosition: THREE.Vector3,
  outTarget: THREE.Vector3,
): void {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  path.position.getPointAt(t, outPosition);
  path.target.getPointAt(t, outTarget);
}
