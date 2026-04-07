import { ReactNode } from 'react';
import styles from './Container.module.css';
import { cn } from '../../utils/cn';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn(styles.container, className)}>
      {children}
    </div>
  );
}
