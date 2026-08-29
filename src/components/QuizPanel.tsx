import React, { useState, useEffect } from "react";
import { 
  ClipboardCheck, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle, 
  HelpCircle, Sparkles, Award, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateQuiz } from "../services/api";
import { QuizQuestion } from "../types";

interface QuizPanelProps {
  learningGoal: string;
  skillLevel: string;
}

export default function QuizPanel({ learningGoal, skillLevel }: QuizPanelProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive Quiz States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    try {
      const result = await generateQuiz(learningGoal, skillLevel);
      if (result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
      } else {
        throw new Error("No quiz questions generated.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        "Failed to generate quiz questions. Please try again or check your Gemini API configuration."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [learningGoal, skillLevel]);

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIdx]: option
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsSubmitted(false);
  };

  // Compile results
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  
  const correctCount = questions.reduce((acc, q, idx) => {
    const userAns = selectedAnswers[idx];
    if (userAns && q.correctAnswer && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const incorrectCount = totalQuestions - correctCount;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { title: "Mastermind Status!", desc: "Excellent! You have a complete and robust command over this material.", color: "text-accent" };
    if (percentage >= 70) return { title: "Solid Progress!", desc: "Great job! You understand most of the core concepts of this topic.", color: "text-primary" };
    if (percentage >= 50) return { title: "Passing Score!", desc: "Decent understanding, but there's room to grow. Review the syllabus or notes to build confidence.", color: "text-amber-500" };
    return { title: "Keep Learning!", desc: "Keep studying! Try reviewing the suggested courses or syllabus checklist to improve your understanding.", color: "text-rose-500" };
  };

  const perf = getPerformanceMessage();

  return (
    <div id="quiz-section" className="glass-card border border-[var(--border)] rounded-3xl p-6 shadow-[var(--shadow-lg)] space-y-6 mt-8 bg-[var(--surface)]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-sans font-bold text-[var(--text-primary)]">
              AI-Powered Practice Quiz
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Test your knowledge on <code className="font-mono bg-[var(--surface-secondary)] px-1 py-0.5 rounded text-primary">{skillLevel}</code> material.
            </p>
          </div>
        </div>

        {questions.length > 0 && !loading && (
          <button
            onClick={fetchQuiz}
            className="px-4 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-primary/40 rounded-xl text-xs font-bold text-[var(--text-primary)] transition-all flex items-center space-x-1.5 cursor-pointer hover:scale-105 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Generate New Quiz</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 space-y-6"
          >
            {/* Premium Loading Orb Animation */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-2 rounded-full border border-secondary/10 border-b-secondary animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary animate-pulse shadow-[0_0_20px_rgba(124,92,255,0.6)]" />
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">Formulating Practice Quiz...</p>
              <p className="text-xs text-[var(--text-muted)]">Creating 10 unique, multiple-choice assessment questions.</p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start space-x-3 text-sm text-rose-500"
          >
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-bold text-[var(--text-primary)]">Generation Notice</p>
              <p className="text-xs leading-normal opacity-90">{error}</p>
              <button
                onClick={fetchQuiz}
                className="mt-2 px-3 py-1.5 btn-premium-primary rounded-lg text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry Generation</span>
              </button>
            </div>
          </motion.div>
        ) : questions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {!isSubmitted ? (
              // Active Quiz Screen (Focused on one question at a time)
              <div className="space-y-6">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[var(--text-muted)] font-mono">
                    <span>QUESTION {currentIdx + 1} OF {totalQuestions}</span>
                    <span>{answeredCount} ANSWERED</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--surface-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                    <div 
                      className="h-full bg-primary transition-all duration-300" 
                      style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Details */}
                <div className="bg-[var(--surface-secondary)] border border-[var(--border)] rounded-2xl p-6 space-y-5 shadow-sm">
                  <h4 className="text-base font-sans font-bold text-[var(--text-primary)] leading-relaxed">
                    {questions[currentIdx].question}
                  </h4>

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-3">
                    {questions[currentIdx].options.map((option, oIdx) => {
                      const isSelected = selectedAnswers[currentIdx] === option;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(option)}
                          className={`w-full p-4 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-primary/20 border-primary text-primary font-bold shadow-sm"
                              : "bg-[var(--surface)] border-[var(--border)] hover:border-primary/40 text-[var(--text-primary)]"
                          }`}
                        >
                          <span>{option}</span>
                          <span className={`h-5 w-5 rounded-full border flex items-center justify-center font-mono text-[10px] ${
                            isSelected 
                              ? "bg-primary border-primary text-white font-bold" 
                              : "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-muted)]"
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Bar */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={currentIdx === 0}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      currentIdx === 0
                        ? "border-[var(--border)] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                        : "border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  {currentIdx === totalQuestions - 1 ? (
                    <button
                      onClick={handleSubmit}
                      className="px-5 py-2.5 btn-premium-primary rounded-xl text-xs font-bold transition-all border border-transparent shadow-md"
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="px-4 py-2 border border-[var(--border)] hover:bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Submitted Score / Celebration Screen
              <div className="space-y-8">
                {/* Result Hero Banner */}
                <div className="bg-gradient-to-br from-primary/10 via-[var(--surface)] to-secondary/10 border border-[var(--border)] rounded-3xl p-6 sm:p-8 text-center space-y-4 relative overflow-hidden shadow-[var(--shadow)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,227,140,0.05)_0%,transparent_60%)] pointer-events-none" />
                  
                  <div className="inline-flex p-4 bg-primary/10 rounded-full text-primary border border-primary/20">
                    <Award className="h-8 w-8 animate-bounce" />
                  </div>
                  
                  <div className="space-y-1 relative z-10">
                    <h4 className="text-2xl font-extrabold text-[var(--text-primary)]">
                      Your Final Score: <span className="text-primary">{correctCount}</span> / {totalQuestions}
                    </h4>
                    <p className={`text-base font-extrabold ${perf.color}`}>
                      {perf.title} ({percentage}%)
                    </p>
                    <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
                      {perf.desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 max-w-sm mx-auto gap-4 pt-2 relative z-10">
                    <div className="bg-[var(--surface-secondary)] p-3.5 rounded-2xl border border-[var(--border)] shadow-inner">
                      <span className="block text-[10px] text-[var(--text-muted)] font-mono font-bold">CORRECT ANSWERS</span>
                      <span className="text-lg font-sans font-extrabold text-accent flex items-center justify-center gap-1 mt-1">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                        {correctCount}
                      </span>
                    </div>
                    <div className="bg-[var(--surface-secondary)] p-3.5 rounded-2xl border border-[var(--border)] shadow-inner">
                      <span className="block text-[10px] text-[var(--text-muted)] font-mono font-bold">INCORRECT ANSWERS</span>
                      <span className="text-lg font-sans font-extrabold text-rose-500 flex items-center justify-center gap-1 mt-1">
                        <XCircle className="h-4.5 w-4.5" />
                        {incorrectCount}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 relative z-10">
                    <button
                      onClick={handleRetake}
                      className="px-5 py-2.5 btn-premium-primary rounded-xl text-xs font-bold transition-all border border-transparent shadow-md"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Retake Quiz</span>
                    </button>
                  </div>
                </div>

                {/* Question-by-Question Review Breakdown */}
                <div className="space-y-4">
                  <h5 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Detailed Review & Explanations
                  </h5>

                  <div className="space-y-4">
                    {questions.map((q, idx) => {
                      const userAns = selectedAnswers[idx];
                      const isCorrect = userAns && q.correctAnswer && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                      return (
                        <div 
                          key={idx} 
                          className={`border rounded-2xl p-5 space-y-3 bg-[var(--surface-secondary)] ${
                            isCorrect 
                              ? "border-accent/30" 
                              : "border-rose-500/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h6 className="text-sm font-sans font-extrabold text-[var(--text-primary)] leading-relaxed">
                              {idx + 1}. {q.question}
                            </h6>
                            {isCorrect ? (
                              <span className="bg-accent/10 text-accent text-[10px] font-bold px-2.5 py-1 rounded-full border border-accent/20 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Correct</span>
                              </span>
                            ) : (
                              <span className="bg-rose-500/10 text-rose-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-500/20 flex items-center gap-1 shrink-0">
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Incorrect</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs space-y-1.5 text-[var(--text-muted)]">
                            <div>
                              <span className="font-bold text-[var(--text-muted)] font-mono">YOUR ANSWER:</span>{" "}
                              <span className={isCorrect ? "text-accent font-semibold" : "text-rose-500 font-semibold"}>
                                {userAns || "Unanswered"}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div>
                                <span className="font-bold text-[var(--text-muted)] font-mono">CORRECT ANSWER:</span>{" "}
                                <span className="text-accent font-semibold">
                                  {q.correctAnswer}
                                </span>
                              </div>
                            )}
                            {q.explanation && (
                              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)] bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
                                <span className="font-bold text-primary block mb-1">Explanation:</span>
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--text-muted)]">
            <HelpCircle className="h-8 w-8 mb-2 text-primary" />
            <p className="text-sm font-medium">Ready to compile quiz questions.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
