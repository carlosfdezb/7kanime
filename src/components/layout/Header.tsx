import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, FormEvent } from 'react';
import styles from './Header.module.css';
import { Input, Button } from '../';
import { useDebounce, useAnimeFavorites } from '../../hooks';
import { useThemeStore } from '../../store/themeStore';

interface HeaderProps {
  onSearch?: (query: string) => void;
  showFavorites?: boolean;
  onToggleFavorites?: () => void;
}

export function Header({ onSearch, showFavorites = false, onToggleFavorites }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchValue, 300);
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites } = useAnimeFavorites();
  const { theme, toggleTheme } = useThemeStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (debouncedSearch.trim().length >= 2) {
      navigate(`/?search=${encodeURIComponent(debouncedSearch)}`);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleFavoritesClick = () => {
    if (onToggleFavorites) {
      onToggleFavorites();
    } else if (showFavorites) {
      navigate('/');
    } else {
      navigate('/?favorites=true');
    }
  };

  const isOnHome = location.pathname === '/';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="7Kanime - Inicio" data-tv-focus="true" data-tv-focus-id="header-logo">
          <span className={styles.logoAccent}>7K</span><span className={styles.logoText}>anime</span>
        </Link>

        <nav className={styles.nav} aria-label="Navegación principal">
          <Link to="/" className={`${styles.navLink} ${isOnHome ? styles.navLinkActive : ''}`}>Anime</Link>
        </nav>

        <button
          type="button"
          className={styles.searchToggle}
          aria-label="Buscar"
          onClick={() => searchInputRef.current?.focus()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>

        <form className={styles.searchForm} onSubmit={handleSubmit} data-tv-focus="true" data-tv-focus-id="search-form">
          <Input
            type="search"
            placeholder="Buscar anime..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Buscar anime"
            className={styles.searchInput}
            ref={searchInputRef}
          />
        </form>

        <Button
          variant="ghost"
          onClick={handleFavoritesClick}
          className={`${styles.favoritesBtn} ${showFavorites ? styles.favoritesBtnActive : ''}`}
          data-tv-focus="true"
          data-tv-focus-id="favorites-btn"
          aria-label={showFavorites ? 'Cerrar favoritos' : 'Ver favoritos'}
        >
          {showFavorites ? '✕' : (
            <>
              ♥<span className={styles.favoritesCount}> {favorites.length}</span>
            </>
          )}
        </Button>

        <button
          type="button"
          className={styles.themeToggle}
          onClick={() => toggleTheme()}
          aria-label="Cambiar tema"
          data-tv-focus="true"
          data-tv-focus-id="theme-toggle"
        >
          {theme === 'dark' ? '☾' : '☀'}
        </button>
      </div>
    </header>
  );
}
