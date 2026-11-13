import ServicesHero from "@/components/services/ServicesHero";
import ServicesShowcase from "@/components/services/ServicesShowcase";
import ServicesSmoothScroll from "@/components/services/ServicesSmoothScroll";
import ServicesContact from "@/components/services/ServicesContact";
import ServicesFooter from "@/components/services/ServicesFooter";

export default function ServicesPage() {
  return (
    <ServicesSmoothScroll>
      <main>
        <ServicesHero />

        <ServicesShowcase />
        <ServicesContact />
        <ServicesFooter />
      </main>
    </ServicesSmoothScroll>
  );
}
