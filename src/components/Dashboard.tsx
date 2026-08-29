import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bookmark, LayoutDashboard, Compass, Search, Star, ExternalLink, Calendar, Trash2, 
  BookOpen, Sparkles, Clock, Award, CheckCircle2, ChevronRight, CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RecommendationResponse, Course, UserProgress } from "../types";
import ThreeDGlobe from "./ThreeDGlobe";

interface DashboardProps {
  bookmarks: Course[];
  onRemoveBookmark: (courseId: string) => void;
  savedRoadmaps: RecommendationResponse[];
  onRemoveRoadmap: (roadmapId: string) => void;
  onSelectRoadmap: (rec: RecommendationResponse) => void;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ 
  bookmarks, 
  onRemoveBookmark, 
  savedRoadmaps, 
  onRemoveRoadmap, 
  onSelectRoadmap,
  setActiveTab
}: DashboardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"roadmaps" | "bookmarks" | "progress">("roadmaps");
  const [progressTracker, setProgressTracker] = useState<UserProgress[]>([]);

  // Load progress stats from localStorage
  useEffect(() => {
    const pData = localStorage.getItem("edu_progress");
    if (pData) {
      setProgressTracker(JSON.parse(pData));
    }
  }, []);

  // Filter roadmaps by search query
  const filteredRoadmaps = savedRoadmaps.filter((r) => 
    r.learningGoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearProgress = (courseId: string) => {
    const updated = progressTracker.filter((p) => p.courseId !== courseId);
    setProgressTracker(updated);
    localStorage.setItem("edu_progress", JSON.stringify(updated));
    localStorage.removeItem(`tasks-${courseId}`);
  };

  const getPlatformStyle = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("coursera")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (p.includes("udemy")) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    if (p.includes("youtube")) return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    if (p.includes("freecodecamp")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (p.includes("edx")) return "bg-sky-500/10 text-sky-500 border-sky-500/20";
    if (p.includes("mit")) return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    return "bg-primary/10 text-primary border-primary/20";
  };

  const activeRoadmap = progressTracker[0] || null;
  const activeRoadmapProgress = activeRoadmap ? activeRoadmap.progress : 0;
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activeRoadmapProgress / 100) * circumference;

  return (
    <div className="max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-24 sm:py-28 space-y-10 sm:space-y-12 pb-36">
      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
        
        {/* CARD 1: WELCOME BANNER (Spans 8 columns) */}
        <div className="col-span-12 md:col-span-8 glass-card p-8 sm:p-10 lg:p-12 border border-[var(--border)] relative overflow-hidden flex flex-col justify-between min-h-[260px] lg:min-h-[300px] rounded-3xl bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center space-x-2 text-primary">
              <LayoutDashboard className="h-4.5 w-4.5" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest">Lumina AI Operating System</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
              Welcome Back, Scholar
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Analyze saved AI syllabus tracks, check active recall completion, and resume course roadmaps.
            </p>
          </div>

          <div className="pt-6 relative z-10">
            <button
              onClick={() => setActiveTab("recommend")}
              className="px-7 py-4 btn-premium-primary text-sm sm:text-base font-bold flex items-center space-x-2.5 w-fit rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/20"
            >
              <Compass className="h-5 w-5" />
              <span>Configure New Roadmap</span>
            </button>
          </div>
        </div>

        {/* CARD 2: HOLOGRAPHIC GLOBE WIDGET (Spans 4 columns) */}
        <div className="col-span-12 md:col-span-4 glass-card p-6 sm:p-8 border border-[var(--border)] flex flex-col justify-between items-center text-center relative min-h-[260px] lg:min-h-[300px] rounded-3xl bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="absolute inset-0 flex justify-center items-center opacity-70">
            <ThreeDGlobe />
          </div>
          <div className="relative z-10 w-full flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-accent uppercase tracking-widest">Global Resource Network</span>
            <span className="px-2.5 py-1 text-[9px] font-mono font-bold bg-primary/10 border border-primary/20 text-primary rounded-md">LIVE INDEX</span>
          </div>
          <div className="relative z-10 mt-16 sm:mt-20">
            <span className="block text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-[var(--text-primary)]">14,820</span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 block">Courses Indexed</span>
          </div>
        </div>

        {/* CARD 3: ACTIVE PROGRESS TRACKER (Spans 4 columns) */}
        <div className="col-span-12 md:col-span-4 glass-card p-6 sm:p-8 border border-[var(--border)] flex flex-col justify-between min-h-[260px] lg:min-h-[300px] rounded-3xl bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-primary uppercase tracking-widest">Overall Progress</span>
            <span className="text-xs font-bold text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border)] px-3 py-1 rounded-full shadow-sm">ACTIVE PATH</span>
          </div>

          <div className="flex items-center space-x-5 my-4">
            {/* SVG Circular Progress Bar */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 lg:w-28 lg:h-28 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-[var(--border)]"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-primary"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                />
              </svg>
              <span className="absolute text-base sm:text-lg font-sans font-extrabold text-[var(--text-primary)]">
                {activeRoadmapProgress}%
              </span>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug">
                {activeRoadmap ? activeRoadmap.courseName : "No Active Roadmap"}
              </h4>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-mono">
                {activeRoadmap ? `UPDATED: ${activeRoadmap.lastUpdated}` : "Start ticking tasks!"}
              </p>
            </div>
          </div>

          <div className="text-xs text-[var(--text-muted)] italic bg-[var(--surface-secondary)] p-3 rounded-2xl border border-[var(--border)]">
            {activeRoadmap 
              ? "Keep checking off tasks inside your learning schedule to complete the roadmap!" 
              : "Generate a custom syllabus first."}
          </div>
        </div>

        {/* CARD 4: STATS BAR - COUNTER NUMBERS (Spans 8 columns) */}
        <div className="col-span-12 md:col-span-8 glass-card p-6 sm:p-8 border border-[var(--border)] grid grid-cols-3 gap-4 lg:gap-6 items-center min-h-[260px] lg:min-h-[300px] rounded-3xl bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="flex flex-col justify-center items-center text-center p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] h-full shadow-sm">
            <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 mb-2">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">Syllabi</span>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-[var(--text-primary)] mt-1">{savedRoadmaps.length}</span>
          </div>

          <div className="flex flex-col justify-center items-center text-center p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] h-full shadow-sm">
            <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 mb-2">
              <Bookmark className="h-6 w-6" />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">Favorites</span>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-[var(--text-primary)] mt-1">{bookmarks.length}</span>
          </div>

          <div className="flex flex-col justify-center items-center text-center p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] h-full shadow-sm">
            <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 mb-2">
              <CheckSquare className="h-6 w-6" />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">Tracked</span>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-[var(--text-primary)] mt-1">{progressTracker.length}</span>
          </div>
        </div>

      </div>

      {/* SUB-TABS NAVIGATION & SEARCH CONTAINER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4 pt-6">
        <div className="flex space-x-6 sm:space-x-8">
          {[
            { id: "roadmaps", label: "My Syllabi" },
            { id: "bookmarks", label: "Bookmarked Courses" },
            { id: "progress", label: "Progress Tracker" },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`pb-3 text-sm sm:text-base font-bold transition-all border-b-2 -mb-[18px] cursor-pointer ${
                activeSubTab === sub.id
                  ? "border-primary text-primary"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>

        {/* Search Input for Syllabi */}
        {activeSubTab === "roadmaps" && (
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roadmaps..."
              className="block w-full pl-10 pr-4 py-2.5 border border-[var(--input-border)] bg-[var(--input)] text-[var(--text-primary)] rounded-2xl text-xs sm:text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      {/* DETAILS RENDER STAGE */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeSubTab === "roadmaps" && (
            <motion.div
              key="saved-roadmaps-panel"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {filteredRoadmaps.length > 0 ? (
                filteredRoadmaps.map((r) => (
                  <div
                    key={r.id}
                    className="glass-card border border-[var(--border)] rounded-3xl p-7 lg:p-8 hover:border-primary/30 flex flex-col justify-between bg-[var(--surface)] shadow-[var(--shadow)] group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg">
                          AI GENERATED
                        </span>
                        <button
                          onClick={() => onRemoveRoadmap(r.id)}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
                          title="Delete Syllabus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <h3 className="text-xl font-sans font-extrabold text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {r.learningGoal}
                      </h3>

                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                        {r.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] font-medium pt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span>{r.estimatedCompletionTime}</span>
                        </div>
                        <div>&bull;</div>
                        <div>{r.skillLevel} Level</div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={() => onSelectRoadmap(r)}
                        className="w-full py-3 btn-premium-primary text-sm font-bold flex items-center justify-center space-x-2 rounded-xl hover:scale-102 transition-all"
                      >
                        <span>Open Syllabus Details</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-4 max-w-sm mx-auto">
                  <div className="p-4 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-full text-[var(--text-muted)] inline-block shadow-sm">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-sans font-bold text-[var(--text-primary)]">No roadmaps matched</h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    {searchQuery ? "Try refining your keywords or search terms." : "You haven't saved any AI recommendations yet. Click Recommend to create one!"}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeSubTab === "bookmarks" && (
            <motion.div
              key="bookmarks-panel"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {bookmarks.length > 0 ? (
                bookmarks.map((course) => (
                  <div
                    key={course.id}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('a')) {
                        return;
                      }
                      navigate(`/course/${course.id}`, { state: { course } });
                    }}
                    className="glass-card border border-[var(--border)] rounded-3xl p-7 lg:p-8 hover:border-primary/30 cursor-pointer flex flex-col justify-between bg-[var(--surface)] shadow-[var(--shadow)] group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg border ${getPlatformStyle(course.platform)}`}>
                          {course.platform}
                        </span>
                        <button
                          onClick={() => onRemoveBookmark(course.id)}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
                          title="Remove Favorite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <h3 className="text-lg font-sans font-bold text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {course.name}
                      </h3>

                      <div className="flex items-center gap-x-3 text-xs font-semibold text-[var(--text-muted)]">
                        <div className="flex items-center text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-500 mr-1" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                        <div className="text-[var(--border)]">&bull;</div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          <span>{course.duration}</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed italic line-clamp-2">
                        {course.whyRecommended}
                      </p>
                    </div>

                    <div className="pt-6 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => navigate(`/course/${course.id}`, { state: { course } })}
                        className="py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all cursor-pointer hover:scale-102"
                      >
                        <span>Study Notes</span>
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                      </button>
                      <a
                        href={course.officialUrl || course.enrollUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 bg-[var(--surface-secondary)] hover:bg-primary/10 border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold rounded-xl flex items-center justify-center space-x-1 transition-all text-center hover:scale-102 shadow-sm"
                      >
                        <span>Enroll</span>
                        <ExternalLink className="h-3.5 w-3.5 text-primary" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-4 max-w-sm mx-auto">
                  <div className="p-4 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-full text-[var(--text-muted)] inline-block shadow-sm">
                    <Bookmark className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-sans font-bold text-[var(--text-primary)]">No bookmarked courses</h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Bookmark your favorite courses from generated AI curations to keep them in this quick access folder.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeSubTab === "progress" && (
            <motion.div
              key="progress-panel"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-5"
            >
              {progressTracker.length > 0 ? (
                progressTracker.map((p) => (
                  <div
                    key={p.courseId}
                    className="glass-card border border-[var(--border)] rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[var(--surface)] shadow-[var(--shadow)]"
                  >
                    <div className="space-y-2.5 w-full sm:max-w-xl">
                      <div className="flex items-center space-x-2">
                        <CheckSquare className="h-4 w-4 text-accent" />
                        <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">ACTIVE ROADMAP</span>
                      </div>
                      <h4 className="text-lg font-sans font-bold text-[var(--text-primary)]">
                        {p.courseName}
                      </h4>
                      
                      <div className="space-y-1.5">
                        <div className="w-full bg-[var(--surface-secondary)] h-2.5 rounded-full overflow-hidden border border-[var(--border)]">
                          <div 
                            className="bg-accent h-full rounded-full transition-all duration-300" 
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono font-bold text-[var(--text-muted)]">
                          <span>COMPLETED</span>
                          <span className="text-primary">{p.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          const matchingRoadmap = savedRoadmaps.find((r) => r.id === p.courseId);
                          if (matchingRoadmap) {
                            onSelectRoadmap(matchingRoadmap);
                          }
                        }}
                        className="px-5 py-2.5 btn-premium-primary text-xs sm:text-sm font-bold rounded-xl hover:scale-105 transition-all cursor-pointer shadow-md"
                      >
                        Open Syllabus
                      </button>
                      <button
                        onClick={() => handleClearProgress(p.courseId)}
                        className="p-2.5 bg-[var(--surface-secondary)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 rounded-xl border border-[var(--border)] hover:border-rose-500/20 transition-colors cursor-pointer shadow-sm"
                        title="Clear Progress Data"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
                  <div className="p-4 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-full text-[var(--text-muted)] inline-block shadow-sm">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-sans font-bold text-[var(--text-primary)]">No active study plans</h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Check task items inside your generated weekly plans to automatically log and monitor your learning metrics here.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
