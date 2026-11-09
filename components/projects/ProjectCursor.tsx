"use client";

import gsap from "gsap";
import { useEffect, useRef, useState, type MutableRefObject } from "react";

type CursorMode = "close-project" | "website" | "focus" | "close-focus";

type Props = {
  focused: boolean;
  disabled: boolean;
  websiteUrl: string;
  isOverImage: MutableRefObject<((x: number, y: number) => boolean) | null>;
  onCloseProject: () => void;
  onCloseFocus: () => void;
};

const FOLLOW_SPEED = 10;
const MAX_TILT_DEG = 2.5;
const MAX_EXTRA_SPACING_EM = 0.35;
const SPREAD_AT_SPEED = 15;
const KINETIC_DAMPING = 11;
const BASE_SPACING_EM = 0.11;

const LABELS: Record<CursorMode, string> = {
  "close-project": "RETURN",
  website: "VIEW WEBSITE",
  focus: "INSPECT",
  "close-focus": "CLOSE",
};

export default function ProjectCursor({
  focused,
  disabled,
  websiteUrl,
  isOverImage,
  onCloseProject,
  onCloseFocus,
}: Props) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const kineticRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [mode, setMode] = useState<CursorMode>("focus");

  const refreshRef = useRef<(() => void) | null>(null);

  const latest = useRef({
    focused,
    disabled,
    websiteUrl,
    isOverImage,
    onCloseProject,
    onCloseFocus,
  });

  latest.current = {
    focused,
    disabled,
    websiteUrl,
    isOverImage,
    onCloseProject,
    onCloseFocus,
  };

  useEffect(() => {
    refreshRef.current?.();
  }, [focused, disabled]);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;

    gsap.fromTo(
      text,
      {
        y: 7,
        autoAlpha: 0,
      },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.42,
        ease: "expo.out",
        overwrite: true,
      },
    );

    return () => {
      gsap.killTweensOf(text);
    };
  }, [mode]);

  useEffect(() => {
    const cursor = cursorRef.current;
    const kinetic = kineticRef.current;
    const press = pressRef.current;
    const text = textRef.current;

    if (!cursor || !kinetic || !press || !text) return;

    const media = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (!media.matches) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const html = document.documentElement;

    html.classList.add("portfolio-cursor-active");

    const normalizedUrl = new URL(
      latest.current.websiteUrl,
      window.location.href,
    ).href;

    const websiteLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a[href]"),
    ).filter((anchor) => anchor.href === normalizedUrl);

    websiteLinks.forEach((anchor) => {
      anchor.classList.add("portfolio-cursor-native-website");
    });

    gsap.set(cursor, { autoAlpha: 0 });

    let initialized = false;
    let visible = false;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let tilt = 0;
    let spacing = 0;
    let animationFrame = 0;
    let previousFrameTime = 0;

    let currentMode: CursorMode | null = null;

    let downPosition: {
      id: number;
      x: number;
      y: number;
    } | null = null;

    const findMode = (x: number, y: number): CursorMode => {
      if (latest.current.focused) {
        return "close-focus";
      }

      const belowLiveDivider =
        window.innerWidth >= 768 &&
        x < window.innerWidth * 0.26 &&
        y >= window.innerHeight * 0.8;

      const element = document.elementFromPoint(x, y);
      if (
        latest.current.websiteUrl.trim() &&
        (belowLiveDivider || element?.closest("[data-project-live-link]"))
      ) {
        return "website";
      }

      if (latest.current.isOverImage.current?.(x, y)) {
        return "focus";
      }

      return "close-project";
    };

    const updateMode = (x: number, y: number) => {
      const next = findMode(x, y);

      if (next === currentMode) return;

      currentMode = next;
      setMode(next);
    };

    const positionCursor = (x: number, y: number) => {
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const animateCursor = (time: number) => {
      animationFrame = 0;

      const delta = previousFrameTime
        ? Math.max(1, Math.min(50, time - previousFrameTime))
        : 1000 / 60;
      previousFrameTime = time;
      const seconds = delta / 1000;

      const follow = reducedMotion ? 1 : 1 - Math.exp(-FOLLOW_SPEED * seconds);

      const lastX = currentX;
      const lastY = currentY;
      currentX += (targetX - currentX) * follow;
      currentY += (targetY - currentY) * follow;

      const motionX = ((currentX - lastX) * (1 / 60)) / seconds;
      const motionY = ((currentY - lastY) * (1 / 60)) / seconds;
      const speed = Math.hypot(motionX, motionY);
      const strength = reducedMotion ? 0 : Math.min(speed / SPREAD_AT_SPEED, 1);

      const desiredTilt = reducedMotion
        ? 0
        : Math.max(
            -MAX_TILT_DEG,
            Math.min(MAX_TILT_DEG, motionX * 0.22 + motionY * 0.04),
          );
      const desiredSpacing = MAX_EXTRA_SPACING_EM * strength;

      const damping = reducedMotion
        ? 1
        : 1 - Math.exp(-KINETIC_DAMPING * seconds);

      tilt += (desiredTilt - tilt) * damping;
      spacing += (desiredSpacing - spacing) * damping;

      const positionSettled =
        Math.abs(targetX - currentX) < 0.1 &&
        Math.abs(targetY - currentY) < 0.1;
      const kineticSettled =
        Math.abs(tilt) < 0.015 && Math.abs(spacing) < 0.0003;

      if (positionSettled) {
        currentX = targetX;
        currentY = targetY;
      }
      if (kineticSettled && speed < 0.05) {
        tilt = 0;
        spacing = 0;
      }

      positionCursor(currentX, currentY);
      kinetic.style.transform = `rotate(${tilt}deg)`;
      text.style.letterSpacing = `${BASE_SPACING_EM + spacing}em`;

      if (!positionSettled || !kineticSettled) {
        animationFrame = window.requestAnimationFrame(animateCursor);
      } else {
        previousFrameTime = 0;
      }
    };

    const show = () => {
      if (visible || !initialized || latest.current.disabled) {
        return;
      }

      visible = true;

      gsap.to(cursor, {
        autoAlpha: 1,
        duration: reducedMotion ? 0 : 0.3,
        ease: "power2.out",
        overwrite: true,
      });
    };

    const hide = () => {
      if (!visible) return;

      visible = false;

      gsap.to(cursor, {
        autoAlpha: 0,
        duration: reducedMotion ? 0 : 0.2,
        ease: "power2.out",
        overwrite: true,
      });
    };

    const updatePosition = (x: number, y: number) => {
      targetX = x;
      targetY = y;

      if (!initialized) {
        currentX = x;
        currentY = y;
        positionCursor(x, y);
        initialized = true;
      }

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(animateCursor);
      }

      updateMode(x, y);
      show();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!e.isPrimary || e.pointerType === "touch") {
        return;
      }

      updatePosition(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary || e.pointerType === "touch" || e.button !== 0) {
        return;
      }

      updatePosition(e.clientX, e.clientY);

      downPosition = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      };

      gsap.to(press, {
        scale: 0.82,
        duration: reducedMotion ? 0 : 0.14,
        ease: "power2.out",
        overwrite: true,
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!e.isPrimary || e.pointerType === "touch" || e.button !== 0) {
        return;
      }

      gsap.to(press, {
        scale: 1,
        duration: reducedMotion ? 0 : 0.33,
        ease: "expo.out",
        overwrite: true,
      });

      const start = downPosition;
      downPosition = null;

      if (!start || start.id !== e.pointerId || latest.current.disabled) {
        return;
      }

      const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y);

      if (distance > 8) return;

      if (
        e.target instanceof Element &&
        e.target.closest("a,button,input,textarea,select,[role='button']")
      ) {
        return;
      }

      const action = findMode(e.clientX, e.clientY);

      switch (action) {
        case "close-project":
          latest.current.onCloseProject();
          break;

        case "website":
          if (latest.current.websiteUrl.trim()) {
            window.open(
              latest.current.websiteUrl,
              "_blank",
              "noopener,noreferrer",
            );
          }
          break;

        case "close-focus":
          latest.current.onCloseFocus();
          break;

        case "focus":
          break;
      }
    };

    const onCancel = () => {
      downPosition = null;

      gsap.to(press, {
        scale: 1,
        duration: reducedMotion ? 0 : 0.2,
        overwrite: true,
      });
    };

    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
    };

    refreshRef.current = () => {
      if (!initialized) return;

      updateMode(targetX, targetY);

      if (latest.current.disabled) {
        hide();
      } else {
        show();
      }
    };

    window.addEventListener("pointermove", onPointerMove, true);

    window.addEventListener("mousemove", onMouseMove, true);

    window.addEventListener("pointerdown", onPointerDown, true);

    window.addEventListener("pointerup", onPointerUp, true);

    window.addEventListener("pointercancel", onCancel, true);

    document.addEventListener("mouseout", onMouseOut, true);

    window.addEventListener("blur", hide);

    return () => {
      refreshRef.current = null;
      window.cancelAnimationFrame(animationFrame);

      window.removeEventListener("pointermove", onPointerMove, true);

      window.removeEventListener("mousemove", onMouseMove, true);

      window.removeEventListener("pointerdown", onPointerDown, true);

      window.removeEventListener("pointerup", onPointerUp, true);

      window.removeEventListener("pointercancel", onCancel, true);

      document.removeEventListener("mouseout", onMouseOut, true);

      window.removeEventListener("blur", hide);

      gsap.killTweensOf(cursor);
      gsap.killTweensOf(press);

      websiteLinks.forEach((anchor) => {
        anchor.classList.remove("portfolio-cursor-native-website");
      });

      html.classList.remove("portfolio-cursor-active");
    };
  }, []);

  return (
    <>
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          html.portfolio-cursor-active,
          html.portfolio-cursor-active * {
            cursor: none !important;
          }

          html.portfolio-cursor-active
          [data-project-native-close]:focus-visible,
          html.portfolio-cursor-active
          [data-project-live-link]:focus-visible {
            outline: 1px solid #ece9e4;
            outline-offset: 5px;
          }
        }
      `}</style>

      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-difference opacity-0"
        style={{
          transform: "translate3d(-200px,-200px,0)",
          willChange: "transform, opacity",
        }}
      >
        <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
          <div ref={kineticRef} className="origin-center will-change-transform">
            <div ref={pressRef} className="origin-center will-change-transform">
              <span
                ref={textRef}
                className="block whitespace-nowrap font-sans text-[14px] font-semibold uppercase leading-none tracking-[0.11em] text-white will-change-transform"
              >
                {LABELS[mode]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
