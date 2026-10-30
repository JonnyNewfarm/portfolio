
"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Rect } from "./projectShared";

export function useHomeAnchor() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();

      setRect((p) =>
        p &&
        p.left === r.left &&
        p.top === r.top &&
        p.width === r.width &&
        p.height === r.height
          ? p
          : {
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
            },
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return { ref, rect };
}
