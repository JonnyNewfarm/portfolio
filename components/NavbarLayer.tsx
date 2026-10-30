"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarLayer() {
  const pathname = usePathname();

  const isHome = pathname === "/";

  return (
    <div
      data-portfolio-navbar
      className={isHome ? "relative z-[100]" : "relative z-10"}
    >
      <Navbar />
    </div>
  );
}
