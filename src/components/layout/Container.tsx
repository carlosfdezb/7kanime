import { forwardRef, type ReactNode } from 'react';
import styles from './Container.module.css';
import { cn } from '../../utils/cn';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container({ children, className }, ref) {
  return (
    <div ref={ref} className={cn(styles.container, className)}>
      {children}
    </div>
  );
});
