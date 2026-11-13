"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";

type Service = {
  id: string;
  description: string;
  image: string;
  alt: string;
};

const ease = [0.16, 1, 0.3, 1] as const;

const IMAGE_TRIGGER = 0.62;

const IMAGES = [
  "/work/services-6.jpg",
  "/work/services-9.jpg",
  "/work/services-3.mp4",
];

const ServicesImageTransition = dynamic(
  () => import("./ServicesImageTransition"),
  { ssr: false },
);

const services: Service[] = [
  {
    id: "web-design",
    description:
      "Distinctive digital experiences shaped around your identity. Thoughtful layouts, bold typography and carefully crafted interfaces that make an impression.",
    image: IMAGES[0],
    alt: "Kerimov Designs website",
  },
  {
    id: "web-development",
    description:
      "Custom websites built from the ground up. Responsive, performant and developed with modern technologies to create seamless digital experiences.",
    image: IMAGES[1],
    alt: "Calero Studio website",
  },
  {
    id: "animations",
    description:
      "Motion brings digital experiences to life. From subtle interactions to expressive animations and immersive WebGL experiences.",
    image: IMAGES[2],
    alt: "Interactive animation project",
  },
];

export default function ServicesShowcase() {
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const activeIndexRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;

      const triggerY = window.innerHeight * IMAGE_TRIGGER;

      let nextIndex = 0;

      textRefs.current.forEach((element, index) => {
        if (!element) return;

        const top = element.getBoundingClientRect().top;

        if (top <= triggerY) {
          nextIndex = index;
        }
      });

      if (nextIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
      }
    };

    const schedule = () => {
      if (frame) return;

      frame = requestAnimationFrame(update);
    };

    update();

    window.addEventListener("scroll", schedule, {
      passive: true,
    });

    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);

      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <section
      id="services"
      className="
        relative
        w-full
        overflow-visible
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
          items-stretch
          overflow-visible

          lg:grid-cols-[minmax(0,1fr)_500px]
          lg:gap-12

          xl:grid-cols-[minmax(0,1fr)_650px]
        "
      >
        {/* TEXT */}

        <div className="min-w-0 lg:pb-[38svh]">
          {services.map((service, index) => (
            <article
              key={service.id}
              id={service.id}
              className="
                relative
                flex
                w-full
                flex-col
                justify-center
                gap-12
                py-20

                lg:min-h-[115svh]
                lg:last:min-h-[140svh]
                lg:gap-0
                lg:py-16
              "
            >
              <ServiceText
                service={service}
                active={activeIndex === index}
                textRef={(element) => {
                  textRefs.current[index] = element;
                }}
              />

              {/* MOBILE / TABLET MEDIA */}

              <div
                className="
                  flex
                  w-full
                  justify-end
                  lg:hidden
                "
              >
                <MobileMedia src={service.image} alt={service.alt} />
              </div>
            </article>
          ))}
        </div>

        {/* DESKTOP STICKY IMAGE / VIDEO */}

        <div
          className="
            relative
            z-10
            hidden
            min-w-0
            self-stretch
            overflow-visible
            lg:block
          "
        >
          <div
            className="
              sticky
              top-[13svh]
              flex
              h-[74svh]
              w-full
              items-center
              justify-end
              overflow-visible
            "
          >
            <div
              className="
                relative
                aspect-[4/4.7]
                w-full
                max-w-[320px]
                overflow-visible
                xl:max-w-[440px]
              "
              role="img"
              aria-label={services[activeIndex].alt}
            >
              <ServicesImageTransition activeIndex={activeIndex} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------
// SERVICE TEXT
// --------------------------------------------------

function ServiceText({
  service,
  active,
  textRef,
}: {
  service: Service;
  active: boolean;
  textRef: (element: HTMLParagraphElement | null) => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.p
      ref={textRef}
      initial={false}
      animate={{
        opacity: reducedMotion || active ? 1 : 0.65,
      }}
      transition={{
        opacity: {
          duration: reducedMotion ? 0 : 0.5,
          ease,
        },
      }}
      className="
        max-w-[740px]
        text-[clamp(1.35rem,2.5vw,2.4rem)]
        font-medium
        leading-[1.4]
        tracking-[-0.04em]
      "
    >
      {service.description}
    </motion.p>
  );
}

// --------------------------------------------------
// MOBILE IMAGE / VIDEO
// --------------------------------------------------

function MobileMedia({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const reducedMotion = useReducedMotion();

  const isVideo = src.endsWith(".mp4");

  const visible = useInView(ref, {
    once: true,
    amount: 0.15,
  });

  const inViewport = useInView(ref, {
    amount: 0.1,
  });

  useEffect(() => {
    if (!isVideo) return;

    const video = videoRef.current;

    if (!video) return;

    if (inViewport && !reducedMotion) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isVideo, inViewport, reducedMotion]);

  return (
    <div
      ref={ref}
      className="
        relative
        aspect-[4/4.7]
        w-[72vw]
        max-w-[380px]
        overflow-hidden
      "
    >
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{
          clipPath:
            visible || reducedMotion
              ? "inset(0% 0% 0% 0%)"
              : "inset(100% 0% 0% 0%)",
          scale: visible || reducedMotion ? 1 : 1.08,
        }}
        transition={{
          duration: reducedMotion ? 0 : 1.1,
          ease,
        }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={alt}
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="72vw"
            className="object-cover"
          />
        )}
      </motion.div>
    </div>
  );
}
