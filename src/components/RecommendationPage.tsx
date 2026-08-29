import React, { useState, useEffect } from "react";
import { Compass, Sparkles, BookOpen, Clock, Tag, Globe, CheckCircle2, ChevronRight, AlertTriangle, Play, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RecommendationQuery, RecommendationResponse } from "../types";
import { getRecommendations } from "../services/api";

interface RecommendationPageProps {
  initialGoal?: string;
  onRecommendationGenerated: (rec: RecommendationResponse) => void;
  onAddHistory: (rec: RecommendationResponse) => void;
}

export default function RecommendationPage({ initialGoal = "", onRecommendationGenerated, onAddHistory }: RecommendationPageProps) {
  const [learningGoal, setLearningGoal] = useState(initialGoal);
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [studyTime, setStudyTime] = useState("1 hour/day");
  const [completionTarget, setCompletionTarget] = useState("3 months");
  const [platform, setPlatform] = useState("Any");
  const [budget, setBudget] = useState("Both");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Initiating Lumina AI assistant...");
  const [error, setError] = useState<string | null>(null);

  // Sync initialGoal if it changes
  useEffect(() => {
    if (initialGoal) {
      setLearningGoal(initialGoal);
    }
  }, [initialGoal]);

  const presetGoals = ["Python", "Web Development", "AI", "Machine Learning", "Cloud Computing"];

  const handlePresetClick = (preset: string) => {
    setLearningGoal(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learningGoal.trim()) {
      setError("Please specify a learning goal first.");
      return;
    }

    setError(null);
    setLoading(true);
    setProgress(5);
    setLoadingStatus("Formulating AI prompt with study constraints...");

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          clearInterval(progressInterval);
          return 92;
        }
        
        if (prev > 15 && prev < 35) {
          setLoadingStatus("Querying Gemini 3.5 model for high-tier courses...");
        } else if (prev >= 35 && prev < 55) {
          setLoadingStatus("Drafting optimal learning milestones...");
        } else if (prev >= 55 && prev < 75) {
          setLoadingStatus("Adjusting weekly roadmap around your study limits...");
        } else if (prev >= 75) {
          setLoadingStatus("Finalizing structured JSON output curation...");
        }
        
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 450);

    try {
      const query: RecommendationQuery = {
        learningGoal,
        skillLevel,
        studyTime,
        completionTarget,
        platform,
        budget,
      };

      const result = await getRecommendations(query);
      
      clearInterval(progressInterval);
      setProgress(100);
      setLoadingStatus("Curation complete! Formatting cards...");
      
      setTimeout(() => {
        setLoading(false);
        onRecommendationGenerated(result);
        onAddHistory(result);
      }, 700);

    } catch (err: any) {
      clearInterval(progressInterval);
      setLoading(false);
      console.error("Curation error:", err);
      
      let errorMsg = "Unable to generate recommendations right now. Please try again in a few moments.";
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout") || err.message?.includes("timed out")) {
        errorMsg = "Recommendation generation timed out. Please try again.";
      } else if (err.response?.data?.error) {
        const errorVal = err.response.data.error;
        let serverError = "";
        if (typeof errorVal === "string") {
          serverError = errorVal.toLowerCase();
        } else if (errorVal && typeof errorVal === "object") {
          serverError = (errorVal.message || JSON.stringify(errorVal)).toLowerCase();
        }
        
        if (
          serverError.includes("api key") || 
          serverError.includes("key") || 
          serverError.includes("unauthorized") || 
          serverError.includes("permission_denied") || 
          serverError.includes("quota") ||
          serverError.includes("limit")
        ) {
          errorMsg = "Unable to generate recommendations right now. Please try again in a few moments.";
        } else if (typeof errorVal === "string") {
          errorMsg = errorVal;
        } else if (errorVal && typeof errorVal === "object" && errorVal.message) {
          errorMsg = errorVal.message;
        } else {
          errorMsg = JSON.stringify(errorVal);
        }
      } else if (err.response?.data?.message) {
        errorMsg = String(err.response.data.message);
      } else if (err.message) {
        errorMsg = String(err.message);
      }
      setError(errorMsg);
    }
  };

  return (
    <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative pb-36">
      <AnimatePresence mode="wait">
        {!loading ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 sm:space-y-10"
          >
            {/* Header Title */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex p-3 bg-primary/10 border border-primary/20 rounded-2xl text-primary">
                <Compass className="h-7 w-7 animate-spin" style={{ animationDuration: "20s" }} />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
                Configure Your Course Recommendations
              </h1>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">
                Fine-tune your constraints below. Lumina AI will select suitable platforms, badges, durations, and map a bespoke schedule.
              </p>
            </div>

            {/* Error Message Box */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-[28px] space-y-3 text-sm sm:text-base leading-relaxed"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5.5 w-5.5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">Notice:</span> {error}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Main Preference Form */}
            <form onSubmit={handleSubmit} className="glass-card rounded-[36px] p-8 sm:p-12 lg:p-14 space-y-8 bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-lg)]">
              
              {/* Goal Input Field */}
              <div className="space-y-3">
                <label htmlFor="learning-goal-input" className="block text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  What are you looking to learn? <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <input
                    id="learning-goal-input"
                    type="text"
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value)}
                    placeholder="e.g., Python Basics, Web Development with React, Machine Learning Models..."
                    className="block w-full pl-13 pr-4 py-4 border border-[var(--input-border)] bg-[var(--input)] text-[var(--text-primary)] rounded-2xl placeholder-[var(--text-muted)] focus:outline-none focus:border-primary transition-all text-sm sm:text-base font-medium shadow-sm"
                    required
                  />
                </div>
                
                {/* Preset suggestions */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] flex items-center space-x-1 font-mono">
                    <Tag className="h-3.5 w-3.5" />
                    <span>Suggestions:</span>
                  </span>
                  {presetGoals.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      id={`preset-btn-${preset.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => handlePresetClick(preset)}
                      className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                        learningGoal.toLowerCase() === preset.toLowerCase()
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Skill Level Dropdown */}
                <div className="space-y-2.5">
                  <label htmlFor="skill-level-select" className="block text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    Current Skill Level
                  </label>
                  <select
                    id="skill-level-select"
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="block w-full px-4 py-3.5 border border-[var(--input-border)] bg-[var(--input)] text-[var(--text-primary)] rounded-2xl focus:outline-none focus:border-primary text-sm sm:text-base font-medium transition-all shadow-sm"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                {/* Daily study time dropdown */}
                <div className="space-y-2.5">
                  <label htmlFor="study-time-select" className="block text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    Daily Study Time
                  </label>
                  <select
                    id="study-time-select"
                    value={studyTime}
                    onChange={(e) => setStudyTime(e.target.value)}
                    className="block w-full px-4 py-3.5 border border-[var(--input-border)] bg-[var(--input)] text-[var(--text-primary)] rounded-2xl focus:outline-none focus:border-primary text-sm sm:text-base font-medium transition-all shadow-sm"
                  >
                    <option value="15 minutes/day">15 minutes/day</option>
                    <option value="30 minutes/day">30 minutes/day</option>
                    <option value="1 hour/day">1 hour/day</option>
                    <option value="2 hours/day">2 hours/day</option>
                  </select>
                </div>

                {/* Completion Target Timeframe dropdown */}
                <div className="space-y-2.5">
                  <label htmlFor="target-timeframe-select" className="block text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    Completion Target Timeframe
                  </label>
                  <select
                    id="target-timeframe-select"
                    value={completionTarget}
                    onChange={(e) => setCompletionTarget(e.target.value)}
                    className="block w-full px-4 py-3.5 border border-[var(--input-border)] bg-[var(--input)] text-[var(--text-primary)] rounded-2xl focus:outline-none focus:border-primary text-sm sm:text-base font-medium transition-all shadow-sm"
                  >
                    <option value="1 month">1 month</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                  </select>
                </div>

                {/* Preferred Learning Platform dropdown */}
                <div className="space-y-2.5">
                  <label htmlFor="platform-select" className="block text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    Preferred Platform
                  </label>
                  <select
                    id="platform-select"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="block w-full px-4 py-3.5 border border-[var(--input-border)] bg-[var(--input)] text-[var(--text-primary)] rounded-2xl focus:outline-none focus:border-primary text-sm sm:text-base font-medium transition-all shadow-sm"
                  >
                    <option value="Any">Any Platform</option>
                    <option value="Coursera">Coursera</option>
                    <option value="Udemy">Udemy</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Infosys Springboard">Infosys Springboard</option>
                    <option value="freeCodeCamp">freeCodeCamp</option>
                    <option value="NPTEL">NPTEL</option>
                    <option value="edX">edX</option>
                    <option value="MIT OCW">MIT OCW</option>
                  </select>
                </div>
              </div>

              {/* Budget radio toggle */}
              <div className="space-y-3 pt-2">
                <span className="block text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  Budget Preference
                </span>
                <div className="grid grid-cols-3 gap-4">
                  {["Free Only", "Paid Only", "Both"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      id={`budget-btn-${b.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => setBudget(b === "Paid Only" ? "Paid" : b)}
                      className={`py-4 px-4 text-sm sm:text-base font-semibold border rounded-2xl transition-all cursor-pointer shadow-sm ${
                        (budget === "Paid" && b === "Paid Only") || budget === b
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                          : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit trigger button */}
              <div className="pt-6">
                <button
                  type="submit"
                  id="generate-recommendations-btn"
                  className="w-full py-4.5 sm:py-5 btn-premium-primary text-white font-bold text-base sm:text-lg flex items-center justify-center space-x-2.5 rounded-2xl hover:scale-102 transition-all duration-300 shadow-xl shadow-primary/20"
                >
                  <Sparkles className="h-5 w-5 animate-pulse text-indigo-200" />
                  <span>Generate AI Recommendation</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

            </form>
          </motion.div>
        ) : (
          /* High-end loading assistant screen */
          <motion.div
            key="loading-assistant"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-[36px] p-8 sm:p-12 lg:p-16 text-center space-y-8 shadow-[var(--shadow-lg)] relative overflow-hidden py-20 bg-[var(--surface)] border border-[var(--border)]"
          >
            {/* Ambient lighting effect */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing spinning orb */}
            <div className="relative mx-auto h-28 w-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-2 rounded-full border border-secondary/10 border-b-secondary animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary animate-pulse shadow-[0_0_20px_rgba(124,92,255,0.6)]" />
            </div>

            {/* Title & Status */}
            <div className="space-y-3 max-w-md mx-auto relative z-10">
              <h3 className="text-2xl sm:text-3xl font-sans font-bold text-[var(--text-primary)]">
                Mapping Your bespoke Syllabus
              </h3>
              <p className="text-sm font-semibold text-primary animate-pulse min-h-[20px] font-mono uppercase tracking-wider">
                {loadingStatus}
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                Gemini 3.5 is calculating the estimated curriculum size, fetching ratings and badges, and structuring study tasks around your daily limits.
              </p>
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto space-y-2 relative z-10">
              <div className="w-full bg-[var(--surface-secondary)] h-3.5 rounded-full overflow-hidden border border-[var(--border)]">
                <motion.div
                  className="bg-gradient-to-r from-primary via-secondary to-accent h-full rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-mono font-semibold text-[var(--text-muted)]">
                <span>STAGE PROGRESS</span>
                <span className="text-primary">{progress}%</span>
              </div>
            </div>

            {/* Mini roadmap skeletal blocks */}
            <div className="max-w-sm mx-auto grid grid-cols-4 gap-2.5 pt-4 relative z-10 opacity-60">
              {[0, 1, 2, 3].map((v) => (
                <div key={v} className="h-2 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: `${v * 150}ms` }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
