import { Link, useNavigate } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import styles from './Header.module.css';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useDebounce } from '../../hooks/useDebounce';
import { useFavoritesStore } from '../../store/favoritesStore';

interface HeaderProps {
  onSearch?: (query: string) => void;
  showFavorites?: boolean;
  onToggleFavorites?: () => void;
}

export function Header({ onSearch, showFavorites = false, onToggleFavorites }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const navigate = useNavigate();
  const { favorites } = useFavoritesStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (debouncedSearch.trim().length >= 2) {
      navigate(`/?search=${encodeURIComponent(debouncedSearch)}`);
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
        navigate('/');
      } else {
        navigate('/?favorites=true');
      }
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="7Kanime - Inicio">
          <span className={styles.logoAccent}>7K</span><span className={styles.logoText}>anime</span>
        </Link>

        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>Inicio</Link>
          <Link to="/?type=tv-anime" className={styles.navLink}>Anime</Link>
          <Link to="/?type=pelicula" className={styles.navLink}>Películas</Link>
        </nav>

        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <Input
            type="search"
            placeholder="Buscar anime..."
            value={searchValue}
            onChange={e => handleSearchChange(e.target.value)}
            aria-label="Buscar anime"
            className={styles.searchInput}
          />
        </form>

        <Button
          variant="ghost"
          onClick={handleFavoritesClick}
          className={`${styles.favoritesBtn} ${showFavorites ? styles.favoritesBtnActive : ''}`}
          aria-label={showFavorites ? 'Cerrar favoritos' : 'Ver favoritos'}
        >
          {showFavorites ? '✕' : `♥ ${favorites.length}`}
        </Button>
      </div>
    </header>
  );
}