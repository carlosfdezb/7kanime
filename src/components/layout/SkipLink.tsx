import styles from './SkipLink.module.css';

/**
 * Skip link for keyboard navigation.
 * Allows users to skip directly to main content.
 */
export function SkipLink() {
  return (
    <a href="#main-content" className={styles.skipLink}>
      Saltar al contenido
    </a>
  );
}