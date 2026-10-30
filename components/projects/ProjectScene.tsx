"use client";

import { Suspense, useLayoutEffect, type MutableRefObject } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import ImageCard from "./ImageCard";
import type {
  Rect,
  CameraMap,
  ProgressRef,
  HitMap,
  PointerMap,
  TitleMap,
} from "./projectShared";

function AnchorCamera({
  anchor,
  index,
  cameras,
}: {
  anchor: Rect;
  index: number;
  cameras: CameraMap;
}) {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    cameras.current.set(index, camera);

    return () => {
      cameras.current.delete(index);
    };
  }, [camera, cameras, index]);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !anchor.height) {
      return;
    }

    const half = THREE.MathUtils.degToRad(19);

    camera.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan((Math.tan(half) * size.height) / anchor.height),
    );

    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();

    const nx = ((anchor.left + anchor.width / 2) / size.width) * 2 - 1;

    const ny = 1 - ((anchor.top + anchor.height / 2) / size.height) * 2;

    camera.projectionMatrix.elements[8] = -nx;
    camera.projectionMatrix.elements[9] = -ny;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    camera.updateMatrixWorld(true);
  }, [anchor, camera, size.width, size.height]);

  return null;
}

export default function ProjectScene({
  anchor,
  index,
  cameras,
  selected,
  hovered,
  progress,
  target,
  handoff,
  hits,
  pointers,
  titles,
  closing,
}: {
  anchor: Rect;
  index: number;
  cameras: CameraMap;
  selected: number | null;
  hovered: string | null;
  progress: ProgressRef;
  target: MutableRefObject<HTMLDivElement | null>;
  handoff: ProgressRef;
  hits: HitMap;
  pointers: PointerMap;
  titles: TitleMap;
  closing: MutableRefObject<boolean>;
}) {
  return (
    <>
      <AnchorCamera anchor={anchor} index={index} cameras={cameras} />

      <Suspense fallback={null}>
        <ImageCard
          index={index}
          selected={selected}
          hovered={hovered}
          hits={hits}
          pointers={pointers}
          progress={progress}
          target={target}
          handoff={handoff}
          titles={titles}
          closing={closing}
        />
      </Suspense>
    </>
  );
}
