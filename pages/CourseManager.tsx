
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { CloudService } from '../services/supabase';
import { GolfCourse } from '../types';
import { ChevronLeft, Plus, Map, Trash2, Edit, Cloud, Download, Search, Loader2, UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

const CourseManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'local' | 'online'>('local');
  
  // Local State
  const [localCourses, setLocalCourses] = useState<GolfCourse[]>([]);
  
  // Online State
  const [onlineCourses, setOnlineCourses] = useState<GolfCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
    if (confirm("Are you sure you want to delete this course from local storage?")) {
        StorageService.deleteCustomCourse(id);
        loadLocalCourses();
    }
  };

  const handleEdit = (course: GolfCourse) => {
      navigate('/settings/courses/edit', { state: { course } });
  };

  const handleSearch = async () => {
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      try {
          const results = await CloudService.searchCourses(searchQuery);
          setOnlineCourses(results);
          if (results.length === 0) {
              // Optional: Show "No results" toast could go here
          }
      } catch (e: any) {
          alert(e.message || "Failed to connect to course database.");
      } finally {
          setIsSearching(false);
      }
  };

  const handleDownload = async (course: GolfCourse) => {
      setDownloadingId(course.id);
      
      // Simulate network interaction UI feel
      setTimeout(() => {
          // Check if already exists locally
          const exists = localCourses.find(c => c.name === course.name);
          if (exists) {
              alert(`You already have a course named "${course.name}".`);
              setDownloadingId(null);
              return;
          }

          const courseToSave = {
              ...course,
              isCustom: true, // Treat downloaded courses as custom so they appear in list
              isCloud: false  // Once downloaded, it acts local
          };
          
          // Generate a new local ID to prevent conflict with Cloud UUID
          courseToSave.id = crypto.randomUUID();

          StorageService.saveCustomCourse(courseToSave);
          loadLocalCourses();
          setDownloadingId(null);
          // Auto switch tab to show user
          if(confirm("Download complete! Switch to 'My Courses' to view it?")) {
              setActiveTab('local');
          }
      }, 500);
  };

  const handleUpload = async (course: GolfCourse) => {
      if (!confirm(`Submit "${course.name}" to the global database? It will be reviewed by admins.`)) return;
      
      setIsUploading(course.id);
      const res = await CloudService.uploadCourse(course);
      setIsUploading(null);

      if (res.success) {
          alert("Course submitted successfully! It is now 'Pending Approval' and will appear online once an admin approves it.");
      } else {
          alert("Upload failed: " + res.message);
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
                        <p className="font-bold">No custom courses yet.</p>
                        <p className="text-xs mt-2">Create one or download from library.</p>
                    </div>
                ) : (
                    localCourses.map(c => (
                        <div key={c.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center group">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="font-bold text-white text-lg truncate">{c.name}</div>
                                <div className="text-xs text-gray-500">{c.holes.filter(h => h.tee.lat !== 0).length} Holes • {c.createdAt}</div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button 
                                    onClick={() => handleUpload(c)}
                                    disabled={isUploading === c.id}
                                    className="p-2 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40 disabled:opacity-50"
                                    title="Upload to Cloud"
                                >
                                     {isUploading === c.id ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16} />}
                                </button>
                                <button 
                                    onClick={() => handleEdit(c)}
                                    className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                                    title="Edit Local"
                                >
                                     <Edit size={16} /> 
                                </button>
                                <button 
                                    onClick={() => handleDelete(c.id)}
                                    className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </>
        )}

        {/* === ONLINE TAB === */}
        {activeTab === 'online' && (
            <>
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search global courses..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                    />
                    <button 
                        onClick={handleSearch} 
                        disabled={isSearching}
                        className="bg-blue-600 text-white px-4 rounded-xl flex items-center justify-center disabled:opacity-50"
                    >
                        {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                    </button>
                </div>

                {onlineCourses.length === 0 && !isSearching && (
                    <div className="text-center py-10 text-gray-500">
                        <Cloud size={48} className="mx-auto mb-3 opacity-20" />
                        <p>{searchQuery ? "No courses found." : "Search to find verified courses."}</p>
                    </div>
                )}

                {onlineCourses.map(c => {
                    const isDownloaded = localCourses.some(lc => lc.name === c.name);
                    
                    return (
                        <div key={c.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="font-bold text-white text-lg truncate">{c.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <span>{c.holes.length} Holes</span>
                                    <span className="bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                                        <CheckCircle size={10} /> OFFICIAL
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0">
                                {isDownloaded ? (
                                    <button disabled className="p-3 bg-green-900/20 text-green-500 rounded-xl flex items-center gap-2 opacity-70">
                                        <CheckCircle size={18} /> <span className="text-xs font-bold">Added</span>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleDownload(c)}
                                        disabled={downloadingId === c.id}
                                        className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
                                    >
                                        {downloadingId === c.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                        <span className="text-xs font-bold">Download</span>
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
