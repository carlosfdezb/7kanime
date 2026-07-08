import { apiFetch } from "./client";
import type { EpisodeDetail } from "../types/api";

export async function getEpisode(slug: string, number: number): Promise<EpisodeDetail> {
  console.log("esto es un test");
  return apiFetch<EpisodeDetail>(`/episode/${slug}/${number}`);
}
