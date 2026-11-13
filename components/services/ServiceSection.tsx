"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

type Language = "en" | "no";

type Props = {
  language: Language;
};

type Service = {
  title: string[];
  description: string;
};

const ease = [0.16, 1, 0.3, 1] as const;

const translations: Record<
  Language,
  {
    heading: string[];
    services: Service[];
  }
> = {
  en: {
    heading: ["WHAT I", "DO."],

    services: [
      {
        title: ["WEB", "DESIGN."],
        description:
          "Distinctive digital experiences built around your identity. From thoughtful layouts and typography to complete visual concepts that make your brand stand out.",
      },
      {
        title: ["WEB", "DEVELOPMENT."],
        description:
          "Custom websites built with modern technologies. Responsive, fast and carefully developed with performance, accessibility and attention to detail in mind.",
      },
      {
        title: ["CREATIVE", "PORTFOLIOS."],
        description:
          "Unique digital spaces for designers, photographers, artists and creatives. Thoughtfully designed to showcase your work and express your individual style.",
      },
      {
        title: ["MOTION &", "INTERACTION."],
        description:
          "Expressive animations, fluid transitions and interactive WebGL experiences. Bringing movement and personality into digital spaces.",
      },
    ],
  },

  no: {
    heading: ["HVA JEG", "GJØR."],

    services: [
      {
        title: ["WEB", "DESIGN."],
        description:
          "Unike digitale opplevelser bygget rundt din identitet. Fra gjennomtenkte layouter og typografi til komplette visuelle konsepter som får merkevaren din til å skille seg ut.",
      },
      {
        title: ["WEB", "UTVIKLING."],
        description:
          "Skreddersydde nettsider utviklet med moderne teknologi. Responsive, raske og gjennomført med fokus på ytelse, universell utforming og detaljer.",
      },
      {
        title: ["KREATIVE", "PORTEFØLJER."],
        description:
          "Unike digitale porteføljer for designere, fotografer, kunstnere og andre kreative. Utviklet for å presentere arbeidet ditt og fremheve din personlige stil.",
      },
      {
        title: ["ANIMASJON &", "INTERAKSJON."],
        description:
          "Levende animasjoner, flytende overganger og interaktive WebGL-opplevelser. Bevegelse og personlighet som gjør digitale opplevelser mer engasjerende.",
      },
    ],
  },
};

export default function ServicesSection({ language }: Props) {
  const copy = translations[language];

  const reducedMotion = useReducedMotion();
  const reduceMotion = reducedMotion === true;

  return (
    <section
      id="services"
      className="
        relative
        w-full
        scroll-mt-20
        px-[3%]
      "
    >
      <div
        className="
          mx-auto
          grid
          w-full
          max-w-[1800px]
          grid-cols-1
          md:grid-cols-[40%_60%]
        "
      >
        {/* LEFT — STICKY HEADING */}
        <div
          className="
            relative
            self-start
            md:sticky
            md:top-0
            md:h-[100svh]
          "
        >
          <div
            className="
              flex
              h-full
              flex-col
              justify-start
              pt-20
              pb-8
              md:justify-center
              md:pt-0
              md:pb-0
            "
          >
            <h2
              aria-label={copy.heading.join(" ")}
              className="
                text-[clamp(3rem,5.5vw,7rem)]
                leading-[0.94]
                font-bold
                tracking-[-0.055em]
                uppercase
              "
            >
              {copy.heading.map((line, index) => (
                <span
                  key={`${language}-${index}`}
                  aria-hidden="true"
                  className="
                    block
                    overflow-hidden
                    pb-[0.12em]
                    -mb-[0.12em]
                  "
                >
                  <motion.span
                    className="block"
                    initial={reduceMotion ? false : { y: "110%" }}
                    whileInView={{ y: "0%" }}
                    viewport={{
                      once: true,
                      amount: 0.3,
                    }}
                    transition={{
                      duration: reduceMotion ? 0 : 1.1,
                      delay: reduceMotion ? 0 : index * 0.12,
                      ease,
                    }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h2>
          </div>
        </div>

        {/* RIGHT — SCROLLING SERVICES */}
        <div className="relative flex w-full flex-col">
          {copy.services.map((service, index) => (
            <ServicePanel
              key={`${language}-${index}`}
              service={service}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type ServicePanelProps = {
  service: Service;
  reduceMotion: boolean;
};

function ServicePanel({ service, reduceMotion }: ServicePanelProps) {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Scroll-linked appearance and disappearance.
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.22, 0.65, 1],
    [0, 1, 1, 0.18],
  );

  const y = useTransform(scrollYProgress, [0, 0.25, 0.7, 1], [85, 0, 0, -65]);

  return (
    <article
      ref={ref}
      className="
        relative
        flex
        min-h-[80svh]
        w-full
        items-center
        py-20
        md:min-h-[100svh]
        md:py-28
        md:pl-[5%]
      "
    >
      <motion.div
        className="w-full"
        style={
          reduceMotion
            ? undefined
            : {
                opacity,
                y,
              }
        }
      >
        {/* LARGE SERVICE HEADING */}
        <h3
          aria-label={service.title.join(" ")}
          className="
            max-w-full
            text-[clamp(2.8rem,5.8vw,7.5rem)]
            leading-[0.95]
            font-bold
            tracking-[-0.06em]
            uppercase
          "
        >
          {service.title.map((line, index) => (
            <span
              key={index}
              aria-hidden="true"
              className="
                block
                overflow-hidden
                pb-[0.13em]
                -mb-[0.13em]
              "
            >
              <motion.span
                className="block"
                initial={
                  reduceMotion
                    ? false
                    : {
                        y: "110%",
                      }
                }
                whileInView={{
                  y: "0%",
                }}
                viewport={{
                  once: true,
                  amount: 0.2,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 1.15,
                  delay: reduceMotion ? 0 : index * 0.12,
                  ease,
                }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h3>

        {/* DESCRIPTION */}
        <motion.p
          className="
            mt-10
            max-w-[520px]
            text-base
            leading-[1.7]
            md:mt-14
            md:text-lg
          "
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 24,
                }
          }
          whileInView={{
            opacity: 0.7,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: reduceMotion ? 0 : 1,
            delay: reduceMotion ? 0 : 0.2,
            ease,
          }}
        >
          {service.description}
        </motion.p>
      </motion.div>
    </article>
  );
}
