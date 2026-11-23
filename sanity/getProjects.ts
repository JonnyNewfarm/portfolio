
import { cacheLife } from "next/cache";
import { client } from "./client";

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

type SanityProject = Omit<Project, "number">;

export async function getProjects(): Promise<Project[]> {
  "use cache";

  cacheLife({
    stale: 60,
    revalidate: 60,
    expire: 3600,
  });

  const query = `
    *[_type == "project" && defined(slug.current)]
    | order(order asc) {
      "slug": slug.current,
      title,
      category,
      year,
      dev,
      design,
      intro,
      description,
      "images": images[].asset->url,
      liveUrl
    }
  `;

  const projects = await client.fetch<SanityProject[]>(query);

  return projects.map((project, index) => ({
    ...project,
    images: (project.images ?? []).filter(Boolean),
    number: String(index + 1).padStart(2, "0"),
  }));
}

