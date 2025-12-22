
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { CloudService } from '../services/supabase';
import { AppContext } from '../App';
import { GolfCourse } from '../types';
import { COUNTRIES } from '../constants';
import { ChevronLeft, Plus, Map, Trash2, Edit, Cloud, Download, Search, Loader2, UploadCloud, CheckCircle, AlertTriangle, RefreshCw, Globe } from 'lucide-react';

const CourseManager = () => {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<'local' | 'online'>('local');
  
  // Local State
  const [localCourses, setLocalCourses] = useState<GolfCourse[]>([]);
  
  // Online State
  const [onlineCourses, setOnlineCourses] = useState<GolfCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadLocalCourses();
  }, []);

  const loadLocalCourses = () => {
    setLocalCourses(StorageService.getCustomCourses());
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this course from your device?")) {
        StorageService.deleteCustomCourse(id);
        loadLocalCourses();
    }
  };

  const handleEdit = (course: GolfCourse) => {
      navigate('/settings/courses/edit', { state: { course } });
  };

  const handleSearch = async () => {
      // Allow searching empty string to "Show All" or "Recent"
      setIsSearching(true);
      try {
          // Pass selected country filter (or 'All' which Service handles as null)
          const results = await CloudService.searchCourses(searchQuery, selectedCountry);
          setOnlineCourses(results);
      } catch (e: any) {
          alert(e.message || "Failed to connect to course database.");
      } finally {
          setIsSearching(false);
      }
  };

  const handleDownload = async (course: GolfCourse) => {
      setDownloadingId(course.id);
      
      setTimeout(() => {
          // Check if already exists locally by Name
          const exists = localCourses.find(c => c.name.toLowerCase() === course.name.toLowerCase());
          
          if (exists) {
              if(!confirm(`You already have a course named "${course.name}". Do you want to download a duplicate copy?`)) {
                  setDownloadingId(null);
                  return;
              }
          }

          const courseToSave = {
              ...course,
              isCustom: true, // Treat downloaded courses as custom so they appear in 'My Courses'
              isCloud: false  // Once downloaded, it acts local
          };
          
          // Generate a new local ID to ensure it functions as a distinct local entity
          courseToSave.id = crypto.randomUUID();

          StorageService.saveCustomCourse(courseToSave);
          loadLocalCourses();
          setDownloadingId(null);
          
          if(confirm(`"${course.name}" downloaded! Go to 'My Courses' to play it?`)) {
              setActiveTab('local');
          }
      }, 500);
  };

  const handleUpload = async (course: GolfCourse) => {
      if (!user) {
          alert("You must be logged in to upload courses.");
          return;
      }

      setIsUploading(course.id);

      try {
          // 1. Check if course already exists for this user
          const existingCloudId = await CloudService.checkCourseExists(course.name, user);
          
          let success = false;
          let msg = "";

          if (existingCloudId) {
              // Ask user for action
              // Note: We use window.confirm sequence because standard browser alerts are blocking.
              // In a real app, a custom modal is better, but this fits the constraint.
              // We can't do complex UI logic inside this async flow easily without a custom modal component.
              // For now, we assume simple Overwrite vs Cancel/New.
              
              if (confirm(`A course named "${course.name}" by you already exists in the cloud.\n\nClick OK to OVERWRITE/UPDATE it.\nClick Cancel to Create a Duplicate Copy.`)) {
                  // Update existing
                  const res = await CloudService.updateCourse(existingCloudId, course, user);
                  success = res.success;
                  msg = res.message || "Update failed";
              } else {
                  // Create New Copy
                  if (confirm("Create a new duplicate copy in the cloud instead?")) {
                      const res = await CloudService.uploadCourse(course, user);
                      success = res.success;
                      msg = res.message || "Upload failed";
                  } else {
                      setIsUploading(null);
                      return; // User cancelled everything
                  }
              }
          } else {
              // New Course
              const res = await CloudService.uploadCourse(course, user);
              success = res.success;
              msg = res.message || "Upload failed";
          }

          if (success) {
              alert("Success! Your course data has been synced to the Global Library.");
              // Optional: switch to online tab and search for it to prove it's there
              setSearchQuery(course.name);
              setActiveTab('online');
              handleSearch();
          } else {
              alert("Operation failed: " + msg);
          }

      } catch (error: any) {
          alert("Network error: " + error.message);
      } finally {
          setIsUploading(null);
      }
  };

  return (
    <div className="p-4 flex flex-col h-full bg-gray-900 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 bg-gray-800 rounded-lg text-white">
          <ChevronLeft />
        </button>
        <h1 className="text-2xl font-bold text-white">Course Database</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'local' ? 'bg-gray-700 text-white shadow' : 'text-gray-500'}`}
          >
              <Map size={16} /> My Courses
          </button>
          <button 
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'online' ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}
          >
              <Cloud size={16} /> Global Library
          </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-20">
        
        {/* === LOCAL TAB === */}
        {activeTab === 'local' && (
            <>
                {localCourses.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                        <Map size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No custom courses found.</p>
                        <p className="text-xs mt-2">Create one or download from the Global Library.</p>
                    </div>
                ) : (
                    localCourses.map(c => (
                        <div key={c.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center group">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="font-bold text-white text-lg truncate">{c.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    {c.country && <span className="text-blue-400 font-bold">{c.country} •</span>}
                                    <span>{c.holes.filter(h => h.tee.lat !== 0).length} Holes</span>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button 
                                    onClick={() => handleUpload(c)}
                                    disabled={isUploading === c.id}
                                    className="p-2 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40 disabled:opacity-50 transition-colors"
                                    title="Upload/Update to Cloud"
                                >
                                     {isUploading === c.id ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16} />}
                                </button>
                                <button 
                                    onClick={() => handleEdit(c)}
                                    className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                                    title="Edit Local"
                                >
                                     <Edit size={16} /> 
                                </button>
                                <button 
                                    onClick={() => handleDelete(c.id)}
                                    className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
                
                <div className="text-center text-xs text-gray-600 mt-4 px-8">
                    Tap the Cloud icon <UploadCloud size={10} className="inline"/> to upload or update your course.
                </div>
            </>
        )}

        {/* === ONLINE TAB === */}
        {activeTab === 'online' && (
            <>
                <div className="flex flex-col gap-3 mb-4">
                    {/* Country Filter */}
                    <div className="relative">
                        <select 
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pl-10 text-white focus:border-blue-500 outline-none appearance-none font-bold text-sm"
                        >
                            <option value="All">All Countries (Global)</option>
                            <option disabled>──────────</option>
                            {COUNTRIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                            <Globe size={18} />
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search course name..."
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                        />
                        <button 
                            onClick={handleSearch} 
                            disabled={isSearching}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors"
                        >
                            {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                        </button>
                    </div>
                </div>

                {onlineCourses.length === 0 && !isSearching && (
                    <div className="text-center py-10 text-gray-500">
                        <Cloud size={48} className="mx-auto mb-3 opacity-20" />
                        <p>{searchQuery ? "No courses found." : "Filter by country & search to download."}</p>
                    </div>
                )}

                {onlineCourses.map(c => {
                    // Check if we already have this course (by Name matching)
                    const isDownloaded = localCourses.some(lc => lc.name.toLowerCase() === c.name.toLowerCase());
                    const author = (c as any).author || 'Unknown';
                    const isMyCloudCourse = author === user;
                    
                    return (
                        <div key={c.id} className={`bg-gray-800 p-4 rounded-xl border flex justify-between items-center ${isMyCloudCourse ? 'border-blue-900/50 bg-blue-900/10' : 'border-gray-700'}`}>
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="font-bold text-white text-lg truncate flex items-center gap-2">
                                    {c.name}
                                    {isMyCloudCourse && <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded uppercase">Yours</span>}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                                    {c.country && <span className="text-blue-400 font-bold">{c.country} •</span>}
                                    <span>{c.holes?.length || 18} Holes</span>
                                    <span className="opacity-70">• By {author}</span>
                                </div>
                            </div>
                            <div className="shrink-0">
                                {isDownloaded ? (
                                    <button 
                                        onClick={() => handleDownload(c)}
                                        className="p-3 bg-gray-700 text-green-400 rounded-xl flex items-center gap-2 opacity-80 hover:opacity-100 hover:bg-gray-600 transition-colors"
                                    >
                                        <RefreshCw size={18} /> <span className="text-xs font-bold hidden sm:inline">Update</span>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleDownload(c)}
                                        disabled={downloadingId === c.id}
                                        className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-colors"
                                    >
                                        {downloadingId === c.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                        <span className="text-xs font-bold hidden sm:inline">Download</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </>
        )}

      </div>

      {activeTab === 'local' && (
          <button 
            onClick={() => navigate('/settings/courses/edit')}
            className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-xl shadow-green-900/50 hover:scale-105 transition-transform z-10"
          >
            <Plus size={24} />
          </button>
      )}
    </div>
  );
};

export default CourseManager;
