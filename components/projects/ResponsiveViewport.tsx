"use client";

import { useEffect, useState, type ReactNode } from "react";

import MobilePortfolio from "./MobilePortfolio";

export default function ResponsiveViewport({
  children,
}: {
  children: ReactNode;
}) {
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
    return <MobilePortfolio />;
  }

  return <>{children}</>;
}
