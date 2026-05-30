import styles from './InfoGrid.module.css';

interface InfoItem {
  label: string;
  value: string;
}

interface InfoGridProps {
  items: InfoItem[];
}

export function InfoGrid({ items }: InfoGridProps) {
  return (
    <section className={styles.infoGrid}>
      {items.map((item) => (
        <div key={item.label} className={styles.infoItem}>
          <div className={styles.infoLabel}>{item.label}</div>
          <div className={styles.infoValue}>{item.value}</div>
        </div>
      ))}
    </section>
  );
}
