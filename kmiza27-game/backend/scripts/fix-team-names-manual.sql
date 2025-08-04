-- Fix for Série C empty issue: Add team_name column and update values
-- Execute these commands in the Supabase SQL Editor

-- 1. Add the team_name column to the table
ALTER TABLE game_user_machine_team_stats 
ADD COLUMN IF NOT EXISTS team_name VARCHAR(255);

-- 2. Update the team_name values based on team_id
UPDATE game_user_machine_team_stats 
SET team_name = (
  SELECT name 
  FROM game_machine_teams 
  WHERE game_machine_teams.id = game_user_machine_team_stats.team_id
)
WHERE team_name IS NULL OR team_name = '';

-- 3. Verify the fix by checking the data
SELECT 
  team_name, 
  points, 
  games_played,
  tier,
  season_year
FROM game_user_machine_team_stats 
WHERE user_id = '22fa9e4b-858e-49b5-b80c-1390f9665ac9'
  AND tier = 3 
  AND season_year = 2026
ORDER BY team_name; 