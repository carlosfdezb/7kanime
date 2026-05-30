import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useCallback } from 'react';
import styles from './Card.module.css';
import { cn } from '../../utils/cn';
import type { CatalogItem } from '../../types/api';
import { Focusable } from './Focusable';
import { useAnimeFavorites } from '../../hooks/useAnimeFavorites';
import { usePrefetchAnime } from '../../hooks/usePrefetch';

interface CardProps {
  anime: CatalogItem;
  variant?: 'default' | 'compact';
  className?: string;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300x450"%3E%3Crect fill="%23262626" width="300" height="450"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';

function CardInner({ anime, variant = 'default', className }: CardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isFavorite, toggleFavorite, isAuthenticated } = useAnimeFavorites();
  const prefetchAnime = usePrefetchAnime();

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const favorite = isFavorite(anime.id);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      toggleFavorite(anime);
    }
  }, [anime, isAuthenticated, toggleFavorite]);

  // CatalogItem doesn't expose score/status, but we keep structure for future extensibility
  const hasScore = 'score' in anime && typeof (anime as any).score === 'number';
  const hasStatus = 'statusText' in anime && typeof (anime as any).statusText === 'string';

  return (
    <Focusable as={Link} id={`card-${anime.id}`} className={cn(styles.card, className)} to={`/anime/${anime.slug}`} onMouseEnter={() => prefetchAnime(anime.slug, anime.poster)}>
      <div className={styles.posterWrapper}>
        {!imageLoaded && !imageError && (
          <div className={styles.skeleton} aria-hidden="true" />
        )}
        <img
          src={imageError ? PLACEHOLDER_IMAGE : anime.poster}
          alt={anime.title}
          className={cn(styles.poster, !imageLoaded && styles.hidden)}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />
        {variant === 'default' && (
          <div className={styles.overlay}>
            <p>{anime.synopsis}</p>
          </div>
        )}
        {isAuthenticated && (
          <button
            className={cn(styles.favoriteBtn, favorite && styles.favoriteBtnActive)}
            onClick={handleFavoriteClick}
            aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}
        <span className={styles.type}>{anime.type}</span>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{anime.title}</h3>
        {(hasScore || hasStatus) && (
          <div className={styles.meta}>
            {hasScore && (
              <span className={styles.score}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
                {(anime as any).score}
              </span>
            )}
            {hasScore && hasStatus && <span>•</span>}
            {hasStatus && <span>{(anime as any).statusText}</span>}
          </div>
        )}
      </div>
    </Focusable>
  );
}

export const Card = React.memo(CardInner);
