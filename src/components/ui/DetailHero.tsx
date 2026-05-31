import { useState, type ReactNode, type CSSProperties } from 'react';
import styles from './DetailHero.module.css';

interface DetailHeroProps {
  posterSrc: string;
  posterAlt: string;
  backdropSrc?: string;
  title: string;
  aka?: string;
  status: string;
  type: string;
  year?: string | number;
  countLabel?: string;
  score: number;
  genres: string[];
  themeColor?: string;
  breadcrumb?: ReactNode;
  children?: ReactNode;
}

export function DetailHero({
  posterSrc,
  posterAlt,
  backdropSrc,
  title,
  aka,
  status,
  type,
  year,
  countLabel,
  score,
  genres,
  themeColor,
  breadcrumb,
  children,
}: DetailHeroProps) {
  const [backdropError, setBackdropError] = useState(false);
  const [posterError, setPosterError] = useState(false);

  const hasBackdrop = backdropSrc && !backdropError;

  const rootStyle: CSSProperties | undefined = themeColor
    ? { '--theme-accent': themeColor } as CSSProperties
    : undefined;

  return (
    <section className={styles.detailHero} style={rootStyle}>
      {hasBackdrop && (
        <div className={styles.detailBackdrop}>
          <img
            src={backdropSrc}
            alt=""
            aria-hidden="true"
            onError={() => setBackdropError(true)}
          />
        </div>
      )}

      {breadcrumb && (
        <div className={styles.breadcrumbWrapper}>
          {breadcrumb}
        </div>
      )}

      <div className={styles.detailHeroContent}>
        <div className={styles.detailPoster}>
          {!posterError ? (
            <img
              src={posterSrc}
              alt={posterAlt}
              onError={() => setPosterError(true)}
            />
          ) : (
            <div className={styles.posterPlaceholder} />
          )}
        </div>

        <div className={styles.detailInfo}>
          <div className={styles.detailMetaTop}>
            <span className={`${styles.badge} ${styles.badgeStatus}`}>
              {status}
            </span>
            <span className={`${styles.badge} ${styles.badgeType}`}>
              {type}
            </span>
            {year !== undefined && (
              <span className={`${styles.badge} ${styles.badgeType}`}>
                {year}
              </span>
            )}
            {countLabel && (
              <span className={`${styles.badge} ${styles.badgeType}`}>
                {countLabel}
              </span>
            )}
            {score > 0 && (
              <span className={styles.scoreBadge}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                {score.toFixed(1)}
              </span>
            )}
          </div>

          <h1 className={styles.detailTitle}>{title}</h1>
          {aka && <p className={styles.detailAka}>{aka}</p>}

          {genres.length > 0 && (
            <div className={styles.detailGenres}>
              {genres.map((genre) => (
                <span key={genre} className={styles.genreChip}>
                  {genre}
                </span>
              ))}
            </div>
          )}

          {children && (
            <div className={styles.detailActions}>{children}</div>
          )}
        </div>
      </div>
    </section>
  );
}
