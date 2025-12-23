
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GolfCourse, ClubStats, RoundHistory } from '../types';

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
      console.error('Error searching courses:', error);
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
  // AUTH & SESSION MANAGEMENT (New)
  // ---------------------------------------------------

  /**
   * Logs a user in, creating a profile if needed, and generating a unique session ID.
   * This session ID allows us to enforce "single terminal access".
   */
  loginAndCreateSession: async (username: string): Promise<{ 
      success: boolean; 
      sessionId?: string; 
      bag?: ClubStats[]; 
      history?: RoundHistory[] 
  }> => {
      const supabase = getClient();
      if (!supabase) return { success: false };

      const newSessionId = crypto.randomUUID();

      // 1. Upsert Profile with new Session ID
      const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
              username: username, 
              current_session_id: newSessionId,
              last_active: new Date().toISOString()
          }, { onConflict: 'username' });
      
      if (profileError) {
          console.error("Login failed:", profileError);
          return { success: false };
      }

      // 2. Fetch User Bag
      let bag: ClubStats[] | undefined = undefined;
      const { data: bagData } = await supabase
          .from('user_bags')
          .select('bag_data')
          .eq('username', username)
          .single();
      
      if (bagData) bag = bagData.bag_data;

      // 3. Fetch User History
      let history: RoundHistory[] | undefined = undefined;
      const { data: roundsData } = await supabase
          .from('user_rounds')
          .select('round_data')
          .eq('username', username)
          .order('created_at', { ascending: false });
      
      if (roundsData) {
          history = roundsData.map((r: any) => r.round_data);
      }

      return { success: true, sessionId: newSessionId, bag, history };
  },

  /**
   * Called periodically by the client to ensure the session is still valid.
   * If current_session_id in DB differs from local, another device has logged in.
   */
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
  // DATA SYNCING (New)
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
      
      if (error) console.error("Failed to sync bag:", error);
  },

  syncRound: async (username: string, round: RoundHistory) => {
      const supabase = getClient();
      if (!supabase) return;

      const { error } = await supabase
          .from('user_rounds')
          .insert({
              username: username,
              course_name: round.courseName,
              scorecard: round.scorecard,
              shots: round.shots,
              round_data: round
          });
      
      if (error) console.error("Failed to upload round:", error);
  }
};
