
import { useLocation, useNavigate } from 'react-router-dom';
import { RoundHistory, HoleScore } from '../types';
import { ChevronLeft, Share2, MapPin, Calendar, TrendingUp, Grid3X3, AlertCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

const RoundSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { round } = location.state as { round: RoundHistory } || {};
  const [activeTab, setActiveTab] = useState<'overview' | 'scorecard'>('overview');

  if (!round) return <div className="p-10 text-center text-gray-500">No data available</div>;

  // --- Data Calculation Helper ---
  const stats = useMemo(() => {
    const front9 = round.scorecard.filter(h => h.holeNumber <= 9);
    const back9 = round.scorecard.filter(h => h.holeNumber > 9);

    const calc = (holes: HoleScore[]) => {
        const par = holes.reduce((acc, h) => acc + (Number(h.par) || 0), 0);
        
        const putts = holes.reduce((acc, h) => acc + h.putts, 0);
        const penalties = holes.reduce((acc, h) => acc + h.penalties, 0);
        const score = holes.reduce((acc, h) => acc + h.shotsTaken + h.putts + h.penalties, 0);
        
        const gir = holes.filter(h => (h.shotsTaken) <= ((Number(h.par) || 4) - 2)).length;
        
        return { par, score, putts, penalties, gir, count: holes.length };
    };

    const f = calc(front9);
    const b = calc(back9);
    const t = calc(round.scorecard);

    return { front: f, back: b, total: t };
  }, [round]);

  const scoreDiff = stats.total.score - stats.total.par;
  const scoreDiffStr = scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? 'E' : `${scoreDiff}`;
  const scoreColor = scoreDiff > 0 ? 'text-white' : scoreDiff === 0 ? 'text-yellow-400' : 'text-red-400';

  // --- Components ---

  const StatBox = ({ label, value, sub, icon: Icon }: any) => (
      <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              {Icon && <Icon size={10} />} {label}
          </div>
          <div className="text-xl font-black text-white">{value}</div>
          {sub && <div className="text-[10px] text-gray-500">{sub}</div>}
      </div>
  );

  const SplitTable = () => (
      <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/30">
          <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400 text-xs uppercase font-bold">
                  <tr>
                      <th className="py-3 pl-4 text-left">Metric</th>
                      <th className="py-3 text-center">Front 9</th>
                      <th className="py-3 text-center">Back 9</th>
                      <th className="py-3 pr-4 text-center text-white">Total</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                  <tr>
                      <td className="py-3 pl-4 text-gray-300 font-medium">Score</td>
                      <td className="py-3 text-center text-gray-400">{stats.front.score} <span className="text-[10px] text-gray-600">({stats.front.count ? (stats.front.score - stats.front.par) : '-'})</span></td>
                      <td className="py-3 text-center text-gray-400">{stats.back.score} <span className="text-[10px] text-gray-600">({stats.back.count ? (stats.back.score - stats.back.par) : '-'})</span></td>
                      <td className={`py-3 text-center font-bold ${scoreColor}`}>{stats.total.score}</td>
                  </tr>
                  <tr>
                      <td className="py-3 pl-4 text-gray-300 font-medium">Putts</td>
                      <td className="py-3 text-center text-gray-400">{stats.front.putts}</td>
                      <td className="py-3 text-center text-gray-400">{stats.back.putts}</td>
                      <td className="py-3 text-center font-bold text-orange-400">{stats.total.putts}</td>
                  </tr>
                  <tr>
                      <td className="py-3 pl-4 text-gray-300 font-medium">Penalties</td>
                      <td className="py-3 text-center text-gray-400">{stats.front.penalties}</td>
                      <td className="py-3 text-center text-gray-400">{stats.back.penalties}</td>
                      <td className="py-3 text-center font-bold text-red-400">{stats.total.penalties}</td>
                  </tr>
                  <tr>
                      <td className="py-3 pl-4 text-gray-300 font-medium">GIR</td>
                      <td className="py-3 text-center text-gray-400">{stats.front.gir}/{stats.front.count}</td>
                      <td className="py-3 text-center text-gray-400">{stats.back.gir}/{stats.back.count}</td>
                      <td className="py-3 text-center font-bold text-green-400">{stats.total.gir}/{stats.total.count}</td>
                  </tr>
              </tbody>
          </table>
      </div>
  );

  const ScorecardGrid = () => {
      // Helper to render a row of holes (1-9 or 10-18)
      const renderRow = (start: number, end: number, label: string, statsObj: any) => {
        const holesSlice = round.scorecard.filter(h => h.holeNumber >= start && h.holeNumber <= end);
        // Fill gaps if not all holes played
        const displayHoles = Array.from({length: 9}, (_, i) => {
            const num = start + i;
            return holesSlice.find(h => h.holeNumber === num) || { holeNumber: num, par: '-', shotsTaken: 0, putts: 0, penalties: 0 };
        });

        return (
            <div className="mb-6">
                <div className="flex bg-gray-800 rounded-t-lg border-b border-gray-700">
                    <div className="w-12 p-2 text-[10px] font-bold text-gray-500 uppercase flex items-center justify-center border-r border-gray-700">Hole</div>
                    {displayHoles.map(h => (
                        <div key={h.holeNumber} className="flex-1 p-2 text-center text-xs font-bold text-white border-r border-gray-700 last:border-0">{h.holeNumber}</div>
                    ))}
                    <div className="w-12 p-2 text-center text-xs font-black text-gray-300 bg-gray-700/50 rounded-tr-lg">{label}</div>
                </div>
                {/* Par Row */}
                <div className="flex bg-gray-900 border-b border-gray-800">
                    <div className="w-12 p-2 text-[10px] text-gray-500 font-bold border-r border-gray-800">Par</div>
                    {displayHoles.map(h => (
                        <div key={h.holeNumber} className="flex-1 p-2 text-center text-xs text-gray-400 border-r border-gray-800 last:border-0">{h.par}</div>
                    ))}
                    <div className="w-12 p-2 text-center text-xs font-bold text-gray-400 bg-gray-800/30">{statsObj.count > 0 ? statsObj.par : '-'}</div>
                </div>
                {/* Score Row */}
                <div className="flex bg-gray-900 border-b border-gray-800">
                    <div className="w-12 p-2 text-[10px] text-gray-500 font-bold border-r border-gray-800">Score</div>
                    {displayHoles.map(h => {
                        // More robust score check: if shotsTaken > 0, we calculate score, regardless of par type validity (though par is needed for color)
                        const rawScore = h.shotsTaken + h.putts + h.penalties;
                        const parVal = Number(h.par);
                        const hasPar = !isNaN(parVal) && parVal > 0;
                        const score = rawScore > 0 ? rawScore : 0;
                        
                        let color = 'text-white';
                        if (score > 0 && hasPar) {
                            if (score < parVal) color = 'text-red-400 font-black'; // Birdie or better
                            else if (score > parVal) color = 'text-blue-400'; // Bogey or worse
                        }
                        return (
                            <div key={h.holeNumber} className={`flex-1 p-2 text-center text-sm font-bold border-r border-gray-800 last:border-0 ${color}`}>
                                {score > 0 ? score : '-'}
                            </div>
                        );
                    })}
                    <div className="w-12 p-2 text-center text-sm font-black text-white bg-gray-800/30">{statsObj.count > 0 ? statsObj.score : '-'}</div>
                </div>
                {/* Putts Row */}
                <div className="flex bg-gray-900">
                    <div className="w-12 p-2 text-[10px] text-gray-500 font-bold border-r border-gray-800">Putts</div>
                    {displayHoles.map(h => (
                        <div key={h.holeNumber} className="flex-1 p-2 text-center text-xs text-orange-300 border-r border-gray-800 last:border-0">
                             {h.putts > 0 || (h.shotsTaken > 0) ? h.putts : '-'}
                        </div>
                    ))}
                    <div className="w-12 p-2 text-center text-xs font-bold text-orange-400 bg-gray-800/30">{statsObj.count > 0 ? statsObj.putts : '-'}</div>
                </div>
            </div>
        );
      };

      return (
          <div className="overflow-x-auto">
              <div className="min-w-[600px] md:min-w-full">
                {renderRow(1, 9, 'OUT', stats.front)}
                {renderRow(10, 18, 'IN', stats.back)}
                
                {/* Total Row Summary */}
                <div className="flex justify-end mt-4 px-2">
                    <div className="bg-gray-800 rounded-lg p-3 flex gap-6 border border-gray-700">
                        <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase">Total Par</div>
                            <div className="font-bold text-white">{stats.total.par}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase">Total Score</div>
                            <div className="font-bold text-xl text-white">{stats.total.score}</div>
                        </div>
                         <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase">Net</div>
                            <div className={`font-bold text-xl ${scoreColor}`}>{scoreDiffStr}</div>
                        </div>
                    </div>
                </div>
              </div>
              <div className="md:hidden text-center text-[10px] text-gray-500 mt-2 italic">
                  Scroll horizontally to view full scorecard
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 pb-safe">
      {/* Header */}
      <div className="p-4 bg-gray-900 border-b border-gray-800 shadow-md z-10 sticky top-0">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <ChevronLeft className="text-white" size={20} />
            </button>
            <h1 className="font-bold text-white tracking-widest text-sm uppercase">Round Analysis</h1>
            <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <Share2 className="text-white" size={20} />
            </button>
          </div>
          <div className="text-center">
              <h2 className="text-white font-bold text-lg leading-tight mb-1">{round.courseName}</h2>
              <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={12}/> {round.date}</span>
                  <span className="flex items-center gap-1"><MapPin size={12}/> {stats.total.count} Holes</span>
              </div>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Big Score Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
              
              <div className="relative z-10">
                  <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Total Score</div>
                  <div className={`text-6xl font-black ${scoreColor} tracking-tighter mb-1`}>{stats.total.score}</div>
                  <div className="inline-block px-3 py-1 bg-black/40 rounded-full text-xs font-mono text-gray-300 border border-white/10">
                      {scoreDiffStr} ({stats.total.par})
                  </div>
              </div>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
              <StatBox 
                label="Putts" 
                value={stats.total.putts} 
                sub={`Avg ${(stats.total.putts / (stats.total.count || 1)).toFixed(1)}`}
                icon={Grid3X3}
              />
              <StatBox 
                label="GIR" 
                value={`${Math.round((stats.total.gir / (stats.total.count || 1)) * 100)}%`}
                sub={`${stats.total.gir}/${stats.total.count}`}
                icon={TrendingUp}
              />
              <StatBox 
                label="Penalties" 
                value={stats.total.penalties}
                sub="Strokes Lost"
                icon={AlertCircle}
              />
              <StatBox 
                label="Scrambling" 
                value="--" // Placeholder for future logic
                sub="Up & Down"
                icon={Share2}
              />
          </div>

          {/* Toggle Switch */}
          <div className="bg-gray-800 p-1 rounded-xl flex">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-gray-700 text-white shadow' : 'text-gray-500'}`}
              >
                  Overview
              </button>
              <button 
                onClick={() => setActiveTab('scorecard')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'scorecard' ? 'bg-gray-700 text-white shadow' : 'text-gray-500'}`}
              >
                  Detailed Scorecard
              </button>
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'overview' ? (
                <div>
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3">Front / Back Split</h3>
                    <SplitTable />
                    
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3 mt-6">Hole Performance</h3>
                    <div className="space-y-2">
                        {round.scorecard.map((h, i) => {
                             const score = h.shotsTaken + h.putts + h.penalties;
                             const parVal = Number(h.par);
                             let badgeColor = "border-gray-700 text-gray-400";
                             
                             if (!isNaN(parVal)) {
                                 if (score < parVal) badgeColor = "border-red-500/50 text-red-400 bg-red-900/10";
                                 else if (score > parVal) badgeColor = "border-blue-500/50 text-blue-400 bg-blue-900/10";
                                 else badgeColor = "border-green-500/50 text-green-400 bg-green-900/10";
                             }

                            return (
                                <div key={h.holeNumber} onClick={() => navigate('/play', { state: { round, initialHoleIndex: i } })} className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${badgeColor}`}>
                                            {h.holeNumber}
                                        </div>
                                        <div>
                                            <div className="text-sm text-white font-bold">Par {h.par}</div>
                                            <div className="text-[10px] text-gray-500">{h.putts} Putts {h.penalties > 0 && `• ${h.penalties} Pen`}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-lg font-black ${!isNaN(parVal) && score < parVal ? 'text-red-400' : !isNaN(parVal) && score > parVal ? 'text-blue-400' : 'text-white'}`}>{score}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div>
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3">Full Scorecard</h3>
                    <ScorecardGrid />
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default RoundSummary;
