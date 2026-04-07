import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className={styles.page}>
      <Container>
        <div className={styles.content}>
          <h1 className={styles.title}>404</h1>
          <p className={styles.message}>Página no encontrada</p>
          <p className={styles.description}>
            Lo sentimos, la página que buscas no existe o fue movida.
          </p>
          <Link to="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
