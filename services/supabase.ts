import { createClient } from '@supabase/supabase-js';
import { GolfCourse } from '../types';

// ---------------------------------------------------------
// CONFIGURATION
// Credentials provided for 'pinseekerapp'
// ---------------------------------------------------------

// Safely access environment variables to avoid crashes if import.meta.env is undefined
const getEnv = () => {
    try {
        // @ts-ignore
        return (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    } catch (e) {
        return {};
    }
};

const env = getEnv();

// Use provided credentials as defaults if env vars are not set
// This ensures the app doesn't crash on startup and can connect to the demo DB
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://ezvaynhdeygjpvuqvkbg.supabase.co'; 
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4SIUpiYqAXbR8Zdls6RN1w_2MTTLKOB';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const isConfigured = () => {
    return SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 0;
};

export const CloudService = {
  /**
   * Search for published courses in the cloud
   */
  searchCourses: async (query: string): Promise<GolfCourse[]> => {
    if (!isConfigured()) {
        console.warn("Supabase is not configured.");
        throw new Error("Database connection not configured.");
    }

    // Search 'name' column, filtered by status='published'
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .ilike('name', `%${query}%`)
      .limit(50);

    if (error) {
      console.error('Error searching courses:', error);
      throw error;
    }

    // Map DB rows back to GolfCourse objects
    return (data || []).map((row: any) => ({
      ...row.data,
      id: row.id, // Use Cloud UUID as the canonical ID
      name: row.name, // Ensure top-level name matches
      isCloud: true, // Flag to indicate source
      isCustom: false // Cloud courses are treated as read-only online
    }));
  },

  /**
   * Submit a local course to the cloud for approval
   */
  uploadCourse: async (course: GolfCourse): Promise<{ success: boolean; message?: string }> => {
    if (!isConfigured()) {
        return { success: false, message: "Database not configured." };
    }

    // 1. Prepare payload: Remove local flags before uploading
    const coursePayload = { ...course };
    delete (coursePayload as any).isCloud;
    delete (coursePayload as any).isCustom;
    
    // 2. Insert into Supabase
    const { error } = await supabase
      .from('courses')
      .insert({
        name: course.name,
        data: coursePayload, // Store full structure in JSONB
        status: 'pending' // Default to pending review
      });

    if (error) {
      console.error("Upload error:", error);
      return { success: false, message: error.message };
    }
    return { success: true };
  }
};