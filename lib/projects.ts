
export type Project = {
  slug: string;
  title: string;
  number: string;
  category: string;
  year: string;
  dev: string;
  design: string;
  intro: string;
  description: string;
  images: string[];
  liveUrl: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "kerimov-designs",
    title: "KERIMOV DESIGNS",
    number: "01",
    category: "PORTFOLIO / CREATIVE DEVELOPMENT",
    year: "2026",
    dev: "Jonas Nygaard",
    design: "Jonas Nygaard",
    intro:
      "AN INTERACTIVE PORTFOLIO BUILT AROUND DESIGN, TYPOGRAPHY AND MOTION, COMBINING BOLD VISUALS, FLUID ANIMATIONS AND THOUGHTFUL INTERACTIONS TO CREATE A DISTINCTIVE DIGITAL EXPERIENCE.",
    description:
      "A DIGITAL HOME FOR SELECTED WORK IN VISUAL IDENTITY, PRINT, TYPOGRAPHY AND EXPERIMENTAL DESIGN. AN EDITORIAL LAYOUT WITH SUBTLE MOTION AND INTERACTIVE DETAILS.",
    images: [0, 1, 2, 3, 4].map(
      (index) => `/work/keri-${index}.jpg`,
    ),
    liveUrl: "https://www.kerimovdesigns.com/",
  },
  {
    slug: "calero-studio",
    title: "CALERO STUDIO",
    number: "02",
    category: "E-COMMERCE / DIGITAL EXPERIENCE",
    year: "2026",
    dev: "Jonas Nygaard",
    design: "Jonas Nygaard",
    intro:
      "A CONSIDERED DIGITAL SHOPPING EXPERIENCE FOR LIGHTING AND OBJECTS, COMBINING THOUGHTFUL DESIGN, INTUITIVE NAVIGATION AND A CALM, REFINED VISUAL IDENTITY.",
    description:
      "A MINIMAL, PRODUCT-FOCUSED COMMERCE EXPERIENCE THAT PUTS MATERIALS, FORM AND PHOTOGRAPHY FIRST. BUILT FOR A QUIET, TACTILE FEEL.",
    images: [0, 1, 2, 3, 4].map(
      (index) => `/work/cale-${index}.jpg`,
    ),
    liveUrl: "https://calero.studio/",
  },
];
