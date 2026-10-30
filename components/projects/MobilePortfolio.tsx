"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PROJECTS } from "@/lib/projects";

const LINKEDIN_URL = "https://www.linkedin.com/in/jonas-nygaard-0aa767366";
const GITHUB_URL = "https://github.com/JonnyNewfarm";

/* =========================================================
   MOBILE HEADER
========================================================= */

function MobileHeader() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");

    const initial: "light" | "dark" =
      stored === "light" || stored === "dark"
        ? stored
        : document.documentElement.dataset.theme === "dark"
          ? "dark"
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

    document.documentElement.dataset.theme = initial;
    setTheme(initial);
  }, []);

  const changeTheme = () => {
    const next = theme === "light" ? "dark" : "light";

    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  };

  return (
    <header className="relative z-20 flex items-start justify-between gap-4 px-[5vw] pt-7">
      <Link
        href="/"
        className="font-bueno text-[13px] font-bold uppercase leading-none"
      >
        NAME / JONAS NYGAARD
      </Link>

      <button
        type="button"
        onClick={changeTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        className="cursor-pointer font-bueno text-[13px] font-bold uppercase leading-none"
      >
        {theme === "light" ? "DARK" : "LIGHT"} MODE
      </button>
    </header>
  );
}

/* =========================================================
   MOBILE PORTRAIT
========================================================= */

function MobilePortrait() {
  return (
    <figure className="mt-10 flex justify-end">
      <div className="w-[min(48vw,230px)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/portrait.jpg"
          alt="Portrait of Jonas Nygaard"
          width={800}
          height={1000}
          decoding="async"
          draggable={false}
          className="block aspect-[4/5] w-full object-cover"
        />

        <figcaption className="mt-3 flex items-center justify-between gap-3 font-bueno text-[11px] font-bold uppercase leading-none">
          <span>PORTRAIT / 2026</span>
          <span>AGE / 30</span>
        </figcaption>
      </div>
    </figure>
  );
}

/* =========================================================
   MOBILE HOME
========================================================= */

function MobileHome() {
  return (
    <main className="min-h-svh overflow-x-hidden">
      <MobileHeader />

      {/* HERO */}

      <section className="px-[5vw] pt-[clamp(80px,11svh,140px)]">
        <p className="mb-5 font-sans invisible text-[10px] font-medium uppercase tracking-[0.12em] opacity-60">
          Independent designer & developer
        </p>

        <h1 className="font-bueno text-[clamp(34px,9vw,68px)] font-bold uppercase leading-[0.98] tracking-[-0.025em]">
          <span className="block">DESIGNER &amp;</span>
          <span className="block">DEVELOPER</span>
          <span className="mt-2 block">CRAFTING</span>
          <span className="block">INTERACTIVE</span>
          <span className="block">EXPERIENCES.</span>
        </h1>

        <MobilePortrait />
      </section>

      {/* SELECTED WORK */}

      <section
        id="selected-work"
        aria-label="Selected work"
        className="px-[5vw] pb-20 pt-20"
      >
        <div className="mb-8 flex items-center justify-between pb-4">
          <h2 className="font-bueno text-[18px] font-bold uppercase">
            SELECTED WORK / 02
          </h2>
        </div>

        <div className="flex flex-col gap-16">
          {PROJECTS.slice(0, 2).map((project, index) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="block w-full cursor-pointer"
            >
              {/* PROJECT COVER */}

              <div className="w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.images[0]}
                  alt={project.title}
                  width={1200}
                  height={1500}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="block h-auto w-full"
                />
              </div>

              {/* PROJECT INFORMATION */}

              <div className="mt-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.1em] opacity-60">
                    {String(index + 1).padStart(2, "0")}
                    {" / "}
                    {project.category}
                  </p>

                  <h3 className="font-bueno text-[clamp(23px,6.2vw,36px)] font-bold uppercase leading-none">
                    {project.title}
                  </h3>
                </div>

                <span className="shrink-0 font-sans text-[11px] font-medium">
                  {project.year}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================================================
         FOOTER - SOCIAL LINKS ADDED
      =================================================== */}

      <footer className="border-t border-current/20 px-[5vw] pb-8 pt-6 font-sans text-[10px] font-bold uppercase">
        <div className="flex items-center justify-between gap-4">
          <span>OSLO, NORWAY</span>
          <span>© 2026 JONAS NYGAARD</span>
        </div>

        <nav
          aria-label="Social links"
          className="mt-6 flex items-center justify-end gap-2"
        >
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity duration-200 hover:opacity-50"
          >
            LINKEDIN
          </a>

          <span className="">/</span>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity duration-200 hover:opacity-50"
          >
            GITHUB
          </a>
        </nav>
      </footer>
    </main>
  );
}

/* =========================================================
   MOBILE PROJECT DETAILS
========================================================= */

function MobileProjectDetail({ index }: { index: number }) {
  const project = PROJECTS[index];

  return (
    <main className="min-h-svh bg-[#181716] text-[#e7e3dd]">
      {/* BACK BUTTON */}

      <header className="flex items-center justify-between px-[5vw] pt-7">
        <Link
          href="/#selected-work"
          className="font-bueno text-[13px] font-bold uppercase"
        >
          ← BACK
        </Link>

        <span className="font-sans text-[10px] font-medium uppercase tracking-[0.12em]">
          PROJECT / {String(index + 1).padStart(2, "0")}
        </span>
      </header>

      {/* PROJECT INTRO */}

      <section className="px-[5vw] pb-12 pt-20">
        <p className="mb-5 font-sans text-[10px] uppercase tracking-[0.13em] text-white/60">
          {project.category} / {project.year}
        </p>

        <h1 className="max-w-[90vw] font-bueno text-[clamp(40px,12vw,76px)] font-bold uppercase leading-[0.95] tracking-[-0.025em]">
          {project.title}
        </h1>

        <p className="mt-10 max-w-[550px] font-sans text-[clamp(16px,4.2vw,20px)] font-medium leading-[1.35]">
          {project.intro}
        </p>

        {/* CREDITS */}

        <div className="mt-12 grid grid-cols-3 gap-3 border-t border-white/20 pt-5">
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
            <div key={item.label} className="min-w-0">
              <p className="font-sans text-[9px] uppercase tracking-[0.08em] text-white/50">
                {item.label}
              </p>

              <p className="mt-2 font-sans text-[11px] leading-[1.4]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* DESCRIPTION */}

        <div className="mt-12 max-w-[550px]">
          <p className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.1em]">
            THE PROJECT:
          </p>

          <p className="font-sans text-[13px] leading-[1.7] text-white/70">
            {project.description}
          </p>
        </div>
      </section>

      {/* IMAGE GALLERY - NO FULLSCREEN */}

      <section
        aria-label={`${project.title} gallery`}
        className="flex flex-col gap-10 pb-16"
      >
        {project.images.map((src, imageIndex) => (
          <figure key={`${src}-${imageIndex}`} className="w-full">
            <div className="px-[5vw]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${project.title}, image ${imageIndex + 1}`}
                width={1200}
                height={1500}
                loading={imageIndex === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="block h-auto w-full"
              />
            </div>

            <figcaption className="mt-3 flex items-center justify-between px-[5vw] font-sans text-[10px] uppercase text-white/55">
              <span>{project.title}</span>

              <span>
                {String(imageIndex + 1).padStart(2, "0")}
                {" / "}
                {String(project.images.length).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>
        ))}
      </section>

      {/* LIVE PROJECT */}

      {project.liveUrl.trim() && (
        <div className="border-t border-white/20 px-[5vw] py-10">
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-bueno text-[20px] font-bold uppercase"
          >
            VIEW LIVE PROJECT
          </a>
        </div>
      )}

      {/* BACK TO WORK */}

      <div className="px-[5vw] pb-12">
        <Link
          href="/#selected-work"
          className="font-sans text-[12px] font-medium uppercase text-white/70"
        >
          ← BACK TO SELECTED WORK
        </Link>
      </div>
    </main>
  );
}

/* =========================================================
   MOBILE ROUTING
========================================================= */

export default function MobilePortfolio() {
  const pathname = usePathname();

  const slug = pathname.startsWith("/projects/")
    ? pathname.split("/")[2]
    : null;

  const projectIndex = PROJECTS.findIndex((project) => project.slug === slug);

  useEffect(() => {
    if (projectIndex >= 0) {
      window.scrollTo(0, 0);
    }
  }, [projectIndex]);

  return projectIndex >= 0 ? (
    <MobileProjectDetail index={projectIndex} />
  ) : (
    <MobileHome />
  );
}
