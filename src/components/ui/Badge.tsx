import styles from './Badge.module.css';
import { cn } from '../../utils/cn';

interface BadgeProps {
  variant?: 'status' | 'score' | 'type' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'neutral'> = {
  'Airing': 'success',
  'Finished': 'neutral',
  'Upcoming': 'warning',
};

const TYPE_VARIANTS: Record<string, 'primary' | 'secondary' | 'accent'> = {
  'TV Anime': 'primary',
  'OVA': 'secondary',
  'Película': 'accent',
  'Especial': 'secondary',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  let badgeVariant = 'neutral';
  
  if (variant === 'status' && typeof children === 'string') {
    badgeVariant = STATUS_VARIANTS[children] || 'neutral';
  } else if (variant === 'type' && typeof children === 'string') {
    badgeVariant = TYPE_VARIANTS[children] || 'primary';
  }

  return (
    <span className={cn(styles.badge, styles[badgeVariant], className)}>
      {children}
    </span>
  );
}
