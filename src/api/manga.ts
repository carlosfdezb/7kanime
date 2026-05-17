import { apiFetch } from './client';
import type { MangaItem, MangaDetail, ChapterPages, PopularMangaResponse, MangaSearchResponse, MangaChapter } from '../types/manga';

// ============================================================================
// Backend Response Types (what the API actually returns)
// ============================================================================

interface BackendPopularResponse {
  items: BackendMangaItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  pageTokens: {
    current: string;
    prev: string | null;
    next: string | null;
    first: string;
    last: string;
  };
}

interface BackendMangaItem {
  id: number;
  publicId: string;
  titulo: string;
  autor: string | null;
  generos: string;
  portadaUrl: string;
  esMayorDeEdad: boolean;
  esDestacada: boolean;
  fechaActualizacion: string | null;
  fechaCreacion: string;
  puntuacion: number | null;
  estado: string;
  totalCapitulos: number;
}

interface BackendMangaDetail extends BackendMangaItem {
  descripcion: string;
  tags: string | null;
  tagsDescripcion: string | null;
  titulosAlternativos: string | null;
  estaEnEmision: boolean;
  esRevisado: boolean;
  visible: boolean;
  tipo: string | null;
  capitulos: BackendChapter[];
}

interface BackendChapter {
  id: number;
  publicId: string;
  numeroCapitulo: number;
  titulo: string | null;
  archivoNombre: string;
  archivoTamano: number;
  totalPaginas: number;
  fechaSubida: string;
  orden: number;
  visible: boolean;
  tomoId: number | null;
}

interface BackendChapterPages {
  paginas: string[];
  totalPaginas: number;
  capituloId: number;
  publicCapituloId: string;
  serieId: number;
  publicSerieId: string;
  numeroCapitulo: number;
  grupoScan: string | null;
  score: number;
  miVoto: number | null;
}

// ============================================================================
// Mappers: Backend → Frontend
// ============================================================================

function mapBackendItem(item: BackendMangaItem): MangaItem {
  return {
    publicId: item.publicId,
    title: item.titulo,
    type: item.estado,
    coverUrl: item.portadaUrl,
    latestUpdate: item.fechaActualizacion || item.fechaCreacion,
    rating: item.puntuacion ?? 0,
    ratingCount: 0, // Not provided by backend
    isEro: item.esMayorDeEdad,
    url: '', // Not provided by backend
  };
}

function mapBackendChapter(ch: BackendChapter): MangaChapter {
  return {
    publicId: ch.publicId,
    numeroCapitulo: String(ch.numeroCapitulo),
    orden: ch.orden,
    title: ch.titulo || undefined,
  };
}

function mapBackendDetail(raw: BackendMangaDetail): MangaDetail {
  return {
    ...mapBackendItem(raw),
    description: raw.descripcion,
    author: raw.autor,
    artist: null, // Not provided by backend
    status: raw.estado,
    demographics: [], // Not provided by backend
    genres: raw.generos ? raw.generos.split(',').map(g => g.trim()) : [],
    chapters: raw.capitulos.map(mapBackendChapter),
  };
}

// ============================================================================
// API Functions
// ============================================================================

export async function getPopular(page: number, pageSize: number = 25): Promise<PopularMangaResponse> {
  const raw = await apiFetch<BackendPopularResponse>(`/manga/popular?page=${page}&pageSize=${pageSize}`);
  return {
    items: raw.items.map(mapBackendItem),
    page: raw.page,
    totalPages: raw.totalPages,
    totalItems: raw.total,
    hasNextPage: !!raw.pageTokens.next,
  };
}

export async function getTags(): Promise<string[]> {
  return apiFetch<string[]>(`/manga/tags`);
}

export async function searchManga(query: string): Promise<MangaSearchResponse> {
  // Backend returns array directly, not { items: [...] }
  const raw = await apiFetch<BackendMangaItem[]>(`/manga/search?q=${encodeURIComponent(query)}`);
  return {
    items: raw.map(mapBackendItem),
  };
}

export async function getMangaDetail(publicId: string): Promise<MangaDetail> {
  const raw = await apiFetch<BackendMangaDetail>(`/manga/${publicId}`);
  return mapBackendDetail(raw);
}

export async function getChapterPages(serieId: string, capituloId: string): Promise<ChapterPages> {
  const raw = await apiFetch<BackendChapterPages>(`/manga/chapter/${serieId}/${capituloId}`);
  return {
    paginas: raw.paginas,
    prevCapituloId: null, // Not provided by backend
    nextCapituloId: null, // Not provided by backend
  };
}
