import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, Star, ExternalLink, Bookmark, Check, Calendar, ArrowLeft, ArrowRight,
  Sparkles, Award, Clock, Share2, Compass, CheckCircle, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RecommendationResponse, Course } from "../types";
import StudyNotesPanel from "./StudyNotesPanel";
import QuizPanel from "./QuizPanel";
import InterviewPrepPanel from "./InterviewPrepPanel";

interface AIRecommendationPageProps {
  recommendation: RecommendationResponse;
  onBack: () => void;
  bookmarks: string[]; // List of bookmarked course IDs
  onToggleBookmark: (course: Course) => void;
  onSaveRoadmap: (rec: RecommendationResponse) => void;
  isSaved: boolean;
}

// 3D Tilt Card wrapper component for premium hover effect
interface ThreeDTiltCardProps {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  key?: string | number;
}

function ThreeDTiltCard({ children, onClick, className = "" }: ThreeDTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [shadow, setShadow] = useState("var(--shadow)");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 10;
    const rotateX = (((y / rect.height) - 0.5) * -10);

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setShadow("var(--shadow-lg)");
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setShadow("var(--shadow)");
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ transform, boxShadow: shadow, transition: "transform 0.1s ease-out, box-shadow 0.1s ease-out" }}
      className={`glass-card border border-[var(--border)] rounded-3xl p-6 sm:p-8 cursor-pointer flex flex-col justify-between group bg-[var(--surface)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export default function AIRecommendationPage({ 
  recommendation, 
  onBack, 
  bookmarks, 
  onToggleBookmark, 
  onSaveRoadmap,
  isSaved
}: AIRecommendationPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"courses" | "roadmap" | "schedule">("courses");
  const [activeAddon, setActiveAddon] = useState<"notes" | "quiz" | "interview" | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`tasks-${recommendation.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleToggleTask = (taskKey: string) => {
    const next = { ...completedTasks, [taskKey]: !completedTasks[taskKey] };
    setCompletedTasks(next);
    localStorage.setItem(`tasks-${recommendation.id}`, JSON.stringify(next));

    const totalTasks = recommendation.weeklyPlan.reduce((acc, week) => acc + week.tasks.length, 0);
    const checkedTasks = Object.values(next).filter(Boolean).length;
    const progressPercent = Math.round((checkedTasks / totalTasks) * 100);

    const progressHistory = JSON.parse(localStorage.getItem("edu_progress") || "[]");
    const existingIdx = progressHistory.findIndex((p: any) => p.courseId === recommendation.id);
    const progressObj = {
      courseId: recommendation.id,
      courseName: recommendation.learningGoal,
      progress: progressPercent,
      lastUpdated: new Date().toLocaleDateString(),
    };

    if (existingIdx > -1) {
      progressHistory[existingIdx] = progressObj;
    } else {
      progressHistory.push(progressObj);
    }
    localStorage.setItem("edu_progress", JSON.stringify(progressHistory));

    if (next[taskKey]) {
      showToast("Task completed! Progress updated.");
    }
  };

  const triggerBookmarkToggle = (course: Course) => {
    onToggleBookmark(course);
    const isBookmarked = bookmarks.includes(course.id);
    showToast(isBookmarked ? "Course removed from Bookmarks" : "Course added to Bookmarks!");
  };

  const triggerSaveCuration = () => {
    onSaveRoadmap(recommendation);
    showToast("Curation saved to your dashboard!");
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

  const getDifficultyColor = (diff: string) => {
    const d = diff.toLowerCase();
    if (d.includes("begin")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (d.includes("inter")) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-rose-500/10 text-rose-500 border-rose-500/20";
  };

  const totalTasksCount = recommendation.weeklyPlan.reduce((acc, week) => acc + week.tasks.length, 0);
  const completedTasksCount = Object.values(completedTasks).filter(Boolean).length;
  const currentProgressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-24 sm:py-28 relative space-y-12 sm:space-y-16 pb-36">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[var(--surface-secondary)] text-[var(--text-primary)] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-sm font-semibold border border-[var(--border)]"
          >
            <div className="h-2 w-2 rounded-full bg-accent animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-2 px-4 bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-primary/30 rounded-full cursor-pointer shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Form Preferences</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={triggerSaveCuration}
            disabled={isSaved}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2 border cursor-pointer ${
              isSaved
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 cursor-default"
                : "btn-premium-primary border-transparent hover:scale-105 shadow-md"
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>{isSaved ? "Saved to Dashboard" : "Save Learning Roadmap"}</span>
          </button>
        </div>
      </div>

      {/* Top recommendation summary header card */}
      <div className="glass-card rounded-[36px] p-8 sm:p-12 lg:p-14 mb-10 border border-[var(--border)] relative overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        {/* Glow rings */}
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-secondary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-primary text-xs font-mono tracking-wider">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span>AI CURATION COMPLETE</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
              Bespoke Study Plan: {recommendation.learningGoal}
            </h1>
            <p className="text-[var(--text-secondary)] text-base sm:text-lg leading-relaxed max-w-4xl">
              {recommendation.summary}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-[var(--border)]">
            <div>
              <span className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">Target Duration</span>
              <span className="text-xl lg:text-2xl font-sans font-extrabold text-[var(--text-primary)] mt-1 block">{recommendation.estimatedCompletionTime}</span>
            </div>
            <div>
              <span className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">Skill Level</span>
              <span className="text-xl lg:text-2xl font-sans font-extrabold text-[var(--text-primary)] mt-1 block">{recommendation.skillLevel}</span>
            </div>
            <div>
              <span className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">Daily Study Time</span>
              <span className="text-xl lg:text-2xl font-sans font-extrabold text-[var(--text-primary)] mt-1 block">{recommendation.dailyStudyTime}</span>
            </div>
            <div>
              <span className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">Syllabus Progress</span>
              <span className="text-xl lg:text-2xl font-sans font-extrabold text-[var(--text-primary)] mt-1 block">{currentProgressPercent}% Checked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-[var(--border)] mb-8 space-x-6">
        {[
          { id: "courses", label: "Recommended Courses", icon: BookOpen },
          { id: "roadmap", label: "Learning Roadmap", icon: Compass },
          { id: "schedule", label: "Weekly Schedule", icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2.5 pb-4 text-sm sm:text-base font-bold transition-all relative border-b-2 -mb-[2px] cursor-pointer ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="min-h-[400px]">
        {activeTab === "courses" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
          >
            {recommendation.courses.map((course) => {
              const isBookmarked = bookmarks.includes(course.id);
              const isExpanded = expandedCourse === course.id;

              return (
                <ThreeDTiltCard
                  key={course.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('a')) {
                      return;
                    }
                    navigate(`/course/${course.id}`, { state: { course, recommendation } });
                  }}
                >
                  <div className="space-y-4">
                    {/* Header: Platform Badge + Action icons */}
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border ${getPlatformStyle(course.platform)}`}>
                        {course.platform}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-[10px] font-mono font-bold bg-accent/10 border border-accent/20 text-accent rounded-md">
                          98% MATCH
                        </span>
                        
                        <button
                          onClick={() => triggerBookmarkToggle(course)}
                          className={`p-2 rounded-full border transition-all cursor-pointer ${
                            isBookmarked
                              ? "bg-rose-500/20 border-rose-500/30 text-rose-500 hover:scale-115"
                              : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:scale-115"
                          }`}
                          title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                        >
                          <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-rose-500" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Course Name */}
                    <h3 className="text-xl font-sans font-bold text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {course.name}
                    </h3>

                    {/* Rating and badges row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[var(--text-muted)]">
                      <div className="flex items-center text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500 mr-1" />
                        <span>{course.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center text-[var(--border)]">&bull;</div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{course.duration}</span>
                      </div>
                    </div>

                    {/* Badge Pill Indicators */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getDifficultyColor(course.difficulty)}`}>
                        {course.difficulty}
                      </span>
                      {course.certificate && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center space-x-1">
                          <Award className="h-3 w-3" />
                          <span>Certificate Included</span>
                        </span>
                      )}
                    </div>

                    {/* Why recommended explanation */}
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-2">
                      <span className="font-bold text-[var(--text-primary)]">Why recommended:</span> {course.whyRecommended}
                    </p>

                    {/* Expandable outcome section */}
                    <div className="pt-2">
                      <button
                        onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                        className="flex items-center space-x-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        <span>{isExpanded ? "Hide Outcome" : "View Expected Outcome"}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2 p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]"
                          >
                            {course.expectedOutcome}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Action triggers */}
                  <div className="pt-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate(`/course/${course.id}`, { state: { course, recommendation } })}
                      className="py-3 px-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer hover:scale-102"
                    >
                      <span>Study Assistant</span>
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                    </button>
                    <a
                      href={course.officialUrl || course.enrollUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-4 bg-[var(--surface-secondary)] hover:bg-primary/10 border border-[var(--border)] text-[var(--text-primary)] text-sm font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all text-center hover:scale-102 shadow-sm"
                    >
                      <span>🚀 Open Course</span>
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    </a>
                  </div>
                </ThreeDTiltCard>
              );
            })}
          </motion.div>
        )}

        {activeTab === "roadmap" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 max-w-4xl xl:max-w-5xl mx-auto"
          >
            <div className="text-center pb-2 max-w-lg mx-auto">
              <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)]">
                Visual Milestone Sequence
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                A custom curated visual flow of educational phases mapped to meet your completion timeframe.
              </p>
            </div>

            {/* Timeline */}
            <div className="relative border-l-2 border-[var(--border)] ml-4 md:ml-10 space-y-10 py-2">
              {recommendation.roadmap.map((milestone, idx) => {
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="relative pl-8 md:pl-12 group"
                  >
                    <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-[var(--background)] bg-primary group-hover:scale-125 transition-transform" />

                    <div className="glass-card border border-[var(--border)] p-7 rounded-3xl shadow-[var(--shadow)] hover:shadow-md transition-shadow bg-[var(--surface)]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <h4 className="text-lg font-sans font-extrabold text-[var(--text-primary)]">
                          {milestone.title}
                        </h4>
                        <span className="px-3 py-1 text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 rounded-full self-start">
                          {milestone.duration}
                        </span>
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                        {milestone.description}
                      </p>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                          CORE OBJECTIVES:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {milestone.keyTopics.map((topic, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 text-xs bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-xl font-medium border border-[var(--border)]"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="glass-card border border-[var(--border)] rounded-3xl p-8 space-y-4 bg-[var(--surface)] shadow-[var(--shadow)]">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest block">
                Recommended Skills to Learn Next
              </span>
              <div className="flex flex-wrap gap-2.5">
                {recommendation.skillsToLearnNext.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 text-sm font-semibold rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] flex items-center space-x-1.5 shadow-sm"
                  >
                    <Sparkles className="h-4 w-4 text-accent shrink-0" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "schedule" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl xl:max-w-5xl mx-auto"
          >
            <div className="text-center pb-2 max-w-lg mx-auto">
              <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)]">
                Interactive Week-by-Week Syllabus
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Mark tasks off as you complete them to automatically increment your dashboard statistics.
              </p>
            </div>

            <div className="space-y-6">
              {recommendation.weeklyPlan.map((week) => {
                return (
                  <div
                    key={week.week}
                    className="glass-card border border-[var(--border)] rounded-3xl p-7 shadow-[var(--shadow)] space-y-4 bg-[var(--surface)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold font-mono text-sm">
                          W{week.week}
                        </div>
                        <div>
                          <h4 className="text-lg font-sans font-extrabold text-[var(--text-primary)]">
                            Week {week.week}: {week.title}
                          </h4>
                          <p className="text-xs text-[var(--text-muted)] font-medium">
                            Focus: {week.focus}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Task checklist */}
                    <div className="space-y-2.5 pt-1">
                      {week.tasks.map((task, i) => {
                        const taskKey = `${recommendation.id}-w${week.week}-t${i}`;
                        const isChecked = !!completedTasks[taskKey];

                        return (
                          <div
                            key={i}
                            onClick={() => handleToggleTask(taskKey)}
                            className={`flex items-start space-x-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                              isChecked
                                ? "bg-emerald-500/10 border-emerald-500/20 text-[var(--text-muted)] line-through"
                                : "bg-[var(--surface-secondary)] border-[var(--border)] hover:border-primary/40 text-[var(--text-primary)] shadow-sm"
                            }`}
                          >
                            <button
                              type="button"
                              className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                isChecked
                                  ? "bg-accent border-accent text-slate-900"
                                  : "border-[var(--border)] bg-[var(--surface)]"
                              }`}
                            >
                              {isChecked && <Check className="h-3.5 w-3.5 font-bold" />}
                            </button>
                            <span className="text-sm font-medium leading-relaxed">
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Learning Add-ons Section */}
      <div className="mt-16 pt-10 border-t border-[var(--border)] space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 text-xs font-mono tracking-wider">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span>AI STUDY COMPANION ADD-ONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-[var(--text-primary)]">
            Supercharge Your Mastery
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Generate personalized notes, active recall quizzes, and interactive graded interview preparation guides.
          </p>
        </div>

        {/* Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          <button
            onClick={() => {
              setActiveAddon(activeAddon === "notes" ? null : "notes");
              setTimeout(() => {
                document.getElementById("study-notes-section")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            className={`px-6 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center space-x-2 border shadow-sm cursor-pointer hover:scale-105 ${
              activeAddon === "notes"
                ? "bg-primary border-primary text-white shadow-lg"
                : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40"
            }`}
          >
            <span>📖</span>
            <span>Generate Study Notes</span>
          </button>

          <button
            onClick={() => {
              setActiveAddon(activeAddon === "quiz" ? null : "quiz");
              setTimeout(() => {
                document.getElementById("quiz-section")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            className={`px-6 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center space-x-2 border shadow-sm cursor-pointer hover:scale-105 ${
              activeAddon === "quiz"
                ? "bg-primary border-primary text-white shadow-lg"
                : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40"
            }`}
          >
            <span>📝</span>
            <span>Generate Quiz</span>
          </button>

          <button
            onClick={() => {
              setActiveAddon(activeAddon === "interview" ? null : "interview");
              setTimeout(() => {
                document.getElementById("interview-section")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            className={`px-6 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center space-x-2 border shadow-sm cursor-pointer hover:scale-105 ${
              activeAddon === "interview"
                ? "bg-primary border-primary text-white shadow-lg"
                : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40"
            }`}
          >
            <span>💼</span>
            <span>Interview Preparation</span>
          </button>
        </div>

        {/* Conditionally Render Active Addon Panel */}
        <AnimatePresence mode="wait">
          {activeAddon === "notes" && (
            <motion.div
              key="notes"
              id="study-notes-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <StudyNotesPanel learningGoal={recommendation.learningGoal} />
            </motion.div>
          )}

          {activeAddon === "quiz" && (
            <motion.div
              key="quiz"
              id="quiz-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <QuizPanel 
                learningGoal={recommendation.learningGoal} 
                skillLevel={recommendation.skillLevel} 
              />
            </motion.div>
          )}

          {activeAddon === "interview" && (
            <motion.div
              key="interview"
              id="interview-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewPrepPanel 
                learningGoal={recommendation.learningGoal} 
                skillLevel={recommendation.skillLevel} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer trigger */}
      <div className="flex justify-center items-center gap-4 mt-16 pt-8 border-t border-[var(--border)]">
        <button
          onClick={onBack}
          className="px-6 py-3.5 bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-primary/40 text-[var(--text-primary)] rounded-2xl font-bold text-sm transition-all flex items-center space-x-2 cursor-pointer hover:scale-105 shadow-sm"
        >
          <RefreshCw className="h-4 w-4 text-[var(--text-muted)]" />
          <span>Form Preferences</span>
        </button>
      </div>
    </div>
  );
}
