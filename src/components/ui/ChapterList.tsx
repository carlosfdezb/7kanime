import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ChapterList.module.css';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/formatDate';
import type { MangaChapter } from '../../types/manga';

interface ChapterListProps {
  chapters: MangaChapter[];
  mangaId: number;
  readChapters?: string[];
}

export function ChapterList({ chapters, mangaId, readChapters = [] }: ChapterListProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const toggleChapter = (chapterNumber: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterNumber)) {
        next.delete(chapterNumber);
      } else {
        next.add(chapterNumber);
      }
      return next;
    });
  };

  if (chapters.length === 0) {
    return (
      <p className={styles.emptyState}>Este manga aún no tiene capítulos</p>
    );
  }

  return (
    <div className={styles.chapterList}>
      {chapters.map((chapter) => {
        const isExpanded = expandedChapters.has(chapter.number);
        const hasReadVersion = chapter.versions.some(v => readChapters.includes(v.hash));
        return (
          <div key={chapter.number} className={cn(styles.chapterRow, hasReadVersion && styles.readChapter)}>
            <button
              className={cn(styles.chapterHeader, hasReadVersion && styles.readChapterHeader)}
              onClick={() => toggleChapter(chapter.number)}
              aria-expanded={isExpanded}
            >
              <div className={styles.chapterInfo}>
                {hasReadVersion && <span className={styles.readIndicator}>✓</span>}
                <span className={styles.chapterNumber}>Cap. {chapter.number}</span>
                {chapter.title && (
                  <span className={styles.chapterTitle}>{chapter.title}</span>
                )}
              </div>
              <span className={cn(styles.expandIcon, isExpanded && styles.expanded)}>
                ▼
              </span>
            </button>
            {isExpanded && chapter.versions.length > 0 && (
              <div className={styles.versionList}>
                {chapter.versions.map((version) => (
                  <Link
                    key={version.hash}
                    to={`/manga/${mangaId}/chapter/${version.hash}`}
                    className={styles.versionRow}
                  >
                    <span className={styles.versionScanlator}>{version.scanlator}</span>
                    <span className={styles.versionDate}>{formatDate(version.date)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
