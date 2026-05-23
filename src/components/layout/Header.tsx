import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, FormEvent, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import styles from './Header.module.css';
import { Input, Button } from '../';
import { useDebounce, useAnimeFavorites, useMangaFavorites } from '../../hooks';
import { useThemeStore } from '../../store/themeStore';

interface HeaderProps {
  onSearch?: (query: string) => void;
  showFavorites?: boolean;
  onToggleFavorites?: () => void;
}

export function Header({ onSearch, showFavorites = false, onToggleFavorites }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchValue, 300);
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { favorites, isAuthenticated: isAnimeAuth } = useAnimeFavorites();
  const { favorites: mangaFavorites, isAuthenticated: isMangaAuth } = useMangaFavorites();
  const { theme, toggleTheme } = useThemeStore();

  const isMangaContext = location.pathname.startsWith('/manga');
  const currentFavorites = isMangaContext ? mangaFavorites : favorites;
  const isAuthenticated = isMangaContext ? isMangaAuth : isAnimeAuth;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate('/');
  };

  const getUserInitial = () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return '?';
    return email[0].toUpperCase();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (debouncedSearch.trim().length >= 2) {
      if (isMangaContext) {
        navigate(`/manga?q=${encodeURIComponent(debouncedSearch)}`);
      } else {
        navigate(`/?search=${encodeURIComponent(debouncedSearch)}`);
      }
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFavoritesClick = () => {
    if (onToggleFavorites) {
      onToggleFavorites();
    } else {
      if (showFavorites) {
        navigate(isMangaContext ? '/manga' : '/');
      } else {
        navigate(isMangaContext ? '/manga?favorites=true' : '/?favorites=true');
      }
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="7Kanime - Inicio" data-tv-focus="true" data-tv-focus-id="header-logo">
          <span className={styles.logoAccent}>7K</span><span className={styles.logoText}>anime</span>
        </Link>

        <nav className={styles.nav} aria-label="Navegación principal">
          <Link to="/" className={styles.navLink}>Anime</Link>
          <Link to="/manga" className={styles.navLink}>Manga</Link>
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
            placeholder={isMangaContext ? 'Buscar manga...' : 'Buscar anime...'}
            value={searchValue}
            onChange={e => handleSearchChange(e.target.value)}
            aria-label={isMangaContext ? 'Buscar manga' : 'Buscar anime'}
            className={styles.searchInput}
            ref={searchInputRef}
          />
        </form>

        {isAuthenticated && (
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
                ♥<span className={styles.favoritesCount}> {currentFavorites.length}</span>
              </>
            )}
          </Button>
        )}

        {isSignedIn ? (
          <div className={styles.userSection} ref={userMenuRef}>
            <button
              type="button"
              className={styles.avatarBtn}
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Menú de usuario"
              aria-expanded={showUserMenu}
              data-tv-focus="true"
              data-tv-focus-id="user-menu-btn"
            >
              <span className={styles.avatar}>{getUserInitial()}</span>
            </button>

            {showUserMenu && (
              <div className={styles.userMenu}>
                <div className={styles.userEmail}>
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
                <label className={styles.themeSwitch}>
                  <span className={styles.themeSwitchLabel}>
                    {theme === 'dark' ? '🌙' : '☀️'} {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
                  </span>
                  <input
                    type="checkbox"
                    checked={theme === 'light'}
                    onChange={() => toggleTheme()}
                    aria-label="Cambiar tema"
                  />
                  <span className={styles.themeSwitchSlider}></span>
                </label>
                <button
                  type="button"
                  className={styles.logoutBtn}
                  onClick={handleLogout}
                  data-tv-focus="true"
                  data-tv-focus-id="logout-btn"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className={styles.loginLink}>
            <Button
              variant="ghost"
              data-tv-focus="true"
              data-tv-focus-id="login-btn"
            >
              Iniciar sesión
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}