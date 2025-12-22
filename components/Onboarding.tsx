
import { useState } from 'react';
import { Target, Map, PenTool, ArrowRight, Check, ChevronLeft, BarChart3, Trophy, Wind, Layers, MapPin } from 'lucide-react';

interface OnboardingProps {
  onClose: () => void;
}

const slides = [
  {
    id: 'intro',
    title: "PinSeeker Web",
    subtitle: "Your Smart Electronic Caddie",
    desc: "Professional golf analytics based on high-precision satellite mapping. Not just a GPS—it's your strategic partner.",
    icon: <MapPin size={48} className="text-green-400" />,
    bgImage: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800&auto=format&fit=crop", // Golf Course Dark
    color: "bg-green-600"
  },
  {
    id: 'dispersion',
    title: "Dispersion Analysis",
    subtitle: "Plan for the Miss",
    desc: "Visualize your potential landing zones (blue ellipses) based on your actual club data. Don't just aim for the perfect shot—manage your risk like a pro.",
    icon: <BarChart3 size={48} className="text-blue-400" />,
    bgImage: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800&auto=format&fit=crop", // Data/Tech vibe
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
    id: 'rangefinder',
    title: "Advanced Rangefinder",
    subtitle: "Precision & Wind Correction",
    desc: "Snap to 'My Location' for instant layup math. Use the visual Wind Compass to calculate 'Plays-Like' distances automatically.",
    icon: <Target size={48} className="text-red-400" />,
    bgImage: "https://images.unsplash.com/photo-1593111774240-d529f12db464?q=80&w=800&auto=format&fit=crop", // Focus/Scope
    color: "bg-red-600",
    visual: (
      <div className="relative w-32 h-32 flex items-center justify-center">
          <Wind className="absolute top-2 right-2 text-blue-300 opacity-50" size={24}/>
          <div className="absolute inset-0 border-2 border-red-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-t-2 border-red-500 rounded-full animate-spin duration-[3s]"></div>
          <div className="text-2xl font-bold text-white font-mono">152<span className="text-xs">yd</span></div>
      </div>
    )
  },
  {
    id: 'strategy',
    title: "Interactive Strategy",
    subtitle: "Think Like a Coach",
    desc: "Draw paths, mark hidden hazards, and add notes directly on the map. It's your digital yardage book that you can edit on the fly.",
    icon: <PenTool size={48} className="text-yellow-400" />,
    bgImage: "https://images.unsplash.com/photo-1623567341691-1f46b5e02805?q=80&w=800&auto=format&fit=crop", // Writing/Notes
    color: "bg-yellow-600",
    visual: (
       <div className="relative w-32 h-24 bg-gray-800/80 rounded-lg border border-yellow-500/30 p-2">
          <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-500 rounded-full"></div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
             <path d="M 20 20 Q 50 10 90 50" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
          <div className="absolute bottom-2 right-2 text-[8px] text-yellow-200 bg-black/50 px-1 rounded">Aim Left</div>
       </div>
    )
  },
  {
    id: 'editor',
    title: "DIY Course Editor",
    subtitle: "Map the Unmappable",
    desc: "Playing a private or rural course? Use the built-in Editor with Deep Zoom (Lvl 22) to map Tee Boxes and Greens yourself.",
    icon: <Layers size={48} className="text-purple-400" />,
    bgImage: "https://images.unsplash.com/photo-1527685609591-44b0aef2400b?q=80&w=800&auto=format&fit=crop", // Map/Satellite
    color: "bg-purple-600"
  },
  {
    id: 'track',
    title: "Track & Replay",
    subtitle: "Data Driven Improvement",
    desc: "One-tap GPS recording. After the round, replay every shot on the map to analyze your performance hole-by-hole.",
    icon: <Trophy size={48} className="text-orange-400" />,
    bgImage: "https://images.unsplash.com/photo-1535132011086-b8818f016104?q=80&w=800&auto=format&fit=crop", // Victory/Green
    color: "bg-orange-600",
    visual: (
        <div className="flex gap-2">
            <div className="bg-gray-800 p-2 rounded-lg text-center border border-gray-700">
                <div className="text-[10px] text-gray-400">SCORE</div>
                <div className="text-xl font-bold text-white">78</div>
            </div>
            <div className="bg-gray-800 p-2 rounded-lg text-center border border-gray-700">
                <div className="text-[10px] text-gray-400">GIR</div>
                <div className="text-xl font-bold text-green-400">62%</div>
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
         key={currentSlide.id} // Key forces re-render for animation
         className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 opacity-40 blur-sm scale-110"
         style={{ backgroundImage: `url(${currentSlide.bgImage})` }}
       />
       
       {/* Gradient Overlay */}
       <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"></div>

       <div className="relative z-10 h-full flex flex-col max-w-md mx-auto">
          {/* Top Indicators */}
          <div className="p-6 flex gap-1.5 mt-4">
            {slides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? `w-8 ${currentSlide.color.replace('bg-', 'bg-')}` : 'w-2 bg-gray-700'}`} />
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 key={idx}">
              
              {/* Icon / Visual Container */}
              <div className="mb-8 relative group">
                  <div className={`absolute inset-0 ${currentSlide.color} blur-2xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity`}></div>
                  
                  {/* If there is a specific custom visual, render it, otherwise just the icon */}
                  {currentSlide.visual ? (
                      <div className="relative z-10 transform transition-transform group-hover:scale-105">
                          {currentSlide.visual}
                      </div>
                  ) : (
                    <div className="relative z-10 bg-gray-900/80 p-6 rounded-3xl border border-gray-700 shadow-2xl backdrop-blur-md transform transition-transform group-hover:scale-110 group-hover:-rotate-3">
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
                  <span className="text-lg">{idx === slides.length - 1 ? "Let's Play" : 'Next'}</span>
                  {idx === slides.length - 1 ? <Check size={20} strokeWidth={3} /> : <ArrowRight size={20} strokeWidth={3} />}
              </button>
          </div>
       </div>
    </div>
  );
};

export default Onboarding;
