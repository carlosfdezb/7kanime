import { ButtonHTMLAttributes } from 'react';
import styles from './Chip.module.css';
import { cn } from '../../utils/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  selected?: boolean;
}

export function Chip({ label, selected = false, disabled, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        className
      )}
      disabled={disabled}
      aria-pressed={selected}
      {...props}
    >
      {label}
    </button>
  );
}
