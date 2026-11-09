"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import gsap from "gsap";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";

import { PROJECTS } from "@/lib/projects";
import type { ProgressRef, ScrollControl } from "./projectShared";

type FocusRef = MutableRefObject<{
  key: string | null;
  value: number;
}>;

type RatiosRef = MutableRefObject<number[]>;

type ScrollRef = MutableRefObject<{
  current: number;
  target: number;
  returning: boolean;
}>;

type Size = {
  width: number;
  height: number;
};

type ImageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// ELASTIC STRETCH SETTINGS
const ELASTIC_STRETCH = 0.1;
const ELASTIC_SQUASH = 0.018;
const ELASTIC_DRAG = 0.025;
const ELASTIC_DEPTH = 0.045;

const galleryWidth = (size: Size) =>
  size.width * (size.width < 768 ? 0.86 : 0.48);

const positiveMod = (n: number, divisor: number) =>
  ((n % divisor) + divisor) % divisor;

function cycleHeight(size: Size, ratios: number[]) {
  if (!ratios.length) return 1;

  const width = galleryWidth(size);
  const gap = size.height * 0.01;

  return (
    ratios.reduce((sum, ratio) => sum + width / Math.max(0.2, ratio), 0) +
    ratios.length * gap
  );
}

function galleryRects(
  size: Size,
  ratios: number[],
  scroll: number,
): ImageRect[] {
  const width = galleryWidth(size);
  const gap = size.height * 0.01;
  const x = size.width / 2;

  const heights = ratios.map((ratio) => width / Math.max(0.2, ratio));

  const cycle = cycleHeight(size, ratios);

  let y = size.height / 2;

  return heights.map((height, i) => {
    if (i > 0) {
      y += heights[i - 1] / 2 + gap + height / 2;
    }

    const topBoundary = -height / 2 - gap / 2;

    const wrappedY = positiveMod(y - scroll - topBoundary, cycle) + topBoundary;

    return {
      x,
      y: wrappedY,
      width,
      height,
    };
  });
}

function focusedRect(size: Size, ratio: number): ImageRect {
  const width = Math.min(
    size.width * (size.width < 768 ? 0.88 : 0.68),
    size.height * 0.84 * ratio,
  );

  return {
    x: size.width / 2,
    y: size.height / 2,
    width,
    height: width / ratio,
  };
}

function contains(rect: ImageRect, x: number, y: number) {
  return (
    x >= rect.x - rect.width / 2 &&
    x <= rect.x + rect.width / 2 &&
    y >= rect.y - rect.height / 2 &&
    y <= rect.y + rect.height / 2
  );
}

function GalleryPlane({
  src,
  index,
  ratios,
  scroll,
  focus,
  handoff,
  onImageLoaded,
  onFirstFrame,
}: {
  src: string;
  index: number;
  ratios: RatiosRef;
  scroll: ScrollRef;
  focus: FocusRef;
  handoff: ProgressRef;
  onImageLoaded: (index: number, ratio: number) => void;
  onFirstFrame: () => void;
}) {
  const texture = useTexture(src);

  const mesh = useRef<THREE.Mesh>(null);
  const frames = useRef(0);
  const reported = useRef(false);

  const previousElastic = useRef({
    amount: 0,
    axisX: 0,
    axisY: 1,
    direction: 1,
  });

  const previousProgress = useRef(0);
  const movementDirection = useRef(1);

  const blurredTexture = useRef<THREE.CanvasTexture | null>(null);

  const { gl } = useThree();

  const ratio = useMemo(() => {
    const image = texture.image as
      | { width?: number; height?: number }
      | undefined;

    return image?.width && image?.height ? image.width / image.height : 0.8;
  }, [texture]);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(1, 1 / ratio, 32, 40),
    [ratio],
  );

  const positions = useMemo(
    () => geometry.attributes.position as THREE.BufferAttribute,
    [geometry],
  );

  const uvs = useMemo(
    () => geometry.attributes.uv as THREE.BufferAttribute,
    [geometry],
  );

  useEffect(() => {
    onImageLoaded(index, ratio);

    texture.colorSpace = THREE.SRGBColorSpace;

    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());

    texture.needsUpdate = true;

    return () => {
      geometry.dispose();
    };
  }, [geometry, gl, index, onImageLoaded, ratio, texture]);

  useEffect(() => {
    const image = texture.image as
      | (CanvasImageSource & {
          width: number;
          height: number;
        })
      | undefined;

    if (!image?.width || !image?.height) return;

    let generated: THREE.CanvasTexture | null = null;

    try {
      const canvas = document.createElement("canvas");

      canvas.width = Math.max(1, Math.min(512, image.width));

      canvas.height = Math.max(
        1,
        Math.round((canvas.width * image.height) / image.width),
      );

      const context = canvas.getContext("2d");

      if (context && "filter" in context) {
        context.filter = "blur(7px)";

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        context.filter = "none";

        generated = new THREE.CanvasTexture(canvas);

        generated.colorSpace = THREE.SRGBColorSpace;
        generated.minFilter = THREE.LinearFilter;
        generated.magFilter = THREE.LinearFilter;
        generated.generateMipmaps = false;

        blurredTexture.current = generated;
      }
    } catch {}

    return () => {
      blurredTexture.current = null;
      generated?.dispose();
    };
  }, [texture]);

  useFrame(({ size }) => {
    const node = mesh.current;
    if (!node) return;

    const rect = galleryRects(size, ratios.current, scroll.current.current)[
      index
    ];

    if (!rect) return;

    const active = focus.current.key === String(index);

    const t = active ? THREE.MathUtils.clamp(focus.current.value, 0, 1) : 0;

    const end = focusedRect(size, ratio);

    const x = THREE.MathUtils.lerp(rect.x, end.x, t);

    const y = THREE.MathUtils.lerp(rect.y, end.y, t);

    const width = THREE.MathUtils.lerp(rect.width, end.width, t);

    node.visible =
      active ||
      (rect.y + rect.height / 2 > -120 &&
        rect.y - rect.height / 2 < size.height + 120);

    node.position.set(x - size.width / 2, size.height / 2 - y, active ? 3 : 0);

    node.scale.set(width, width, 1);
    node.rotation.set(0, 0, 0);

    node.renderOrder = active ? 300 : index + 1;

    const material = node.material as THREE.MeshBasicMaterial;

    const behindFocus = focus.current.key !== null && !active;

    const desiredMap =
      behindFocus && focus.current.value > 0.06 && blurredTexture.current
        ? blurredTexture.current
        : texture;

    if (material.map !== desiredMap) {
      material.map = desiredMap;
      material.needsUpdate = true;
    }

    material.opacity =
      handoff.current.value *
      (behindFocus
        ? THREE.MathUtils.lerp(
            1,
            0.34,
            THREE.MathUtils.clamp(focus.current.value, 0, 1),
          )
        : 1);

    // ELASTIC STRETCH

    // Track whether the image is opening or closing.
    if (active) {
      const delta = t - previousProgress.current;

      if (delta > 0.00001) {
        movementDirection.current = 1;
      } else if (delta < -0.00001) {
        movementDirection.current = -1;
      }
    } else {
      movementDirection.current = 1;
    }

    previousProgress.current = t;

    // The stretch is strongest during movement,
    // and disappears when the image reaches its target.
    const elastic = active ? Math.sin(Math.PI * t) : 0;

    // Determine the direction from the gallery position
    // to the fullscreen position.
    const dx = end.x - rect.x;
    const dy = rect.y - end.y;

    const distance = Math.hypot(dx, dy);

    const axisX = distance > 0.001 ? dx / distance : 0;

    const axisY = distance > 0.001 ? dy / distance : 1;

    const direction = movementDirection.current;

    const previous = previousElastic.current;

    const needsUpdate =
      Math.abs(elastic - previous.amount) > 0.00001 ||
      (elastic > 0.00001 &&
        (Math.abs(axisX - previous.axisX) > 0.00001 ||
          Math.abs(axisY - previous.axisY) > 0.00001 ||
          direction !== previous.direction));

    if (needsUpdate) {
      const stretchAmount = 1 + elastic * ELASTIC_STRETCH;

      const squashAmount = 1 - elastic * ELASTIC_SQUASH;

      for (let i = 0; i < positions.count; i++) {
        const u = uvs.getX(i);
        const v = uvs.getY(i);

        const baseX = u - 0.5;
        const baseY = (v - 0.5) / ratio;

        // Split vertex position into the movement
        // direction and the perpendicular direction.
        const along = baseX * axisX + baseY * axisY;

        const across = -baseX * axisY + baseY * axisX;

        // Gently stretch along the movement direction.
        const stretchedAlong = along * stretchAmount;

        // Very slight compression perpendicular
        // to the movement.
        const squeezedAcross = across * squashAmount;

        // Soft elastic lag in the middle of the image.
        const centerProfile = Math.sin(u * Math.PI) * Math.sin(v * Math.PI);

        const drag = -direction * elastic * ELASTIC_DRAG * centerProfile;

        const finalAlong = stretchedAlong + drag;

        // Reconstruct the original XY coordinates.
        const finalX = finalAlong * axisX - squeezedAcross * axisY;

        const finalY = finalAlong * axisY + squeezedAcross * axisX;

        // Subtle depth so the image feels like
        // a flexible surface rather than a flat scale.
        const finalZ = elastic * ELASTIC_DEPTH * centerProfile;

        positions.setXYZ(i, finalX, finalY, finalZ);
      }

      positions.needsUpdate = true;

      previousElastic.current = {
        amount: elastic,
        axisX,
        axisY,
        direction,
      };
    }

    if (index === 0 && !reported.current && ++frames.current >= 3) {
      reported.current = true;
      onFirstFrame();
    }
  });

  return (
    <mesh ref={mesh} geometry={geometry} visible={false} raycast={() => {}}>
      <meshBasicMaterial
        map={texture}
        color="white"
        transparent
        opacity={0}
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Planes({
  sources,
  ratios,
  scroll,
  focus,
  handoff,
  onImageLoaded,
  onFirstFrame,
}: {
  sources: string[];
  ratios: RatiosRef;
  scroll: ScrollRef;
  focus: FocusRef;
  handoff: ProgressRef;
  onImageLoaded: (index: number, ratio: number) => void;
  onFirstFrame: () => void;
}) {
  useFrame(({ size }, delta) => {
    if (scroll.current.returning || focus.current.key !== null) {
      return;
    }

    const s = scroll.current;

    s.current = THREE.MathUtils.damp(
      s.current,
      s.target,
      12,
      Math.min(delta, 0.05),
    );

    const cycle = cycleHeight(size, ratios.current);

    if (cycle > 1 && Math.abs(s.current) > cycle * 3) {
      const turns = Math.trunc(s.current / cycle);

      s.current -= turns * cycle;
      s.target -= turns * cycle;
    }
  });

  return (
    <>
      {sources.map((src, i) => (
        <Suspense key={`${i}-${src}`} fallback={null}>
          <GalleryPlane
            src={src}
            index={i}
            ratios={ratios}
            scroll={scroll}
            focus={focus}
            handoff={handoff}
            onImageLoaded={onImageLoaded}
            onFirstFrame={onFirstFrame}
          />
        </Suspense>
      ))}
    </>
  );
}

export default function GalleryThreeImages({
  index,
  firstTarget,
  handoff,
  focus,
  interactive,
  scrollControl,
  onReady,
  onFocusImage,
  onUnfocusImage,
  hitTestRef,
}: {
  index: number;
  firstTarget: MutableRefObject<HTMLDivElement | null>;
  handoff: ProgressRef;
  focus: FocusRef;
  interactive: boolean;
  scrollControl: MutableRefObject<ScrollControl | null>;
  onReady: () => void;
  onFocusImage: (key: string) => void;
  onUnfocusImage: () => void;
  hitTestRef: MutableRefObject<((x: number, y: number) => boolean) | null>;
}) {
  const sources = useMemo(() => PROJECTS[index].images.slice(0, 5), [index]);

  const ratios = useRef<number[]>(sources.map(() => 0.8));

  const scroll = useRef({
    current: 0,
    target: 0,
    returning: false,
  });

  const [firstRatio, setFirstRatio] = useState(0.8);

  const [size, setSize] = useState<Size>({
    width: 1280,
    height: 800,
  });

  const ready = useRef(false);

  const touch = useRef<{
    id: number;
    x: number;
    y: number;
    lastY: number;
  } | null>(null);

  const returnTween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const measure = () =>
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

    measure();

    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, []);

  const onImageLoaded = useCallback((i: number, ratio: number) => {
    ratios.current[i] = ratio;

    if (i === 0) {
      setFirstRatio(ratio);
    }
  }, []);

  const onFirstFrame = useCallback(() => {
    if (ready.current) return;

    ready.current = true;
    onReady();
  }, [onReady]);

  useEffect(() => {
    scrollControl.current = {
      returnToFirst(done) {
        returnTween.current?.kill();

        const s = scroll.current;

        const cycle = cycleHeight(size, ratios.current);

        const destination = Math.round(s.current / cycle) * cycle;

        const distance = Math.abs(s.current - destination);

        const finish = () => {
          s.current = 0;
          s.target = 0;
          s.returning = false;
          done();
        };

        if (distance < 1) {
          finish();
          return;
        }

        s.returning = true;
        s.target = destination;

        returnTween.current = gsap.to(s, {
          current: destination,

          duration: THREE.MathUtils.clamp(
            distance / (size.height * 1.5),
            0.7,
            1.5,
          ),

          ease: "power3.inOut",
          onComplete: finish,
        });
      },
    };

    return () => {
      returnTween.current?.kill();
      scrollControl.current = null;
    };
  }, [scrollControl, size]);

  useEffect(() => {
    hitTestRef.current = (x: number, y: number) => {
      if (!interactive || focus.current.key !== null) {
        return false;
      }

      return galleryRects(size, ratios.current, scroll.current.current).some(
        (rect) => contains(rect, x, y),
      );
    };

    return () => {
      hitTestRef.current = null;
    };
  }, [hitTestRef, interactive, focus, size]);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return;

      touch.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        lastY: e.clientY,
      };
    };

    const move = (e: PointerEvent) => {
      const start = touch.current;

      if (!start || start.id !== e.pointerId || e.pointerType !== "touch") {
        return;
      }

      if (
        !interactive ||
        focus.current.key !== null ||
        scroll.current.returning
      ) {
        return;
      }

      scroll.current.target += start.lastY - e.clientY;

      start.lastY = e.clientY;
    };

    const up = (e: PointerEvent) => {
      const start = touch.current;

      if (!start || start.id !== e.pointerId) {
        return;
      }

      touch.current = null;

      if (!interactive || scroll.current.returning || !ready.current) {
        return;
      }

      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) {
        return;
      }

      if (
        e.target instanceof Element &&
        e.target.closest("a,button,input,textarea,select")
      ) {
        return;
      }

      const rects = galleryRects(size, ratios.current, scroll.current.current);

      const active = focus.current.key;

      if (active !== null) {
        const i = Number(active);
        const r = rects[i];

        if (!r) return;

        const t = THREE.MathUtils.clamp(focus.current.value, 0, 1);

        const f = focusedRect(size, ratios.current[i]);

        const moving: ImageRect = {
          x: THREE.MathUtils.lerp(r.x, f.x, t),
          y: THREE.MathUtils.lerp(r.y, f.y, t),
          width: THREE.MathUtils.lerp(r.width, f.width, t),
          height: THREE.MathUtils.lerp(r.height, f.height, t),
        };

        if (!contains(moving, e.clientX, e.clientY)) {
          onUnfocusImage();
        }

        return;
      }

      for (let i = 0; i < rects.length; i++) {
        if (contains(rects[i], e.clientX, e.clientY)) {
          scroll.current.target = scroll.current.current;

          onFocusImage(String(i));
          return;
        }
      }
    };

    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      if (
        !interactive ||
        focus.current.key !== null ||
        scroll.current.returning
      ) {
        return;
      }

      const factor =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? size.height : 1;

      scroll.current.target += THREE.MathUtils.clamp(
        e.deltaY * factor,
        -240,
        240,
      );
    };

    const cancel = () => {
      touch.current = null;
    };

    const key = (e: KeyboardEvent) => {
      if (!interactive || focus.current.key !== null) {
        return;
      }

      const step =
        e.key === "ArrowDown"
          ? 110
          : e.key === "ArrowUp"
            ? -110
            : e.key === "PageDown"
              ? size.height * 0.8
              : e.key === "PageUp"
                ? -size.height * 0.8
                : e.key === " "
                  ? (e.shiftKey ? -1 : 1) * size.height * 0.85
                  : 0;

      if (!step) return;

      e.preventDefault();
      scroll.current.target += step;
    };

    window.addEventListener("pointerdown", down, true);

    window.addEventListener("pointermove", move, true);

    window.addEventListener("pointerup", up, true);

    window.addEventListener("pointercancel", cancel, true);

    window.addEventListener("keydown", key);

    window.addEventListener("wheel", wheel, {
      capture: true,
      passive: false,
    });

    return () => {
      window.removeEventListener("pointerdown", down, true);

      window.removeEventListener("pointermove", move, true);

      window.removeEventListener("pointerup", up, true);

      window.removeEventListener("pointercancel", cancel, true);

      window.removeEventListener("keydown", key);

      window.removeEventListener("wheel", wheel, true);
    };
  }, [interactive, focus, onFocusImage, onUnfocusImage, size]);

  const width = galleryWidth(size);
  const height = width / firstRatio;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[82]"
      aria-hidden="true"
    >
      <div
        ref={firstTarget}
        className="pointer-events-none absolute"
        style={{
          left: size.width / 2 - width / 2,
          top: size.height / 2 - height / 2,
          width,
          height,
        }}
      />

      <Canvas
        orthographic
        camera={{
          position: [0, 0, 10],
          zoom: 1,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        }}
        style={{
          pointerEvents: "none",
        }}
      >
        <Planes
          sources={sources}
          ratios={ratios}
          scroll={scroll}
          focus={focus}
          handoff={handoff}
          onImageLoaded={onImageLoaded}
          onFirstFrame={onFirstFrame}
        />
      </Canvas>
    </div>
  );
}
