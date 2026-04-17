import { forwardRef, type ReactNode } from 'react';
import styles from './Container.module.css';
import { cn } from '../../utils/cn';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'narrow' | 'full';
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { children, className, variant = 'default' },
  ref
) {
  return (
    <div ref={ref} className={cn(styles.container, styles[variant], className)}>
      {children}
    </div>
  );
});