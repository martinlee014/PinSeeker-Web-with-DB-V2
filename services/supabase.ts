import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GolfCourse } from '../types';

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

// Reset function (kept for compatibility, though less needed with hardcoded creds)
export const resetSupabaseClient = () => {
    clientInstance = null;
};

export const CloudService = {
  /**
   * Search for published courses in the cloud
   */
  searchCourses: async (query: string, country?: string): Promise<GolfCourse[]> => {
    const supabase = getClient();
    
    if (!supabase) {
        throw new Error("Cloud service could not be initialized.");
    }

    // Build query
    let dbQuery = supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .ilike('name', `%${query}%`);
    
    // Apply Country Filter if selected and not "All"
    if (country && country !== 'All') {
        // Query the JSONB 'data' column for the 'country' key
        dbQuery = dbQuery.eq('data->>country', country);
    }

    const { data, error } = await dbQuery.limit(50);

    if (error) {
      console.error('Error searching courses:', error);
      throw error;
    }

    // Map DB rows back to GolfCourse objects
    return (data || []).map((row: any) => ({
      ...row.data,     // Spread the JSONB content (holes, pars, etc)
      id: row.id,      // Override with Cloud UUID
      name: row.name,  // Ensure top-level name matches
      isCloud: true,   // Flag to indicate source
      isCustom: false, // Cloud courses are read-only online
      author: row.data.author // Include author info if available
    }));
  },

  /**
   * Submit a local course to the cloud
   */
  uploadCourse: async (course: GolfCourse, username: string): Promise<{ success: boolean; message?: string }> => {
    const supabase = getClient();

    if (!supabase) {
        return { success: false, message: "Cloud service not available." };
    }

    if (!username) {
        return { success: false, message: "User not identified. Please login again." };
    }

    // 1. Prepare payload: Remove local flags before uploading
    //    Add the 'author' tag to the data payload
    const coursePayload = { 
        ...course,
        author: username // Tag the data with the username
    };
    
    delete (coursePayload as any).isCloud;
    delete (coursePayload as any).isCustom;
    delete (coursePayload as any).id; // Let DB generate ID
    
    // 2. Insert into Supabase
    const { error } = await supabase
      .from('courses')
      .insert({
        name: course.name,
        data: coursePayload, // Store full structure in JSONB including author
        status: 'published'
      });

    if (error) {
      console.error("Upload error:", error);
      return { success: false, message: error.message };
    }
    return { success: true };
  }
};