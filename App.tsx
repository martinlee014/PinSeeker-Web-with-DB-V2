
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Play, Map as MapIcon, Settings as SettingsIcon, WifiOff, Trophy } from 'lucide-react';
import { StorageService } from './services/storage';
import { CloudService } from './services/supabase';
import { ClubStats } from './types';
import { DEFAULT_BAG } from './constants';
import Onboarding from './components/Onboarding';
import { BagSyncConflictModal } from './components/Modals';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlayRound from './pages/PlayRound';
import RoundSummary from './pages/RoundSummary';
import Settings from './pages/Settings';
import UserManual from './pages/UserManual';
import ClubManagement from './pages/ClubManagement';
import CourseManager from './pages/CourseManager';
import CourseEditor from './pages/CourseEditor';
import Tournaments from './pages/Tournaments';

export const AppContext = createContext<{
  user: string | null;
  login: (u: string) => Promise<boolean>;
  logout: () => void;
  useYards: boolean;
  toggleUnits: () => void;
  hdcp: number;
  updateHdcp: (val: number) => void;
  bag: ClubStats[];
  updateBag: (newBag: ClubStats[], skipCloudSync?: boolean) => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  isOnline: boolean;
}>({
  user: null,
  login: async () => false,
  logout: () => {},
  useYards: false,
  toggleUnits: () => {},
  hdcp: 15,
  updateHdcp: () => {},
  bag: [],
  updateBag: () => {},
  showTutorial: false,
  setShowTutorial: () => {},
  isOnline: true,
});

const MainLayout = ({ children }: { children?: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isOnline } = useContext(AppContext);

  const isPlayMode = location.pathname.startsWith('/play');
  const isEditorMode = location.pathname.includes('/edit');
  const isClubManagement = location.pathname === '/settings/clubs';

  // Define full-screen modes where global nav/header is hidden
  const showChrome = !isPlayMode && !isEditorMode && !isClubManagement;

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-black relative shadow-2xl overflow-hidden">
      {showChrome && (
        <header className="flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))] bg-gray-900 border-b border-gray-800 z-10 shrink-0 transition-all">
          <div className="flex items-center gap-2" onClick={() => navigate('/dashboard')}>
            <MapIcon className="text-green-500" />
            <span className="font-bold text-xl tracking-wider text-white">PINSEEKER</span>
            {!isOnline && <WifiOff size={16} className="text-red-500 animate-pulse ml-2" />}
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500">
            <LogOut size={20} />
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>

      {showChrome && (
        <nav className="flex justify-around items-center p-3 bg-gray-900 border-t border-gray-800 z-10 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all">
          <NavItem icon={<User size={24} />} label="Dash" path="/dashboard" active={location.pathname === '/dashboard'} />
          <NavItem icon={<Trophy size={24} />} label="Events" path="/tournaments" active={location.pathname === '/tournaments'} />
          <div className="relative -top-5">
             <button 
               onClick={() => navigate('/play')}
               className="bg-green-600 p-4 rounded-full shadow-lg shadow-green-900/50 hover:scale-105 transition-transform border-4 border-black"
             >
               <Play fill="white" className="text-white ml-1" />
             </button>
          </div>
          <NavItem icon={<SettingsIcon size={24} />} label="Settings" path="/settings" active={location.pathname.startsWith('/settings')} />
        </nav>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, path, active }: any) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(path)}
      className={`flex flex-col items-center gap-1 ${active ? 'text-green-400' : 'text-gray-500'}`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

const App = () => {
  const [user, setUser] = useState<string | null>(StorageService.getCurrentUser());
  const [sessionId, setSessionId] = useState<string | null>(StorageService.getSessionId());
  const [useYards, setUseYards] = useState<boolean>(StorageService.getUseYards());
  const [hdcp, setHdcp] = useState<number>(StorageService.getHdcp());
  const [bag, setBag] = useState<ClubStats[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Sync Conflict State
  const [showBagSyncModal, setShowBagSyncModal] = useState(false);
  const [pendingCloudBag, setPendingCloudBag] = useState<ClubStats[] | null>(null);

  // Store join code in ref to persist across redirects/renders
  const pendingJoinCode = useRef<string | null>(null);
  const heartbeatInterval = useRef<any>(null);

  // Parse URL for join code immediately on mount
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
      const code = params.get('joinCode') || hashParams.get('joinCode');
      if (code) {
          pendingJoinCode.current = code;
          console.log("Captured Join Code:", code);
      }
  }, []);

  // Initial Load & Listeners
  useEffect(() => {
    setBag(StorageService.getBag());
    if (!StorageService.hasSeenOnboarding()) {
        setShowTutorial(true);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-Join Logic (Triggered when user becomes available)
  useEffect(() => {
      const handleAutoJoin = async () => {
          if (pendingJoinCode.current && user && isOnline) {
              const code = pendingJoinCode.current;
              console.log("Attempting auto-join for:", code);
              
              // Clear it so we don't retry in loop
              pendingJoinCode.current = null;

              const res = await CloudService.joinTournament(code.toUpperCase(), user);
              if(res.success) {
                  // Wait slightly for Router to stabilize if redirection happened
                  setTimeout(() => {
                      window.location.hash = '#/tournaments';
                  }, 500);
              } else {
                  console.error("Auto-join failed:", res.error);
                  alert("Failed to join tournament: " + res.error);
              }
          }
      };

      if (user) {
          handleAutoJoin();
      }
  }, [user, isOnline]);

  // Heartbeat / Mutex Check
  useEffect(() => {
      if (user && sessionId) {
          // Check immediately on mount
          checkSession();
          // Then every 30s
          heartbeatInterval.current = setInterval(checkSession, 30000);
      } else {
          if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      }
      return () => {
          if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      };
  }, [user, sessionId]);

  const checkSession = async () => {
      if (!user || !sessionId || !navigator.onLine) return;
      
      const isValid = await CloudService.validateSession(user, sessionId);
      if (!isValid) {
          alert("Security Alert:\nYou have logged in on another device.\n\nTo prevent data conflicts, this session has been terminated.");
          logout();
      }
  };

  const updateBag = (newBag: ClubStats[], skipCloudSync = false) => {
    setBag(newBag);
    StorageService.saveBag(newBag);
    
    // Cloud Sync
    if (!skipCloudSync && user && isOnline) {
        CloudService.syncBag(user, newBag);
    }
  };

  const login = async (username: string): Promise<boolean> => {
    try {
        // Attempt Cloud Login
        const res = await CloudService.loginAndCreateSession(username);
        
        if (res.success && res.sessionId) {
            // 1. Set Session
            StorageService.setCurrentUser(username);
            StorageService.setSessionId(res.sessionId);
            setUser(username);
            setSessionId(res.sessionId);

            // 2. Handle History (Always pull history, simple merge/overwrite strategy)
            if (res.history && res.history.length > 0) {
                StorageService.overwriteHistory(username, res.history);
            }

            // 3. Handle Bag Data with Conflict Resolution
            if (res.bag && res.bag.length > 0) {
                const localBag = StorageService.getBag();
                const isLocalDefault = JSON.stringify(localBag) === JSON.stringify(DEFAULT_BAG);
                const isDifferent = JSON.stringify(localBag) !== JSON.stringify(res.bag);

                if (isDifferent) {
                    if (isLocalDefault) {
                         // Case A: Local is untouched default -> Safe to overwrite with Cloud
                         updateBag(res.bag, true); // true = don't sync back to cloud yet
                    } else {
                         // Case B: Conflict -> Local has changes, Cloud has diff data
                         setPendingCloudBag(res.bag);
                         setShowBagSyncModal(true);
                    }
                }
            }

            return true;
        } else {
            console.warn("Cloud login incomplete, using offline mode.");
            // Offline fallback
            StorageService.setCurrentUser(username);
            setUser(username);
            return true;
        }
    } catch (e: any) {
        console.error("Login Error:", e.message || e);
        // Fallback for offline usage
        StorageService.setCurrentUser(username);
        setUser(username);
        return true;
    }
  };

  const logout = () => {
    setUser(null);
    setSessionId(null);
    StorageService.clearCurrentUser();
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
  };

  const toggleUnits = () => {
    const newVal = !useYards;
    setUseYards(newVal);
    StorageService.setUseYards(newVal);
  };

  const updateHdcp = (val: number) => {
      setHdcp(val);
      StorageService.saveHdcp(val);
  };

  
  const handleCloseTutorial = () => {
      setShowTutorial(false);
      StorageService.markOnboardingSeen();
  };

  const handleResolveBagSync = (useCloud: boolean) => {
      if (useCloud && pendingCloudBag) {
          // User chose Cloud: Overwrite local
          updateBag(pendingCloudBag, true); // Don't push back to cloud, it's the same
      } else {
          // User chose Local: Push local to cloud
          // updateBag triggers sync automatically unless skipped
          updateBag(bag, false);
      }
      setShowBagSyncModal(false);
      setPendingCloudBag(null);
  };

  return (
    <AppContext.Provider value={{ user, login, logout, useYards, toggleUnits, hdcp, updateHdcp, bag, updateBag, showTutorial, setShowTutorial, isOnline }}>
      <HashRouter>
        {showTutorial && <Onboarding onClose={handleCloseTutorial} />}
        {showBagSyncModal && (
            <BagSyncConflictModal 
                onUseCloud={() => handleResolveBagSync(true)}
                onUseLocal={() => handleResolveBagSync(false)}
            />
        )}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={<ProtectedRoute user={user}><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/tournaments" element={<ProtectedRoute user={user}><MainLayout><Tournaments /></MainLayout></ProtectedRoute>} />
          <Route path="/play" element={<ProtectedRoute user={user}><MainLayout><PlayRound /></MainLayout></ProtectedRoute>} />
          <Route path="/summary" element={<ProtectedRoute user={user}><MainLayout><RoundSummary /></MainLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute user={user}><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
          <Route path="/settings/clubs" element={<ProtectedRoute user={user}><MainLayout><ClubManagement /></MainLayout></ProtectedRoute>} />
          <Route path="/settings/courses" element={<ProtectedRoute user={user}><MainLayout><CourseManager /></MainLayout></ProtectedRoute>} />
          <Route path="/settings/courses/edit" element={<ProtectedRoute user={user}><MainLayout><CourseEditor /></MainLayout></ProtectedRoute>} />
          <Route path="/manual" element={<ProtectedRoute user={user}><MainLayout><UserManual /></MainLayout></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

const ProtectedRoute = ({ user, children }: { user: string | null, children?: ReactNode }) => {
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

export default App;
