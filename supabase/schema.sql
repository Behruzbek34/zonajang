-- ============================================================
-- ZonaJang — Supabase SQL Schema
-- Supabase Dashboard → SQL Editor da ishga tushiring
-- ============================================================

-- ─── 1. PROFILES ─────────────────────────────────────────────
-- auth.users ni kengaytiradi: username, avatar, rang, XP, hudud
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  avatar      TEXT NOT NULL DEFAULT '⚡',
  color       TEXT NOT NULL DEFAULT '#6366f1',
  xp          INTEGER NOT NULL DEFAULT 0,
  total_area_m2 FLOAT NOT NULL DEFAULT 0,
  clan_id     UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. CLANS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  badge       TEXT NOT NULL DEFAULT '🛡️',
  color       TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  leader_id   UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- profiles.clan_id → clans.id foreign key (after clans table created)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_clan_id_fkey
  FOREIGN KEY (clan_id) REFERENCES public.clans(id) ON DELETE SET NULL;

-- ─── 3. TERRITORIES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.territories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  color        TEXT NOT NULL,
  coordinates  JSONB NOT NULL,   -- [[lat,lng], ...]
  area_m2      FLOAT NOT NULL,
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. NOTIFICATIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,    -- 'attack' | 'capture' | 'clan' | 'levelup' | 'system'
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. TRIGGERS ─────────────────────────────────────────────

-- 5a. Yangi foydalanuvchi ro'yxatdan o'tganda profil yaratish
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTR(NEW.id::TEXT, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '⚡'),
    COALESCE(NEW.raw_user_meta_data->>'color', '#6366f1')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5b. Hudud qo'shilganda total_area va XP yangilash
CREATE OR REPLACE FUNCTION public.handle_territory_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  xp_earned INTEGER;
BEGIN
  xp_earned := GREATEST(1, FLOOR(NEW.area_m2 * 0.001)::INTEGER) + 50;
  UPDATE public.profiles
  SET
    total_area_m2 = total_area_m2 + NEW.area_m2,
    xp            = xp + xp_earned
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_territory_insert ON public.territories;
CREATE TRIGGER on_territory_insert
  AFTER INSERT ON public.territories
  FOR EACH ROW EXECUTE FUNCTION public.handle_territory_insert();

-- 5c. Hudud o'chirilganda total_area kamaytirish
CREATE OR REPLACE FUNCTION public.handle_territory_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET total_area_m2 = GREATEST(0, total_area_m2 - OLD.area_m2)
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_territory_delete ON public.territories;
CREATE TRIGGER on_territory_delete
  AFTER DELETE ON public.territories
  FOR EACH ROW EXECUTE FUNCTION public.handle_territory_delete();

-- ─── 6. ROW LEVEL SECURITY ───────────────────────────────────

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CLANS
CREATE POLICY "clans_select_all"     ON public.clans FOR SELECT USING (true);
CREATE POLICY "clans_insert_auth"    ON public.clans FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "clans_update_leader"  ON public.clans FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "clans_delete_leader"  ON public.clans FOR DELETE USING (auth.uid() = leader_id);

-- TERRITORIES
CREATE POLICY "territories_select_all"  ON public.territories FOR SELECT USING (true);
CREATE POLICY "territories_insert_own"  ON public.territories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "territories_delete_own"  ON public.territories FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "notif_select_own"  ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own"  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_insert_auth" ON public.notifications FOR INSERT WITH CHECK (true); -- server-side insert

-- ─── 7. REALTIME ─────────────────────────────────────────────
-- Supabase Dashboard → Database → Replication da quyidagi
-- jadvallar uchun realtime yoqing:
--   territories, notifications
-- (SQL orqali yoqish mumkin emas, UI orqali qiling)

-- ─── 8. LEADERBOARD VIEW ─────────────────────────────────────
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id,
  p.username,
  p.avatar,
  p.color,
  p.xp,
  p.total_area_m2,
  c.name AS clan
FROM public.profiles p
LEFT JOIN public.clans c ON p.clan_id = c.id
ORDER BY p.total_area_m2 DESC;

-- ─── 9. CLAN MEMBER COUNT VIEW ───────────────────────────────
CREATE OR REPLACE VIEW public.clans_with_stats AS
SELECT
  c.*,
  COUNT(p.id)::INTEGER          AS member_count,
  COALESCE(SUM(p.total_area_m2), 0) AS total_area
FROM public.clans c
LEFT JOIN public.profiles p ON p.clan_id = c.id
GROUP BY c.id;
