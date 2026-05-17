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
// Genre display translations (English → Spanish) — VISUAL ONLY
// Data stays in original language for API calls
// ============================================================================

const GENRE_DISPLAY_MAP: Record<string, string> = {
  // English → Spanish
  'acción': 'Acción',
  'action': 'Acción',
  'adult': 'Adulto',
  'adult cast': 'Adulto',
  'adventure': 'Aventura',
  'apocalíptico': 'Apocalíptico',
  'aliens': 'Aliens',
  'boys love': 'BL (Boys Love)',
  'chicas monstruo': 'Chicas monstruo',
  'ciberpunk': 'Ciberpunk',
  'cocina': 'Cocina',
  'comedy': 'Comedia',
  'crime': 'Crimen',
  'crimen': 'Crimen',
  'crossdressing': 'Crossdressing',
  'cuidado de niños': 'Cuidado de niños',
  'cultivo': 'Cultivo',
  'cultura otaku': 'Cultura Otaku',
  'cyberpunk': 'Ciberpunk',
  'delincuentes': 'Delincuentes',
  'demonios': 'Demonios',
  'deporte': 'Deportes',
  'deportes': 'Deportes',
  'deportes de combate': 'Deportes de combate',
  'detective': 'Detective',
  'doujinshi': 'Doujinshi',
  'drama': 'Drama',
  'ecchi': 'Ecchi',
  'erotica': 'Erótica',
  'escolar': 'Escolar',
  'espacial': 'Espacial',
  'español': 'Español',
  'familia': 'Familia',
  'fantasía': 'Fantasía',
  'fantasía urbana': 'Fantasía urbana',
  'fantasy': 'Fantasía',
  'full color': 'Full Color',
  'gag humor': 'Gag Humor',
  'gender bender': 'Gender Bender',
  'girls love': 'Girls Love',
  'gl (girls love)': 'GL (Girls Love)',
  'gore': 'Gore',
  'gourmet': 'Gourmet',
  'guerra': 'Guerra',
  'harem': 'Harem',
  'harem inverso': 'Harem inverso',
  'hentai': 'Hentai',
  'historia': 'Historia',
  'historias cotidianas': 'Historias cotidianas',
  'histórico': 'Histórico',
  'historical': 'Histórico',
  'isekai': 'Isekai',
  'iyashikei': 'Iyashikei',
  'josei': 'Josei',
  'kids': 'Niños',
  'kodomo / kids': 'Niños',
  'love polygon': 'Love Polygon',
  'love status quo': 'Love Status Quo',
  'magia': 'Magia',
  'magical girls': 'Magical Girls',
  'mahou shoujo': 'Mahou Shoujo',
  'manga': 'Manga',
  'manhua': 'Manhua',
  'manhwa': 'Manhwa',
  'martial': 'Artes Marciales',
  'martial arts': 'Artes Marciales',
  'mecha': 'Mecha',
  'medical': 'Medical',
  'military': 'Militar',
  'militar': 'Militar',
  'misterio': 'Misterio',
  'mitología': 'Mitología',
  'music': 'Música',
  'mystery': 'Misterio',
  'niños': 'Niños',
  'novela': 'Novela',
  'oeste': 'Oeste',
  'oficina': 'Oficina',
  'oneshot': 'Oneshot',
  'organized crime': 'Crimen organizado',
  'parody': 'Parodia',
  'parodia': 'Parodia',
  'police': 'Policial',
  'policiaco': 'Policial',
  'policial': 'Policial',
  'premiados': 'Premiados',
  'psicológica': 'Psicológico',
  'psicológico': 'Psicológico',
  'psychological': 'Psicológico',
  'racing': 'Carreras',
  'realidad': 'Realidad',
  'realidad virtual': 'Realidad Virtual',
  'reencarnación': 'Reencarnación',
  'reincarnation': 'Reencarnación',
  'romance': 'Romance',
  'samurai': 'Samurai',
  'school': 'Escolar',
  'school life': 'Vida escolar',
  'sci-fi': 'Ciencia Ficción',
  'seinen': 'Seinen',
  'shojo': 'Shōjo',
  'shōjo': 'Shōjo',
  'shojo ai': 'Shojo-ai',
  'shojo-ai (yuri soft)': 'Shojo-ai',
  'shonen': 'Shōnen',
  'shōnen': 'Shōnen',
  'shonen ai': 'Shonen-ai',
  'shonen-ai': 'Shonen-ai',
  'shonen-ai (yaoi soft)': 'Shonen-ai',
  'shoujo': 'Shōjo',
  'shoujo ai': 'Shojo-ai',
  'shoujo-ai': 'Shojo-ai',
  'shounen': 'Shōnen',
  'shounen ai': 'Shonen-ai',
  'sistema': 'Sistema',
  'slice of life': 'Recuentos de la vida',
  'smut': 'Smut',
  'sports': 'Deportes',
  'sobrenatural': 'Sobrenatural',
  'super natural': 'Sobrenatural',
  'super power': 'Superpoderes',
  'superhero': 'Superhéroes',
  'supernatural': 'Sobrenatural',
  'superpoderes': 'Superpoderes',
  'supervivencia': 'Supervivencia',
  'survival': 'Supervivencia',
  'team sports': 'Deportes de equipo',
  'terror': 'Terror',
  'thriller': 'Thriller',
  'trabajo': 'Trabajo',
  'tragedia': 'Tragedia',
  'tragedy': 'Tragedia',
  'vampire': 'Vampiros',
  'vampiros': 'Vampiros',
  'venganza': 'Venganza',
  'viaje en el tiempo': 'Viaje en el tiempo',
  'vida cotidiana': 'Vida Cotidiana',
  'vida escolar': 'Vida escolar',
  'videojuegos': 'Videojuegos',
  'villana': 'Villana',
  'war': 'Guerra',
  'webcomic': 'Webcomic',
  'webtoon': 'Webtoon',
  'wuxia': 'Wuxia',
  'yaoi': 'Yaoi',
  'yaoi (soft)': 'Yaoi (Soft)',
  'yonkoma': 'Yonkoma',
  'yuri': 'Yuri',
  'yuri (soft)': 'Yuri (Soft)',
  'zombies': 'Zombies',
};

/**
 * Translates genre for display purposes only.
 * Original values are preserved in data for API compatibility.
 */
export function translateGenreDisplay(genre: string): string {
  const lower = genre.toLowerCase().trim();
  return GENRE_DISPLAY_MAP[lower] || genre;
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

export async function searchManga(query: string, tag?: string): Promise<MangaSearchResponse> {
  // Backend returns array directly, not { items: [...] }
  let url = `/manga/search?q=${encodeURIComponent(query)}`;
  if (tag) {
    url += `&tag=${encodeURIComponent(tag)}`;
  }
  const raw = await apiFetch<BackendMangaItem[]>(url);
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
