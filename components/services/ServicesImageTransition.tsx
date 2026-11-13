"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

type Props = {
  activeIndex: number;
};

type SceneProps = Props & {
  visible: boolean;
  onIdle: () => void;
};

// --------------------------------------------------
// MEDIA
// --------------------------------------------------

const MEDIA = [
  {
    src: "/work/services-6.jpg",
    width: 1,
  },
  {
    src: "/work/services-9.jpg",
    width: 1.28,
  },
  {
    src: "/work/services-3.mp4",
    width: 1.42,
  },
] as const;

const IMAGES = [MEDIA[0].src, MEDIA[1].src];

const VIDEO_SRC = MEDIA[2].src;

// --------------------------------------------------
// SETTINGS
// --------------------------------------------------

const TRANSITION_DURATION = 1.2;

const DISSOLVE_SOFTNESS = 0.22;
const DISSOLVE_SCALE = 3.2;
const REFRACTION_STRENGTH = 0.016;

const BEND_ANGLE = 0.68;
const BEND_DEPTH = 0.4;
const BEND_SHADING = 0.085;

// Original: 2.8
// Less unused render area.
const CANVAS_SCALE = 2.1;

const SEGMENTS_X = 64;
const SEGMENTS_Y = 24;

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShader = `
  uniform float uWidth;
  uniform float uHeight;
  uniform float uOffsetX;

  uniform float uBend;
  uniform float uBendAngle;
  uniform float uBendDepth;

  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec2 p = position.xy;

    float angle = uBend * uBendAngle;
    float xFromRight = p.x - 0.5;

    float curvedX = xFromRight;
    float curvedZ = 0.0;

    if (angle > 0.0001) {
      curvedX = sin(xFromRight * angle) / angle;
      curvedZ = (1.0 - cos(xFromRight * angle)) / angle;
    }

    vec3 pos;

    pos.x = (curvedX + 0.5) * uWidth + uOffsetX;
    pos.y = p.y * uHeight;
    pos.z = curvedZ * uWidth * uBendDepth;

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(pos, 1.0);
  }
`;

// --------------------------------------------------
// FRAGMENT SHADER
// --------------------------------------------------

const fragmentShader = `
  uniform sampler2D uTexture0;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;

  uniform int uFrom;
  uniform int uTo;

  uniform float uProgress;
  uniform float uSoftness;
  uniform float uNoiseScale;
  uniform float uRefraction;

  uniform float uBend;
  uniform float uBendShading;

  varying vec2 vUv;

  const float PI = 3.14159265359;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(
      mix(a, b, u.x),
      mix(c, d, u.x),
      u.y
    );
  }

 vec4 sampleImage(int index, vec2 uv) {
  uv = clamp(uv, 0.0, 1.0);

  if (index == 0) {
    return texture2D(uTexture0, uv);
  }

  if (index == 1) {
    return texture2D(uTexture1, uv);
  }

  // Decode video from sRGB into linear color space.
  return sRGBTransferEOTF(texture2D(uTexture2, uv));
}

  void main() {
    vec3 color;

    // Skip expensive dissolve calculations
    // when there is no transition.
    if (uFrom == uTo) {
      color = sampleImage(uTo, vUv).rgb;
    } else {
      float p = clamp(uProgress, 0.0, 1.0);
      float energy = sin(p * PI);

      float largeNoise = noise2D(
        vUv * uNoiseScale + vec2(2.3, 4.7)
      );

      float detailNoise = noise2D(
        vUv * uNoiseScale * 2.3 + vec2(8.4, 1.7)
      );

      float pattern =
        largeNoise * 0.75 +
        detailNoise * 0.25;

      vec2 flow = vec2(
        noise2D(vUv * 4.2 + vec2(5.1, 2.3)),
        noise2D(vUv * 4.2 + vec2(1.6, 7.8))
      );

      flow = (flow - 0.5) * 2.0;

      vec2 displacement =
        flow * uRefraction * energy;

      vec3 outgoing = sampleImage(
        uFrom,
        vUv + displacement
      ).rgb;

      vec3 incoming = sampleImage(
        uTo,
        vUv - displacement
      ).rgb;

      float threshold = mix(
        -uSoftness,
        1.0 + uSoftness,
        p
      );

      float dissolve = smoothstep(
        pattern - uSoftness,
        pattern + uSoftness,
        threshold
      );

      color = mix(
        outgoing,
        incoming,
        dissolve
      );

      float shade =
        pow(1.0 - vUv.x, 1.5) *
        uBend *
        uBendShading;

      color *= 1.0 - shade;
    }

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function clampIndex(index: number) {
  return Math.max(0, Math.min(MEDIA.length - 1, index));
}

function getAspect(texture: THREE.Texture) {
  const image = texture.image as
    | {
        width?: number;
        height?: number;
      }
    | undefined;

  if (!image?.width || !image?.height) {
    return 1;
  }

  return image.width / image.height;
}

function ease(t: number) {
  const p = THREE.MathUtils.clamp(t, 0, 1);

  return p * p * (3 - 2 * p);
}

type Transition = {
  current: number;
  from: number;
  to: number;
  elapsed: number;
  running: boolean;
};

// --------------------------------------------------
// THREE.JS SCENE
// --------------------------------------------------

function MorphingImage({ activeIndex, visible, onIdle }: SceneProps) {
  const textures = useTexture(IMAGES);

  const [texture0, texture1] = textures;

  const { viewport } = useThree();

  const reducedMotion = useReducedMotion();

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoReadyRef = useRef(false);

  const videoAspectRef = useRef(16 / 9);

  const activeRef = useRef(activeIndex);
  const visibleRef = useRef(visible);

  const initialIndex = useRef(
    clampIndex(activeIndex) === 2 ? 0 : clampIndex(activeIndex),
  );

  const transition = useRef<Transition>({
    current: initialIndex.current,
    from: initialIndex.current,
    to: initialIndex.current,
    elapsed: 0,
    running: false,
  });

  const baseWidth = viewport.width / CANVAS_SCALE;

  // --------------------------------------------------
  // UNIFORMS
  // --------------------------------------------------

  const uniforms = useMemo(
    () => ({
      uTexture0: {
        value: texture0,
      },

      uTexture1: {
        value: texture1,
      },

      uTexture2: {
        value: texture0,
      },

      uFrom: {
        value: initialIndex.current,
      },

      uTo: {
        value: initialIndex.current,
      },

      uProgress: {
        value: 0,
      },

      uWidth: {
        value: baseWidth * MEDIA[initialIndex.current].width,
      },

      uHeight: {
        value:
          (baseWidth * MEDIA[initialIndex.current].width) /
          getAspect(textures[initialIndex.current]),
      },

      uOffsetX: {
        value:
          (baseWidth - baseWidth * MEDIA[initialIndex.current].width) * 0.5,
      },

      uBend: {
        value: 0,
      },

      uBendAngle: {
        value: BEND_ANGLE,
      },

      uBendDepth: {
        value: BEND_DEPTH,
      },

      uBendShading: {
        value: BEND_SHADING,
      },

      uSoftness: {
        value: DISSOLVE_SOFTNESS,
      },

      uNoiseScale: {
        value: DISSOLVE_SCALE,
      },

      uRefraction: {
        value: REFRACTION_STRENGTH,
      },
    }),
    // Keep uniforms stable during visibility changes.
    [texture0, texture1],
  );

  // --------------------------------------------------
  // TEXTURE SETTINGS
  // --------------------------------------------------

  useEffect(() => {
    [texture0, texture1].forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;

      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      texture.anisotropy = 4;
      texture.needsUpdate = true;
    });
  }, [texture0, texture1]);

  // --------------------------------------------------
  // VIDEO
  // --------------------------------------------------

  useEffect(() => {
    const video = document.createElement("video");

    video.src = VIDEO_SRC;

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;

    // Don't eagerly download/decode the entire
    // video before the user reaches service 3.
    video.preload = "metadata";

    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    videoRef.current = video;

    const videoTexture = new THREE.VideoTexture(video);

    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.generateMipmaps = false;

    const onReady = () => {
      if (!video.videoWidth || !video.videoHeight) {
        return;
      }

      videoAspectRef.current = video.videoWidth / video.videoHeight;

      videoReadyRef.current = true;

      const material = materialRef.current;

      if (material) {
        material.uniforms.uTexture2.value = videoTexture;
      }
    };

    const onError = () => {
      videoReadyRef.current = false;

      console.error("Could not load services video:", video.error);
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", onError);

    video.load();

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      onReady();
    }

    return () => {
      video.pause();

      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);

      video.removeAttribute("src");
      video.load();

      videoTexture.dispose();

      videoRef.current = null;
      videoReadyRef.current = false;
    };
  }, []);

  // --------------------------------------------------
  // VIDEO PLAYBACK CONTROL
  // --------------------------------------------------

  useEffect(() => {
    activeRef.current = activeIndex;
    visibleRef.current = visible;

    const video = videoRef.current;

    if (!video) return;

    const shouldPlay = visible && activeIndex === 2 && !reducedMotion;

    if (shouldPlay) {
      // Calling play also starts loading video data
      // when preload="metadata" was used.
      video.play().catch((error) => {
        console.warn("Could not play services video:", error);
      });
    } else {
      video.pause();
    }
  }, [activeIndex, visible, reducedMotion]);

  // --------------------------------------------------
  // FRAME ANIMATION
  // --------------------------------------------------

  useFrame((_, delta) => {
    const material = materialRef.current;

    if (!material) return;

    const u = material.uniforms;
    const t = transition.current;

    const requestedIndex = clampIndex(activeIndex);

    // Wait for the first actual video frame.
    const target =
      requestedIndex === 2 && !videoReadyRef.current ? t.to : requestedIndex;

    const settle = (index: number) => {
      t.current = index;
      t.from = index;
      t.to = index;
      t.elapsed = 0;
      t.running = false;

      u.uFrom.value = index;
      u.uTo.value = index;
      u.uProgress.value = 0;
    };

    if (reducedMotion) {
      settle(target);
    } else {
      if (target !== t.to) {
        const dominantImage =
          t.running && t.elapsed / TRANSITION_DURATION >= 0.5 ? t.to : t.from;

        t.current = dominantImage;
        t.from = dominantImage;
        t.to = target;
        t.elapsed = 0;
        t.running = dominantImage !== target;

        u.uFrom.value = t.from;
        u.uTo.value = t.to;
        u.uProgress.value = 0;
      }

      if (t.running) {
        // Allow more elapsed time at lower FPS.
        t.elapsed += Math.min(delta, 0.1);

        const linear = Math.min(t.elapsed / TRANSITION_DURATION, 1);

        u.uProgress.value = ease(linear);

        if (linear >= 1) {
          settle(t.to);
        }
      }
    }

    // ------------------------------------------------
    // PHYSICAL SIZE MORPH
    // ------------------------------------------------

    const from = t.from;
    const to = t.to;

    const progress = u.uProgress.value as number;

    const getWidth = (index: number) => {
      return baseWidth * MEDIA[index].width;
    };

    const getHeight = (index: number) => {
      const aspect =
        index === 2 ? videoAspectRef.current : getAspect(textures[index]);

      return getWidth(index) / aspect;
    };

    const width = THREE.MathUtils.lerp(getWidth(from), getWidth(to), progress);

    const height = THREE.MathUtils.lerp(
      getHeight(from),
      getHeight(to),
      progress,
    );

    const bend = Math.sin(progress * Math.PI);

    u.uWidth.value = width;
    u.uHeight.value = height;
    u.uBend.value = bend;

    // Same right-edge alignment as before.
    u.uOffsetX.value = baseWidth * 0.5 - width * 0.5;

    // Tell the parent when continuous rendering
    // is no longer needed.
    if (!t.running) {
      onIdle();
    }
  });

  // --------------------------------------------------
  // ONE THREE.JS PLANE
  // --------------------------------------------------

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1, SEGMENTS_X, SEGMENTS_Y]} />

      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
        depthTest={false}
        depthWrite={false}
        transparent={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// --------------------------------------------------
// CANVAS
// --------------------------------------------------

export default function ServicesImageTransition({ activeIndex }: Props) {
  const visibilityRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Observe the actual image area,
  // not the oversized WebGL canvas.
  useEffect(() => {
    const element = visibilityRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      {
        threshold: 0.01,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Start continuous rendering whenever the
  // image becomes visible or activeIndex changes.
  useEffect(() => {
    setAnimating(visible);
  }, [visible, activeIndex]);

  const handleIdle = useCallback(() => {
    setAnimating(false);
  }, []);

  // Stop WebGL offscreen.
  // Render static images on demand.
  // Render continuously during transitions/video.
  const frameloop = !visible
    ? "never"
    : animating || activeIndex === 2
      ? "always"
      : "demand";

  return (
    <>
      {/* Observer covering the actual image container */}
      <div
        ref={visibilityRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute"
        style={{
          width: `${CANVAS_SCALE * 100}%`,
          height: `${CANVAS_SCALE * 100}%`,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Canvas
          orthographic
          camera={{
            position: [0, 0, 10],
            zoom: 100,
            near: 0.1,
            far: 100,
          }}
          dpr={1.5}
          frameloop={frameloop}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            pointerEvents: "none",
          }}
        >
          <Suspense fallback={null}>
            <MorphingImage
              activeIndex={activeIndex}
              visible={visible}
              onIdle={handleIdle}
            />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}
