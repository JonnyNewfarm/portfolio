"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

import { useHomeRevealOnNavigation } from "@/components/PortfolioShell";

gsap.registerPlugin(SplitText);

const ease = "expo.out";

const HERO_DURATION = 1.25;
const META_DURATION = 1;
const IMAGE_DURATION = 1.1;

export default function HomeReveal() {
  const shouldReveal = useHomeRevealOnNavigation();

  useLayoutEffect(() => {
    if (!shouldReveal) return;

    const root = document.querySelector<HTMLElement>("[data-home-reveal-root]");

    if (!root) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    const hero = root.querySelector<HTMLElement>("h1");

    const metaTexts = Array.from(
      root.querySelectorAll<HTMLElement>("[data-intro-meta]"),
    );

    const portrait = isMobile
      ? (root
          .querySelector<HTMLImageElement>('img[src="/portrait.jpg"]')
          ?.closest<HTMLElement>("figure") ?? null)
      : root.querySelector<HTMLElement>(
          'button[aria-label^="Portrait of Jonas Nygaard"]',
        );

    const covers = isMobile
      ? Array.from(
          root.querySelectorAll<HTMLElement>("#selected-work a"),
        ).slice(0, 2)
      : Array.from(
          root.querySelectorAll<HTMLElement>(
            'div[aria-hidden="true"].pointer-events-none.fixed.inset-0',
          ),
        )
          .filter(
            (element) =>
              Boolean(element.style.zIndex) &&
              Boolean(element.querySelector("canvas")),
          )
          .slice(0, 2);

    // If Three.js covers haven't mounted yet,
    // reveal the Selected Work container instead.
    const workFallback =
      !isMobile && covers.length === 0
        ? root.querySelector<HTMLElement>("#selected-work")
        : null;

    const mediaTargets = covers.length
      ? covers
      : workFallback
        ? [workFallback]
        : [];

    let heroSplit: SplitText | null = null;
    let mobileObserver: IntersectionObserver | null = null;

    if (hero) {
      heroSplit = SplitText.create(hero, {
        type: "lines",
        mask: "lines",
      });

      gsap.set(heroSplit.lines, {
        yPercent: 112,
        autoAlpha: 0,
      });
    }

    if (metaTexts.length) {
      gsap.set(metaTexts, {
        yPercent: 112,
        autoAlpha: 0,
      });
    }

    if (portrait) {
      gsap.set(portrait, {
        y: 70,
        autoAlpha: 0,
      });
    }

    if (mediaTargets.length) {
      gsap.set(mediaTargets, {
        y: isMobile ? 45 : 85,
        autoAlpha: 0,
      });
    }

    const timeline = gsap.timeline({
      defaults: { ease },
    });

    // HERO TEXT
    if (heroSplit?.lines.length) {
      timeline.to(
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

    // BOTTOM META
    if (metaTexts.length) {
      timeline.to(
        metaTexts,
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: META_DURATION,
          stagger: 0.08,
        },
        0.2,
      );
    }

    // PORTRAIT
    if (portrait) {
      timeline.to(
        portrait,
        {
          y: 0,
          autoAlpha: 1,
          duration: IMAGE_DURATION,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(portrait, {
              clearProps: "transform,opacity,visibility",
            });
          },
        },
        0.18,
      );
    }

    // DESKTOP PROJECT IMAGES
    if (!isMobile && mediaTargets.length) {
      timeline.to(
        mediaTargets,
        {
          y: 0,
          autoAlpha: 1,
          duration: IMAGE_DURATION,
          stagger: 0.12,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(mediaTargets, {
              clearProps: "transform,opacity,visibility",
            });
          },
        },
        0.28,
      );
    }

    // MOBILE PROJECT IMAGES
    if (isMobile && mediaTargets.length) {
      timeline.call(
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
            mediaTargets.forEach(animate);
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
            {
              threshold: 0.08,
              rootMargin: "0px 0px -30px 0px",
            },
          );

          mediaTargets.forEach((element) => {
            mobileObserver?.observe(element);
          });
        },
        undefined,
        0.28,
      );
    }

    // Restore original DOM structure
    // after the heading reveal.
    timeline.call(() => {
      if (!heroSplit) return;

      gsap.set(heroSplit.lines, {
        clearProps: "transform,opacity,visibility",
      });

      heroSplit.revert();
      heroSplit = null;
    });

    return () => {
      timeline.kill();
      mobileObserver?.disconnect();

      if (heroSplit) {
        gsap.set(heroSplit.lines, {
          clearProps: "transform,opacity,visibility",
        });

        heroSplit.revert();
      }

      const elements = [
        ...metaTexts,
        ...(portrait ? [portrait] : []),
        ...mediaTargets,
      ];

      gsap.killTweensOf(elements);

      gsap.set(elements, {
        clearProps: "transform,opacity,visibility",
      });
    };
  }, [shouldReveal]);

  return null;
}
