

import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../App';
import { Loader2, Cloud } from 'lucide-react';

const Login = () => {
  const { login } = useContext(AppContext);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsLoading(true);
      try {
        await login(name.trim());
        // Navigation is handled by App router redirection upon user state change
      } finally {
        setIsLoading(false);
      }
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
      
      <div className="bg-black/80 backdrop-blur-md p-8 rounded-2xl w-full max-w-sm mx-4 z-10 border border-gray-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-[0.2em] text-white mb-2">PINSEEKER</h1>
          <p className="text-green-400 text-sm font-medium uppercase tracking-widest flex items-center justify-center gap-2">
            <Cloud size={14} /> Cloud Enabled
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2">
              Identify Yourself
            </label>
            <input
              id="username"
              type="text"
              required
              disabled={isLoading}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors disabled:opacity-50"
              placeholder="Enter User ID"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg transition-all transform active:scale-95 shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "ENTER CLUBHOUSE"}
          </button>
          
          <p className="text-xs text-center text-gray-500">
            Logging in on a new device will log out other sessions to prevent data conflicts.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
