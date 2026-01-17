
export interface LatLng {
  lat: number;
  lng: number;
}

export interface ClubStats {
  name: string;
  carry: number;
  sideError: number;
  depthError: number;
}

export interface TeeBox {
  id: string;
  name: string; // e.g., "Blue", "White", "Red"
  color: string; // Hex color
  location: LatLng;
  par: number;
  strokeIndex: number; // Handicap
  courseRating?: number;
  slopeRating?: number;
}

export interface GreenGeometry {
  center: LatLng;
  shape: LatLng[]; // Polygon points
  width?: number; // Optional cached width
  depth?: number; // Optional cached depth
}

export interface GolfHole {
  number: number;
  // Legacy/Simplified Fallback
  par: number; 
  tee: LatLng; 
  green: LatLng; 
  
  // New Detailed Data
  teeBoxes: TeeBox[];
  greenGeo?: GreenGeometry;
}

export interface GolfCourse {
  id: string;
  name: string;
  country?: string;
  holes: GolfHole[];
  createdAt?: string;
  isCustom?: boolean;
  isCloud?: boolean; 
}

export interface ShotRecord {
  holeNumber: number;
  shotNumber: number;
  from: LatLng;
  to: LatLng;
  clubUsed: string;
  distance: number;
  plannedInfo?: {
    target: LatLng; 
    dispersion: {
      width: number; 
      depth: number; 
      rotation: number; 
    };
  };
}

export interface HoleScore {
  holeNumber: number;
  par: number;
  shotsTaken: number;
  putts: number;
  penalties: number;
}

export interface RoundHistory {
  id: string;
  date: string;
  courseName: string;
  scorecard: HoleScore[];
  shots: ShotRecord[];
  tournamentId?: string;
  player?: string;
  teeName?: string; // Record which tee was played
}

export interface MapAnnotation {
  id: string;
  courseId: string;
  holeNumber: number;
  type: 'text' | 'icon' | 'path';
  subType?: 'flag' | 'hazard' | 'rough'; 
  points: LatLng[]; 
  text?: string;
}

export interface GameState {
  currentHoleIndex: number;
  currentShotNum: number;
  currentBallPos: LatLng;
  selectedClub: ClubStats;
  scorecard: HoleScore[];
  shots: ShotRecord[];
  isRoundActive: boolean;
  courseId?: string; 
  tournamentId?: string; 
}

export interface UserSession {
    username: string;
    sessionId: string;
}

export interface Tournament {
    id: string;
    name: string;
    host: string;
    courseId: string;
    courseName: string;
    joinCode: string;
    createdAt: string;
    status: 'active' | 'completed';
    playerCount?: number;
}

export interface LeaderboardEntry {
    username: string;
    totalScore: number;
    scoreToPar: number; // New field for PGA style display
    thru: number | 'F'; // Updated to allow 'F' string
    roundData: RoundHistory;
}

declare global {
  interface AIStudio {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
