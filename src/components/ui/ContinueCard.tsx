import { Link } from 'react-router-dom';
import styles from './ContinueCard.module.css';
import { cn } from '../../utils/cn';

export interface ContinueCardProps {
  slug: string;
  title: string;
  episode?: number;
  chapter?: number;
  poster: string;
  progress: number;
  type: 'anime' | 'manga';
  className?: string;
}

export function ContinueCard({
  slug,
  title,
  episode,
  chapter,
  poster,
  progress,
  type,
  className,
}: ContinueCardProps) {
  const to = type === 'anime' && episode
    ? `/episode/${slug}/${episode}`
    : `/manga/${slug}`;

  const badge = type === 'anime' && episode
    ? `Ep. ${episode}`
    : chapter
      ? `Cap. ${chapter}`
      : '';

  const subtitle = type === 'anime' && episode
    ? `Continuar episodio ${episode}`
    : chapter
      ? `Continuar capítulo ${chapter}`
      : 'Continuar leyendo';

  return (
    <Link
      to={to}
      className={cn(styles.card, className)}
      data-tv-focus="true"
      data-tv-focus-id={`continue-${slug}`}
    >
      <div className={styles.poster}>
        <img src={poster} alt={title} loading="lazy" />
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <div className={styles.info}>
        <h4>{title}</h4>
        <p>{subtitle}</p>
        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
