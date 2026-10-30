"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

type CursorMode = "close-project" | "website" | "focus" | "close-focus";

type Props = {
  focused: boolean;
  disabled: boolean;
  websiteUrl: string;
  onCloseProject: () => void;
  onCloseFocus: () => void;
};

const LABELS: Record<CursorMode, string> = {
  "close-project": "CLOSE",
  website: "VIEW WEBSITE",
  focus: "FOCUS",
  "close-focus": "CLOSE",
};

export default function ProjectCursor({
  focused,
  disabled,
  websiteUrl,
  onCloseProject,
  onCloseFocus,
}: Props) {
  const dotRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [mode, setMode] = useState<CursorMode>("focus");

  const refreshRef = useRef<(() => void) | null>(null);

  const latest = useRef({
    focused,
    disabled,
    websiteUrl,
    onCloseProject,
    onCloseFocus,
  });

  latest.current = {
    focused,
    disabled,
    websiteUrl,
    onCloseProject,
    onCloseFocus,
  };

  useEffect(() => {
    refreshRef.current?.();
  }, [focused, disabled]);

  /* SMOOTH TEXT CHANGE */

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
    const dot = dotRef.current;
    const follower = followerRef.current;

    if (!dot || !follower) return;

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

    gsap.set([dot, follower], {
      autoAlpha: 0,
    });

    let initialized = false;
    let visible = false;

    let targetX = 0;
    let targetY = 0;

    let currentX = 0;
    let currentY = 0;

    let frame = 0;

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

      const darkRight =
        window.innerWidth < 768 ? window.innerWidth : window.innerWidth * 0.365;

      const dividerY =
        window.innerHeight * (window.innerWidth < 768 ? 0.82 : 0.79);

      if (x < darkRight) {
        if (y >= dividerY && latest.current.websiteUrl.trim()) {
          return "website";
        }

        return "close-project";
      }

      return "focus";
    };

    const updateMode = (x: number, y: number) => {
      const next = findMode(x, y);

      if (next === currentMode) return;

      currentMode = next;
      setMode(next);
    };

    const positionDot = (x: number, y: number) => {
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const animate = () => {
      const ease = reducedMotion ? 1 : 0.19;

      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;

      if (Math.abs(targetX - currentX) < 0.05) {
        currentX = targetX;
      }

      if (Math.abs(targetY - currentY) < 0.05) {
        currentY = targetY;
      }

      follower.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

      frame = window.requestAnimationFrame(animate);
    };

    const show = () => {
      if (visible || !initialized || latest.current.disabled) {
        return;
      }

      visible = true;

      gsap.to([dot, follower], {
        autoAlpha: 1,
        duration: reducedMotion ? 0 : 0.3,
        ease: "power2.out",
        overwrite: true,
      });
    };

    const hide = () => {
      if (!visible) return;

      visible = false;

      gsap.to([dot, follower], {
        autoAlpha: 0,
        duration: reducedMotion ? 0 : 0.2,
        ease: "power2.out",
        overwrite: true,
      });
    };

    const updatePosition = (x: number, y: number) => {
      targetX = x;
      targetY = y;

      positionDot(x, y);

      if (!initialized) {
        initialized = true;

        currentX = x;
        currentY = y;

        follower.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        frame = window.requestAnimationFrame(animate);
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

      gsap.to(dot.firstElementChild, {
        scale: 1.8,
        duration: 0.18,
        ease: "power2.out",
        overwrite: true,
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!e.isPrimary || e.pointerType === "touch" || e.button !== 0) {
        return;
      }

      gsap.to(dot.firstElementChild, {
        scale: 1,
        duration: 0.35,
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
          // GalleryThreeImages handles image focus.
          break;
      }
    };

    const onCancel = () => {
      downPosition = null;

      gsap.to(dot.firstElementChild, {
        scale: 1,
        duration: 0.2,
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

      window.cancelAnimationFrame(frame);

      window.removeEventListener("pointermove", onPointerMove, true);

      window.removeEventListener("mousemove", onMouseMove, true);

      window.removeEventListener("pointerdown", onPointerDown, true);

      window.removeEventListener("pointerup", onPointerUp, true);

      window.removeEventListener("pointercancel", onCancel, true);

      document.removeEventListener("mouseout", onMouseOut, true);

      window.removeEventListener("blur", hide);

      gsap.killTweensOf(dot);
      gsap.killTweensOf(follower);
      gsap.killTweensOf(dot.firstElementChild);

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
          [data-project-native-close],
          html.portfolio-cursor-active
          .portfolio-cursor-native-website {
            opacity: 0 !important;
            pointer-events: none !important;
          }

          html.portfolio-cursor-active
          [data-project-native-close]:focus-visible,
          html.portfolio-cursor-active
          .portfolio-cursor-native-website:focus-visible {
            opacity: 1 !important;
            pointer-events: auto !important;
            outline: 1px solid #ece9e4;
            outline-offset: 6px;
          }
        }
      `}</style>

      <div
        ref={dotRef}
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          left-0
          top-0
          z-[9999]
          mix-blend-difference
          opacity-0
        "
        style={{
          transform: "translate3d(-200px,-200px,0)",
        }}
      >
        <div
          className="
            absolute
            left-0
            top-0
            h-[5px]
            w-[5px]
            -translate-x-1/2
            -translate-y-1/2
            bg-white
          "
        />
      </div>

      <div
        ref={followerRef}
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          left-0
          top-0
          z-[9999]
          mix-blend-difference
          opacity-0
        "
        style={{
          transform: "translate3d(-200px,-200px,0)",
        }}
      >
        <div
          className="
            absolute
            left-[18px]
            top-[12px]
            whitespace-nowrap
          "
        >
          <span
            ref={textRef}
            className="
              block
              font-sans
              text-[12px]
              font-semibold
              uppercase
              leading-none
              tracking-[0.11em]
              text-white
              will-change-transform
            "
          >
            {LABELS[mode]}
          </span>
        </div>
      </div>
    </>
  );
}
