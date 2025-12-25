import { useState, useEffect, useContext, Fragment, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GoogleGenAI, Type } from "@google/genai";
import { AppContext } from '../App';
import { StorageService } from '../services/storage';
import * as MathUtils from '../services/mathUtils';
import { GolfCourse, GolfHole } from '../types';
import { COUNTRIES } from '../constants';
import { ChevronLeft, Save, MapPin, Target, Search, Loader2, ArrowLeft, ArrowRight, X, Edit3, Home, Navigation, Globe, ExternalLink, AlertCircle } from 'lucide-react';
import { ModalOverlay } from '../components/Modals';

// --- Icons Configuration ---
const flagIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const startIcon = new L.DivIcon({
  className: 'custom-start-icon',
  html: `<div style="width: 16px; height: 16px; background-color: #ffffff; border-radius: 50%; border: 4px solid #111827;"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8]
});

const CourseEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { useYards } = useContext(AppContext);
  const existingCourse = location.state?.course as GolfCourse | undefined;

  const [step, setStep] = useState<'info' | 'map'>('info');
  const [courseName, setCourseName] = useState(existingCourse?.name || '');
  const [country, setCountry] = useState(existingCourse?.country || '');
  const [holeCount, setHoleCount] = useState<9 | 18>(existingCourse?.holes.length === 9 ? 9 : 18);
  const [isSearching, setIsSearching] = useState(false);
  const [holes, setHoles] = useState<GolfHole[]>(existingCourse?.holes || Array.from({ length: 18 }, (_, i) => ({
      number: i + 1, par: 4, tee: { lat: 0, lng: 0 }, green: { lat: 0, lng: 0 }
  })));
  const [currentHoleIdx, setCurrentHoleIdx] = useState(0);
  const [editMode, setEditMode] = useState<'tee' | 'green' | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.9042, 116.4074]);

  const handleSearch = async () => {
    if (!courseName.trim()) return;
    setIsSearching(true);

    try {
      // 检查 AI Studio API Key 授权状态
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
        // 如果用户在弹窗中取消或未选，流程可能中断，此处假设之后可继续
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
      if (e.message?.includes("Requested entity was not found")) {
        window.aistudio?.openSelectKey();
      }
      alert("Search sync failed. Please ensure API Key is valid in AI Studio.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    const newCourse: GolfCourse = {
      id: existingCourse?.id || crypto.randomUUID(),
      name: courseName,
      country: country || undefined,
      holes: holes,
      isCustom: true
    };
    StorageService.saveCustomCourse(newCourse);
    navigate('/settings/courses');
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
    <div className="h-screen flex flex-col bg-black">
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={18} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          <MapEvents onMapClick={(lat, lng) => {
            if (!editMode) return;
            const newHoles = [...holes];
            if (editMode === 'tee') newHoles[currentHoleIdx].tee = { lat, lng };
            else newHoles[currentHoleIdx].green = { lat, lng };
            setHoles(newHoles);
            setEditMode(null);
          }} />
          {holes.map((h, i) => (
            <Fragment key={i}>
              {h.tee.lat !== 0 && <Marker position={[h.tee.lat, h.tee.lng]} icon={startIcon} />}
              {h.green.lat !== 0 && <Marker position={[h.green.lat, h.green.lng]} icon={flagIcon} />}
            </Fragment>
          ))}
        </MapContainer>
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
           <button onClick={() => setStep('info')} className="bg-black/60 p-3 rounded-full text-white"><ArrowLeft /></button>
           <button onClick={handleSave} className="bg-green-600 px-6 py-3 rounded-full text-white font-bold shadow-lg">SAVE COURSE</button>
        </div>
      </div>
      <div className="bg-gray-900 p-4 border-t border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCurrentHoleIdx(Math.max(0, currentHoleIdx-1))} className="p-2 bg-gray-800 rounded-lg"><ArrowLeft /></button>
          <span className="font-bold">HOLE {currentHoleIdx + 1}</span>
          <button onClick={() => setCurrentHoleIdx(Math.min(holes.length-1, currentHoleIdx+1))} className="p-2 bg-gray-800 rounded-lg"><ArrowRight /></button>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setEditMode('tee')} className={`flex-1 p-3 rounded-xl border ${editMode==='tee'?'bg-blue-600 border-blue-400':'bg-gray-800 border-gray-700'}`}>SET TEE</button>
          <button onClick={() => setEditMode('green')} className={`flex-1 p-3 rounded-xl border ${editMode==='green'?'bg-red-600 border-red-400':'bg-gray-800 border-gray-700'}`}>SET GREEN</button>
        </div>
      </div>
    </div>
  );
};

const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
};

export default CourseEditor;