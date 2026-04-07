import { Link, useNavigate } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import styles from './Header.module.css';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useDebounce } from '../../hooks/useDebounce';
import { useFavoritesStore } from '../../store/favoritesStore';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
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

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="7Kanime - Inicio">
          <span className={styles.logoAccent}>7K</span><span className={styles.logoText}>anime</span>
        </Link>

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
          onClick={() => navigate('/?favorites=true')}
          className={styles.favoritesBtn}
        >
          ♥ {favorites.length}
        </Button>
      </div>
    </header>
  );
}
