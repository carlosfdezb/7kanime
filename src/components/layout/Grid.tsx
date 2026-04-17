import { ReactNode } from 'react';
import styles from './Grid.module.css';
import { cn } from '../../utils/cn';

interface GridProps {
  children: ReactNode;
  className?: string;
}

export function Grid({ children, className }: GridProps) {
  return (
    <div className={cn(styles.grid, className)}>
      {children}
    </div>
  );
}