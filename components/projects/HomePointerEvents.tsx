"use client";

import { useEffect, type MutableRefObject } from "react";
import * as THREE from "three";
import type { HitMap, CameraMap, PointerMap } from "./projectShared";

/* HANDLE HOVER AND CLICKS OVER BOTH PERMANENT CANVASES */
export default function HomePointerEvents({
  selected,
  hits,
  cameras,
  pointers,
  hoveredRef,
  onHover,
  onClickImage,
}: {
  selected: number | null;
  hits: HitMap;
  cameras: CameraMap;
  pointers: PointerMap;
  hoveredRef: MutableRefObject<string | null>;
  onHover: (id: string | null) => void;
  onClickImage: (index: number) => void;
}) {
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const originalCursor = document.body.style.cursor;

    const hitAt = (event: PointerEvent) => {
      if (selected !== null) return null;

      ndc.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        1 - (event.clientY / window.innerHeight) * 2,
      );

      const found: {
        id: string;
        distance: number;
        uv?: THREE.Vector2;
      }[] = [];

      for (const [id, pair] of hits.current) {
        const camera = cameras.current.get(Number(id.replace("cover-", "")));

        if (!camera) continue;

        raycaster.setFromCamera(ndc, camera);

        for (const mesh of [pair.moving, pair.idle]) {
          if (!mesh?.visible || !mesh.parent?.visible) continue;

          mesh.updateWorldMatrix(true, false);

          const hit = raycaster.intersectObject(mesh, false)[0];

          if (hit) {
            found.push({
              id,
              distance: hit.distance,
              uv: hit.uv,
            });
          }
        }
      }

      found.sort((a, b) => a.distance - b.distance);

      return found.find((h) => h.id === hoveredRef.current) ?? found[0] ?? null;
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      const hit = hitAt(event);

      if (hit?.uv) {
        pointers.current
          .get(hit.id)
          ?.set((hit.uv.x - 0.5) * 2, (hit.uv.y - 0.5) * 2);
      }

      onHover(hit?.id ?? null);

      // Cursor pointer only when hovering a project
      document.body.style.cursor = hit ? "pointer" : originalCursor;
    };

    const click = (event: PointerEvent) => {
      if (event.button !== 0 || selected !== null) return;

      if (
        event.target instanceof Element &&
        event.target.closest("a,button,input,textarea,select")
      )
        return;

      const hit = hitAt(event);

      if (!hit) return;

      const index = Number(hit.id.replace("cover-", ""));

      if (index === 0 || index === 1) {
        onClickImage(index);
      }
    };

    const clear = () => {
      onHover(null);
      document.body.style.cursor = originalCursor;
    };

    window.addEventListener("pointermove", move, {
      passive: true,
    });
    window.addEventListener("pointerdown", click);
    window.addEventListener("blur", clear);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
      window.removeEventListener("blur", clear);

      document.body.style.cursor = originalCursor;
    };
  }, [selected, hits, cameras, pointers, hoveredRef, onHover, onClickImage]);

  return null;
}
