export interface MangaItem {
  publicId: string;
  title: string;
  type: string;
  coverUrl: string;
  latestUpdate: string;
  rating: number;
  ratingCount: number;
  isEro: boolean;
  url: string;
}

export interface MangaFavorite {
  publicId: string;
  title: string;
  coverUrl: string;
  type: string;
}

export interface MangaDetail extends MangaItem {
  description: string;
  author: string | null;
  artist: string | null;
  status: string;
  demographics: string[];
  genres: string[];
  chapters: MangaChapter[];
}

export interface MangaChapter {
  publicId: string;
  numeroCapitulo: string;
  orden: number;
  title?: string;
}

export interface ChapterPages {
  paginas: string[];
  prevCapituloId: string | null;
  nextCapituloId: string | null;
}

export interface PopularMangaResponse {
  items: MangaItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
}

export interface MangaSearchResponse {
  items: MangaItem[];
}

export interface MangaTag {
  slug: string;
  name: string;
}
