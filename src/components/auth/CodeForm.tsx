import { FormEvent, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './CodeForm.module.css';
import { Button } from '../ui/Button';
import { OTPInput } from '../ui/OTPInput';

interface CodeFormProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  loading?: boolean;
  error?: string;
  onClearEmail?: () => void;
}

export function CodeForm({
  email,
  onVerify,
  onResend,
  loading = false,
  error,
  onClearEmail,
}: CodeFormProps) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setLocalError('');

      if (code.length !== 6) {
        setLocalError('Por favor, ingresa el código completo de 6 dígitos');
        return;
      }

      try {
        await onVerify(code);
      } catch {
        // Error is handled by parent
      }
    },
    [code, onVerify]
  );

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;

    try {
      await onResend();
      setCode('');
      setResendCooldown(30); // 30 second cooldown
    } catch {
      // Error handled by parent
    }
  }, [resendCooldown, onResend]);

  // Clear code when error changes
  useEffect(() => {
    if (error) {
      setCode('');
    }
  }, [error]);

  const isCodeComplete = code.length === 6;
  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div className={styles.header}>
        <h2 className={styles.title}>Ingresa el código</h2>
        <p className={styles.subtitle}>
          Enviamos un código de 6 dígitos a <strong>{email}</strong>
        </p>
      </div>

      <div className={styles.otpWrapper}>
        <OTPInput
          value={code}
          onChange={setCode}
          disabled={loading}
          error={!!displayError}
          autoFocus
          data-tv-focus-id="login-otp"
        />
      </div>

      {displayError && (
        <div className={styles.alert} role="alert">
          {displayError}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading || !isCodeComplete}
        className={styles.verifyBtn}
        data-tv-focus="true"
        data-tv-focus-id="code-form-verify"
      >
        Verificar código
      </Button>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.resendBtn}
          onClick={handleResend}
          disabled={resendCooldown > 0 || loading}
          data-tv-focus="true"
          data-tv-focus-id="code-form-resend"
        >
          {resendCooldown > 0
            ? `Reenviar código en ${resendCooldown}s`
            : 'No recibí el código — reenviar'}
        </button>

        {onClearEmail && (
          <button
            type="button"
            className={styles.changeEmailBtn}
            onClick={onClearEmail}
            data-tv-focus="true"
            data-tv-focus-id="code-form-change-email"
          >
            Usar otro correo
          </button>
        )}
      </div>

      <div className={styles.footer}>
        <Link to="/login" className={styles.backLink}>
          ← Volver
        </Link>
      </div>
    </form>
  );
}