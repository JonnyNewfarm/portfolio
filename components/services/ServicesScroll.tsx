"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Language = "en" | "no";

type Props = {
  language: Language;
  setLanguage: (language: Language) => void;
};

type Scene = {
  title: string[];
  description: string;
  contact?: string;
};

const content: Record<Language, Scene[]> = {
  en: [
    {
      title: ["WEBSITES & DIGITAL", "EXPERIENCES BUILT", "TO STAND OUT."],
      description:
        "I design and develop custom websites, creative portfolios and interactive digital experiences for businesses, brands and individuals.",
      contact: "START A PROJECT",
    },
    {
      title: ["WEB", "DESIGN."],
      description:
        "Distinctive websites shaped around your identity. Thoughtful layouts, strong typography and carefully considered digital experiences.",
    },
    {
      title: ["WEB", "DEVELOPMENT."],
      description:
        "Custom websites built with modern technology. Fast, responsive and developed with performance, accessibility and attention to detail in mind.",
    },
    {
      title: ["ANIMATIONS."],
      description:
        "Expressive motion, fluid transitions and interactive WebGL experiences that bring digital spaces to life.",
    },
  ],

  no: [
    {
      title: ["NETTSIDER OG DIGITALE", "OPPLEVELSER SOM", "SKILLER SEG UT."],
      description:
        "Jeg designer og utvikler skreddersydde nettsider, kreative porteføljer og interaktive digitale opplevelser for bedrifter, merkevarer og privatpersoner.",
      contact: "START ET PROSJEKT",
    },
    {
      title: ["WEB", "DESIGN."],
      description:
        "Unike nettsider utviklet rundt din identitet. Gjennomtenkte layouter, tydelig typografi og digitale opplevelser med fokus på detaljer.",
    },
    {
      title: ["WEB", "UTVIKLING."],
      description:
        "Skreddersydde nettsider bygget med moderne teknologi. Raske, responsive og utviklet med fokus på ytelse og universell utforming.",
    },
    {
      title: ["ANIMASJONER."],
      description:
        "Levende animasjoner, sømløse overganger og interaktive WebGL-opplevelser som gir digitale løsninger personlighet.",
    },
  ],
};

// SETTINGS
const SCROLL_PER_STEP = 0.9;
const TRANSITION_DURATION = 0.8;
const SNAP_DURATION = 0.35;
const SNAP_DELAY = 0.06;

export default function ServicesScroll({ language, setLanguage }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const scenes = content[language];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;

    if (!section || !stage) return;

    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-service-scene]");

      if (panels.length !== 4) return;

      const lines = panels.map((panel) =>
        Array.from(panel.querySelectorAll<HTMLElement>("[data-scene-line]")),
      );

      const details = panels.map((panel) =>
        panel.querySelector<HTMLElement>("[data-scene-details]"),
      );

      let activeIndex = 0;
      let transition: gsap.core.Timeline | null = null;

      function setInitialScene(index: number) {
        transition?.kill();

        panels.forEach((panel, i) => {
          const active = i === index;

          gsap.set(panel, {
            autoAlpha: active ? 1 : 0,
            pointerEvents: active ? "auto" : "none",
          });

          panel.setAttribute("aria-hidden", String(!active));

          gsap.set(lines[i], {
            yPercent: 0,
          });

          if (details[i]) {
            gsap.set(details[i], {
              autoAlpha: 1,
              y: 0,
            });
          }
        });

        activeIndex = index;
      }

      function changeScene(nextIndex: number) {
        if (nextIndex === activeIndex) return;

        const previousIndex = activeIndex;
        const direction = nextIndex > previousIndex ? 1 : -1;

        transition?.kill();

        const previousPanel = panels[previousIndex];
        const nextPanel = panels[nextIndex];

        // Remove any interrupted, inactive scenes.
        panels.forEach((panel, index) => {
          if (index !== previousIndex && index !== nextIndex) {
            gsap.set(panel, {
              autoAlpha: 0,
              pointerEvents: "none",
            });

            panel.setAttribute("aria-hidden", "true");
          }
        });

        const previousLines = lines[previousIndex];
        const nextLines = lines[nextIndex];

        const previousDetails = details[previousIndex];
        const nextDetails = details[nextIndex];

        activeIndex = nextIndex;

        gsap.set(previousPanel, {
          autoAlpha: 1,
          pointerEvents: "none",
        });

        gsap.set(nextPanel, {
          autoAlpha: 1,
          pointerEvents: "auto",
        });

        previousPanel.setAttribute("aria-hidden", "true");

        nextPanel.setAttribute("aria-hidden", "false");

        // Next title begins outside its masks.
        gsap.set(nextLines, {
          yPercent: direction * 110,
        });

        if (nextDetails) {
          gsap.set(nextDetails, {
            autoAlpha: 0,
            y: direction * 25,
          });
        }

        transition = gsap.timeline({
          defaults: {
            overwrite: "auto",
          },
          onComplete: () => {
            gsap.set(previousPanel, {
              autoAlpha: 0,
              pointerEvents: "none",
            });
          },
        });

        // Old heading exits.
        transition.to(
          previousLines,
          {
            yPercent: -direction * 110,
            duration: TRANSITION_DURATION * 0.8,
            stagger: 0.045,
            ease: "power3.inOut",
          },
          0,
        );

        // Old description exits.
        if (previousDetails) {
          transition.to(
            previousDetails,
            {
              autoAlpha: 0,
              y: -direction * 20,
              duration: 0.4,
              ease: "power2.inOut",
            },
            0.02,
          );
        }

        // Old scene fades while the next title arrives.
        transition.to(
          previousPanel,
          {
            opacity: 0,
            duration: 0.42,
            ease: "power2.inOut",
          },
          0.24,
        );

        // New heading reveals.
        transition.to(
          nextLines,
          {
            yPercent: 0,
            duration: TRANSITION_DURATION,
            stagger: 0.06,
            ease: "power3.out",
          },
          0.17,
        );

        // New description follows.
        if (nextDetails) {
          transition.to(
            nextDetails,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.55,
              ease: "power3.out",
            },
            0.45,
          );
        }
      }

      setInitialScene(0);

      const trigger = ScrollTrigger.create({
        trigger: section,
        pin: stage,
        start: "top top",

        end: () =>
          `+=${Math.round(
            window.innerHeight * SCROLL_PER_STEP * (panels.length - 1),
          )}`,

        anticipatePin: 1,
        invalidateOnRefresh: true,

        // Snap to one of the four complete views.
        snap: {
          snapTo: 1 / (panels.length - 1),
          duration: SNAP_DURATION,
          delay: SNAP_DELAY,
          ease: "power2.inOut",
          inertia: false,
          directional: false,
        },

        onUpdate: (self) => {
          const nextIndex = Math.max(
            0,
            Math.min(
              panels.length - 1,
              Math.round(self.progress * (panels.length - 1)),
            ),
          );

          changeScene(nextIndex);
        },
      });

      // Handle reloading at a restored scroll position.
      setInitialScene(Math.round(trigger.progress * (panels.length - 1)));

      return () => {
        transition?.kill();
        trigger.kill();
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="
        relative
        min-h-[100svh]
        w-full
      "
    >
      <div
        ref={stageRef}
        className="
          relative
          h-[100svh]
          w-full
          overflow-hidden
          motion-reduce:h-auto
          motion-reduce:overflow-visible
        "
      >
        {/* LANGUAGE */}
        <div
          className="
            absolute
            top-28
            right-[3%]
            z-20
            flex
            items-center
            gap-2
            text-xs
            font-bold
            md:top-32
            md:text-sm
          "
          role="group"
          aria-label="Select language"
        >
          <button
            type="button"
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            className={`cursor-pointer transition-opacity ${
              language === "en" ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
          >
            EN
          </button>

          <span className="opacity-30">/</span>

          <button
            type="button"
            onClick={() => setLanguage("no")}
            aria-pressed={language === "no"}
            className={`cursor-pointer transition-opacity ${
              language === "no" ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
          >
            NO
          </button>
        </div>

        {scenes.map((scene, index) => (
          <article
            key={index}
            data-service-scene
            aria-hidden={index !== 0}
            style={
              index === 0
                ? undefined
                : {
                    opacity: 0,
                    visibility: "hidden",
                  }
            }
            className="
              absolute
              inset-0
              flex
              h-full
              w-full
              flex-col
              px-[3%]
              pt-36
              pb-10
              md:pt-40
              md:pb-14
              motion-reduce:!relative
              motion-reduce:!visible
              motion-reduce:!h-auto
              motion-reduce:min-h-[80svh]
              motion-reduce:!opacity-100
            "
          >
            {/* HEADING */}
            <div
              className={`
                flex
                w-full
                flex-1
                flex-col
                ${
                  index === 0
                    ? "items-start justify-start pt-[5vh]"
                    : "items-start justify-center md:items-end"
                }
              `}
            >
              {index === 0 ? (
                <h1
                  className="
                    w-full
                    max-w-[1400px]
                    text-[clamp(2rem,4.5vw,5.25rem)]
                    leading-[0.98]
                    font-bold
                    tracking-[-0.055em]
                    uppercase
                  "
                >
                  {scene.title.map((line, i) => (
                    <span
                      key={i}
                      className="
                        block
                        overflow-hidden
                        pb-[0.12em]
                        -mb-[0.12em]
                      "
                    >
                      <span data-scene-line className="block">
                        {line}
                      </span>
                    </span>
                  ))}
                </h1>
              ) : (
                <h2
                  className="
                    w-full
                    text-[clamp(2.7rem,8vw,8rem)]
                    leading-[0.94]
                    font-bold
                    tracking-[-0.06em]
                    uppercase
                    md:max-w-[1100px]
                    md:text-right
                  "
                >
                  {scene.title.map((line, i) => (
                    <span
                      key={i}
                      className="
                        block
                        overflow-hidden
                        pb-[0.12em]
                        -mb-[0.12em]
                      "
                    >
                      <span data-scene-line className="block">
                        {line}
                      </span>
                    </span>
                  ))}
                </h2>
              )}
            </div>

            {/* DESCRIPTION */}
            <div
              data-scene-details
              className="
                flex
                w-full
                flex-col
                gap-8
                pt-10
                md:flex-row
                md:items-end
                md:justify-between
              "
            >
              <p
                className="
                  max-w-[500px]
                  text-base
                  leading-[1.65]
                  md:text-lg
                "
              >
                {scene.description}
              </p>

              {scene.contact && (
                <Link
                  href="#contact"
                  className="
                    group
                    inline-flex
                    shrink-0
                    items-center
                    gap-4
                    self-start
                    text-base
                    font-bold
                    uppercase
                    md:self-auto
                    md:text-lg
                  "
                >
                  {scene.contact}

                  <span
                    className="
                      inline-block
                      transition-transform
                      duration-300
                      group-hover:translate-x-1
                      group-hover:-translate-y-1
                    "
                  >
                    ↗
                  </span>
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
