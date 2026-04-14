import { ButtonHTMLAttributes, useEffect, useRef } from 'react';
import styles from './Chip.module.css';
import tvFocusStyles from '../../styles/tv-focus.module.css';
import { cn } from '../../utils/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  selected?: boolean;
}

let chipIdCounter = 0;

export function Chip({ label, selected = false, disabled, className, ...props }: ChipProps) {
  const chipId = useRef(`chip-${chipIdCounter++}`);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Add TV focus attributes
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    el.setAttribute('data-tv-focus', 'true');
    el.setAttribute('data-tv-focus-id', chipId.current);

    return () => {
      el.removeAttribute('data-tv-focus');
      el.removeAttribute('data-tv-focus-id');
    };
  }, []);

  // Handle TV focus state changes
  useEffect(() => {
    if (!buttonRef.current) return;

    const handleFocusChange = () => {
      if (!buttonRef.current) return;
      
      if ((window as any).__tvFocusedId === chipId.current) {
        buttonRef.current.classList.add(tvFocusStyles.focused);
      } else {
        buttonRef.current.classList.remove(tvFocusStyles.focused);
      }
    };

    window.addEventListener('tv-focus-change', handleFocusChange);
    return () => window.removeEventListener('tv-focus-change', handleFocusChange);
  }, []);

  // Handle click - update global focus state
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    (window as any).__tvFocusedId = chipId.current;
    window.dispatchEvent(new CustomEvent('tv-focus-change'));
    props.onClick?.(e);
  };

  return (
    <button
      type="button"
      ref={buttonRef}
      className={cn(
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        className
      )}
      disabled={disabled}
      aria-pressed={selected}
      onClick={handleClick}
      {...props}
    >
      {label}
    </button>
  );
}
