
import { useState, ReactNode, ChangeEvent, useEffect, FC, Fragment } from 'react';
import { X, Check, AlertTriangle, MapPin, Trophy, Flag, Target, Minus, Plus, Zap, Cloud, Smartphone, RefreshCw, Users, AlertCircle } from 'lucide-react';
import { ClubStats, GolfHole, HoleScore, RoundHistory } from '../types';

// Updated ModalOverlay with optional maxWidth prop
export const ModalOverlay = ({ 
    children, 
    onClose, 
    className = "max-w-sm" // Default width
}: { 
    children?: ReactNode, 
    onClose?: () => void,
    className?: string 
}) => (
  <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
    <div 
      className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      onClick={(e) => {
        e.preventDefault();
        if(onClose) onClose();
      }} 
    />
    <div 
      className={`bg-gray-900 rounded-2xl border border-gray-700 w-full relative z-10 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto ${className}`}
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
    cloudDate?: string, 
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

export const ScoreConflictModal = ({
    conflicts,
    onResolve,
    onCancel
}: {
    conflicts: { player: string, cloudScore: number, localScore: number }[],
    onResolve: (resolutions: Record<string, 'local' | 'cloud'>) => void,
    onCancel: () => void
}) => {
    const [decisions, setDecisions] = useState<Record<string, 'local' | 'cloud'>>({});

    useEffect(() => {
        const initial: Record<string, 'local' | 'cloud'> = {};
        conflicts.forEach(c => initial[c.player] = 'cloud'); // Default to Cloud trust
        setDecisions(initial);
    }, [conflicts]);

    const handleToggle = (player: string) => {
        setDecisions(prev => ({
            ...prev,
            [player]: prev[player] === 'local' ? 'cloud' : 'local'
        }));
    };

    return (
        <ModalOverlay onClose={onCancel}>
             <div className="p-4 border-b border-gray-800 bg-red-900/20 shrink-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" /> Score Conflict
                </h3>
            </div>
            <div className="p-4">
                <p className="text-sm text-gray-300 mb-4">
                    Some scores you entered differ from what is already saved in the cloud (possibly entered by the player themselves).
                </p>
                <div className="space-y-3 mb-4">
                    {conflicts.map(c => (
                        <div key={c.player} className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                            <div className="text-white font-bold mb-2">{c.player.replace('Guest: ', '')}</div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setDecisions({...decisions, [c.player]: 'cloud'})}
                                    className={`flex-1 p-2 rounded-lg text-xs font-bold border transition-all ${decisions[c.player] === 'cloud' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}
                                >
                                    Cloud: {c.cloudScore}
                                </button>
                                <button 
                                    onClick={() => setDecisions({...decisions, [c.player]: 'local'})}
                                    className={`flex-1 p-2 rounded-lg text-xs font-bold border transition-all ${decisions[c.player] === 'local' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}
                                >
                                    Yours: {c.localScore}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => onResolve(decisions)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                >
                    Resolve & Save
                </button>
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

interface PlayerRowProps {
    player: string;
    data: PlayerScoreState;
    isCurrentPlayer: boolean;
    par: number;
    onUpdate: (field: keyof PlayerScoreState, delta: number) => void;
}

const PlayerRow: FC<PlayerRowProps> = ({ 
    player, 
    data, 
    isCurrentPlayer, 
    par, 
    onUpdate 
}) => (
      <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 mb-3 animate-in slide-in-from-right-4">
          <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-white text-sm truncate max-w-[120px]">
                  {isCurrentPlayer ? 'You' : player.replace('Guest: ', '')}
              </span>
              <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                      <button onClick={() => onUpdate('totalScore', -1)} className="w-8 h-8 rounded bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 active:scale-95"><Minus size={16}/></button>
                      <span className={`text-xl font-black w-8 text-center ${data.totalScore < par ? 'text-red-400' : data.totalScore > par ? 'text-blue-400' : 'text-white'}`}>{data.totalScore}</span>
                      <button onClick={() => onUpdate('totalScore', 1)} className="w-8 h-8 rounded bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 active:scale-95"><Plus size={16}/></button>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 justify-end bg-gray-900/50 p-1.5 rounded-lg">
              <div className="flex items-center gap-2">
                  <span>Putts</span>
                  <button onClick={() => onUpdate('putts', -1)} className="w-6 h-6 rounded bg-gray-700 text-white flex items-center justify-center"><Minus size={12}/></button>
                  <span className="font-bold text-white w-4 text-center">{data.putts}</span>
                  <button onClick={() => onUpdate('putts', 1)} className="w-6 h-6 rounded bg-gray-700 text-white flex items-center justify-center"><Plus size={12}/></button>
              </div>
              <div className="w-[1px] h-4 bg-gray-700"></div>
              <div className="flex items-center gap-2">
                  <span>Pen</span>
                  <button onClick={() => onUpdate('pens', -1)} className="w-6 h-6 rounded bg-gray-700 text-white flex items-center justify-center"><Minus size={12}/></button>
                  <span className="font-bold text-white w-4 text-center">{data.pens}</span>
                  <button onClick={() => onUpdate('pens', 1)} className="w-6 h-6 rounded bg-gray-700 text-white flex items-center justify-center"><Plus size={12}/></button>
              </div>
          </div>
      </div>
);

export const ScoreModal = ({ 
  par, 
  holeNum, 
  recordedShots,
  currentPlayer,
  players = [], 
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
  // Use lazy initialization for state. This ensures logic runs ONLY ONCE when modal opens.
  // This fixes the bug where background updates (like GPS) caused PlayRound to re-render,
  // which updated props, triggered useEffect, and reset the user's manual score entry.
  const [allScores, setAllScores] = useState<Record<string, PlayerScoreState>>(() => {
      const initial: Record<string, PlayerScoreState> = {};
      const list = players.length > 0 ? players : [currentPlayer];
      
      list.forEach(p => {
          const isMain = p === currentPlayer;
          // Default to Par, or if "Me", use recorded shots + 2 putts assumption
          initial[p] = {
              putts: 2,
              pens: 0,
              totalScore: isMain ? Math.max(par, recordedShots + 2) : par
          };
      });
      return initial;
  });

  const updateScore = (player: string, field: keyof PlayerScoreState, delta: number) => {
      setAllScores(prev => {
          const pScore = { ...prev[player] };
          
          if (field === 'totalScore') {
              const minScore = pScore.putts + pScore.pens + 1;
              pScore.totalScore = Math.max(minScore, pScore.totalScore + delta);
          } else if (field === 'putts') {
              pScore.putts = Math.max(0, pScore.putts + delta);
              // Auto-update total if putts change
              pScore.totalScore = Math.max(1, pScore.totalScore + (pScore.putts - (prev[player].putts))); 
          } else if (field === 'pens') {
              pScore.pens = Math.max(0, pScore.pens + delta);
              // Auto-update total if pens change
              pScore.totalScore = Math.max(1, pScore.totalScore + (pScore.pens - (prev[player].pens)));
          }
          return { ...prev, [player]: pScore };
      });
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
        <h3 className="text-lg font-bold text-white">Hole {holeNum} <span className="text-gray-500 text-sm ml-2">Par {par}</span></h3>
        <button type="button" onClick={onClose}><X className="text-gray-400" /></button>
      </div>

      <div className="p-4 overflow-y-auto bg-gray-900 flex-1">
          {Object.keys(allScores).map(p => (
              <PlayerRow 
                  key={p} 
                  player={p} 
                  data={allScores[p]} 
                  isCurrentPlayer={p === currentPlayer}
                  par={par}
                  onUpdate={(field, delta) => updateScore(p, field, delta)}
              />
          ))}
      </div>
      
      <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
        <button 
            type="button"
            onClick={() => onSave(allScores)}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
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

// --- Reusable Scorecard Table for Horizontal Scrolling ---
export const ScorecardTable = ({ holes, scorecards }: { holes: {number: number, par: number}[], scorecards: RoundHistory[] }) => {
  const getScore = (card: RoundHistory, holeNum: number) => {
      const s = card.scorecard.find(h => h.holeNumber === holeNum);
      return s ? s.shotsTaken + s.putts + s.penalties : null;
  };

  const getTotals = (card: RoundHistory) => {
      return card.scorecard.reduce((acc, h) => acc + h.shotsTaken + h.putts + h.penalties, 0);
  };
  
  // Use fixed column width to ensure scrolling trigger
  const colWidth = "minmax(90px, 1fr)"; 

  return (
    <div className="flex-1 overflow-auto bg-gray-900 relative">
        <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(${scorecards.length}, ${colWidth})` }}>
            {/* Header Row */}
            <div className="sticky left-0 top-0 z-30 bg-gray-800 p-3 border-b border-r border-gray-700 font-bold text-gray-500 uppercase text-xs flex items-center justify-center shadow-md shadow-black/50">
                Hole
            </div>
            {scorecards.map((c, i) => (
                <div key={i} className="sticky top-0 z-20 bg-gray-800 p-3 border-b border-gray-700 font-bold text-white text-center text-xs truncate shadow-sm">
                    {c.player?.replace('Guest: ', '') || 'Player'}
                </div>
            ))}

            {/* Rows */}
            {holes.map(h => (
                <Fragment key={h.number}>
                    <div className="sticky left-0 z-10 bg-gray-900 p-2 border-b border-r border-gray-800 text-center flex flex-col justify-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                        <span className="leading-none text-white text-sm font-bold">{h.number}</span>
                        <span className="text-[9px] text-gray-500 leading-none mt-1">P{h.par}</span>
                    </div>
                    {scorecards.map((c, i) => {
                        const score = getScore(c, h.number);
                        let color = 'text-gray-500';
                        if (score) {
                            if (score < h.par) color = 'text-red-400 font-black';
                            else if (score > h.par) color = 'text-blue-400';
                            else color = 'text-white font-bold';
                        }
                        return (
                            <div key={i} className={`p-3 border-b border-gray-800 text-center text-sm flex items-center justify-center border-l border-gray-800/30 ${color}`}>
                                {score || '-'}
                            </div>
                        );
                    })}
                </Fragment>
            ))}

            {/* Totals */}
            <div className="sticky left-0 bottom-0 z-30 bg-gray-800 p-3 border-t border-r border-gray-700 font-bold text-gray-400 text-xs uppercase text-center shadow-[0_-2px_5px_-2px_rgba(0,0,0,0.5)]">
                TOT
            </div>
            {scorecards.map((c, i) => (
                <div key={i} className="sticky bottom-0 z-20 bg-gray-800 p-3 border-t border-gray-700 text-white text-center font-bold text-sm shadow-sm">
                    {getTotals(c)}
                </div>
            ))}
        </div>
    </div>
  );
};

export const FullScorecardModal = ({ 
  holes, 
  groupScorecards = [], 
  scorecard,
  onFinishRound, 
  onClose 
}: { 
  holes: GolfHole[], 
  groupScorecards?: RoundHistory[],
  scorecard?: HoleScore[], 
  onFinishRound: () => void, 
  onClose: () => void 
}) => {
  const cards = groupScorecards.length > 0 ? groupScorecards : (scorecard ? [{ scorecard, player: 'Me' } as RoundHistory] : []);

  return (
    <ModalOverlay onClose={onClose} className="max-w-4xl w-full h-[80vh]">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500"/> Group Scorecard
        </h3>
        <button type="button" onClick={onClose}><X className="text-gray-400" /></button>
      </div>
      
      <ScorecardTable holes={holes} scorecards={cards} />

      <div className="p-4 border-t border-gray-800 shrink-0 bg-gray-900">
        <button type="button" onClick={onFinishRound} className="w-full bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Flag size={20} /> Finish Round & Save
        </button>
      </div>
    </ModalOverlay>
  );
};
