"use client";

import { useEffect, useState, type ReactNode } from "react";

function IntroText({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex overflow-hidden align-top">
      <span data-intro-meta className="inline-block whitespace-nowrap">
        {children}
      </span>
    </span>
  );
}

export default function BottomMeta() {
  const [localTime, setLocalTime] = useState("--:--");
  const [timeZone, setTimeZone] = useState("CET");

  useEffect(() => {
    const updateTime = () => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Oslo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }).formatToParts(new Date());

      const getPart = (type: string) =>
        parts.find((part) => part.type === type)?.value ?? "";

      setLocalTime(`${getPart("hour")}:${getPart("minute")}`);

      setTimeZone(getPart("timeZoneName") || "CET");
    };

    updateTime();

    const interval = window.setInterval(updateTime, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="
        pointer-events-none
        fixed
        bottom-[3.2svh]
        right-[3.2vw]
        z-20
        flex
        items-center
        justify-end
        gap-[clamp(30px,4.5vw,90px)]
        whitespace-nowrap
        text-[clamp(13px,1.2vw,18px)]
        font-extrabold
        uppercase
        leading-none
        tracking-[-0.015em]

        max-md:bottom-[2.5svh]
        max-md:left-[5vw]
        max-md:right-[5vw]
        max-md:justify-between
        max-md:gap-3
        max-md:text-[12px]
      "
    >
      <IntroText>
        <span className="hidden lg:block">STATUS / OPEN FOR WORK</span>
      </IntroText>

      <IntroText>
        LOCAL TIME / {localTime} ({timeZone})
      </IntroText>

      <IntroText>PORTFOLIO / 2026</IntroText>
    </div>
  );
}
