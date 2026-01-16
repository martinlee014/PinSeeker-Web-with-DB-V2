import React, { useState, useEffect, useContext, useMemo, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AppContext } from '../App';
import { DUVENHOF_COURSE } from '../constants';
import * as MathUtils from '../services/mathUtils';
import { ShotRecord, RoundHistory, LatLng, GolfCourse, MapAnnotation } from '../types';
import { Flag, Wind, ChevronLeft, Grid, ListChecks, ArrowLeft, ArrowRight, ChevronDown, MapPin, Ruler, Trash2, PenTool, Type, Highlighter, X, Check, Eraser, Home, Signal, SignalHigh, SignalLow, SignalMedium, Footprints, PlayCircle, RotateCcw, Rocket, Satellite, Menu, MoreVertical, LayoutGrid, Loader2, UserCircle } from 'lucide-react';
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

type AnnotationTool = 'text' | 'pin' | 'draw' | 'eraser';

const GolfBagIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4h10" />
        <path d="M8 4V2h8v2" />
        <path d="M4 8h16l-2 14H6L4 8z" />
        <path d="M10 8v14" />
        <path d="M14 8v14" />
        <path d="M8 12h8" />
    </svg>
);

const RotatedMapHandler = ({ onLongPress, onClick }: { onLongPress: (latlng: any) => void, onClick: (latlng: any) => void }) => {
  useMapEvents({
      click: (e) => {
          onClick(e.latlng);
      },
      contextmenu: (e) => {
          onLongPress(e.latlng);
      }
  });
  return null;
};

const MapInitializer = ({ center, isReplay, pointsToFit }: { center: LatLng, isReplay: boolean, pointsToFit: LatLng[] }) => {
    const map = useMap();
    useEffect(() => {
        if (isReplay && pointsToFit.length > 0) {
            const bounds = L.latLngBounds(pointsToFit.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
            map.setView([center.lat, center.lng], 18);
        }
    }, [center, isReplay, pointsToFit, map]);
    return null;
};

const PlayRound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, useYards } = useContext(AppContext);

  // Determine mode
  const replayRound = location.state?.round as RoundHistory | undefined;
  const isReplay = !!replayRound;
  const isScorerMode = !!location.state?.playerOverride;
  const activePlayerName = location.state?.playerOverride || user || 'Guest';

  // Game State
  const activeCourse: GolfCourse = location.state?.course || DUVENHOF_COURSE;
  const [currentHoleIdx, setCurrentHoleIdx] = useState(location.state?.initialHoleIndex || 0);
  const [shotNum, setShotNum] = useState(1);
  const [currentBallPos, setCurrentBallPos] = useState<LatLng>({ lat: 0, lng: 0 });
  const [shots, setShots] = useState<ShotRecord[]>([]);

  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [liveLocation, setLiveLocation] = useState<LatLng | null>(null);
  
  // Tools State
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('draw');
  const [annotations, setAnnotations] = useState<MapAnnotation[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<LatLng[]>([]);
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [activeMeasureTarget, setActiveMeasureTarget] = useState<LatLng | null>(null);
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  const [trackingStartPos, setTrackingStartPos] = useState<LatLng | null>(null);
  const [shotToDelete, setShotToDelete] = useState<ShotRecord | null>(null);

  // Derived Data
  const hole = activeCourse.holes[currentHoleIdx];
  const activeTee = hole.teeBoxes?.[0]?.location || hole.tee;
  const greenCenter = hole.greenGeo?.center || hole.green;

  // Initialize Position
  useEffect(() => {
      if (!isReplay && activeTee) {
          setCurrentBallPos(activeTee);
      }
  }, [activeTee, isReplay]);

  // Live Location Watcher
  useEffect(() => {
      if (navigator.geolocation && !isReplay) {
          const id = navigator.geolocation.watchPosition(
              (pos) => setLiveLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              (err) => console.error(err),
              { enableHighAccuracy: true }
          );
          return () => navigator.geolocation.clearWatch(id);
      }
  }, [isReplay]);

  // Calculations
  const mapRotation = useMemo(() => MathUtils.calculateBearing(activeTee, greenCenter), [activeTee, greenCenter]);
  
  const holeShots = isReplay 
    ? (replayRound?.shots || []).filter(s => s.holeNumber === hole.number) 
    : shots.filter(s => s.holeNumber === hole.number);

  const replayPoints = isReplay ? holeShots.map(s => s.from) : [];

  // Prediction Visualization (Stubbed for now)
  const predictedLanding = useMemo(() => MathUtils.calculateDestination(currentBallPos, 200, mapRotation), [currentBallPos, mapRotation]);
  const shotBearing = mapRotation;
  const ellipsePoints: LatLng[] = useMemo(() => MathUtils.getEllipsePoints(predictedLanding, 15, 25, mapRotation), [predictedLanding, mapRotation]);
  const guideLinePoints: LatLng[] = [currentBallPos, predictedLanding];
  const guideLabelPos = MathUtils.calculateDestination(currentBallPos, 100, mapRotation);
  const distLandingToGreen = MathUtils.calculateDistance(predictedLanding, greenCenter);

  // Measure Mode Calculations
  const measureDist1 = activeMeasureTarget ? MathUtils.calculateDistance(currentBallPos, activeMeasureTarget) : 0;
  const measureDist2 = activeMeasureTarget ? MathUtils.calculateDistance(activeMeasureTarget, greenCenter) : 0;
  const labelPos1 = activeMeasureTarget ? MathUtils.calculateDestination(currentBallPos, measureDist1 / 2, MathUtils.calculateBearing(currentBallPos, activeMeasureTarget)) : { lat: 0, lng: 0 };
  const labelPos2 = activeMeasureTarget ? MathUtils.calculateDestination(activeMeasureTarget, measureDist2 / 2, MathUtils.calculateBearing(activeMeasureTarget, greenCenter)) : { lat: 0, lng: 0 };

  // Handlers
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMapClick = (latlng: LatLng) => {
      if (isNoteMode) {
          if (activeTool === 'draw') {
              setDrawingPoints(prev => [...prev, latlng]);
          } else if (activeTool === 'pin') {
              const newNote: MapAnnotation = {
                  id: crypto.randomUUID(),
                  courseId: activeCourse.id,
                  holeNumber: hole.number,
                  type: 'icon',
                  points: [latlng]
              };
              setAnnotations(prev => [...prev, newNote]);
          } else if (activeTool === 'text') {
              const text = prompt("Enter annotation text:");
              if (text) {
                  const newNote: MapAnnotation = {
                      id: crypto.randomUUID(),
                      courseId: activeCourse.id,
                      holeNumber: hole.number,
                      type: 'text',
                      text,
                      points: [latlng]
                  };
                  setAnnotations(prev => [...prev, newNote]);
              }
          }
      } else if (isMeasureMode) {
          setActiveMeasureTarget(latlng);
      }
  };

  const handleManualDrop = (latlng: LatLng) => {
      if (!isReplay) {
          setCurrentBallPos(latlng);
      }
  };

  const deleteAnnotation = (id: string) => {
      setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="h-full relative bg-gray-900 flex flex-col overflow-hidden select-none touch-none" onContextMenu={(e) => e.preventDefault()}>
      
      {/* SCORER BANNER */}
      {isScorerMode && !isReplay && (
          <div className="absolute top-0 left-0 right-0 z-[1100] bg-orange-600 text-white text-[10px] font-bold py-1 text-center uppercase tracking-widest flex items-center justify-center gap-1 shadow-lg">
              <UserCircle size={10} /> Scoring for: {activePlayerName}
          </div>
      )}

      <div className="absolute inset-0 z-0 bg-black w-full h-full overflow-hidden">
        {/* ROTATION FIX: Using negative mapRotation to ensure Bearing (Green) is at Top (0 deg) */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '150vmax', height: '150vmax', transformOrigin: 'center center', transform: `translate(-50%, -50%) rotate(${-mapRotation}deg)`, transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'transform' }}>
            <MapContainer key={`${activeCourse.id}-${currentHoleIdx}`} center={[activeTee.lat, activeTee.lng]} zoom={18} maxZoom={22} className="h-full w-full bg-black" zoomControl={false} attributionControl={false} dragging={false} doubleClickZoom={false}>
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={19} maxZoom={22} noWrap={true} />
              <RotatedMapHandler 
                onLongPress={handleManualDrop} 
                onClick={handleMapClick}
              />
              <MapInitializer center={currentBallPos} isReplay={isReplay} pointsToFit={replayPoints} />
              {!isReplay && liveLocation && <Marker position={[liveLocation.lat, liveLocation.lng]} icon={userLocationIcon} zIndexOffset={1000} />}
              <Marker position={[greenCenter.lat, greenCenter.lng]} icon={flagIcon} />
              
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
                 {/* ICON ROTATION FIX: Pass positive mapRotation to counteract negative container rotation */}
                 if (note.type === 'text') return <Marker key={note.id} position={[note.points[0].lat, note.points[0].lng]} icon={createAnnotationTextIcon(note.text || "", mapRotation)} eventHandlers={handlers} />;
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
                          {isReplay ? <Marker position={[midLat, midLng]} icon={createReplayLabelIcon(`${s.clubUsed} - ${MathUtils.formatDistance(s.distance, useYards)}`, mapRotation)} /> : <Marker position={[s.to.lat, s.to.lng]} icon={targetIcon} eventHandlers={{ contextmenu: (e) => { e.originalEvent.preventDefault(); setShotToDelete(s); }, click: (e) => { e.originalEvent.preventDefault(); setShotToDelete(s); } }} />}
                      </Fragment>
                  )
              })}
              {!isReplay && !isMeasureMode && !isNoteMode && !isTrackingMode && (
                  <>
                      <Marker position={[currentBallPos.lat, currentBallPos.lng]} icon={shotNum === 1 ? startMarkerIcon : ballIcon} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [predictedLanding.lat, predictedLanding.lng]]} pathOptions={{ color: "black", weight: 4, opacity: 0.3, className: 'pointer-events-none' }} interactive={false} />
                      <Polyline positions={[[currentBallPos.lat, currentBallPos.lng], [predictedLanding.lat, predictedLanding.lng]]} pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "5, 5", className: 'pointer-events-none' }} interactive={false} />
                      <Polygon positions={ellipsePoints.map(p => [p.lat, p.lng])} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 1, className: 'pointer-events-none' }} interactive={false} />
                      <Marker position={[predictedLanding.lat, predictedLanding.lng]} icon={createArrowIcon(shotBearing)} interactive={false} />
                      <Polyline positions={guideLinePoints.map(p => [p.lat, p.lng])} pathOptions={{ color: "#fbbf24", weight: 2, dashArray: "4, 6", opacity: 0.8, className: 'pointer-events-none' }} interactive={false} />
                      <Marker position={[guideLabelPos.lat, guideLabelPos.lng]} icon={createDistanceLabelIcon(`Leaves ${MathUtils.formatDistance(distLandingToGreen, useYards)}`, mapRotation)} interactive={false} />
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
                      <Marker position={[labelPos1.lat, labelPos1.lng]} icon={createDistanceLabelIcon(MathUtils.formatDistance(measureDist1, useYards), mapRotation, '#60a5fa')} interactive={false} />
                      <Marker position={[labelPos2.lat, labelPos2.lng]} icon={createDistanceLabelIcon(MathUtils.formatDistance(measureDist2, useYards), mapRotation, '#ffffff')} interactive={false} />
                  </>
              )}
            </MapContainer>
        </div>
      </div>

      {/* UI Overlays would go here but are simplified for this repair to match file structure */}
      <button 
        onClick={toggleMenu} 
        className="absolute bottom-6 left-6 z-[1200] bg-gray-900 text-white p-4 rounded-full shadow-lg border border-gray-700"
      >
        <Menu size={24} />
      </button>

      {isMenuOpen && (
          <div className="absolute inset-0 z-[2000] bg-black/80 flex flex-col items-center justify-center space-y-4">
              <h2 className="text-white font-bold text-2xl">Menu</h2>
              <button onClick={() => navigate('/dashboard')} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">Quit Round</button>
              <button onClick={toggleMenu} className="text-gray-400 mt-4">Close</button>
          </div>
      )}
    </div>
  );
};

export default PlayRound;