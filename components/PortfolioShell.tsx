"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { usePathname } from "next/navigation";
import gsap from "gsap";

import NavbarLayer from "@/components/NavbarLayer";
import SitePreloader from "@/components/SitePreloader";

type Props = {
  children: ReactNode;
};

const HomeRevealContext = createContext(false);

export function useHomeRevealOnNavigation() {
  return useContext(HomeRevealContext);
}

export default function PortfolioShell({ children }: Props) {
  const pathname = usePathname();

  const previousPathRef = useRef(pathname);

  const [entryPath] = useState(pathname);

  const [hasVisitedServices, setHasVisitedServices] = useState(
    entryPath.startsWith("/services"),
  );

  useEffect(() => {
    if (pathname.startsWith("/services")) {
      setHasVisitedServices(true);
    }
  }, [pathname]);

  // --------------------------------------------------
  // REVEAL MY WORK WHEN RETURNING FROM SERVICES
  // --------------------------------------------------

  useEffect(() => {
    const previousPath = previousPathRef.current;

    previousPathRef.current = pathname;

    const returningFromServices =
      previousPath.startsWith("/services") && pathname === "/";

    if (!returningFromServices) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    let covers: HTMLElement[] = [];

    let started = false;

    let viewportObserver: IntersectionObserver | null = null;

    const reveal = (element: HTMLElement) => {
      gsap.to(element, {
        y: 0,
        autoAlpha: 1,
        duration: 1.1,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
      });
    };

    const findCovers = () => {
      if (isMobile) {
        return Array.from(
          document.querySelectorAll<HTMLElement>("#selected-work a"),
        ).slice(0, 2);
      }

      return Array.from(
        document.querySelectorAll<HTMLElement>(
          'div[aria-hidden="true"].pointer-events-none.fixed.inset-0',
        ),
      )
        .filter(
          (element) =>
            Boolean(element.querySelector("canvas")) &&
            Boolean(element.style.zIndex),
        )
        .slice(0, 2);
    };

    let domObserver: MutationObserver | null = null;

    const startReveal = () => {
      if (started) return;

      const elements = findCovers();

      if (elements.length < 2) return;

      started = true;

      domObserver?.disconnect();

      covers = elements;

      gsap.set(covers, {
        y: isMobile ? 45 : 85,
        autoAlpha: 0,
      });

      if (isMobile && "IntersectionObserver" in window) {
        viewportObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;

              viewportObserver?.unobserve(entry.target);

              reveal(entry.target as HTMLElement);
            });
          },
          {
            threshold: 0.08,
            rootMargin: "0px 0px -30px 0px",
          },
        );

        covers.forEach((cover) => {
          viewportObserver?.observe(cover);
        });

        return;
      }

      gsap.to(covers, {
        y: 0,
        autoAlpha: 1,
        duration: 1.1,
        stagger: 0.12,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
      });
    };

    // Wait for the Home project canvases to mount.
    domObserver = new MutationObserver(startReveal);

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    startReveal();

    return () => {
      domObserver?.disconnect();
      viewportObserver?.disconnect();

      gsap.killTweensOf(covers);

      if (covers.length) {
        gsap.set(covers, {
          clearProps: "transform,opacity,visibility",
        });
      }
    };
  }, [pathname]);

  // Keep project detail URLs in the Home group.
  const routeGroup = pathname.startsWith("/services") ? "services" : "home";

  return (
    <HomeRevealContext.Provider value={hasVisitedServices}>
      <SitePreloader key={routeGroup} entryPath={pathname}>
        <NavbarLayer />
        {children}
      </SitePreloader>
    </HomeRevealContext.Provider>
  );
}
