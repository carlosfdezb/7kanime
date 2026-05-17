-- =============================================
-- ANIMEAV1 — SUPABASE SETUP SCRIPT
-- =============================================
-- Ejecutar todo de una vez en: SQL Editor
-- =============================================

-- =============================================
-- PERFIL DE USUARIO
-- =============================================
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  username    text unique,
  avatar_url  text,
  preferences jsonb default '{}'::jsonb,
  created_at  timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Perfil automático al registrarse
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: cada usuario solo ve/edita su propio perfil
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- =============================================
-- FAVORITOS ANIME
-- =============================================
create table public.anime_favorites (
  user_id     uuid references auth.users on delete cascade not null,
  anime_id    integer not null,
  anime_slug  text not null,
  title       text not null,
  poster_url  text not null,
  type        text default '',
  added_at    timestamptz default now() not null,
  primary key (user_id, anime_id)
);

alter table public.anime_favorites enable row level security;

create policy "Users can view own anime favorites"
  on public.anime_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert own anime favorites"
  on public.anime_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own anime favorites"
  on public.anime_favorites for delete
  using (auth.uid() = user_id);


-- =============================================
-- FAVORITOS MANGA
-- =============================================
create table public.manga_favorites (
  user_id     uuid references auth.users on delete cascade not null,
  manga_id    integer not null,
  title       text not null,
  cover_url   text not null,
  type        text default '',
  added_at    timestamptz default now() not null,
  primary key (user_id, manga_id)
);

alter table public.manga_favorites enable row level security;

create policy "Users can view own manga favorites"
  on public.manga_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert own manga favorites"
  on public.manga_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own manga favorites"
  on public.manga_favorites for delete
  using (auth.uid() = user_id);


-- =============================================
-- HISTORIAL EPISODIOS
-- =============================================
create table public.episode_history (
  user_id        uuid references auth.users on delete cascade not null,
  anime_slug     text not null,
  anime_title    text not null,
  poster_url     text,
  episode_number integer not null,
  watched_at     timestamptz default now() not null,
  primary key (user_id, anime_slug, episode_number)
);

alter table public.episode_history enable row level security;

create policy "Users can view own episode history"
  on public.episode_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own episode history"
  on public.episode_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own episode history"
  on public.episode_history for delete
  using (auth.uid() = user_id);


-- =============================================
-- HISTORIAL CAPÍTULOS MANGA
-- =============================================
create table public.chapter_history (
  user_id      uuid references auth.users on delete cascade not null,
  manga_id     integer not null,
  manga_title  text not null,
  cover_url    text,
  chapter_hash text not null,
  chapter_num  text not null,
  read_at      timestamptz default now() not null,
  primary key (user_id, manga_id, chapter_hash)
);

alter table public.chapter_history enable row level security;

create policy "Users can view own chapter history"
  on public.chapter_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own chapter history"
  on public.chapter_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own chapter history"
  on public.chapter_history for delete
  using (auth.uid() = user_id);


-- =============================================
-- LISTAS PERSONALIZADAS
-- =============================================
create table public.custom_lists (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  name        text not null,
  description text default '',
  is_public   boolean default false not null,
  created_at  timestamptz default now() not null
);

alter table public.custom_lists enable row level security;

create policy "Users can view own lists"
  on public.custom_lists for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users can insert own lists"
  on public.custom_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lists"
  on public.custom_lists for update
  using (auth.uid() = user_id);

create policy "Users can delete own lists"
  on public.custom_lists for delete
  using (auth.uid() = user_id);


create table public.custom_list_items (
  id          uuid default gen_random_uuid() primary key,
  list_id     uuid references public.custom_lists on delete cascade not null,
  item_type   text not null check (item_type in ('anime', 'manga')),
  item_id     integer not null,
  title       text not null,
  image_url   text,
  note        text default '',
  added_at    timestamptz default now() not null,
  unique (list_id, item_type, item_id)
);

alter table public.custom_list_items enable row level security;

create policy "Users can view list items of visible lists"
  on public.custom_list_items for select
  using (
    exists (
      select 1 from public.custom_lists
      where custom_lists.id = custom_list_items.list_id
      and (custom_lists.user_id = auth.uid() or custom_lists.is_public = true)
    )
  );

create policy "Users can insert own list items"
  on public.custom_list_items for insert
  with check (
    exists (
      select 1 from public.custom_lists
      where custom_lists.id = custom_list_items.list_id
      and custom_lists.user_id = auth.uid()
    )
  );

create policy "Users can delete own list items"
  on public.custom_list_items for delete
  using (
    exists (
      select 1 from public.custom_lists
      where custom_lists.id = custom_list_items.list_id
      and custom_lists.user_id = auth.uid()
    )
  );