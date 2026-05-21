// API Response Types

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  malId: number;
}

export interface Relation {
  id: number;
  destination: {
    slug: string;
    title: string;
  };
  type: string;
}

export interface CatalogItem {
  id: number;
  title: string;
  slug: string;
  poster: string;
  type: string;       // "TV Anime", "OVA", "Película", "Especial"
  typeSlug: string;   // "tv-anime", "ova", "película", "especial"
  synopsis: string;
}

export interface CatalogResponse {
  items: CatalogItem[];
  total: number;
}

export interface SearchResponse {
  query: string;
  count: number;
  results: CatalogItem[];
}

export interface AnimeDetail {
  id: number;
  title: string;
  aka: { "en-us"?: string; "ja-jp"?: string };
  genres: Genre[];
  synopsis: string;
  poster: string;
  backdrop: string;
  trailer: string | null;
  status: number;
  statusText: string;  // "Airing", "Finished"
  episodesCount: number;
  score: number;
  votes: number;
  slug: string;
  type: string;
  typeSlug: string;
  category: Category;
  episodes: { id: number; number: number }[];
  relations: Relation[];
}

export interface MediaLink {
  server: string;  // "HLS", "Mega", "UPNShare", "MP4Upload"
  url: string;
}

export interface EpisodeDetail {
  id: number;
  mediaId: number;
  number: number;
  variants: { DUB: number; SUB: number };
  embeds: { DUB: MediaLink[]; SUB: MediaLink[] };
  downloads: { DUB: MediaLink[]; SUB: MediaLink[] };
}

// Filter params types
export interface CatalogParams {
  page?: number;
  letter?: string;
  genre?: string[];
  category?: 'tv-anime' | 'ova' | 'pelicula' | 'especial';
  minYear?: number;
  maxYear?: number;
  status?: 'emision' | 'finalizado' | 'proximamente';
  order?: string;
}
