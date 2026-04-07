import styles from './Skeleton.module.css';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'rectangular',
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(styles.skeleton, styles[variant], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn(styles.card, className)} aria-busy="true" aria-label="Cargando...">
      <div className={styles.cardPoster} />
      <div className={styles.cardBody}>
        <div className={styles.line} style={{ width: '80%' }} />
        <div className={styles.line} style={{ width: '60%' }} />
      </div>
    </div>
  );
}
