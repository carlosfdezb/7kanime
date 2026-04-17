import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';
import { cn } from '../../utils/cn';

type ButtonVariant =
  | 'primary-blue-cta'
  | 'primary-dark'
  | 'pill-link'
  | 'filter'
  | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary-blue-cta',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        loading && styles.loading,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true" />
      )}
      <span className={loading ? styles.hiddenText : undefined}>{children}</span>
    </button>
  );
}