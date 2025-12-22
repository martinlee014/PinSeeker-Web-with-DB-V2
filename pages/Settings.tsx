import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { BookOpen, Ruler, Briefcase, Download, Smartphone, Share, PlusSquare, Info, Map, MessageSquare, Send, X, Loader2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModalOverlay } from '../components/Modals';

const Settings = () => {
  const { useYards, toggleUnits, setShowTutorial } = useContext(AppContext);
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Feedback Form State
  const [feedbackType, setFeedbackType] = useState('Suggestion');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isDeviceIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isDeviceIOS);

    // Capture install prompt for Android/Desktop
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    } else {
      setShowInstallHelp(true);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    
    setIsSending(true);
    
    const FORMSPREE_ID = "mwpgyydb"; 

    const payload: any = {
        message: feedbackText,
        category: feedbackType,
        timestamp: new Date().toLocaleString(),
        device: navigator.userAgent,
        _subject: `PinSeeker Feedback: ${feedbackType}`
    };

    if (feedbackEmail && feedbackEmail.includes('@')) {
        payload.email = feedbackEmail;
    }

    try {
        const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Feedback sent successfully!");
            setShowFeedback(false);
            setFeedbackText('');
            setFeedbackEmail('');
            setFeedbackType('Suggestion');
        } else {
            const data = await response.json();
            alert("Failed to send feedback. " + (data.error || "Please try again later."));
        }
    } catch (error) {
        alert("Network error. Please check your connection.");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="space-y-4">
        <button
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-blue-900/30 group transition-all"
        >
            <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Download className="text-white" size={20} />
            </div>
            <div className="text-left flex-1">
                <div className="font-bold text-white">Install App</div>
                <div className="text-xs text-blue-100">
                    {installPrompt ? 'Tap to install' : 'Download to Home Screen'}
                </div>
            </div>
        </button>

        <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between border border-gray-800">
            <div className="flex items-center gap-3">
                <div className="bg-gray-800 p-2 rounded-lg">
                    <Ruler className="text-green-500" size={20} />
                </div>
                <div>
                    <div className="font-medium text-white">Measurement Units</div>
                    <div className="text-xs text-gray-500">{useYards ? 'Imperial (Yards)' : 'Metric (Meters)'}</div>
                </div>
            </div>
            <button 
                onClick={toggleUnits}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${useYards ? 'bg-green-600' : 'bg-gray-600'}`}
            >
                <div className={`bg-white w-4 h-4 rounded-full transition-transform ${useYards ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>

        <button 
            onClick={() => navigate('/settings/clubs')}
            className="w-full bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800 hover:bg-gray-800 transition-colors group"
        >
            <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-gray-700 transition-colors">
                <Briefcase className="text-yellow-500" size={20} />
            </div>
            <div className="text-left flex-1">
                <div className="font-medium text-white">Club Management</div>
                <div className="text-xs text-gray-500">Edit bag, carry distances & dispersion</div>
            </div>
            <div className="text-gray-600 group-hover:text-white transition-colors">→</div>
        </button>

        <button 
            onClick={() => navigate('/settings/courses')}
            className="w-full bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800 hover:bg-gray-800 transition-colors group"
        >
            <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-gray-700 transition-colors">
                <Map className="text-emerald-400" size={20} />
            </div>
            <div className="text-left flex-1">
                <div className="font-medium text-white">Course Database</div>
                <div className="text-xs text-gray-500">Add, edit, and contribute course maps</div>
            </div>
            <div className="text-gray-600 group-hover:text-white transition-colors">→</div>
        </button>

        <button 
            onClick={() => setShowTutorial(true)}
            className="w-full bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800 hover:bg-gray-800 transition-colors"
        >
            <div className="bg-gray-800 p-2 rounded-lg">
                <HelpCircle className="text-purple-500" size={20} />
            </div>
            <div className="text-left flex-1">
                <div className="font-medium text-white">Product Tour</div>
                <div className="text-xs text-gray-500">View App Highlights</div>
            </div>
        </button>

        <button 
            onClick={() => navigate('/manual')}
            className="w-full bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800 hover:bg-gray-800 transition-colors"
        >
            <div className="bg-gray-800 p-2 rounded-lg">
                <BookOpen className="text-blue-500" size={20} />
            </div>
            <div className="text-left">
                <div className="font-medium text-white">User Manual</div>
                <div className="text-xs text-gray-500">Learn how to use PinSeeker</div>
            </div>
        </button>

        <button 
            onClick={() => setShowFeedback(true)}
            className="w-full bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800 hover:bg-gray-800 transition-colors"
        >
            <div className="bg-gray-800 p-2 rounded-lg">
                <MessageSquare className="text-pink-500" size={20} />
            </div>
            <div className="text-left">
                <div className="font-medium text-white">Send Feedback</div>
                <div className="text-xs text-gray-500">Report bugs or suggest features</div>
            </div>
        </button>
      </div>
      
      <div className="text-center text-xs text-gray-600 mt-10">
          PinSeeker Web v7.19.0
      </div>

      {showInstallHelp && (
        <ModalOverlay onClose={() => setShowInstallHelp(false)}>
           <div className="p-6 text-center">
             {isIOS ? (
                 <>
                    <Smartphone className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-white mb-4">Install on iOS</h3>
                    <ol className="text-left text-sm text-gray-300 space-y-4 mb-6">
                        <li className="flex items-center gap-3">
                            <span className="bg-gray-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                            <span>Tap the <strong className="text-blue-400">Share</strong> button in Safari. <Share size={14} className="inline ml-1"/></span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="bg-gray-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                            <span>Scroll down and select <strong className="text-white">Add to Home Screen</strong>. <PlusSquare size={14} className="inline ml-1"/></span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="bg-gray-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                            <span>Tap <strong className="text-blue-400">Add</strong> to finish.</span>
                        </li>
                    </ol>
                 </>
             ) : (
                 <>
                    <Info className="mx-auto text-blue-400 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-white mb-2">Install Manually</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Your browser doesn't support automatic installation or the app is already installed.
                    </p>
                    <div className="text-left text-sm text-gray-300 bg-gray-800 p-4 rounded-xl mb-6">
                        <p className="mb-2"><strong>Tip:</strong> Look for the "Add to Home Screen" or "Install App" option in your browser menu.</p>
                    </div>
                 </>
             )}
             
             <button 
               onClick={() => setShowInstallHelp(false)}
               className="w-full bg-gray-800 py-3 rounded-xl text-white font-bold hover:bg-gray-700"
             >
               Close
             </button>
           </div>
        </ModalOverlay>
      )}

      {showFeedback && (
        <ModalOverlay onClose={() => setShowFeedback(false)}>
             <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-pink-500"/> App Feedback
                </h3>
                <button type="button" onClick={() => setShowFeedback(false)}><X className="text-gray-400" /></button>
            </div>
            <div className="p-6 bg-gray-900 overflow-y-auto max-h-[70vh]">
                <p className="text-sm text-gray-400 mb-6">
                    Help us improve PinSeeker.
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Feedback Type</label>
                        <select 
                            value={feedbackType}
                            onChange={(e) => setFeedbackType(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-pink-500"
                        >
                            <option value="Suggestion">Feature Suggestion</option>
                            <option value="Bug Report">Bug Report</option>
                            <option value="Course Data">Course Data Issue</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Your Email <span className="text-gray-600 font-normal lowercase">(Optional)</span>
                        </label>
                        <input 
                            type="email"
                            value={feedbackEmail}
                            onChange={(e) => setFeedbackEmail(e.target.value)}
                            placeholder="e.g. user@example.com (Optional)"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-pink-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
                        <textarea 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white h-32 focus:border-pink-500 outline-none resize-none"
                            placeholder="Describe your issue or idea..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handleSendFeedback}
                        disabled={isSending || !feedbackText.trim()}
                        className="w-full bg-pink-600 hover:bg-pink-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                        {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        {isSending ? 'Sending...' : 'Submit Feedback'}
                    </button>
                </div>
            </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default Settings;