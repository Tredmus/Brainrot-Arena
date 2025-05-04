/*
  # Update default energy maximum and add email template

  1. Changes
    - Update default energy maximum from 50 to 100
    - Update existing users' energy maximum
*/

-- Update default value for new users
ALTER TABLE users 
ALTER COLUMN energy_max SET DEFAULT 100,
ALTER COLUMN energy_current SET DEFAULT 100;

-- Update existing users
UPDATE users 
SET energy_max = 100,
    energy_current = LEAST(energy_current + 50, 100);