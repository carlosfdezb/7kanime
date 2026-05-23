import { SelectHTMLAttributes, forwardRef, useEffect, useRef, useId } from 'react';
import styles from './Select.module.css';
import { cn } from '../../utils/cn';
import { useTVFocus } from '../../context/TVFocusContext';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, error, className, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const { isTVMode } = useTVFocus();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      if (isTVMode) {
        wrapper.setAttribute('data-tv-focus', 'true');
        wrapper.setAttribute('data-tv-focus-id', `select-${selectId}`);
      } else {
        wrapper.removeAttribute('data-tv-focus');
        wrapper.removeAttribute('data-tv-focus-id');
      }
    }, [isTVMode, selectId]);

    return (
      <div ref={wrapperRef} className={styles.wrapper}>
        <select
          ref={ref}
          id={selectId}
          className={cn(styles.select, error && styles.error, className)}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <span id={`${selectId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
