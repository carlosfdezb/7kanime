import { InputHTMLAttributes, forwardRef, useEffect, useRef, useId } from 'react';
import styles from './Input.module.css';
import { cn } from '../../utils/cn';
import { useTVFocus } from '../../context/TVFocusContext';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const { isTVMode } = useTVFocus();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Add TV focus attributes when in TV mode
    useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      if (isTVMode) {
        wrapper.setAttribute('data-tv-focus', 'true');
        wrapper.setAttribute('data-tv-focus-id', `input-${inputId}`);
      } else {
        wrapper.removeAttribute('data-tv-focus');
        wrapper.removeAttribute('data-tv-focus-id');
      }
    }, [isTVMode, inputId]);

    // Update focused class based on TV focus state
    useEffect(() => {
      if (!isTVMode || !wrapperRef.current) return;

      const handleFocusChange = () => {
        if (!wrapperRef.current) return;
        if ((window as any).__tvFocusedId === `input-${inputId}`) {
          wrapperRef.current.classList.add('tv-focused');
        } else {
          wrapperRef.current.classList.remove('tv-focused');
        }
      };

      window.addEventListener('tv-focus-change', handleFocusChange);
      return () => window.removeEventListener('tv-focus-change', handleFocusChange);
    }, [isTVMode, inputId]);

    return (
      <div ref={wrapperRef} className={cn(styles.wrapper)}>
        <input
          ref={ref}
          id={inputId}
          className={cn(styles.input, error && styles.error, className)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
