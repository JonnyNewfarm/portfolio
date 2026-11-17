import BottomMeta from "@/components/BottomMeta";
import HeroIntro from "@/components/HeroIntro";
import PortraitCard from "@/components/PortraitCard";

import SelectedWork from "@/components/projects/SelectedWork";
import ResponsiveViewport from "@/components/projects/ResponsiveViewport";

import HomeReveal from "@/components/HomeReveal";
import { getProjects } from "@/sanity/getProjects";

export default async function Home() {
  const projects = await getProjects();

  return (
    <ResponsiveViewport projects={projects}>
      <main data-home-reveal-root className="relative min-h-svh w-full">
        <HeroIntro />
        <SelectedWork projects={projects} />
        <PortraitCard />
        <BottomMeta />
        <HomeReveal />
      </main>
    </ResponsiveViewport>
  );
}
