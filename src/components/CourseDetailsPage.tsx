import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { 
  BookOpen, Star, Award, Clock, ArrowLeft, Sparkles, CheckCircle2, XCircle, 
  AlertCircle, Download, Copy, Check, HelpCircle, Lightbulb, 
  ChevronDown, ChevronUp, Bookmark, ExternalLink, Briefcase, ClipboardCheck, 
  RotateCcw, FileText, Compass, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { jsPDF } from "jspdf";
import { 
  generateCourseNotes, 
  generateCourseQuiz, 
  generateCourseInterview, 
  generateCourseRevision,
  getCourseById,
  getSimilarCourses,
} from "../services/api";
import { Course, RecommendationResponse, QuizQuestion, InterviewQuestion } from "../types";

// Helper function for skill list based on course name or keywords
const getCourseSkills = (course: Course, recommendation?: RecommendationResponse): string[] => {
  const list = new Set<string>();
  if (recommendation && recommendation.skillsToLearnNext && recommendation.skillsToLearnNext.length > 0) {
    recommendation.skillsToLearnNext.forEach(s => list.add(s));
  }

  if (course.skills && course.skills.length > 0) {
    course.skills.forEach(s => list.add(s));
    return Array.from(list).slice(0, 5);
  }
  
  const name = course.name.toLowerCase();
  if (name.includes("python")) {
    ["Python Basics", "Functions", "Object Oriented Programming", "File Handling", "Projects"].forEach(s => list.add(s));
  } else if (name.includes("react")) {
    ["React Hooks", "JSX & Components", "State Management", "Routing", "API Integration"].forEach(s => list.add(s));
  } else if (name.includes("javascript") || name.includes("js")) {
    ["ES6+ Features", "Asynchronous JS", "DOM Manipulation", "Data Structures", "Closures"].forEach(s => list.add(s));
  } else if (name.includes("data") || name.includes("sql")) {
    ["Data Analysis", "SQL Queries", "Data Visualization", "Pandas & NumPy", "Database Design"].forEach(s => list.add(s));
  } else if (name.includes("machine learning") || name.includes("ml") || name.includes("ai")) {
    ["Supervised Learning", "Deep Learning", "Model Evaluation", "Neural Networks", "Feature Engineering"].forEach(s => list.add(s));
  } else {
    const words = course.name.split(" ").filter(w => w.length > 4).slice(0, 3);
    words.forEach(w => list.add(w + " Core"));
    ["Hands-on Labs", "Best Practices", "Capstone Project"].forEach(s => list.add(s));
  }
  
  return Array.from(list).slice(0, 5);
};

// Helper function to render platform styling
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

// Helper function for difficulty badge styling
const getDifficultyColor = (diff: string) => {
  const d = diff.toLowerCase();
  if (d.includes("begin")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (d.includes("inter")) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-rose-500/10 text-rose-500 border-rose-500/20";
};

export default function CourseDetailsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [similarCourses, setSimilarCourses] = useState<Course[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  
  // Local Bookmarks lists
  const [bookmarks, setBookmarks] = useState<Course[]>(() => {
    const saved = localStorage.getItem("edu_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"notes" | "quiz" | "interview" | "revision" | null>(null);
  
  // Learning Tool state managers
  const [toolLoading, setToolLoading] = useState(false);
  const [toolError, setToolError] = useState<string | null>(null);

  // Generated results
  const [generatedNotes, setGeneratedNotes] = useState<string | null>(null);
  const [generatedRevision, setGeneratedRevision] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[]>([]);
  const [generatedInterview, setGeneratedInterview] = useState<{
    beginner: InterviewQuestion[];
    intermediate: InterviewQuestion[];
    advanced: InterviewQuestion[];
  } | null>(null);

  // Notes Copy state
  const [notesCopied, setNotesCopied] = useState(false);
  const [revisionCopied, setRevisionCopied] = useState(false);

  // Quiz player states
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Interview state managers
  const [interviewLevel, setInterviewLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  // Course Progress state
  const [completedRoadmapSteps, setCompletedRoadmapSteps] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`course-roadmap-${courseId}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Load course details
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // 1. Try to fetch from router state first
    if (location.state && location.state.course) {
      setCourse(location.state.course);
      if (location.state.recommendation) {
        setRecommendation(location.state.recommendation);
      }
      return;
    }

    // 2. Lookup in local storage
    if (courseId) {
      const roadmaps: RecommendationResponse[] = JSON.parse(localStorage.getItem("edu_roadmaps") || "[]");
      let foundCourse: Course | null = null;
      let foundRec: RecommendationResponse | null = null;

      for (const rec of roadmaps) {
        const matching = rec.courses.find(c => c.id === courseId);
        if (matching) {
          foundCourse = matching;
          foundRec = rec;
          break;
        }
      }

      if (!foundCourse) {
        // Look in bookmarks
        const bms: Course[] = JSON.parse(localStorage.getItem("edu_bookmarks") || "[]");
        foundCourse = bms.find(c => c.id === courseId) || null;
      }

      if (foundCourse) {
        setCourse(foundCourse);
        if (foundRec) {
          setRecommendation(foundRec);
        }
      } else if (courseId) {
        getCourseById(courseId)
          .then((catalogCourse) => {
            setCourse(catalogCourse);
          })
          .catch(() => {
            setToolError("Course details could not be found. Returning to previous view.");
            setTimeout(() => {
              navigate("/");
            }, 3000);
          });
      } else {
        setToolError("Course details could not be found. Returning to previous view.");
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    }
  }, [courseId, location.state, navigate]);

  useEffect(() => {
    if (!courseId || !course) return;
    setSimilarLoading(true);
    getSimilarCourses(courseId, 8)
      .then((courses) => setSimilarCourses(courses))
      .catch(() => setSimilarCourses([]))
      .finally(() => setSimilarLoading(false));
  }, [courseId, course?.id]);

  // Persist Bookmarks update
  const isBookmarked = course ? bookmarks.some(b => b.id === course.id) : false;

  const triggerBookmarkToggle = () => {
    if (!course) return;
    let updated: Course[];
    if (isBookmarked) {
      updated = bookmarks.filter(b => b.id !== course.id);
      showToast("Removed from bookmarks");
    } else {
      updated = [...bookmarks, course];
      showToast("Added to bookmarks!");
    }
    setBookmarks(updated);
    localStorage.setItem("edu_bookmarks", JSON.stringify(updated));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Syllabus completed tasks logic
  const roadmapItems = recommendation?.roadmap || [];
  const totalSteps = roadmapItems.length;
  const completedStepsCount = Object.values(completedRoadmapSteps).filter(Boolean).length;
  const syllabusProgressPercent = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

  const toggleRoadmapStep = (title: string) => {
    const updated = {
      ...completedRoadmapSteps,
      [title]: !completedRoadmapSteps[title]
    };
    setCompletedRoadmapSteps(updated);
    localStorage.setItem(`course-roadmap-${courseId}`, JSON.stringify(updated));
    showToast(updated[title] ? "Milestone marked as complete!" : "Milestone updated.");
  };

  // AI Learning Tools Handlers
  const [loadingStep, setLoadingStep] = useState<string>("Analyzing Course & Materials...");
  const [loadingSubText, setLoadingSubText] = useState<string>("Gemini is structuring custom content...");
  const loadingTimerRef = React.useRef<any>(null);

  const startLoadingSequence = (tool: "notes" | "quiz" | "interview" | "revision") => {
    if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    setToolLoading(true);
    setToolError(null);

    let steps: { title: string; sub: string }[] = [];
    if (tool === "notes") {
      steps = [
        { title: "Analyzing syllabus and course roadmap...", sub: "Extracting skills covered and milestone goals..." },
        { title: "Drafting lesson objectives and checklists...", sub: "Setting specific, measurable study outcomes..." },
        { title: "Synthesizing key concepts...", sub: "Assembling collapsible panels with practical examples..." },
        { title: "Structuring essential definitions...", sub: "Formatting tabular listings for quick reference..." },
        { title: "Injecting code examples & pro tips...", sub: "Drafting blockquotes and snippets..." }
      ];
    } else if (tool === "quiz") {
      steps = [
        { title: "Evaluating course difficulty...", sub: "Calibrating questions to match your current skill level..." },
        { title: "Designing high-quality queries...", sub: "Drafting four unique multiple-choice options..." },
        { title: "Generating incorrect distractor options...", sub: "Making sure wrong options are educational..." },
        { title: "Assembling step-by-step feedback...", sub: "Creating detailed explanations of why solutions work..." }
      ];
    } else if (tool === "interview") {
      steps = [
        { title: "Extracting core and advanced tech topics...", sub: "Sifting key terms from course roadmap..." },
        { title: "Drafting beginner & intermediate questions...", sub: "Focusing on fundamental concepts and implementation..." },
        { title: "Synthesizing interviewer evaluation motives...", sub: "Highlighting why interviewers ask these questions..." },
        { title: "Assembling pitfalls and pro tips...", sub: "Creating high-impact advice to help you stand out..." }
      ];
    } else {
      steps = [
        { title: "Sifting through course keywords...", sub: "Gathering core takeaways for high-density review..." },
        { title: "Compiling cheat sheets and definitions...", sub: "Formatting compact syntax charts..." },
        { title: "Generating creative memory tricks...", sub: "Drafting mnemonics and practical analogies..." },
        { title: "Building pre-project checklists...", sub: "Creating the ultimate verification steps..." }
      ];
    }

    setLoadingStep(steps[0].title);
    setLoadingSubText(steps[0].sub);

    let currentStep = 0;
    loadingTimerRef.current = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep].title);
        setLoadingSubText(steps[currentStep].sub);
      } else {
        if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      }
    }, 1800);
  };

  const stopLoadingSequence = () => {
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    setToolLoading(false);
  };

  useEffect(() => {
    // Session caching loader
    if (courseId) {
      const cachedNotes = sessionStorage.getItem(`edu_notes_${courseId}`);
      const cachedRevision = sessionStorage.getItem(`edu_revision_${courseId}`);
      const cachedQuiz = sessionStorage.getItem(`edu_quiz_${courseId}`);
      const cachedInterview = sessionStorage.getItem(`edu_interview_${courseId}`);

      setGeneratedNotes(cachedNotes || null);
      setGeneratedRevision(cachedRevision || null);
      setGeneratedQuiz(cachedQuiz ? JSON.parse(cachedQuiz) : []);
      setGeneratedInterview(cachedInterview ? JSON.parse(cachedInterview) : null);
    }

    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, [courseId]);

  const [regenerationCounts, setRegenerationCounts] = useState<{ notes: number; quiz: number; interview: number; revision: number }>({
    notes: 0,
    quiz: 0,
    interview: 0,
    revision: 0,
  });

  const handleGenerateNotes = async (forceRegenerate = false) => {
    if (!course) return;
    setActiveTool("notes");
    startLoadingSequence("notes");
    setGeneratedNotes(null);
    try {
      const nextIteration = forceRegenerate ? regenerationCounts.notes + 1 : (regenerationCounts.notes || 1);
      if (forceRegenerate) {
        setRegenerationCounts(prev => ({ ...prev, notes: nextIteration }));
      }
      const skills = getCourseSkills(course, recommendation);
      const notesResult = await generateCourseNotes({
        courseName: course.name,
        platform: course.platform,
        courseDescription: course.description || course.expectedOutcome,
        difficulty: course.difficulty,
        roadmap: roadmapItems,
        skillsCovered: skills,
        regenerate: forceRegenerate,
        iteration: nextIteration,
        seed: Date.now()
      });
      setGeneratedNotes(notesResult.notes);
      sessionStorage.setItem(`edu_notes_${courseId}`, notesResult.notes);
      setTimeout(() => {
        const el = document.getElementById("active-tool-display");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } catch (err: any) {
      console.error(err);
      setToolError(err.response?.data?.error || "Failed to generate customized notes. Please try again.");
    } finally {
      stopLoadingSequence();
    }
  };

  const handleGenerateQuiz = async () => {
    if (!course) return;
    setActiveTool("quiz");
    startLoadingSequence("quiz");
    setGeneratedQuiz([]);
    setCurrentQuizIdx(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    try {
      const skills = getCourseSkills(course, recommendation);
      const quizResult = await generateCourseQuiz({
        courseName: course.name,
        platform: course.platform,
        courseDescription: course.description || course.expectedOutcome,
        difficulty: course.difficulty,
        roadmap: roadmapItems,
        skillsCovered: skills,
        skillLevel: recommendation?.skillLevel || course.difficulty
      });
      if (quizResult.questions && quizResult.questions.length > 0) {
        setGeneratedQuiz(quizResult.questions);
        sessionStorage.setItem(`edu_quiz_${courseId}`, JSON.stringify(quizResult.questions));
        setTimeout(() => {
          const el = document.getElementById("active-tool-display");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }, 150);
      } else {
        throw new Error("No quiz questions generated.");
      }
    } catch (err: any) {
      console.error(err);
      setToolError(err.response?.data?.error || "Failed to generate customized quiz questions. Please try again.");
    } finally {
      stopLoadingSequence();
    }
  };

  const handleGenerateInterview = async () => {
    if (!course) return;
    setActiveTool("interview");
    startLoadingSequence("interview");
    setGeneratedInterview(null);
    setExpandedQuestions({});
    setInterviewLevel("beginner");
    try {
      const skills = getCourseSkills(course, recommendation);
      const interviewResult = await generateCourseInterview({
        courseName: course.name,
        platform: course.platform,
        courseDescription: course.description || course.expectedOutcome,
        difficulty: course.difficulty,
        roadmap: roadmapItems,
        skillsCovered: skills
      });
      setGeneratedInterview(interviewResult);
      sessionStorage.setItem(`edu_interview_${courseId}`, JSON.stringify(interviewResult));
      setTimeout(() => {
        const el = document.getElementById("active-tool-display");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
        setExpandedQuestions({ 0: true });
      }, 150);
    } catch (err: any) {
      console.error(err);
      setToolError(err.response?.data?.error || "Failed to generate customized interview questions. Please try again.");
    } finally {
      stopLoadingSequence();
    }
  };

  const handleGenerateRevision = async () => {
    if (!course) return;
    setActiveTool("revision");
    startLoadingSequence("revision");
    setGeneratedRevision(null);
    try {
      const skills = getCourseSkills(course, recommendation);
      const revisionResult = await generateCourseRevision({
        courseName: course.name,
        platform: course.platform,
        courseDescription: course.description || course.expectedOutcome,
        difficulty: course.difficulty,
        roadmap: roadmapItems,
        skillsCovered: skills
      });
      setGeneratedRevision(revisionResult.revision);
      sessionStorage.setItem(`edu_revision_${courseId}`, revisionResult.revision);
      setTimeout(() => {
        const el = document.getElementById("active-tool-display");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } catch (err: any) {
      console.error(err);
      setToolError(err.response?.data?.error || "Failed to generate revision cheat sheet. Please try again.");
    } finally {
      stopLoadingSequence();
    }
  };

  const handleRegenerate = () => {
    if (!course || !activeTool) return;
    if (activeTool === "notes") {
      sessionStorage.removeItem(`edu_notes_${courseId}`);
      showToast("Regenerating comprehensive 10-module study notes...");
      handleGenerateNotes(true);
    } else if (activeTool === "quiz") {
      sessionStorage.removeItem(`edu_quiz_${courseId}`);
      showToast("Regenerating practice quiz...");
      handleGenerateQuiz();
    } else if (activeTool === "interview") {
      sessionStorage.removeItem(`edu_interview_${courseId}`);
      showToast("Regenerating interview preparation guide...");
      handleGenerateInterview();
    } else if (activeTool === "revision") {
      sessionStorage.removeItem(`edu_revision_${courseId}`);
      showToast("Regenerating quick revision sheet...");
      handleGenerateRevision();
    }
  };

  const navigateToTool = async (tool: "notes" | "quiz" | "interview" | "revision") => {
    setActiveTool(tool);
    
    let hasData = false;
    if (tool === "notes" && generatedNotes) hasData = true;
    if (tool === "quiz" && generatedQuiz && generatedQuiz.length > 0) hasData = true;
    if (tool === "interview" && generatedInterview) hasData = true;
    if (tool === "revision" && generatedRevision) hasData = true;
    
    if (!hasData) {
      if (tool === "notes") await handleGenerateNotes();
      else if (tool === "quiz") await handleGenerateQuiz();
      else if (tool === "interview") await handleGenerateInterview();
      else if (tool === "revision") await handleGenerateRevision();
    } else {
      setTimeout(() => {
        const el = document.getElementById("active-tool-display");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
        if (tool === "interview") {
          setInterviewLevel("beginner");
          setExpandedQuestions({ 0: true });
        }
      }, 150);
    }
  };

  const handleCopyText = (text: string, type: "notes" | "revision") => {
    navigator.clipboard.writeText(text);
    if (type === "notes") {
      setNotesCopied(true);
      setTimeout(() => setNotesCopied(false), 2000);
    } else {
      setRevisionCopied(true);
      setTimeout(() => setRevisionCopied(false), 2000);
    }
    showToast("Content copied to clipboard!");
  };

  const handleDownloadPDF = (text: string, title: string) => {
    if (!course) return;
    const doc = new jsPDF();
    doc.setProperties({
      title: title,
      subject: `Lumina AI Course Masterclass Companion`,
      author: "Lumina AI"
    });

    // Primary Header Banner
    doc.setFillColor(124, 92, 255);
    doc.rect(0, 0, 210, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(title.toUpperCase(), 15, 16);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Course: ${course.name} | Platform: ${course.platform || "Lumina Learning Ecosystem"}`, 15, 25);
    doc.text(`Generated by Lumina AI Copilot | Comprehensive 10-Module Masterclass Handbook`, 15, 32);

    doc.setTextColor(30, 41, 59);
    let y = 48;
    const pageHeight = 297;
    const margin = 15;
    const bottomMargin = 22;

    const cleanText = text
      .replace(/<details>[\s\S]*?<summary>(.*?)<\/summary>/g, "\n[DEEP DIVE: $1]\n")
      .replace(/<\/details>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/#+\s+(.*)/g, "\n$1\n")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`(.*?)`/g, "$1");

    const lines = doc.splitTextToSize(cleanText, 180);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (y > pageHeight - bottomMargin) {
        doc.addPage();
        y = margin + 8;
      }
      
      const isHeader = line.startsWith("Module") || line.startsWith("MODULE") || line.startsWith("Chapter") || line.startsWith("CHAPTER") || line.startsWith("##") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.") || line.startsWith("5.") || line.startsWith("6.") || line.startsWith("7.") || line.startsWith("8.") || line.startsWith("9.") || line.startsWith("10.");
      
      if (isHeader) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(124, 92, 255);
        doc.text(line, margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
      } else {
        doc.text(line, margin, y);
      }
      y += 5.2;
    }

    // Add page numbers
    const totalPages = doc.internal.pages.length - 1;
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Lumina AI Study Handbook — Page ${p} of ${totalPages}`, 105, 290, { align: "center" });
    }

    doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.pdf`);
    showToast("PDF Download initiated!");
  };

  // Quiz player statistics
  const currentQuizQuestions = generatedQuiz;
  const answeredCount = Object.keys(selectedAnswers).length;
  const quizCorrectCount = currentQuizQuestions.reduce((acc, q, idx) => {
    const userAns = selectedAnswers[idx];
    if (userAns && q.correctAnswer && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const quizScorePercent = currentQuizQuestions.length > 0 
    ? Math.round((quizCorrectCount / currentQuizQuestions.length) * 100) 
    : 0;

  const skills = course ? getCourseSkills(course, recommendation) : [];

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto" />
        <p className="text-[var(--text-muted)] text-sm">Loading course details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-24 sm:py-28 relative space-y-12 pb-36">
      {/* Toast Alert */}
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

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2.5 text-xs sm:text-sm font-semibold text-[var(--text-muted)] mb-4 border-b border-[var(--border)] pb-4">
        <button onClick={() => navigate("/")} className="hover:text-primary transition-colors cursor-pointer">
          Home
        </button>
        <span className="text-[var(--border)]">/</span>
        <button onClick={() => navigate(-1)} className="hover:text-primary transition-colors cursor-pointer">
          Recommendations
        </button>
        <span className="text-[var(--border)]">/</span>
        <span className="text-[var(--text-primary)] font-extrabold truncate max-w-[200px] sm:max-w-xs md:max-w-md">
          {course.name}
        </span>
      </nav>

      {/* Top action details page back button */}
      <div className="mb-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all py-2 px-4 bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-primary/40 rounded-full cursor-pointer shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Recommendation Plan</span>
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Left Column: Main Course details */}
        <div className="lg:col-span-8 space-y-8 lg:space-y-10">
          
          {/* HERO CARD */}
          <div className="glass-card rounded-[36px] p-8 sm:p-12 lg:p-14 border border-[var(--border)] relative overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-lg)]">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-6">
              {/* Badges/Meta Header */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl border ${getPlatformStyle(course.platform)}`}>
                  {course.platform}
                </span>
                <span className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${getDifficultyColor(course.difficulty)}`}>
                  {course.difficulty}
                </span>
                {course.certificate && (
                  <span className="px-3.5 py-1.5 text-xs font-bold bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center space-x-1.5">
                    <Award className="h-4 w-4" />
                    <span>Certificate Available</span>
                  </span>
                )}
              </div>

              {/* Course Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-[var(--text-primary)] leading-tight">
                {course.name}
              </h1>

              {/* Course Metrics */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm sm:text-base font-semibold text-[var(--text-muted)]">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="h-4.5 w-4.5 fill-amber-500 mr-1.5" />
                  <span className="text-base sm:text-lg">{course.rating.toFixed(1)}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-1 font-normal">Rating</span>
                </div>
                <div className="hidden sm:block text-[var(--border)]">|</div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                  <span>{course.duration}</span>
                  <span className="text-xs text-[var(--text-muted)] font-normal">Syllabus</span>
                </div>
                {course.instructor && (
                  <>
                    <div className="hidden sm:block text-[var(--border)]">|</div>
                    <div className="flex items-center space-x-1.5">
                      <Briefcase className="h-4 w-4 text-[var(--text-muted)]" />
                      <span>{course.instructor}</span>
                      <span className="text-xs text-[var(--text-muted)] font-normal">Instructor</span>
                    </div>
                  </>
                )}
                {recommendation?.estimatedCompletionTime && (
                  <>
                    <div className="hidden sm:block text-[var(--border)]">|</div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
                      <span>Est. Completion: {recommendation.estimatedCompletionTime}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Direct Enroll Outbound CTA */}
              <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {(course.officialUrl || course.enrollUrl) ? (
                  <a
                    href={course.officialUrl || course.enrollUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-9 py-4.5 btn-premium-primary text-white font-bold text-base rounded-2xl flex items-center justify-center space-x-2.5 transition-all shadow-xl hover:scale-102"
                  >
                    <span>🚀 Open Official Course</span>
                    <ExternalLink className="h-4.5 w-4.5" />
                  </a>
                ) : (
                  <div className="w-full py-4 px-6 bg-rose-500/10 text-rose-500 font-bold rounded-2xl border border-rose-500/20 text-sm flex items-center justify-center sm:justify-start space-x-2">
                    <AlertCircle className="h-4.5 w-4.5" />
                    <span>Official course link unavailable.</span>
                  </div>
                )}
                
                <button
                  onClick={triggerBookmarkToggle}
                  className={`px-6 py-4.5 border rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-102 shadow-sm ${
                    isBookmarked 
                      ? "bg-rose-500/20 border-rose-500/20 text-rose-500"
                      : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40"
                  }`}
                >
                  <Bookmark className={`h-4.5 w-4.5 ${isBookmarked ? "fill-rose-500" : ""}`} />
                  <span>{isBookmarked ? "Bookmarked" : "Bookmark Course"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* COURSE DESCRIPTION */}
          <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[var(--border)] space-y-4 bg-[var(--surface)] shadow-[var(--shadow)]">
            <h2 className="text-2xl font-sans font-extrabold text-[var(--text-primary)] flex items-center space-x-2.5">
              <BookOpen className="h-5.5 w-5.5 text-primary" />
              <span>Course Description</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {course.description || course.expectedOutcome}
            </p>
          </div>

          {/* VIEW SIMILAR COURSES */}
          {(similarLoading || similarCourses.length > 0) && (
            <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[var(--border)] space-y-5 bg-[var(--surface)] shadow-[var(--shadow)]">
              <h2 className="text-2xl font-sans font-extrabold text-[var(--text-primary)]">
                View Similar Courses
              </h2>
              {similarLoading ? (
                <div className="flex items-center space-x-2 text-sm text-[var(--text-muted)]">
                  <div className="w-4 h-4 rounded-full border border-primary/20 border-t-primary animate-spin" />
                  <span>Loading verified alternatives...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {similarCourses.map((similar) => (
                    <div
                      key={similar.id}
                      onClick={() => navigate(`/course/${similar.id}`, { state: { course: similar, recommendation } })}
                      className="p-5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-2xl cursor-pointer hover:border-primary/45 transition-all space-y-2.5 group shadow-sm"
                    >
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-lg border ${getPlatformStyle(similar.platform)}`}>
                        {similar.platform}
                      </span>
                      <p className="text-base font-bold text-[var(--text-primary)] group-hover:text-primary line-clamp-2 transition-colors">
                        {similar.name}
                      </p>
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span className="flex items-center text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-500 mr-1" />
                          {similar.rating.toFixed(1)}
                        </span>
                        <span>{similar.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WHY THIS COURSE */}
          <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[var(--border)] space-y-4 border-l-4 border-l-primary bg-[var(--surface)] shadow-[var(--shadow)]">
            <h2 className="text-2xl font-sans font-extrabold text-[var(--text-primary)] flex items-center space-x-2.5">
              <Sparkles className="h-5.5 w-5.5 text-primary" />
              <span>Why This Course</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed italic">
              &ldquo;{course.whyRecommended}&rdquo;
            </p>
          </div>

          {/* SKILLS YOU WILL LEARN */}
          <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[var(--border)] space-y-5 bg-[var(--surface)] shadow-[var(--shadow)]">
            <h2 className="text-2xl font-sans font-extrabold text-[var(--text-primary)]">
              Skills You Will Learn
            </h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, index) => (
                <span 
                  key={index} 
                  className="px-4 py-2.5 bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] hover:border-primary/20 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* COURSE ROADMAP TIMELINE */}
          {roadmapItems.length > 0 && (
            <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[var(--border)] space-y-6 bg-[var(--surface)] shadow-[var(--shadow)]">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-[var(--border)]">
                <h2 className="text-2xl font-sans font-extrabold text-[var(--text-primary)] flex items-center space-x-2.5">
                  <Compass className="h-5.5 w-5.5 text-primary" />
                  <span>Course Roadmap Timeline</span>
                </h2>
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {syllabusProgressPercent}% Completed
                </span>
              </div>

              {/* Vertical timeline items */}
              <div className="relative border-l border-[var(--border)] ml-3 pl-8 space-y-10">
                {roadmapItems.map((step, idx) => {
                  const isChecked = !!completedRoadmapSteps[step.title];
                  return (
                    <div key={idx} className="relative group">
                      {/* Circle bullet or checkbox */}
                      <button
                        onClick={() => toggleRoadmapStep(step.title)}
                        className={`absolute -left-[43px] top-1.5 h-5 w-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                          isChecked 
                            ? "bg-accent border-accent text-slate-900 shadow-[0_0_10px_rgba(0,227,140,0.4)]"
                            : "bg-[var(--surface)] border-[var(--border)] hover:border-primary"
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5 font-bold" />}
                      </button>

                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 
                            onClick={() => toggleRoadmapStep(step.title)}
                            className={`text-lg font-bold transition-colors cursor-pointer ${
                              isChecked 
                                ? "text-[var(--text-muted)] line-through" 
                                : "text-[var(--text-primary)] hover:text-primary"
                            }`}
                          >
                            Step {idx + 1}: {step.title}
                          </h3>
                          <span className="text-xs font-mono font-bold text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
                            {step.duration}
                          </span>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">
                          {step.description}
                        </p>
                        
                        {/* Milestone key topics */}
                        {step.keyTopics && step.keyTopics.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1.5">
                            {step.keyTopics.map((topic, tIdx) => (
                              <span 
                                key={tIdx} 
                                className="px-3 py-1 bg-[var(--surface-secondary)] text-xs font-bold text-[var(--text-primary)] rounded-lg border border-[var(--border)]"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-4 space-y-6 lg:space-y-8">
          
          {/* COURSE PROGRESS CARD */}
          <div className="glass-card rounded-3xl p-7 border border-[var(--border)] space-y-4 bg-[var(--surface)] shadow-[var(--shadow)]">
            <h3 className="text-lg font-sans font-bold text-[var(--text-primary)]">
              Course Learning Progress
            </h3>
            
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="w-full bg-[var(--surface-secondary)] rounded-full h-3.5 overflow-hidden border border-[var(--border)]">
                <div 
                  className="bg-accent h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,227,140,0.5)]"
                  style={{ width: `${syllabusProgressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-semibold text-[var(--text-muted)]">
                <span>{completedStepsCount} of {totalSteps} Steps</span>
                <span className="text-accent font-bold">{syllabusProgressPercent}% Done</span>
              </div>
            </div>
          </div>

          {/* BOOKMARKS LIST IN SIDEBAR */}
          {bookmarks.length > 0 && (
            <div className="glass-card rounded-3xl p-7 border border-[var(--border)] space-y-4 bg-[var(--surface)] shadow-[var(--shadow)]">
              <h3 className="text-lg font-sans font-bold text-[var(--text-primary)] flex items-center space-x-2">
                <Bookmark className="h-4.5 w-4.5 text-rose-500 fill-rose-500" />
                <span>My Saved Bookmarks ({bookmarks.length})</span>
              </h3>
              
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                {bookmarks.map((bm, index) => (
                  <div 
                    key={index} 
                    onClick={() => {
                      navigate(`/course/${bm.id}`, { state: { course: bm, recommendation } });
                    }}
                    className="p-4 bg-[var(--surface-secondary)] hover:bg-primary/10 border border-[var(--border)] hover:border-primary/20 rounded-2xl cursor-pointer transition-colors space-y-1.5 group shadow-sm"
                  >
                    <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-primary line-clamp-1 transition-colors">
                      {bm.name}
                    </p>
                    <div className="flex justify-between text-xs font-semibold text-[var(--text-muted)]">
                      <span>{bm.platform}</span>
                      <span className="text-primary">{bm.difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI LEARNING ASSISTANT SECTION */}
      <div className="mt-16 pt-12 border-t border-[var(--border)] space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 text-xs font-mono tracking-wider">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span>AI LEARNING ASSISTANT</span>
          </div>
          <h2 className="text-3xl font-sans font-extrabold text-[var(--text-primary)]">
            Custom Course Copilot
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            Generate customized study materials based precisely on this course description, syllabus roadmap, and platform guidelines.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Card 1: Study Notes */}
          <div className="glass-card border border-[var(--border)] rounded-3xl p-7 shadow-[var(--shadow)] flex flex-col justify-between space-y-6 bg-[var(--surface)]">
            <div className="space-y-3">
              <div className="p-3.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl w-fit">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">📖 Study Notes</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Generate in-depth organized markdown lecture definitions, code blocks, and examples tailored for this exact course syllabus.
              </p>
            </div>
            <button
              onClick={() => navigateToTool("notes")}
              className="w-full py-3.5 btn-premium-primary text-sm font-bold rounded-2xl hover:scale-102 transition-all border border-transparent shadow-md"
            >
              Generate Notes
            </button>
          </div>

          {/* Card 2: Quiz */}
          <div className="glass-card border border-[var(--border)] rounded-3xl p-7 shadow-[var(--shadow)] flex flex-col justify-between space-y-6 bg-[var(--surface)]">
            <div className="space-y-3">
              <div className="p-3.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl w-fit">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">📝 Quiz</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Start an active recall assessment. Dynamic multiple-choice questions configured to align with your exact skill level.
              </p>
            </div>
            <button
              onClick={() => navigateToTool("quiz")}
              className="w-full py-3.5 btn-premium-primary text-sm font-bold rounded-2xl hover:scale-102 transition-all border border-transparent shadow-md"
            >
              Start Quiz
            </button>
          </div>

          {/* Card 3: Interview Prep */}
          <div className="glass-card border border-[var(--border)] rounded-3xl p-7 shadow-[var(--shadow)] flex flex-col justify-between space-y-6 bg-[var(--surface)]">
            <div className="space-y-3">
              <div className="p-3.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl w-fit">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">💼 Interview Prep</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Construct dynamic mock interview questions categorized by difficulty, offering professional tips and model answers.
              </p>
            </div>
            <button
              onClick={() => navigateToTool("interview")}
              className="w-full py-3.5 btn-premium-primary text-sm font-bold rounded-2xl hover:scale-102 transition-all border border-transparent shadow-md"
            >
              Generate Interview Questions
            </button>
          </div>

          {/* Card 4: Quick Revision */}
          <div className="glass-card border border-[var(--border)] rounded-3xl p-7 shadow-[var(--shadow)] flex flex-col justify-between space-y-6 bg-[var(--surface)]">
            <div className="space-y-3">
              <div className="p-3.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl w-fit">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">📚 Quick Revision</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Generate high-density formulas, code syntax cheats, bullet concepts, memory mnemonics, and interview fast-facts.
              </p>
            </div>
            <button
              onClick={() => navigateToTool("revision")}
              className="w-full py-3.5 btn-premium-primary text-sm font-bold rounded-2xl hover:scale-102 transition-all border border-transparent shadow-md"
            >
              Generate Revision Sheet
            </button>
          </div>
        </div>

        {/* ACTIVE TOOL RENDER STAGE */}
        <div id="active-tool-display" className="mt-10">
          <AnimatePresence mode="wait">
            {activeTool && (
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass-card border border-[var(--border)] rounded-[36px] p-8 sm:p-10 lg:p-12 shadow-[var(--shadow-lg)] space-y-8 bg-[var(--surface)]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">
                      {activeTool === "notes" && "📖"}
                      {activeTool === "quiz" && "📝"}
                      {activeTool === "interview" && "💼"}
                      {activeTool === "revision" && "📚"}
                    </span>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-sans">
                        {activeTool === "notes" && "Custom Course Study Notes"}
                        {activeTool === "quiz" && "Active Recall Assessment Player"}
                        {activeTool === "interview" && "Professional Graded Interview Guide"}
                        {activeTool === "revision" && "High-Density Course Revision Sheet"}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                        Generated by Lumina AI Copilot
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      onClick={handleRegenerate}
                      disabled={toolLoading}
                      className="text-xs sm:text-sm font-bold text-primary px-4 py-2 hover:bg-primary/10 border border-transparent rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Regenerate</span>
                    </button>
                    <button
                      onClick={() => setActiveTool(null)}
                      className="text-xs sm:text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] px-4 py-2 hover:bg-[var(--surface-secondary)] rounded-xl transition-all cursor-pointer"
                    >
                      Close Tool
                    </button>
                  </div>
                </div>

                {/* LOADING STATE */}
                {toolLoading && (
                  <div className="py-24 flex flex-col justify-center items-center space-y-6">
                    {/* Premium Loader Orb */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <div className="absolute inset-2 rounded-full border border-secondary/10 border-b-secondary animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary animate-pulse shadow-[0_0_20px_rgba(124,92,255,0.6)]" />
                    </div>

                    <div className="text-center space-y-2 max-w-md">
                      <p className="text-base font-semibold text-[var(--text-primary)] animate-pulse">{loadingStep}</p>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)]">{loadingSubText}</p>
                    </div>
                  </div>
                )}

                {/* ERROR STATE */}
                {toolError && !toolLoading && (
                  <div className="p-7 bg-rose-500/10 border border-rose-500/20 rounded-3xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className="p-2.5 bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-2xl mt-0.5 shrink-0">
                          <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-base font-bold text-[var(--text-primary)]">AI Content Generation Notice</h4>
                          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
                            {(() => {
                              if (!toolError) return "";
                              const lower = toolError.toLowerCase();
                              if (
                                lower.includes("key") ||
                                lower.includes("api key") ||
                                lower.includes("unauthorized") ||
                                lower.includes("permission_denied") ||
                                lower.includes("quota") ||
                                lower.includes("limit") ||
                                lower.includes("exhausted") ||
                                lower.includes("leaked")
                              ) {
                                return "Unable to generate content right now. Please try again in a few moments.";
                              }
                              return toolError;
                            })()}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">Please click below to retry.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (activeTool === "notes") handleGenerateNotes();
                          else if (activeTool === "quiz") handleGenerateQuiz();
                          else if (activeTool === "interview") handleGenerateInterview();
                          else if (activeTool === "revision") handleGenerateRevision();
                        }}
                        className="px-5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 border border-rose-500/20 font-bold text-xs sm:text-sm rounded-xl transition-all shrink-0 cursor-pointer flex items-center space-x-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Retry Generation</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STUDY NOTES RENDER */}
                {activeTool === "notes" && generatedNotes && !toolLoading && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3 bg-[var(--surface-secondary)] p-4 rounded-2xl border border-[var(--border)]">
                      <button
                        onClick={() => handleCopyText(generatedNotes, "notes")}
                        className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer hover:scale-102 shadow-sm"
                      >
                        {notesCopied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                        <span>{notesCopied ? "Copied" : "Copy Notes"}</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(generatedNotes, "Study Notes")}
                        className="px-5 py-2.5 btn-premium-primary text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer border border-transparent hover:scale-102 shadow-md"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </button>
                    </div>

                    <div className="markdown-body p-8 sm:p-10 bg-[var(--surface-secondary)] rounded-[28px] border border-[var(--border)] overflow-x-auto text-sm sm:text-base leading-relaxed text-[var(--text-primary)]">
                      <Markdown>{generatedNotes}</Markdown>
                    </div>
                  </div>
                )}

                {/* REVISION SHEET RENDER */}
                {activeTool === "revision" && generatedRevision && !toolLoading && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3 bg-[var(--surface-secondary)] p-4 rounded-2xl border border-[var(--border)]">
                      <button
                        onClick={() => handleCopyText(generatedRevision, "revision")}
                        className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer hover:scale-102 shadow-sm"
                      >
                        {revisionCopied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                        <span>{revisionCopied ? "Copied" : "Copy Revision Sheet"}</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(generatedRevision, "Revision Cheat Sheet")}
                        className="px-5 py-2.5 btn-premium-primary text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer border border-transparent hover:scale-102 shadow-md"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </button>
                    </div>

                    <div className="markdown-body p-8 sm:p-10 bg-[var(--surface-secondary)] rounded-[28px] border border-[var(--border)] overflow-x-auto text-sm sm:text-base leading-relaxed text-[var(--text-primary)]">
                      <Markdown>{generatedRevision}</Markdown>
                    </div>
                  </div>
                )}

                {/* QUIZ PLAYER RENDER */}
                {activeTool === "quiz" && currentQuizQuestions.length > 0 && !toolLoading && (
                  <div className="space-y-6">
                    {/* Status & Results Card */}
                    {quizSubmitted ? (
                      <div className="bg-gradient-to-br from-primary/10 via-[var(--surface)] to-secondary/10 p-8 rounded-[28px] border border-[var(--border)] text-center space-y-5 relative overflow-hidden shadow-[var(--shadow)]">
                        <div className="inline-flex items-center justify-center p-5 bg-primary/20 text-primary border border-primary/20 rounded-full">
                          <Award className="h-10 w-10 animate-bounce" />
                        </div>
                        <div className="space-y-1.5 relative z-10">
                          <h4 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">Active Recall Score: {quizScorePercent}%</h4>
                          <p className="text-sm text-[var(--text-muted)]">
                            You answered {quizCorrectCount} out of {currentQuizQuestions.length} questions correctly.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAnswers({});
                            setCurrentQuizIdx(0);
                            setQuizSubmitted(false);
                          }}
                          className="px-7 py-3 btn-premium-primary rounded-xl text-sm font-bold transition-all border border-transparent hover:scale-105 shadow-md"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Retake Quiz</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[var(--text-muted)] bg-[var(--surface-secondary)] px-5 py-3 rounded-2xl border border-[var(--border)] shadow-sm">
                        <span>Question {currentQuizIdx + 1} of {currentQuizQuestions.length}</span>
                        <span>{answeredCount} Answered</span>
                      </div>
                    )}

                    {/* Question Card */}
                    <div className="space-y-6">
                      {/* Active Question Panel */}
                      <div className="space-y-4">
                        <h4 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-snug">
                          {currentQuizQuestions[currentQuizIdx]?.question}
                        </h4>

                        {/* Options */}
                        <div className="grid grid-cols-1 gap-3.5">
                          {currentQuizQuestions[currentQuizIdx]?.options.map((option, idx) => {
                            const isSelected = selectedAnswers[currentQuizIdx] === option;
                            const isCorrect = option === currentQuizQuestions[currentQuizIdx]?.correctAnswer;
                            
                            let optionStyle = "border-[var(--border)] bg-[var(--surface-secondary)] hover:border-primary/40 text-[var(--text-primary)]";
                            
                            if (isSelected && !quizSubmitted) {
                              optionStyle = "border-primary bg-primary/20 text-primary font-bold shadow-sm";
                            } else if (quizSubmitted) {
                              if (isCorrect) {
                                  optionStyle = "border-accent bg-accent/15 text-accent font-bold";
                              } else if (isSelected) {
                                  optionStyle = "border-rose-500 bg-rose-500/15 text-rose-500 font-bold";
                              } else {
                                  optionStyle = "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-muted)] opacity-60";
                              }
                            }

                            return (
                              <button
                                key={idx}
                                disabled={quizSubmitted}
                                onClick={() => {
                                  setSelectedAnswers(prev => ({ ...prev, [currentQuizIdx]: option }));
                                }}
                                className={`w-full p-4.5 border rounded-2xl text-left text-sm sm:text-base font-semibold transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                              >
                                <span>{option}</span>
                                {quizSubmitted && isCorrect && <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />}
                                {quizSubmitted && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-rose-500 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation Block */}
                      {quizSubmitted && currentQuizQuestions[currentQuizIdx]?.explanation && (
                        <div className="p-5 bg-primary/10 border border-primary/20 text-[var(--text-primary)] rounded-2xl text-xs sm:text-sm leading-relaxed space-y-1.5">
                          <span className="font-extrabold flex items-center space-x-1.5 text-primary">
                            <Lightbulb className="h-4 w-4 shrink-0 text-accent" />
                            <span>Explanation:</span>
                          </span>
                          <p className="text-[var(--text-secondary)]">{currentQuizQuestions[currentQuizIdx]?.explanation}</p>
                        </div>
                      )}

                      {/* Navigation buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                        <div className="flex space-x-3">
                          <button
                            disabled={currentQuizIdx === 0}
                            onClick={() => setCurrentQuizIdx(prev => prev - 1)}
                            className="px-5 py-2.5 bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                          >
                            Previous
                          </button>
                          <button
                            disabled={currentQuizIdx === currentQuizQuestions.length - 1}
                            onClick={() => setCurrentQuizIdx(prev => prev + 1)}
                            className="px-5 py-2.5 bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] hover:border-primary/40 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                          >
                            Next
                          </button>
                        </div>

                        {!quizSubmitted ? (
                          <button
                            disabled={answeredCount < currentQuizQuestions.length}
                            onClick={() => setQuizSubmitted(true)}
                            className="px-7 py-2.5 btn-premium-primary rounded-xl text-xs sm:text-sm font-bold transition-all border border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-md"
                          >
                            Submit Quiz
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAnswers({});
                              setCurrentQuizIdx(0);
                              setQuizSubmitted(false);
                            }}
                            className="px-7 py-2.5 bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl hover:bg-primary/10 transition-all cursor-pointer shadow-sm"
                          >
                            Reset Play
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERVIEW PREPARATION RENDER */}
                {activeTool === "interview" && generatedInterview && !toolLoading && (
                  <div className="space-y-6">
                    {/* Category tabs */}
                    <div className="flex border-b border-[var(--border)] space-x-4">
                      {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            setInterviewLevel(level);
                            setExpandedQuestions({});
                          }}
                          className={`pb-3.5 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all -mb-[1px] cursor-pointer ${
                            interviewLevel === level
                              ? "border-primary text-primary"
                              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>

                    {/* Interview Questions list */}
                    <div className="space-y-4">
                      {generatedInterview[interviewLevel]?.map((q, idx) => {
                        const isExpanded = !!expandedQuestions[idx];
                        return (
                          <div 
                            key={idx} 
                            className="border border-[var(--border)] rounded-2xl bg-[var(--surface-secondary)] overflow-hidden shadow-sm hover:border-primary/30 transition-all"
                          >
                            {/* Question Header Accordion Toggle */}
                            <button
                              onClick={() => setExpandedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              className="w-full p-5 text-left font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-start justify-between space-x-4 cursor-pointer"
                            >
                              <span>Q{idx + 1}: {q.question}</span>
                              {isExpanded ? <ChevronUp className="h-4.5 w-4.5 text-[var(--text-muted)] shrink-0 mt-0.5" /> : <ChevronDown className="h-4.5 w-4.5 text-[var(--text-muted)] shrink-0 mt-0.5" />}
                            </button>

                            {/* Accordion Content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-[var(--border)] p-5 bg-[var(--surface)] space-y-4"
                                >
                                  {/* Answer block */}
                                  <div className="space-y-1.5">
                                    <span className="text-xs font-extrabold text-accent uppercase tracking-wider block">
                                      Model Answer:
                                    </span>
                                    <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed whitespace-pre-wrap pl-3.5 border-l-2 border-primary">
                                      {q.answer}
                                    </p>
                                  </div>

                                  {/* Interview Tip */}
                                  {(q.proTip || (q as any).tip) && (
                                    <div className="p-4.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 text-xs sm:text-sm leading-relaxed flex items-start space-x-2.5">
                                      <Lightbulb className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
                                      <div>
                                        <span className="font-extrabold">Interview Prep Tip:</span> {q.proTip || (q as any).tip}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
