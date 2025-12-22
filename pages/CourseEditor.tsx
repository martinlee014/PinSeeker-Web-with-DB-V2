
import { useState, useEffect, useContext, Fragment, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GoogleGenAI, Type } from "@google/genai";
import { AppContext } from '../App';
import { StorageService } from '../services/storage';
import * as MathUtils from '../services/mathUtils';
import { GolfCourse, GolfHole } from '../types';
import { COUNTRIES } from '../constants';
import { ChevronLeft, Save, MapPin, Target, Search, Loader2, ArrowLeft, ArrowRight, Check, X, Edit3, Home, Plus, Maximize, ArrowDownToLine, ArrowUpToLine, ArrowLeftToLine, ArrowRightToLine, Globe, Layers, ExternalLink } from 'lucide-react';
import { ModalOverlay } from '../components/Modals';

// --- Icons Configuration ---

const flagIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const startIcon = new L.DivIcon({
  className: 'custom-start-icon',
  html: `<div style="width: 16px; height: 16px; background-color: #ffffff; border-radius: 50%; border: 4px solid #111827; box-shadow: 0 0 10px rgba(0,0,0,0.5); cursor: move;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const miniTeeIcon = new L.DivIcon({
  className: 'mini-tee-icon',
  html: `<div style="width: 10px; height: 10px; background-color: #9ca3af; border-radius: 50%; border: 2px solid #374151;"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const miniGreenIcon = new L.DivIcon({
  className: 'mini-green-icon',
  html: `<div style="width: 10px; height: 10px; background-color: #ef4444; border-radius: 50%; border: 2px solid #7f1d1d;"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const edgeIcon = (color: string) => new L.DivIcon({
  className: 'edge-icon',
  html: `<div style="width: 8px; height: 8px; background-color: ${color}; border-radius: 50%; border: 1px solid white; box-shadow: 0 0 4px black;"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4]
});

const createHoleLabel = (text: string, isActive: boolean) => new L.DivIcon({
  className: 'bg-transparent',
  html: `
    <div style="display: flex; justify-content: center; align-items: center; width: 120px; transform: translateX(-50%);">
        <div style="
            background-color: ${isActive ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'}; 
            color: ${isActive ? '#4ade80' : '#d1d5db'}; 
            font-size: ${isActive ? '11px' : '9px'}; 
            font-weight: bold; 
            padding: 2px 6px; 
            border-radius: 4px; 
            border: 1px solid ${isActive ? '#4ade80' : 'rgba(255,255,255,0.2)'};
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
            ${text}
        </div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 10] 
});

const createDirectionArrow = (rotation: number, isActive: boolean) => new L.DivIcon({
  className: 'bg-transparent',
  html: `
    <div style="
      transform: rotate(${rotation}deg); 
      width: 0; 
      height: 0; 
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 12px solid ${isActive ? '#ffffff' : '#fbbf24'};
      filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.5));
      opacity: 0.9;
    "></div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6] 
});


const EditorMapEvents = ({ mode, onSetPoint }: { mode: string | null, onSetPoint: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            if (mode) {
                onSetPoint(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
};

const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    
    // Fix for map not rendering correctly on first load due to container resize
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(map.getContainer());
        
        // Timeout backup to ensure it catches the transition
        const timer = setTimeout(() => map.invalidateSize(), 250);

        return () => {
            clearTimeout(timer);
            resizeObserver.disconnect();
        };
    }, [map]);

    useEffect(() => {
        map.setView(center, 18, { animate: true }); 
    }, [center, map]);
    return null;
};

type EditMode = 'tee' | 'green' | 'green-front' | 'green-back' | 'green-left' | 'green-right' | null;

const CourseEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { useYards } = useContext(AppContext);
  const existingCourse = location.state?.course as GolfCourse | undefined;

  const [step, setStep] = useState<'info' | 'map'>('info');
  const [courseName, setCourseName] = useState('');
  const [country, setCountry] = useState('');
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [isSearching, setIsSearching] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  
  const [holes, setHoles] = useState<GolfHole[]>(
      Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: 4,
          tee: { lat: 0, lng: 0 },
          green: { lat: 0, lng: 0 }
      }))
  );

  const [currentHoleIdx, setCurrentHoleIdx] = useState(0);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [greenSubMode, setGreenSubMode] = useState<'center' | 'front' | 'back' | 'left' | 'right'>('center');
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.253031, 6.610690]); 

  useEffect(() => {
    if (existingCourse) {
        setExistingId(existingCourse.id);
        setCourseName(existingCourse.name);
        setCountry(existingCourse.country || '');
        setHoles(existingCourse.holes);
        if (existingCourse.holes.length === 9) setHoleCount(9);
        else setHoleCount(18);
        
        const firstPoint = existingCourse.holes.find(h => h.tee.lat !== 0);
        if (firstPoint) {
            setMapCenter([firstPoint.tee.lat, firstPoint.tee.lng]);
        }
    } else {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                setMapCenter([pos.coords.latitude, pos.coords.longitude]);
            });
        }
    }
  }, [existingCourse]);

  // Adjust holes array when holeCount changes
  useEffect(() => {
      setHoles(prevHoles => {
          if (holeCount === prevHoles.length) return prevHoles;
          
          if (holeCount === 9) {
              return prevHoles.slice(0, 9);
          } else {
              // Expand from 9 to 18
              const newHoles = [...prevHoles];
              for (let i = prevHoles.length; i < 18; i++) {
                  newHoles.push({
                      number: i + 1,
                      par: 4,
                      tee: { lat: 0, lng: 0 },
                      green: { lat: 0, lng: 0 }
                  });
              }
              return newHoles;
          }
      });
  }, [holeCount]);

  const openGoogleMaps = () => {
      const query = encodeURIComponent(`Golf Club ${courseName} ${country}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // --- Enhanced Search Logic ---
  const handleSearch = async () => {
      if (!courseName.trim()) return;
      setIsSearching(true);

      const countrySuffix = (country && country !== 'All') ? `, ${country}` : '';
      const fullQuery = `${courseName}${countrySuffix}`;

      // 1. Direct Coordinate Input Check (Lat, Lng)
      // Regex allows negative numbers, decimals, and optional space
      const coordMatch = courseName.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
      if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[3]);
          if (!isNaN(lat) && !isNaN(lng)) {
              setMapCenter([lat, lng]);
              setStep('map');
              setIsSearching(false);
              return;
          }
      }

      // 2. Try Gemini AI Search with Grounding
      // This helps find obscure courses that OSM misses
      try {
          // Use process.env.API_KEY as per guidelines. 
          // If not configured, we gracefully fall back to Nominatim.
          if (process.env.API_KEY) {
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const response = await ai.models.generateContent({
                  model: 'gemini-3-flash-preview',
                  contents: `Find the precise GPS latitude and longitude for the golf course: "${fullQuery}".`,
                  config: {
                      tools: [{ googleSearch: {} }],
                      responseMimeType: "application/json",
                      responseSchema: {
                          type: Type.OBJECT,
                          properties: {
                              lat: { type: Type.NUMBER, description: "Latitude of the golf course" },
                              lng: { type: Type.NUMBER, description: "Longitude of the golf course" },
                              found: { type: Type.BOOLEAN, description: "Whether the specific golf course was found" }
                          }
                      }
                  }
              });
              
              const json = JSON.parse(response.text || '{}');
              if (json.found && json.lat && json.lng) {
                  setMapCenter([json.lat, json.lng]);
                  setStep('map');
                  setIsSearching(false);
                  return;
              }
          }
      } catch (e) {
          console.warn("AI Search unavailable or failed, falling back to OSM", e);
      }

      // 3. Fallback: Nominatim (OpenStreetMap)
      const strategies = [
          `Golf Club ${courseName}${countrySuffix}`, // Specific
          `${courseName} Golf Course${countrySuffix}`, // Specific
          `${courseName} Golf${countrySuffix}`, // Fuzzy
          `${courseName}${countrySuffix}` // Fallback
      ];

      try {
          let foundLocation = null;

          for (const query of strategies) {
              const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
              const res = await fetch(url);
              const results = await res.json();

              if (results && results.length > 0) {
                  const bestMatch = results.find((item: any) => 
                      item.type === 'golf_course' || 
                      item.class === 'leisure' ||
                      item.display_name.toLowerCase().includes('golf')
                  );

                  if (bestMatch) {
                      foundLocation = bestMatch;
                      break; 
                  } else if (!foundLocation) {
                      foundLocation = results[0]; 
                  }
              }
          }

          if (foundLocation) {
              const lat = parseFloat(foundLocation.lat);
              const lon = parseFloat(foundLocation.lon);

              if (!country && foundLocation.address && foundLocation.address.country) {
                  const detected = foundLocation.address.country;
                  const match = COUNTRIES.find(c => c.toLowerCase() === detected.toLowerCase());
                  setCountry(match || detected);
              }

              setMapCenter([lat, lon]);
              setStep('map');
          } else {
              alert("Could not locate course automatically.\n\nTip: You can paste exact coordinates (Lat, Lng) into the Name box, or use the 'Map' button to find it on Google.");
          }

      } catch (e) {
          console.error(e);
          alert("Network error during search.");
      } finally {
          setIsSearching(false);
      }
  };

  const onPreSave = () => {
      setShowSummary(true);
  };

  const handleFinalSave = () => {
    if (!courseName.trim()) {
        alert("Please enter a course name");
        return;
    }

    const newCourse: GolfCourse = {
        id: existingId || crypto.randomUUID(),
        name: courseName,
        country: country || undefined,
        holes: holes,
        isCustom: true,
        createdAt: existingCourse?.createdAt || new Date().toLocaleDateString()
    };
    
    StorageService.saveCustomCourse(newCourse);
    setShowSummary(false);
    navigate('/settings/courses');
  };

  const handleDraftSave = () => {
      if (!courseName.trim()) return;
      const newCourse: GolfCourse = {
        id: existingId || crypto.randomUUID(),
        name: courseName,
        country: country || undefined,
        holes: holes,
        isCustom: true,
        createdAt: existingCourse?.createdAt || new Date().toLocaleDateString()
    };
    StorageService.saveCustomCourse(newCourse);
    setExistingId(newCourse.id);
    alert("Draft saved!");
  };

  const updateHolePoint = (lat: number, lng: number) => {
      const newHoles = [...holes];
      if (editMode === 'tee') {
          newHoles[currentHoleIdx].tee = { lat, lng };
      } else if (editMode === 'green') {
          newHoles[currentHoleIdx].green = { lat, lng };
      } else if (editMode === 'green-front') {
          newHoles[currentHoleIdx].greenFront = { lat, lng };
      } else if (editMode === 'green-back') {
          newHoles[currentHoleIdx].greenBack = { lat, lng };
      } else if (editMode === 'green-left') {
          newHoles[currentHoleIdx].greenLeft = { lat, lng };
      } else if (editMode === 'green-right') {
          newHoles[currentHoleIdx].greenRight = { lat, lng };
      }
      setHoles(newHoles);
      setEditMode(null); 
  };

  const handleMarkerDragEnd = (e: any, type: EditMode, holeIdx: number) => {
      const newPos = e.target.getLatLng();
      const newHoles = [...holes];
      if (type === 'tee') {
          newHoles[holeIdx].tee = { lat: newPos.lat, lng: newPos.lng };
      } else if (type === 'green') {
          newHoles[holeIdx].green = { lat: newPos.lat, lng: newPos.lng };
      } else if (type === 'green-front') {
          newHoles[holeIdx].greenFront = { lat: newPos.lat, lng: newPos.lng };
      } else if (type === 'green-back') {
          newHoles[holeIdx].greenBack = { lat: newPos.lat, lng: newPos.lng };
      } else if (type === 'green-left') {
          newHoles[holeIdx].greenLeft = { lat: newPos.lat, lng: newPos.lng };
      } else if (type === 'green-right') {
          newHoles[holeIdx].greenRight = { lat: newPos.lat, lng: newPos.lng };
      }
      setHoles(newHoles);
  };

  const updatePar = (delta: number) => {
      const newHoles = [...holes];
      const newPar = Math.min(6, Math.max(3, newHoles[currentHoleIdx].par + delta));
      newHoles[currentHoleIdx].par = newPar;
      setHoles(newHoles);
  };

  const useGPSForPoint = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
          updateHolePoint(pos.coords.latitude, pos.coords.longitude);
      }, (err) => alert("GPS Error: " + err.message));
  };

  const currentHole = holes[currentHoleIdx];
  const hasTee = currentHole.tee.lat !== 0;
  const hasGreen = currentHole.green.lat !== 0;

  const setGreenMode = (sub: 'center' | 'front' | 'back' | 'left' | 'right') => {
      setGreenSubMode(sub);
      if (sub === 'center') setEditMode('green');
      else setEditMode(`green-${sub}` as EditMode);
  };

  const summaryStats = useMemo(() => {
    let totalDist = 0;
    let totalPar = 0;
    const holeStats = holes.map(h => {
        let d = 0;
        if (h.tee.lat !== 0 && h.green.lat !== 0) {
            d = MathUtils.calculateDistance(h.tee, h.green);
        }
        if (d > 0) { 
            totalDist += d;
            totalPar += h.par;
        }
        return { ...h, dist: d };
    });
    return { holeStats, totalDist, totalPar };
  }, [holes]);


  if (step === 'info') {
      return (
          <div className="p-6 bg-gray-900 min-h-screen text-white flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/settings/courses')} className="p-2 bg-gray-800 rounded-lg">
                    <ChevronLeft />
                </button>
                <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-800 rounded-lg"><Home className="text-white" size={20}/></button>
                <h1 className="text-2xl font-bold">{existingId ? 'Edit Course' : 'New Course'}</h1>
              </div>

              <div className="space-y-6">
                  <div>
                      <div className="flex justify-between items-end mb-2">
                          <label className="block text-gray-400 text-sm font-bold">Course Name or Coords</label>
                          <button 
                            onClick={openGoogleMaps}
                            className="text-[10px] text-blue-400 flex items-center gap-1 hover:text-blue-300"
                          >
                              <ExternalLink size={10} /> Find on Google Maps
                          </button>
                      </div>
                      <input 
                        type="text" 
                        className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:border-green-500 outline-none"
                        placeholder="e.g. Pebble Beach OR 36.56, -121.95"
                        value={courseName}
                        onChange={e => setCourseName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                          <strong>Tip:</strong> For facilities with multiple courses (27+ holes), please create separate entries (e.g. "Carton House - O'Meara" and "Carton House - Montgomerie").
                      </p>
                  </div>

                  <div>
                      <label className="block text-gray-400 text-sm font-bold mb-2">Number of Holes</label>
                      <div className="flex gap-3">
                          <button 
                            onClick={() => setHoleCount(9)}
                            className={`flex-1 py-3 rounded-xl border ${holeCount === 9 ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                          >
                             9 Holes
                          </button>
                          <button 
                            onClick={() => setHoleCount(18)}
                            className={`flex-1 py-3 rounded-xl border ${holeCount === 18 ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                          >
                             18 Holes
                          </button>
                      </div>
                  </div>

                  <div>
                      <label className="block text-gray-400 text-sm font-bold mb-2">Country</label>
                      <div className="relative">
                          <select 
                            value={country} 
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:border-green-500 outline-none appearance-none"
                          >
                            <option value="">Select Country (Optional)</option>
                            {COUNTRIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Globe size={16} className="text-gray-500"/>
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={handleSearch}
                    disabled={isSearching || !courseName.trim()}
                    className="w-full bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                      {isSearching ? <Loader2 className="animate-spin" size={20}/> : <Search size={20} />}
                      {courseName.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/) ? "Go to Coordinates" : "Search Location"}
                  </button>
              </div>

              <button 
                onClick={() => setStep('map')}
                className="mt-auto w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg"
              >
                  {existingId ? 'Continue Editing Map' : 'Start Mapping'}
              </button>
          </div>
      );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 relative overflow-hidden">
        {/* Map - takes remaining height */}
        <div className="flex-1 relative bg-black z-0">
            <MapContainer center={mapCenter} zoom={18} className="h-full w-full" zoomControl={false} maxZoom={22}>
                <TileLayer 
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                    maxNativeZoom={19}
                    maxZoom={22}
                />
                <MapUpdater center={mapCenter} />
                <EditorMapEvents mode={editMode} onSetPoint={updateHolePoint} />
                
                {/* Render ALL Valid Holes to visualize flow */}
                {holes.map((hole, idx) => {
                    const isTeeSet = hole.tee.lat !== 0;
                    const isGreenSet = hole.green.lat !== 0;
                    const isActive = idx === currentHoleIdx;
                    
                    if (!isTeeSet && !isGreenSet) return null;

                    let bearing = 0;
                    let midPoint: any = null;
                    let dist = 0;

                    if (isTeeSet && isGreenSet) {
                         bearing = MathUtils.calculateBearing(hole.tee, hole.green);
                         dist = MathUtils.calculateDistance(hole.tee, hole.green);
                         midPoint = [(hole.tee.lat + hole.green.lat) / 2, (hole.tee.lng + hole.green.lng) / 2];
                    }

                    return (
                        <Fragment key={hole.number}>
                            {/* Connection Line */}
                            {isTeeSet && isGreenSet && (
                                <Polyline 
                                    positions={[[hole.tee.lat, hole.tee.lng], [hole.green.lat, hole.green.lng]]} 
                                    pathOptions={{ 
                                        color: isActive ? '#ffffff' : '#fbbf24', 
                                        weight: isActive ? 3 : 2,
                                        dashArray: isActive ? '5,5' : undefined, 
                                        opacity: isActive ? 0.9 : 0.6 
                                    }} 
                                />
                            )}
                            
                            {/* Arrow Indicator at 80% towards Green */}
                            {isTeeSet && isGreenSet && (
                                <Marker 
                                    position={MathUtils.calculateDestination(hole.tee, dist * 0.8, bearing)}
                                    icon={createDirectionArrow(bearing, isActive)}
                                    interactive={false}
                                />
                            )}

                            {/* Distance / Info Label at Midpoint */}
                            {midPoint && (
                                <Marker 
                                    position={midPoint} 
                                    icon={createHoleLabel(
                                        `#${hole.number} P${hole.par} ${MathUtils.formatDistance(dist, useYards)}`, 
                                        isActive
                                    )} 
                                    interactive={false}
                                />
                            )}

                            {/* Tee Marker */}
                            {isTeeSet && (
                                <Marker 
                                    position={[hole.tee.lat, hole.tee.lng]} 
                                    icon={isActive ? startIcon : miniTeeIcon} 
                                    zIndexOffset={isActive ? 1000 : 0}
                                    draggable={isActive} 
                                    eventHandlers={{
                                        dragend: (e) => handleMarkerDragEnd(e, 'tee', idx)
                                    }}
                                />
                            )}

                            {/* Green Center Marker */}
                            {isGreenSet && (
                                <Marker 
                                    position={[hole.green.lat, hole.green.lng]} 
                                    icon={isActive ? flagIcon : miniGreenIcon} 
                                    zIndexOffset={isActive ? 1000 : 0}
                                    draggable={isActive} 
                                    eventHandlers={{
                                        dragend: (e) => handleMarkerDragEnd(e, 'green', idx)
                                    }}
                                />
                            )}

                            {/* Green Edges - Only show for active hole */}
                            {isActive && hole.greenFront && (
                                <Marker 
                                    position={[hole.greenFront.lat, hole.greenFront.lng]} 
                                    icon={edgeIcon('#3b82f6')} 
                                    zIndexOffset={1001}
                                    draggable={true} 
                                    eventHandlers={{ dragend: (e) => handleMarkerDragEnd(e, 'green-front', idx) }}
                                />
                            )}
                            {isActive && hole.greenBack && (
                                <Marker 
                                    position={[hole.greenBack.lat, hole.greenBack.lng]} 
                                    icon={edgeIcon('#ef4444')} 
                                    zIndexOffset={1001}
                                    draggable={true} 
                                    eventHandlers={{ dragend: (e) => handleMarkerDragEnd(e, 'green-back', idx) }}
                                />
                            )}
                            {isActive && hole.greenLeft && (
                                <Marker 
                                    position={[hole.greenLeft.lat, hole.greenLeft.lng]} 
                                    icon={edgeIcon('#eab308')} 
                                    zIndexOffset={1001}
                                    draggable={true} 
                                    eventHandlers={{ dragend: (e) => handleMarkerDragEnd(e, 'green-left', idx) }}
                                />
                            )}
                            {isActive && hole.greenRight && (
                                <Marker 
                                    position={[hole.greenRight.lat, hole.greenRight.lng]} 
                                    icon={edgeIcon('#eab308')} 
                                    zIndexOffset={1001}
                                    draggable={true} 
                                    eventHandlers={{ dragend: (e) => handleMarkerDragEnd(e, 'green-right', idx) }}
                                />
                            )}
                        </Fragment>
                    );
                })}
            </MapContainer>

             {/* Back / Save Draft Overlay */}
             <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                <button onClick={() => setStep('info')} className="bg-black/60 p-3 rounded-full text-white backdrop-blur-md border border-white/10 hover:bg-black/80">
                    <ChevronLeft size={24} />
                </button>
                <button onClick={() => navigate('/dashboard')} className="bg-black/60 p-3 rounded-full text-white backdrop-blur-md border border-white/10 hover:bg-black/80">
                    <Home size={24} />
                </button>
             </div>
             
             <div className="absolute top-4 right-4 z-[1000]">
                <button onClick={handleDraftSave} className="bg-black/60 px-4 py-2 rounded-full text-white text-xs font-bold backdrop-blur-md border border-white/10 hover:bg-black/80 flex items-center gap-2">
                    <Save size={14} /> Save Draft
                </button>
             </div>

            {/* Editing Overlay Instruction */}
            {editMode && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-bold pointer-events-none z-[1000] border border-white/20 animate-pulse text-center w-max">
                    Tap map OR drag marker to set Point
                </div>
            )}
        </div>

        {/* Compact Controls Panel */}
        <div className="flex-none bg-gray-900 border-t border-gray-800 flex flex-col z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]">
            {/* Header: Nav + Hole Info + Par */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-800">
                 <button onClick={() => setCurrentHoleIdx(Math.max(0, currentHoleIdx - 1))} 
                    className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg text-white disabled:opacity-30 hover:bg-gray-700 transition-colors" 
                    disabled={currentHoleIdx===0}>
                    <ArrowLeft size={16} />
                 </button>
                 
                 <div className="flex flex-col items-center">
                     <span className="text-sm font-black text-white tracking-widest">HOLE {currentHole.number}</span>
                     <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">PAR</span>
                         <div className="flex items-center bg-gray-950 rounded border border-gray-700/50 overflow-hidden">
                             <button onClick={() => updatePar(-1)} className="px-2 py-0.5 text-gray-400 hover:text-white hover:bg-gray-800 active:bg-gray-700 transition-colors">-</button>
                             <span className={`text-xs font-bold w-5 text-center ${currentHole.par === 3 ? 'text-blue-400' : currentHole.par === 5 ? 'text-yellow-400' : 'text-white'}`}>{currentHole.par}</span>
                             <button onClick={() => updatePar(1)} className="px-2 py-0.5 text-gray-400 hover:text-white hover:bg-gray-800 active:bg-gray-700 transition-colors">+</button>
                         </div>
                     </div>
                 </div>

                 <button onClick={() => setCurrentHoleIdx(Math.min(holes.length - 1, currentHoleIdx + 1))} 
                    className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg text-white disabled:opacity-30 hover:bg-gray-700 transition-colors" 
                    disabled={currentHoleIdx===holes.length - 1}>
                    <ArrowRight size={16} />
                 </button>
            </div>

            {/* Content: Points Setup */}
            <div className="p-2 grid grid-cols-12 gap-2">
                {/* Tee Section - Takes 4 cols */}
                <div className={`col-span-4 rounded-xl border px-2 py-2 flex flex-col gap-1 transition-colors ${hasTee ? 'border-green-500/30 bg-green-900/10' : 'border-gray-700 bg-gray-800/30'}`}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tee</span>
                        {hasTee ? <Check size={12} className="text-green-500" /> : <div className="w-3 h-3 rounded-full border border-gray-600"></div>}
                    </div>
                    <div className="flex gap-1 h-full">
                        <button onClick={() => setEditMode('tee')} 
                            className={`flex-1 rounded-lg text-xs font-bold flex justify-center items-center transition-all ${editMode === 'tee' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                            <MapPin size={12} />
                        </button>
                        <button onClick={() => { setEditMode('tee'); useGPSForPoint(); }} 
                            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-bold flex justify-center items-center text-gray-300">
                            <Target size={12} />
                        </button>
                    </div>
                </div>

                {/* Green Section - Takes 8 cols */}
                <div className={`col-span-8 rounded-xl border px-2 py-2 flex flex-col gap-1 transition-colors ${hasGreen ? 'border-green-500/30 bg-green-900/10' : 'border-gray-700 bg-gray-800/30'}`}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Green Points</span>
                        <div className="flex gap-1">
                            {['center', 'front', 'back'].map((m) => {
                                const modeKey = m as 'center'|'front'|'back';
                                const isSet = m === 'center' ? hasGreen : (m === 'front' ? !!currentHole.greenFront : !!currentHole.greenBack);
                                return (
                                    <span key={m} className={`text-[8px] px-1 rounded uppercase font-bold ${isSet ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-500'}`}>{m.charAt(0)}</span>
                                )
                            })}
                        </div>
                    </div>
                     <div className="flex gap-1">
                        <button onClick={() => setGreenMode('center')} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${greenSubMode === 'center' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            <MapPin size={14} />
                        </button>
                        <button onClick={() => setGreenMode('front')} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${greenSubMode === 'front' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            <ArrowDownToLine size={14} />
                        </button>
                        <button onClick={() => setGreenMode('back')} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${greenSubMode === 'back' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            <ArrowUpToLine size={14} />
                        </button>
                        <button onClick={() => setGreenMode('left')} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${greenSubMode === 'left' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            <ArrowLeftToLine size={14} />
                        </button>
                        <button onClick={() => setGreenMode('right')} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${greenSubMode === 'right' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            <ArrowRightToLine size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="px-2 pb-2">
                 <button onClick={onPreSave} className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors">
                    <Save size={16} /> REVIEW & SAVE COURSE
                </button>
            </div>
        </div>
        
        {/* Course Summary Modal */}
        {showSummary && (
            <ModalOverlay onClose={() => setShowSummary(false)}>
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Edit3 size={18} className="text-blue-500"/> Confirm Course Data
                    </h3>
                    <button type="button" onClick={() => setShowSummary(false)}><X className="text-gray-400" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
                    <table className="w-full text-sm text-left text-gray-400 mb-4">
                         <thead className="text-xs text-gray-500 uppercase bg-gray-800">
                            <tr>
                                <th className="px-2 py-2 rounded-l-lg">Hole</th>
                                <th className="px-2 py-2">Dist</th>
                                <th className="px-2 py-2 text-center rounded-r-lg">Par</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryStats.holeStats.map((h, i) => (
                                <tr key={i} className={`border-b border-gray-800 ${h.dist === 0 ? 'opacity-30' : ''}`}>
                                    <td className="px-2 py-3 font-medium text-white">#{h.number}</td>
                                    <td className="px-2 py-3">
                                        {h.dist > 0 ? MathUtils.formatDistance(h.dist, useYards) : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                className="w-6 h-6 bg-gray-800 rounded text-gray-400 hover:bg-gray-700"
                                                onClick={() => {
                                                    const newHoles = [...holes];
                                                    newHoles[i].par = Math.max(3, newHoles[i].par - 1);
                                                    setHoles(newHoles);
                                                }}
                                            >-</button>
                                            <span className={`w-4 font-bold ${h.par === 3 ? 'text-blue-400' : h.par === 5 ? 'text-yellow-400' : 'text-white'}`}>{h.par}</span>
                                            <button 
                                                className="w-6 h-6 bg-gray-800 rounded text-gray-400 hover:bg-gray-700"
                                                onClick={() => {
                                                    const newHoles = [...holes];
                                                    newHoles[i].par = Math.min(6, newHoles[i].par + 1);
                                                    setHoles(newHoles);
                                                }}
                                            >+</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="bg-gray-800 rounded-xl p-4 flex justify-between items-center mb-2">
                        <div className="text-center">
                             <div className="text-xs text-gray-500 uppercase">Total Dist</div>
                             <div className="text-lg font-black text-white">{MathUtils.formatDistance(summaryStats.totalDist, useYards)}</div>
                        </div>
                         <div className="text-center">
                             <div className="text-xs text-gray-500 uppercase">Total Par</div>
                             <div className="text-lg font-black text-green-400">{summaryStats.totalPar}</div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-800 shrink-0 bg-gray-900 flex gap-3">
                    <button 
                        onClick={() => setShowSummary(false)} 
                        className="flex-1 bg-gray-800 text-gray-300 font-bold py-3 rounded-xl border border-gray-700"
                    >
                        Edit More
                    </button>
                    <button 
                        onClick={handleFinalSave}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg"
                    >
                        Save Course
                    </button>
                </div>
            </ModalOverlay>
        )}
    </div>
  );
};

export default CourseEditor;
