import { Link } from 'react-router-dom';
import type { MangaChapter } from '../../types/manga';
import styles from './ReaderNavigation.module.css';

interface ReaderNavigationProps {
  prevChapter: MangaChapter | null;
  nextChapter: MangaChapter | null;
  mangaId: string;
  currentPage?: number;
  totalPages?: number;
}

export function ReaderNavigation({
  prevChapter,
  nextChapter,
  mangaId,
  currentPage,
  totalPages,
}: ReaderNavigationProps) {
  return (
    <div className={styles.navigation}>
      {prevChapter ? (
        <Link
          to={`/manga/${mangaId}/chapter/${prevChapter.publicId}`}
          className={styles.navLink}
        >
          <span className={styles.navArrow}>←</span>
          <span className={styles.navLabel}>
            <span className={styles.navChapterNum}>Cap. {prevChapter.numeroCapitulo}</span>
            {prevChapter.title && <span className={styles.navChapterTitle}>{prevChapter.title}</span>}
          </span>
        </Link>
      ) : (
        <span className={`${styles.navLink} ${styles.disabled}`}>
          <span className={styles.navArrow}>←</span>
          <span className={styles.navLabel}>Anterior</span>
        </span>
      )}

      {currentPage !== undefined && totalPages !== undefined ? (
        <span className={styles.pageIndicator}>
          {currentPage + 1} / {totalPages}
        </span>
      ) : (
        <span className={styles.pageIndicator}>
          {prevChapter ? `Cap. ${prevChapter.numeroCapitulo}` : ''}
          {nextChapter ? `Cap. ${nextChapter.numeroCapitulo}` : ''}
        </span>
      )}

      {nextChapter ? (
        <Link
          to={`/manga/${mangaId}/chapter/${nextChapter.publicId}`}
          className={styles.navLink}
        >
          <span className={styles.navLabel}>
            <span className={styles.navChapterNum}>Cap. {nextChapter.numeroCapitulo}</span>
            {nextChapter.title && <span className={styles.navChapterTitle}>{nextChapter.title}</span>}
          </span>
          <span className={styles.navArrow}>→</span>
        </Link>
      ) : (
        <span className={`${styles.navLink} ${styles.disabled}`}>
          <span className={styles.navLabel}>Siguiente</span>
          <span className={styles.navArrow}>→</span>
        </span>
      )}
    </div>
  );
}