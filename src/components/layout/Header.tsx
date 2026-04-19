import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import styles from './Header.module.css';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useDebounce } from '../../hooks/useDebounce';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useMangaFavoritesStore } from '../../store/mangaFavoritesStore';

interface HeaderProps {
  onSearch?: (query: string) => void;
  showFavorites?: boolean;
  onToggleFavorites?: () => void;
}

export function Header({ onSearch, showFavorites = false, onToggleFavorites }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites } = useFavoritesStore();
  const { favorites: mangaFavorites } = useMangaFavoritesStore();

  const isMangaContext = location.pathname.startsWith('/manga');
  const currentFavorites = isMangaContext ? mangaFavorites : favorites;

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

        <form className={styles.searchForm} onSubmit={handleSubmit} data-tv-focus="true" data-tv-focus-id="search-form">
          <Input
            type="search"
            placeholder={isMangaContext ? 'Buscar manga...' : 'Buscar anime...'}
            value={searchValue}
            onChange={e => handleSearchChange(e.target.value)}
            aria-label={isMangaContext ? 'Buscar manga' : 'Buscar anime'}
            className={styles.searchInput}
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
          {showFavorites ? '✕' : `♥ ${currentFavorites.length}`}
        </Button>
      </div>
    </header>
  );
}
