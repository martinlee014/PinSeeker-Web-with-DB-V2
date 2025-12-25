import { useState } from 'react';
import { Target, Map, PenTool, ArrowRight, Check, ChevronLeft, BarChart3, Trophy, Wind, Layers, MapPin, Zap, Cloud, Smartphone } from 'lucide-react';

interface OnboardingProps {
  onClose: () => void;
}

const slides = [
  {
    id: 'intro',
    title: "PinSeeker v7.23",
    subtitle: "Professional Golf Strategy",
    desc: "Your high-precision electronic caddie. Built for golfers who value data-driven decisions and strategic course management.",
    icon: <MapPin size={48} className="text-green-400" />,
    bgImage: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800&auto=format&fit=crop",
    color: "bg-green-600"
  },
  {
    id: 'hdcp',
    title: "HDCP Skill Modeling",
    subtitle: "New: Intelligent Bag Setup",
    desc: "Not sure about your dispersion numbers? Input your HDCP and we'll auto-configure a professional 14-club bag with realistic carry and scatter patterns tuned to your skill level.",
    icon: <Zap size={48} className="text-yellow-400" />,
    bgImage: "https://images.unsplash.com/photo-1593111774240-d529f12db464?q=80&w=800&auto=format&fit=crop",
    color: "bg-yellow-600",
    visual: (
      <div className="flex flex-col items-center gap-2">
        <div className="bg-gray-800 p-3 rounded-xl border border-yellow-500/30 flex items-center gap-4">
           <div className="text-center">
              <div className="text-[10px] text-gray-500 font-bold uppercase">HDCP</div>
              <div className="text-2xl font-black text-white">15.0</div>
           </div>
           <ArrowRight className="text-gray-600" size={16} />
           <div className="text-center">
              <div className="text-[10px] text-gray-500 font-bold uppercase">Driver</div>
              <div className="text-lg font-black text-green-400">230yd</div>
           </div>
        </div>
        <div className="text-[10px] text-gray-500 font-medium italic">Auto-calculates side/depth error</div>
      </div>
    )
  },
  {
    id: 'dispersion',
    title: "Dispersion Strategy",
    subtitle: "Plan for the Miss",
    desc: "Visualize your 90% landing probability with dynamic blue ellipses. Adjust your aim until the entire ellipse is in the 'safe zone'—avoiding hazards even on your misses.",
    icon: <BarChart3 size={48} className="text-blue-400" />,
    bgImage: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800&auto=format&fit=crop",
    color: "bg-blue-600",
    visual: (
      <div className="relative w-32 h-32 border border-gray-600/50 rounded-full flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
        <div className="absolute w-1 h-32 bg-gray-700/50 dashed-line"></div>
        <div className="w-24 h-12 rounded-[50%] bg-blue-500/30 border border-blue-400 transform -rotate-12 animate-pulse"></div>
        <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
      </div>
    )
  },
  {
    id: 'cloud',
    title: "Cloud Ecosystem",
    subtitle: "Safe & Synchronized",
    desc: "Your profile is backed up automatically. Our single-device mutex and conflict resolution tools ensure your data stays consistent, whether you're offline or on a new phone.",
    icon: <Cloud size={48} className="text-purple-400" />,
    bgImage: "https://images.unsplash.com/photo-1527685609591-44b0aef2400b?q=80&w=800&auto=format&fit=crop",
    color: "bg-purple-600",
    visual: (
        <div className="flex items-center gap-4">
            <Smartphone className="text-gray-500" size={24} />
            <div className="flex flex-col items-center">
                <Cloud className="text-purple-400 animate-bounce" size={32} />
                <div className="h-[2px] w-8 bg-purple-500/30 mt-1"></div>
            </div>
            <Smartphone className="text-purple-400" size={24} />
        </div>
    )
  },
  {
    id: 'tournaments',
    title: "Live Tournaments",
    subtitle: "Compete Globally",
    desc: "Join or host events using unique join codes. Track real-time leaderboards, spectate friends' rounds, and fight for the top spot in any course in our database.",
    icon: <Trophy size={48} className="text-orange-400" />,
    bgImage: "https://images.unsplash.com/photo-1535132011086-b8818f016104?q=80&w=800&auto=format&fit=crop",
    color: "bg-orange-600",
    visual: (
        <div className="bg-gray-800 p-2 rounded-xl border border-orange-500/30 flex flex-col gap-1 w-32">
            <div className="flex justify-between text-[8px] font-bold text-gray-500 px-1">
                <span>PLAYER</span><span>SCORE</span>
            </div>
            <div className="bg-orange-500/10 p-1.5 rounded flex justify-between items-center">
                <span className="text-[10px] text-white font-bold">You</span>
                <span className="text-xs font-black text-white">-2</span>
            </div>
            <div className="bg-gray-900/50 p-1.5 rounded flex justify-between items-center">
                <span className="text-[10px] text-gray-400">Tiger</span>
                <span className="text-xs font-black text-gray-500">E</span>
            </div>
        </div>
    )
  }
];

const Onboarding = ({ onClose }: OnboardingProps) => {
  const [idx, setIdx] = useState(0);

  const next = () => {
    if (idx < slides.length - 1) setIdx(idx + 1);
    else onClose();
  };

  const prev = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  const currentSlide = slides[idx];

  return (
    <div className="fixed inset-0 z-[3000] bg-black">
       {/* Background Image Layer */}
       <div 
         key={currentSlide.id}
         className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 opacity-40 blur-sm scale-110"
         style={{ backgroundImage: `url(${currentSlide.bgImage})` }}
       />
       
       <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"></div>

       <div className="relative z-10 h-full flex flex-col max-w-md mx-auto">
          {/* Top Indicators */}
          <div className="p-6 flex gap-1.5 mt-4">
            {slides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? `w-8 ${currentSlide.color}` : 'w-2 bg-gray-700'}`} />
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Visual Container */}
              <div className="mb-8 relative group">
                  <div className={`absolute inset-0 ${currentSlide.color} blur-2xl opacity-20 rounded-full transition-opacity`}></div>
                  
                  {currentSlide.visual ? (
                      <div className="relative z-10 transform transition-transform">
                          {currentSlide.visual}
                      </div>
                  ) : (
                    <div className="relative z-10 bg-gray-900/80 p-6 rounded-3xl border border-gray-700 shadow-2xl backdrop-blur-md transform transition-transform">
                        {currentSlide.icon}
                    </div>
                  )}
              </div>

              <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 ${currentSlide.color.replace('bg-', 'text-')}`}>
                  {currentSlide.subtitle}
              </h3>
              <h1 className="text-3xl font-black text-white mb-4 leading-tight">
                  {currentSlide.title}
              </h1>
              <p className="text-gray-400 text-base leading-relaxed">
                  {currentSlide.desc}
              </p>
          </div>

          {/* Bottom Actions */}
          <div className="p-8 pb-10 flex justify-between items-center bg-gradient-to-t from-black via-black to-transparent">
              <button 
                onClick={prev} 
                className={`p-3 rounded-full hover:bg-white/10 transition-colors ${idx === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400'}`}
              >
                  <ChevronLeft size={28} />
              </button>

              <button 
                onClick={next}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all active:scale-95 ${currentSlide.color} hover:brightness-110`}
              >
                  <span className="text-lg">{idx === slides.length - 1 ? "Get Started" : 'Next'}</span>
                  {idx === slides.length - 1 ? <Check size={20} strokeWidth={3} /> : <ArrowRight size={20} strokeWidth={3} />}
              </button>
          </div>
       </div>
    </div>
  );
};

export default Onboarding;