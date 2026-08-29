import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./components/LandingPage";
import RecommendationPage from "./components/RecommendationPage";
import AIRecommendationPage from "./components/AIRecommendationPage";
import Dashboard from "./components/Dashboard";
import AboutPage from "./components/AboutPage";
import CourseDetailsPage from "./components/CourseDetailsPage";
import TutorPage from "./components/TutorPage";
import { RecommendationResponse, Course } from "./types";
import { Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import BackgroundConstellation from "./components/BackgroundConstellation";

export type ThemeMode = "dark" | "light";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<string>("home");
  const [initialGoal, setInitialGoal] = useState<string>("");
  const [currentRecommendation, setCurrentRecommendation] = useState<RecommendationResponse | null>(null);
  const [backSource, setBackSource] = useState<"recommend" | "dashboard">("recommend");

  // Load and initialize theme
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // 1. Check explicit theme in localStorage
    const savedTheme = localStorage.getItem("edu_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
    // 2. Check legacy boolean key
    const legacyDark = localStorage.getItem("edu_dark_mode");
    if (legacyDark !== null) {
      return legacyDark === "true" ? "dark" : "light";
    }
    // 3. Fallback to OS prefers-color-scheme
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  });

  const [bookmarks, setBookmarks] = useState<Course[]>(() => {
    const saved = localStorage.getItem("edu_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });

  const [savedRoadmaps, setSavedRoadmaps] = useState<RecommendationResponse[]>(() => {
    const saved = localStorage.getItem("edu_roadmaps");
    return saved ? JSON.parse(saved) : [];
  });

  // Apply theme globally whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("edu_theme", theme);
    localStorage.setItem("edu_dark_mode", JSON.stringify(theme === "dark"));
  }, [theme]);

  // Listen to OS preference changes if no manual choice has been saved in this session
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const userHasSaved = localStorage.getItem("edu_theme");
      if (!userHasSaved) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Persist bookmarks
  useEffect(() => {
    localStorage.setItem("edu_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Persist roadmaps
  useEffect(() => {
    localStorage.setItem("edu_roadmaps", JSON.stringify(savedRoadmaps));
  }, [savedRoadmaps]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const handleGetStarted = () => {
    setInitialGoal("");
    setCurrentRecommendation(null);
    setActiveTab("recommend");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExploreSkill = (skill: string) => {
    setInitialGoal(skill);
    setCurrentRecommendation(null);
    setActiveTab("recommend");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRecommendationGenerated = (rec: RecommendationResponse) => {
    setCurrentRecommendation(rec);
    setBackSource("recommend");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectRoadmap = (rec: RecommendationResponse) => {
    setCurrentRecommendation(rec);
    setBackSource("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddHistory = (rec: RecommendationResponse) => {
    if (!savedRoadmaps.some((r) => r.id === rec.id)) {
      setSavedRoadmaps((prev) => [rec, ...prev]);
    }
  };

  const handleSaveRoadmap = (rec: RecommendationResponse) => {
    if (!savedRoadmaps.some((r) => r.id === rec.id)) {
      setSavedRoadmaps((prev) => [rec, ...prev]);
    }
  };

  const handleRemoveRoadmap = (roadmapId: string) => {
    setSavedRoadmaps((prev) => prev.filter((r) => r.id !== roadmapId));
    localStorage.removeItem(`tasks-${roadmapId}`);
    const progressHistory = JSON.parse(localStorage.getItem("edu_progress") || "[]");
    const updatedProgress = progressHistory.filter((p: any) => p.courseId !== roadmapId);
    localStorage.setItem("edu_progress", JSON.stringify(updatedProgress));
  };

  const handleToggleBookmark = (course: Course) => {
    const index = bookmarks.findIndex((b) => b.id === course.id);
    if (index > -1) {
      setBookmarks((prev) => prev.filter((b) => b.id !== course.id));
    } else {
      setBookmarks((prev) => [...prev, course]);
    }
  };

  const handleRemoveBookmark = (courseId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== courseId));
  };

  const handleBackToSource = () => {
    setCurrentRecommendation(null);
    setActiveTab(backSource);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isCurrentRoadmapSaved = currentRecommendation 
    ? savedRoadmaps.some((r) => r.id === currentRecommendation.id) 
    : false;

  const bookmarkIds = bookmarks.map((b) => b.id);
  const isCoursePath = location.pathname.startsWith("/course/");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-300 relative selection:bg-primary/30 selection:text-white">
      {/* Animated Aurora Backdrop */}
      <div className="aurora-bg pointer-events-none">
        <div className="aurora-glow-1"></div>
        <div className="aurora-glow-2"></div>
        <div className="aurora-glow-3"></div>
        <div className="light-ray"></div>
      </div>

      {/* Floating Constellation Lines */}
      <BackgroundConstellation />

      {/* Top Navigation */}
      <div className="relative z-40">
        <Navbar 
          activeTab={isCoursePath ? "" : (currentRecommendation ? "" : activeTab)} 
          setActiveTab={(tab) => {
            setCurrentRecommendation(null);
            setActiveTab(tab);
            if (location.pathname !== "/") {
              navigate("/");
            }
          }} 
          darkMode={theme === "dark"} 
          toggleDarkMode={toggleTheme} 
        />
      </div>

      {/* Main Content Stage */}
      <main className="flex-grow relative z-10">
        <Routes>
          <Route path="/course/:courseId" element={<CourseDetailsPage />} />
          <Route path="/tutor" element={<TutorPage />} />
          <Route path="/*" element={
            <AnimatePresence mode="wait">
              {currentRecommendation ? (
                <motion.div
                  key="ai-recommendation-details"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <AIRecommendationPage
                    recommendation={currentRecommendation}
                    onBack={handleBackToSource}
                    bookmarks={bookmarkIds}
                    onToggleBookmark={handleToggleBookmark}
                    onSaveRoadmap={handleSaveRoadmap}
                    isSaved={isCurrentRoadmapSaved}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "home" && (
                    <LandingPage 
                      onGetStarted={handleGetStarted} 
                      onExploreSkills={handleExploreSkill} 
                    />
                  )}
                  {activeTab === "recommend" && (
                    <RecommendationPage
                      initialGoal={initialGoal}
                      onRecommendationGenerated={handleRecommendationGenerated}
                      onAddHistory={handleAddHistory}
                    />
                  )}
                  {activeTab === "dashboard" && (
                    <Dashboard
                      bookmarks={bookmarks}
                      onRemoveBookmark={handleRemoveBookmark}
                      savedRoadmaps={savedRoadmaps}
                      onRemoveRoadmap={handleRemoveRoadmap}
                      onSelectRoadmap={handleSelectRoadmap}
                      setActiveTab={setActiveTab}
                    />
                  )}
                  {activeTab === "about" && (
                    <AboutPage />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer setActiveTab={(tab) => {
          setCurrentRecommendation(null);
          setActiveTab(tab);
          if (location.pathname !== "/") {
            navigate("/");
          }
        }} />
      </div>

      {/* Floating AI Assistant Button */}
      {location.pathname !== "/tutor" && (
        <div className="fixed bottom-6 right-6 z-50 group">
          {/* Tooltip */}
          <span className="absolute right-16 bottom-3 scale-0 transition-all duration-200 rounded-lg bg-[var(--card)] text-[var(--text-primary)] backdrop-blur px-3 py-1.5 text-xs group-hover:scale-100 font-sans shadow-xl border border-[var(--border)] whitespace-nowrap">
            Ask AI Tutor
          </span>
          {/* Circular Button */}
          <button
            onClick={() => {
              navigate("/tutor");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-purple-600 text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/20"
            title="Ask AI Tutor"
          >
            <Bot className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
