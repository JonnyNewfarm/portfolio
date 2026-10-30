import BottomMeta from "@/components/BottomMeta";
import HeroIntro from "@/components/HeroIntro";
import NavbarLayer from "@/components/NavbarLayer";
import PortraitCard from "@/components/PortraitCard";

import SelectedWork from "@/components/projects/SelectedWork";
import ResponsiveViewport from "@/components/projects/ResponsiveViewport";

import SitePreloader from "@/components/SitePreloader";

export default function Home() {
  return (
    <SitePreloader>
      <ResponsiveViewport>
        <main className="relative min-h-svh w-full">
          <NavbarLayer />
          <HeroIntro />
          <SelectedWork />
          <PortraitCard />
          <BottomMeta />
        </main>
      </ResponsiveViewport>
    </SitePreloader>
  );
}
