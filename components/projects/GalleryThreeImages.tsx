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

import type { Project } from "@/sanity/getProjects";
import type { ProgressRef, ScrollControl } from "./projectShared";

type FocusRef = MutableRefObject<{
  key: string | null;
  value: number;
}>;

type ScreenSize = {
  width: number;
  height: number;
};

type ImageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  projects: Project[];
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
};

const MOVE_SPEED = 6;
const BEND_DURATION = 0.65;
const BEND_STRENGTH = 0.035;
const BEND_STRETCH = 0.018;
const THUMB_STAGGER = 0.12;
const THUMB_FADE_DURATION = 0.9;
const THUMB_OFFSET_Y = 22;

// Layout
const MAIN_WIDTH = 0.43;
const MAIN_HEIGHT = 0.71;

const THUMB_MAX_WIDTH = 0.12;
const THUMB_TOTAL_HEIGHT = 0.52;
const THUMB_GAP = 0.012;
const THUMB_RIGHT = 0.93;

function getRect(
  size: ScreenSize,
  aspect: number,
  imageIndex: number,
  selectedImage: number,
  allAspects: number[],
): ImageRect {
  const { width, height } = size;
  const mobile = width < 768;
  const safeAspect = Math.max(0.2, aspect);

  // MAIN IMAGE
  if (imageIndex === selectedImage) {
    const maxWidth = width * (mobile ? 0.86 : MAIN_WIDTH);
    const maxHeight = height * (mobile ? 0.58 : MAIN_HEIGHT);

    const imageWidth = Math.min(maxWidth, maxHeight * safeAspect);

    return {
      x: width * 0.5,
      y: height * (mobile ? 0.41 : 0.5),
      width: imageWidth,
      height: imageWidth / safeAspect,
    };
  }

  const thumbnailIndices = allAspects
    .map((_, i) => i)
    .filter((i) => i !== selectedImage);

  const thumbnailIndex = thumbnailIndices.indexOf(imageIndex);

  const thumbnailCount = thumbnailIndices.length;

  if (mobile) {
    const gap = width * 0.012;
    const availableWidth = width * 0.86;

    const slotWidth =
      (availableWidth - gap * (thumbnailCount - 1)) /
      Math.max(1, thumbnailCount);

    const smallestAspect = Math.min(
      ...thumbnailIndices.map((i) => Math.max(0.2, allAspects[i] ?? 1)),
    );

    // Same width, with enough vertical room
    // for the tallest thumbnail.
    const sharedWidth = Math.min(slotWidth, height * 0.13 * smallestAspect);

    return {
      x: width * 0.07 + slotWidth / 2 + thumbnailIndex * (slotWidth + gap),
      y: height * 0.81,
      width: sharedWidth,
      height: sharedWidth / safeAspect,
    };
  }

  // DESKTOP THUMBNAILS
  // Calculate a single shared width that allows
  // all four images to fit vertically without cropping.

  const gap = height * THUMB_GAP;
  const maxColumnHeight = height * THUMB_TOTAL_HEIGHT;
  const maxThumbnailWidth = width * THUMB_MAX_WIDTH;

  const heightUnits = thumbnailIndices.reduce(
    (sum, i) => sum + 1 / Math.max(0.2, allAspects[i] ?? 1),
    0,
  );

  const availableImageHeight = Math.max(
    1,
    maxColumnHeight - gap * (thumbnailCount - 1),
  );

  const sharedWidth = Math.min(
    maxThumbnailWidth,
    availableImageHeight / Math.max(0.2, heightUnits),
  );

  const thumbnailHeights = thumbnailIndices.map(
    (i) => sharedWidth / Math.max(0.2, allAspects[i] ?? 1),
  );

  const totalHeight =
    thumbnailHeights.reduce((sum, h) => sum + h, 0) +
    gap * (thumbnailCount - 1);

  const precedingHeight = thumbnailHeights
    .slice(0, thumbnailIndex)
    .reduce((sum, h) => sum + h, 0);

  const currentHeight = sharedWidth / safeAspect;

  return {
    x: width * THUMB_RIGHT - sharedWidth / 2,
    y:
      height * 0.5 -
      totalHeight / 2 +
      precedingHeight +
      thumbnailIndex * gap +
      currentHeight / 2,
    width: sharedWidth,
    height: currentHeight,
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
  imageIndex,
  selectedImage,
  handoff,
  ratios,
  onFirstFrame,
  onImageLoaded,
  hitRects,
}: {
  src: string;
  imageIndex: number;
  selectedImage: number;
  handoff: ProgressRef;
  ratios: MutableRefObject<number[]>;
  onFirstFrame: () => void;
  onImageLoaded: (i: number, aspect: number) => void;
  hitRects: MutableRefObject<Map<number, ImageRect>>;
}) {
  const texture = useTexture(src);
  const { gl } = useThree();

  const mesh = useRef<THREE.Mesh>(null);
  const initialized = useRef(false);
  const frames = useRef(0);
  const readySent = useRef(false);
  const thumbnailReveal = useRef({
    started: false,
    elapsed: 0,
  });
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 24, 24), []);

  const positions = useMemo(
    () => geometry.attributes.position as THREE.BufferAttribute,
    [geometry],
  );

  const originalPositions = useMemo(
    () => Float32Array.from(positions.array),
    [positions],
  );

  const previousSelected = useRef(selectedImage);

  const bend = useRef({
    elapsed: BEND_DURATION,
    strength: 0,
    directionX: 1,
    directionY: 0,
    dirty: false,
  });

  const aspect = useMemo(() => {
    const image = texture.image as
      { width?: number; height?: number } | undefined;

    return image?.width && image?.height ? image.width / image.height : 1;
  }, [texture]);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;

    onImageLoaded(imageIndex, aspect);
  }, [texture, gl, onImageLoaded, imageIndex, aspect]);

  useEffect(() => {
    return () => {
      hitRects.current.delete(imageIndex);
    };
  }, [hitRects, imageIndex]);

  useFrame(({ size }, delta) => {
    const node = mesh.current;
    if (!node) return;

    const target = getRect(
      size,
      aspect,
      imageIndex,
      selectedImage,
      ratios.current,
    );

    const reveal = thumbnailReveal.current;

    if (!reveal.started && handoff.current.value > 0.15) {
      reveal.started = true;
    }

    if (reveal.started) {
      reveal.elapsed += Math.min(delta, 0.05);
    }

    const isThumbnail = imageIndex > 0;

    const delay = isThumbnail ? (imageIndex - 1) * THUMB_STAGGER : 0;

    const revealProgress = isThumbnail
      ? THREE.MathUtils.clamp(
          (reveal.elapsed - delay) / THUMB_FADE_DURATION,
          0,
          1,
        )
      : 1;

    const eased =
      revealProgress *
      revealProgress *
      revealProgress *
      (revealProgress * (revealProgress * 6 - 15) + 10);

    const targetX = target.x - size.width / 2;

    const targetY =
      size.height / 2 -
      target.y -
      (isThumbnail ? (1 - eased) * THUMB_OFFSET_Y : 0);
    // Detect when an image changes position.
    if (previousSelected.current !== selectedImage) {
      const node = mesh.current;

      if (node) {
        const dx = targetX - node.position.x;
        const dy = targetY - node.position.y;
        const distance = Math.hypot(dx, dy);

        bend.current.elapsed = 0;

        // Smaller movements get a smaller bend.
        bend.current.strength = Math.min(1, distance / 180);

        if (distance > 0.001) {
          bend.current.directionX = dx / distance;
          bend.current.directionY = dy / distance;
        }
      }

      previousSelected.current = selectedImage;
    }

    if (!initialized.current) {
      node.position.set(targetX, targetY, 0);
      node.scale.set(target.width, target.height, 1);
      initialized.current = true;
    } else {
      const dt = Math.min(delta, 0.05);

      node.position.x = THREE.MathUtils.damp(
        node.position.x,
        targetX,
        MOVE_SPEED,
        dt,
      );

      node.position.y = THREE.MathUtils.damp(
        node.position.y,
        targetY,
        MOVE_SPEED,
        dt,
      );

      node.scale.x = THREE.MathUtils.damp(
        node.scale.x,
        target.width,
        MOVE_SPEED,
        dt,
      );

      node.scale.y = THREE.MathUtils.damp(
        node.scale.y,
        target.height,
        MOVE_SPEED,
        dt,
      );
    }
    // ELASTIC DIRECTIONAL BEND

    const b = bend.current;

    if (b.elapsed < BEND_DURATION) {
      b.elapsed = Math.min(BEND_DURATION, b.elapsed + Math.min(delta, 0.05));
    }

    const progress = b.elapsed / BEND_DURATION;

    // Bend appears during movement and disappears at rest.
    const envelope = Math.sin(Math.PI * progress) * b.strength;

    if (envelope > 0.0001 || b.dirty) {
      const directionX = b.directionX;
      const directionY = b.directionY;

      for (let i = 0; i < positions.count; i++) {
        const baseX = originalPositions[i * 3];
        const baseY = originalPositions[i * 3 + 1];

        // Rotate the deformation into the movement direction.
        const along = baseX * directionX + baseY * directionY;

        const across = -baseX * directionY + baseY * directionX;

        // Curved profile across the moving image.
        const edge = Math.min(1, Math.abs(across) * 1.8);

        const curve = Math.pow(Math.max(0, 1 - edge * edge), 1.5);

        // Centre of the image lags behind the movement.
        const drag = BEND_STRENGTH * envelope * curve;

        // Very subtle elastic stretch.
        const stretchedAlong = along * (1 + BEND_STRETCH * envelope) + drag;
        const stretchedAcross = across * (1 - 0.008 * envelope);

        // Rotate the deformed vertices back.
        const finalX =
          stretchedAlong * directionX - stretchedAcross * directionY;

        const finalY =
          stretchedAlong * directionY + stretchedAcross * directionX;

        positions.setXYZ(i, finalX, finalY, 0);
      }

      positions.needsUpdate = true;
      b.dirty = envelope > 0.0001;
    }

    node.renderOrder = imageIndex === selectedImage ? 100 : 10 + imageIndex;

    const material = node.material as THREE.MeshBasicMaterial;

    material.opacity = handoff.current.value * eased;
    // Start thumbnail-reveal when the gallery starts appearing.

    if (handoff.current.value > 0.01) {
      reveal.started = true;
    }

    if (reveal.started) {
      reveal.elapsed += delta;
    }

    // The first image is the main image.
    // Images 1–4 reveal one after another.
    if (imageIndex === 0) {
      material.opacity = handoff.current.value;
    } else {
      const delay = (imageIndex - 1) * THUMB_STAGGER;

      const progress = THREE.MathUtils.clamp(
        (reveal.elapsed - delay) / THUMB_FADE_DURATION,
        0,
        1,
      );

      // Smooth ease-in-out
      const eased = progress * progress * (3 - 2 * progress);

      material.opacity = handoff.current.value * eased;
    }

    hitRects.current.set(imageIndex, {
      x: node.position.x + size.width / 2,
      y: size.height / 2 - node.position.y,
      width: node.scale.x,
      height: node.scale.y,
    });

    if (imageIndex === 0 && !readySent.current && ++frames.current >= 3) {
      readySent.current = true;
      onFirstFrame();
    }
  });

  return (
    <mesh ref={mesh} geometry={geometry} raycast={() => {}}>
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

export default function GalleryThreeImages({
  projects,
  index,
  firstTarget,
  handoff,
  interactive,
  scrollControl,
  onReady,
  hitTestRef,
}: Props) {
  const sources = useMemo(
    () => projects[index]?.images.slice(0, 5) ?? [],
    [projects, index],
  );

  const [activeImage, setActiveImage] = useState(0);
  const activeRef = useRef(0);

  const ratios = useRef<number[]>(sources.map(() => 1));

  const hitRects = useRef(new Map<number, ImageRect>());
  const ready = useRef(false);

  const returnTween = useRef<gsap.core.Tween | null>(null);

  const pointerDown = useRef<{
    id: number;
    x: number;
    y: number;
  } | null>(null);

  const [firstAspect, setFirstAspect] = useState(1);

  const [size, setSize] = useState<ScreenSize>({
    width: 1280,
    height: 800,
  });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();

    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const selectImage = useCallback(
    (next: number) => {
      if (next < 0 || next >= sources.length || next === activeRef.current) {
        return;
      }

      activeRef.current = next;
      setActiveImage(next);
    },
    [sources.length],
  );

  const onImageLoaded = useCallback((i: number, aspect: number) => {
    ratios.current[i] = aspect;

    if (i === 0) {
      setFirstAspect(aspect);
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

        if (activeRef.current === 0) {
          done();
          return;
        }

        selectImage(0);

        returnTween.current = gsap.delayedCall(0.75, done);
      },
    };

    return () => {
      returnTween.current?.kill();
      scrollControl.current = null;
    };
  }, [scrollControl, selectImage]);

  useEffect(() => {
    hitTestRef.current = (x, y) =>
      interactive &&
      Array.from(hitRects.current.values()).some((rect) =>
        contains(rect, x, y),
      );

    return () => {
      hitTestRef.current = null;
    };
  }, [hitTestRef, interactive]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!interactive || !e.isPrimary || e.button !== 0) {
        return;
      }

      pointerDown.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      };
    };

    const onPointerUp = (e: PointerEvent) => {
      const start = pointerDown.current;
      pointerDown.current = null;

      if (
        !interactive ||
        !ready.current ||
        !start ||
        start.id !== e.pointerId ||
        Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8
      ) {
        return;
      }

      if (
        e.target instanceof Element &&
        e.target.closest("a,button,input,textarea,select,[role='button']")
      ) {
        return;
      }

      const clickedImages = Array.from(hitRects.current.entries())
        .filter(([, rect]) => contains(rect, e.clientX, e.clientY))
        .map(([imageIndex]) => imageIndex);

      const clicked = clickedImages.includes(activeRef.current)
        ? activeRef.current
        : clickedImages[0];

      if (clicked === undefined) return;

      selectImage(
        clicked === activeRef.current
          ? (activeRef.current + 1) % sources.length
          : clicked,
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!interactive || e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }

      if (
        e.target instanceof Element &&
        e.target.closest(
          "a,button,input,textarea,select,[contenteditable='true']",
        )
      ) {
        return;
      }

      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") {
        return;
      }

      e.preventDefault();

      const direction = e.key === "ArrowRight" ? 1 : -1;

      const next =
        (activeRef.current + direction + sources.length) % sources.length;

      selectImage(next);
    };

    window.addEventListener("pointerdown", onPointerDown, true);

    window.addEventListener("pointerup", onPointerUp, true);

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);

      window.removeEventListener("pointerup", onPointerUp, true);

      window.removeEventListener("keydown", onKeyDown);
    };
  }, [interactive, selectImage, sources.length]);

  useEffect(() => {
    if (!interactive || sources.length < 2) return;

    let accumulated = 0;
    let lastWheelTime = 0;
    let lastSwitchTime = -Infinity;
    let lastDirection = 0;

    const SCROLL_THRESHOLD = 45;
    const SWITCH_COOLDOWN = 400;
    const SCROLL_RESET = 250;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const now = performance.now();

      const factor =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;

      const delta = e.deltaY * factor;

      if (Math.abs(delta) < 0.5) return;

      const direction = Math.sign(delta);

      // Reset accumulation when scrolling stops
      // or when direction changes.
      if (now - lastWheelTime > SCROLL_RESET || direction !== lastDirection) {
        accumulated = 0;
      }

      lastWheelTime = now;
      lastDirection = direction;

      // Prevent switching images too quickly.
      if (now - lastSwitchTime < SWITCH_COOLDOWN) {
        accumulated = 0;
        return;
      }

      accumulated += THREE.MathUtils.clamp(delta, -120, 120);

      if (Math.abs(accumulated) < SCROLL_THRESHOLD) {
        return;
      }

      accumulated = 0;
      lastSwitchTime = now;

      const next =
        (activeRef.current + direction + sources.length) % sources.length;

      selectImage(next);
    };

    window.addEventListener("wheel", onWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", onWheel, true);
    };
  }, [interactive, selectImage, sources.length]);

  const firstRect = getRect(size, firstAspect, 0, 0, ratios.current);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[82]"
      aria-hidden="true"
    >
      <div
        ref={firstTarget}
        className="pointer-events-none absolute"
        style={{
          left: firstRect.x - firstRect.width / 2,
          top: firstRect.y - firstRect.height / 2,
          width: firstRect.width,
          height: firstRect.height,
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
        <Suspense fallback={null}>
          {sources.map((src, i) => (
            <GalleryPlane
              key={`${i}-${src}`}
              src={src}
              imageIndex={i}
              selectedImage={activeImage}
              handoff={handoff}
              ratios={ratios}
              onFirstFrame={onFirstFrame}
              onImageLoaded={onImageLoaded}
              hitRects={hitRects}
            />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}
