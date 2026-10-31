# Jonas Nygaard — Portfolio

**Designer & Developer · Oslo, Norway**

A personal portfolio built around interaction, typography, and motion. An exploration of how WebGL, thoughtful transitions, and a minimal interface can turn a collection of projects into a more immersive experience.

**[Visit the portfolio](https://www.jonasnygaard.com)**

---

## Overview

This portfolio is a place to showcase selected work and experiment with creative development. Rather than using a conventional project grid, the experience is built around interactive 3D image planes that respond to the cursor and transition into an editorial project gallery.

The goal is simple: make the interactions feel as considered as the visual design, without sacrificing usability or performance.

## Highlights

- **Interactive 3D project cards** — tilted WebGL image planes with depth, hover movement, and shader-based bending.
- **Seamless project transitions** — animated movement from a selected card into a full project presentation.
- **Immersive project galleries** — centered imagery, smooth continuous scrolling, and image-focus interactions on desktop.
- **Custom typography cursor** — context-aware labels (`FOCUS`, `CLOSE`, `VIEW WEBSITE`) with subtle drag, tilt, and responsive letter spacing.
- **Animated introduction** — a custom preloader that transitions typography into the page layout.
- **Light and dark themes** — two visual modes designed around the same editorial system.
- **Responsive experience** — a dedicated, touch-friendly mobile layout and project gallery.
- **Motion with intention** — carefully timed interactions, reduced-motion considerations, and performance-conscious rendering.

## Selected work

### 01 — Kerimov Designs

An interactive portfolio for a graphic designer, combining bold typography, visual identity work, 3D interaction, and motion.

[Visit Kerimov Designs](https://kerimovdesigns.com)

### 02 — Calero Studio

A design-focused e-commerce experience built around contemporary lighting, clean layouts, and a considered shopping journey.

[Visit Calero Studio](https://calero.studio)

## Built with

| Technology             | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| **Next.js**            | Application framework and routing             |
| **React & TypeScript** | Components, state, and type safety            |
| **Tailwind CSS**       | Styling and responsive layouts                |
| **Three.js**           | WebGL rendering and custom shaders            |
| **React Three Fiber**  | Declarative Three.js scenes in React          |
| **Drei**               | Utilities for the 3D experience               |
| **GSAP**               | Timelines, transitions, and text animation    |
| **GLSL**               | Custom vertex deformation and image rendering |

## How it works

### From card to project

On desktop, each featured project begins as a 3D image plane. Hover interactions add depth and subtle movement. Selecting a project animates its image toward the center of the viewport, where the full gallery takes over.

The transition is coordinated between the WebGL scenes and the HTML interface to keep the movement continuous.

### The gallery

Project galleries combine large, centered images with supporting information in side panels. Visitors can scroll through the work, focus on individual images, or jump to the live project.

### The cursor

Inside a project, a custom text cursor communicates the available action. Its movement uses smoothing and subtle typographic animation rather than a conventional pointer shape.

### Mobile

Smaller screens use a dedicated layout built for touch, readable project information, and straightforward vertical scrolling instead of relying on desktop hover interactions.

## Running locally

### Requirements

- Node.js (a version compatible with the project's Next.js release)
- npm

### Setup

From the project root, install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To create and run a production build:

```bash
npm run build
npm start
```

## Project organization

The experience is divided into a few main areas:

- `app/` — application entry points and routing.
- `components/` — page UI, navigation, portrait, and introductory animation.
- `components/projects/` — project cards, WebGL galleries, information panels, shaders, and custom cursor behavior.
- `lib/projects.ts` — selected project content and metadata.
- `public/` — images, fonts, and other static assets.

## Design approach

The visual direction is intentionally restrained: strong typography, generous negative space, a limited palette, and imagery that takes center stage. Motion adds personality, but the content remains the focus.

The project is also an ongoing space for experimenting with WebGL, shaders, animation systems, and the details that make an interface feel responsive.

## Contact

**Jonas Nygaard** — Designer & Developer, Oslo, Norway

[Portfolio](https://www.jonasnygaard.com) · [GitHub](https://github.com/JonnyNewfarm) · [LinkedIn](https://www.linkedin.com/in/jonas-nygaard-0aa767366)
