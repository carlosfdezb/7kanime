import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useCallback } from 'react';
import styles from './MangaCard.module.css';
import { cn } from '../../utils/cn';
import { useMangaFavorites } from '../../hooks/useMangaFavorites';
import { resolveMangaImage } from '../../utils/images';
import type { MangaItem, MangaFavorite } from '../../types/manga';
import { Focusable } from './Focusable';

interface MangaCardProps {
  manga: MangaItem | MangaFavorite;
  variant?: 'default' | 'compact';
  className?: string;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300x450"%3E%3Crect fill="%23262626" width="300" height="450"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';

function MangaCardInner({ manga, variant: _variant = 'default', className }: MangaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isMangaFavorite, toggleMangaFavorite, isAuthenticated } = useMangaFavorites();

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const isFavorite = isMangaFavorite(manga.publicId);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      toggleMangaFavorite({
        publicId: manga.publicId,
        title: manga.title,
        coverUrl: manga.coverUrl,
        type: manga.type,
      });
    }
  }, [manga, isAuthenticated, toggleMangaFavorite]);

  const hasRating = 'rating' in manga && typeof manga.rating === 'number' && manga.rating > 0;

  const imageSrc = resolveMangaImage(manga, 'card') || manga.coverUrl;

  return (
    <Focusable as={Link} id={`mangacard-${manga.publicId}`} className={cn(styles.card, className)} to={`/manga/${manga.publicId}`}>
      <div className={styles.posterWrapper}>
        {!imageLoaded && !imageError && (
          <div className={styles.skeleton} aria-hidden="true" />
        )}
        <img
          src={imageError ? PLACEHOLDER_IMAGE : imageSrc}
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}
        <span className={styles.type}>{manga.type}</span>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{manga.title}</h3>
        {hasRating && (
          <div className={styles.meta}>
            <span className={styles.score}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              {manga.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Focusable>
  );
}

export const MangaCard = React.memo(MangaCardInner);
