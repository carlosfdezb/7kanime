import { useEffect, useRef, type ReactNode, type ComponentType, type ElementType } from 'react';
import { Link } from 'react-router-dom';
import { useTVFocus } from '../../context/TVFocusContext';
import { useTVNavigationStore } from '../../store/tvNavigationStore';
import tvFocusStyles from '../../styles/tv-focus.module.css';
import { cn } from '../../utils/cn';

interface FocusableProps {
  as?: ElementType;
  id?: string | number;
  className?: string;
  children?: ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  [key: string]: unknown;
}

// Global counter for generating unique IDs
let focusableIdCounter = 0;

export function Focusable({
  as,
  id,
  className,
  children,
  to,
  href,
  onClick,
  variant,
  ...props
}: FocusableProps) {
  const { isTVMode } = useTVFocus();
  const { focusedId, setFocusedId } = useTVNavigationStore();
  const divRef = useRef<HTMLDivElement>(null);
  const focusableId = useRef(id ?? `focusable-${focusableIdCounter++}`);

  // Set data attributes on mount
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    el.setAttribute('data-tv-focus', 'true');
    el.setAttribute('data-tv-focus-id', String(focusableId.current));

    return () => {
      el.removeAttribute('data-tv-focus');
      el.removeAttribute('data-tv-focus-id');
    };
  }, []);

  // Update focused class based on store state
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    if (isTVMode && focusedId === focusableId.current) {
      el.classList.add(tvFocusStyles.focused);
    } else {
      el.classList.remove(tvFocusStyles.focused);
    }
  }, [isTVMode, focusedId]);

  // Handle click - update store focus state
  const handleClick = () => {
    if (isTVMode && divRef.current) {
      setFocusedId(String(focusableId.current));
    }
    onClick?.();
  };

  // Check if it's a Link component
  const isLink = as === Link || (typeof as === 'string' && as === 'a');
  const isButton = typeof as === 'string' && as === 'button';

  // If as is a React component (like Button), render it with props
  if (as && !isLink && !isButton && typeof as !== 'string') {
    const Component = as as ComponentType<any>;
    return (
      <Component
        {...props}
        variant={variant}
        className={cn(className)}
        onClick={handleClick}
        ref={divRef as unknown as React.RefObject<any>}
      >
        {children}
      </Component>
    );
  }

  // Render based on element type
  if (isLink || to) {
    return (
      <Link
        to={to || '#'}
        {...props}
        className={cn(className)}
        ref={divRef as unknown as React.RefObject<HTMLAnchorElement>}
        onClick={handleClick}
      >
        {children}
      </Link>
    );
  }

  if (isButton) {
    return (
      <button
        type="button"
        {...props}
        className={cn(className)}
        ref={divRef as unknown as React.RefObject<HTMLButtonElement>}
        onClick={handleClick}
      >
        {children}
      </button>
    );
  }

  // Default div
  return (
    <div
      {...props}
      className={cn(className)}
      ref={divRef}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}