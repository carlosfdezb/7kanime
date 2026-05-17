import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import styles from './Button.module.css';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'primary', loading = false, disabled, children, className, ...props }, ref) {
    return (
      <button
        ref={ref}
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
);
