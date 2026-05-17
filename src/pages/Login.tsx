import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useClerk } from '@clerk/clerk-react';
import type { SignUpResource } from '@clerk/shared/types';
import styles from './Login.module.css';
import { EmailForm } from '../components/auth/EmailForm';
import { CodeForm } from '../components/auth/CodeForm';

type LoginState = 'email' | 'sending' | 'code' | 'verifying';

export function Login() {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const clerk = useClerk();

  const [state, setState] = useState<LoginState>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signUpRef = useRef<SignUpResource | null>(null);

  const handleSendCode = useCallback(
    async (submitEmail: string) => {
      if (!isLoaded) return;

      setLoading(true);
      setError('');
      signUpRef.current = null;

      try {
        await signIn.create({
          strategy: 'email_code',
          identifier: submitEmail,
        });

        setEmail(submitEmail);
        setState('code');
      } catch (err: any) {
        const clerkError = err?.errors?.[0];
        
        if (clerkError?.code === 'form_identifier_not_found') {
          try {
            const signUp = await clerk.client.signUp.create({
              emailAddress: submitEmail,
            });
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            signUpRef.current = signUp;
            setEmail(submitEmail);
            setState('code');
          } catch (signUpErr: any) {
            const message = signUpErr?.errors?.[0]?.message 
              || signUpErr?.message 
              || 'No se pudo enviar el código. Intenta de nuevo.';
            setError(message);
          }
        } else {
          const message =
            err instanceof Error
              ? err.message
              : 'No se pudo enviar el código. Intenta de nuevo.';

          if (message.includes('already')) {
            setError('Este correo ya está registrado. Intenta iniciar sesión.');
          } else {
            setError(message);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, signIn, clerk]
  );

  const handleVerify = useCallback(
    async (code: string) => {
      if (!isLoaded) return;

      setLoading(true);
      setError('');

      try {
        if (signUpRef.current) {
          const result = await signUpRef.current.attemptEmailAddressVerification({
            code,
          });

          if (result.status === 'complete') {
            await setActive({ session: result.createdSessionId });
            navigate('/', { replace: true });
          } else {
            setError('Verificación incompleta. Intenta de nuevo.');
          }
        } else if (signIn) {
          const result = await signIn.attemptFirstFactor({
            strategy: 'email_code',
            code,
          });

          if (result.status === 'complete') {
            await setActive({ session: result.createdSessionId });
            navigate('/', { replace: true });
          } else {
            setError('Verificación incompleta. Intenta de nuevo.');
          }
        }
      } catch (err: any) {
        const message =
          err?.errors?.[0]?.message ||
          err?.message ||
          'Código inválido. Intenta de nuevo.';

        if (
          message.includes('incorrect') ||
          message.includes('invalid') ||
          message.includes('expired')
        ) {
          setError('Código incorrecto o expirado. Intenta de nuevo.');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, signIn, setActive, navigate]
  );

  const handleResend = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      if (signUpRef.current) {
        await signUpRef.current.prepareEmailAddressVerification({ strategy: 'email_code' });
      } else if (signIn) {
        await signIn.create({
          strategy: 'email_code',
          identifier: email,
        });
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.message || err?.message || 'No se pudo reenviar el código.';

      if (message.includes('too many') || message.includes('rate')) {
        setError('Demasiados intentos. Espera un momento antes de reenviar.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, email]);

  const handleClearEmail = useCallback(() => {
    setState('email');
    setEmail('');
    setError('');
    signUpRef.current = null;
  }, []);

  if (!isLoaded) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.loadingState}>
              <div className={styles.spinner} aria-label="Cargando..." />
              <p className={styles.loadingText}>Cargando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {state === 'email' ? 'Iniciar sesión' : 'Verificar código'}
            </h1>
            <p className={styles.subtitle}>
              {state === 'email'
                ? 'Ingresa tu correo y te enviaremos un código de acceso'
                : 'Revisa tu correo e ingresa el código de 6 dígitos'}
            </p>
          </div>

          {state === 'email' && (
            <EmailForm
              onSubmit={handleSendCode}
              loading={loading}
              error={error}
            />
          )}

          {state === 'code' && (
            <CodeForm
              email={email}
              onVerify={handleVerify}
              onResend={handleResend}
              loading={loading}
              error={error}
              onClearEmail={handleClearEmail}
            />
          )}
        </div>
      </div>
    </div>
  );
}