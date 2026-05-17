import { Link } from 'react-router-dom';
import { useState } from 'react';
import styles from './MangaCard.module.css';
import { cn } from '../../utils/cn';
import { getProxiedImageUrl } from '../../api/manga';
import { useMangaFavorites } from '../../hooks/useMangaFavorites';
import type { MangaItem, MangaFavorite } from '../../types/manga';

interface MangaCardProps {
  manga: MangaItem | MangaFavorite;
  variant?: 'default' | 'compact';
  className?: string;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300x450"%3E%3Crect fill="%23262626" width="300" height="450"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';

export function MangaCard({ manga, variant: _variant = 'default', className }: MangaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isMangaFavorite, toggleMangaFavorite, isAuthenticated } = useMangaFavorites();

  const handleImageError = () => {
    setImageError(true);
  };

  const isFavorite = isMangaFavorite(manga.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      toggleMangaFavorite({
        id: manga.id,
        title: manga.title,
        coverUrl: manga.coverUrl,
        type: manga.type,
      });
    }
  };

  return (
    <Link
      to={`/manga/${manga.id}`}
      className={cn(styles.card, className)}
    >
      <div className={styles.posterWrapper}>
        {!imageLoaded && !imageError && (
          <div className={styles.skeleton} aria-hidden="true" />
        )}
        <img
          src={imageError ? PLACEHOLDER_IMAGE : getProxiedImageUrl(manga.coverUrl)}
          alt={manga.title}
          className={cn(styles.poster, !imageLoaded && styles.hidden)}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />
        {isAuthenticated && (
          <button
            className={cn(styles.favoriteBtn, isFavorite && styles.favoriteBtnActive)}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {isFavorite ? '\u2665' : '\u2661'}
          </button>
        )}
        <span className={styles.type}>{manga.type}</span>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{manga.title}</h3>
      </div>
    </Link>
  );
}
