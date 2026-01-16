
// ... (imports remain the same)
import React, { useState, useEffect, useContext, useMemo, useRef, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AppContext } from '../App';
import { DUVENHOF_COURSE } from '../constants';
import { StorageService } from '../services/storage';
import { CloudService } from '../services/supabase';
import * as MathUtils from '../services/mathUtils';
import { ClubStats, HoleScore, ShotRecord, RoundHistory, LatLng, GolfCourse, MapAnnotation, TeeBox } from '../types';
import ClubSelector from '../components/ClubSelector';
import { ScoreModal, ShotConfirmModal, HoleSelectorModal, FullScorecardModal, ModalOverlay, ScoreConflictModal } from '../components/Modals';
import { Flag, Wind, ChevronLeft, Grid, ListChecks, ArrowLeft, ArrowRight, ChevronDown, MapPin, Ruler, Trash2, PenTool, Type, Highlighter, X, Check, Eraser, Home, Signal, SignalHigh, SignalLow, SignalMedium, Footprints, PlayCircle, RotateCcw, Rocket, Satellite, Menu, MoreVertical, LayoutGrid, Loader2, UserCircle } from 'lucide-react';
// ... (rest of imports)
import { 
  flagIcon, 
  userFlagIcon, 
  targetIcon, 
  measureTargetIcon, 
  draggableMeasureStartIcon, 
  startMarkerIcon, 
  ballIcon, 
  userLocationIcon, 
  createArrowIcon, 
  createReplayLabelIcon, 
  createDistanceLabelIcon, 
  createAnnotationTextIcon 
} from '../utils/mapIcons';

// ... (Icon components like GolfBagIcon, RotatedMapHandler, MapInitializer remain same)

const GolfBagIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M7 6h10v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2 2H9a2 2 0 0 1-2 2H9a2 2 0 0 1-2 2H9a2 2 0 0 1-2 2H9a2 2 0 0 1-2 2H9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6z" />
    <path d="M9 6V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    <path d="M9 4l-2 2" />
    <path d="M15 4l2 2" />
    <path d="M17 10l2 2a2 2 0 0 1 0 3l-2 2" />
    <path d="M10 12h4" />
    <path d="M10 16h4" />
  </svg>
);

const RotatedMapHandler = ({ 
    rotation, 
    onLongPress,
    onClick
}: { 
    rotation: number, 
    onLongPress: (latlng: LatLng) => void,
    onClick: (latlng: LatLng) => void
}) => {
  const map = useMap();
  const isDragging = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);
  
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startClientPos = useRef<{x: number, y: number} | null>(null);
  const hasMovedSignificantly = useRef(false);
  const isMultiTouch = useRef(false);

  useEffect(() => {
    const container = map.getContainer();
    container.style.touchAction = 'none';

    const getClientPos = (e: MouseEvent | TouchEvent) => {
      if (window.TouchEvent && e instanceof TouchEvent) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };

    const calculateLatLng = (clientPos: {x: number, y: number}) => {
        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientPos.x - cx;
        const dy = clientPos.y - cy;
        const angleRad = (-rotation * Math.PI) / 180;
        const rotatedX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
        const rotatedY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
        const mapSize = map.getSize();
        const leafPoint = L.point(mapSize.x / 2 + rotatedX, mapSize.y / 2 + rotatedY);
        return map.containerPointToLatLng(leafPoint);
    };

    const handleLongPress = (clientPos: {x: number, y: number}) => {
        const latlng = calculateLatLng(clientPos);
        if (navigator.vibrate) navigator.vibrate(50);
        onLongPress({ lat: latlng.lat, lng: latlng.lng });
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.stopPropagation(); 
      if (window.TouchEvent && e instanceof TouchEvent) {
         if (e.touches.length === 1) e.preventDefault();
      }

      if ((e as MouseEvent).button === 2) {
          e.preventDefault();
          return;
      }

      if (window.TouchEvent && e instanceof TouchEvent && e.touches.length > 1) {
          isMultiTouch.current = true;
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          isDragging.current = false;
          return;
      }

      isDragging.current = true;
      hasMovedSignificantly.current = false;
      isMultiTouch.current = false;
      const pos = getClientPos(e);
      lastPos.current = pos;
      startClientPos.current = pos;

      const target = e.target as HTMLElement;
      
      const closestInteractive = target.closest('.leaflet-interactive');
      const isActuallyBlocked = closestInteractive && !target.closest('.pointer-events-none') && !target.classList.contains('pointer-events-none');
      const isPopup = target.closest('.leaflet-popup-pane');
      
      if (!isActuallyBlocked && !isPopup) {
          longPressTimer.current = setTimeout(() => {
              isDragging.current = false;
              if (!hasMovedSignificantly.current && !isMultiTouch.current) {
                  handleLongPress(pos);
              }
          }, 600);
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (window.TouchEvent && e instanceof TouchEvent && e.touches.length > 1) {
          isMultiTouch.current = true;
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          isDragging.current = false;
          return;
      }

      const currentPos = getClientPos(e);
      if (startClientPos.current) {
          const moveDist = Math.sqrt(Math.pow(currentPos.x - startClientPos.current.x, 2) + Math.pow(currentPos.y - startClientPos.current.y, 2));
          if (moveDist > 50) { 
              hasMovedSignificantly.current = true;
              if (longPressTimer.current) clearTimeout(longPressTimer.current);
          }
      }

      if (!isDragging.current || !lastPos.current) return;
      if(e.cancelable) e.preventDefault(); 

      const deltaX = currentPos.x - lastPos.current.x;
      const deltaY = currentPos.y - lastPos.current.y;
      const theta = -rotation * (Math.PI / 180); 
      const rotatedDx = deltaX * Math.cos(theta) - deltaY * Math.sin(theta);
      const rotatedDy = deltaX * Math.sin(theta) + deltaY * Math.cos(theta);

      map.panBy([-rotatedDx, -rotatedDy], { animate: false });
      lastPos.current = currentPos;
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      if (isMultiTouch.current) {
          isDragging.current = false;
          return;
      }
      if (startClientPos.current && !hasMovedSignificantly.current) {
         const target = e.target as HTMLElement;
         const closestInteractive = target.closest('.leaflet-interactive');
         const isActuallyBlocked = closestInteractive && !target.closest('.pointer-events-none') && !target.classList.contains('pointer-events-none');

         if (!isActuallyBlocked) {
             const latlng = calculateLatLng(startClientPos.current);
             onClick({ lat: latlng.lat, lng: latlng.lng });
         }
      }
      isDragging.current = false;
      lastPos.current = null;
      startClientPos.current = null;
    };

    container.addEventListener('mousedown', handleStart);
    container.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    container.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      container.removeEventListener('mousedown', handleStart);
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [map, rotation, onLongPress, onClick]);

  return null;
};

const MapInitializer = ({ center, isReplay, pointsToFit }: { center: LatLng, isReplay: boolean, pointsToFit?: LatLng[] }) => {
    const map = useMap();
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(map.getContainer());
        setTimeout(() => map.invalidateSize(), 250);
        return () => resizeObserver.disconnect();
    }, [map]);

    useEffect(() => {
        if (isReplay && pointsToFit && pointsToFit.length > 0) {
            // CRITICAL FIX: Filter out invalid (0,0) coordinates which cause the "zoom out to whole world" issue
            const validPoints = pointsToFit.filter(p => p.lat !== 0 && p.lng !== 0);
            if (validPoints.length > 0) {
                let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
                validPoints.forEach(p => {
                    if (p.lat < minLat) minLat = p.lat;
                    if (p.lat > maxLat) maxLat = p.lat;
                    if (p.lng < minLng) minLng = p.lng;
                    if (p.lng > maxLng) maxLng = p.lng;
                });
                const bounds = L.latLngBounds(L.latLng(minLat, minLng), L.latLng(maxLat, maxLng));
                // Add padding to ensure the UI HUD doesn't block the markers
                map.fitBounds(bounds, { padding: [80, 80], animate: true, duration: 0.8 });
            }
        } else {
            // Default view for active play
            if (center.lat !== 0) {
                map.setView([center.lat, center.lng], 18, { animate: false });
            }
        }
    }, [center, isReplay, map, pointsToFit]);
    return null;
}

type AnnotationTool = 'text' | 'pin' | 'draw' | 'eraser';

const PlayRound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, useYards, bag, isOnline } = useContext(AppContext);

  const replayRound = location.state?.round as RoundHistory | undefined;
  const initialHoleIdx = location.state?.initialHoleIndex || 0;
  const passedCourse = location.state?.course as GolfCourse | undefined;
  const tournamentId = location.state?.tournamentId as string | undefined;
  
  // Scorer Mode check
  const isScorerMode = !!location.state?.playerOverride;
  const activePlayerName = location.state?.playerOverride || user || 'Guest';
  const trackedPlayers: string[] = location.state?.group || [activePlayerName];
  
  // Safe Name Extraction helper
  const getDisplayName = (val: any) => {
      if (!val) return 'Guest';
      if (typeof val === 'string') return val;
      if (typeof val === 'object') return val.username || val.name || 'Player';
      return 'Guest';
  };
  const scorerDisplayName = getDisplayName(activePlayerName);

  const isReplay = !!replayRound;

  // Initialize activeCourse synchronously from storage if it's a replay of a custom course
  const [activeCourse, setActiveCourse] = useState<GolfCourse>(() => {
      if (passedCourse) return passedCourse;
      
      // If Replay, resolve course by name
      if (isReplay && replayRound) {
          const allCourses = StorageService.getAllCourses();
          const found = allCourses.find(c => c.name === replayRound.courseName);
          return found || DUVENHOF_COURSE;
      }
      
      // If restoring active game, resolve by ID
      if (!isReplay && user) {
          const searchParams = new URLSearchParams(location.search);
          if (searchParams.get('restore') === 'true') {
             const saved = StorageService.getTempState(user);
             if (saved && saved.courseId) {
                 const allCourses = StorageService.getAllCourses();
                 const found = allCourses.find(c => c.id === saved.courseId);
                 if (found) return found;
             }
          }
      }
      
      return DUVENHOF_COURSE;
  });

  const [currentHoleIdx, setCurrentHoleIdx] = useState(initialHoleIdx);
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [scorecard, setScorecard] = useState<HoleScore[]>([]);
  
  // TEE SELECTION STATE
  const [selectedTee, setSelectedTee] = useState<TeeBox | null>(null);
  const [showTeeSelect, setShowTeeSelect] = useState(!isReplay); // Show default if not replay

  const hole = activeCourse.holes[currentHoleIdx];

  // Logic to determine active tee box
  const activeTee = useMemo(() => {
     if (isReplay) return hole.tee; // Fallback for replays
     if (selectedTee && hole.teeBoxes && hole.teeBoxes.length > 0) {
         // Try to find the matching color/name for the current hole
         const matchingTee = hole.teeBoxes.find(t => t.name === selectedTee.name) || hole.teeBoxes[0];
         return matchingTee.location;
     }
     return hole.teeBoxes?.[0]?.location || hole.tee;
  }, [selectedTee, hole, isReplay]);

  // Logic to determine active par
  const activePar = useMemo(() => {
     if (selectedTee && hole.teeBoxes && hole.teeBoxes.length > 0) {
         const matchingTee = hole.teeBoxes.find(t => t.name === selectedTee.name) || hole.teeBoxes[0];
         return matchingTee.par || hole.par;
     }
     return hole.par;
  }, [selectedTee, hole]);

  const [currentBallPos, setCurrentBallPos] = useState<LatLng>(() => {
      // 1. Try restore from temp state
      if (!isReplay && user) {
          const searchParams = new URLSearchParams(location.search);
          if (searchParams.get('restore') === 'true') {
              const saved = StorageService.getTempState(user);
              if (saved) {
                   if (saved.currentBallPos) return saved.currentBallPos;
              }
          }
      }
      return { lat: 0, lng: 0 }; // Temporary, updated via effect once activeTee resolves
  });

  const [selectedClub, setSelectedClub] = useState<ClubStats>(bag[0] || { name: 'Driver', carry: 230, sideError: 45, depthError: 25 });
  const [aimAngle, setAimAngle] = useState(0);
  const [shotNum, setShotNum] = useState(1);
  const [showHoleSelect, setShowHoleSelect] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showFullCard, setShowFullCard] = useState(false);
  const [groupScorecards, setGroupScorecards] = useState<RoundHistory[]>([]);
  const [pendingShot, setPendingShot] = useState<{ pos: LatLng, isGPS: boolean, dist: number } | null>(null);
  const [windSpeed, setWindSpeed] = useState(5);
  const [windDir, setWindDir] = useState(180);
  const [showWind, setShowWind] = useState(false);
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [measureTarget, setMeasureTarget] = useState<LatLng | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [annotations, setAnnotations] = useState<MapAnnotation[]>([]);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('text');
  const [drawingPoints, setDrawingPoints] = useState<LatLng[]>([]);
  const [showTextInput, setShowTextInput] = useState<{lat: number, lng: number} | null>(null);
  const [textInputValue, setTextInputValue] = useState("");
  const [shotToDelete, setShotToDelete] = useState<ShotRecord | null>(null);
  const [liveLocation, setLiveLocation] = useState<LatLng | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsSignalLevel, setGpsSignalLevel] = useState<0 | 1 | 2 | 3>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Conflict State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [scoreConflicts, setScoreConflicts] = useState<any[]>([]);
  const [pendingScoresToSave, setPendingScoresToSave] = useState<Record<string, any> | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  const [trackingStartPos, setTrackingStartPos] = useState<LatLng | null>(null);
  const teePressTimer = useRef<any>(null);
  const [teeButtonText, setTeeButtonText] = useState("TEE OFF");
  const [isTeePressing, setIsTeePressing] = useState(false);

  const drivingDist = useMemo(() => {
      if (isTrackingMode && trackingStartPos && liveLocation) {
          return MathUtils.calculateDistance(trackingStartPos, liveLocation);
      }
      return 0;
  }, [isTrackingMode, trackingStartPos, liveLocation]);

  useEffect(() => {
    // We already resolved activeCourse in useState, so we only need to load shot data here
    if (isReplay && replayRound) {
        setShots(replayRound.shots);
        setScorecard(replayRound.scorecard);
        setShowTeeSelect(false);
    } else {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('restore') === 'true' && user) {
            const saved = StorageService.getTempState(user);
            if (saved) {
                setCurrentHoleIdx(saved.currentHoleIndex);
                setShots(saved.shots);
                setScorecard(saved.scorecard);
                setShotNum(saved.currentShotNum);
                // If restore, we don't show tee select unless data is missing
                setShowTeeSelect(false);
            }
        }
    }
  }, []);

  // Update Ball Pos when hole changes IF we are at the tee
  useEffect(() => {
      if (hole && shotNum === 1 && !pendingShot && !isReplay) {
          // If we haven't taken a shot on this hole, ensure we are at the active tee
           const isAtTee = shots.filter(s => s.holeNumber === hole.number).length === 0;
           if (isAtTee) {
              setCurrentBallPos(activeTee);
           }
      }
  }, [currentHoleIdx, activeTee]);

  // ... (Other effects same) ...
  useEffect(() => {
    if (isReplay || !navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition((p) => {
        const { latitude, longitude, accuracy } = p.coords;
        setLiveLocation({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy);
        if (accuracy <= 10) setGpsSignalLevel(3);
        else if (accuracy <= 30) setGpsSignalLevel(2);
        else setGpsSignalLevel(1);
    }, () => setGpsSignalLevel(0), { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 });
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [isReplay]);

  useEffect(() => {
    if (hole && activeCourse) setAnnotations(StorageService.getAnnotations(activeCourse.id, hole.number));
  }, [currentHoleIdx, activeCourse]);

  useEffect(() => {
    if (bag.length > 0) {
      const updatedClub = bag.find(c => c.name === selectedClub.name);
      setSelectedClub(updatedClub || bag[0]);
    }
  }, [bag]);

  useEffect(() => {
    if (!isReplay && user) {
      StorageService.saveTempState(user, {
        currentHoleIndex: currentHoleIdx,
        currentShotNum: shotNum,
        currentBallPos,
        scorecard,
        shots,
        courseId: activeCourse.id,
        tournamentId: tournamentId
      });
    }
  }, [currentHoleIdx, shotNum, currentBallPos, scorecard, shots, isReplay, user, activeCourse, tournamentId]);

  if (!hole) return <div className="p-10 text-white">Loading Hole Data...</div>;

  // -- LOGIC START FOR GREEN POINTS DEFAULTING --
  // Use new Geometry logic if available
  const greenCenter = hole.greenGeo?.center || hole.green;
  
  const greenEdges = useMemo(() => {
      // This is the key upgrade: calculate dynamic edges based on player position
      return MathUtils.getDynamicGreenEdges(currentBallPos, greenCenter, hole.greenGeo?.shape || []);
  }, [currentBallPos, greenCenter, hole.greenGeo]);

  const distToGreen = useMemo(() => MathUtils.calculateDistance(currentBallPos, greenCenter), [currentBallPos, greenCenter]);
  const distToFront = useMemo(() => MathUtils.calculateDistance(currentBallPos, greenEdges.front), [currentBallPos, greenEdges]);
  const distToBack = useMemo(() => MathUtils.calculateDistance(currentBallPos, greenEdges.back), [currentBallPos, greenEdges]);

  const baseBearing = useMemo(() => MathUtils.calculateBearing(currentBallPos, greenCenter), [currentBallPos, greenCenter]);
  const shotBearing = baseBearing + aimAngle;
  const mapRotation = -baseBearing;

  const { destination: predictedLanding } = useMemo(() => MathUtils.calculateWindAdjustedShot(
    currentBallPos, selectedClub.carry, shotBearing, windSpeed, windDir
  ), [currentBallPos, selectedClub, shotBearing, windSpeed, windDir]);

  const distLandingToGreen = useMemo(() => MathUtils.calculateDistance(predictedLanding, greenCenter), [predictedLanding, greenCenter]);

  const ellipsePoints = useMemo(() => MathUtils.getEllipsePoints(
    predictedLanding, 
    selectedClub.depthError * 2, 
    selectedClub.sideError * 2,  
    90 - shotBearing
  ).map(p => [p.lat, p.lng] as [number, number]), [predictedLanding, selectedClub, shotBearing]);

  const holeShots = useMemo(() => shots.filter(s => s.holeNumber === hole.number), [shots, hole.number]);
  
  // Replay Points: filtered to include ONLY valid coordinates (Tee + Green + Shots)
  const replayPoints = useMemo(() => {
      if (!isReplay) return [];
      const pts = [hole.tee, hole.green, ...holeShots.map(s => s.to)];
      // Filter out any 0,0 coordinates to prevent map zooming out to world view
      return pts.filter(p => p.lat !== 0 && p.lng !== 0);
  }, [isReplay, hole, holeShots]);

  const guideLinePoints = useMemo(() => [[predictedLanding.lat, predictedLanding.lng], [greenCenter.lat, greenCenter.lng]], [predictedLanding, greenCenter]);
  const guideLabelPos = useMemo(() => ({
      lat: predictedLanding.lat + (greenCenter.lat - predictedLanding.lat) * 0.33,
      lng: predictedLanding.lng + (greenCenter.lng - predictedLanding.lng) * 0.33
  }), [predictedLanding, greenCenter]);

  const activeMeasureTarget = measureTarget || predictedLanding;
  const measureDist1 = useMemo(() => MathUtils.calculateDistance(currentBallPos, activeMeasureTarget), [currentBallPos, activeMeasureTarget]);
  const measureDist2 = useMemo(() => MathUtils.calculateDistance(activeMeasureTarget, greenCenter), [activeMeasureTarget, greenCenter]);
  const labelPos1 = useMemo(() => ({ lat: (currentBallPos.lat + activeMeasureTarget.lat) / 2, lng: (currentBallPos.lng + activeMeasureTarget.lng) / 2 }), [currentBallPos, activeMeasureTarget]);
  const labelPos2 = useMemo(() => ({ lat: (activeMeasureTarget.lat + greenCenter.lat) / 2, lng: (activeMeasureTarget.lng + greenCenter.lng) / 2 }), [activeMeasureTarget, greenCenter]);

  const currentLayupStrategy = useMemo(() => MathUtils.calculateLayupStrategy(distToGreen, bag, shotNum), [distToGreen, bag, shotNum]);

  useEffect(() => {
    if (!isReplay && bag.length > 0 && !isMeasureMode && !isTrackingMode) {
      const dist = distToGreen;
      if (dist < 50) setSelectedClub(bag[bag.length - 1]);
      else {
        let validClubs = shotNum > 1 ? bag.filter(c => !c.name.toLowerCase().includes('driver')) : bag;
        const sortedValid = [...validClubs].sort((a,b) => b.carry - a.carry);
        let suitable = [...sortedValid].reverse().find(c => c.carry >= dist - 10) || (currentLayupStrategy ? currentLayupStrategy.club1 : sortedValid[0]);
        if (suitable) setSelectedClub(suitable);
      }
    }
  }, [currentBallPos, currentHoleIdx, isReplay, isMeasureMode, shotNum, distToGreen]);

  const nextClubSuggestion = useMemo(() => {
    if (currentLayupStrategy && shotNum > 1 && bag.length > 1) {
        const longestValid = bag.find(c => !c.name.toLowerCase().includes('driver')) || bag[0];
        if (distToGreen > longestValid.carry + 10) return `${currentLayupStrategy.club1.name} + ${currentLayupStrategy.club2.name}`;
    }
    if (distLandingToGreen < 20) return "Putter";
    const validForNext = bag.filter(c => !c.name.toLowerCase().includes('driver'));
    if (validForNext.length === 0) return "Club";
    const sorted = [...validForNext].sort((a,b) => a.carry - b.carry);
    return (sorted.find(c => c.carry >= distLandingToGreen) || sorted[sorted.length-1]).name;
  }, [distLandingToGreen, bag, currentLayupStrategy, distToGreen, shotNum]);

  // ... (Standard Handler Functions unchanged: saveDrawing, saveTextNote, handleMapClick, handleManualDrop, initiateGPSShot, setTeeToGPS, handleMeasureGPS, handleStartShot, handleFinishTracking, confirmShot, deleteAnnotation, handleDeleteShot) ...
  const saveDrawing = () => {
      if (drawingPoints.length < 2) return;
      const newNote: MapAnnotation = {
          id: crypto.randomUUID(),
          courseId: activeCourse.id,
          holeNumber: hole.number,
          type: 'path',
          points: drawingPoints
      };
      StorageService.saveAnnotation(newNote);
      setAnnotations(prev => [...prev, newNote]);
      setDrawingPoints([]);
  };

  const saveTextNote = () => {
      if (!showTextInput || !textInputValue.trim()) { setShowTextInput(null); return; }
      const newNote: MapAnnotation = {
          id: crypto.randomUUID(),
          courseId: activeCourse.id,
          holeNumber: hole.number,
          type: 'text',
          points: [showTextInput],
          text: textInputValue
      };
      StorageService.saveAnnotation(newNote);
      setAnnotations(prev => [...prev, newNote]);
      setShowTextInput(null);
      setTextInputValue("");
  };

  const handleMapClick = (latlng: any) => {
    if (isReplay) return;
    if (isNoteMode) {
        if (activeTool === 'pin') {
            const newNote: MapAnnotation = { id: crypto.randomUUID(), courseId: activeCourse.id, holeNumber: hole.number, type: 'icon', subType: 'flag', points: [{lat: latlng.lat, lng: latlng.lng}] };
            StorageService.saveAnnotation(newNote);
            setAnnotations(prev => [...prev, newNote]);
        } else if (activeTool === 'draw') {
             setDrawingPoints(prev => [...prev, {lat: latlng.lat, lng: latlng.lng}]);
        } else if (activeTool === 'text') {
             setShowTextInput({lat: latlng.lat, lng: latlng.lng}); 
             setTextInputValue("");
        }
        return;
    }
    if (isMeasureMode) {
        if (MathUtils.calculateDistance(currentBallPos, { lat: latlng.lat, lng: latlng.lng }) < 5) return;
        setMeasureTarget({ lat: latlng.lat, lng: latlng.lng });
        return;
    }
    const bearingToClick = MathUtils.calculateBearing(currentBallPos, { lat: latlng.lat, lng: latlng.lng });
    let diff = bearingToClick - baseBearing;
    if (diff > 180) diff -= 360; else if (diff < -180) diff += 360;
    setAimAngle(diff);
  };

  const handleManualDrop = (latlng: any) => {
    if (isReplay || isMeasureMode) return;
    if (isNoteMode) {
        if (activeTool === 'text') { setShowTextInput({lat: latlng.lat, lng: latlng.lng}); setTextInputValue(""); }
        return;
    }
    const pos = { lat: latlng.lat, lng: latlng.lng };
    setPendingShot({ pos, isGPS: false, dist: MathUtils.calculateDistance(currentBallPos, pos) });
  };

  const initiateGPSShot = () => {
    const success = (pos: any) => {
        const gpsPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPendingShot({ pos: gpsPos, isGPS: true, dist: MathUtils.calculateDistance(currentBallPos, gpsPos) });
    };
    if (liveLocation && gpsAccuracy && gpsAccuracy < 50) success({ coords: { latitude: liveLocation.lat, longitude: liveLocation.lng } });
    else navigator.geolocation.getCurrentPosition(success, (err) => alert("GPS Error: " + err.message), { enableHighAccuracy: true, timeout: 5000 });
  };

  const setTeeToGPS = () => {
    const success = (pos: any) => {
        setCurrentBallPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    };
    if (liveLocation && gpsAccuracy && gpsAccuracy < 50) success({ coords: { latitude: liveLocation.lat, longitude: liveLocation.lng } });
    else navigator.geolocation.getCurrentPosition(success, (err) => alert("GPS Error: " + err.message));
  };

  const handleMeasureGPS = () => {
      if (liveLocation) { setCurrentBallPos(liveLocation); if (navigator.vibrate) navigator.vibrate(50); return; }
      navigator.geolocation.getCurrentPosition((pos) => {
          setCurrentBallPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (navigator.vibrate) navigator.vibrate(50);
      }, (err) => alert("GPS Error: " + err.message));
  };

  const handleStartShot = () => {
    setTrackingStartPos(currentBallPos);
    setIsTrackingMode(true);
    setIsMeasureMode(false);
    setIsNoteMode(false);
  };

  const handleFinishTracking = () => {
    if (!liveLocation) {
        alert("Waiting for GPS signal...");
        return;
    }
    setPendingShot({
         pos: liveLocation,
         isGPS: true,
         dist: MathUtils.calculateDistance(trackingStartPos!, liveLocation)
    });
  };

  const confirmShot = () => {
    if (!pendingShot) return;
    setShots(prev => [...prev, { holeNumber: hole.number, shotNumber: shotNum, from: currentBallPos, to: pendingShot.pos, clubUsed: selectedClub.name, distance: pendingShot.dist, plannedInfo: { target: predictedLanding, dispersion: { width: selectedClub.depthError * 2, depth: selectedClub.sideError * 2, rotation: 90 - shotBearing } } }]);
    setCurrentBallPos(pendingShot.pos);
    setShotNum(prev => prev + 1);
    setAimAngle(0);
    setPendingShot(null);
    setIsTrackingMode(false);
    setTrackingStartPos(null);
  };

  const deleteAnnotation = (id: string) => {
    if (window.confirm("Delete this annotation?")) {
        StorageService.deleteAnnotation(id);
        setAnnotations(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleDeleteShot = () => {
    if (!shotToDelete) return;
    const isMostRecent = shots.filter(s => s.holeNumber === hole.number).pop() === shotToDelete;
    setShots(prev => prev.filter(s => s !== shotToDelete));
    if (isMostRecent) { setCurrentBallPos(shotToDelete.from); setShotNum(Math.max(1, shotToDelete.shotNumber)); }
    setShotToDelete(null);
  };

  // NEW: Helper to quickly undo the last shot for current hole
  const handleUndoLastShot = () => {
      const currentHoleShots = shots.filter(s => s.holeNumber === hole.number);
      if (currentHoleShots.length === 0) {
          alert("No shots recorded for this hole yet.");
          return;
      }
      const lastShot = currentHoleShots[currentHoleShots.length - 1];
      setShotToDelete(lastShot);
      setIsMenuOpen(false); // Close menu
  };

  const saveHoleScore = async (scores: Record<string, {totalScore: number, putts: number, pens: number}>, ignoreConflicts = false) => {
    if (isSaving) return;
    setIsSaving(true);
    
    // Conflict Detection Logic
    if (tournamentId && isOnline && !ignoreConflicts) {
        const conflicts = [];
        const playersToCheck = Object.keys(scores);
        
        for (const player of playersToCheck) {
            try {
                const cloudRound = await CloudService.getRound(tournamentId, player);
                if (cloudRound) {
                    const existingScore = cloudRound.scorecard.find(s => s.holeNumber === hole.number);
                    const newTotal = scores[player].totalScore;
                    
                    if (existingScore) {
                         const existingTotal = existingScore.shotsTaken + existingScore.putts + existingScore.penalties;
                         if (existingTotal !== newTotal) {
                             conflicts.push({
                                 player: player,
                                 cloudScore: existingTotal,
                                 localScore: newTotal
                             });
                         }
                    }
                }
            } catch (e) {
                console.warn("Error checking conflicts for", player, e);
            }
        }
        
        if (conflicts.length > 0) {
            setScoreConflicts(conflicts);
            setPendingScoresToSave(scores);
            setShowScoreModal(false);
            setShowConflictModal(true);
            setIsSaving(false);
            return; // Stop saving to wait for user resolution
        }
    }

    try {
        // 1. Process Main Player (Current View)
        const mainScore = scores[scorerDisplayName];
        if (mainScore) {
            const newScore: HoleScore = { 
                holeNumber: hole.number, 
                par: Number(activePar),
                shotsTaken: Math.max(0, mainScore.totalScore - mainScore.putts - mainScore.pens), 
                putts: mainScore.putts, 
                penalties: mainScore.pens 
            };
            const updatedScorecard = [...scorecard.filter(s => s.holeNumber !== hole.number), newScore];
            setScorecard(updatedScorecard);
        }

        // 2. Process All Players (Cloud Sync)
        if (tournamentId && isOnline) {
            const playerPromises = Object.keys(scores).map(playerName => {
                const s = scores[playerName];
                const holeData: HoleScore = {
                    holeNumber: hole.number,
                    par: Number(activePar),
                    shotsTaken: Math.max(0, s.totalScore - s.putts - s.pens),
                    putts: s.putts,
                    penalties: s.pens
                };
                // Submit hole score individually to avoid overwriting full round data blindly
                return CloudService.submitHoleScore(tournamentId, playerName, holeData, activeCourse.name);
            });
            await Promise.all(playerPromises);
        }

        setShowScoreModal(false);
        setShowConflictModal(false);
        setPendingScoresToSave(null);
        setScoreConflicts([]);
        
        if (currentHoleIdx < activeCourse.holes.length - 1) {
            loadHole(currentHoleIdx + 1);
        } else {
            // Re-construct final scorecard for main player to pass to finish
            const mainFinalScore = scores[scorerDisplayName];
            let finalCard = scorecard;
            if (mainFinalScore) {
                 const newScore: HoleScore = { 
                    holeNumber: hole.number, 
                    par: Number(activePar),
                    shotsTaken: Math.max(0, mainFinalScore.totalScore - mainFinalScore.putts - mainFinalScore.pens), 
                    putts: mainFinalScore.putts, 
                    penalties: mainFinalScore.pens 
                };
                finalCard = [...scorecard.filter(s => s.holeNumber !== hole.number), newScore];
            }
            finishRound(finalCard);
        }
    } catch (e) {
        console.error("Error saving score:", e);
        alert("Failed to save score. Check connection.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleResolveConflicts = (decisions: Record<string, 'local' | 'cloud'>) => {
      if (!pendingScoresToSave) return;
      
      const resolvedScores = { ...pendingScoresToSave };
      
      scoreConflicts.forEach(c => {
          if (decisions[c.player] === 'cloud') {
              // Fetch exact hole data from cloud or infer (Since we only stored total in conflict, we might need re-fetch or approximation)
              // For simplicity in this logic, we keep the LOCAL score logic but we assume the user corrected it in UI or we simply don't overwrite.
              // Actually, better: if user chose Cloud, we remove that player from the save list effectively, OR update local with cloud val.
              // Let's rely on re-fetching logic? No, too complex.
              // Simplest approach: if 'cloud' chosen, we just DON'T send the update for that player.
              delete resolvedScores[c.player];
          }
      });
      
      // Proceed to save remaining scores ignoring conflicts
      saveHoleScore(resolvedScores, true);
  };

  const openFullScorecard = async () => {
      setShowFullCard(true);
      if (tournamentId && isOnline && trackedPlayers.length > 0) {
          try {
              const promises = trackedPlayers.map(p => CloudService.getRound(tournamentId, p));
              const rounds = await Promise.all(promises);
              setGroupScorecards(rounds.filter(r => r !== null) as RoundHistory[]);
          } catch (e) {
              console.error("Failed to load group scores", e);
          }
      }
  };

  const loadHole = (idx: number) => {
    setCurrentHoleIdx(idx);
    const h = activeCourse.holes[idx];
    // Find active tee loc
    let teeLoc = h.tee;
    if (selectedTee && h.teeBoxes && h.teeBoxes.length > 0) {
        const match = h.teeBoxes.find(t => t.name === selectedTee.name) || h.teeBoxes[0];
        teeLoc = match.location;
    }
    
    setCurrentBallPos(teeLoc);
    if (!isReplay) {
        setShotNum(1); 
        setAimAngle(0);
    }
    setMeasureTarget(null); setIsMeasureMode(false); setIsNoteMode(false); setShowHoleSelect(false);
    setIsTrackingMode(false); setTrackingStartPos(null);
  };

  const finishRound = (finalScorecard?: HoleScore[]) => {
    // If scoring for another player, save under THEIR name
    const saveTarget = scorerDisplayName;
    if(!saveTarget) return;

    const cardToSave = finalScorecard || scorecard;
    const history = { 
        id: crypto.randomUUID(), 
        date: new Date().toLocaleString(), 
        courseName: activeCourse.name, 
        scorecard: cardToSave, 
        shots, 
        tournamentId,
        teeName: selectedTee?.name
    };
    
    // Save to local storage using the target player's name key
    StorageService.saveHistory(saveTarget, history);
    if (user) StorageService.clearTempState(user);
    
    if (isOnline) {
        CloudService.syncRound(saveTarget, history, tournamentId);
    }
    navigate('/summary', { state: { round: history } });
  };

  const toggleMeasureMode = () => {
      const newState = !isMeasureMode;
      setIsMeasureMode(newState);
      setIsNoteMode(false);
      if (newState) { 
        setAimAngle(0); 
        setMeasureTarget(predictedLanding); 
        setIsTrackingMode(false); 
      }
  };

  const handleWindCircleInteract = (e: any) => {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      const pos = e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
      const x = pos.x - rect.left - cx, y = pos.y - rect.top - cy;
      let angleDeg = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (angleDeg < 0) angleDeg += 360;
      setWindDir(Math.round((baseBearing + angleDeg) % 360));
  };

  const handleTeeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsTeePressing(true);
    teePressTimer.current = setTimeout(() => {
        if (liveLocation) {
            setCurrentBallPos(liveLocation);
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            setTeeButtonText("FROM GPS");
            setTimeout(() => setTeeButtonText("TEE OFF"), 2000);
        } else {
            alert("Waiting for GPS...");
        }
        teePressTimer.current = null;
        setIsTeePressing(false);
    }, 3000);
  };

  const handleTeeUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsTeePressing(false);
    if (teePressTimer.current) {
        clearTimeout(teePressTimer.current);
        teePressTimer.current = null;
        handleStartShot();
    }
  };

  const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="h-full relative bg-gray-900 flex flex-col overflow-hidden select-none touch-none" onContextMenu={(e) => e.preventDefault()}>
      
      {/* SCORER BANNER */}
      {isScorerMode && !isReplay && (
          <div className="absolute top-0 left-0 right-0 z-[1100] bg-orange-600 text-white text-[10px] font-bold py-1 text-center uppercase tracking-widest flex items-center justify-center gap-1 shadow-lg">
              <UserCircle size={10} /> Scoring for: {scorerDisplayName} {trackedPlayers.length > 1 && `+ ${trackedPlayers.length - 1} Others`}
          </div>
      )}

      <div className="absolute inset-0 z-0 bg-black w-full h-full overflow-hidden">
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '150vmax', height: '150vmax', transformOrigin: 'center center', transform: `translate(-50%, -50%) rotate(${mapRotation}deg)`, transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'transform' }}>
            <MapContainer key={`${activeCourse.id}-${currentHoleIdx}`} center={[activeTee.lat, activeTee.lng]} zoom={18} maxZoom={22} className="h-full w-full bg-black" zoomControl={false} attributionControl={false} dragging={false} doubleClickZoom={false}>
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={19} maxZoom={22} noWrap={true} />
              <RotatedMapHandler 
                rotation={mapRotation} 
                onLongPress={handleManualDrop} 
                onClick={handleMapClick}
              />
              <MapInitializer center={currentBallPos} isReplay={isReplay} pointsToFit={replayPoints} />
              {!isReplay && liveLocation && <Marker position={[liveLocation.lat, liveLocation.lng]} icon={userLocationIcon} zIndexOffset={1000} />}
              <Marker position={[greenCenter.lat, greenCenter.lng]} icon={flagIcon} />
              
              {/* Green Polygon */}
              {hole.greenGeo && hole.greenGeo.shape.length > 0 && (
                  <Polygon 
                      positions={hole.greenGeo.shape.map(p => [p.lat, p.lng])}
                      pathOptions={{ color: '#ffffff', weight: 1, fillOpacity: 0.1, dashArray: '4,4' }}
                      interactive={false}
                  />
              )}

              {annotations.map(note => {
                 const handlers = isNoteMode ? { click: () => activeTool === 'eraser' && deleteAnnotation(note.id) } : {};
                 if (note.type === 'path') return <Polyline key={note.id} positions={note.points.map(p => [p.lat, p.lng])} pathOptions={{ color: '#facc15', weight: 3, dashArray: '5,5', opacity: 0.8, className: 'pointer-events-none' }} interactive={true} eventHandlers={handlers} />;
                 if (note.type === 'text') return <Marker key={note.id} position={[note.points[0].lat, note.points[0].lng]} icon={createAnnotationTextIcon(note.text || "", -mapRotation)} eventHandlers={handlers} />;
                 if (note.type === 'icon') return <Marker key={note.id} position={[note.points[0].lat, note.points[0].lng]} icon={userFlagIcon} eventHandlers={handlers} />;
                 return null;
              })}
              {isNoteMode && drawingPoints.length > 0 && (
                  <>
                      {drawingPoints.map((p, i) => <Marker key={i} position={[p.lat, p.lng]} icon={measureTargetIcon} />)}
                      <Polyline positions={drawingPoints.map(p => [p.lat, p.lng])} pathOptions={{ color: '#facc15', weight: 2, dashArray: '2,4', className: 'pointer-events-none' }} interactive={false} />
                  </>
              )}
              {holeShots.map((s, i) => {
                  const arcPoints = MathUtils.getArcPoints(s.from, s.to).map(p => [p.lat, p.lng]);
                  const midLat = (s.from.lat + s.to.lat) / 2;
                  const midLng = (s.from.lng + s.to.lng) / 2;

                  return (
                      <Fragment key={i}>
                          {isReplay && s.plannedInfo && (
                            <>
                              <Polygon 
                                positions={MathUtils.getEllipsePoints(
                                    s.plannedInfo.target, 
                                    s.plannedInfo.dispersion.width, 
                                    s.plannedInfo.dispersion.depth, 
                                    s.plannedInfo.dispersion.rotation
                                ).map(p => [p.lat, p.lng] as [number, number])} 
                                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '2, 4', className: 'pointer-events-none' }} 
                                interactive={false}
                              />
                              <Polyline 
                                positions={[[s.from.lat, s.from.lng], [s.plannedInfo.target.lat, s.plannedInfo.target.lng]]} 
                                pathOptions={{ color: "#3b82f6", weight: 1, dashArray: "5, 5", opacity: 0.3, className: 'pointer-events-none' }} 
                                interactive={false}
                              />
                            </>
                          )}
                          <Marker position={[s.from.lat, s.from.lng]} icon={s.shotNumber === 1 ? startMarkerIcon : ballIcon} />
                          <Marker position={[s.to.lat, s.to.lng]} icon={ballIcon} />
                          <Polyline 
                              positions={[[s.from.lat, s.from.lng], [s.to.lat, s.to.lng]]} 
                              pathOptions={{ color: '#cbd5e1', weight: 4, opacity: 0.25, className: 'pointer-events-none' }} 
                              interactive={false}
                          />
                          <Polyline 
                              positions={arcPoints as any} 
                              pathOptions={{ color: 'black', weight: 5, opacity: 0.6, lineCap: 'round' }} 
                              interactive={false}
                          />
                          <Polyline 
                              positions={arcPoints as any} 
                              pathOptions={{ color: '#ffff00', weight: 3, opacity: 1, lineCap: 'round' }} 
                              interactive={false}
                          />
                          {isReplay ? <Marker position={[midLat, midLng]} icon={createReplayLabelIcon(`${s.clubUsed} - ${MathUtils.formatDistance(s.distance, useYards)}`, -mapRotation)} /> : <Marker position={[s.to.lat, s.to.lng]} icon={targetIcon} eventHandlers={{ contextmenu: (e) => { e.originalEvent.preventDefault(); setShotToDelete(s); }, click: (e) => { e.originalEvent.preventDefault(); setShotToDelete(s); } }} />}
                      </Fragment>
                  )
              })}
              {!isReplay && !isMeasureMode && !isNoteMode && !isTrackingMode && (
                  <>
                      <Marker position={[currentBallPos.lat, currentBallPos.lng]} icon={shotNum === 1 ? startMarkerIcon : ballIcon} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [predictedLanding.lat, predictedLanding.lng]]} pathOptions={{ color: "black", weight: 4, opacity: 0.3, className: 'pointer-events-none' }} interactive={false} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [predictedLanding.lat, predictedLanding.lng]]} pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "5, 5", className: 'pointer-events-none' }} interactive={false} />
                      <Polygon positions={ellipsePoints} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 1, className: 'pointer-events-none' }} interactive={false} />
                      <Marker position={[predictedLanding.lat, predictedLanding.lng]} icon={createArrowIcon(shotBearing)} interactive={false} />
                      <Polyline positions={guideLinePoints as any} pathOptions={{ color: "#fbbf24", weight: 2, dashArray: "4, 6", opacity: 0.8, className: 'pointer-events-none' }} interactive={false} />
                      <Marker position={[guideLabelPos.lat, guideLabelPos.lng]} icon={createDistanceLabelIcon(`Leaves ${MathUtils.formatDistance(distLandingToGreen, useYards)}`, -mapRotation)} interactive={false} />
                  </>
              )}
              {isTrackingMode && trackingStartPos && liveLocation && (
                  <>
                      <Marker position={[trackingStartPos.lat, trackingStartPos.lng]} icon={startMarkerIcon} />
                      <Polyline positions={[[trackingStartPos.lat, trackingStartPos.lng], [liveLocation.lat, liveLocation.lng]]} pathOptions={{ color: '#f97316', weight: 4, dashArray: '10, 10', opacity: 0.8 }} interactive={false} />
                  </>
              )}
              {!isReplay && isMeasureMode && activeMeasureTarget && (
                  <>
                      <Marker position={[currentBallPos.lat, currentBallPos.lng]} icon={draggableMeasureStartIcon} draggable={true} eventHandlers={{ dragend: (e) => setCurrentBallPos(e.target.getLatLng()) }} zIndexOffset={1000} />
                      <Marker position={[activeMeasureTarget.lat, activeMeasureTarget.lng]} icon={measureTargetIcon} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [activeMeasureTarget.lat, activeMeasureTarget.lng]]} pathOptions={{ color: "black", weight: 6, opacity: 0.3, className: 'pointer-events-none' }} interactive={false} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [activeMeasureTarget.lat, activeMeasureTarget.lng]]} pathOptions={{ color: "#60a5fa", weight: 3, opacity: 1, className: 'pointer-events-none' }} interactive={false} />
                      <Polyline positions={[[activeMeasureTarget.lat, activeMeasureTarget.lng], [greenCenter.lat, greenCenter.lng]]} pathOptions={{ color: "#ffffff", weight: 3, dashArray: "8, 8", opacity: 0.8, className: 'pointer-events-none' }} interactive={false} />
                      <Marker position={[labelPos1.lat, labelPos1.lng]} icon={createDistanceLabelIcon(MathUtils.formatDistance(measureDist1, useYards), -mapRotation, '#60a5fa')} interactive={false} />
                      <Marker position={[labelPos2.lat, labelPos2.lng]} icon={createDistanceLabelIcon(MathUtils.formatDistance(measureDist2, useYards), -mapRotation, '#ffffff')} interactive={false} />
                  </>
              )}
            </MapContainer>
        </div>
      </div>
      
      {/* ---------------- UI LAYERS ---------------- */}

      {/* TEE SELECTION MODAL */}
      {showTeeSelect && !isReplay && activeCourse.holes[0]?.teeBoxes?.length > 0 && (
          <ModalOverlay>
               <div className="p-6 text-center">
                   <h2 className="text-xl font-bold text-white mb-4">Select Tees</h2>
                   <div className="space-y-3">
                       {activeCourse.holes[0].teeBoxes.map(t => (
                           <button 
                               key={t.id}
                               onClick={() => { setSelectedTee(t); setShowTeeSelect(false); }}
                               className="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex items-center gap-4 border border-gray-700"
                           >
                               <div className="w-6 h-6 rounded border border-white/50 shadow-sm" style={{ backgroundColor: t.color }}></div>
                               <div className="text-left">
                                   <div className="font-bold text-white">{t.name}</div>
                                   <div className="text-xs text-gray-500">Par {t.par}</div>
                               </div>
                           </button>
                       ))}
                   </div>
                   <button onClick={() => setShowTeeSelect(false)} className="mt-4 text-gray-500 text-sm">
                       Use Default
                   </button>
               </div>
          </ModalOverlay>
      )}

      {/* TOP LEFT: MAIN HUD (Compact & Vertical Stack) */}
      {!isReplay && !isMeasureMode && (
          <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-4 z-[900] pointer-events-none animate-in slide-in-from-left-4 duration-300">
               <div className="pointer-events-auto bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-w-[90px] flex flex-col">
                   <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 bg-white/5 gap-2">
                       <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-white transition-colors">
                           <ChevronLeft size={14} />
                       </button>
                       <div className="flex flex-col items-center leading-none">
                           <span className="text-[9px] font-black text-white">H{hole.number}</span>
                           <span className="text-[7px] font-bold text-gray-500">P{activePar}</span>
                       </div>
                       <div className="flex items-center justify-end">
                           {gpsSignalLevel === 3 ? <SignalHigh size={12} className="text-green-500" /> : gpsSignalLevel === 0 ? <SignalLow size={12} className="text-red-500" /> : <SignalMedium size={12} className="text-yellow-500" />}
                       </div>
                   </div>

                   <div className="py-2 text-center flex flex-col items-center justify-center gap-0.5">
                        <div className="text-lg font-bold text-gray-400 leading-none">
                            {Math.round(useYards ? distToBack * 1.09361 : distToBack)}
                        </div>
                        <div className="text-5xl font-black text-white leading-none tracking-tighter drop-shadow-md my-0.5">
                            {MathUtils.formatDistance(distToGreen, useYards).replace(/[^0-9]/g, '')}
                        </div>
                        <div className="text-lg font-bold text-gray-400 leading-none">
                            {Math.round(useYards ? distToFront * 1.09361 : distToFront)}
                        </div>
                   </div>
                   
                   {/* Green Width Indicator (optional) */}
                   {hole.greenGeo && hole.greenGeo.shape.length > 0 && (
                       <div className="border-t border-white/10 py-1 text-center bg-gray-800/50">
                           <span className="text-[8px] text-gray-500 font-mono">
                               W:{Math.round(useYards ? MathUtils.calculateDistance(greenEdges.left, greenEdges.right)*1.09 : MathUtils.calculateDistance(greenEdges.left, greenEdges.right))}
                           </span>
                       </div>
                   )}

                   {windSpeed > 0 && (
                        <div className="border-t border-blue-500/20 bg-blue-900/10 py-1 text-center px-1">
                            <div className="text-[8px] font-bold text-blue-300 leading-none">
                                Plays {MathUtils.formatDistance(distToGreen + (distLandingToGreen - selectedClub.carry), useYards)}
                            </div>
                        </div>
                   )}
               </div>
          </div>
      )}

      {/* REPLAY HUD (Top Left) */}
      {isReplay && (
          <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-4 z-[900] flex flex-col gap-2 pointer-events-none animate-in slide-in-from-left-4 fade-in duration-300">
              <button 
                  onClick={() => navigate('/summary', { state: { round: replayRound } })}
                  className="pointer-events-auto self-start bg-black/40 hover:bg-black/60 backdrop-blur-md text-white w-9 h-9 rounded-full border border-white/10 flex items-center justify-center shadow-lg transition-all active:scale-95"
              >
                  <ChevronLeft size={20} className="text-white ml-[-1px]" />
              </button>

              {(() => {
                   const hScore = scorecard.find(h => h.holeNumber === hole.number);
                   if (!hScore) return null;
                   
                   const total = hScore.shotsTaken + hScore.putts + hScore.penalties;
                   const diff = total - activePar;
                   let scoreColor = 'text-white';
                   if (diff < 0) scoreColor = 'text-red-400';
                   else if (diff > 0) scoreColor = 'text-blue-400';

                   return (
                       <div className="pointer-events-auto bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden min-w-[80px]">
                           <div className="bg-white/5 px-2.5 py-1.5 flex items-center justify-between border-b border-white/5 gap-2">
                                <span className="text-xs font-black text-white">H{hole.number}</span>
                                <span className="text-[10px] font-bold text-gray-400">P{activePar}</span>
                           </div>
                           <div className="px-2 py-2 text-center">
                                <div className={`text-3xl font-black leading-none mb-1.5 ${scoreColor}`}>{total}</div>
                                <div className="flex justify-center items-center gap-2 text-[8px] font-bold text-gray-400 uppercase leading-none">
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span>Shot</span><span className="text-gray-200 text-[9px]">{hScore.shotsTaken}</span>
                                    </div>
                                    <div className="w-[1px] h-4 bg-white/10"></div>
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span>Putt</span><span className="text-gray-200 text-[9px]">{hScore.putts}</span>
                                    </div>
                                    {hScore.penalties > 0 && (
                                        <>
                                            <div className="w-[1px] h-4 bg-white/10"></div>
                                            <div className="flex flex-col items-center gap-0.5 text-red-400">
                                                <span>Pen</span><span className="text-[9px]">{hScore.penalties}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                           </div>
                       </div>
                   );
              })()}
          </div>
      )}

      {/* TOP RIGHT: TOOLS & MENU */}
      <div className="absolute top-[env(safe-area-inset-top)] right-0 p-4 z-[1000] pointer-events-none flex flex-col gap-3 items-end">
          <div className="pointer-events-auto flex flex-col gap-3 items-end">
             {!isReplay && !isMeasureMode && !isTrackingMode && (
                 <button 
                    onClick={() => setShowScoreModal(true)} 
                    className="w-11 h-11 bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-900/50 border border-white/20 active:scale-95 transition-transform"
                 >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Flag fill="currentColor" size={20} />}
                 </button>
             )}

             {!isReplay && (
                 <button onClick={toggleMenu} className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-lg transition-all active:scale-95 ${isMenuOpen ? 'bg-white text-black border-white' : 'bg-black/80 text-white border-white/10 backdrop-blur-md'}`}>
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                 </button>
             )}

             {isMenuOpen && !isReplay && (
                 <div className="flex flex-col gap-3 animate-in slide-in-from-top-4 fade-in duration-200 items-end">
                     {/* UNDO LAST SHOT BUTTON */}
                     <button onClick={handleUndoLastShot} className="flex items-center gap-2 bg-gray-800 text-red-300 px-4 py-2.5 rounded-full border border-red-900/50 shadow-xl backdrop-blur-md hover:bg-red-900/20 transition-colors">
                        <span className="text-xs font-bold mr-1">Undo Last</span>
                        <RotateCcw size={18} />
                     </button>

                     <button onClick={() => navigate('/settings/clubs', { state: { fromGame: true } })} className="flex items-center gap-2 bg-black/80 text-white px-4 py-2.5 rounded-full border border-white/10 shadow-xl backdrop-blur-md hover:bg-black transition-colors">
                        <span className="text-xs font-bold mr-1">Bag</span>
                        <GolfBagIcon size={18} />
                     </button>
                     <button onClick={() => setShowHoleSelect(true)} className="flex items-center gap-2 bg-black/80 text-white px-4 py-2.5 rounded-full border border-white/10 shadow-xl backdrop-blur-md hover:bg-black transition-colors">
                        <span className="text-xs font-bold mr-1">Grid</span>
                        <LayoutGrid size={18} />
                     </button>
                     <button onClick={openFullScorecard} className="flex items-center gap-2 bg-black/80 text-white px-4 py-2.5 rounded-full border border-white/10 shadow-xl backdrop-blur-md hover:bg-black transition-colors">
                        <span className="text-xs font-bold mr-1">Card</span>
                        <ListChecks size={18} />
                     </button>
                     <button onClick={() => { setIsNoteMode(!isNoteMode); setIsMenuOpen(false); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-xl backdrop-blur-md transition-colors ${isNoteMode ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-black/80 text-white border-white/10 hover:bg-black'}`}>
                        <span className="text-xs font-bold mr-1">Note</span>
                        <PenTool size={18} />
                     </button>
                     <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 bg-red-900/80 text-white px-4 py-2.5 rounded-full border border-red-700/50 shadow-xl backdrop-blur-md hover:bg-red-900 transition-colors mt-2">
                        <span className="text-xs font-bold mr-1">Exit</span>
                        <Home size={18} />
                     </button>
                 </div>
             )}

             <button onClick={() => setShowWind(!showWind)} className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-lg transition-all active:scale-95 ${showWind ? 'bg-blue-600 text-white border-blue-400' : 'bg-black/60 text-gray-300 border-white/5 backdrop-blur-md'}`}>
                <Wind size={20} />
             </button>
             <button onClick={toggleMeasureMode} className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-lg transition-all active:scale-95 ${isMeasureMode ? 'bg-blue-600 text-white border-blue-400' : 'bg-black/60 text-blue-400 border-white/5 backdrop-blur-md'}`}>
                <Ruler size={20} />
             </button>
          </div>
      </div>

      {isMeasureMode && (
         <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto bg-blue-600/90 backdrop-blur-xl px-6 py-3 rounded-2xl border border-blue-400/50 shadow-2xl text-center animate-in slide-in-from-top-4 w-64">
              <div className="flex items-center justify-between gap-4 text-white">
                  <div className="text-center">
                      <div className="text-[10px] opacity-80 font-bold uppercase">From You</div>
                      <div className="text-xl font-black">{MathUtils.formatDistance(measureDist1, useYards)}</div>
                  </div>
                  <div className="h-8 w-[1px] bg-blue-400/50"></div>
                  <div className="text-center">
                      <div className="text-[10px] opacity-80 font-bold uppercase">To Pin</div>
                      <div className="text-xl font-black">{MathUtils.formatDistance(measureDist2, useYards)}</div>
                  </div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-500/50 flex justify-between gap-2">
                  <button onClick={handleMeasureGPS} className="flex-1 bg-blue-700 hover:bg-blue-800 rounded px-2 py-1.5 text-[10px] font-bold uppercase flex items-center justify-center gap-1 transition-colors">
                      <MapPin size={10} /> Snap Me
                  </button>
                  <button onClick={toggleMeasureMode} className="flex-1 bg-blue-800 hover:bg-blue-900 rounded px-2 py-1.5 text-[10px] font-bold uppercase transition-colors">
                      Done
                  </button>
              </div>
         </div>
      )}

      {/* ... (Bottom UI and Modals remain same, using activePar for score calculations) ... */}
      {!isReplay && isNoteMode && (
          <div className="absolute bottom-0 w-full z-30 pt-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-md border-t border-white/10 animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-2">
                 <button onClick={() => setActiveTool('text')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTool === 'text' ? 'bg-yellow-600 text-white' : 'text-gray-400'}`}>
                    <Type size={20} /> <span className="text-[10px] font-bold">Text</span>
                 </button>
                 <button onClick={() => setActiveTool('pin')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTool === 'pin' ? 'bg-yellow-600 text-white' : 'text-gray-400'}`}>
                    <MapPin size={20} /> <span className="text-[10px] font-bold">Pin</span>
                 </button>
                 <button onClick={() => setActiveTool('draw')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTool === 'draw' ? 'bg-yellow-600 text-white' : 'text-gray-400'}`}>
                    <Highlighter size={20} /> <span className="text-[10px] font-bold">Draw</span>
                 </button>
                 <button onClick={() => setActiveTool('eraser')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTool === 'eraser' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>
                    <Eraser size={20} /> <span className="text-[10px] font-bold">Eraser</span>
                 </button>
                 <button onClick={() => setIsNoteMode(false)} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-500">
                    <X size={20} /> <span className="text-[10px] font-bold">Close</span>
                 </button>
              </div>
              
              {activeTool === 'draw' && drawingPoints.length > 0 && (
                  <div className="flex gap-2 mt-2">
                      <button onClick={() => setDrawingPoints([])} className="flex-1 bg-gray-700 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2"><Trash2 size={12}/> Clear</button>
                      <button onClick={saveDrawing} className="flex-1 bg-green-600 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2"><Check size={12}/> Save Line</button>
                  </div>
              )}
          </div>
      )}

      {isReplay && (
        <div className="absolute bottom-0 w-full z-30 pt-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-between items-center bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
            <button 
                onClick={() => loadHole(Math.max(0, currentHoleIdx - 1))}
                disabled={currentHoleIdx === 0}
                className="pointer-events-auto bg-gray-800/80 p-4 rounded-2xl text-white disabled:opacity-20 flex items-center gap-2 border border-white/5 active:scale-95 transition-all shadow-xl"
            >
                <ArrowLeft size={20}/> <span className="font-bold text-xs uppercase tracking-widest">Prev</span>
            </button>
            <button 
                onClick={() => loadHole(Math.min(activeCourse.holes.length - 1, currentHoleIdx + 1))}
                disabled={currentHoleIdx === activeCourse.holes.length - 1}
                className="pointer-events-auto bg-gray-800/80 p-4 rounded-2xl text-white disabled:opacity-20 flex items-center gap-2 border border-white/5 active:scale-95 transition-all shadow-xl"
            >
                <span className="font-bold text-xs uppercase tracking-widest">Next</span> <ArrowRight size={20}/>
            </button>
        </div>
      )}

      {!isReplay && !isNoteMode && (
        <div className="absolute bottom-0 w-full z-30 pt-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-none">
            {isTrackingMode ? (
                 <div className="flex gap-3 h-20 items-stretch mb-2 pointer-events-auto">
                    <div className="flex-1 bg-orange-900/80 rounded-2xl border border-orange-500/40 flex items-center justify-between px-6 backdrop-blur-md">
                        <div>
                            <div className="text-[10px] text-orange-200 uppercase font-bold tracking-widest mb-1 opacity-80 animate-pulse">Live Driving Distance</div>
                            <div className="text-4xl font-black text-white leading-none tracking-tighter">
                                {MathUtils.formatDistance(drivingDist, useYards)}
                            </div>
                        </div>
                        <Footprints className="text-orange-400 opacity-50" size={32} />
                    </div>
                    <button onClick={handleFinishTracking} className="w-24 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-orange-900/50 active:scale-95 transition-all">
                        <MapPin size={24} fill="currentColor" />
                        <span className="text-[10px] font-bold mt-1">AT BALL</span>
                    </button>
                 </div>
            ) : isMeasureMode ? (
                 <div className="h-4"></div>
            ) : (
                <div className="pointer-events-auto">
                    <div className="flex items-center gap-3 mb-3 bg-gray-900/90 backdrop-blur-md p-2 rounded-xl border border-white/5"><div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider pl-1">Shot {shotNum}</div><div className="flex items-center gap-2 flex-1"><span className="text-[10px] font-bold text-gray-500">AIM</span><input type="range" min="-45" max="45" value={aimAngle} onChange={(e) => setAimAngle(parseInt(e.target.value))} className="flex-1 accent-white h-1 bg-gray-700 rounded-lg appearance-none" /><span className="text-[10px] font-bold text-gray-300 w-6 text-right">{aimAngle}°</span></div></div>
                    <div className="flex gap-3 h-16 items-stretch"><div className="flex-1 relative bg-gray-900 rounded-2xl border border-white/5 overflow-hidden flex"><div className="absolute inset-0 z-10 opacity-0"><ClubSelector clubs={bag} selectedClub={selectedClub} onSelect={setSelectedClub} useYards={useYards} /></div><div className="flex-1 flex flex-col justify-center pl-4 pr-1 border-r border-white/5 pointer-events-none"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Club</span><div className="text-xl font-bold text-white truncate leading-none">{selectedClub.name}</div><div className="text-[10px] text-gray-500 mt-1">{MathUtils.formatDistance(useYards ? selectedClub.carry * 1.09361 : selectedClub.carry, useYards)}</div></div><div className="flex-1 flex flex-col justify-center items-end pr-4 pl-1 pointer-events-none bg-gray-800/30"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Leaves</span><div className="text-xl font-bold text-white leading-none">{MathUtils.formatDistance(distLandingToGreen, useYards)}</div><div className="text-[10px] text-gray-500 mt-1 text-right truncate w-full"><span className="text-white font-medium">{nextClubSuggestion}</span></div></div></div>
                    
                    {shotNum === 1 ? (
                           <button 
                                onPointerDown={handleTeeDown}
                                onPointerUp={handleTeeUp}
                                onPointerLeave={handleTeeUp}
                                className={`w-20 relative overflow-hidden transition-all duration-200 rounded-2xl border flex flex-col items-center justify-center shadow-lg ${isTeePressing ? 'bg-blue-800 border-blue-600 scale-95' : 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 hover:brightness-110'}`}
                           >
                                {teeButtonText === "TEE OFF" ? (
                                   <Rocket className="text-white mb-1" size={24} strokeWidth={1.5} />
                                ) : (
                                   <Satellite className="text-white mb-1 animate-pulse" size={24} strokeWidth={1.5} />
                                )}
                                <span className="text-white font-bold text-[9px] uppercase tracking-wider">{teeButtonText}</span>
                                {isTeePressing && (
                                    <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                                        <div className="h-full bg-white animate-[width_3s_linear_forwards] w-0"></div>
                                    </div>
                                )}
                           </button>
                       ) : (
                          <div className="flex flex-col gap-1.5 h-full">
                            <button onClick={handleStartShot} className="flex-1 w-16 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                                 <PlayCircle size={20} fill="currentColor" className="text-white" />
                                 <span className="text-[10px] font-bold ml-1">HIT</span>
                            </button>
                            <button onClick={initiateGPSShot} className="h-6 w-16 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center justify-center border border-gray-600">
                                 <MapPin size={12} />
                                 <span className="text-[8px] font-bold ml-1">MARK</span>
                            </button>
                          </div>
                       )}
                    </div>
                </div>
            )}
        </div>
      )}

      {showHoleSelect && <HoleSelectorModal holes={activeCourse.holes} currentIdx={currentHoleIdx} onSelect={loadHole} onClose={() => setShowHoleSelect(false)} />}
      
      {showScoreModal && (
          <ScoreModal 
            par={activePar} 
            holeNum={hole.number} 
            recordedShots={Math.max(0, shotNum - 1)} 
            currentPlayer={scorerDisplayName} 
            players={trackedPlayers} 
            onSave={(scores) => saveHoleScore(scores)} 
            onClose={() => setShowScoreModal(false)} 
          />
      )}
      
      {showConflictModal && pendingScoresToSave && (
          <ScoreConflictModal 
             conflicts={scoreConflicts}
             onResolve={handleResolveConflicts}
             onCancel={() => { 
                 setShowConflictModal(false); 
                 setIsSaving(false); 
                 setPendingScoresToSave(null); 
                 setShowScoreModal(true); // Re-open score modal
             }}
          />
      )}

      {showFullCard && (
          <FullScorecardModal 
            holes={activeCourse.holes} 
            groupScorecards={groupScorecards}
            scorecard={scorecard} 
            onFinishRound={() => finishRound()} 
            onClose={() => setShowFullCard(false)} 
          />
      )}
      
      {pendingShot && <ShotConfirmModal dist={MathUtils.formatDistance(pendingShot.dist, useYards)} club={selectedClub} clubs={bag} isGPS={pendingShot.isGPS} isLongDistWarning={pendingShot.dist > 500} onChangeClub={setSelectedClub} onConfirm={confirmShot} onCancel={() => setPendingShot(null)} />}
      
      {shotToDelete && (
        <ModalOverlay onClose={() => setShotToDelete(null)}>
            <div className="p-4 bg-gray-900 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">Manage Shot {shotToDelete.shotNumber}</h3>
            </div>
            <div className="p-6 text-center">
                <div className="mb-6">
                    <div className="text-4xl font-black text-white">{MathUtils.formatDistance(shotToDelete.distance, useYards)}</div>
                    <div className="text-gray-400 text-sm mt-1">{shotToDelete.clubUsed}</div>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                    Do you want to remove this shot? <br/>
                    <span className="text-xs text-gray-500">(Deleting the last shot allows you to re-place it.)</span>
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setShotToDelete(null)} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl border border-gray-700">
                        Cancel
                    </button>
                    <button onClick={handleDeleteShot} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg">
                        Delete / Undo
                    </button>
                </div>
            </div>
        </ModalOverlay>
      )}

      {showTextInput && (
        <ModalOverlay onClose={() => setShowTextInput(null)}>
            <div className="p-4 bg-gray-900 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">Add Note</h3>
            </div>
            <div className="p-4">
                <input 
                    autoFocus
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white mb-4 outline-none focus:border-yellow-500"
                    placeholder="Enter text..."
                    value={textInputValue}
                    onChange={(e) => setTextInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveTextNote()}
                />
                <div className="flex gap-3">
                    <button onClick={() => setShowTextInput(null)} className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-bold">Cancel</button>
                    <button onClick={saveTextNote} className="flex-1 bg-yellow-600 text-white py-3 rounded-xl font-bold">Save</button>
                </div>
            </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default PlayRound;
