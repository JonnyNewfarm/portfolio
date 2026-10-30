
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
      "AN INTERACTIVE PORTFOLIO BUILT AROUND DESIGN, TYPOGRAPHY AND MOTION.",
    description:
      "A DIGITAL HOME FOR SELECTED WORK IN VISUAL IDENTITY, PRINT, TYPOGRAPHY AND EXPERIMENTAL DESIGN. AN EDITORIAL LAYOUT WITH SUBTLE MOTION AND INTERACTIVE DETAILS.",
    images: [1, 2, 3, 4, 5].map(
      (index) => `/work/ker-${index}.jpg`,
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
      "A CONSIDERED DIGITAL SHOP EXPERIENCE FOR LIGHTING AND OBJECTS.",
    description:
      "A MINIMAL, PRODUCT-FOCUSED COMMERCE EXPERIENCE THAT PUTS MATERIALS, FORM AND PHOTOGRAPHY FIRST. BUILT FOR A QUIET, TACTILE FEEL.",
    images: [1, 2, 3, 4, 5].map(
      (index) => `/work/cal-${index}.jpg`,
    ),
    liveUrl: "https://calero.studio/",
  },
];
