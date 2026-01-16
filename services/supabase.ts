import { ClubStats, GolfCourse, RoundHistory, Tournament, LeaderboardEntry } from '../types';

// Mock implementation using LocalStorage to simulate Cloud behavior
// This ensures the app functions without an external Supabase backend configured.
const MOCK_DELAY = 500;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const CloudService = {
  validateSession: async (user: string, sessionId: string): Promise<boolean> => {
    // In a real app, verify with server. Here we just return true to allow offline usage.
    return true;
  },

  loginAndCreateSession: async (username: string) => {
    await delay(MOCK_DELAY);
    return {
      success: true,
      sessionId: 'mock-session-' + Date.now(),
      history: [] as RoundHistory[], // Would fetch from DB
      bag: [] as ClubStats[] // Would fetch from DB
    };
  },

  syncBag: async (user: string, bag: ClubStats[]) => {
    console.log(`[Cloud] Synced bag for ${user}`);
    // No-op for mock
  },

  syncRound: async (user: string, round: RoundHistory, tournamentId?: string) => {
    console.log(`[Cloud] Synced round for ${user}`);
    if (tournamentId) {
        const key = `mock_tournament_rounds_${tournamentId}`;
        const existingStr = localStorage.getItem(key);
        const existing = existingStr ? JSON.parse(existingStr) : [];
        // Check for duplicates in mock
        if (!existing.find((r: any) => r.round_data.id === round.id)) {
             existing.push({ username: user, round_data: round });
             localStorage.setItem(key, JSON.stringify(existing));
        }
    }
  },

  searchCourses: async (query: string, country?: string): Promise<GolfCourse[]> => {
    await delay(MOCK_DELAY);
    // Return empty or mock courses
    return [];
  },

  checkCourseExists: async (name: string, user: string): Promise<string | null> => {
    await delay(MOCK_DELAY);
    return null;
  },

  updateCourse: async (id: string, course: GolfCourse, user: string) => {
    await delay(MOCK_DELAY);
    return { success: true, message: "Course updated" };
  },

  uploadCourse: async (course: GolfCourse, user: string) => {
    await delay(MOCK_DELAY);
    return { success: true, message: "Course uploaded" };
  },

  getMyTournaments: async (user: string): Promise<Tournament[]> => {
    await delay(MOCK_DELAY);
    const key = `mock_user_tournaments_${user}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  joinTournament: async (code: string, user: string) => {
    await delay(MOCK_DELAY);
    const allTournamentsStr = localStorage.getItem('mock_all_tournaments');
    const allTournaments: Tournament[] = allTournamentsStr ? JSON.parse(allTournamentsStr) : [];
    const found = allTournaments.find(t => t.joinCode === code);
    
    if (found) {
        // Add to user list
        const userKey = `mock_user_tournaments_${user}`;
        const userListStr = localStorage.getItem(userKey);
        const userList: Tournament[] = userListStr ? JSON.parse(userListStr) : [];
        if (!userList.find(t => t.id === found.id)) {
            userList.push(found);
            localStorage.setItem(userKey, JSON.stringify(userList));
            
            // Add to participants
            const partKey = `mock_tournament_participants_${found.id}`;
            const partsStr = localStorage.getItem(partKey);
            const parts: any[] = partsStr ? JSON.parse(partsStr) : [];
            if (!parts.find(p => p.username === user)) {
                parts.push({ username: user });
                localStorage.setItem(partKey, JSON.stringify(parts));
            }
        }
        return { success: true };
    }
    return { success: false, error: "Invalid code" };
  },

  createTournament: async (name: string, course: GolfCourse, user: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    await delay(MOCK_DELAY);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newTournament: Tournament = {
        id: crypto.randomUUID(),
        name,
        host: user,
        courseId: course.id,
        courseName: course.name,
        joinCode: code,
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    // Save globally
    const allTournamentsStr = localStorage.getItem('mock_all_tournaments');
    const allTournaments: Tournament[] = allTournamentsStr ? JSON.parse(allTournamentsStr) : [];
    allTournaments.push(newTournament);
    localStorage.setItem('mock_all_tournaments', JSON.stringify(allTournaments));

    // Add to user list
    const userKey = `mock_user_tournaments_${user}`;
    const userListStr = localStorage.getItem(userKey);
    const userList: Tournament[] = userListStr ? JSON.parse(userListStr) : [];
    userList.push(newTournament);
    localStorage.setItem(userKey, JSON.stringify(userList));
    
    // Add self as participant
    const partKey = `mock_tournament_participants_${newTournament.id}`;
    localStorage.setItem(partKey, JSON.stringify([{ username: user }]));

    return { success: true, code };
  },

  getTournamentLeaderboard: async (tournamentId: string): Promise<LeaderboardEntry[]> => {
      await delay(MOCK_DELAY);
      const key = `mock_tournament_rounds_${tournamentId}`;
      const dataStr = localStorage.getItem(key);
      if (!dataStr) return [];
      const data = JSON.parse(dataStr);

      const entries: LeaderboardEntry[] = data.map((row: any) => {
          const r: RoundHistory = row.round_data;
          const score = r.scorecard.reduce((acc, h) => acc + h.shotsTaken + h.putts + h.penalties, 0);
          return {
              username: row.username,
              totalScore: score,
              thru: r.scorecard.length,
              roundData: { ...r, player: row.username }
          };
      });

      return entries.sort((a, b) => a.totalScore - b.totalScore);
  },

  getTournamentParticipants: async (tournamentId: string): Promise<string[]> => {
      await delay(MOCK_DELAY);
      const partKey = `mock_tournament_participants_${tournamentId}`;
      const partsStr = localStorage.getItem(partKey);
      if (!partsStr) return [];
      const data = JSON.parse(partsStr);
      return data.map((row: any) => row.username);
  }
};