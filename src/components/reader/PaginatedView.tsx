import { useEffect, useRef, useCallback } from 'react';
import styles from './PaginatedView.module.css';

interface PaginatedViewProps {
  pages: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onLastPageReached?: () => void;
  imageErrors: Set<number>;
  onImageError: (pageIndex: number) => void;
  onImageLoad?: (pageIndex: number) => void;
}

export function PaginatedView({
  pages,
  currentPage,
  onPageChange,
  onLastPageReached,
  imageErrors,
  onImageError,
  onImageLoad,
}: PaginatedViewProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastPageReachedFired = useRef(false);
  const totalPages = pages.length;

  const hasError = imageErrors.has(currentPage + 1);

  // Reset lastPageReached flag when page changes away from last
  useEffect(() => {
    if (currentPage < totalPages - 1) {
      lastPageReachedFired.current = false;
    }
  }, [currentPage, totalPages]);

  // Fire onLastPageReached once when reaching last page
  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage === totalPages - 1 &&
      onLastPageReached &&
      !lastPageReachedFired.current
    ) {
      lastPageReachedFired.current = true;
      onLastPageReached();
    }
  }, [currentPage, totalPages, onLastPageReached]);

  // Preload adjacent pages for instant navigation
  useEffect(() => {
    if (totalPages === 0) return;

    const preload = (pageIndex: number) => {
      if (pageIndex < 0 || pageIndex >= totalPages) return;
      const img = new Image();
      img.src = pages[pageIndex];
    };

    // Preload previous and next pages
    preload(currentPage - 1);
    preload(currentPage + 1);
  }, [currentPage, totalPages, pages]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    // Manga RTL navigation: right-to-left reading direction
    switch (e.key) {
      case 'ArrowLeft':
      case 'd':
      case 'D':
        e.preventDefault();
        // Left arrow / D = next page (advance forward in manga)
        onPageChange(Math.min(totalPages - 1, currentPage + 1));
        break;
      case 'ArrowRight':
      case 'a':
      case 'A':
        e.preventDefault();
        // Right arrow / A = previous page (go back in manga)
        onPageChange(Math.max(0, currentPage - 1));
        break;
    }
  }, [currentPage, totalPages, onPageChange]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

    // Horizontal dominant swipe, above threshold
    // Manga RTL: swipe right = next page (advance), swipe left = prev page (go back)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swipe right → next page (advance forward in manga)
        onPageChange(Math.min(totalPages - 1, currentPage + 1));
      } else {
        // Swipe left → prev page (go back in manga)
        onPageChange(Math.max(0, currentPage - 1));
      }
    }

    touchStartRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements (buttons, links, inputs, etc.)
    const target = e.target as HTMLElement;
    const interactiveElements = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL'];
    
    // Check if the click target or any parent is an interactive element
    let currentElement: HTMLElement | null = target;
    while (currentElement) {
      if (interactiveElements.includes(currentElement.tagName)) {
        return; // Let the interactive element handle the click
      }
      if (currentElement.classList.contains(styles.clickZoneLeft) || 
          currentElement.classList.contains(styles.clickZoneRight)) {
        break; // Reached our click zone, continue with navigation
      }
      currentElement = currentElement.parentElement;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const midpoint = rect.width / 2;

    // Manga RTL: click right half = prev page, click left half = next page
    if (clickX > midpoint) {
      // Right half → previous page (go back in manga)
      onPageChange(Math.max(0, currentPage - 1));
    } else {
      // Left half → next page (advance forward in manga)
      onPageChange(Math.min(totalPages - 1, currentPage + 1));
    }
  };

  if (totalPages === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontraron páginas para este capítulo</p>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div className={styles.imageWrapper}>
        {hasError ? (
          <div className={styles.imageError}>
            <span className={styles.imageErrorIcon}>🖼️</span>
            <span>Error al cargar la imagen</span>
          </div>
        ) : (
          <img
            src={pages[currentPage]}
            alt={`Página ${currentPage + 1}`}
            className={styles.pageImage}
            onLoad={() => onImageLoad?.(currentPage + 1)}
            onError={() => onImageError(currentPage + 1)}
          />
        )}
      </div>

      <div className={styles.pageIndicator}>
        {currentPage + 1} / {totalPages}
      </div>

      {/* Navigation is handled by onClick on the container */}
      {/* Click zones removed - they were blocking UI buttons with position:fixed */}
    </div>
  );
}