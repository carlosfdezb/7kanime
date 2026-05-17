import { Link } from 'react-router-dom';
import styles from './ChapterList.module.css';
import { cn } from '../../utils/cn';

interface ChapterItem {
  publicId: string;
  numeroCapitulo: string;
  title?: string;
}

interface ChapterListProps {
  chapters: ChapterItem[];
  mangaId: string;
  readChapters?: string[];
}

export function ChapterList({ chapters, mangaId, readChapters = [] }: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <p className={styles.emptyState}>Este manga aún no tiene capítulos</p>
    );
  }

  return (
    <div className={styles.chapterList}>
      {chapters.map((chapter) => {
        const isRead = readChapters.includes(chapter.publicId);
        return (
          <Link
            key={chapter.publicId}
            to={`/manga/${mangaId}/chapter/${chapter.publicId}`}
            className={cn(styles.chapterRow, isRead && styles.readChapter)}
          >
            <span className={styles.chapterNumberBadge}>{chapter.numeroCapitulo}</span>
            <div className={styles.chapterInfo}>
              <span className={styles.chapterLabel}>Capítulo {chapter.numeroCapitulo}</span>
              {chapter.title && (
                <span className={styles.chapterTitle}>{chapter.title}</span>
              )}
            </div>
            {isRead && <span className={styles.readIndicator}>✓</span>}
          </Link>
        );
      })}
    </div>
  );
}
