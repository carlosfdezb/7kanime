import { Link } from 'react-router-dom';
import styles from './MangaBreadcrumb.module.css';

interface MangaBreadcrumbItem {
  label: string;
  href?: string;
}

interface MangaBreadcrumbProps {
  items: MangaBreadcrumbItem[];
}

export function MangaBreadcrumb({ items }: MangaBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className={styles.item}>
              {isLast ? (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link to={item.href || '/manga'} className={styles.link}>
                    {item.label}
                  </Link>
                  <span className={styles.separator} aria-hidden="true">
                    ›
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
