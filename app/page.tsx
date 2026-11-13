import BottomMeta from "@/components/BottomMeta";
import HeroIntro from "@/components/HeroIntro";
import PortraitCard from "@/components/PortraitCard";

import SelectedWork from "@/components/projects/SelectedWork";
import ResponsiveViewport from "@/components/projects/ResponsiveViewport";

import HomeReveal from "@/components/HomeReveal";

export default function Home() {
  return (
    <ResponsiveViewport>
      <main data-home-reveal-root className="relative min-h-svh w-full">
        <HeroIntro />
        <SelectedWork />
        <PortraitCard />
        <BottomMeta />

        <HomeReveal />
      </main>
    </ResponsiveViewport>
  );
}
