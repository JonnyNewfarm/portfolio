"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Project } from "@/sanity/getProjects";

import MobilePortfolio from "./MobilePortfolio";

type Props = {
  children: ReactNode;
  projects: Project[];
};

export default function ResponsiveViewport({ children, projects }: Props) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const update = () => {
      setIsMobile(media.matches);
    };

    update();

    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  if (isMobile === null) {
    return <div className="min-h-svh" />;
  }

  if (isMobile) {
    return <MobilePortfolio projects={projects} />;
  }

  return <>{children}</>;
}
