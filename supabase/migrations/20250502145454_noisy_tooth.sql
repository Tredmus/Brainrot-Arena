-- Create or replace the deduct battle energy function
CREATE OR REPLACE FUNCTION deduct_battle_energy()
RETURNS boolean AS $$
DECLARE
  _user_id uuid;
  _user_record users;
  _energy_cost numeric := 1;
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

-- Create or replace the refresh user energy function
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