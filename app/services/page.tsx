import ServicesHero from "@/components/services/ServicesHero";
import ServicesShowcase from "@/components/services/ServicesShowcase";
import SmoothScroll from "@/components/services/ServicesSmoothScroll";
import ServicesContact from "@/components/services/ServicesContact";
import ServicesFooter from "@/components/services/ServicesFooter";

export default function ServicesPage() {
  return (
    <SmoothScroll>
      <main className="overflow-x-clip">
        <ServicesHero />

        <ServicesShowcase />
        <ServicesContact />
        <ServicesFooter />
      </main>
    </SmoothScroll>
  );
}
