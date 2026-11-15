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
  const linkRef = useRef<HTMLAnchorElement>(null);

  const introSplitRef = useRef<SplitText | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    const intro = introRef.current;
    if (!intro) return;

    const introSplit = SplitText.create(intro, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
    });

    introSplitRef.current = introSplit;

    return () => {
      timelineRef.current?.kill();
      introSplit.revert();
      introSplitRef.current = null;
    };
  }, [project.slug, project.intro]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const link = linkRef.current;

    if (!root) return;

    timelineRef.current?.kill();

    const introLines = introSplitRef.current?.lines ?? [];

    const credits = gsap.utils.toArray<HTMLElement>("[data-credit]", root);

    gsap.killTweensOf([
      root,
      ...introLines,
      ...credits,
      ...(link ? [link] : []),
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

      return;
    }

    if (reducedMotion) {
      gsap.set(root, {
        autoAlpha: 1,
        y: 0,
      });

      gsap.set([...introLines, ...credits], {
        autoAlpha: 1,
        y: 0,
        yPercent: 0,
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

    gsap.set(introLines, {
      autoAlpha: 0,
      yPercent: 35,
    });

    gsap.set(credits, {
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

    if (introLines.length) {
      tl.to(
        introLines,
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.85,
          stagger: 0.065,
        },
        0,
      );
    }

    if (credits.length) {
      tl.to(
        credits,
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

  return (
    <>
      {/* PROJECT INFORMATION */}
      <div
        ref={rootRef}
        aria-hidden={hidden}
        className="pointer-events-none fixed inset-0 z-[85] text-[#ece9e4] opacity-0 max-md:hidden"
      >
        {/* INTRODUCTION — LG AND ABOVE */}
        <aside
          aria-label={`${project.title} introduction`}
          className="
            fixed
            left-[3.5vw]
            top-[28svh]
            hidden
            w-[22vw]
            lg:block
            xl:top-[32svh]
            xl:w-[19.5vw]
          "
        >
          <p
            ref={introRef}
            className="
              text-[clamp(15px,1.55vw,27px)]
              font-medium
              normal-case
              leading-[1.3]
              tracking-[-0.035em]
              text-[#ece9e4]
              xl:text-[clamp(20px,1.55vw,29px)]
            "
          >
            {sentenceCase(project.intro)}
          </p>
        </aside>

        {/* CREDITS */}
        <dl
          className="
            fixed
            bottom-[5.5svh]
            right-[3.5vw]
            flex
            flex-row
            items-baseline
            gap-x-[clamp(12px,2vw,26px)]

            lg:bottom-[16svh]
            lg:left-[3.5vw]
            lg:right-auto
            lg:w-[22vw]
            lg:flex-col
            lg:items-start
            lg:gap-y-[clamp(10px,1.5svh,18px)]

            xl:w-[19.5vw]
          "
        >
          {[
            {
              label: "Design:",
              value: project.design,
            },
            {
              label: "Development:",
              value: project.dev,
            },
            {
              label: "Year:",
              value: project.year,
            },
          ].map((item) => (
            <div
              key={item.label}
              data-credit
              className="flex shrink-0 items-baseline gap-x-1 whitespace-nowrap"
            >
              <dt
                className="
                  text-[clamp(11px,0.82vw,14px)]
                  font-medium
                  leading-[1.4]
                  tracking-[-0.01em]
                "
              >
                {item.label}
              </dt>

              <dd
                className="
                  text-[clamp(11px,0.9vw,16px)]
                  font-medium
                  leading-[1.4]
                  tracking-[-0.02em]
                  text-[#ece9e4]
                "
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* NAVIGATION HINT — LG AND ABOVE */}
        <p
          aria-hidden="true"
          className="
            pointer-events-none
            fixed
            bottom-[5.5svh]
            right-[3.5vw]
            hidden
            text-[12px]
            font-medium
            tracking-[-0.01em]
            text-white/55
            lg:block
          "
        >
          Scroll or click to navigate
        </p>
      </div>

      {/* WEBSITE LINK */}
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
          className={`group fixed bottom-[5.5svh] left-[3.5vw] z-[88] inline-flex items-center gap-4 text-[#ece9e4] opacity-0 max-md:bottom-[5svh] max-md:left-[5vw] ${
            hidden
              ? "pointer-events-none"
              : "pointer-events-auto cursor-pointer"
          }`}
        >
          <span className="text-[12px] font-medium leading-none tracking-[-0.01em]">
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
