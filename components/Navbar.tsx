"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

const LINKEDIN_URL = "https://www.linkedin.com/in/jonas-nygaard-0aa767366";

const GITHUB_URL = "https://github.com/JonnyNewfarm";

const EMAIL = "jonasnygaard96@gmail.com";

function IntroText({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex overflow-hidden align-top">
      <span
        data-intro-nav
        className="inline-flex items-center whitespace-nowrap"
      >
        {children}
      </span>
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const [theme, setTheme] = useState<Theme>("light");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");

    const initialTheme: Theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.dataset.theme = initialTheme;
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  const changeTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);

    document.documentElement.dataset.theme = nextTheme;

    localStorage.setItem("theme", nextTheme);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
    } catch {
      const textarea = document.createElement("textarea");

      textarea.value = EMAIL;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();

      const success = document.execCommand("copy");

      textarea.remove();
      setCopied(success);
    }
  };

  return (
    <header className="w-full px-3 pt-7 sm:px-6 md:px-10 md:pt-9 lg:px-[3.1%]">
      <nav
        aria-label="Main navigation"
        className="
          flex
          w-full
          flex-nowrap
          items-start
          justify-between
          gap-x-2
          whitespace-nowrap
          text-[clamp(9px,2.65vw,12px)]
          font-extrabold
          leading-none
          tracking-[0.01em]

          sm:gap-x-3
          sm:text-[12px]

          md:gap-x-4
          md:text-[14px]

          lg:gap-x-5
          lg:text-[14px]

          xl:text-[15px]
        "
      >
        {/* NAME */}

        <Link
          href="/"
          className="
            shrink-0
            whitespace-nowrap
            transition-opacity
            duration-300
            hover:opacity-50
          "
        >
          <IntroText>
            <span className="hidden sm:inline">NAME / JONAS NYGAARD</span>

            <span className="sm:hidden">JONAS NYGAARD</span>
          </IntroText>
        </Link>

        {/* ROLE */}

        <span className="hidden shrink-0 whitespace-nowrap xl:inline-flex">
          <IntroText>DESIGNER / DEVELOPER</IntroText>
        </span>

        {/* THEME */}

        <div
          className="flex shrink-0 items-center whitespace-nowrap"
          aria-label="Color theme"
        >
          <IntroText>
            <button
              type="button"
              onClick={() => changeTheme("light")}
              aria-pressed={theme === "light"}
              className={`
                cursor-pointer
                transition-opacity
                duration-300
                ${
                  theme === "light"
                    ? "opacity-100"
                    : "opacity-35 hover:opacity-70"
                }
              `}
            >
              LIGHT
            </button>

            <span className="px-1 opacity-40 sm:px-1.5">/</span>

            <button
              type="button"
              onClick={() => changeTheme("dark")}
              aria-pressed={theme === "dark"}
              className={`
                cursor-pointer
                transition-opacity
                duration-300
                ${
                  theme === "dark"
                    ? "opacity-100"
                    : "opacity-35 hover:opacity-70"
                }
              `}
            >
              DARK
            </button>
          </IntroText>
        </div>

        {/* SOCIALS */}

        <div className="hidden shrink-0 items-center whitespace-nowrap sm:flex">
          <IntroText>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity duration-300 hover:opacity-50"
            >
              LINKEDIN
            </a>

            <span className="px-1 opacity-40 sm:px-1.5">/</span>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity duration-300 hover:opacity-50"
            >
              GITHUB
            </a>

            <span className="px-1 opacity-40 sm:px-1.5">/</span>

            <button
              type="button"
              onClick={copyEmail}
              aria-label={`Copy email address ${EMAIL}`}
              className="
                cursor-pointer
                transition-opacity
                duration-300
                hover:opacity-50
              "
            >
              {copied ? "COPIED!" : "EMAIL"}
            </button>
          </IntroText>
        </div>

        {/* NAVIGATION */}

        <div className="flex shrink-0 items-center whitespace-nowrap">
          <IntroText>
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className={`
                hidden
                transition-opacity
                duration-300
                hover:opacity-50
                sm:inline
                ${pathname === "/" ? "opacity-100" : "opacity-50"}
              `}
            >
              HOME
            </Link>

            <span className="hidden px-1 opacity-40 sm:inline sm:px-1.5">
              /
            </span>

            <Link
              href="/services"
              aria-current={pathname === "/services" ? "page" : undefined}
              className={`
                transition-opacity
                duration-300
                hover:opacity-50
                ${pathname === "/services" ? "opacity-100" : "opacity-50"}
              `}
            >
              SERVICES
            </Link>
          </IntroText>
        </div>
      </nav>

      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Email copied to clipboard" : ""}
      </span>
    </header>
  );
}
