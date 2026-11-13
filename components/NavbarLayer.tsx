"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarLayer() {
  const pathname = usePathname();

  const isHome = pathname === "/";

  return (
    <div
      data-portfolio-navbar
      className={
        isHome
          ? "absolute inset-x-0 top-0 z-[100]"
          : "absolute inset-x-0 top-0 z-10"
      }
    >
      <Navbar />
    </div>
  );
}
