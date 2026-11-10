"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { PROJECTS } from "@/lib/projects";
import {
  CARD_WIDTH,
  REST_YAW,
  STACK,
  TARGET_Z,
  EDGE_BEND_STRENGTH,
  bendVertex,
  imageFragment,
  smoothstep,
  worldAt,
  scaleForWidth,
  titleCornerPixels,
  type HitMap,
  type PointerMap,
  type ProgressRef,
  type TitleMap,
} from "./projectShared";

export default function ImageCard({
  index,
  selected,
  hovered,
  hits,
  pointers,
  progress,
  target,
  handoff,
  titles,
  closing,
}: {
  index: number;
  selected: number | null;
  hovered: string | null;
  hits: HitMap;
  pointers: PointerMap;
  progress: ProgressRef;
  target: MutableRefObject<HTMLDivElement | null>;
  handoff: ProgressRef;
  titles: TitleMap;
  closing: MutableRefObject<boolean>;
}) {
  const id = `cover-${index}`;
  const texture = useTexture(PROJECTS[index].images[0]);
  const { camera, size, gl } = useThree();
  const group = useRef<THREE.Group>(null);
  const photo = useRef<THREE.Mesh>(null);
  const movingHit = useRef<THREE.Mesh>(null);
  const idleHit = useRef<THREE.Mesh>(null);
  const pointerSmooth = useRef(new THREE.Vector2());
  const velocity = useRef(new THREE.Vector2());
  const previous = useRef(new THREE.Vector3());
  const hoverValue = useRef(0);
  const initialized = useRef(false);
  const wasSelected = useRef(false);
  const startPos = useRef(new THREE.Vector3());
  const startRot = useRef(new THREE.Euler());
  const startScale = useRef(1);
  const titleStart = useRef({
    x: 0,
    y: 0,
    font: 18,
    width: 200,
    yaw: 0,
    pitch: 0,
  });

  const config = STACK[index];
  const mobile = size.width < 430;
  const homeX = mobile ? (index === 0 ? -1.25 : 0.95) : config.x;
  const restYaw = 0;
  const image = texture.image as
    | { width?: number; height?: number }
    | undefined;
  const aspect =
    image?.width && image?.height ? image.width / image.height : 2 / 3;
  const width = mobile ? 3.45 : CARD_WIDTH;
  const height = width / aspect;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uWorldScale: { value: 1 },
      uEdgeBend: { value: 0 },
      uOpacity: { value: 1 },
      uPointer: { value: new THREE.Vector2() },
      uMotion: { value: new THREE.Vector2() },
      uImageSize: { value: new THREE.Vector2(width, height) },
      uTexture: { value: texture },
    }),
    [texture, width, height],
  );

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
  }, [texture, gl]);

  useEffect(() => {
    hits.current.set(id, { moving: movingHit.current, idle: idleHit.current });
    pointers.current.set(id, new THREE.Vector2());
    return () => {
      hits.current.delete(id);
      pointers.current.delete(id);
    };
  }, [id, hits, pointers]);

  useFrame((state, rawDt) => {
    const root = group.current;
    if (!root) return;
    const dt = Math.min(rawDt, 0.05);
    const isSelected = selected === index;
    const isHovered = selected === null && hovered === id;
    const title = titles.current.get(index);

    if (!initialized.current) {
      root.position.set(homeX, config.y, config.z);
      root.rotation.set(0, restYaw, config.roll);
      previous.current.copy(root.position);
      initialized.current = true;
    }

    if (isSelected && !wasSelected.current) {
      startPos.current.copy(root.position);
      startRot.current.copy(root.rotation);
      startScale.current = root.scale.x;
      const p = titleCornerPixels(root, camera, size, width, height);
      const dist = Math.max(0.1, camera.position.z - root.position.z);
      const ppw =
        camera instanceof THREE.PerspectiveCamera
          ? size.height /
            (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist)
          : 100;
      const projected = width * root.scale.x * ppw;
      titleStart.current = {
        x: p.x,
        y: p.y,
        font: THREE.MathUtils.clamp(projected * 0.078, 12, 25),
        width: Math.max(90, projected * 0.87),
        yaw: root.rotation.y,
        pitch: root.rotation.x,
      };
    }
    wasSelected.current = isSelected;

    hoverValue.current = THREE.MathUtils.damp(
      hoverValue.current,
      isHovered ? 1 : 0,
      5,
      dt,
    );
    const h = hoverValue.current;
    const lift = THREE.MathUtils.smoothstep(h, 0, 0.62);
    const turn = THREE.MathUtils.smoothstep(h, 0.65, 0.98);
    const pointer = pointers.current.get(id);
    pointerSmooth.current.x = THREE.MathUtils.damp(
      pointerSmooth.current.x,
      isHovered ? (pointer?.x ?? 0) : 0,
      6,
      dt,
    );
    pointerSmooth.current.y = THREE.MathUtils.damp(
      pointerSmooth.current.y,
      isHovered ? (pointer?.y ?? 0) : 0,
      6,
      dt,
    );

    if (isSelected) {
      const rect = target.current?.getBoundingClientRect();
      if (rect && rect.width && rect.height) {
        const pos = worldAt(
          camera,
          size,
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          TARGET_Z,
        );
        const scale = scaleForWidth(
          camera,
          size.height,
          TARGET_Z,
          width,
          rect.width,
        );
        const t = smoothstep(progress.current.value);
        root.position.copy(startPos.current).lerp(pos, t);
        root.scale.setScalar(
          THREE.MathUtils.lerp(startScale.current, scale, t),
        );
        root.rotation.set(
          THREE.MathUtils.lerp(startRot.current.x, 0, t),
          THREE.MathUtils.lerp(startRot.current.y, 0, t),
          0,
        );
        root.visible = handoff.current.value < 0.999;
      }
    } else {
      root.visible = true;
      root.position.x = THREE.MathUtils.damp(
        root.position.x,
        homeX +
          config.hoverOffsetX * lift +
          pointerSmooth.current.x * 0.085 * turn,
        8.5,
        dt,
      );

      root.rotation.z = THREE.MathUtils.damp(
        root.rotation.z,
        config.roll * (1 - turn),
        8,
        dt,
      );
      root.position.y = THREE.MathUtils.damp(
        root.position.y,
        config.y + 0.1 * lift + pointerSmooth.current.y * 0.07 * turn,
        8.5,
        dt,
      );
      root.position.z = THREE.MathUtils.damp(
        root.position.z,
        config.z + (config.hoverZ - config.z) * lift,
        8,
        dt,
      );
      root.rotation.y = THREE.MathUtils.damp(
        root.rotation.y,
        restYaw * (1 - turn),
        8,
        dt,
      );
      root.rotation.x = THREE.MathUtils.damp(
        root.rotation.x,
        -pointerSmooth.current.y * 0.03 * turn,
        8,
        dt,
      );
      root.scale.setScalar(
        THREE.MathUtils.damp(root.scale.x, 1 + lift * 0.025, 9, dt),
      );
    }

    const vx = (root.position.x - previous.current.x) / Math.max(dt, 0.001);
    const vy = (root.position.y - previous.current.y) / Math.max(dt, 0.001);
    previous.current.copy(root.position);
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
    uniforms.uHover.value = isSelected ? 0 : h;
    uniforms.uOpacity.value = isSelected ? 1 - handoff.current.value : 1;
    uniforms.uPointer.value.copy(pointerSmooth.current);
    const settle = isSelected
      ? Math.sin(Math.PI * THREE.MathUtils.clamp(progress.current.value, 0, 1))
      : 1;
    uniforms.uMotion.value
      .copy(velocity.current)
      .multiplyScalar(Math.max(0, settle));
    uniforms.uEdgeBend.value = isSelected
      ? Math.max(0, settle) * EDGE_BEND_STRENGTH
      : (Math.abs(velocity.current.x) + Math.abs(velocity.current.y)) *
        0.13 *
        h;
    if (photo.current)
      photo.current.renderOrder = isSelected
        ? 300
        : h > 0.01
          ? 200
          : index + 10;
    if (movingHit.current) movingHit.current.visible = selected === null;
    if (idleHit.current) idleHit.current.visible = selected === null;

    if (title) {
      const t = isSelected ? smoothstep(progress.current.value) : 0;
      let fromX: number, fromY: number, fromFont: number, fromWidth: number;
      if (isSelected) {
        ({
          x: fromX,
          y: fromY,
          font: fromFont,
          width: fromWidth,
        } = titleStart.current);
      } else {
        const p = titleCornerPixels(root, camera, size, width, height);
        const dist = Math.max(0.1, camera.position.z - root.position.z);
        const ppw =
          camera instanceof THREE.PerspectiveCamera
            ? size.height /
              (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist)
            : 100;
        const projected = width * root.scale.x * ppw;
        fromX = p.x;
        fromY = p.y;
        fromFont = THREE.MathUtils.clamp(projected * 0.078, 12, 25);
        fromWidth = Math.max(90, projected * 0.87);
      }
      const small = size.width < 768;
      const detailX = size.width * (small ? 0.05 : 0.035);
      const detailY = size.height * (small ? 0.12 : 0.145);
      const detailFont = THREE.MathUtils.clamp(
        size.width * (small ? 0.068 : 0.02),
        25,
        64,
      );
      const detailWidth = size.width * (small ? 0.76 : 0.22);
      title.style.left = `${THREE.MathUtils.lerp(fromX, detailX, t)}px`;
      title.style.top = `${THREE.MathUtils.lerp(fromY, detailY, t)}px`;
      title.style.fontSize = `${THREE.MathUtils.lerp(fromFont, detailFont, t)}px`;
      title.style.width = `${THREE.MathUtils.lerp(fromWidth, detailWidth, t)}px`;
      const yaw = THREE.MathUtils.lerp(
        isSelected ? titleStart.current.yaw : root.rotation.y,
        0,
        t,
      );
      const pitch = THREE.MathUtils.lerp(
        isSelected ? titleStart.current.pitch : root.rotation.x,
        0,
        t,
      );
      title.style.transformOrigin = "left center";
      title.style.transform = `translate(0,-50%) perspective(900px) rotateY(${yaw}rad) rotateX(${pitch}rad)`;
      title.style.textAlign = "left";
      title.style.color = "#ece9e4";
      title.style.opacity = String(
        selected !== null && !isSelected
          ? 0
          : isSelected
            ? closing.current
              ? smoothstep((progress.current.value - 0.05) / 0.75)
              : 1
            : THREE.MathUtils.clamp(h * 1.5 - 0.2, 0, 1),
      );
    }
  });

  return (
    <>
      <group ref={group}>
        <mesh ref={photo} raycast={() => {}}>
          <planeGeometry args={[width, height, 64, 88]} />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={bendVertex}
            fragmentShader={imageFragment}
            transparent
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={movingHit} position={[0, 0, 0.035]}>
          <planeGeometry args={[width * 1.2, height * 1.15]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            colorWrite={false}
            depthTest={false}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <mesh ref={idleHit} position={[homeX, config.y, config.z + 1.4]}>
        <planeGeometry args={[mobile ? 2.05 : 2.4, mobile ? 2.15 : 2.8]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          colorWrite={false}
          depthTest={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}
