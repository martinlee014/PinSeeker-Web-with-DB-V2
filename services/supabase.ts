import { createClient } from '@supabase/supabase-js';
import { GolfCourse } from '../types';

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

const getEnv = () => {
    try {
        // @ts-ignore
        return (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    } catch (e) {
        return {};
    }
};

const env = getEnv();

// Use environment variables from Vercel/Local .env
const SUPABASE_URL = env.VITE_SUPABASE_URL || ''; 
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';

// Initialize client only if keys allow it
export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co', 
    SUPABASE_ANON_KEY || 'placeholder'
);

const isConfigured = () => {
    return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
};

export const CloudService = {
  /**
   * Search for published courses in the cloud
   */
  searchCourses: async (query: string, country?: string): Promise<GolfCourse[]> => {
    if (!isConfigured()) {
        console.warn("Supabase credentials missing.");
        throw new Error("Cloud service not configured. Please check Vercel environment variables.");
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
      isCustom: false  // Cloud courses are read-only online
    }));
  },

  /**
   * Submit a local course to the cloud
   */
  uploadCourse: async (course: GolfCourse): Promise<{ success: boolean; message?: string }> => {
    if (!isConfigured()) {
        return { success: false, message: "Cloud service not configured." };
    }

    // 1. Prepare payload: Remove local flags before uploading
    const coursePayload = { ...course };
    delete (coursePayload as any).isCloud;
    delete (coursePayload as any).isCustom;
    delete (coursePayload as any).id; // Let DB generate ID
    
    // 2. Insert into Supabase
    const { error } = await supabase
      .from('courses')
      .insert({
        name: course.name,
        data: coursePayload, // Store full structure in JSONB
        status: 'published'
      });

    if (error) {
      console.error("Upload error:", error);
      return { success: false, message: error.message };
    }
    return { success: true };
  }
};