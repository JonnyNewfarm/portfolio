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
  const rootRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const liveLinkRef = useRef<HTMLAnchorElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  const introSplitRef = useRef<SplitText | null>(null);
  const descriptionSplitRef = useRef<SplitText | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  /* =========================================================
     SPLIT TEXT
  ========================================================= */

  useLayoutEffect(() => {
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

  /* =========================================================
     ANIMATIONS
  ========================================================= */

  useLayoutEffect(() => {
    const root = rootRef.current;
    const link = liveLinkRef.current;
    const divider = dividerRef.current;

    if (!root) return;

    timelineRef.current?.kill();

    gsap.killTweensOf(root);

    if (link) gsap.killTweensOf(link);
    if (divider) gsap.killTweensOf(divider);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const introLines = introSplitRef.current?.lines ?? [];

    const descriptionLines = descriptionSplitRef.current?.lines ?? [];

    const credits = gsap.utils.toArray<HTMLElement>("[data-credit]", root);

    const descriptionLabel = root.querySelector<HTMLElement>(
      "[data-description-label]",
    );

    const animatedElements = [
      ...introLines,
      ...descriptionLines,
      ...credits,
      ...(descriptionLabel ? [descriptionLabel] : []),
    ];

    gsap.killTweensOf(animatedElements);

    /* =====================================================
       NOT READY
    ===================================================== */

    if (!ready && !reversing) {
      gsap.set(root, {
        autoAlpha: 0,
        y: 0,
      });

      if (link) {
        gsap.set(link, {
          autoAlpha: 0,
          y: 0,
        });
      }

      if (divider) {
        gsap.set(divider, {
          autoAlpha: 0,
          scaleX: 0,
          transformOrigin: "left center",
        });
      }

      return;
    }

    /* =====================================================
       REVERSE
    ===================================================== */

    if (reversing) {
      gsap.to([root, ...(link ? [link] : []), ...(divider ? [divider] : [])], {
        autoAlpha: 0,
        y: 8,
        duration: reducedMotion ? 0 : 0.3,
        ease: "power2.inOut",
        overwrite: true,
      });

      return;
    }

    /* =====================================================
       FOCUSED IMAGE
    ===================================================== */

    if (focused) {
      gsap.to([root, ...(link ? [link] : []), ...(divider ? [divider] : [])], {
        autoAlpha: 0,
        duration: reducedMotion ? 0 : 0.28,
        ease: "power2.out",
        overwrite: true,
      });

      return;
    }

    /* =====================================================
       REDUCED MOTION
    ===================================================== */

    if (reducedMotion) {
      gsap.set(root, {
        autoAlpha: 1,
        y: 0,
      });

      gsap.set([...introLines, ...descriptionLines], {
        yPercent: 0,
        autoAlpha: 1,
      });

      gsap.set(credits, {
        y: 0,
        autoAlpha: 1,
      });

      if (descriptionLabel) {
        gsap.set(descriptionLabel, {
          y: 0,
          autoAlpha: 1,
        });
      }

      if (link) {
        gsap.set(link, {
          y: 0,
          autoAlpha: 1,
        });
      }

      if (divider) {
        gsap.set(divider, {
          autoAlpha: 1,
          scaleX: 1,
          transformOrigin: "left center",
        });
      }

      return;
    }

    /* =====================================================
       INITIAL REVEAL STATES

       Smaller movements than before.
       No long or heavy transitions.
    ===================================================== */

    gsap.set(introLines, {
      yPercent: 35,
      autoAlpha: 0,
    });

    gsap.set(descriptionLines, {
      yPercent: 30,
      autoAlpha: 0,
    });

    gsap.set(credits, {
      y: 12,
      autoAlpha: 0,
    });

    if (descriptionLabel) {
      gsap.set(descriptionLabel, {
        y: 8,
        autoAlpha: 0,
      });
    }

    if (link) {
      gsap.set(link, {
        y: 10,
        autoAlpha: 0,
      });
    }

    if (divider) {
      gsap.set(divider, {
        autoAlpha: 0,
        scaleX: 0,
        transformOrigin: "left center",
      });
    }

    gsap.set(root, {
      autoAlpha: 1,
      y: 0,
    });

    /* =====================================================
       REVEAL TIMELINE

       All elements start almost together.
       Total animation approximately 0.7–0.9s.
    ===================================================== */

    const tl = gsap.timeline({
      defaults: {
        ease: "power2.out",
      },
    });

    timelineRef.current = tl;

    /* INTRO */

    tl.to(
      introLines,
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.65,
        stagger: 0.045,
      },
      0,
    );

    /* DEVELOPMENT / DESIGN / YEAR */

    tl.to(
      credits,
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        stagger: 0.035,
      },
      0.03,
    );

    /* THE PROJECT LABEL */

    if (descriptionLabel) {
      tl.to(
        descriptionLabel,
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.5,
        },
        0.04,
      );
    }

    /* DESCRIPTION */

    tl.to(
      descriptionLines,
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.65,
        stagger: 0.035,
      },
      0.06,
    );

    /* DIVIDER */

    if (divider) {
      tl.to(
        divider,
        {
          autoAlpha: 1,
          scaleX: 1,
          duration: 0.55,
        },
        0.08,
      );
    }

    /* VIEW LIVE PROJECT + ARROW */

    if (link) {
      tl.to(
        link,
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.55,
        },
        0.06,
      );
    }

    return () => {
      tl.kill();
    };
  }, [project.slug, ready, focused, reversing]);

  const informationHidden = !ready || focused || reversing;

  return (
    <>
      {/* ===================================================
         PROJECT INFORMATION
      =================================================== */}

      <aside
        ref={rootRef}
        aria-hidden={informationHidden}
        aria-label={`${project.title} project information`}
        className="
          pointer-events-none
          fixed
          left-[3.5vw]
          top-[25svh]
          z-[85]
          w-[31vw]
          text-[#ece9e4]
          opacity-0

          max-md:left-[5vw]
          max-md:top-[24svh]
          max-md:w-[43vw]
        "
      >
        {/* INTRO */}

        <div className="pt-7 max-md:pt-2">
          <p
            ref={introRef}
            className="
              max-w-[490px]
              font-sans
              text-[clamp(17px,1.35vw,25px)]
              font-medium
              leading-[1.28]
              tracking-[-0.025em]

              max-md:text-[12px]
              max-md:leading-[1.3]
            "
          >
            {sentenceCase(project.intro)}
          </p>
        </div>

        {/* VERTICAL CREDITS */}

        <div
          className="
            mt-[clamp(40px,5svh,65px)]
            flex
            w-[32%]
            flex-col
            gap-y-[clamp(22px,3svh,36px)]

            max-md:mt-6
            max-md:w-full
            max-md:gap-y-4
          "
        >
          {[
            {
              label: "Development",
              value: project.dev,
            },
            {
              label: "Design",
              value: project.design,
            },
            {
              label: "Year",
              value: project.year,
            },
          ].map((item) => (
            <div key={item.label} data-credit className="min-w-0">
              <p
                className="
                  font-sans
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.12em]

                  max-md:text-[8px]
                "
              >
                {item.label}:
              </p>

              <p
                className="
                  mt-3
                  font-sans
                  text-[clamp(12px,0.86vw,16px)]
                  font-medium
                  leading-[1.35]
                  tracking-[-0.025em]
                  text-[#ece9e4]

                  max-md:mt-1
                  max-md:text-[11px]
                "
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* DESCRIPTION */}

        <div
          className="
            absolute
            left-[34%]
            top-[34svh]
            w-[66%]
            max-w-[410px]

            max-md:static
            max-md:mt-8
            max-md:w-full
          "
        >
          <p
            data-description-label
            className="
              font-sans
              text-[10px]
              font-medium
              uppercase
              tracking-[0.12em]

              max-md:text-[8px]
            "
          >
            The project:
          </p>

          <p
            ref={descriptionRef}
            className="
              mt-3
              font-sans
              text-[clamp(12px,0.86vw,15px)]
              leading-[1.65]
              tracking-[-0.01em]
              text-white/70

              max-md:mt-2
              max-md:text-[10px]
              max-md:leading-[1.45]
            "
          >
            {sentenceCase(project.description)}
          </p>
        </div>
      </aside>

      {/* ===================================================
         DIVIDER
      =================================================== */}

      <div
        ref={dividerRef}
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          bottom-[21svh]
          left-0
          z-[87]
          h-px
          w-[36.5vw]
          origin-left
          bg-white/16
          opacity-0

          max-md:bottom-[18svh]
          max-md:w-[100vw]
        "
      />

      {/* ===================================================
         VIEW LIVE PROJECT

         Only GSAP controls the fade-in.
         No transition-opacity / hover:opacity conflict.
      =================================================== */}

      {project.liveUrl.trim() && (
        <div
          className="
            pointer-events-none
            fixed
            bottom-[4.5svh]
            left-[3.5vw]
            z-[88]
            flex
            w-[31vw]
            justify-end

            max-md:bottom-[5svh]
            max-md:left-[5vw]
            max-md:w-[90vw]
            max-md:justify-start
          "
        >
          <a
            ref={liveLinkRef}
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-hidden={informationHidden}
            tabIndex={informationHidden ? -1 : 0}
            className={`
              group
              inline-flex
              items-center
              gap-4

              font-sans
              text-[12px]
              font-medium
              tracking-[-0.01em]
              text-[#ece9e4]

              opacity-0

              max-md:gap-3
              max-md:text-[10px]

              ${
                informationHidden
                  ? "pointer-events-none"
                  : "pointer-events-auto cursor-pointer"
              }
            `}
          >
            <span>View live project</span>

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
        </div>
      )}
    </>
  );
}
