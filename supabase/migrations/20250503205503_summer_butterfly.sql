/*
  # Add new user preference columns

  1. New Columns
    - Added rarity_filter to store the selected rarity filter
    - Added sort_direction to store the sorting direction

  2. Changes
    - Updated existing preferences table with new columns
    - Added default values for new columns
*/

-- Add new columns to user_preferences
ALTER TABLE user_preferences
ADD COLUMN rarity_filter text DEFAULT 'all',
ADD COLUMN sort_direction text DEFAULT 'desc';

-- Add check constraint for rarity_filter
ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_rarity_filter_check
CHECK (rarity_filter IN ('all', 'common', 'rare', 'epic', 'legendary', 'mythic'));

-- Add check constraint for sort_direction
ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_sort_direction_check
CHECK (sort_direction IN ('asc', 'desc'));

-- Update sort_by check constraint to include rarity
ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_sort_by_check,
ADD CONSTRAINT user_preferences_sort_by_check
CHECK (sort_by IN ('favorites', 'name', 'level', 'rarity'));