-- Create Tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username text UNIQUE NOT NULL,
  gold integer DEFAULT 80,
  rotten_brains integer DEFAULT 0,
  energy_current integer DEFAULT 50,
  energy_max integer DEFAULT 50,
  glory integer DEFAULT 10,
  avatar text DEFAULT 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?auto=format&fit=crop&q=80&w=200&h=200',
  starter_chest_claimed boolean DEFAULT false,
  last_energy_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sound_enabled boolean DEFAULT true,
  sort_by text DEFAULT 'favorites',
  volume real DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (sort_by IN ('favorites', 'name', 'level', 'rarity')),
  CHECK (volume >= 0 AND volume <= 1)
);

-- Skill types enum table
CREATE TABLE IF NOT EXISTS skill_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL
);

-- Character skills table
CREATE TABLE IF NOT EXISTS character_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text REFERENCES skill_types(id),
  cooldown integer NOT NULL,
  effect_value jsonb NOT NULL,
  effect_target text NOT NULL CHECK (
    effect_target IN ('all_allies', 'all_enemies', 'single_enemy', 'self')
  ),
  effect_chance integer,
  duration integer NOT NULL,
  uses_per_battle integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rarities table
CREATE TABLE IF NOT EXISTS rarities (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  image text NOT NULL CHECK (image ~ '^https?://'),
  description text NOT NULL CHECK (length(description) >= 20),
  base_health integer NOT NULL,
  base_strength integer NOT NULL,
  base_intellect integer NOT NULL,
  base_defence integer NOT NULL,
  rarity text REFERENCES rarities(id),
  collection_id uuid REFERENCES collections(id),
  skill_id uuid REFERENCES character_skills(id),
  sound_effect text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User characters table
CREATE TABLE IF NOT EXISTS user_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id),
  level integer DEFAULT 1,
  experience integer DEFAULT 0,
  is_favorite boolean DEFAULT false,
  health integer,
  strength integer,
  intellect integer,
  defence integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, character_id)
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('boots', 'belt', 'armor', 'gloves', 'helmet', 'amulet', 'cloak', 'weapon')),
  icon text NOT NULL,
  health_bonus integer DEFAULT 0,
  strength_bonus integer DEFAULT 0,
  intellect_bonus integer DEFAULT 0,
  dodge_bonus integer DEFAULT 0,
  stealth_bonus integer DEFAULT 0,
  crit_resist_bonus integer DEFAULT 0,
  energy_bonus integer DEFAULT 0,
  rarity text REFERENCES rarities(id),
  effect text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User items table
CREATE TABLE IF NOT EXISTS user_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  is_equipped boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Battle teams table
CREATE TABLE IF NOT EXISTS battle_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  character1_id uuid REFERENCES characters(id),
  character2_id uuid REFERENCES characters(id),
  character3_id uuid REFERENCES characters(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  CHECK (
    character1_id != character2_id AND
    character2_id != character3_id AND
    character1_id != character3_id
  ),
  CHECK (
    character1_id IS NOT NULL AND
    character2_id IS NOT NULL AND
    character3_id IS NOT NULL
  )
);

-- Battle logs table
CREATE TABLE IF NOT EXISTS battle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  winner_team text NOT NULL CHECK (winner_team IN ('player', 'enemy')),
  player_characters jsonb NOT NULL,
  enemy_characters jsonb NOT NULL,
  experience_gained integer NOT NULL,
  gold_earned integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Level progression table
CREATE TABLE IF NOT EXISTS level_progression (
  level integer PRIMARY KEY,
  xp_required integer NOT NULL
);

-- Insert initial level progression data
INSERT INTO level_progression (level, xp_required) VALUES
  (1, 0),   -- Level 1 starts at 0 XP
  (2, 10),  -- Need 10 XP for level 2
  (3, 15),  -- Need 15 XP for level 3
  (4, 30),  -- Need 30 XP for level 4
  (5, 45)   -- Need 45 XP for level 5
ON CONFLICT (level) DO NOTHING;

-- Insert skill types
INSERT INTO skill_types (id, name, description) VALUES
  ('damage_boost', 'Damage Boost', 'Increases damage dealt'),
  ('stun', 'Stun', 'Chance to stun targets'),
  ('dot', 'Damage Over Time', 'Deals damage over multiple rounds'),
  ('knockout', 'Knockout', 'Forces target to skip their turn'),
  ('instant_damage', 'Instant Damage', 'Deals immediate damage'),
  ('heal', 'Heal', 'Restores health over time'),
  ('dodge_boost', 'Dodge Boost', 'Increases dodge chance'),
  ('damage_reduction', 'Damage Reduction', 'Reduces incoming damage'),
  ('crit_boost', 'Critical Boost', 'Increases critical hit chance'),
  ('poison', 'Poison', 'Deals poison damage over time'),
  ('restore', 'Restore', 'Instantly restores health')
ON CONFLICT (id) DO NOTHING;

-- Insert rarities
INSERT INTO rarities (id, name, color) VALUES
  ('common', 'Common', 'white'),
  ('rare', 'Rare', '#0078D7'),
  ('epic', 'Epic', '#886CE4'),
  ('legendary', 'Legendary', '#FFF100'),
  ('mythic', 'Mythic', '#E81224')
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_user_id ON battle_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_teams_user_id ON battle_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_users_glory ON users(glory DESC);
CREATE INDEX IF NOT EXISTS idx_user_items_is_equipped ON user_items(is_equipped);
CREATE INDEX IF NOT EXISTS idx_characters_collection_id ON characters(collection_id);

-- Storage tables
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('character-images', 'character-images', true)
ON CONFLICT (id) DO NOTHING;

-- Functions

-- Auto-update energy function
CREATE OR REPLACE FUNCTION auto_update_energy()
RETURNS trigger AS $$
DECLARE
  intervals_passed integer;
  energy_gained integer;
BEGIN
  -- Only proceed if not at max energy
  IF NEW.energy_current < NEW.energy_max THEN
    -- Calculate number of complete 3-minute intervals
    intervals_passed = FLOOR(EXTRACT(EPOCH FROM (now() - NEW.last_energy_update)) / 180)::integer;
    
    -- If intervals have passed, update energy
    IF intervals_passed > 0 THEN
      -- Calculate energy gained (1 per interval)
      energy_gained = intervals_passed;
      
      -- Update energy and timestamp
      NEW.energy_current = LEAST(NEW.energy_max, NEW.energy_current + energy_gained);
      NEW.last_energy_update = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Initialize character stats function
CREATE OR REPLACE FUNCTION initialize_character_stats()
RETURNS trigger AS $$
BEGIN
  -- Get base stats from characters table
  SELECT 
    base_health,
    base_strength,
    base_intellect,
    base_defence
  INTO 
    NEW.health,
    NEW.strength,
    NEW.intellect,
    NEW.defence
  FROM characters
  WHERE id = NEW.character_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update character level function
CREATE OR REPLACE FUNCTION update_character_level()
RETURNS trigger AS $$
DECLARE
  current_level integer;
  current_xp integer;
  xp_needed integer;
  base_stats RECORD;
BEGIN
  -- Get current level and XP before any changes
  current_level := OLD.level;
  current_xp := NEW.experience;
  
  -- Get XP needed for current level
  SELECT xp_required INTO xp_needed 
  FROM level_progression 
  WHERE level = current_level;
  
  -- If we have enough XP to level up
  IF xp_needed IS NOT NULL AND current_xp >= xp_needed THEN
    -- Calculate excess XP
    NEW.experience := current_xp - xp_needed;
    
    -- Level up
    NEW.level := current_level + 1;
    
    -- Get base stats from characters table
    SELECT 
      base_health,
      base_strength,
      base_intellect,
      base_defence
    INTO base_stats
    FROM characters
    WHERE id = NEW.character_id;
    
    -- Calculate new stats with level scaling
    NEW.health := FLOOR(base_stats.base_health * POWER(1.2, NEW.level - 1));
    NEW.strength := FLOOR(base_stats.base_strength * POWER(1.2, NEW.level - 1));
    NEW.intellect := FLOOR(base_stats.base_intellect * POWER(1.2, NEW.level - 1));
    NEW.defence := FLOOR(base_stats.base_defence * POWER(1.2, NEW.level - 1));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Deduct battle energy function
CREATE OR REPLACE FUNCTION deduct_battle_energy()
RETURNS boolean AS $$
DECLARE
  _user_id uuid;
  _user_record users;
  _energy_cost numeric := 2.5;
  intervals_passed numeric;
  energy_gained numeric;
BEGIN
  _user_id := auth.uid();

  SELECT * INTO _user_record FROM users WHERE id = _user_id;

  -- Regenerate energy inline
  IF _user_record.energy_current < _user_record.energy_max THEN
    intervals_passed := FLOOR(EXTRACT(EPOCH FROM (now() - _user_record.last_energy_update)) / 180)::integer;
    IF intervals_passed > 0 THEN
      energy_gained := intervals_passed;
      _user_record.energy_current := LEAST(_user_record.energy_max, _user_record.energy_current + energy_gained);
      _user_record.last_energy_update := now();

      -- Apply regeneration to DB
      UPDATE users
      SET energy_current = _user_record.energy_current,
          last_energy_update = _user_record.last_energy_update
      WHERE id = _user_id;
    END IF;
  END IF;

  -- Deduct energy if enough
  IF _user_record.energy_current >= _energy_cost THEN
    UPDATE users
    SET energy_current = energy_current - _energy_cost,
        last_energy_update = now()
    WHERE id = _user_id;

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh user energy function
CREATE OR REPLACE FUNCTION refresh_user_energy()
RETURNS users AS $$
DECLARE
  _user_id uuid;
  _user_record users;
  intervals_passed numeric;
  energy_gained numeric;
BEGIN
  _user_id := auth.uid();

  SELECT * INTO _user_record FROM users WHERE id = _user_id;

  -- Regenerate energy
  IF _user_record.energy_current < _user_record.energy_max THEN
    intervals_passed := FLOOR(EXTRACT(EPOCH FROM (now() - _user_record.last_energy_update)) / 180)::numeric;
    IF intervals_passed > 0 THEN
      energy_gained := intervals_passed;
      _user_record.energy_current := LEAST(_user_record.energy_max, _user_record.energy_current + energy_gained);
      _user_record.last_energy_update := now();

      UPDATE users
      SET energy_current = _user_record.energy_current,
          last_energy_update = _user_record.last_energy_update
      WHERE id = _user_id;
    END IF;
  END IF;

  RETURN _user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refill energy with brains function
CREATE OR REPLACE FUNCTION refill_energy_with_brains()
RETURNS boolean AS $$
DECLARE
  _user_id uuid;
  _user_record users;
  brain_cost integer := 50;
BEGIN
  -- Get the current user's ID
  _user_id := auth.uid();
  
  -- Get user record and trigger energy update
  UPDATE users 
  SET updated_at = now()
  WHERE id = _user_id
  RETURNING * INTO _user_record;
  
  -- Check if user has enough brains and needs energy
  IF _user_record.rotten_brains >= brain_cost AND _user_record.energy_current < _user_record.energy_max THEN
    -- Update user's brains and energy
    UPDATE users
    SET 
      rotten_brains = _user_record.rotten_brains - brain_cost,
      energy_current = _user_record.energy_max,
      last_energy_update = now()
    WHERE id = _user_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle starter chest function
CREATE OR REPLACE FUNCTION handle_starter_chest()
RETURNS TABLE (
  id uuid,
  name text,
  image text,
  rarity text,
  description text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_claimed boolean;
  v_char_ids uuid[];
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Check if user exists and get starter chest status
  SELECT starter_chest_claimed INTO v_claimed
  FROM users
  WHERE users.id = v_user_id;
  
  -- Validate the claim
  IF v_claimed IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF v_claimed THEN
    RAISE EXCEPTION 'Starter chest already claimed';
  END IF;

  -- Get the character IDs in an array
  WITH selected_chars AS (
    -- Select 2 random common characters
    (SELECT characters.id AS char_id
    FROM characters
    WHERE characters.rarity = 'common'
    AND NOT EXISTS (
      SELECT 1 
      FROM user_characters 
      WHERE user_characters.character_id = characters.id 
      AND user_characters.user_id = v_user_id
    )
    ORDER BY random()
    LIMIT 2)
    UNION ALL
    -- Select 1 special character (Rare or Epic)
    (SELECT characters.id AS char_id
    FROM characters
    WHERE characters.rarity = CASE 
      WHEN random() < 0.65 THEN 'rare'
      ELSE 'epic'
    END
    AND NOT EXISTS (
      SELECT 1 
      FROM user_characters 
      WHERE user_characters.character_id = characters.id 
      AND user_characters.user_id = v_user_id
    )
    ORDER BY random()
    LIMIT 1)
  )
  SELECT array_agg(char_id) INTO v_char_ids
  FROM selected_chars;

  -- Create battle team entry
  INSERT INTO battle_teams (
    user_id,
    character1_id,
    character2_id,
    character3_id
  ) VALUES (
    v_user_id,
    v_char_ids[1],
    v_char_ids[2],
    v_char_ids[3]
  );

  -- Return the character information
  RETURN QUERY
  SELECT 
    characters.id,
    characters.name,
    characters.image,
    characters.rarity,
    characters.description
  FROM characters
  WHERE characters.id = ANY(v_char_ids)
  ORDER BY characters.rarity != 'common';
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS auto_update_energy_trigger ON users;
DROP TRIGGER IF EXISTS initialize_character_stats_trigger ON user_characters;
DROP TRIGGER IF EXISTS update_character_level_trigger ON user_characters;

-- Create triggers
CREATE TRIGGER auto_update_energy_trigger
  BEFORE UPDATE OR INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_energy();

CREATE TRIGGER initialize_character_stats_trigger
  BEFORE INSERT ON user_characters
  FOR EACH ROW
  EXECUTE FUNCTION initialize_character_stats();

CREATE TRIGGER update_character_level_trigger
  BEFORE UPDATE ON user_characters
  FOR EACH ROW
  EXECUTE FUNCTION update_character_level();

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE rarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can be created for new signup" ON users;
DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can read character templates" ON characters;
DROP POLICY IF EXISTS "Users can read own characters" ON user_characters;
DROP POLICY IF EXISTS "Users can read all characters for battles" ON user_characters;
DROP POLICY IF EXISTS "Users can update own characters" ON user_characters;
DROP POLICY IF EXISTS "Users can insert own characters" ON user_characters;
DROP POLICY IF EXISTS "Anyone can read item templates" ON items;
DROP POLICY IF EXISTS "Users can read own items" ON user_items;
DROP POLICY IF EXISTS "Users can update own items" ON user_items;
DROP POLICY IF EXISTS "Users can insert own items" ON user_items;
DROP POLICY IF EXISTS "Users can read all battle teams" ON battle_teams;
DROP POLICY IF EXISTS "Users can update own battle team" ON battle_teams;
DROP POLICY IF EXISTS "Users can insert own battle team" ON battle_teams;
DROP POLICY IF EXISTS "Users can delete own battle team" ON battle_teams;
DROP POLICY IF EXISTS "Users can read own battle logs" ON battle_logs;
DROP POLICY IF EXISTS "Users can create battle logs" ON battle_logs;
DROP POLICY IF EXISTS "Anyone can read skill types" ON skill_types;
DROP POLICY IF EXISTS "Anyone can read character skills" ON character_skills;
DROP POLICY IF EXISTS "Anyone can read collections" ON collections;
DROP POLICY IF EXISTS "Anyone can read rarities" ON rarities;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;

-- Create RLS policies
CREATE POLICY "Anyone can read all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can be created for new signup" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own preferences" ON user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read character templates" ON characters FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read own characters" ON user_characters FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can read all characters for battles" ON user_characters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own characters" ON user_characters FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own characters" ON user_characters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read item templates" ON items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read own items" ON user_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON user_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON user_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all battle teams" ON battle_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own battle team" ON battle_teams FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own battle team" ON battle_teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own battle team" ON battle_teams FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can read own battle logs" ON battle_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create battle logs" ON battle_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read skill types" ON skill_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read character skills" ON character_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read collections" ON collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read rarities" ON rarities FOR SELECT TO authenticated USING (true);

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'character-images');

CREATE POLICY "Users can delete own objects" ON storage.objects 
FOR DELETE TO authenticated 
USING (auth.uid() = owner);

CREATE POLICY "Users can insert objects" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() = owner AND 
  (metadata->>'content_type')::text LIKE 'image/%' AND 
  ((metadata->>'size')::integer < 5242880)
);

CREATE POLICY "Users can update own objects" ON storage.objects 
FOR UPDATE TO authenticated 
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can upload images" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid() = owner AND 
  ((metadata->>'size')::integer < 5242880) AND 
  (metadata->>'content_type')::text LIKE 'image/%'
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION deduct_battle_energy() TO authenticated;
GRANT EXECUTE ON FUNCTION refill_energy_with_brains() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_user_energy() TO authenticated;