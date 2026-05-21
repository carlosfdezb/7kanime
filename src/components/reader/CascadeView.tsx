import { useEffect, useRef, useCallback } from 'react';
import styles from './CascadeView.module.css';

interface CascadeViewProps {
  pages: string[];
  imageErrors: Set<number>;
  onImageError: (pageIndex: number) => void;
  onImageLoad: (pageIndex: number) => void;
  onMidpointReached?: () => void;
}

export function CascadeView({
  pages,
  imageErrors,
  onImageError,
  onImageLoad,
  onMidpointReached,
}: CascadeViewProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observerCreatedAt = useRef<number>(0);

  const midpointPage = Math.max(1, Math.floor(pages.length / 2));

  const midpointRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node || !onMidpointReached) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const now = Date.now();
          if (now - observerCreatedAt.current < 50) return;
          onMidpointReached();
          observerRef.current?.disconnect();
          observerRef.current = null;
        }
      },
      { threshold: 0.1 }
    );
    observerCreatedAt.current = Date.now();
    observerRef.current.observe(node);
  }, [onMidpointReached]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  if (pages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontraron páginas para este capítulo</p>
      </div>
    );
  }

  return (
    <div className={styles.imageStack}>
      {pages.map((imageUrl, index) => {
        const pageNum = index + 1;
        const hasError = imageErrors.has(pageNum);

        return (
          <div
            key={pageNum}
            ref={pageNum === midpointPage ? midpointRef : undefined}
            className={styles.pageWrapper}
          >
            {hasError ? (
              <div className={styles.imageError}>
                <span className={styles.imageErrorIcon}>🖼️</span>
                <span>Error al cargar la imagen</span>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={`Página ${pageNum}`}
                className={styles.pageImage}
                onLoad={() => onImageLoad(pageNum)}
                onError={() => onImageError(pageNum)}
              />
            )}
            <span className={styles.pageNumber}>{pageNum}</span>
          </div>
        );
      })}
    </div>
  );
}