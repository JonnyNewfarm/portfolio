"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { Project } from "@/lib/projects";

type Props = {
  project: Project;
  reversing: boolean;
  focused?: boolean;
  ready?: boolean;
};

export default function ProjectDetailsInfo({
  project,
  reversing,
  focused = false,
  ready = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const link = linkRef.current;

    if (!root) return;

    timelineRef.current?.kill();

    const details = gsap.utils.toArray<HTMLElement>("[data-detail]", root);

    gsap.killTweensOf([root, ...details, ...(link ? [link] : [])]);

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

      return;
    }

    if (reducedMotion) {
      gsap.set(root, {
        autoAlpha: 1,
        y: 0,
      });

      gsap.set(details, {
        autoAlpha: 1,
        y: 0,
      });

      if (link) {
        gsap.set(link, {
          autoAlpha: 1,
          y: 0,
        });
      }

      return;
    }

    gsap.set(root, {
      autoAlpha: 1,
      y: 0,
    });

    gsap.set(details, {
      autoAlpha: 0,
      y: 14,
    });

    if (link) {
      gsap.set(link, {
        autoAlpha: 0,
        y: 12,
      });
    }

    const tl = gsap.timeline({
      defaults: {
        ease: "power3.out",
      },
    });

    timelineRef.current = tl;

    if (details.length) {
      tl.to(
        details,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.07,
        },
        0.2,
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

    return () => {
      tl.kill();
    };
  }, [project.slug, ready, focused, reversing]);

  const hidden = !ready || focused || reversing;

  const textClass =
    "text-[clamp(16px,1.1vw,21px)] font-medium leading-none tracking-[-0.01em]";

  return (
    <>
      <div
        ref={rootRef}
        aria-hidden={hidden}
        className="
          pointer-events-none
          fixed
          inset-0
          z-[85]
          text-[#ece9e4]
          opacity-0
          max-md:hidden
        "
      >
        {/* YEAR — TOP RIGHT */}
        <div
          data-detail
          className={`
            fixed
            top-[4svh]
            right-[3.5vw]
            ${textClass}
          `}
        >
          {project.year}
        </div>

        {/* DESIGN & DEV — BOTTOM RIGHT */}
        <div
          data-detail
          className={`
            fixed
            right-[3.5vw]
            bottom-[4.5svh]
            whitespace-nowrap
            ${textClass}
          `}
        >
          Design & Dev — {project.design}
        </div>
      </div>

      {/* WEBSITE LINK — BOTTOM LEFT */}
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
          className={`
            group
            fixed
            bottom-[4.5svh]
            left-[3.5vw]
            z-[88]
            inline-flex
            items-center
            gap-4
            text-[#ece9e4]
            opacity-0
            max-md:bottom-[5svh]
            max-md:left-[5vw]
            ${
              hidden
                ? "pointer-events-none"
                : "pointer-events-auto cursor-pointer"
            }
          `}
        >
          <span
            className="
              text-[20px]
              font-semibold
              leading-none
              tracking-[-0.01em]
text-[clamp(16px,1.1vw,21px)]            "
          >
            View live project
          </span>

          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="
              shrink-0
              transition-transform
              duration-300
              ease-out
              group-hover:translate-x-[3px]
              group-hover:-translate-y-[3px]
            "
          >
            <path d="M5 19L19 5" />
            <path d="M9 5H19V15" />
          </svg>
        </a>
      )}
    </>
  );
}
