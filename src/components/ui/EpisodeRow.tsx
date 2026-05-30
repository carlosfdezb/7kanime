import { Link } from 'react-router-dom';
import styles from './EpisodeRow.module.css';

interface EpisodeRowProps {
  number: number;
  title?: string;
  duration?: string;
  watched?: boolean;
  to?: string;
  onClick?: () => void;
}

export function EpisodeRow({
  number,
  title,
  duration,
  watched,
  to,
  onClick,
}: EpisodeRowProps) {
  const content = (
    <>
      <div className={styles.episodePlay}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </div>
      <div className={styles.episodeNum}>
        {String(number).padStart(2, '0')}
      </div>
      <div className={styles.episodeInfo}>
        <div className={styles.episodeTitle}>
          {title || `Episodio ${number}`}
        </div>
        <div className={styles.episodeMeta}>
          <span>Episodio {number}</span>
          {watched && (
            <span className={styles.watchedLabel}>Visto</span>
          )}
        </div>
      </div>
      {duration && (
        <div className={styles.episodeDuration}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          {duration}
        </div>
      )}
      {watched && <div className={styles.episodeStatus} />}
    </>
  );

  const className = `${styles.episodeRow} ${watched ? styles.watched : ''}`;

  if (to) {
    return (
      <Link to={to} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div
      className={className}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {content}
    </div>
  );
}
