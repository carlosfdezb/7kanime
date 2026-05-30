import { Link } from 'react-router-dom';
import styles from './ChapterRow.module.css';

interface ChapterRowProps {
  number: string;
  title?: string;
  scanlator?: string;
  date?: string;
  read?: boolean;
  to?: string;
  onClick?: () => void;
}

export function ChapterRow({
  number,
  title,
  scanlator,
  date,
  read,
  to,
  onClick,
}: ChapterRowProps) {
  const content = (
    <>
      <div className={styles.chapterReadIcon}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
      <div className={styles.chapterNum}>{number}</div>
      <div className={styles.chapterInfo}>
        <div className={styles.chapterTitle}>
          {title || `Capítulo ${number}`}
        </div>
        <div className={styles.chapterMeta}>
          <span>Capítulo {number}</span>
          {read && <span className={styles.readLabel}>Leído</span>}
          {scanlator && <span>{scanlator}</span>}
        </div>
      </div>
      {date && (
        <div className={styles.chapterDate}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {date}
        </div>
      )}
      {read && <div className={styles.chapterStatus} />}
    </>
  );

  const className = `${styles.chapterRow} ${read ? styles.read : ''}`;

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
