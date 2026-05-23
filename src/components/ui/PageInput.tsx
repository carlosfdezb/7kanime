import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import styles from './PageInput.module.css';

interface PageInputProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PageInput({ currentPage, totalPages, onPageChange }: PageInputProps) {
  const [inputValue, setInputValue] = useState(String(currentPage));
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  const validateAndSubmit = () => {
    const page = parseInt(inputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    } else {
      setInputValue(String(currentPage));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      validateAndSubmit();
    } else if (e.key === 'Escape') {
      setInputValue(String(currentPage));
      setIsEditing(false);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className={styles.pageInput}>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Página anterior"
      >
        ←
      </button>

      <div className={styles.inputWrapper}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={handleKeyDown}
            onBlur={validateAndSubmit}
            className={styles.input}
            aria-label={`Ir a página (1-${totalPages})`}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setIsEditing(true)}
            aria-label={`Página actual ${currentPage} de ${totalPages}. Click para cambiar`}
          >
            <span className={styles.current}>{currentPage}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.total}>{totalPages}</span>
          </button>
        )}
      </div>

      <button
        type="button"
        className={styles.arrow}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Página siguiente"
      >
        →
      </button>
    </div>
  );
}
