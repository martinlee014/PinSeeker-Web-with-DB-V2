
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { CloudService } from '../services/supabase';
import { StorageService } from '../services/storage';
import { Tournament, LeaderboardEntry, GolfCourse } from '../types';
import { Trophy, Plus, User, Hash, ArrowRight, Loader2, Calendar, MapPin, Play, Eye, Users, CheckCircle2 } from 'lucide-react';
import { ModalOverlay } from '../components/Modals';

const Tournaments = () => {
    const { user, isOnline } = useContext(AppContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'my' | 'join'>('my');
    
    // Data State
    const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Join State
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    // Create State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTourName, setNewTourName] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
    const [availableCourses, setAvailableCourses] = useState<GolfCourse[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Leaderboard State
    const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoadingLB, setIsLoadingLB] = useState(false);

    // Scorer Mode State
    const [participants, setParticipants] = useState<string[]>([]);
    const [showScorerModal, setShowScorerModal] = useState(false);
    const [selectedPlayerToScore, setSelectedPlayerToScore] = useState<string | null>(null);

    useEffect(() => {
        loadTournaments();
        // Load local courses for creation dropdown
        setAvailableCourses(StorageService.getAllCourses());
    }, [user, isOnline]);

    const loadTournaments = async () => {
        if (!user || !isOnline) return;
        setIsLoading(true);
        try {
            const list = await CloudService.getMyTournaments(user);
            setMyTournaments(list);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!joinCode || !user) return;
        setIsJoining(true);
        try {
            const res = await CloudService.joinTournament(joinCode.toUpperCase(), user);
            if (res.success) {
                alert("Joined successfully!");
                setJoinCode('');
                setActiveTab('my');
                loadTournaments();
            } else {
                alert("Failed to join: " + (res.error || "Unknown error"));
            }
        } finally {
            setIsJoining(false);
        }
    };

    const handleCreate = async () => {
        if (!newTourName || !selectedCourse || !user) return;
        setIsCreating(true);
        try {
            const res = await CloudService.createTournament(newTourName, selectedCourse, user);
            if (res.success) {
                alert("Tournament Created! Code: " + res.code);
                setShowCreateModal(false);
                setNewTourName('');
                loadTournaments();
            } else {
                alert("Error: " + res.error);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const openLeaderboard = async (t: Tournament) => {
        setActiveTournament(t);
        setIsLoadingLB(true);
        try {
            const [lb, parts] = await Promise.all([
                CloudService.getTournamentLeaderboard(t.id),
                CloudService.getTournamentParticipants(t.id)
            ]);
            setLeaderboard(lb);
            setParticipants(parts);
        } finally {
            setIsLoadingLB(false);
        }
    };

    const initiatePlay = () => {
        if (!activeTournament) return;
        // Open modal to choose who to score for
        setSelectedPlayerToScore(user); // Default to self
        setShowScorerModal(true);
    };

    const startRoundForPlayer = () => {
        if (!activeTournament || !selectedPlayerToScore) return;
        
        // Find the course object
        const allCourses = StorageService.getAllCourses();
        // Match by ID or Name (Fallback)
        let course = allCourses.find(c => c.id === activeTournament.courseId || c.name === activeTournament.courseName);
        
        if (!course) {
            alert("The course data for this tournament is not in your local library. Please download it from the Course Database first.");
            return;
        }

        setShowScorerModal(false);
        navigate('/play', { 
            state: { 
                course, 
                tournamentId: activeTournament.id,
                playerOverride: selectedPlayerToScore === user ? undefined : selectedPlayerToScore
            } 
        });
    };

    const spectateRound = (entry: LeaderboardEntry) => {
        navigate('/play', { 
            state: { 
                round: entry.roundData 
            } 
        });
    };

    if (!isOnline) {
        return (
            <div className="p-10 text-center text-gray-500">
                <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                <h2 className="text-xl font-bold text-white mb-2">Offline</h2>
                <p>Tournaments require an internet connection.</p>
            </div>
        );
    }

    if (activeTournament) {
        return (
            <div className="p-4 flex flex-col h-full bg-gray-900">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setActiveTournament(null)} className="p-2 bg-gray-800 rounded-lg text-white">
                        <ArrowRight className="rotate-180" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white leading-none">{activeTournament.name}</h1>
                        <span className="text-xs text-gray-500">Code: <span className="font-mono text-yellow-400 select-all">{activeTournament.joinCode}</span></span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/50 to-gray-900 p-6 rounded-2xl border border-blue-500/30 mb-6 text-center">
                     <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{activeTournament.courseName}</h2>
                     <button 
                        onClick={initiatePlay}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                     >
                         <Play fill="white" size={20} /> Play Round
                     </button>
                </div>

                <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-500" /> Leaderboard
                </h3>

                {isLoadingLB ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white"/></div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-800/30 rounded-xl border border-gray-700 border-dashed">
                        No scores posted yet. Be the first!
                    </div>
                ) : (
                    <div className="space-y-2">
                        {leaderboard.map((entry, idx) => (
                            <div key={idx} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-orange-700 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm">{entry.username}</div>
                                        <div className="text-[10px] text-gray-500">Thru {entry.thru}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`text-xl font-black ${entry.totalScore < 72 ? 'text-red-400' : 'text-white'}`}>
                                        {entry.totalScore}
                                    </div>
                                    <button 
                                        onClick={() => spectateRound(entry)}
                                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400"
                                        title="Spectate / Replay"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SCORER MODAL */}
                {showScorerModal && (
                    <ModalOverlay onClose={() => setShowScorerModal(false)}>
                        <div className="p-4 border-b border-gray-800 bg-gray-900 shrink-0">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users size={18} className="text-blue-500"/> Who are you scoring for?
                            </h3>
                        </div>
                        <div className="p-4 bg-gray-900 max-h-[60vh] overflow-y-auto space-y-2">
                            <button
                                onClick={() => setSelectedPlayerToScore(user)}
                                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${selectedPlayerToScore === user ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            >
                                <span className="font-bold flex items-center gap-2"><User size={16}/> Me ({user})</span>
                                {selectedPlayerToScore === user && <CheckCircle2 size={20} className="text-blue-500"/>}
                            </button>
                            
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-4 mb-2">Other Participants</div>
                            
                            {participants.filter(p => p !== user).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setSelectedPlayerToScore(p)}
                                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${selectedPlayerToScore === p ? 'bg-orange-600/20 border-orange-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    <span className="font-bold">{p}</span>
                                    {selectedPlayerToScore === p && <CheckCircle2 size={20} className="text-orange-500"/>}
                                </button>
                            ))}
                            
                            {participants.filter(p => p !== user).length === 0 && (
                                <div className="text-center text-gray-600 text-sm py-4 italic">
                                    No other players have joined yet.
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-900 border-t border-gray-800">
                            <button 
                                onClick={startRoundForPlayer}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                            >
                                Start Round {selectedPlayerToScore !== user ? `for ${selectedPlayerToScore}` : ''}
                            </button>
                        </div>
                    </ModalOverlay>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-col h-full bg-gray-900">
            <h1 className="text-2xl font-bold text-white mb-6">Tournaments</h1>

            {/* Tabs */}
            <div className="flex bg-gray-800 p-1 rounded-xl mb-6">
                <button 
                    onClick={() => setActiveTab('my')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my' ? 'bg-gray-700 text-white shadow' : 'text-gray-500'}`}
                >
                    My Events
                </button>
                <button 
                    onClick={() => setActiveTab('join')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'join' ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}
                >
                    Join / Create
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                {activeTab === 'my' && (
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white"/></div>
                        ) : myTournaments.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                                <p>You haven't joined any tournaments.</p>
                            </div>
                        ) : (
                            myTournaments.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => openLeaderboard(t)}
                                    className="w-full bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center hover:bg-gray-750 transition-colors text-left group"
                                >
                                    <div>
                                        <div className="text-white font-bold text-lg">{t.name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <MapPin size={10} /> {t.courseName}
                                        </div>
                                    </div>
                                    <div className="bg-gray-900 p-2 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                                        <ArrowRight size={20} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'join' && (
                    <div className="space-y-6">
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Hash className="text-blue-500" size={20} /> Join by Code
                            </h3>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter 6-digit code" 
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white uppercase font-mono tracking-widest focus:border-blue-500 outline-none"
                                    maxLength={6}
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                />
                                <button 
                                    onClick={handleJoin}
                                    disabled={isJoining || joinCode.length < 6}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold disabled:opacity-50"
                                >
                                    {isJoining ? <Loader2 className="animate-spin"/> : 'JOIN'}
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-900 text-gray-500">OR</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between group hover:brightness-110 transition-all"
                        >
                            <div className="text-left">
                                <div className="font-bold text-xl">Host Tournament</div>
                                <div className="text-green-100 text-sm opacity-80">Create new event & invite friends</div>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <Plus size={24} />
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <ModalOverlay onClose={() => setShowCreateModal(false)}>
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-500"/> Create Event
                        </h3>
                    </div>
                    <div className="p-6 bg-gray-900 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Name</label>
                            <input 
                                type="text"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
                                placeholder="e.g. Sunday Scramble"
                                value={newTourName}
                                onChange={e => setNewTourName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course</label>
                            <select 
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
                                onChange={e => {
                                    const c = availableCourses.find(course => course.id === e.target.value);
                                    setSelectedCourse(c || null);
                                }}
                            >
                                <option value="">Select a Course</option>
                                {availableCourses.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={handleCreate}
                            disabled={isCreating || !newTourName || !selectedCourse}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                        >
                            {isCreating ? <Loader2 className="animate-spin"/> : 'Create & Join'}
                        </button>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
};

export default Tournaments;
