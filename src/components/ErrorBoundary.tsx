import { Component, ReactNode } from 'react';
import { Button } from './ui/Button';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.icon}>⚠️</div>
            <h1 className={styles.title}>Algo salió mal</h1>
            <p className={styles.message}>
              Lo sentimos, algo inesperado ocurrió. Podés intentar recargar la página.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className={styles.error}>{this.state.error.message}</pre>
            )}
            <Button onClick={this.handleReload}>
              Reintentar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}