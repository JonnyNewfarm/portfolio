"use client";

import { createContext, useContext, type ReactNode } from "react";

const ProjectRouteContext = createContext<string | null>(null);

export function ProjectRouteProvider({
  initialSlug,
  children,
}: {
  initialSlug: string;
  children: ReactNode;
}) {
  return (
    <ProjectRouteContext.Provider value={initialSlug}>
      {children}
    </ProjectRouteContext.Provider>
  );
}

export function useInitialProjectSlug() {
  return useContext(ProjectRouteContext);
}
