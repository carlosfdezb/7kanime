-- =============================================
-- MIGRATION: Manga IDs from integer to text (shadowmanga provider)
-- =============================================
-- Ejecutar en SQL Editor de Supabase en producción
-- =============================================

-- 1. Migrar manga_favorites: manga_id integer → text
ALTER TABLE manga_favorites
  ALTER COLUMN manga_id TYPE text;

-- 2. Migrar chapter_history: manga_id integer → text
ALTER TABLE chapter_history
  ALTER COLUMN manga_id TYPE text;

-- 3. Renombrar chapter_hash → chapter_id en chapter_history
ALTER TABLE chapter_history
  RENAME COLUMN chapter_hash TO chapter_id;

-- Nota: Si hay datos existentes con IDs numéricos, se convierten automáticamente
-- a text (ej: 15587 → '15587'). Los nuevos publicIds serán strings como 'zUIH4L'.
