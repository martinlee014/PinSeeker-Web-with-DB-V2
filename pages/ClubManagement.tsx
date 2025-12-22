import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { ClubStats } from '../types';
import { ChevronLeft, Plus, Trash2, Save, Edit3, RotateCcw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StorageService } from '../services/storage';

const ClubManagement = () => {
  const { bag, updateBag, useYards } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // State to track editing: null = List Mode, -1 = New Club, 0..N = Edit Index
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Check if we came from an active game
  const fromGame = location.state?.fromGame;

  // Form State
  const [name, setName] = useState('');
  const [carry, setCarry] = useState(0);
  const [sideError, setSideError] = useState(0);
  const [depthError, setDepthError] = useState(0);

  const initForm = (club?: ClubStats) => {
      if (club) {
          setName(club.name);
          setCarry(club.carry);
          setSideError(club.sideError);
          setDepthError(club.depthError);
      } else {
          // Defaults for new club
          setName('New Club');
          setCarry(150);
          setSideError(15);
          setDepthError(10);
      }
  };

  const handleEdit = (index: number) => {
      initForm(bag[index]);
      setActiveIndex(index);
  };

  const handleAdd = () => {
      initForm(); 
      setActiveIndex(-1);
  };

  const handleBack = () => {
      if (activeIndex !== null) {
          setActiveIndex(null);
      } else {
          if (fromGame) {
              navigate('/play?restore=true');
          } else {
              navigate(-1);
          }
      }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const newClubData: ClubStats = {
      name: name.trim(),
      carry: Number(carry),
      sideError: Number(sideError),
      depthError: Number(depthError)
    };

    // Create a fresh copy of the bag to trigger React updates
    let newBag = [...bag];

    if (activeIndex === -1) {
      // Add New
      newBag.push(newClubData);
    } else if (activeIndex !== null) {
      // Edit Existing
      if (newBag[activeIndex]) {
          newBag[activeIndex] = newClubData;
      }
    }

    // Sort by carry distance descending (Driver at top)
    newBag.sort((a, b) => b.carry - a.carry);

    updateBag(newBag);
    setActiveIndex(null);
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    // Explicitly stop propagation and default behavior
    e.stopPropagation();
    e.preventDefault();

    const clubName = bag[index]?.name || 'Club';
    // Use a small timeout to ensure UI is responsive before confirm (helps in some mobile webviews)
    setTimeout(() => {
        if (window.confirm(`Remove ${clubName} from your bag?`)) {
          const newBag = bag.filter((_, i) => i !== index);
          updateBag(newBag);
          if (activeIndex === index) setActiveIndex(null);
        }
    }, 10);
  };

  const handleReset = () => {
    if (window.confirm("Reset all clubs to default values?")) {
        const defaults = StorageService.resetBag();
        updateBag(defaults);
    }
  };

  // Convert unit for display
  const displayVal = (val: number) => useYards ? Math.round(val * 1.09361) : Math.round(val);
  const unit = useYards ? 'yd' : 'm';

  // --- Visualizer Component ---
  const DispersionVisualizer = () => {
    const width = 220;
    const height = 220;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 2; 

    const gridLines = [];
    const step = 10; 
    const maxDist = 50; 

    for (let i = -maxDist; i <= maxDist; i += step) {
        const pos = i * scale;
        gridLines.push(
            <line key={`v${i}`} x1={centerX + pos} y1={0} x2={centerX + pos} y2={height} stroke={i === 0 ? "#4b5563" : "#374151"} strokeWidth={i === 0 ? 2 : 1} strokeDasharray={i === 0 ? "" : "4 4"} />
        );
        gridLines.push(
            <line key={`h${i}`} x1={0} y1={centerY + pos} x2={width} y2={centerY + pos} stroke={i === 0 ? "#4b5563" : "#374151"} strokeWidth={i === 0 ? 2 : 1} strokeDasharray={i === 0 ? "" : "4 4"} />
        );
    }

    const rx = sideError * scale;
    const ry = depthError * scale;

    return (
        <div className="flex flex-col items-center bg-black/50 p-3 rounded-xl border border-gray-800 backdrop-blur-md shadow-lg">
            <div className="relative border border-gray-700 rounded-lg overflow-hidden bg-gray-900" style={{ width, height }}>
                <svg width={width} height={height}>
                    {gridLines}
                    <circle cx={centerX} cy={centerY} r={3} fill="#fbbf24" stroke="white" strokeWidth={1.5} />
                    <ellipse cx={centerX} cy={centerY} rx={Math.max(2, rx)} ry={Math.max(2, ry)} fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth={2} />
                    <text x={centerX + width/2 - 18} y={centerY - 5} fill="gray" fontSize="9">{maxDist}{unit}</text>
                    <text x={centerX + 5} y={12} fill="gray" fontSize="9">{maxDist}{unit}</text>
                </svg>
            </div>
            <div className="mt-2 text-center text-xs text-blue-400 font-bold">
                &plusmn;{displayVal(sideError)}{unit} &times; &plusmn;{displayVal(depthError)}{unit}
            </div>
        </div>
    )
  };

  // --- EDITOR VIEW ---
  if (activeIndex !== null) {
    const isNew = activeIndex === -1;
    return (
        <div className="flex flex-col h-full bg-gray-900 relative">
            <div className="flex items-center justify-between p-4 pb-2 shrink-0">
                <button onClick={() => setActiveIndex(null)} className="p-2 bg-gray-800 rounded-lg">
                    <ChevronLeft className="text-white" />
                </button>
                <h1 className="text-xl font-bold text-white">{isNew ? 'New Club' : 'Edit Club'}</h1>
                
                {!isNew ? (
                    <button onClick={(e) => handleDelete(activeIndex, e)} className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50">
                        <Trash2 size={20} />
                    </button>
                ) : (
                    <div className="w-10"></div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto relative">
                <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 pb-4 pt-2 px-4 shadow-xl flex justify-center">
                    <DispersionVisualizer />
                </div>

                <div className="p-4 space-y-4">
                    <div className="space-y-5 bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <div>
                            <label className="text-xs text-gray-400 font-bold block mb-1">Club Name</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white font-bold focus:border-green-500 outline-none"
                                placeholder="e.g. Driver"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-gray-400 font-bold">Total Carry ({unit})</label>
                                <span className="text-green-400 font-bold">{displayVal(carry)}</span>
                            </div>
                            <input 
                                type="range" min="10" max="350" step="1" 
                                value={useYards ? carry * 1.09361 : carry} 
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setCarry(useYards ? val / 1.09361 : val);
                                }}
                                className="w-full accent-green-500 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <label className="text-xs text-blue-300 font-bold block mb-2">Width Scatter</label>
                                 <input 
                                    type="range" min="0" max="50" step="1" 
                                    value={useYards ? sideError * 1.09361 : sideError} 
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setSideError(useYards ? val / 1.09361 : val);
                                    }}
                                    className="w-full accent-blue-500 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                 />
                            </div>
                            <div>
                                 <label className="text-xs text-blue-300 font-bold block mb-2">Depth Scatter</label>
                                 <input 
                                    type="range" min="0" max="40" step="1" 
                                    value={useYards ? depthError * 1.09361 : depthError} 
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setDepthError(useYards ? val / 1.09361 : val);
                                    }}
                                    className="w-full accent-blue-500 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                 />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 pt-2 shrink-0 bg-gray-900 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <button 
                    onClick={handleSave}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                >
                    <Save size={20} /> Save Changes
                </button>
            </div>
        </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="p-4 flex flex-col h-full bg-gray-900 relative">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button onClick={handleBack} className="p-2 bg-gray-800 rounded-lg">
          <ChevronLeft className="text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">{fromGame ? 'Edit Bag' : 'My Bag'}</h1>
        <button onClick={handleReset} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white">
           <RotateCcw size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-8">
        {bag.map((club, idx) => (
            <div key={idx} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between group active:scale-[0.99] transition-transform">
                <div onClick={() => handleEdit(idx)} className="flex-1 cursor-pointer">
                    <div className="text-lg font-black text-white">{club.name}</div>
                    <div className="text-sm text-green-400 font-bold">{displayVal(club.carry)}{unit} Carry</div>
                    <div className="text-[10px] text-gray-500 mt-1">
                        &plusmn;{displayVal(club.sideError)} / &plusmn;{displayVal(club.depthError)} {unit}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(idx)}
                        className="p-3 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40"
                    >
                        <Edit3 size={20} />
                    </button>
                    <button 
                        onClick={(e) => handleDelete(idx, e)}
                        className="p-3 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        ))}
        
        {/* ADD BUTTON AS A LIST ITEM - No positioning issues */}
        <button 
          onClick={handleAdd}
          className="w-full bg-gray-800/50 border-2 border-dashed border-gray-700 p-4 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-green-500/50 hover:bg-gray-800 transition-all min-h-[80px]"
        >
          <Plus size={24} />
          <span className="font-bold">Add New Club</span>
        </button>
      </div>
    </div>
  );
};

export default ClubManagement;