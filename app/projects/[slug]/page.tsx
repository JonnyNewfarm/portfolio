import type { Metadata } from "next";
import { notFound } from "next/navigation";

import HomePage from "../../page";

import { PROJECTS } from "@/lib/projects";
import { ProjectRouteProvider } from "@/components/projects/ProjectRouteContext";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return PROJECTS.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const project = PROJECTS.find((item) => item.slug === slug);

  if (!project) {
    return {};
  }

  return {
    title: `${project.title} — Jonas Nygaard`,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;

  const project = PROJECTS.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <ProjectRouteProvider initialSlug={project.slug}>
      <HomePage />
    </ProjectRouteProvider>
  );
}
