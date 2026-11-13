"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EMAIL = "jonasnygaard96@gmail.com";

const ease = [0.16, 1, 0.3, 1] as const;

const content = {
  description:
    "Have an idea, a project in mind, or a website that could be so much more? I design and develop thoughtful digital experiences, from custom websites to interactive details and animations. Whether you have a clear direction or just something you'd like to explore, I'd love to hear about it. Send me a message, and we can take it from there.",
  copied: "Copied!",
  error: "Couldn't copy email.",
  copyLabel: "Copy email address",
};

export default function ServicesContact() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!copied && !error) return;

    const timeout = window.setTimeout(() => {
      setCopied(false);
      setError(false);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [copied, error]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);

      setCopied(true);
      setError(false);
    } catch {
      try {
        const textarea = document.createElement("textarea");

        textarea.value = EMAIL;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.select();

        const success = document.execCommand("copy");

        document.body.removeChild(textarea);

        setCopied(success);
        setError(!success);
      } catch {
        setCopied(false);
        setError(true);
      }
    }
  };

  return (
    <section
      id="contact"
      className="
        relative
        flex
        min-h-[85svh]
        w-full
        items-center
        px-[3%]
        py-28
        md:min-h-screen
        md:py-40
      "
    >
      <div className="mx-auto w-full max-w-[1800px]">
        <motion.p
          initial={{
            y: reducedMotion ? 0 : 24,
          }}
          whileInView={{ y: 0 }}
          viewport={{
            once: true,
            amount: 0.1,
          }}
          transition={{
            duration: reducedMotion ? 0 : 1.1,
            ease,
          }}
          className="
            max-w-[1150px]
            text-[clamp(1.6rem,2.8vw,2.8rem)]
            font-medium
            leading-[1.35]
            tracking-[-0.045em]
          "
        >
          {content.description}
        </motion.p>

        <motion.div
          initial={{
            y: reducedMotion ? 0 : 16,
          }}
          whileInView={{ y: 0 }}
          viewport={{
            once: true,
            amount: 0.1,
          }}
          transition={{
            duration: reducedMotion ? 0 : 0.9,
            delay: reducedMotion ? 0 : 0.15,
            ease,
          }}
          className="mt-12 md:mt-20"
        >
          <button
            type="button"
            onClick={copyEmail}
            aria-label={`${content.copyLabel}: ${EMAIL}`}
            className="
              group
              inline-flex
              max-w-full
              cursor-pointer
              items-center
              gap-3
              text-left
              text-[clamp(1.05rem,1.8vw,1.5rem)]
              tracking-[-0.025em]
              transition-opacity
              duration-300
              hover:opacity-60
            "
          >
            <span className="break-all">{EMAIL}</span>

            {copied ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
                aria-hidden="true"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="
                  shrink-0
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                  group-hover:-translate-y-1
                "
                aria-hidden="true"
              >
                <rect x="8" y="8" width="12" height="12" rx="1" />
                <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
              </svg>
            )}
          </button>

          <div
            className="mt-3 min-h-6 text-sm"
            role="status"
            aria-live="polite"
          >
            {copied ? content.copied : error ? content.error : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
