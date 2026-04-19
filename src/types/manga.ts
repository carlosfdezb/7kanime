export interface MangaItem {
  id: number;
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
  id: number;
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
  number: string;
  title: string;
  versions: ChapterVersion[];
}

export interface ChapterVersion {
  hash: string;
  scanlator: string;
  date: string;
}

export interface ChapterPage {
  chapterHash: string;
  totalPages: number;
  pages: { pageNumber: number; imageUrl: string; format: string }[];
  prevChapterUrl: string | null;
  nextChapterUrl: string | null;
}

export interface PaginatedMangaResponse {
  items: MangaItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
}
