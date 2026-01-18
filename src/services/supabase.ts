
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GolfCourse, ClubStats, RoundHistory, Tournament, LeaderboardEntry, HoleScore } from '../../types';

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

// Hardcoded Credentials as requested
const SUPABASE_URL = 'https://ezvaynhdeygjpvuqvkbg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4SIUpiYqAXbR8Zdls6RN1w_2MTTLKOB';

// Singleton client instance
let clientInstance: SupabaseClient | null = null;

const getClient = () => {
    if (clientInstance) return clientInstance;

    try {
        // Ensure URL and Key are present
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.warn("Supabase credentials missing.");
            return null;
        }
        clientInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
        return clientInstance;
    } catch (e) {
        console.error("Failed to initialize Supabase client", e);
        return null;
    }
};

// Reset function
export const resetSupabaseClient = () => {
    clientInstance = null;
};

export const CloudService = {
  // ---------------------------------------------------
  // COURSE MANAGEMENT (Existing)
  // ---------------------------------------------------
  
  searchCourses: async (query: string, country?: string): Promise<GolfCourse[]> => {
    const supabase = getClient();
    if (!supabase) throw new Error("Cloud service could not be initialized.");

    let dbQuery = supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .ilike('name', `%${query}%`);
    
    if (country && country !== 'All') {
        dbQuery = dbQuery.eq('data->>country', country);
    }

    const { data, error } = await dbQuery.limit(50);

    if (error) {
      console.error('Error searching courses:', error.message);
      throw error;
    }

    return (data || []).map((row: any) => ({
      ...row.data,
      id: row.id,
      name: row.name,
      isCloud: true,
      isCustom: false,
      author: row.data.author
    }));
  },

  checkCourseExists: async (courseName: string, author: string): Promise<string | null> => {
      const supabase = getClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('courses')
        .select('id')
        .eq('name', courseName)
        .eq('data->>author', author)
        .single();

      if (error || !data) return null;
      return data.id;
  },

  updateCourse: async (cloudId: string, course: GolfCourse, username: string): Promise<{ success: boolean; message?: string }> => {
      const supabase = getClient();
      if (!supabase) return { success: false, message: "Cloud service not available." };

      const coursePayload = { 
        ...course,
        author: username
      };
      
      delete (coursePayload as any).isCloud;
      delete (coursePayload as any).isCustom;
      delete (coursePayload as any).id; 
    
      const { error } = await supabase
        .from('courses')
        .update({
            data: coursePayload,
            updated_at: new Date().toISOString()
        })
        .eq('id', cloudId);

      if (error) return { success: false, message: error.message };
      return { success: true };
  },

  uploadCourse: async (course: GolfCourse, username: string): Promise<{ success: boolean; message?: string }> => {
    const supabase = getClient();
    if (!supabase) return { success: false, message: "Cloud service not available." };
    if (!username) return { success: false, message: "User not identified." };

    const coursePayload = { ...course, author: username };
    delete (coursePayload as any).isCloud;
    delete (coursePayload as any).isCustom;
    delete (coursePayload as any).id;
    
    const { error } = await supabase
      .from('courses')
      .insert({
        name: course.name,
        data: coursePayload,
        status: 'published'
      });

    if (error) return { success: false, message: error.message };
    return { success: true };
  },

  // ---------------------------------------------------
  // TOURNAMENT MANAGEMENT (New)
  // ---------------------------------------------------

  createTournament: async (name: string, course: GolfCourse, host: string): Promise<{ success: boolean, code?: string, error?: string }> => {
      const supabase = getClient();
      if (!supabase) return { success: false, error: "Offline" };

      // Generate a simple 6 char code
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error } = await supabase
        .from('tournaments')
        .insert({
            name,
            host_username: host,
            course_id: course.id,
            course_name: course.name,
            join_code: joinCode
        });

      if (error) return { success: false, error: error.message };

      // Auto-join host
      await CloudService.joinTournament(joinCode, host);

      return { success: true, code: joinCode };
  },

  joinTournament: async (code: string, username: string): Promise<{ success: boolean, error?: string }> => {
      const supabase = getClient();
      if (!supabase) return { success: false, error: "Offline" };

      // 1. Get Tournament ID
      const { data: tData, error: tError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('join_code', code)
        .single();
      
      if (tError || !tData) return { success: false, error: "Invalid Code" };

      // 2. Join
      const { error: pError } = await supabase
        .from('tournament_participants')
        .upsert({
            tournament_id: tData.id,
            username: username
        }, { onConflict: 'tournament_id,username' }); // Ignore if already joined

      if (pError) return { success: false, error: pError.message };
      return { success: true };
  },

  getMyTournaments: async (username: string): Promise<Tournament[]> => {
      const supabase = getClient();
      if (!supabase) return [];

      // Get IDs where user is participant
      const { data: pData } = await supabase
        .from('tournament_participants')
        .select('tournament_id')
        .eq('username', username);
      
      if (!pData || pData.length === 0) return [];
      
      const ids = pData.map(p => p.tournament_id);

      // Get Tournament Details
      const { data: tData } = await supabase
        .from('tournaments')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });

      if (!tData) return [];

      return tData.map((t: any) => ({
          id: t.id,
          name: t.name,
          host: t.host_username,
          courseId: t.course_id,
          courseName: t.course_name,
          joinCode: t.join_code,
          createdAt: t.created_at,
          status: t.status
      }));
  },

  getTournamentParticipants: async (tournamentId: string): Promise<string[]> => {
      const supabase = getClient();
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('tournament_participants')
        .select('username')
        .eq('tournament_id', tournamentId);

      if (error || !data) return [];
      
      return data.map((row: any) => row.username);
  },

  getTournamentLeaderboard: async (tournamentId: string): Promise<LeaderboardEntry[]> => {
      const supabase = getClient();
      if (!supabase) return [];

      // Fetch rounds for this tournament
      const { data } = await supabase
        .from('user_rounds')
        .select('*')
        .eq('tournament_id', tournamentId);
      
      if (!data) return [];

      // Process rounds into leaderboard format
      const entries: LeaderboardEntry[] = data.map((row: any) => {
          const r: RoundHistory = row.round_data;
          
          const totalScore = r.scorecard.reduce((acc, h) => acc + h.shotsTaken + h.putts + h.penalties, 0);
          const totalPar = r.scorecard.reduce((acc, h) => acc + (Number(h.par) || 4), 0);
          const scoreToPar = totalScore - totalPar;
          
          // Determine "Thru" (holes played)
          // If holes is 18 (or 9 for 9 hole course), mark as F (Finished)
          const holesPlayed = r.scorecard.length;
          // Simple heuristic: if 18 played, assume finished. 
          const thruDisplay = holesPlayed >= 18 ? 'F' : holesPlayed;

          return {
              username: row.username,
              totalScore: totalScore,
              scoreToPar: scoreToPar,
              thru: thruDisplay,
              roundData: { ...r, player: row.username } // Inject player name for display
          };
      });

      // Sort by Score To Par (ASC)
      return entries.sort((a, b) => a.scoreToPar - b.scoreToPar);
  },

  // ---------------------------------------------------
  // SCORE SYNCING (New)
  // ---------------------------------------------------

  // Helper to fetch a single user's round for conflict checking
  getRound: async (tournamentId: string, username: string): Promise<RoundHistory | null> => {
      const supabase = getClient();
      if (!supabase) return null;

      const { data } = await supabase
          .from('user_rounds')
          .select('round_data')
          .eq('tournament_id', tournamentId)
          .eq('username', username)
          .single();

      if (data) return data.round_data;
      return null;
  },

  submitHoleScore: async (tournamentId: string, username: string, holeScore: HoleScore, courseName: string): Promise<void> => {
      const supabase = getClient();
      if (!supabase) return;

      // 1. Fetch existing round data for this user in this tournament
      const { data, error } = await supabase
          .from('user_rounds')
          .select('*')
          .eq('tournament_id', tournamentId)
          .eq('username', username)
          .single();

      let roundData: RoundHistory;

      if (!data) {
          // Create new skeleton round
          roundData = {
              id: crypto.randomUUID(),
              date: new Date().toLocaleString(),
              courseName: courseName,
              scorecard: [holeScore],
              shots: [],
              tournamentId: tournamentId,
              player: username
          };
      } else {
          // Update existing round
          roundData = data.round_data;
          // Remove old score for this hole if exists, then push new
          roundData.scorecard = roundData.scorecard.filter(h => h.holeNumber !== holeScore.holeNumber);
          roundData.scorecard.push(holeScore);
          // Sort scorecard
          roundData.scorecard.sort((a, b) => a.holeNumber - b.holeNumber);
      }

      // 2. Upsert
      const payload = {
          tournament_id: tournamentId,
          username: username,
          course_name: courseName,
          scorecard: roundData.scorecard,
          shots: roundData.shots,
          round_data: roundData
      };

      if (data) {
          await supabase
              .from('user_rounds')
              .update(payload)
              .eq('id', data.id);
      } else {
          await supabase
              .from('user_rounds')
              .insert(payload);
      }
  },

  // ---------------------------------------------------
  // AUTH & SESSION MANAGEMENT
  // ---------------------------------------------------

  checkProfileExists: async (username: string): Promise<boolean> => {
      const supabase = getClient();
      if (!supabase) return false;

      const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();

      return !!data && !error;
  },

  loginAndCreateSession: async (username: string): Promise<{ 
      success: boolean; 
      sessionId?: string; 
      bag?: ClubStats[]; 
      history?: RoundHistory[];
      preferences?: any;
  }> => {
      const supabase = getClient();
      if (!supabase) {
          console.warn("Supabase client not available, skipping cloud login.");
          return { success: false };
      }

      const newSessionId = crypto.randomUUID();

      // 1. Fetch Existing Profile (to get preferences and avoid overwriting them)
      let existingPrefs = {};
      const { data: profile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('username', username)
          .single();
      
      if (profile && profile.preferences) {
          existingPrefs = profile.preferences;
      }

      // 2. Upsert Profile with new Session ID AND Existing Preferences
      const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
              username: username, 
              current_session_id: newSessionId,
              preferences: existingPrefs, // Preserve or set default
              last_active: new Date().toISOString()
          }, { onConflict: 'username' });
      
      if (profileError) {
          console.error("Cloud Login Failed:", profileError.message || profileError);
          // Return success:false so App can fallback to offline mode
          return { success: false };
      }

      // 3. Fetch User Bag
      let bag: ClubStats[] | undefined = undefined;
      const { data: bagData } = await supabase
          .from('user_bags')
          .select('bag_data')
          .eq('username', username)
          .single();
      
      if (bagData) bag = bagData.bag_data;

      // 4. Fetch User History
      let history: RoundHistory[] | undefined = undefined;
      const { data: roundsData } = await supabase
          .from('user_rounds')
          .select('round_data')
          .eq('username', username)
          .order('created_at', { ascending: false });
      
      if (roundsData) {
          history = roundsData.map((r: any) => r.round_data);
      }

      return { success: true, sessionId: newSessionId, bag, history, preferences: existingPrefs };
  },

  validateSession: async (username: string, localSessionId: string): Promise<boolean> => {
      const supabase = getClient();
      if (!supabase) return true; // Fail open if offline

      const { data, error } = await supabase
          .from('profiles')
          .select('current_session_id')
          .eq('username', username)
          .single();

      if (error || !data) return false;

      // Update last active
      await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('username', username);

      return data.current_session_id === localSessionId;
  },

  // ---------------------------------------------------
  // DATA SYNCING
  // ---------------------------------------------------

  syncBag: async (username: string, bag: ClubStats[]) => {
      const supabase = getClient();
      if (!supabase) return;

      const { error } = await supabase
          .from('user_bags')
          .upsert({ 
              username: username, 
              bag_data: bag,
              updated_at: new Date().toISOString()
          }, { onConflict: 'username' });
      
      if (error) console.error("Failed to sync bag:", error.message);
  },

  syncPreferences: async (username: string, preferences: any) => {
      const supabase = getClient();
      if (!supabase) return;

      // We use update here to avoid overwriting session IDs if a race condition occurred.
      // Changing preferences counts as activity, so we update last_active.
      const { error } = await supabase
          .from('profiles')
          .update({ 
              preferences: preferences,
              last_active: new Date().toISOString()
          })
          .eq('username', username);
      
      if (error) console.error("Failed to sync preferences:", error.message);
  },

  syncRound: async (username: string, round: RoundHistory, tournamentId?: string) => {
      const supabase = getClient();
      if (!supabase) return;

      const payload: any = {
              username: username,
              course_name: round.courseName,
              scorecard: round.scorecard,
              shots: round.shots,
              round_data: round
      };

      if (tournamentId) {
          payload.tournament_id = tournamentId;
      }

      const { error } = await supabase
          .from('user_rounds')
          .insert(payload);
      
      if (error) console.error("Failed to upload round:", error.message);
  }
};
