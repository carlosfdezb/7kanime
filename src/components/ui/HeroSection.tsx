import { Link } from 'react-router-dom';
import styles from './HeroSection.module.css';
import { cn } from '../../utils/cn';

export interface HeroAction {
  label: string;
  to: string;
  variant: 'primary' | 'ghost';
  icon?: 'play' | 'info';
}

export interface HeroSectionProps {
  backdrop: string;
  title: string;
  synopsis: string;
  badge?: string;
  meta?: string;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  className?: string;
  compact?: boolean;
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function HeroSection({
  backdrop,
  title,
  synopsis,
  badge,
  meta,
  primaryAction,
  secondaryAction,
  className,
  compact = false,
}: HeroSectionProps) {
  return (
    <section className={cn(styles.hero, compact && styles.compact, className)}>
      <div className={styles.backdrop}>
        <img src={backdrop} alt="" loading="eager" />
      </div>
      <div className={styles.content}>
        {(badge || meta) && (
          <div className={styles.meta}>
            {badge && <span className={styles.badge}>{badge}</span>}
            {meta && <span>{meta}</span>}
          </div>
        )}
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.synopsis}>{synopsis}</p>
        {(primaryAction || secondaryAction) && (
          <div className={styles.actions}>
            {primaryAction && (
              <Link
                to={primaryAction.to}
                className={styles.btnPrimary}
                data-tv-focus="true"
                data-tv-focus-id="hero-primary"
              >
                {primaryAction.icon === 'play' && <PlayIcon />}
                {primaryAction.icon === 'info' && <InfoIcon />}
                {primaryAction.label}
              </Link>
            )}
            {secondaryAction && (
              <Link
                to={secondaryAction.to}
                className={styles.btnGhost}
                data-tv-focus="true"
                data-tv-focus-id="hero-secondary"
              >
                {secondaryAction.icon === 'play' && <PlayIcon />}
                {secondaryAction.icon === 'info' && <InfoIcon />}
                {secondaryAction.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
