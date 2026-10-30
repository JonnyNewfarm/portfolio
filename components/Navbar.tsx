"use client";

import { useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const LINKEDIN_URL = "https://www.linkedin.com/in/jonas-nygaard-0aa767366";
const GITHUB_URL = "https://github.com/JonnyNewfarm";

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
  const [theme, setTheme] = useState<Theme>("light");

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

  const changeTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
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

          sm:gap-x-4
          sm:text-[12px]

          md:text-[14px]

          lg:gap-x-5
          lg:text-[14px]

          xl:text-[15px]
        "
      >
        {/* NAME - ALWAYS VISIBLE */}

        <a
          href="/"
          className="shrink-0 whitespace-nowrap transition-opacity duration-300 hover:opacity-50"
        >
          <IntroText>NAME / JONAS NYGAARD</IntroText>
        </a>

        {/* ROLE - XL AND UP */}

        <span className="hidden shrink-0 whitespace-nowrap xl:inline-flex">
          <IntroText>DESIGNER / DEVELOPER</IntroText>
        </span>

        {/* LOCATION - LG AND UP */}

        <span className="hidden shrink-0 whitespace-nowrap lg:inline-flex">
          <IntroText>LOCATION / OSLO, NORWAY</IntroText>
        </span>

        {/* RIGHT GROUP
            Below LG: grouped close together.
            LG and above: separate flex items.
        */}

        <div
          className="
            ml-auto
            flex
            shrink-0
            items-center
            gap-x-3
            sm:gap-x-5
            lg:contents
          "
        >
          {/* LIGHT / DARK */}

          <div
            className="flex shrink-0 items-center whitespace-nowrap"
            aria-label="Color theme"
          >
            <IntroText>
              <button
                type="button"
                onClick={() => changeTheme("light")}
                aria-pressed={theme === "light"}
                className={`cursor-pointer transition-opacity duration-300 ${
                  theme === "light"
                    ? "opacity-100"
                    : "opacity-35 hover:opacity-70"
                }`}
              >
                LIGHT
              </button>

              <span className="px-1 opacity-40 sm:px-1.5">/</span>

              <button
                type="button"
                onClick={() => changeTheme("dark")}
                aria-pressed={theme === "dark"}
                className={`cursor-pointer transition-opacity duration-300 ${
                  theme === "dark"
                    ? "opacity-100"
                    : "opacity-35 hover:opacity-70"
                }`}
              >
                DARK
              </button>
            </IntroText>
          </div>

          {/* SOCIALS */}

          <div className="flex shrink-0 items-center whitespace-nowrap">
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
            </IntroText>
          </div>
        </div>
      </nav>
    </header>
  );
}
