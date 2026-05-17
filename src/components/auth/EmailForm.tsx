import { FormEvent, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './EmailForm.module.css';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface EmailFormProps {
  onSubmit: (email: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function EmailForm({ onSubmit, loading = false, error }: EmailFormProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setEmailError('');

      if (!email.trim()) {
        setEmailError('Por favor, ingresa tu correo electrónico');
        return;
      }

      if (!validateEmail(email)) {
        setEmailError('Por favor, ingresa un correo electrónico válido');
        return;
      }

      try {
        await onSubmit(email);
        setSuccess(true);
      } catch {
        // Error is handled by parent
      }
    },
    [email, onSubmit]
  );

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError('');
  };

  if (success) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className={styles.successTitle}>Revisa tu correo</h2>
        <p className={styles.successText}>
          Te enviamos un código de acceso a <strong>{email}</strong>
        </p>
        <p className={styles.successHint}>
          Ingresa el código de 6 dígitos para continuar.
        </p>
        <Button
          variant="ghost"
          onClick={() => {
            setSuccess(false);
            setEmail('');
          }}
          className={styles.resetBtn}
          data-tv-focus="true"
          data-tv-focus-id="email-form-reset"
        >
          Usar otro correo
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>
          Correo electrónico
        </label>
        <Input
          id="email"
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          error={emailError}
          autoComplete="email"
          disabled={loading}
          data-tv-focus="true"
          data-tv-focus-id="login-email"
        />
      </div>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading || !email.trim()}
        className={styles.submitBtn}
        data-tv-focus="true"
        data-tv-focus-id="email-form-submit"
      >
        Enviar código de acceso
      </Button>

      <div className={styles.footer}>
        <Link to="/" className={styles.backLink}>
          ← Volver al inicio
        </Link>
      </div>
    </form>
  );
}