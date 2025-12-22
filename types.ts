
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

export interface GolfHole {
  number: number;
  par: number;
  tee: LatLng;
  green: LatLng; // Center of the green
  greenFront?: LatLng;
  greenBack?: LatLng;
  greenLeft?: LatLng;
  greenRight?: LatLng;
}

export interface GolfCourse {
  id: string;
  name: string;
  holes: GolfHole[];
  createdAt?: string;
  isCustom?: boolean;
  isCloud?: boolean; // New flag to distinguish cloud courses
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
}
