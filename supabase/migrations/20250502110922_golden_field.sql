/*
  # Add function to update user battle rewards

  1. New Functions
    - `update_user_battle_rewards`: Updates a user's gold and glory after a battle
      - Parameters:
        - p_user_id: The user's ID
        - p_gold_earned: Amount of gold earned
        - p_glory_change: Change in glory points (positive or negative)

  2. Security
    - Function is accessible to authenticated users only
*/

CREATE OR REPLACE FUNCTION update_user_battle_rewards(
  p_user_id UUID,
  p_gold_earned INTEGER,
  p_glory_change INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    gold = gold + p_gold_earned,
    glory = glory + p_glory_change
  WHERE id = p_user_id;
END;
$$;