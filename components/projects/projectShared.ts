
import type { MutableRefObject } from "react";
import * as THREE from "three";


export const CARD_WIDTH = 3.8;
export const REST_YAW = 0.6;

export const STACK = [
  {
    x: -3.65,
    y: -0.22,
    z: 0.25,

    yawOffset: -0.45,
    roll: 0.1,

    hoverZ: 3.8,
    hoverOffsetX: 1.5,
  },

  {
    x: -1,
    y: -0.12,
    z: 0.65,

    yawOffset: -0.25,
    roll: -0.1,

    hoverZ: 3.6,
    hoverOffsetX: 0,
  },
] as const;


export const TRANSITION_DURATION = 1.05;
export const TARGET_Z = 1.4;
export const EDGE_BEND_STRENGTH = 1;
export const GALLERY_WIDTH = 0.61;
export const GALLERY_GAP = "1svh";
export const SMOOTH_SCROLL_SPEED = 0.011;
export const WHEEL_MULTIPLIER = 0.92;

/* ORIGINAL PROJECT IMAGE SHADERS */
export const bendVertex = /* glsl */ `
uniform float uTime, uHover, uWorldScale, uEdgeBend;
uniform vec2 uPointer, uMotion, uImageSize;
varying vec2 vUv;
const float PI = 3.14159265359;
void main() {
  vUv = uv;
  vec3 p = position;
  vec2 q = p.xy / uImageSize + 0.5;
  float sx = sin(q.x * PI);
  float sy = sin(q.y * PI);
  float wave = sin(q.x * 7.0 - uTime * 1.8);
  p.z += sx * sy * (
    uPointer.x * 0.32 + uPointer.y * 0.16 +
    wave * uHover * 0.13 + uMotion.x * 0.29 + uMotion.y * 0.24
  ) * uWorldScale;
  p.x += sy * (uPointer.x * 0.085 + uMotion.x * 0.085) * uWorldScale;
  p.y -= sx * (uPointer.y * 0.065 - uMotion.y * 0.075) * uWorldScale;
  float side = uv.x * 2.0 - 1.0;
  float edge = pow(abs(side), 1.4);
  float verticalProfile = 0.85 + 0.15 * cos((uv.y - 0.5) * PI);
  p.z += uEdgeBend * (edge * 0.56 + side * edge * 0.17) * verticalProfile;
  p.x += uEdgeBend * side * edge * 0.11;
  p.y += uEdgeBend * side * (uv.y - 0.5) * 0.07;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

export const imageFragment = /* glsl */ `
uniform sampler2D uTexture;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uTexture, vUv);
  gl_FragColor = vec4(c.rgb, c.a * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Hit = {
  moving: THREE.Mesh | null;
  idle: THREE.Mesh | null;
};

export type HitMap = MutableRefObject<Map<string, Hit>>;
export type CameraMap = MutableRefObject<Map<number, THREE.Camera>>;
export type PointerMap = MutableRefObject<Map<string, THREE.Vector2>>;
export type ProgressRef = MutableRefObject<{ value: number }>;
export type TitleMap = MutableRefObject<Map<number, HTMLDivElement | null>>;
export type GalleryItemMap = MutableRefObject<Map<string, HTMLDivElement>>;
export type ScrollControl = {
  returnToFirst: (done: () => void) => void;
};

export const smoothstep = (v: number) => {
  const t = THREE.MathUtils.clamp(v, 0, 1);
  return t * t * (3 - 2 * t);
};

export function worldAt(
  camera: THREE.Camera,
  size: { width: number; height: number },
  px: number,
  py: number,
  z: number,
) {
  const p = new THREE.Vector3(
    (px / size.width) * 2 - 1,
    1 - (py / size.height) * 2,
    0.5,
  ).unproject(camera);

  const t = (z - camera.position.z) / (p.z - camera.position.z);

  return new THREE.Vector3(
    camera.position.x + (p.x - camera.position.x) * t,
    camera.position.y + (p.y - camera.position.y) * t,
    z,
  );
}

export function scaleForWidth(
  camera: THREE.Camera,
  viewportHeight: number,
  z: number,
  originalWidth: number,
  pixelWidth: number,
) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return 1;

  const distance = Math.max(0.1, camera.position.z - z);
  const pxPerWorld =
    viewportHeight /
    (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance);

  return pixelWidth / (originalWidth * pxPerWorld);
}

export function titleCornerPixels(
  root: THREE.Group,
  camera: THREE.Camera,
  size: { width: number; height: number },
  w: number,
  h: number,
) {
  root.updateWorldMatrix(true, false);

  const p = root
    .localToWorld(new THREE.Vector3(-w * 0.42, h * 0.42, 0.12))
    .project(camera);

  return {
    x: (p.x + 1) * size.width * 0.5,
    y: (1 - p.y) * size.height * 0.5,
  };
}
