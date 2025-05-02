-- Create or replace the deduct battle energy function with fixed energy cost
CREATE OR REPLACE FUNCTION deduct_battle_energy()
RETURNS boolean AS $$
DECLARE
  _user_id uuid;
  _user_record users;
  _energy_cost integer := 5;
  intervals_passed integer;
  energy_gained integer;
BEGIN
  _user_id := auth.uid();

  -- Get user record with FOR UPDATE to prevent concurrent modifications
  SELECT * INTO _user_record 
  FROM users 
  WHERE id = _user_id 
  FOR UPDATE;

  -- Regenerate energy inline
  IF _user_record.energy_current < _user_record.energy_max THEN
    intervals_passed := FLOOR(EXTRACT(EPOCH FROM (now() - _user_record.last_energy_update)) / 180)::integer;
    
    IF intervals_passed > 0 THEN
      energy_gained := intervals_passed;
      _user_record.energy_current := LEAST(_user_record.energy_max, _user_record.energy_current + energy_gained);
      _user_record.last_energy_update := now();
    END IF;
  END IF;

  -- Only deduct energy if we have enough after regeneration
  IF _user_record.energy_current >= _energy_cost THEN
    UPDATE users
    SET 
      energy_current = _user_record.energy_current - _energy_cost,
      last_energy_update = _user_record.last_energy_update
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
  intervals_passed integer;
  energy_gained integer;
BEGIN
  _user_id := auth.uid();

  -- Get user record with FOR UPDATE to prevent concurrent modifications
  SELECT * INTO _user_record 
  FROM users 
  WHERE id = _user_id 
  FOR UPDATE;

  -- Only regenerate if not at max energy
  IF _user_record.energy_current < _user_record.energy_max THEN
    intervals_passed := FLOOR(EXTRACT(EPOCH FROM (now() - _user_record.last_energy_update)) / 180)::integer;
    
    IF intervals_passed > 0 THEN
      energy_gained := intervals_passed;
      
      UPDATE users
      SET 
        energy_current = LEAST(energy_max, energy_current + energy_gained),
        last_energy_update = now()
      WHERE id = _user_id
      RETURNING * INTO _user_record;
    END IF;
  END IF;

  RETURN _user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;