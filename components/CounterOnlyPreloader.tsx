"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const MIN_DISPLAY = 1100;
const EXIT_DURATION = 0.55;

export default function CounterOnlyPreloader({ children }: Props) {
  const [finished, setFinished] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const html = document.documentElement;

    const updateTheme = () => {
      const stored = localStorage.getItem("theme");

      const next =
        stored === "dark" || html.dataset.theme === "dark" ? "dark" : "light";

      setTheme(next);
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const content = contentRef.current;
    const overlay = overlayRef.current;
    const counter = counterRef.current;

    if (!content || !overlay || !counter) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    let cancelled = false;
    let minimumTimer = 0;
    let safetyTimer = 0;

    const progress = { value: 1 };

    const renderProgress = () => {
      counter.textContent = `${Math.round(progress.value)}%`;
    };

    renderProgress();

    // Count toward 95 while resources load.
    gsap.to(progress, {
      value: 95,
      duration: reducedMotion ? 0 : 1.1,
      ease: "power2.out",
      onUpdate: renderProgress,
    });

    const minimum = new Promise<void>((resolve) => {
      minimumTimer = window.setTimeout(resolve, MIN_DISPLAY);
    });

    const fontsReady = document.fonts
      ? Promise.race([
          document.fonts.ready.then(() => {}),
          new Promise<void>((resolve) => {
            safetyTimer = window.setTimeout(resolve, 3000);
          }),
        ])
      : Promise.resolve();

    const start = async () => {
      await Promise.all([minimum, fontsReady]);

      if (cancelled) return;

      gsap.to(progress, {
        value: 100,
        duration: reducedMotion ? 0 : 0.5,
        ease: "power2.inOut",
        overwrite: true,
        onUpdate: renderProgress,
        onComplete: () => {
          if (cancelled) return;

          gsap.set(content, {
            autoAlpha: 1,
          });

          gsap.to(overlay, {
            autoAlpha: 0,
            duration: reducedMotion ? 0 : EXIT_DURATION,
            ease: "power2.inOut",
            onComplete: () => {
              if (cancelled) return;

              document.body.style.overflow = oldOverflow;
              setFinished(true);
            },
          });
        },
      });
    };

    void start();

    return () => {
      cancelled = true;

      window.clearTimeout(minimumTimer);
      window.clearTimeout(safetyTimer);

      gsap.killTweensOf(progress);
      gsap.killTweensOf(content);
      gsap.killTweensOf(overlay);

      document.body.style.overflow = oldOverflow;
    };
  }, []);

  return (
    <>
      <div ref={contentRef} style={finished ? undefined : { opacity: 0 }}>
        {children}
      </div>

      {!finished && (
        <div
          ref={overlayRef}
          role="status"
          aria-label="Loading page"
          className="fixed inset-0 z-[9999]"
          style={{
            backgroundColor: theme === "dark" ? "#141413" : "#ececec",
            color: theme === "dark" ? "#e7e3dd" : "#211f1e",
            touchAction: "none",
          }}
        >
          <div
            className="
              absolute
              left-1/2
              top-1/2
              -translate-x-1/2
              -translate-y-1/2
              whitespace-nowrap
              text-center
              text-[14px]
              font-extrabold
              leading-none
              tracking-[-0.06em]
              tabular-nums
              xl:text-[15px]
            "
          >
            <span aria-hidden="true" className="invisible block">
              888%
            </span>

            <span
              ref={counterRef}
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
              "
            >
              1%
            </span>
          </div>
        </div>
      )}
    </>
  );
}
