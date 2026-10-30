"use client";

import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type MouseEvent as ReactMouseEvent,
} from "react";
import * as THREE from "three";
import { PROJECTS } from "@/lib/projects";
import {
  GALLERY_WIDTH,
  GALLERY_GAP,
  SMOOTH_SCROLL_SPEED,
  WHEEL_MULTIPLIER,
  type GalleryItemMap,
  type ScrollControl,
} from "./projectShared";

export default function InfiniteGallery({
  projectIndex,
  scrollRoot,
  firstTarget,
  galleryItems,
  galleryReady,
  onReady,
  webglReady,
  scrollControl,
  returning,
  focus,
  isGalleryFocused,
  onFocusImage,
  onUnfocusImage,
}: {
  projectIndex: number;
  scrollRoot: MutableRefObject<HTMLDivElement | null>;
  firstTarget: MutableRefObject<HTMLDivElement | null>;
  galleryItems: GalleryItemMap;
  galleryReady: boolean;
  onReady: () => void;
  webglReady: boolean;
  scrollControl: MutableRefObject<ScrollControl | null>;
  returning: boolean;
  focus: MutableRefObject<{
    key: string | null;
    value: number;
  }>;
  isGalleryFocused: boolean;
  onFocusImage: (key: string) => void;
  onUnfocusImage: () => void;
}) {
  const project = PROJECTS[projectIndex];
  const middle = useRef<HTMLDivElement>(null);

  const [ratios, setRatios] = useState<Record<string, number>>({});

  const [viewport, setViewport] = useState({
    width: 1280,
    height: 800,
  });

  const scrollState = useRef({
    current: 0,
    target: 0,
    touching: false,
    animating: false,
  });

  const width = viewport.width * (viewport.width < 768 ? 0.86 : GALLERY_WIDTH);

  useLayoutEffect(() => {
    const measure = () =>
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });

    measure();

    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, []);

  const rememberRatio = useCallback((src: string, img: HTMLImageElement) => {
    if (!img.naturalWidth || !img.naturalHeight) return;

    const ratio = img.naturalWidth / img.naturalHeight;

    setRatios((old) =>
      Math.abs((old[src] ?? 0) - ratio) < 0.001
        ? old
        : { ...old, [src]: ratio },
    );
  }, []);

  // Only reads image dimensions. No HTML image is rendered.
  useEffect(() => {
    let active = true;

    const images = project.images.map((src) => {
      const image = new Image();

      image.onload = () => {
        if (active) rememberRatio(src, image);
      };

      image.src = src;

      if (image.complete && image.naturalWidth) {
        rememberRatio(src, image);
      }

      return image;
    });

    return () => {
      active = false;

      images.forEach((image) => {
        image.onload = null;
      });
    };
  }, [project.images, rememberRatio]);

  const centeredStart = useCallback(() => {
    const el = scrollRoot.current;
    const first = firstTarget.current;

    if (!el || !first) {
      return middle.current?.offsetTop ?? 0;
    }

    const sr = el.getBoundingClientRect();
    const fr = first.getBoundingClientRect();

    return el.scrollTop + fr.top - sr.top + fr.height / 2 - el.clientHeight / 2;
  }, [scrollRoot, firstTarget]);

  useLayoutEffect(() => {
    const el = scrollRoot.current;
    if (!el) return;

    el.scrollTop = centeredStart();
    onReady();
  }, [projectIndex, centeredStart, onReady]);

  useLayoutEffect(() => {
    if (galleryReady || returning) return;

    if (scrollRoot.current) {
      scrollRoot.current.scrollTop = centeredStart();
    }
  }, [ratios, galleryReady, returning, centeredStart, scrollRoot]);

  useEffect(() => {
    const el = scrollRoot.current;
    const cycle = middle.current;

    if (!el || !cycle || !galleryReady) return;

    const values = scrollState.current;

    values.current = el.scrollTop;
    values.target = el.scrollTop;

    let raf = 0;
    let last = performance.now();
    let lockUntil = 0;
    let returnTween: gsap.core.Tween | null = null;

    scrollControl.current = {
      returnToFirst(done) {
        returnTween?.kill();

        const height = cycle.offsetHeight;
        const start = centeredStart();

        if (!height) {
          done();
          return;
        }

        const destination = el.scrollTop >= start ? start : start - height;

        const distance = Math.abs(el.scrollTop - destination);

        const complete = () => {
          values.current = start;
          values.target = start;
          values.animating = false;
          el.scrollTop = start;
          done();
        };

        if (distance < 2) {
          complete();
          return;
        }

        values.animating = true;

        const pos = {
          value: el.scrollTop,
        };

        returnTween = gsap.to(pos, {
          value: destination,

          duration: THREE.MathUtils.clamp(
            distance / (window.innerHeight * 1.35),
            0.8,
            1.8,
          ),

          ease: "power3.inOut",

          onUpdate: () => {
            values.current = pos.value;
            values.target = pos.value;
            el.scrollTop = pos.value;
          },

          onComplete: complete,
        });
      },
    };

    const wrap = () => {
      const height = cycle.offsetHeight;
      const start = centeredStart();

      if (!height) return;

      if (values.current < start) {
        values.current += height;
        values.target += height;
      } else if (values.current >= start + height) {
        values.current -= height;
        values.target -= height;
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;

      if (focus.current.key) {
        values.current = el.scrollTop;
        values.target = el.scrollTop;
      } else if (now >= lockUntil && !values.touching && !values.animating) {
        values.current +=
          (values.target - values.current) *
          (1 - Math.exp(-SMOOTH_SCROLL_SPEED * dt));

        if (Math.abs(values.target - values.current) < 0.08) {
          values.current = values.target;
        }

        wrap();
        el.scrollTop = values.current;
      }

      raf = requestAnimationFrame(tick);
    };

    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      if (values.animating || focus.current.key) {
        return;
      }

      const factor =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;

      values.target +=
        THREE.MathUtils.clamp(e.deltaY * factor, -230, 230) * WHEEL_MULTIPLIER;

      lockUntil = 0;
    };

    const touchStart = () => {
      if (focus.current.key) return;

      values.touching = true;
      values.current = el.scrollTop;
      values.target = el.scrollTop;
    };

    const touchEnd = () => {
      if (focus.current.key) return;

      values.touching = false;
      lockUntil = performance.now() + 650;
    };

    const nativeScroll = () => {
      if (focus.current.key) return;

      if (values.touching || performance.now() < lockUntil) {
        values.current = el.scrollTop;
        values.target = el.scrollTop;

        wrap();

        if (Math.abs(el.scrollTop - values.current) > 1) {
          el.scrollTop = values.current;
        }
      }
    };

    const key = (e: KeyboardEvent) => {
      if (e.target !== el || focus.current.key) {
        return;
      }

      const step =
        e.key === "ArrowDown"
          ? 110
          : e.key === "ArrowUp"
            ? -110
            : e.key === "PageDown"
              ? el.clientHeight * 0.8
              : e.key === "PageUp"
                ? -el.clientHeight * 0.8
                : e.key === " "
                  ? (e.shiftKey ? -1 : 1) * el.clientHeight * 0.85
                  : 0;

      if (step) {
        e.preventDefault();

        if (!values.animating) {
          values.target += step;
        }
      }
    };

    raf = requestAnimationFrame(tick);

    window.addEventListener("wheel", wheel, {
      capture: true,
      passive: false,
    });

    el.addEventListener("touchstart", touchStart, {
      passive: true,
    });

    el.addEventListener("touchend", touchEnd, {
      passive: true,
    });

    el.addEventListener("touchcancel", touchEnd, {
      passive: true,
    });

    el.addEventListener("scroll", nativeScroll, {
      passive: true,
    });

    el.addEventListener("keydown", key);

    return () => {
      cancelAnimationFrame(raf);
      returnTween?.kill();
      scrollControl.current = null;

      window.removeEventListener("wheel", wheel, true);
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchend", touchEnd);
      el.removeEventListener("touchcancel", touchEnd);
      el.removeEventListener("scroll", nativeScroll);
      el.removeEventListener("keydown", key);
    };
  }, [galleryReady, scrollRoot, scrollControl, centeredStart, focus]);

  const clickGallery = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (returning || !galleryReady) return;

      const x = e.clientX;
      const y = e.clientY;
      const currentKey = focus.current.key;

      if (currentKey) {
        const element = galleryItems.current.get(currentKey);
        if (!element) return;

        const from = element.getBoundingClientRect();
        const imageIndex = Number(currentKey.split("-")[1]);
        const src = project.images[imageIndex];
        const ratio = ratios[src] ?? 0.8;

        const targetWidth = Math.min(
          viewport.width * (viewport.width < 768 ? 0.88 : 0.68),
          viewport.height * 0.84 * ratio,
        );

        const targetHeight = targetWidth / ratio;
        const targetLeft = (viewport.width - targetWidth) / 2;
        const targetTop = (viewport.height - targetHeight) / 2;

        const t = THREE.MathUtils.clamp(focus.current.value, 0, 1);

        const left = THREE.MathUtils.lerp(from.left, targetLeft, t);

        const top = THREE.MathUtils.lerp(from.top, targetTop, t);

        const currentWidth = THREE.MathUtils.lerp(from.width, targetWidth, t);

        const currentHeight = THREE.MathUtils.lerp(
          from.height,
          targetHeight,
          t,
        );

        const clickedOutside =
          x < left ||
          x > left + currentWidth ||
          y < top ||
          y > top + currentHeight;

        if (clickedOutside) {
          onUnfocusImage();
        }

        return;
      }

      if (!webglReady) return;

      for (const [key, element] of galleryItems.current) {
        const rect = element.getBoundingClientRect();

        const isVisible =
          rect.width > 1 &&
          rect.height > 1 &&
          rect.bottom >= 0 &&
          rect.top <= viewport.height;

        const isInside =
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom;

        if (isVisible && isInside) {
          onFocusImage(key);
          return;
        }
      }
    },
    [
      returning,
      galleryReady,
      webglReady,
      focus,
      galleryItems,
      project.images,
      ratios,
      viewport.width,
      viewport.height,
      onFocusImage,
      onUnfocusImage,
    ],
  );

  return (
    <div
      ref={scrollRoot}
      onClick={clickGallery}
      data-project-gallery
      tabIndex={0}
      role="region"
      aria-label={`${project.title} gallery`}
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
      className={`pointer-events-auto fixed inset-0 z-[65] overflow-x-hidden overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        returning || isGalleryFocused
          ? "touch-none cursor-zoom-out"
          : "touch-pan-y"
      }`}
      style={{
        WebkitOverflowScrolling: "touch",
        overflowAnchor: "none",
        overflowY: isGalleryFocused ? "hidden" : "auto",
      }}
    >
      {[0, 1, 2].map((cycleIndex) => (
        <div
          key={`${project.slug}-${cycleIndex}`}
          ref={cycleIndex === 1 ? middle : undefined}
          className="flex flex-col items-end pr-[2.5vw] pt-[1svh] max-md:pr-[7vw]"
          style={{ gap: GALLERY_GAP }}
        >
          {project.images.map((src, imageIndex) => {
            const firstMiddle = cycleIndex === 1 && imageIndex === 0;

            const ratio = ratios[src] ?? 0.8;

            return (
              <div
                key={`${cycleIndex}-${imageIndex}`}
                ref={firstMiddle ? firstTarget : undefined}
                className="relative shrink-0"
                style={{
                  width: `${width}px`,
                  aspectRatio: String(ratio),
                }}
              >
                <div
                  ref={(node) => {
                    const key = `${cycleIndex}-${imageIndex}`;

                    if (node) {
                      galleryItems.current.set(key, node);
                    } else {
                      galleryItems.current.delete(key);
                    }
                  }}
                  aria-hidden="true"
                  className={`relative block h-full w-full ${
                    isGalleryFocused ? "" : "cursor-zoom-in"
                  }`}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
