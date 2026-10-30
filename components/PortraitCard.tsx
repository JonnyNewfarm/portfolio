"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";

import { useTexture } from "@react-three/drei";
import { usePathname } from "next/navigation";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import * as THREE from "three";

import { bendVertex } from "@/components/projects/projectShared";

const IMAGE = "/portrait.jpg";

const PLANE_WIDTH = 3.4;
const PLANE_HEIGHT = 4.25;

const REST_YAW = -0.48;
const REST_ROLL = THREE.MathUtils.degToRad(-2); // Negative = clockwise, positive = counterclockwise
const HOVER_Z = 1.35;

const HOVER_SPEED = 5.5;
const MOVE_SPEED = 8.5;
const BEND_SCALE = 0.72;

const portraitFragment = `
uniform sampler2D uTexture;

uniform vec2 uUvScale;
uniform vec2 uUvOffset;

varying vec2 vUv;

void main() {
  vec2 imageUv =
    vUv * uUvScale + uUvOffset;

  vec4 color = texture2D(
    uTexture,
    imageUv
  );

  gl_FragColor = color;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function PortraitPlane({
  active,
  pointer,
  invalidateRef,
  labelRef,
  nameRef,
  ageRef,
}: {
  active: boolean;
  pointer: MutableRefObject<THREE.Vector2>;
  invalidateRef: MutableRefObject<(() => void) | null>;
  labelRef: MutableRefObject<HTMLSpanElement | null>;
  nameRef: MutableRefObject<HTMLDivElement | null>;
  ageRef: MutableRefObject<HTMLSpanElement | null>;
}) {
  const { gl, camera, size, invalidate } = useThree();

  const imageTexture = useTexture(IMAGE);

  const groupRef = useRef<THREE.Group>(null);

  const hoverRef = useRef(0);

  const pointerSmooth = useRef(new THREE.Vector2());

  const velocity = useRef(new THREE.Vector2());

  const previousPosition = useRef(new THREE.Vector3());

  const projectedPoint = useRef(new THREE.Vector3());

  const uniforms = useMemo(
    () => ({
      uTexture: {
        value: imageTexture,
      },

      uUvScale: {
        value: new THREE.Vector2(1, 1),
      },

      uUvOffset: {
        value: new THREE.Vector2(0, 0),
      },

      uTime: {
        value: 0,
      },

      uHover: {
        value: 0,
      },

      uWorldScale: {
        value: BEND_SCALE,
      },

      uEdgeBend: {
        value: 0,
      },

      uPointer: {
        value: new THREE.Vector2(),
      },

      uMotion: {
        value: new THREE.Vector2(),
      },

      uImageSize: {
        value: new THREE.Vector2(PLANE_WIDTH, PLANE_HEIGHT),
      },
    }),
    [imageTexture],
  );

  useEffect(() => {
    imageTexture.colorSpace = THREE.SRGBColorSpace;

    imageTexture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());

    const image = imageTexture.image as
      | {
          width?: number;
          height?: number;
        }
      | undefined;

    if (image?.width && image?.height) {
      const imageAspect = image.width / image.height;

      const planeAspect = PLANE_WIDTH / PLANE_HEIGHT;

      if (imageAspect > planeAspect) {
        const scale = planeAspect / imageAspect;

        uniforms.uUvScale.value.set(scale, 1);

        uniforms.uUvOffset.value.set((1 - scale) / 2, 0);
      } else {
        const scale = imageAspect / planeAspect;

        uniforms.uUvScale.value.set(1, scale);

        uniforms.uUvOffset.value.set(0, (1 - scale) / 2);
      }
    }

    imageTexture.needsUpdate = true;

    invalidate();
  }, [imageTexture, uniforms, gl, invalidate]);

  useEffect(() => {
    invalidateRef.current = invalidate;

    invalidate();

    return () => {
      invalidateRef.current = null;
    };
  }, [invalidate, invalidateRef]);

  useEffect(() => {
    invalidate();
  }, [active, invalidate]);

  const projectPosition = (
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
  ) => {
    const point = projectedPoint.current;

    point.set(x, y, z);

    group.localToWorld(point);
    point.project(camera);

    return {
      x: (point.x + 1) * size.width * 0.5,
      y: (1 - point.y) * size.height * 0.5,
    };
  };

  useFrame((state, rawDelta) => {
    const group = groupRef.current;

    if (!group) return;

    const dt = Math.min(rawDelta, 0.05);

    hoverRef.current = THREE.MathUtils.damp(
      hoverRef.current,
      active ? 1 : 0,
      HOVER_SPEED,
      dt,
    );

    const hover = hoverRef.current;

    const lift = THREE.MathUtils.smoothstep(hover, 0, 0.7);

    const turn = THREE.MathUtils.smoothstep(hover, 0.3, 0.97);

    pointerSmooth.current.x = THREE.MathUtils.damp(
      pointerSmooth.current.x,
      active ? pointer.current.x : 0,
      6,
      dt,
    );

    pointerSmooth.current.y = THREE.MathUtils.damp(
      pointerSmooth.current.y,
      active ? pointer.current.y : 0,
      6,
      dt,
    );

    group.position.z = THREE.MathUtils.damp(
      group.position.z,
      HOVER_Z * lift,
      MOVE_SPEED,
      dt,
    );

    group.position.x = THREE.MathUtils.damp(
      group.position.x,
      pointerSmooth.current.x * 0.075 * turn,
      MOVE_SPEED,
      dt,
    );

    group.position.y = THREE.MathUtils.damp(
      group.position.y,
      pointerSmooth.current.y * 0.055 * turn,
      MOVE_SPEED,
      dt,
    );

    group.rotation.y = THREE.MathUtils.damp(
      group.rotation.y,
      REST_YAW * (1 - turn),
      MOVE_SPEED,
      dt,
    );

    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      -pointerSmooth.current.y * 0.035 * turn,
      MOVE_SPEED,
      dt,
    );

    group.rotation.z = THREE.MathUtils.damp(
      group.rotation.z,
      REST_ROLL * (1 - turn) - pointerSmooth.current.x * 0.015 * turn,
      MOVE_SPEED,
      dt,
    );

    const scale = THREE.MathUtils.damp(group.scale.x, 1 - lift * 0.04, 9, dt);

    group.scale.setScalar(scale);

    const vx =
      (group.position.x - previousPosition.current.x) / Math.max(dt, 0.001);

    const vy =
      (group.position.y - previousPosition.current.y) / Math.max(dt, 0.001);

    previousPosition.current.copy(group.position);

    velocity.current.x = THREE.MathUtils.damp(
      velocity.current.x,
      THREE.MathUtils.clamp(vx * 0.065, -1, 1),
      9,
      dt,
    );

    velocity.current.y = THREE.MathUtils.damp(
      velocity.current.y,
      THREE.MathUtils.clamp(vy * 0.065, -1, 1),
      9,
      dt,
    );

    uniforms.uTime.value = state.clock.elapsedTime;

    uniforms.uHover.value = hover;

    uniforms.uPointer.value.copy(pointerSmooth.current);

    uniforms.uMotion.value.copy(velocity.current);

    uniforms.uEdgeBend.value =
      (Math.abs(velocity.current.x) + Math.abs(velocity.current.y)) *
      0.13 *
      hover;

    group.updateWorldMatrix(true, false);

    const topLeft = projectPosition(
      group,
      -PLANE_WIDTH / 2,
      PLANE_HEIGHT / 2,
      0,
    );

    const bottomLeft = projectPosition(
      group,
      -PLANE_WIDTH / 2,
      -PLANE_HEIGHT / 2,
      0,
    );

    const bottomRight = projectPosition(
      group,
      PLANE_WIDTH / 2,
      -PLANE_HEIGHT / 2,
      0,
    );

    const inset = size.width < 230 ? 10 : 16;

    if (labelRef.current) {
      labelRef.current.style.left = `${topLeft.x + inset}px`;

      labelRef.current.style.top = `${topLeft.y + inset}px`;
    }

    if (nameRef.current) {
      nameRef.current.style.left = `${bottomLeft.x + inset}px`;

      nameRef.current.style.top = `${bottomLeft.y - inset - 75}px`;
    }

    if (ageRef.current) {
      ageRef.current.style.left = `${bottomRight.x - inset}px`;

      ageRef.current.style.top = `${bottomRight.y - inset}px`;
    }

    const animating =
      active ||
      hover > 0.001 ||
      Math.abs(group.position.z) > 0.001 ||
      Math.abs(group.rotation.y - REST_YAW) > 0.001 ||
      Math.abs(group.rotation.z - REST_ROLL) > 0.001 ||
      pointerSmooth.current.lengthSq() > 0.0001 ||
      velocity.current.lengthSq() > 0.0001;

    if (animating) {
      invalidate();
    }
  });

  return (
    <group ref={groupRef} rotation={[0, REST_YAW, REST_ROLL]}>
      <mesh>
        <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT, 40, 52]} />

        <shaderMaterial
          uniforms={uniforms}
          vertexShader={bendVertex}
          fragmentShader={portraitFragment}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function PortraitCard() {
  const pathname = usePathname();

  const isProjectOpen = pathname.startsWith("/projects/");

  const cardRef = useRef<HTMLButtonElement>(null);

  const labelRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const ageRef = useRef<HTMLSpanElement>(null);

  const invalidateRef = useRef<(() => void) | null>(null);

  const pointer = useRef(new THREE.Vector2());

  const [hovered, setHovered] = useState(false);
  const [tapped, setTapped] = useState(false);

  const active = !isProjectOpen && (hovered || tapped);

  useEffect(() => {
    if (isProjectOpen) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    const update = (event: globalThis.PointerEvent) => {
      if (!finePointer.matches || event.pointerType === "touch") {
        return;
      }

      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      setHovered((previous) => (previous === inside ? previous : inside));

      if (inside) {
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

        const y = 1 - ((event.clientY - rect.top) / rect.height) * 2;

        pointer.current.set(
          THREE.MathUtils.clamp(x, -1, 1),
          THREE.MathUtils.clamp(y, -1, 1),
        );
      } else {
        pointer.current.set(0, 0);
      }

      invalidateRef.current?.();
    };

    const reset = () => {
      setHovered(false);
      pointer.current.set(0, 0);
      invalidateRef.current?.();
    };

    window.addEventListener("pointermove", update, true);

    window.addEventListener("blur", reset);

    return () => {
      window.removeEventListener("pointermove", update, true);

      window.removeEventListener("blur", reset);
    };
  }, [isProjectOpen]);

  useEffect(() => {
    if (!isProjectOpen) return;

    setHovered(false);
    setTapped(false);

    pointer.current.set(0, 0);
    invalidateRef.current?.();
  }, [isProjectOpen]);

  return (
    <button
      ref={cardRef}
      type="button"
      aria-label="Portrait of Jonas Nygaard, designer and developer, age 30"
      aria-pressed={active}
      aria-hidden={isProjectOpen}
      tabIndex={isProjectOpen ? -1 : 0}
      onPointerEnter={(event) => {
        if (!isProjectOpen && event.pointerType !== "touch") {
          setHovered(true);
          invalidateRef.current?.();
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") {
          setHovered(false);
          pointer.current.set(0, 0);
          invalidateRef.current?.();
        }
      }}
      onClick={() => {
        if (isProjectOpen) return;

        if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
          setTapped((previous) => !previous);
        }
      }}
      onFocus={(event) => {
        if (!isProjectOpen && event.currentTarget.matches(":focus-visible")) {
          setHovered(true);
        }
      }}
      onBlur={() => {
        setHovered(false);
        setTapped(false);
      }}
      className={`
        group
        fixed
        bottom-[16.5svh]
        right-[3.2vw]
        z-[35]
        block
        aspect-[4/5]
        w-[clamp(210px,20vw,350px)]
        border-0
        bg-transparent
        p-0
        text-left
        outline-none

        focus-visible:outline
        focus-visible:outline-1
        focus-visible:outline-offset-4

        max-md:bottom-[18svh]
        max-md:right-[5vw]
        max-md:w-[min(40vw,170px)]

        ${isProjectOpen ? "pointer-events-none" : "cursor-pointer"}
      `}
    >
      <div className="pointer-events-none absolute inset-0">
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{
            position: [0, 0, 8.5],
            fov: 35,
            near: 0.1,
            far: 50,
          }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          style={{
            pointerEvents: "none",
          }}
        >
          <Suspense fallback={null}>
            <PortraitPlane
              active={active}
              pointer={pointer}
              invalidateRef={invalidateRef}
              labelRef={labelRef}
              nameRef={nameRef}
              ageRef={ageRef}
            />
          </Suspense>
        </Canvas>
      </div>

      <span
        ref={labelRef}
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          z-10
          whitespace-nowrap
          font-bueno
          text-[clamp(11px,0.85vw,15px)]
          font-bold
          uppercase
          leading-none
          text-white
          [text-shadow:0_2px_8px_rgba(0,0,0,0.75)]
          transition-opacity
          duration-500

          ${active ? "opacity-100" : "opacity-0"}
        `}
      >
        PORTRAIT / 2026
      </span>

      <div
        ref={nameRef}
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          z-10
          whitespace-nowrap
          text-left
          text-white
          [text-shadow:0_2px_8px_rgba(0,0,0,0.75)]
          transition-opacity
          duration-500

          ${active ? "opacity-100" : "opacity-0"}
        `}
      >
        <div className="font-bueno text-[clamp(16px,1.5vw,24px)] font-bold uppercase leading-none">
          JONAS NYGAARD
        </div>

        <div className="mt-2 font-sans text-[clamp(9px,0.65vw,12px)] font-medium uppercase tracking-[0.04em]">
          DESIGNER / DEVELOPER
        </div>
      </div>

      <span
        ref={ageRef}
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          z-10
          -translate-x-full
          -translate-y-full
          whitespace-nowrap
          font-bueno
          text-[clamp(12px,0.95vw,17px)]
          font-bold
          uppercase
          leading-none
          text-white
          [text-shadow:0_2px_8px_rgba(0,0,0,0.75)]
          transition-opacity
          duration-500

          ${active ? "opacity-100" : "opacity-0"}
        `}
      >
        AGE / 30
      </span>
    </button>
  );
}
