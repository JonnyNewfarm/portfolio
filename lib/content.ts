export type Project = {
  slug: string;
  title: string;
  number: string;
  category: string;
  year: string;
  intro: string;
  description: string;
  images: string[];
  liveUrl: string;
};



export const PORTRAIT_SRC = "/newfarm-3.jpeg";

export const ABOUT = {
  headline: "THOUGHTFUL DESIGN. PLAYFUL INTERACTIONS.",
  intro:
    "I'M JONAS, AN INDEPENDENT DESIGNER & DEVELOPER BASED IN OSLO, NORWAY.",
  body:
    "I WORK AT THE INTERSECTION OF DESIGN, CREATIVE DEVELOPMENT AND INTERACTION. I LIKE TO MAKE DIGITAL EXPERIENCES THAT FEEL PRECISE, EXPRESSIVE AND ALIVE — WHERE EVERY DETAIL HAS A PURPOSE.",
};

export const PROJECTS: Project[] = [
  {
    slug: "kerimov-designs",
    title: "KERIMOV DESIGNS",
    number: "01",
    category: "PORTFOLIO / CREATIVE DEVELOPMENT",
    year: "2026",
    intro:
      "AN INTERACTIVE PORTFOLIO BUILT AROUND DESIGN, TYPOGRAPHY AND MOTION.",
    description:
      "A DIGITAL HOME FOR SELECTED WORK IN VISUAL IDENTITY, PRINT, TYPOGRAPHY AND EXPERIMENTAL DESIGN. AN EDITORIAL LAYOUT WITH SUBTLE MOTION AND INTERACTIVE DETAILS.",
    images: [1, 2, 3, 4, 5].map(
      (index) => `/work/ker-${index}.jpg`,
    ),
    liveUrl: "",
  },
  {
    slug: "calero-studio",
    title: "CALERO STUDIO",
    number: "02",
    category: "E-COMMERCE / DIGITAL EXPERIENCE",
    year: "2026",
    intro:
      "A CONSIDERED DIGITAL SHOP EXPERIENCE FOR LIGHTING AND OBJECTS.",
    description:
      "A MINIMAL, PRODUCT-FOCUSED COMMERCE EXPERIENCE THAT PUTS MATERIALS, FORM AND PHOTOGRAPHY FIRST. BUILT FOR A QUIET, TACTILE FEEL.",
    images: [1, 2, 3, 4, 5].map(
      (index) => `/work/cal-${index}.jpg`,
    ),
    liveUrl: "",
  },
];

export type View =
  | { type: "home" }
  | { type: "about" }
  | { type: "project"; slug: string };

export function parseView(pathname: string): View | null {
  if (pathname === "/" || pathname === "") {
    return { type: "home" };
  }

  if (pathname === "/about" || pathname === "/about/") {
    return { type: "about" };
  }

  const match = pathname.match(/^\/work\/([^/]+)\/?$/);

  if (
    match &&
    PROJECTS.some((project) => project.slug === match[1])
  ) {
    return {
      type: "project",
      slug: match[1],
    };
  }

  return null;
}

export function urlForView(view: View): string {
  if (view.type === "home") return "/";
  if (view.type === "about") return "/about";

  return `/work/${view.slug}`;
}