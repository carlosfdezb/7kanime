import { useEffect, useRef } from 'react';
import styles from './EasterEgg.module.css';
import easterImage from '../../assets/easter.jpg';

interface EasterEggProps {
  onClose: () => void;
}

export function EasterEgg({ onClose }: EasterEggProps) {
  // Use ref to avoid re-attaching listener on every render
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // No dependencies - always uses latest onClose via ref
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <img src={easterImage} alt="Easter egg" className={styles.image} />
      </div>
    </div>
  );
}
