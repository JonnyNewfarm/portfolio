"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import type { Project } from "@/lib/projects";

gsap.registerPlugin(SplitText);

type Props = {
  project: Project;
  reversing: boolean;
  focused?: boolean;
  ready?: boolean;
};

function sentenceCase(value: string) {
  const text = value.trim().toLowerCase();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

export default function ProjectDetailsInfo({
  project,
  reversing,
  focused = false,
  ready = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const introSplitRef = useRef<SplitText | null>(null);
  const descriptionSplitRef = useRef<SplitText | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    // Desktop copy only; the mobile gallery retains its current layout.
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    const intro = introRef.current;
    const description = descriptionRef.current;
    if (!intro || !description) return;

    const introSplit = SplitText.create(intro, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
    });
    const descriptionSplit = SplitText.create(description, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
    });

    introSplitRef.current = introSplit;
    descriptionSplitRef.current = descriptionSplit;

    return () => {
      timelineRef.current?.kill();
      introSplit.revert();
      descriptionSplit.revert();
      introSplitRef.current = null;
      descriptionSplitRef.current = null;
    };
  }, [project.slug, project.intro, project.description]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const link = linkRef.current;
    const divider = dividerRef.current;
    if (!root) return;

    timelineRef.current?.kill();

    const introLines = introSplitRef.current?.lines ?? [];
    const descriptionLines = descriptionSplitRef.current?.lines ?? [];
    const credits = gsap.utils.toArray<HTMLElement>("[data-credit]", root);
    const labels = gsap.utils.toArray<HTMLElement>("[data-info-label]", root);
    const textParts = [...introLines, ...descriptionLines];
    const animated = [...textParts, ...credits, ...labels];

    gsap.killTweensOf([
      root,
      ...animated,
      ...(link ? [link] : []),
      ...(divider ? [divider] : []),
    ]);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (focused || reversing || !ready) {
      const duration = !ready || reducedMotion ? 0 : 0.28;

      gsap.to(root, {
        autoAlpha: 0,
        y: reversing ? 8 : 0,
        duration,
        ease: "power2.out",
        overwrite: true,
      });

      if (link) {
        gsap.to(link, {
          autoAlpha: 0,
          y: reversing ? 8 : 0,
          duration,
          overwrite: true,
        });
      }

      if (divider) {
        gsap.to(divider, {
          autoAlpha: 0,
          duration,
          overwrite: true,
        });
      }

      return;
    }

    if (reducedMotion) {
      gsap.set(root, { autoAlpha: 1, y: 0 });
      gsap.set(animated, { autoAlpha: 1, y: 0, yPercent: 0 });
      if (link) gsap.set(link, { autoAlpha: 1, y: 0 });
      if (divider) gsap.set(divider, { autoAlpha: 1, scaleX: 1 });
      return;
    }

    gsap.set(root, { autoAlpha: 1, y: 0 });
    gsap.set(textParts, { autoAlpha: 0, yPercent: 35 });
    gsap.set([...credits, ...labels], { autoAlpha: 0, y: 13 });
    if (link) gsap.set(link, { autoAlpha: 0, y: 12 });
    if (divider) {
      gsap.set(divider, {
        autoAlpha: 0,
        scaleX: 0,
        transformOrigin: "left center",
      });
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    timelineRef.current = tl;

    if (introLines.length) {
      tl.to(
        introLines,
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.78,
          stagger: 0.06,
        },
        0,
      );
    }

    if (descriptionLines.length) {
      tl.to(
        descriptionLines,
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.8,
          stagger: 0.035,
        },
        0.13,
      );
    }

    if (labels.length) {
      tl.to(
        labels,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.05,
        },
        0.03,
      );
    }

    if (credits.length) {
      tl.to(
        credits,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.075,
        },
        0.09,
      );
    }

    if (divider) {
      tl.to(
        divider,
        {
          autoAlpha: 1,
          scaleX: 1,
          duration: 0.65,
        },
        0.13,
      );
    }

    if (link) {
      tl.to(
        link,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
        },
        0.2,
      );
    }

    return () => tl.kill();
  }, [project.slug, ready, focused, reversing]);

  const hidden = !ready || focused || reversing;

  return (
    <>
      {/* The title is animated by ImageCard, not duplicated here. */}
      <div
        ref={rootRef}
        aria-hidden={hidden}
        className="pointer-events-none fixed inset-0 z-[85] text-[#ece9e4] opacity-0 max-md:hidden"
      >
        {/* LEFT — one coherent editorial text block. */}
        <aside
          aria-label={`${project.title} introduction`}
          className="fixed left-[3.5vw] top-[35svh] w-[19.5vw]"
        >
          <p
            data-info-label
            className="mb-[clamp(15px,2svh,24px)] text-[10px] font-medium uppercase leading-none tracking-[0.12em] text-white/55"
          >
            PROJECT / {project.number}
          </p>

          <p
            ref={introRef}
            className="text-[clamp(17px,1.25vw,23px)] font-medium leading-[1.25] tracking-[-0.03em]"
          >
            {sentenceCase(project.intro)}
          </p>

          <p
            ref={descriptionRef}
            className="mt-[clamp(36px,6svh,74px)] max-w-[370px] text-[clamp(12px,0.86vw,15px)] leading-[1.65] tracking-[-0.01em] text-white/65"
          >
            {sentenceCase(project.description)}
          </p>
        </aside>

        {/* RIGHT — stacked credits in the lower-right corner. */}
        <aside
          aria-label={`${project.title} credits`}
          className="fixed bottom-[10svh] right-[3.5vw] w-[19.5vw]"
        >
          <dl className="flex flex-col gap-y-[clamp(18px,2.7svh,30px)]">
            {[
              { label: "Development", value: project.dev },
              { label: "Design", value: project.design },
              { label: "Year", value: project.year },
            ].map((item) => (
              <div key={item.label} data-credit className="min-w-0">
                <dt className="text-[10px] font-medium uppercase leading-none tracking-[0.12em] text-white">
                  {item.label}:
                </dt>
                <dd className="mt-3 text-[clamp(12px,0.9vw,16px)] font-medium leading-[1.3] tracking-[-0.02em]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      {/* Hairline above the live link on the left, as before. */}
      <div
        ref={dividerRef}
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[20svh] left-0 z-[86] h-px w-[26vw] origin-left bg-white/20 opacity-0 max-md:hidden"
      />

      {project.liveUrl.trim() && (
        <a
          ref={linkRef}
          data-project-live-link
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${project.title} live website`}
          aria-hidden={hidden}
          tabIndex={hidden ? -1 : 0}
          className={`group fixed bottom-[5.5svh] right-[77.5vw] max-md:right-auto z-[88] inline-flex items-center gap-4 text-[#ece9e4] opacity-0 max-md:bottom-[5svh] max-md:left-[5vw] ${hidden ? "pointer-events-none" : "pointer-events-auto cursor-pointer"}`}
        >
          <span className="text-[12px] font-medium tracking-[-0.01em]">
            View live project
          </span>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-[3px] group-hover:-translate-y-[3px]"
          >
            <path d="M5 19L19 5" />
            <path d="M9 5H19V15" />
          </svg>
        </a>
      )}
    </>
  );
}
