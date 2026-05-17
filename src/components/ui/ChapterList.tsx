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
            <div className={styles.chapterInfo}>
              {isRead && <span className={styles.readIndicator}>✓</span>}
              <span className={styles.chapterNumber}>Cap. {chapter.numeroCapitulo}</span>
              {chapter.title && (
                <span className={styles.chapterTitle}>{chapter.title}</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
