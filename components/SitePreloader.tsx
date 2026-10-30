"use client";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { PROJECTS } from "@/lib/projects";

gsap.registerPlugin(SplitText);

const MAX_WAIT = 8500;
const MIN_DISPLAY = 1100;
const EXIT_DURATION = 0.55;
const FLY_DURATION = 1.28;
const NAV_DURATION = 1.05;
const HERO_DURATION = 1.25;
const META_DURATION = 1;
const IMAGE_DURATION = 1.1;

let introCompleted = false;

type Props = { children: ReactNode };

type IntroTargets = {
  mobile: boolean;
  hero: HTMLElement | null;
  navTexts: HTMLElement[];
  metaTexts: HTMLElement[];
  portrait: HTMLElement | null;
  covers: HTMLElement[];
  nameTarget: HTMLElement | null;
  portfolioTarget: HTMLElement | null;
};

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new window.Image();
    let settled = false;

    const done = () => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      resolve();
    };

    image.onload = () => {
      if (typeof image.decode === "function") {
        image.decode().then(done, done);
      } else {
        done();
      }
    };
    image.onerror = done;
    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      if (typeof image.decode === "function") image.decode().then(done, done);
      else done();
    }
  });
}

function findTargets(root: HTMLElement): IntroTargets {
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const hero = root.querySelector<HTMLElement>("main h1");
  const navTexts = Array.from(
    root.querySelectorAll<HTMLElement>("[data-intro-nav]"),
  );
  const metaTexts = Array.from(
    root.querySelectorAll<HTMLElement>("[data-intro-meta]"),
  );

  if (mobile) {
    const image = root.querySelector<HTMLImageElement>(
      'img[src="/portrait.jpg"]',
    );
    return {
      mobile,
      hero,
      navTexts,
      metaTexts,
      portrait: image?.closest<HTMLElement>("figure") ?? null,
      covers: Array.from(
        root.querySelectorAll<HTMLElement>("#selected-work a"),
      ).slice(0, 2),
      nameTarget: null,
      portfolioTarget: null,
    };
  }

  const portrait = root.querySelector<HTMLElement>(
    'button[aria-label^="Portrait of Jonas Nygaard"]',
  );

  const covers = Array.from(
    root.querySelectorAll<HTMLElement>(
      'div[aria-hidden="true"].pointer-events-none.fixed.inset-0',
    ),
  )
    .filter(
      (element) =>
        Boolean(element.querySelector("canvas")) &&
        Boolean(element.style.zIndex),
    )
    .slice(0, 2);

  return {
    mobile,
    hero,
    navTexts,
    metaTexts,
    portrait,
    covers,
    nameTarget:
      navTexts.find((element) =>
        element.textContent?.trim().startsWith("NAME /"),
      ) ?? null,
    portfolioTarget:
      metaTexts.find(
        (element) => element.textContent?.trim() === "PORTFOLIO / 2026",
      ) ?? null,
  };
}

type Flight = {
  label: HTMLSpanElement;
  target: HTMLElement;
  targetOpacity: string;
  zIndex: number;
};

export default function SitePreloader({ children }: Props) {
  const [hadIntro] = useState(() => !introCompleted);
  const [finished, setFinished] = useState(() => introCompleted);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const countTextRef = useRef<HTMLSpanElement>(null);

  const nameFlightRef = useRef<HTMLSpanElement>(null);
  const portfolioFlightRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const updateTheme = () => {
      const stored = localStorage.getItem("theme");
      const next: "light" | "dark" =
        stored === "light" || stored === "dark"
          ? stored
          : html.dataset.theme === "dark"
            ? "dark"
            : window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light";
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
    const color = theme === "dark" ? "#e7e3dd" : "#211f1e";
    if (nameFlightRef.current) nameFlightRef.current.style.color = color;
    if (portfolioFlightRef.current)
      portfolioFlightRef.current.style.color = color;
  }, [theme]);

  useLayoutEffect(() => {
    if (!hadIntro) return;

    const content = contentRef.current;
    const overlay = overlayRef.current;
    const counter = counterRef.current;
    const countText = countTextRef.current;
    if (!content || !overlay || !counter || !countText) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let cancelled = false;
    let loadingFinished = false;
    let frame = 0;
    let safetyTimer = 0;
    let minimumTimer = 0;
    let phase: "loading" | "flying" | "landed" = "loading";
    let heroSplit: SplitText | null = null;
    let revealTimeline: gsap.core.Timeline | null = null;
    let exitTimeline: gsap.core.Timeline | null = null;
    let mobileObserver: IntersectionObserver | null = null;
    let prepared: IntroTargets | null = null;
    let flights: Flight[] = [];
    const hoverCleanups: Array<() => void> = [];
    const startedAt = performance.now();

    const progress = { value: 1 };
    const renderProgress = () => {
      countText.textContent = `${Math.max(
        1,
        Math.round(Math.min(100, progress.value)),
      )}%`;
    };
    renderProgress();

    const sources = [
      ...new Set([
        "/portrait.jpg",
        ...PROJECTS.slice(0, 2).map((project) => project.images[0]),
      ]),
    ];
    const totalTasks = sources.length + 2;
    let completedTasks = 0;

    const advanceProgress = () => {
      if (cancelled || loadingFinished) return;
      completedTasks++;
      gsap.to(progress, {
        value: Math.min(96, (completedTasks / totalTasks) * 96),
        duration: reducedMotion ? 0 : 0.8,
        ease: "power2.out",
        overwrite: true,
        onUpdate: renderProgress,
      });
    };

    const syncFlights = () => {
      if (isMobile || phase !== "landed") return;
      for (const { label, target } of flights) {
        const targetRect = target.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();
        gsap.set(label, {
          x: `+=${targetRect.left - labelRect.left}`,
          y: `+=${targetRect.top - labelRect.top}`,
        });
      }
    };

    window.addEventListener("resize", syncFlights);

    const waitForPage = () =>
      new Promise<void>((resolve) => {
        const began = performance.now();
        const check = () => {
          if (cancelled) {
            resolve();
            return;
          }
          const targets = findTargets(content);
          const ready =
            Boolean(targets.hero) &&
            Boolean(targets.portrait) &&
            targets.covers.length === 2 &&
            (targets.mobile ||
              targets.covers.every((cover) => !!cover.querySelector("canvas")));

          if (ready || performance.now() - began > 4000) {
            resolve();
            return;
          }
          frame = requestAnimationFrame(check);
        };
        check();
      });

    const prepareReveal = () => {
      const targets = findTargets(content);
      prepared = targets;
      if (reducedMotion) return targets;

      if (targets.hero) {
        heroSplit = SplitText.create(targets.hero, {
          type: "lines",
          mask: "lines",
        });
        gsap.set(heroSplit.lines, { yPercent: 112, autoAlpha: 0 });
      }

      if (!targets.mobile) {
        const configs = [
          {
            label: nameFlightRef.current,
            target: targets.nameTarget,
            zIndex: 20,
          },
          {
            label: portfolioFlightRef.current,
            target: targets.portfolioTarget,
            zIndex: 20,
          },
        ];

        configs.forEach(({ label, target, zIndex }) => {
          if (!label || !target) return;
          flights.push({
            label,
            target,
            targetOpacity: target.style.opacity,
            zIndex,
          });

          target.style.opacity = "0";
        });

        const anchor = targets.nameTarget?.closest("a");
        const nameLabel = nameFlightRef.current;
        if (anchor && nameLabel && flights.some((f) => f.label === nameLabel)) {
          const enter = () =>
            gsap.to(nameLabel, { opacity: 0.5, duration: 0.3 });
          const leave = () => gsap.to(nameLabel, { opacity: 1, duration: 0.3 });
          anchor.addEventListener("pointerenter", enter);
          anchor.addEventListener("pointerleave", leave);
          anchor.addEventListener("focusin", enter);
          anchor.addEventListener("focusout", leave);
          hoverCleanups.push(() => {
            anchor.removeEventListener("pointerenter", enter);
            anchor.removeEventListener("pointerleave", leave);
            anchor.removeEventListener("focusin", enter);
            anchor.removeEventListener("focusout", leave);
          });
        }
      }

      const flyingTargets = new Set(flights.map((flight) => flight.target));
      gsap.set(
        targets.navTexts.filter((element) => !flyingTargets.has(element)),
        { yPercent: 112, autoAlpha: 0 },
      );
      gsap.set(
        targets.metaTexts.filter((element) => !flyingTargets.has(element)),
        { yPercent: 112, autoAlpha: 0 },
      );

      if (targets.portrait) {
        gsap.set(targets.portrait, { y: 70, autoAlpha: 0 });
      }
      targets.covers.forEach((cover) => {
        gsap.set(cover, { y: targets.mobile ? 45 : 85, autoAlpha: 0 });
      });
      return targets;
    };

    const buildReveal = (targets: IntroTargets) => {
      const flyingTargets = new Set(flights.map((flight) => flight.target));
      const nav = targets.navTexts.filter(
        (element) => !flyingTargets.has(element),
      );
      const meta = targets.metaTexts.filter(
        (element) => !flyingTargets.has(element),
      );

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "expo.out" },
      });
      revealTimeline = tl;

      if (nav.length) {
        tl.to(
          nav,
          { yPercent: 0, autoAlpha: 1, duration: NAV_DURATION, stagger: 0.065 },
          0,
        );
      }
      if (heroSplit?.lines.length) {
        tl.to(
          heroSplit.lines,
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: HERO_DURATION,
            stagger: 0.11,
          },
          0.08,
        );
      }
      if (meta.length) {
        tl.to(
          meta,
          { yPercent: 0, autoAlpha: 1, duration: META_DURATION, stagger: 0.08 },
          0.2,
        );
      }
      if (targets.portrait) {
        tl.to(
          targets.portrait,
          {
            y: 0,
            autoAlpha: 1,
            duration: IMAGE_DURATION,
            ease: "power3.out",
            onComplete: () => {
              if (targets.portrait) {
                gsap.set(targets.portrait, {
                  clearProps: "transform,opacity,visibility",
                });
              }
            },
          },
          0.18,
        );
      }
      if (!targets.mobile && targets.covers.length) {
        tl.to(
          targets.covers,
          {
            y: 0,
            autoAlpha: 1,
            duration: IMAGE_DURATION,
            stagger: 0.12,
            ease: "power3.out",
            onComplete: () => {
              gsap.set(targets.covers, {
                clearProps: "transform,opacity,visibility",
              });
            },
          },
          0.28,
        );
      }
      if (targets.mobile && targets.covers.length) {
        tl.call(
          () => {
            const animate = (element: HTMLElement) => {
              gsap.to(element, {
                y: 0,
                autoAlpha: 1,
                duration: 0.95,
                ease: "power3.out",
                onComplete: () => {
                  gsap.set(element, {
                    clearProps: "transform,opacity,visibility",
                  });
                },
              });
            };
            if (!("IntersectionObserver" in window)) {
              targets.covers.forEach(animate);
              return;
            }
            mobileObserver = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (!entry.isIntersecting) return;
                  mobileObserver?.unobserve(entry.target);
                  animate(entry.target as HTMLElement);
                });
              },
              { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
            );
            targets.covers.forEach((cover) => mobileObserver?.observe(cover));
          },
          undefined,
          0.28,
        );
      }
      tl.call(() => {
        if (!heroSplit) return;
        gsap.set(heroSplit.lines, {
          clearProps: "transform,opacity,visibility",
        });
        heroSplit.revert();
        heroSplit = null;
      });
    };

    const exitPreloader = (targets: IntroTargets) => {
      if (cancelled) return;
      gsap.set(content, { autoAlpha: 1 });

      if (reducedMotion) {
        introCompleted = true;
        setFinished(true);
        document.body.style.overflow = oldOverflow;
        return;
      }

      buildReveal(targets);
      phase = "flying";

      exitTimeline = gsap.timeline({
        onComplete: () => {
          if (cancelled) return;
          phase = "landed";
          introCompleted = true;
          document.body.style.overflow = oldOverflow;

          setFinished(true);
        },
      });

      exitTimeline.to(
        counter,
        {
          y: -18,
          autoAlpha: 0,
          duration: 0.35,
          ease: "power2.inOut",
        },
        0,
      );

      exitTimeline.to(
        overlay,
        {
          autoAlpha: 0,
          duration: EXIT_DURATION,
          ease: "power2.inOut",
        },
        targets.mobile ? 0.12 : 0.96,
      );

      const activeLabels = new Set(flights.map((flight) => flight.label));
      [nameFlightRef.current, portfolioFlightRef.current].forEach((label) => {
        if (label && !activeLabels.has(label)) {
          exitTimeline!.to(label, { autoAlpha: 0, duration: 0.25 }, 0);
        }
      });

      flights.forEach(({ label, target, zIndex }) => {
        const destination = target.getBoundingClientRect();
        const from = label.getBoundingClientRect();

        exitTimeline!.to(
          label,
          {
            x: destination.left - from.left,
            y: destination.top - from.top,
            duration: FLY_DURATION,
            ease: "power3.inOut",
            onComplete: () => {
              gsap.set(label, { zIndex });
            },
          },
          0.14,
        );
      });

      exitTimeline.call(
        () => revealTimeline?.play(),
        undefined,
        targets.mobile ? 0.38 : 1.16,
      );
    };

    const start = async () => {
      const tasks: Promise<unknown>[] = sources.map((src) =>
        preloadImage(src).then(advanceProgress),
      );
      const fontTask = document.fonts
        ? document.fonts.ready.then(advanceProgress, advanceProgress)
        : Promise.resolve().then(advanceProgress);
      tasks.push(fontTask);
      tasks.push(waitForPage().then(advanceProgress));

      const safety = new Promise<void>((resolve) => {
        safetyTimer = window.setTimeout(resolve, MAX_WAIT);
      });

      await Promise.race([Promise.allSettled(tasks), safety]);
      if (cancelled) return;
      loadingFinished = true;
      window.clearTimeout(safetyTimer);

      const remaining = Math.max(
        0,
        MIN_DISPLAY - (performance.now() - startedAt),
      );
      if (remaining) {
        await new Promise<void>((resolve) => {
          minimumTimer = window.setTimeout(resolve, remaining);
        });
      }
      if (cancelled) return;

      await new Promise<void>((resolve) => {
        gsap.to(progress, {
          value: 100,
          duration: reducedMotion ? 0 : 0.95,
          ease: "power2.inOut",
          overwrite: true,
          onUpdate: renderProgress,
          onComplete: resolve,
        });
      });
      if (cancelled) return;

      await new Promise<void>((resolve) => {
        minimumTimer = window.setTimeout(resolve, reducedMotion ? 0 : 220);
      });
      if (cancelled) return;

      const targets = prepareReveal();
      exitPreloader(targets);
    };

    void start();

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
      window.clearTimeout(minimumTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncFlights);
      exitTimeline?.kill();
      revealTimeline?.kill();
      gsap.killTweensOf(progress);
      gsap.killTweensOf(counter);
      gsap.killTweensOf(overlay);
      mobileObserver?.disconnect();
      hoverCleanups.forEach((cleanup) => cleanup());

      if (prepared) {
        const elements = [
          ...prepared.navTexts,
          ...prepared.metaTexts,
          ...(prepared.portrait ? [prepared.portrait] : []),
          ...prepared.covers,
        ];
        gsap.killTweensOf(elements);
        gsap.set(elements, { clearProps: "transform,opacity,visibility" });
      }
      flights.forEach(({ label, target, targetOpacity }) => {
        gsap.killTweensOf(label);
        target.style.opacity = targetOpacity;
      });
      heroSplit?.revert();
      document.body.style.overflow = oldOverflow;
    };
  }, [hadIntro]);

  return (
    <>
      <div ref={contentRef} style={finished ? undefined : { opacity: 0 }}>
        {children}
      </div>

      {!finished && (
        <div
          ref={overlayRef}
          role="status"
          aria-label="Loading portfolio"
          className="fixed inset-0 z-[9999] overflow-hidden"
          style={{
            backgroundColor: theme === "dark" ? "#141413" : "#ececec",
            color: theme === "dark" ? "#e7e3dd" : "#211f1e",
            touchAction: "none",
            willChange: "transform",
          }}
        >
          <div
            ref={counterRef}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center    leading-none tracking-[-0.06em] tabular-nums font-extrabold text-[14px] xl:text-[15px]"
            style={{
              fontVariantNumeric: "tabular-nums",
              willChange: "transform,opacity",
            }}
          >
            <span aria-hidden="true" className="invisible block">
              888%
            </span>
            <span
              ref={countTextRef}
              className="absolute inset-0 flex items-center justify-center"
            >
              1%
            </span>
          </div>

          <span className="absolute left-[5vw] top-1/2 -translate-y-1/2 whitespace-nowrap  text-[clamp(8px,2.1vw,10px)] font-semibold uppercase leading-none tracking-[0.02em] md:hidden">
            JONAS NYGAARD
          </span>
          <span className="absolute right-[5vw] top-1/2 -translate-y-1/2 whitespace-nowrap  text-[clamp(8px,2.1vw,10px)] font-semibold uppercase leading-none tracking-[0.02em] md:hidden">
            PORTFOLIO / 2026
          </span>
        </div>
      )}

      {hadIntro && (
        <>
          <span
            ref={nameFlightRef}
            aria-hidden="true"
            className="pointer-events-none fixed z-[10001] hidden whitespace-nowrap text-[14px] font-extrabold uppercase leading-none tracking-[0.01em] md:block xl:text-[15px]"
            style={{
              left: "3.1vw",
              top: "50%",
              translate: "0 -50%",
              color: theme === "dark" ? "#e7e3dd" : "#211f1e",
            }}
          >
            NAME / JONAS NYGAARD
          </span>
          <span
            ref={portfolioFlightRef}
            aria-hidden="true"
            className="pointer-events-none fixed z-[10001] hidden whitespace-nowrap text-[clamp(13px,1.2vw,18px)] font-extrabold uppercase leading-none tracking-[-0.015em] md:block"
            style={{
              right: "3.1vw",
              top: "50%",
              translate: "0 -50%",
              color: theme === "dark" ? "#e7e3dd" : "#211f1e",
            }}
          >
            PORTFOLIO / 2026
          </span>
        </>
      )}
    </>
  );
}
