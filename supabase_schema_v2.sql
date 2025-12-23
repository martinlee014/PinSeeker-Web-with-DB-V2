-- 1. Create Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    host_username TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_name TEXT,
    join_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Participants Table
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tournament_participant UNIQUE (tournament_id, username)
);

-- 3. Add tournament_id to user_rounds (Safe Migration)
-- This block checks if the column exists before adding it to prevent errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_rounds' AND column_name = 'tournament_id') THEN
        ALTER TABLE user_rounds ADD COLUMN tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_user_rounds_tournament ON user_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_code ON tournaments(join_code);

-- 5. Enable RLS (Security)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

-- 6. Add Policies (Open Access for this architecture)
DROP POLICY IF EXISTS "Public tournaments access" ON tournaments;
CREATE POLICY "Public tournaments access" ON tournaments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public participants access" ON tournament_participants;
CREATE POLICY "Public participants access" ON tournament_participants FOR ALL USING (true) WITH CHECK (true);