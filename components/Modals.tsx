
import { useState, ReactNode, ChangeEvent, useEffect } from 'react';
import { X, Check, AlertTriangle, MapPin, Trophy, Flag, Target, Minus, Plus, Zap, Cloud, Smartphone, RefreshCw, Users } from 'lucide-react';
import { ClubStats, GolfHole, HoleScore } from '../types';

export const ModalOverlay = ({ children, onClose }: { children?: ReactNode, onClose?: () => void }) => (
  <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
    <div 
      className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      onClick={(e) => {
        e.preventDefault();
        if(onClose) onClose();
      }} 
    />
    <div 
      className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm relative z-10 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

export const BagSyncConflictModal = ({ 
    cloudDate,
    onUseCloud, 
    onUseLocal 
}: { 
    cloudDate?: string, // Optional timestamp if available
    onUseCloud: () => void, 
    onUseLocal: () => void 
}) => {
    return (
        <ModalOverlay>
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/50 animate-pulse">
                    <RefreshCw className="text-orange-400" size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Sync Conflict Detected</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    We found a difference between the club data on this device and your cloud profile. Which one would you like to keep?
                </p>
                
                <div className="space-y-3">
                    <button 
                        onClick={onUseCloud}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl flex items-center justify-between group transition-all border border-blue-500/50"
                    >
                        <div className="flex items-center gap-3">
                            <Cloud size={20} className="text-blue-200" />
                            <div className="text-left">
                                <div className="font-bold text-sm">Download from Cloud</div>
                                <div className="text-[10px] text-blue-200">Overwrite local data</div>
                            </div>
                        </div>
                        <Check size={16} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </button>

                    <button 
                        onClick={onUseLocal}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl flex items-center justify-between group transition-all border border-gray-700"
                    >
                         <div className="flex items-center gap-3">
                            <Smartphone size={20} className="text-gray-400" />
                            <div className="text-left">
                                <div className="font-bold text-sm">Keep Local Data</div>
                                <div className="text-[10px] text-gray-400">Upload to cloud</div>
                            </div>
                        </div>
                         <Check size={16} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
};

export const HdcpInputModal = ({ 
    currentHdcp, 
    onSave, 
    onClose 
}: { 
    currentHdcp: number, 
    onSave: (val: number) => void, 
    onClose: () => void 
}) => {
    const [val, setVal] = useState(currentHdcp);
    
    return (
        <ModalOverlay onClose={onClose}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                <h3 className="text-lg font-bold text-white">Edit Handicap</h3>
                <button type="button" onClick={onClose}><X className="text-gray-400" /></button>
            </div>
            <div className="p-6 text-center">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Manual Entry</div>
                <div className="flex items-center justify-center gap-6 mb-8">
                    <button onClick={() => setVal(v => Math.max(0, v - 1))} className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center">
                        <Minus size={24}/>
                    </button>
                    <span className="text-6xl font-black text-white">{val}</span>
                    <button onClick={() => setVal(v => Math.min(36, v + 1))} className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Plus size={24}/>
                    </button>
                </div>
                <button 
                    onClick={() => onSave(val)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                >
                    Update HDCP
                </button>
            </div>
        </ModalOverlay>
    );
};

export const ConfirmClubSyncModal = ({ 
    hdcp, 
    onConfirm, 
    onCancel 
}: { 
    hdcp: number, 
    onConfirm: () => void, 
    onCancel: () => void 
}) => {
    return (
        <ModalOverlay onClose={onCancel}>
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/50">
                    <Zap className="text-blue-400" size={32} fill="currentColor" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Auto-Configure Bag?</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Based on your <strong className="text-white">HDCP {hdcp}</strong>, PinSeeker can automatically update your club distances and dispersion patterns to match your skill level.
                </p>
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 mb-6 text-left text-xs text-gray-400">
                    <ul className="space-y-1">
                        <li>• Carry distances adjusted for HDCP</li>
                        <li>• Logical dispersion widths (&plusmn;10-35m)</li>
                        <li>• Accurate depth/consistency scatter</li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <button 
                        onClick={onConfirm}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
                    >
                        Yes, Auto-Configure
                    </button>
                    <button 
                        onClick={onCancel}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3.5 rounded-xl"
                    >
                        No, Keep My Current Bag
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
};

// --- MULTI-PLAYER SCORE MODAL ---
interface PlayerScoreState {
    totalScore: number;
    putts: number;
    pens: number;
}

export const ScoreModal = ({ 
  par, 
  holeNum, 
  recordedShots,
  currentPlayer,
  players = [], // List of all player names to score for
  onSave, 
  onClose 
}: { 
  par: number, 
  holeNum: number, 
  recordedShots: number,
  currentPlayer: string,
  players?: string[],
  onSave: (scores: Record<string, PlayerScoreState>) => void, 
  onClose: () => void 
}) => {
  // State maps player name to their score object
  const [allScores, setAllScores] = useState<Record<string, PlayerScoreState>>({});
  const [activeTab, setActiveTab] = useState(currentPlayer);

  // Initialize defaults
  useEffect(() => {
      const initial: Record<string, PlayerScoreState> = {};
      
      // Ensure we have a list including current player
      const list = players.length > 0 ? players : [currentPlayer];
      
      list.forEach(p => {
          // For the main player (who is tracking shots), default to recordedShots + 2 putts
          // For others, default to Par (or Par+1/2 based on typical)
          const isMain = p === currentPlayer;
          initial[p] = {
              putts: 2,
              pens: 0,
              totalScore: isMain ? Math.max(par, recordedShots + 2) : par
          };
      });
      setAllScores(initial);
      setActiveTab(currentPlayer);
  }, [players, currentPlayer, par, recordedShots]);

  const updateScore = (player: string, field: keyof PlayerScoreState, delta: number) => {
      setAllScores(prev => {
          const pScore = { ...prev[player] };
          
          if (field === 'totalScore') {
              // Ensure total score doesn't drop below putts + pens + 1
              const minScore = pScore.putts + pScore.pens + 1;
              pScore.totalScore = Math.max(minScore, pScore.totalScore + delta);
          } else if (field === 'putts') {
              pScore.putts = Math.max(0, pScore.putts + delta);
              // Update total if putts change
              const diff = delta > 0 ? 1 : -1; // Approximation
              // Ideally re-calc total based on changed component, but "Total" is the primary input in golf
              // Usually we want total to move with putts
              pScore.totalScore = Math.max(1, pScore.totalScore + (pScore.putts - (prev[player].putts))); 
          } else if (field === 'pens') {
              pScore.pens = Math.max(0, pScore.pens + delta);
              pScore.totalScore = Math.max(1, pScore.totalScore + (pScore.pens - (prev[player].pens)));
          }
          return { ...prev, [player]: pScore };
      });
  };

  const currentData = allScores[activeTab] || { totalScore: par, putts: 2, pens: 0 };

  const Stepper = ({ label, val, onChange, color = "bg-gray-700" }: any) => (
    <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl mb-3 border border-gray-700">
      <span className="text-gray-300 font-bold">{label}</span>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => onChange(-1)} className={`w-10 h-10 rounded-xl ${color} text-white font-bold flex items-center justify-center hover:brightness-110 active:scale-95 transition-all`}>
            <Minus size={18} />
        </button>
        <span className="w-8 text-center text-xl font-bold text-white">{val}</span>
        <button type="button" onClick={() => onChange(1)} className={`w-10 h-10 rounded-xl ${color} text-white font-bold flex items-center justify-center hover:brightness-110 active:scale-95 transition-all`}>
            <Plus size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 shrink-0">
        <h3 className="text-lg font-bold text-white">Hole {holeNum} Result</h3>
        <button type="button" onClick={onClose}><X className="text-gray-400" /></button>
      </div>
      
      {/* Player Tabs */}
      {Object.keys(allScores).length > 1 && (
          <div className="bg-gray-900 p-2 flex gap-2 overflow-x-auto border-b border-gray-800">
              {Object.keys(allScores).map(p => (
                  <button
                    key={p}
                    onClick={() => setActiveTab(p)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === p ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                  >
                      {p === currentPlayer ? 'Me' : p.replace('Guest: ', '')}
                      <span className="ml-1 opacity-70">({allScores[p].totalScore})</span>
                  </button>
              ))}
          </div>
      )}

      <div className="p-6 overflow-y-auto">
        <div className="text-center mb-8 bg-gray-800/50 p-4 rounded-2xl border border-gray-700 relative">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Score ({activeTab === currentPlayer ? 'You' : activeTab.replace('Guest: ', '')})</div>
            <div className="flex items-center justify-center gap-6">
                <button onClick={() => updateScore(activeTab, 'totalScore', -1)} className="w-12 h-12 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 active:scale-95 transition-all">
                    <Minus size={24}/>
                </button>
                <span className={`text-6xl font-black ${currentData.totalScore < par ? 'text-red-500' : currentData.totalScore > par ? 'text-blue-500' : 'text-white'}`}>
                    {currentData.totalScore}
                </span>
                <button onClick={() => updateScore(activeTab, 'totalScore', 1)} className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-500 active:scale-95 transition-all shadow-lg shadow-green-900/50">
                    <Plus size={24}/>
                </button>
            </div>
            <div className="mt-2 text-sm text-gray-400">Par {par}</div>
        </div>
        <div className="space-y-1">
            <Stepper label="Putts" val={currentData.putts} onChange={(d: number) => updateScore(activeTab, 'putts', d)} />
            <Stepper label="Penalties" val={currentData.pens} onChange={(d: number) => updateScore(activeTab, 'pens', d)} color="bg-red-900/40" />
        </div>
        
        {activeTab === currentPlayer && (
            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20 mb-4 mt-4 text-center">
                <p className="text-xs text-blue-300">
                    Calculated Shots to Green: <span className="font-bold text-white text-sm">{Math.max(0, currentData.totalScore - currentData.putts - currentData.pens)}</span>
                </p>
            </div>
        )}

        <button 
          type="button"
          onClick={() => onSave(allScores)}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 mt-4"
        >
          <Check size={20} /> Save All Scores
        </button>
      </div>
    </ModalOverlay>
  );
};

export const ShotConfirmModal = ({
  dist,
  club,
  isGPS,
  clubs,
  onConfirm,
  onCancel,
  onChangeClub,
  isLongDistWarning
}: {
  dist: string,
  club: ClubStats,
  isGPS: boolean,
  clubs: ClubStats[],
  onConfirm: () => void,
  onCancel: () => void,
  onChangeClub: (c: ClubStats) => void,
  isLongDistWarning: boolean
}) => {
  if (!club) return null;
  return (
    <ModalOverlay onClose={onCancel}>
      <div className="p-4 bg-gray-900 border-b border-gray-800 shrink-0">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {isGPS ? <MapPin size={18} className="text-blue-500" /> : <Target size={18} className="text-purple-500" />}
          Confirm Shot
        </h3>
      </div>
      <div className="p-6 space-y-5 overflow-y-auto bg-gray-900">
        {isLongDistWarning && (
           <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-3">
             <AlertTriangle className="text-red-500 shrink-0" size={20} />
             <div className="text-xs text-red-200">
               <strong>GPS Warning:</strong> Location is &gt;500m from previous shot.
             </div>
           </div>
        )}
        <div className="text-center py-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
          <div className="text-5xl font-black text-white tracking-tight">{dist}</div>
          <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Total Distance</div>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-bold mb-2 block uppercase tracking-wider">Club Used</label>
          <div className="relative group">
            <select 
              className="w-full bg-gray-800 text-white p-4 pr-10 rounded-xl outline-none border border-gray-700 appearance-none font-bold text-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              value={club.name}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const selectedName = e.target.value;
                const c = (clubs || []).find(cl => cl.name === selectedName);
                if (c) onChangeClub(c);
              }}
            >
              {(clubs || []).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 group-hover:text-white transition-colors">
              <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={(e) => { e.preventDefault(); onCancel(); }} className="flex-1 bg-gray-800 text-gray-300 py-3.5 rounded-xl font-bold border border-gray-700">Cancel</button>
          <button type="button" onClick={(e) => { e.preventDefault(); onConfirm(); }} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/30">Confirm Shot</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export const HoleSelectorModal = ({ holes, currentIdx, onSelect, onClose }: { holes: GolfHole[], currentIdx: number, onSelect: (i: number) => void, onClose: () => void }) => {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-4 border-b border-gray-800 shrink-0">
        <h3 className="text-lg font-bold text-white">Select Hole</h3>
      </div>
      <div className="p-4 grid grid-cols-4 gap-3 overflow-y-auto">
        {holes.map((h, i) => (
          <button 
            type="button"
            key={h.number}
            onClick={() => onSelect(i)}
            className={`aspect-square rounded-xl flex flex-col items-center justify-center border ${currentIdx === i ? 'bg-green-600 border-green-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
          >
            <span className="font-bold text-lg">{h.number}</span>
            <span className="text-[10px]">Par {h.par}</span>
          </button>
        ))}
      </div>
    </ModalOverlay>
  );
};

export const FullScorecardModal = ({ 
  holes, 
  scorecard, 
  onFinishRound, 
  onClose 
}: { 
  holes: GolfHole[], 
  scorecard: HoleScore[], 
  onFinishRound: () => void, 
  onClose: () => void 
}) => {
  const getTotal = (metric: 'par' | 'score' | 'putts') => {
    if (metric === 'par') return holes.reduce((a, b) => a + b.par, 0);
    return scorecard.reduce((acc, h) => {
      if (metric === 'score') return acc + h.shotsTaken + h.putts + h.penalties;
      if (metric === 'putts') return acc + h.putts;
      return acc;
    }, 0);
  };
  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500"/> Scorecard
        </h3>
        <button type="button" onClick={onClose}><X className="text-gray-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-500 uppercase bg-gray-800">
            <tr>
              <th className="px-3 py-2 rounded-l-lg">Hole</th>
              <th className="px-3 py-2">Par</th>
              <th className="px-3 py-2 font-bold text-white">Score</th>
              <th className="px-3 py-2 rounded-r-lg">Putts</th>
            </tr>
          </thead>
          <tbody>
            {holes.map((hole) => {
              const record = scorecard.find(s => s.holeNumber === hole.number);
              const scoreVal = record ? record.shotsTaken + record.putts + record.penalties : null;
              const scoreDisplay = scoreVal !== null ? scoreVal : '-';
              const puttsDisplay = record ? record.putts : '-';
              let scoreClass = '';
              if (scoreVal !== null) {
                if (scoreVal < hole.par) scoreClass = 'text-red-400 font-bold';
                else if (scoreVal > hole.par) scoreClass = 'text-blue-400';
                else scoreClass = 'text-white';
              }
              return (
                <tr key={hole.number} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-3 py-3 font-medium text-white">{hole.number}</td>
                  <td className="px-3 py-3">{hole.par}</td>
                  <td className={`px-3 py-3 ${scoreClass}`}>{scoreDisplay}</td>
                  <td className="px-3 py-3">{puttsDisplay}</td>
                </tr>
              );
            })}
            <tr className="bg-gray-800 font-bold text-white">
              <td className="px-3 py-3 rounded-l-lg">TOT</td>
              <td className="px-3 py-3">{getTotal('par')}</td>
              <td className="px-3 py-3 text-yellow-400">{getTotal('score')}</td>
              <td className="px-3 py-3 rounded-r-lg">{getTotal('putts')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-800 shrink-0 bg-gray-900">
        <button type="button" onClick={onFinishRound} className="w-full bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Flag size={20} /> Finish Round & Save
        </button>
      </div>
    </ModalOverlay>
  );
};
