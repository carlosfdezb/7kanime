import { Link } from 'react-router-dom';
import { useState } from 'react';
import styles from './Card.module.css';
import { cn } from '../../utils/cn';
import type { CatalogItem } from '../../types/api';
import { Focusable } from './Focusable';
import { useFavoritesStore } from '../../store/favoritesStore';

interface CardProps {
  anime: CatalogItem;
  variant?: 'default' | 'compact';
  className?: string;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300x450"%3E%3Crect fill="%23262626" width="300" height="450"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';

export function Card({ anime, variant = 'default', className }: CardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  const handleImageError = () => {
    setImageError(true);
  };

  const favorite = isFavorite(anime.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(anime);
  };

  return (
    <Focusable as={Link} id={`card-${anime.id}`} className={cn(styles.card, className)} to={`/anime/${anime.slug}`}>
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
        <button
          className={cn(styles.favoriteBtn, favorite && styles.favoriteBtnActive)}
          onClick={handleFavoriteClick}
          aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          {favorite ? '\u2665' : '\u2661'}
        </button>
        <span className={styles.type}>{anime.type}</span>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{anime.title}</h3>
        {variant === 'default' && (
          <p className={styles.synopsis}>{anime.synopsis}</p>
        )}
      </div>
    </Focusable>
  );
}
