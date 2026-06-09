import { apiClient } from "@/lib/apiClient";

let cachedProjectId: string | null =
  String((import.meta as any)?.env?.VITE_DEFAULT_PROJECT_ID ?? "").trim() || null;

export async function getDefaultProjectId(token: string): Promise<string | null> {
  if (cachedProjectId) return cachedProjectId;

  try {
    const data = await apiClient.requestJson<{ projects?: Array<{ id: string; name?: string }> }>(
      "/api/projects",
      { token },
    );
    const projects = data?.projects ?? (Array.isArray(data) ? data : []);
    if (!Array.isArray(projects) || projects.length === 0) return null;

    const namedDefault = projects.find((p) => p.name === "Default");
    const projectId = namedDefault?.id ?? projects[0]?.id ?? null;
    if (projectId) cachedProjectId = projectId;
    return projectId;
  } catch {
    return null;
  }
}
