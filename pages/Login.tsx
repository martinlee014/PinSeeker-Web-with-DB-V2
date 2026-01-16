
import { useState, useContext, FormEvent, useEffect } from 'react';
import { AppContext } from '../App';
import { Loader2, Cloud, ArrowRight, Activity } from 'lucide-react';
import * as MathUtils from '../services/mathUtils';
import { CloudService } from '../services/supabase';

const Login = () => {
  const { login, updateHdcp, updateBag, isOnline } = useContext(AppContext);
  const [step, setStep] = useState<'username' | 'hdcp'>('username');
  const [name, setName] = useState('');
  const [hdcpInput, setHdcpInput] = useState(18);
  const [isLoading, setIsLoading] = useState(false);

  // Check for join code in URL to show specific welcome message
  const [joinCode, setJoinCode] = useState<string | null>(null);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('joinCode') || new URLSearchParams(window.location.hash.split('?')[1]).get('joinCode');
      if (code) setJoinCode(code);
  }, []);

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    
    try {
        // Check if user already exists in the cloud
        let userExists = false;
        
        if (isOnline) {
            userExists = await CloudService.checkProfileExists(name.trim());
        }

        if (userExists) {
            // User exists: Skip HDCP step and just log in
            // The App context 'login' function will pull bag data from cloud automatically
            const success = await login(name.trim());
            if (!success) {
                // Should rarely happen if checkProfileExists was true, but handle error
                alert("Login failed. Please check your connection.");
                setIsLoading(false);
            }
            // If success, App component will trigger redirect via useEffect/Routing
        } else {
            // New User (or offline): Go to HDCP setup
            setIsLoading(false);
            setStep('hdcp');
        }
    } catch (e) {
        console.error("Login Check Error", e);
        // Fallback to flow if error
        setIsLoading(false);
        setStep('hdcp');
    }
  };

  const handleFinalSubmit = async () => {
      setIsLoading(true);
      try {
          // 1. Set HDCP in context/storage
          updateHdcp(hdcpInput);

          // 2. Generate Bag based on HDCP
          const autoBag = MathUtils.generateClubsFromHdcp(hdcpInput);
          
          // 3. Perform Login (this will sync the new bag because of the logic below)
          const success = await login(name.trim());
          
          if (success) {
              // Force update the bag to the HDCP generated one, 
              // but ONLY if the cloud didn't return a custom bag (handled in App.tsx logic).
              // Actually, to ensure the "New User" experience works, we explicitly save the auto-bag
              // which triggers a cloud sync if the user was indeed new.
              // If the user was existing, App.tsx logic might overwrite this with cloud data, which is GOOD (preserve existing data).
              // So we effectively propose this bag as the "Local" bag.
              updateBag(autoBag);
          }
      } catch (e) {
          console.error(e);
          alert("Login failed. Please try again.");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gray-900">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1080")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px)'
        }}
      />
      
      <div className="bg-black/80 backdrop-blur-md p-8 rounded-2xl w-full max-w-sm mx-4 z-10 border border-gray-800 shadow-2xl transition-all duration-500">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-[0.2em] text-white mb-2">PINSEEKER</h1>
          {joinCode ? (
              <div className="inline-block bg-blue-900/50 border border-blue-500/30 rounded-lg px-3 py-1 text-blue-300 text-xs font-bold animate-pulse">
                  Joining Event: {joinCode}
              </div>
          ) : (
              <p className="text-green-400 text-sm font-medium uppercase tracking-widest flex items-center justify-center gap-2">
                <Cloud size={14} /> Cloud Enabled
              </p>
          )}
        </div>

        {step === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2">
                Identify Yourself
                </label>
                <input
                id="username"
                type="text"
                required
                autoFocus
                disabled={isLoading}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors disabled:opacity-50"
                placeholder="Enter User ID"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg transition-all transform active:scale-95 shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Next <ArrowRight size={20}/></>}
            </button>
            </form>
        )}

        {step === 'hdcp' && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center">
                    <h3 className="text-white font-bold text-lg mb-1">Setup Your Profile</h3>
                    <p className="text-gray-400 text-xs">We'll auto-configure your clubs based on your skill level.</p>
                </div>

                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 text-center">
                    <label className="block text-xs font-bold text-green-400 uppercase mb-4 flex items-center justify-center gap-2">
                        <Activity size={16}/> Your Handicap (HDCP)
                    </label>
                    
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <button 
                            onClick={() => setHdcpInput(h => Math.max(0, h - 1))}
                            className="w-12 h-12 bg-gray-800 rounded-full text-white font-bold hover:bg-gray-700 active:scale-95"
                        >
                            -
                        </button>
                        <span className="text-5xl font-black text-white w-20">{hdcpInput}</span>
                        <button 
                            onClick={() => setHdcpInput(h => Math.min(54, h + 1))}
                            className="w-12 h-12 bg-gray-800 rounded-full text-white font-bold hover:bg-gray-700 active:scale-95"
                        >
                            +
                        </button>
                    </div>
                    
                    <input 
                        type="range" 
                        min="0" max="54" 
                        value={hdcpInput} 
                        onChange={(e) => setHdcpInput(Number(e.target.value))}
                        className="w-full accent-green-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <button
                    onClick={handleFinalSubmit}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg transition-all transform active:scale-95 shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : "ENTER CLUBHOUSE"}
                </button>
                
                <button onClick={() => setStep('username')} className="w-full text-gray-500 text-xs hover:text-white">
                    Back to Username
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Login;
