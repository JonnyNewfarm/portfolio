"use client";

import { motion, useReducedMotion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

// Word-by-word reveal
const WORD_DELAY = 0.025;
const WORD_DURATION = 0.65;

const description =
  "I design and develop custom websites, creative portfolios and interactive digital experiences for businesses, brands and individuals. Combining thoughtful design, modern technology and subtle animations, I create distinctive websites with a focus on detail, performance and usability.";

const words = description.split(/\s+/);

export default function ServicesHero() {
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = reducedMotion === true;

  return (
    <section
      className="
        relative
        flex
        min-h-[100svh]
        w-full
        flex-col
        px-[3%]
        pt-28
        pb-12
        text-inherit
        md:pt-32
      "
    >
      {/* DESCRIPTION */}

      <div
        className="
          mx-auto
          flex
          w-full
          max-w-[1800px]
          flex-1
          items-center
          pb-36
          md:pb-0
        "
      >
        <h1
          aria-label={description}
          className="
            max-w-[1000px]
            text-[clamp(1.6rem,2.8vw,2.8rem)]
            font-medium
            leading-[1.1]
            tracking-[-0.045em]
          "
        >
          {words.map((word, index) => (
            <span key={index} aria-hidden="true">
              <span
                className="
                  inline-block
                  overflow-hidden
                  align-baseline
                  pb-[0.13em]
                  -mb-[0.13em]
                "
              >
                <motion.span
                  className="inline-block"
                  initial={shouldReduceMotion ? false : { y: "115%" }}
                  animate={{ y: "0%" }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : WORD_DURATION,
                    delay: shouldReduceMotion ? 0 : 0.15 + index * WORD_DELAY,
                    ease,
                  }}
                >
                  {word}
                </motion.span>
              </span>

              {index < words.length - 1 ? " " : null}
            </span>
          ))}
        </h1>
      </div>
    </section>
  );
}
