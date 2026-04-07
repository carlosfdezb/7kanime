import { ReactNode } from 'react';
import styles from './Grid.module.css';
import { cn } from '../../utils/cn';

interface GridProps {
  children: ReactNode;
  className?: string;
  cols?: 2 | 3 | 4 | 5 | 6;
}

export function Grid({ children, className, cols = 4 }: GridProps) {
  return (
    <div className={cn(styles.grid, styles[`cols${cols}`], className)}>
      {children}
    </div>
  );
}
