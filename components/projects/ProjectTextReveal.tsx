"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, type ReactNode } from "react";

type ProjectTextRevealProps = {
  children: ReactNode;
  projectKey: string;
  hidden: boolean;
};

const TEXT_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "li",
  "dt",
  "dd",
  "span",
  "small",
  "strong",
  "em",
  "a",
  "div",
].join(",");

const GROUP_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,dt,dd";

function getTextElements(root: HTMLElement) {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(TEXT_SELECTOR),
  );

  return candidates.filter((element) => {
    if (!element.textContent?.trim()) return false;
    if (element.closest("svg")) return false;

    // Animate whole headings / paragraphs rather than
    // animating their nested spans individually.
    if (element.matches(GROUP_SELECTOR)) {
      return !element.parentElement?.closest(GROUP_SELECTOR);
    }

    if (element.closest(GROUP_SELECTOR)) {
      return false;
    }

    // For metadata divs and spans, animate only
    // the elements holding the actual text.
    const hasTextChildren = Array.from(element.children).some((child) =>
      child.textContent?.trim(),
    );

    return !hasTextChildren;
  });
}

export default function ProjectTextReveal({
  children,
  projectKey,
  hidden,
}: ProjectTextRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root || hidden) return;

    const elements = getTextElements(root);

    if (!elements.length) return;

    const firstReveal = !hasAnimated.current;
    hasAnimated.current = true;

    const timeline = gsap.timeline();

    timeline.fromTo(
      elements,
      {
        opacity: 0,
        clipPath: "inset(100% 0% 0% 0%)",
        filter: "blur(5px)",
      },
      {
        opacity: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        filter: "blur(0px)",
        duration: 0.8,
        stagger: {
          each: 0.055,
          from: "start",
        },
        delay: firstReveal ? 0.2 : 0.06,
        ease: "power3.out",
        overwrite: "auto",
        onComplete: () => {
          gsap.set(elements, {
            clearProps: "opacity,clipPath,filter",
          });
        },
      },
    );

    return () => {
      timeline.kill();

      gsap.set(elements, {
        clearProps: "opacity,clipPath,filter",
      });
    };
  }, [projectKey, hidden]);

  return (
    <div
      ref={rootRef}
      aria-hidden={hidden}
      className={`transition-opacity duration-500 ease-out ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {children}
    </div>
  );
}
