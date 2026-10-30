"use client";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { PROJECTS } from "@/lib/projects";
import ProjectDetailsInfo from "./ProjectDetailsInfo";
import {
  TRANSITION_DURATION,
  type Hit,
  type ScrollControl,
} from "./projectShared";
import { useHomeAnchor } from "./useHomeAnchor";
import { useInitialProjectSlug } from "./ProjectRouteContext";
import HomePointerEvents from "./HomePointerEvents";
import GalleryThreeImages from "./GalleryThreeImages";
import ProjectScene from "./ProjectScene";
import ProjectCursor from "./ProjectCursor";
/* ROUTING */
const HISTORY_KEY = "__portfolioProjectOpened";
// Give the gallery a brief chance to mount and its layout to settle.
// Never wait indefinitely for all WebGL textures.
const OPENING_WARMUP_MS = 170;
function getProjectIndex(pathname: string) {
  const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
  if (!match) return -1;
  return PROJECTS.findIndex((project) => project.slug === match[1]);
}
function getProjectPath(index: number) {
  return `/projects/${PROJECTS[index].slug}`;
}
function wasOpenedFromHomepage() {
  const state = window.history.state as Record<string, unknown> | null;
  return state?.[HISTORY_KEY] === true;
}
export default function SelectedWork() {
  const router = useRouter();
  /*
  
     * On "/" this is null.
  
     *
  
     * On a direct project URL, the server provides
  
     * the slug BEFORE SelectedWork renders.
  
     */
  const initialSlug = useInitialProjectSlug();
  const initialIndex = initialSlug
    ? PROJECTS.findIndex((project) => project.slug === initialSlug)
    : -1;
  const initialSelected = initialIndex >= 0 ? initialIndex : null;
  const directProject = initialSelected !== null;
  /* STATES */
  const [selected, setSelected] = useState<number | null>(initialSelected);
  const [backdropActive, setBackdropActive] = useState(directProject);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrollAllowed, setScrollAllowed] = useState(directProject);
  const [returning, setReturning] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [galleryWebglReady, setGalleryWebglReady] = useState(false);
  const [isGalleryFocused, setIsGalleryFocused] = useState(false);
  /* REFS */
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<number | null>(initialSelected);
  /*
  
     * IMPORTANT:
  
     *
  
     * Normal homepage:
  
     * progress = 0, handoff = 0
  
     *
  
     * Direct project route:
  
     * progress = 1, handoff = 1
  
     *
  
     * This skips the cover animation ONLY on
  
     * initial direct project navigation.
  
     */
  const progress = useRef({
    value: directProject ? 1 : 0,
  });
  const handoff = useRef({
    value: directProject ? 1 : 0,
  });
  const tween = useRef<gsap.core.Tween | null>(null);
  const handoffTween = useRef<gsap.core.Tween | null>(null);
  // The cover may move before gallery textures finish loading.
  // Only the handoff waits for the gallery.
  const openingFinished = useRef(false);
  const galleryReadyRef = useRef(directProject);
  const focusTween = useRef<gsap.core.Tween | null>(null);
  const focus = useRef<{
    key: string | null;
    value: number;
  }>({
    key: null,
    value: 0,
  });
  const focusReturning = useRef(false);
  const hits = useRef(new Map<string, Hit>());
  const cameras = useRef(new Map<number, THREE.Camera>());
  const pointers = useRef(new Map<string, THREE.Vector2>());
  const scrollControl = useRef<ScrollControl | null>(null);
  const firstTarget = useRef<HTMLDivElement>(null);
  const titleNodes = useRef(new Map<number, HTMLDivElement | null>());
  const titleWasFocused = useRef(false);
  const closing = useRef(false);
  const { ref: homeAnchor, rect: homeRect } = useHomeAnchor();
  const anchorReady = homeRect !== null;
  /* HOVER */
  const onHover = useCallback((id: string | null) => {
    if (hoveredRef.current === id) return;
    hoveredRef.current = id;
    setHovered(id);
  }, []);
  /* GALLERY READY / SAFE HANDOFF */
  const startHandoff = useCallback(() => {
    if (
      !openingFinished.current ||
      !galleryReadyRef.current ||
      selectedRef.current === null ||
      closing.current
    ) {
      return;
    }
    openingFinished.current = false;
    handoffTween.current?.kill();
    handoffTween.current = gsap.to(handoff.current, {
      value: 1,
      duration: 0.2,
      ease: "power1.out",
      overwrite: true,
      onComplete: () => {
        if (!closing.current) setScrollAllowed(true);
      },
    });
  }, []);
  const onGalleryWebglReady = useCallback(() => {
    galleryReadyRef.current = true;
    setGalleryWebglReady(true);
    startHandoff();
  }, [startHandoff]);
  /* TITLE REVEAL */
  useLayoutEffect(() => {
    const allTitles = Array.from(titleNodes.current.values())
      .map((node) => node?.querySelector<HTMLElement>("[data-title-reveal]"))
      .filter((node): node is HTMLElement => Boolean(node));
    if (selected === null) {
      gsap.killTweensOf(allTitles);
      gsap.set(allTitles, {
        yPercent: 0,
        autoAlpha: 1,
      });
      titleWasFocused.current = false;
      return;
    }
    const title = titleNodes.current
      .get(selected)
      ?.querySelector<HTMLElement>("[data-title-reveal]");
    if (!title) return;
    gsap.killTweensOf(title);
    if (isGalleryFocused) {
      titleWasFocused.current = true;
      gsap.to(title, {
        yPercent: 110,
        autoAlpha: 0,
        duration: 0.45,
        ease: "power3.inOut",
        overwrite: true,
      });
      return;
    }
    if (titleWasFocused.current) {
      titleWasFocused.current = false;
      gsap.fromTo(
        title,
        {
          yPercent: 110,
          autoAlpha: 0,
        },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 1.35,
          ease: "expo.out",
          overwrite: true,
        },
      );
    }
  }, [selected, isGalleryFocused]);
  /* RESET GALLERY FOCUS */
  const resetGalleryFocus = useCallback(() => {
    focusTween.current?.kill();
    focus.current.key = null;
    focus.current.value = 0;
    focusReturning.current = false;
    setIsGalleryFocused(false);
  }, []);
  /* FOCUS IMAGE */
  const onFocusImage = useCallback(
    (key: string) => {
      if (!scrollAllowed || closing.current || focus.current.key) {
        return;
      }
      focusTween.current?.kill();
      focusReturning.current = false;
      focus.current.key = key;
      focus.current.value = 0;
      setIsGalleryFocused(true);
      focusTween.current = gsap.to(focus.current, {
        value: 1,
        duration: 0.9,
        ease: "power3.inOut",
        overwrite: true,
      });
    },
    [scrollAllowed],
  );
  /* UNFOCUS IMAGE */
  const onUnfocusImage = useCallback(() => {
    if (!focus.current.key || focusReturning.current) {
      return;
    }
    focusReturning.current = true;
    focusTween.current?.kill();
    focusTween.current = gsap.to(focus.current, {
      value: 0,
      duration: 0.85,
      ease: "power3.inOut",
      overwrite: true,
      onComplete: resetGalleryFocus,
    });
  }, [resetGalleryFocus]);
  /* OPEN PROJECT */
  const openImage = useCallback(
    (index: number, fromHistory = false) => {
      if (selectedRef.current !== null || closing.current) {
        return;
      }
      const project = PROJECTS[index];
      if (!project) return;
      tween.current?.kill();
      handoffTween.current?.kill();
      onHover(null);
      resetGalleryFocus();
      closing.current = false;
      /*
  
         * Preserve the ORIGINAL opening animation.
  
         *
  
         * The clicked cover still begins from
  
         * its exact homepage position.
  
         */
      progress.current.value = 0;
      handoff.current.value = 0;
      openingFinished.current = false;
      galleryReadyRef.current = false;
      setGalleryWebglReady(false);
      setScrollAllowed(false);
      setReturning(false);
      setReversing(false);
      selectedRef.current = index;
      setSelected(index);
      /*
  
         * Update URL without remounting the scene.
  
         *
  
         * We use pushState when clicking a cover,
  
         * not router.push().
  
         *
  
         * This keeps the current R3F Canvas alive.
  
         */
      if (!fromHistory) {
        const path = getProjectPath(index);
        if (window.location.pathname !== path) {
          window.history.pushState(
            {
              [HISTORY_KEY]: true,
            },
            "",
            path,
          );
        }
      }
    },
    [onHover, resetGalleryFocus],
  );
  /* CLOSE PROJECT */
  const closeImage = useCallback(
    (fromHistory = false) => {
      if (selectedRef.current === null || closing.current) {
        return;
      }
      closing.current = true;
      openingFinished.current = false;
      /*
  
         * When opening a direct project link,
  
         * replace the route AFTER the closing
  
         * animation has finished.
  
         *
  
         * When opening from the homepage,
  
         * browser Back restores the homepage URL
  
         * without recreating the R3F scene.
  
         */
      let navigateHomeAfterClose = false;
      if (!fromHistory) {
        const isProjectRoute = getProjectIndex(window.location.pathname) !== -1;
        if (isProjectRoute) {
          if (wasOpenedFromHomepage()) {
            window.history.back();
          } else {
            navigateHomeAfterClose = true;
          }
        }
      }
      tween.current?.kill();
      handoffTween.current?.kill();
      resetGalleryFocus();
      setReturning(true);
      /* REVERSE TRANSITION */
      const reverse = () => {
        handoffTween.current?.kill();
        handoffTween.current = gsap.to(handoff.current, {
          value: 0,
          duration: 0.2,
          ease: "power1.inOut",
          overwrite: true,
          onComplete: () => {
            setScrollAllowed(false);
            setReversing(true);
            setBackdropActive(false);
            onHover(null);
            tween.current = gsap.to(progress.current, {
              value: 0,
              duration: TRANSITION_DURATION,
              ease: "none",
              overwrite: true,
              onComplete: () => {
                selectedRef.current = null;
                setSelected(null);
                setGalleryWebglReady(false);
                setReturning(false);
                setReversing(false);
                closing.current = false;
                /*
            
                             * Direct project link:
            
                             * navigate to the real homepage.
            
                             *
            
                             * Homepage click:
            
                             * no route navigation or remount.
            
                             */
                if (navigateHomeAfterClose) {
                  router.replace("/");
                }
              },
            });
          },
        });
      };
      if (scrollAllowed && scrollControl.current) {
        scrollControl.current.returnToFirst(reverse);
      } else {
        reverse();
      }
    },
    [scrollAllowed, onHover, resetGalleryFocus, router],
  );
  /* BROWSER BACK / FORWARD */
  useEffect(() => {
    if (!anchorReady) return;
    const handlePopState = () => {
      const routeIndex = getProjectIndex(window.location.pathname);
      /*
      
             * Browser Back:
      
             * project -> homepage
      
             */
      if (routeIndex === -1) {
        if (selectedRef.current !== null && !closing.current) {
          closeImage(true);
        }
        return;
      }
      /*
      
             * Browser Forward:
      
             * homepage -> project
      
             *
      
             * This runs the ORIGINAL opening
      
             * animation again.
      
             */
      if (selectedRef.current === null && !closing.current) {
        openImage(routeIndex, true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [anchorReady, openImage, closeImage]);
  /* COVER TO DETAILS TRANSITION */
  useLayoutEffect(() => {
    if (selected === null || closing.current) return;
    // Direct project links already start at their destination.
    if (progress.current.value > 0 || tween.current?.isActive()) return;
    let frame = 0;
    let cancelled = false;
    let stableFrames = 0;
    let previousRect: DOMRect | null = null;
    const mountedAt = performance.now();
    const startWhenStable = () => {
      if (cancelled || closing.current || selectedRef.current !== selected) {
        return;
      }
      const rect = firstTarget.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        frame = requestAnimationFrame(startWhenStable);
        return;
      }
      // Avoid starting toward a position that is still changing while
      // the gallery's layout mounts. This check costs only a few frames.
      if (
        previousRect &&
        Math.abs(rect.left - previousRect.left) < 0.5 &&
        Math.abs(rect.top - previousRect.top) < 0.5 &&
        Math.abs(rect.width - previousRect.width) < 0.5 &&
        Math.abs(rect.height - previousRect.height) < 0.5
      ) {
        stableFrames++;
      } else {
        stableFrames = 0;
      }
      previousRect = rect;
      // A small warmup avoids launching the cover movement in the
      // same frames as the gallery's React/WebGL initialization.
      // If the gallery is ready earlier, start immediately once the
      // target has held still for two frames.
      const warmedUp =
        galleryReadyRef.current ||
        performance.now() - mountedAt >= OPENING_WARMUP_MS;
      if (stableFrames < 2 || !warmedUp) {
        frame = requestAnimationFrame(startWhenStable);
        return;
      }
      // Blur and cover start together. Handoff still waits until the
      // image has arrived AND gallery WebGL is ready.
      setBackdropActive(true);
      tween.current = gsap.to(progress.current, {
        value: 1,
        duration: TRANSITION_DURATION,
        ease: "none",
        overwrite: true,
        onComplete: () => {
          if (closing.current) return;
          openingFinished.current = true;
          startHandoff();
        },
      });
    };
    frame = requestAnimationFrame(startWhenStable);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [selected, startHandoff]);
  /* LOCK PAGE SCROLL */
  useEffect(() => {
    if (selected === null) return;
    const body = document.body;
    const html = document.documentElement;
    const oldBody = body.style.overflow;
    const oldHTML = html.style.overflow;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      if (!scrollAllowed || closing.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("wheel", wheel, {
      capture: true,
      passive: false,
    });
    return () => {
      window.removeEventListener("wheel", wheel, true);
      body.style.overflow = oldBody;
      html.style.overflow = oldHTML;
    };
  }, [selected, scrollAllowed]);
  /* ESCAPE */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || selectedRef.current === null) {
        return;
      }
      if (focus.current.key) {
        onUnfocusImage();
      } else {
        closeImage();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
    };
  }, [closeImage, onUnfocusImage]);
  /* CLEANUP */
  useEffect(
    () => () => {
      tween.current?.kill();
      handoffTween.current?.kill();
      focusTween.current?.kill();
    },
    [],
  );
  return (
    <>
      {/* HOME ANCHOR */}

      <section
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[7%] left-[3.1%]"
      >
        <div className="h-[15px] md:h-[18px]" />

        <div
          ref={homeAnchor}
          className="-ml-4 mt-3 h-[190px] w-[min(90vw,520px)] md:h-[220px]"
        />
      </section>

      {/* SELECTED WORK LABEL */}

      <div className="pointer-events-none fixed bottom-[39svh] left-[3.8vw] z-[10] origin-left rotate-[10deg] whitespace-nowrap text-[13px] font-extrabold uppercase leading-none tracking-[0.01em]">
        MY WORK
      </div>

      {/* BACKDROP */}

      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[60] bg-black/90 backdrop-blur-[14px] transition-opacity duration-[1000ms] ease-in-out ${backdropActive ? "opacity-100" : "opacity-0"}`}
      />

      {/* THREE.JS GALLERY */}

      {selected !== null && (
        <GalleryThreeImages
          index={selected}
          firstTarget={firstTarget}
          handoff={handoff}
          focus={focus}
          interactive={scrollAllowed && !returning}
          scrollControl={scrollControl}
          onReady={onGalleryWebglReady}
          onFocusImage={onFocusImage}
          onUnfocusImage={onUnfocusImage}
        />
      )}

      {/* PROJECT INFORMATION */}

      {selected !== null && (
        <ProjectDetailsInfo
          project={PROJECTS[selected]}
          reversing={reversing}
          focused={isGalleryFocused}
          ready={scrollAllowed}
        />
      )}

      {/* NATIVE CLOSE FOR TOUCH / KEYBOARD */}

      {selected !== null && (
        <button
          data-project-native-close
          type="button"
          onClick={() => closeImage()}
          className="

            fixed

            left-[3.5vw]

            top-5

            z-[90]

            cursor-pointer

            font-sans

            text-xs

            font-semibold

            uppercase

            tracking-normal

            text-[#e7e3dd]

            transition-opacity

            hover:opacity-60

            max-md:left-[6vw]

          "
        >
          Close
        </button>
      )}

      {/* CUSTOM CURSOR */}

      {selected !== null && (
        <ProjectCursor
          focused={isGalleryFocused}
          disabled={returning || reversing}
          websiteUrl={PROJECTS[selected].liveUrl}
          onCloseProject={() => closeImage()}
          onCloseFocus={onUnfocusImage}
        />
      )}

      {/* HOME POINTER EVENTS */}

      <HomePointerEvents
        selected={selected}
        hits={hits}
        cameras={cameras}
        pointers={pointers}
        hoveredRef={hoveredRef}
        onHover={onHover}
        onClickImage={openImage}
      />

      {/* COVER CANVASES */}

      {homeRect &&
        PROJECTS.slice(0, 2).map((project, index) => (
          <div
            key={project.slug}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0"
            style={{
              zIndex:
                selected === null
                  ? hovered === `cover-${index}`
                    ? 80
                    : 70 + index
                  : selected === index
                    ? 80
                    : 50,
            }}
          >
            <Canvas
              frameloop={
                selected !== null &&
                (selected !== index ||
                  (scrollAllowed && galleryWebglReady && !returning))
                  ? "demand"
                  : "always"
              }
              camera={{
                position: [0, 0, 8.5],
                fov: 38,
                near: 0.1,
                far: 50,
              }}
              dpr={[1, 1.25]}
              gl={{
                alpha: true,
                antialias: false,
                powerPreference: "high-performance",
              }}
            >
              <ProjectScene
                anchor={homeRect}
                index={index}
                cameras={cameras}
                selected={selected}
                hovered={hovered}
                progress={progress}
                target={firstTarget}
                handoff={handoff}
                hits={hits}
                pointers={pointers}
                titles={titleNodes}
                closing={closing}
              />
            </Canvas>
          </div>
        ))}

      {/* MOVING PROJECT TITLES */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[85]"
      >
        {PROJECTS.slice(0, 2).map((project, index) => (
          <div
            key={project.slug}
            ref={(node) => {
              titleNodes.current.set(index, node);
            }}
            className="

                pointer-events-none

                fixed

                z-[85]

                font-bueno

                font-bold

                uppercase

                leading-[0.99]

                tracking-[0.005em]

                [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]

              "
            style={{
              opacity: 0,
              willChange: "left, top, transform, opacity",
            }}
          >
            <span className="block overflow-hidden">
              <span data-title-reveal className="block will-change-transform">
                {project.title}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
