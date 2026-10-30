"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";

type Props = {
  src: string;
  yaw?: number;
  className?: string;
};

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position =
    projectionMatrix *
    modelViewMatrix *
    vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uTexture;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;

varying vec2 vUv;

void main() {
  vec2 uv = vUv * uUvScale + uUvOffset;

  vec4 color = texture2D(uTexture, uv);

  gl_FragColor = color;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function ProjectPlane({ src, yaw }: { src: string; yaw: number }) {
  const texture = useTexture(src);

  const { viewport, invalidate, gl } = useThree();

  const image = texture.image as
    | { width?: number; height?: number }
    | undefined;

  const imageAspect =
    image?.width && image?.height ? image.width / image.height : 0.8;

  /*
   * Leave some room around the plane
   * for perspective distortion.
   */

  const width = viewport.width * 0.87;
  const height = viewport.height * 0.85;

  const planeAspect = width / height;

  const uniforms = useMemo(() => {
    let scaleX = 1;
    let scaleY = 1;
    let offsetX = 0;
    let offsetY = 0;

    // Cover crop, preserving image proportions.
    if (imageAspect > planeAspect) {
      scaleX = planeAspect / imageAspect;
      offsetX = (1 - scaleX) / 2;
    } else {
      scaleY = imageAspect / planeAspect;
      offsetY = (1 - scaleY) / 2;
    }

    return {
      uTexture: { value: texture },
      uUvScale: {
        value: new THREE.Vector2(scaleX, scaleY),
      },
      uUvOffset: {
        value: new THREE.Vector2(offsetX, offsetY),
      },
    };
  }, [texture, imageAspect, planeAspect]);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;

    texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());

    texture.needsUpdate = true;
    invalidate();
  }, [texture, gl, invalidate]);

  useEffect(() => {
    invalidate();
  }, [yaw, viewport.width, viewport.height, invalidate]);

  return (
    <group rotation={[0, yaw, 0]}>
      <mesh>
        <planeGeometry args={[width, height, 1, 1]} />

        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function MobileProjectImage({
  src,
  yaw = 0.5,
  className = "",
}: Props) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{
          position: [0, 0, 8.5],
          fov: 38,
          near: 0.1,
          far: 50,
        }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        }}
        style={{ pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <ProjectPlane src={src} yaw={yaw} />
        </Suspense>
      </Canvas>
    </div>
  );
}
