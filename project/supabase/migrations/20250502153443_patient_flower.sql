-- Update the update_user_battle_rewards function to include brain rewards
CREATE OR REPLACE FUNCTION update_user_battle_rewards(
  p_user_id UUID,
  p_gold_earned INTEGER,
  p_glory_change INTEGER,
  p_brains_earned INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    gold = gold + p_gold_earned,
    glory = glory + p_glory_change,
    rotten_brains = rotten_brains + p_brains_earned
  WHERE id = p_user_id;
END;
$$;