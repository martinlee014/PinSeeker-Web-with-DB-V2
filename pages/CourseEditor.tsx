
import { useState, useContext, Fragment, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { GoogleGenAI, Type } from "@google/genai";
import { AppContext } from '../App';
import { StorageService } from '../services/storage';
import * as MathUtils from '../services/mathUtils';
import { GolfCourse, GolfHole, TeeBox, LatLng } from '../types';
import { COUNTRIES } from '../constants';
import { ChevronLeft, Save, MapPin, Target, Search, Loader2, ArrowLeft, ArrowRight, X, Edit3, Trash2, Plus, Flag, Check, Hash } from 'lucide-react';
import { ModalOverlay } from '../components/Modals';

// --- Icons Configuration ---
const flagIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const createTeeIcon = (color: string) => new L.DivIcon({
  className: 'custom-tee-icon',
  html: `<div style="width: 14px; height: 14px; background-color: ${color}; border-radius: 2px; border: 2px solid white; box-shadow: 0 0 4px black;"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7]
});

const pointIcon = new L.DivIcon({
  className: 'green-point',
  html: `<div style="width: 8px; height: 8px; background-color: white; border-radius: 50%; border: 1px solid black; opacity: 0.8;"></div>`,
  iconSize: [8, 8], iconAnchor: [4, 4]
});

const CourseEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { useYards } = useContext(AppContext);
  const existingCourse = location.state?.course as GolfCourse | undefined;

  const [step, setStep] = useState<'info' | 'map'>('info');
  const [courseName, setCourseName] = useState(existingCourse?.name || '');
  const [country, setCountry] = useState(existingCourse?.country || '');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.9042, 116.4074]);

  // Editor State
  const [holes, setHoles] = useState<GolfHole[]>(existingCourse?.holes || Array.from({ length: 18 }, (_, i) => ({
      number: i + 1, 
      par: 4, 
      tee: { lat: 0, lng: 0 }, 
      green: { lat: 0, lng: 0 },
      teeBoxes: [],
      greenGeo: { center: { lat: 0, lng: 0 }, shape: [] }
  })));
  
  const [currentHoleIdx, setCurrentHoleIdx] = useState(0);
  
  // Modes: 'none' | 'add_tee' | 'edit_tee_loc' | 'draw_green'
  const [editMode, setEditMode] = useState<string>('none'); 
  const [selectedTeeId, setSelectedTeeId] = useState<string | null>(null);
  
  // Hole Completion Modal State
  const [showHoleDetails, setShowHoleDetails] = useState(false);
  const [pendingPar, setPendingPar] = useState(4);
  const [pendingSi, setPendingSi] = useState(18);

  // Available Tee Colors
  const TEE_PRESETS = [
    { name: "Black", color: "#000000" },
    { name: "Blue", color: "#1e3a8a" },
    { name: "White", color: "#ffffff" },
    { name: "Yellow", color: "#facc15" },
    { name: "Red", color: "#ef4444" }
  ];

  useEffect(() => {
    // Migration for legacy courses
    if (existingCourse) {
        setHoles(existingCourse.holes.map(h => ({
            ...h,
            teeBoxes: h.teeBoxes || (h.tee.lat !== 0 ? [{
                id: crypto.randomUUID(),
                name: 'Standard',
                color: '#ffffff',
                location: h.tee,
                par: h.par,
                strokeIndex: h.number
            }] : []),
            greenGeo: h.greenGeo || {
                center: h.green,
                shape: [] 
            }
        })));
    }
  }, [existingCourse]);

  const currentHole = holes[currentHoleIdx];

  // Calculate smooth polygon path dynamically
  const smoothGreenPath = useMemo(() => {
      if (!currentHole.greenGeo || currentHole.greenGeo.shape.length < 3) return [];
      return MathUtils.getSmoothClosedPath(currentHole.greenGeo.shape);
  }, [currentHole.greenGeo]);

  const handleSearch = async () => {
    if (!courseName.trim()) return;
    setIsSearching(true);

    try {
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find the precise coordinates for golf course: ${courseName} ${country}`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              found: { type: Type.BOOLEAN }
            }
          }
        },
      });

      const res = JSON.parse(response.text || '{}');
      if (res.found && res.lat && res.lng) {
        setMapCenter([res.lat, res.lng]);
        setStep('map');
      } else {
        alert("Could not find precise coordinates. Try adding city/country.");
      }
    } catch (e: any) {
      console.error("AI Search Error:", e);
      alert("Search sync failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    // Map data back to legacy format for compatibility if needed, 
    // but primarily save new structure
    const processedHoles = holes.map(h => ({
        ...h,
        // Ensure legacy fields are populated from best available data
        tee: h.teeBoxes[0]?.location || { lat: 0, lng: 0 },
        green: h.greenGeo?.center || { lat: 0, lng: 0 },
        par: h.teeBoxes[0]?.par || 4
    }));

    const newCourse: GolfCourse = {
      id: existingCourse?.id || crypto.randomUUID(),
      name: courseName,
      country: country || undefined,
      holes: processedHoles,
      isCustom: true
    };
    StorageService.saveCustomCourse(newCourse);
    navigate('/settings/courses');
  };

  // --- Map Interaction Logic ---
  const handleMapClick = (lat: number, lng: number) => {
    const newHoles = [...holes];
    const h = newHoles[currentHoleIdx];

    if (editMode === 'edit_tee_loc' && selectedTeeId) {
        const teeIdx = h.teeBoxes.findIndex(t => t.id === selectedTeeId);
        if (teeIdx >= 0) {
            h.teeBoxes[teeIdx].location = { lat, lng };
            setHoles(newHoles);
            setEditMode('none');
        }
    } else if (editMode === 'draw_green') {
        if (!h.greenGeo) h.greenGeo = { center: {lat, lng}, shape: [] };
        h.greenGeo.shape.push({ lat, lng });
        
        // Recalculate center based on average
        const latSum = h.greenGeo.shape.reduce((acc, p) => acc + p.lat, 0);
        const lngSum = h.greenGeo.shape.reduce((acc, p) => acc + p.lng, 0);
        h.greenGeo.center = {
            lat: latSum / h.greenGeo.shape.length,
            lng: lngSum / h.greenGeo.shape.length
        };
        
        setHoles(newHoles);
    }
  };

  const addTeeBox = (preset: typeof TEE_PRESETS[0]) => {
      const newHoles = [...holes];
      const h = newHoles[currentHoleIdx];
      const newTee: TeeBox = {
          id: crypto.randomUUID(),
          name: preset.name,
          color: preset.color,
          location: { lat: 0, lng: 0 }, // Requires placement
          par: h.teeBoxes[0]?.par || 4,
          strokeIndex: h.number
      };
      h.teeBoxes.push(newTee);
      setHoles(newHoles);
      setSelectedTeeId(newTee.id);
      setEditMode('edit_tee_loc');
  };

  const deleteTeeBox = (id: string) => {
      const newHoles = [...holes];
      newHoles[currentHoleIdx].teeBoxes = newHoles[currentHoleIdx].teeBoxes.filter(t => t.id !== id);
      setHoles(newHoles);
  };

  const updateTeeData = (id: string, field: 'par' | 'si', val: number) => {
      const newHoles = [...holes];
      const t = newHoles[currentHoleIdx].teeBoxes.find(t => t.id === id);
      if (t) {
          if (field === 'par') t.par = val;
          if (field === 'si') t.strokeIndex = val;
      }
      setHoles(newHoles);
  };

  const clearGreen = () => {
      const newHoles = [...holes];
      if (newHoles[currentHoleIdx].greenGeo) {
          newHoles[currentHoleIdx].greenGeo!.shape = [];
      }
      setHoles(newHoles);
      setEditMode('draw_green');
  };

  const handleFinishGreen = () => {
      // Pre-fill modal with existing or logical defaults
      const existingPar = currentHole.teeBoxes[0]?.par || 4;
      const existingSi = currentHole.teeBoxes[0]?.strokeIndex || currentHole.number;
      setPendingPar(existingPar);
      setPendingSi(existingSi);
      setShowHoleDetails(true);
  };

  const handleSaveHoleDetails = () => {
      const newHoles = [...holes];
      const h = newHoles[currentHoleIdx];
      
      // Update core par (fallback)
      h.par = pendingPar;

      // Update ALL existing tee boxes with these stats (simplified editor flow)
      // In a more complex editor, we might edit each tee separately, but this is faster
      if (h.teeBoxes.length > 0) {
          h.teeBoxes.forEach(t => {
              t.par = pendingPar;
              t.strokeIndex = pendingSi;
          });
      } else {
          // If no tees exist yet, add a default White tee at the center of map (or 0,0 to be placed later)
          // Actually, let's just update properties so when tees are added they inherit this
      }

      setHoles(newHoles);
      setShowHoleDetails(false);
      setEditMode('none');

      // Auto-advance
      if (currentHoleIdx < 17) {
          setCurrentHoleIdx(currentHoleIdx + 1);
          // Optional: move map to estimated next tee location? 
          // For now, keep map center where it is or let user pan
      } else {
          alert("Course annotation complete! Review details and save.");
      }
  };

  if (step === 'info') {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-lg"><ChevronLeft /></button>
          <h1 className="text-2xl font-bold">Course Info</h1>
        </div>
        <div className="space-y-4">
          <input 
            className="w-full bg-gray-800 p-4 rounded-xl border border-gray-700 outline-none focus:border-green-500"
            placeholder="Course Name" value={courseName} onChange={e => setCourseName(e.target.value)}
          />
          <select 
            className="w-full bg-gray-800 p-4 rounded-xl border border-gray-700 outline-none"
            value={country} onChange={e => setCountry(e.target.value)}
          >
            <option value="">Select Country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button 
            onClick={handleSearch} disabled={isSearching}
            className="w-full bg-blue-600 p-4 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {isSearching ? <Loader2 className="animate-spin" /> : <Search size={20} />} Locate Course (AI Sync)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* MAP LAYER */}
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={18} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          <MapEvents onMapClick={handleMapClick} />
          
          {/* Render Tee Boxes */}
          {currentHole.teeBoxes.map(t => (
             t.location.lat !== 0 && (
                 <Marker 
                    key={t.id} 
                    position={[t.location.lat, t.location.lng]} 
                    icon={createTeeIcon(t.color)} 
                    eventHandlers={{ click: () => { setSelectedTeeId(t.id); setEditMode('edit_tee_loc'); } }}
                 />
             )
          ))}

          {/* Render Green Polygon */}
          {currentHole.greenGeo && (
             <>
                {/* 1. If we have enough points, show the Smooth Curve */}
                {smoothGreenPath.length > 2 ? (
                    <Polygon 
                        positions={smoothGreenPath.map(p => [p.lat, p.lng])} 
                        pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.4, weight: 2 }} 
                    />
                ) : (
                    /* 2. Fallback to raw polygon if points < 3 */
                    currentHole.greenGeo.shape.length > 0 && (
                        <Polygon 
                            positions={currentHole.greenGeo.shape.map(p => [p.lat, p.lng])} 
                            pathOptions={{ color: '#4ade80', weight: 1, dashArray: '4 4' }} 
                        />
                    )
                )}

                {/* Always show control points so user knows where to click/adjust (if we added drag later) */}
                {/* Only show points in editing mode to reduce clutter */}
                {editMode === 'draw_green' && currentHole.greenGeo.shape.map((p, idx) => (
                    <Marker key={idx} position={[p.lat, p.lng]} icon={pointIcon} />
                ))}

                {/* Flag at Center */}
                {currentHole.greenGeo.shape.length > 0 && (
                    <Marker position={[currentHole.greenGeo.center.lat, currentHole.greenGeo.center.lng]} icon={flagIcon} />
                )}
             </>
          )}

        </MapContainer>

        {/* Top Controls */}
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
           <button onClick={() => setStep('info')} className="bg-black/60 p-3 rounded-full text-white backdrop-blur"><ArrowLeft /></button>
           <div className="bg-black/60 backdrop-blur px-4 py-3 rounded-full text-white font-bold flex items-center gap-2">
               Hole {currentHoleIdx + 1}
               <div className="flex gap-1 ml-2">
                   <button onClick={() => setCurrentHoleIdx(Math.max(0, currentHoleIdx-1))} className="p-1 hover:bg-white/20 rounded"><ArrowLeft size={16}/></button>
                   <button onClick={() => setCurrentHoleIdx(Math.min(holes.length-1, currentHoleIdx+1))} className="p-1 hover:bg-white/20 rounded"><ArrowRight size={16}/></button>
               </div>
           </div>
           <button onClick={handleSave} className="bg-green-600 px-6 py-3 rounded-full text-white font-bold shadow-lg ml-auto">DONE</button>
        </div>

        {/* Overlay Instructions */}
        {editMode !== 'none' && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 text-white px-4 py-2 rounded-xl text-sm font-bold border border-yellow-500 animate-pulse pointer-events-none">
                {editMode === 'edit_tee_loc' ? "Tap Map to Place Tee Box" : "Tap Map Edges to Draw Green"}
            </div>
        )}
      </div>

      {/* BOTTOM EDITOR PANEL */}
      <div className="bg-gray-900 border-t border-gray-800 h-[40vh] flex flex-col">
          {/* Tabs */}
          <div className="flex bg-gray-800 p-1">
             <button onClick={() => setEditMode('none')} className={`flex-1 py-2 text-xs font-bold ${editMode !== 'draw_green' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Tee Boxes</button>
             <button onClick={() => setEditMode('draw_green')} className={`flex-1 py-2 text-xs font-bold ${editMode === 'draw_green' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>Green Map</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
              {editMode === 'draw_green' ? (
                  <div className="space-y-4">
                      <p className="text-gray-400 text-sm">
                          Tap multiple points around the edge of the green. We will automatically create a smooth curve for accurate measurements.
                      </p>
                      <div className="flex gap-3">
                          <button onClick={clearGreen} className="bg-red-900/50 text-red-400 border border-red-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                              <Trash2 size={16}/> Clear Shape
                          </button>
                          <button 
                            onClick={handleFinishGreen} 
                            disabled={(currentHole.greenGeo?.shape.length || 0) < 3}
                            className="flex-1 bg-green-600 text-white border border-green-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                              <Check size={16}/> Finish & Next Hole
                          </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                          Points: {currentHole.greenGeo?.shape.length || 0}
                      </div>
                  </div>
              ) : (
                  <div className="space-y-4">
                      {/* Tee List */}
                      {currentHole.teeBoxes.map((tee) => (
                          <div key={tee.id} className={`bg-gray-800 p-3 rounded-xl border flex items-center gap-3 ${selectedTeeId === tee.id ? 'border-blue-500' : 'border-gray-700'}`}>
                               <div className="w-4 h-4 rounded-sm border border-white shadow-sm shrink-0" style={{ backgroundColor: tee.color }}></div>
                               <div className="flex-1">
                                   <div className="font-bold text-white text-sm">{tee.name}</div>
                                   <div className="text-xs text-gray-500">{tee.location.lat === 0 ? 'Not Placed' : 'Placed on Map'}</div>
                               </div>
                               {/* Scorecard Inputs */}
                               <div className="flex items-center gap-2">
                                   <div className="flex flex-col items-center">
                                       <label className="text-[9px] text-gray-500 font-bold">PAR</label>
                                       <input 
                                          type="number" 
                                          value={tee.par} 
                                          onChange={(e) => updateTeeData(tee.id, 'par', parseInt(e.target.value))}
                                          className="w-10 bg-gray-900 border border-gray-600 text-center text-white text-xs rounded p-1"
                                       />
                                   </div>
                                   <div className="flex flex-col items-center">
                                       <label className="text-[9px] text-gray-500 font-bold">HCP</label>
                                       <input 
                                          type="number" 
                                          value={tee.strokeIndex} 
                                          onChange={(e) => updateTeeData(tee.id, 'si', parseInt(e.target.value))}
                                          className="w-10 bg-gray-900 border border-gray-600 text-center text-white text-xs rounded p-1"
                                       />
                                   </div>
                               </div>
                               <button onClick={() => { setSelectedTeeId(tee.id); setEditMode('edit_tee_loc'); }} className="p-2 bg-blue-900/30 text-blue-400 rounded-lg"><MapPin size={16}/></button>
                               <button onClick={() => deleteTeeBox(tee.id)} className="p-2 bg-red-900/30 text-red-400 rounded-lg"><Trash2 size={16}/></button>
                          </div>
                      ))}

                      {/* Add Tee Buttons */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                          {TEE_PRESETS.map(preset => (
                              <button 
                                key={preset.name}
                                onClick={() => addTeeBox(preset)}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 whitespace-nowrap"
                              >
                                  <div className="w-3 h-3 rounded-sm border border-white/50" style={{ backgroundColor: preset.color }}></div>
                                  <span className="text-xs font-bold text-gray-300">+ {preset.name}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>

      {showHoleDetails && (
          <ModalOverlay onClose={() => setShowHoleDetails(false)}>
              <div className="p-6 bg-gray-900 text-center">
                  <Flag size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Hole {currentHole.number} Details</h3>
                  <p className="text-gray-400 text-xs mb-6">Green mapped. Please confirm hole statistics.</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                          <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Par</label>
                          <div className="flex items-center justify-center gap-3">
                              <button onClick={() => setPendingPar(p => Math.max(3, p-1))} className="w-8 h-8 rounded bg-gray-700 text-white">-</button>
                              <span className="text-2xl font-black text-white">{pendingPar}</span>
                              <button onClick={() => setPendingPar(p => Math.min(6, p+1))} className="w-8 h-8 rounded bg-gray-700 text-white">+</button>
                          </div>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                          <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Stroke Index</label>
                          <div className="flex items-center justify-center gap-3">
                              <button onClick={() => setPendingSi(s => Math.max(1, s-1))} className="w-8 h-8 rounded bg-gray-700 text-white">-</button>
                              <span className="text-2xl font-black text-white">{pendingSi}</span>
                              <button onClick={() => setPendingSi(s => Math.min(18, s+1))} className="w-8 h-8 rounded bg-gray-700 text-white">+</button>
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={handleSaveHoleDetails}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                      Save & Next Hole <ArrowRight size={18} />
                  </button>
              </div>
          </ModalOverlay>
      )}
    </div>
  );
};

const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
};

export default CourseEditor;
