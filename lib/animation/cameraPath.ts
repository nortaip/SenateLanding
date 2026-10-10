import * as THREE from "three";
import { cinematicConfig } from "@/config/cinematicConfig";

export interface CameraPath {
  position: THREE.CatmullRomCurve3;
  target: THREE.CatmullRomCurve3;
  /** Timeline progress at which each waypoint is reached (ascending, 0..1). */
  times: number[];
  /** Fritsch–Carlson tangents for the progress -> curve-parameter mapping. */
  tangents: number[];
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
 * Monotone cubic tangents (Fritsch–Carlson) for points (times[i], i / (n - 1)).
 * The resulting mapping is C1-smooth, so the camera never jerks when it passes a waypoint.
 */
function monotoneTangents(times: number[]): number[] {
  const n = times.length;
  const ys = times.map((_, i) => i / (n - 1));
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (times[i + 1] - times[i]));
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return m;
}

/** Maps timeline progress to the curve parameter (0..1) through the keyframe times. */
function progressToCurveParam(path: CameraPath, progress: number): number {
  const { times, tangents } = path;
  const n = times.length;
  if (progress <= times[0]) return 0;
  if (progress >= times[n - 1]) return 1;
  let i = 0;
  while (i < n - 2 && progress > times[i + 1]) i++;
  const h = times[i + 1] - times[i];
  const t = (progress - times[i]) / h;
  const y0 = i / (n - 1);
  const y1 = (i + 1) / (n - 1);
  const t2 = t * t;
  const t3 = t2 * t;
  // Cubic Hermite basis
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * h * tangents[i] +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * h * tangents[i + 1]
  );
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

  const { waypoints, finalAt } = cinematicConfig.camera;
  const positions = [...waypoints.map((w) => new THREE.Vector3(...w.position)), finalPosition];
  const targets = [...waypoints.map((w) => new THREE.Vector3(...w.target)), screenCenter.clone()];
  const times = [...waypoints.map((w) => w.at), finalAt];

  return {
    position: new THREE.CatmullRomCurve3(positions, false, "centripetal"),
    target: new THREE.CatmullRomCurve3(targets, false, "centripetal"),
    times,
    tangents: monotoneTangents(times),
    finalPosition,
    screenCenter,
  };
}

/** Writes the camera pose for a timeline progress value (0..1) into the output vectors. */
export function sampleCameraPath(
  path: CameraPath,
  progress: number,
  outPosition: THREE.Vector3,
  outTarget: THREE.Vector3,
): void {
  const u = THREE.MathUtils.clamp(progressToCurveParam(path, progress), 0, 1);
  path.position.getPoint(u, outPosition);
  path.target.getPoint(u, outTarget);
}
