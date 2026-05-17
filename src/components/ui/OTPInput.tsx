import { useRef, useCallback } from 'react';
import styles from './OTPInput.module.css';
import { cn } from '../../utils/cn';
import { useTVFocus } from '../../context/TVFocusContext';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  'data-tv-focus-id'?: string;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = false,
  'data-tv-focus-id': tvFocusId = 'otp-input',
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { isTVMode } = useTVFocus();

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (!/^\d*$/.test(digit)) return;

      const newValue = value.split('');
      newValue[index] = digit;
      const updated = newValue.join('');

      // Auto-advance to next input if digit entered
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      onChange(updated);
    },
    [value, onChange, length]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;

      if (key === 'Backspace') {
        e.preventDefault();
        const currentValue = value[index];

        if (currentValue) {
          // Clear current digit
          const newValue = value.split('');
          newValue[index] = '';
          onChange(newValue.join(''));
        } else if (index > 0) {
          // Move to previous and clear it
          const newValue = value.split('');
          newValue[index - 1] = '';
          onChange(newValue.join(''));
          inputRefs.current[index - 1]?.focus();
        }
        return;
      }

      if (key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
        return;
      }

      if (key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
        return;
      }
    },
    [value, onChange, length]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text/plain').trim();

      if (!/^\d+$/.test(pastedData)) return;

      const digits = pastedData.slice(0, length).split('');
      const newValue = Array(length).fill('');

      digits.forEach((digit, i) => {
        newValue[i] = digit;
      });

      onChange(newValue.join(''));

      // Focus last filled input or last input
      const lastFilledIndex = Math.min(digits.length - 1, length - 1);
      inputRefs.current[lastFilledIndex]?.focus();
    },
    [onChange, length]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      (e.target as HTMLInputElement).select();
    },
    []
  );

  return (
    <div
      className={cn(styles.container)}
      data-tv-focus={isTVMode ? 'true' : undefined}
      data-tv-focus-id={isTVMode ? tvFocusId : undefined}
      role="group"
      aria-label="Código OTP de 6 dígitos"
    >
      {Array.from({ length }, (_, i) => {
        const digit = value[i] || '';
        const isFilled = digit !== '';
        const isFocused =
          inputRefs.current[i] ===
          inputRefs.current.find((ref) => ref === document.activeElement);

        return (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            className={cn(
              styles.input,
              isFilled && styles.filled,
              isFocused && styles.focused,
              error && styles.error
            )}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            onFocus={handleFocus}
            aria-label={`Dígito ${i + 1} de ${length}`}
            data-tv-focus={isTVMode ? 'true' : undefined}
            data-tv-focus-id={isTVMode ? `${tvFocusId}-${i}` : undefined}
            autoFocus={autoFocus && i === 0}
          />
        );
      })}
    </div>
  );
}