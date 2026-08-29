import React, { useState, useEffect } from "react";
import { 
  Briefcase, ChevronDown, ChevronUp, AlertCircle, Sparkles, 
  HelpCircle, Lightbulb, MessageSquareCode, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateInterviewPrep } from "../services/api";
import { InterviewQuestion } from "../types";

interface InterviewPrepPanelProps {
  learningGoal: string;
  skillLevel: string;
}

export default function InterviewPrepPanel({ learningGoal, skillLevel }: InterviewPrepPanelProps) {
  const [loading, setLoading] = useState(false);
  const [prepData, setPrepData] = useState<{
    beginner: InterviewQuestion[];
    intermediate: InterviewQuestion[];
    advanced: InterviewQuestion[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Accordion Expand States
  const [expandedDiff, setExpandedDiff] = useState<"beginner" | "intermediate" | "advanced" | null>("beginner");
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);

  const fetchInterviewPrep = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateInterviewPrep(learningGoal, skillLevel);
      setPrepData(result);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        "Failed to generate interview questions. Please try again or check your Gemini API configuration."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewPrep();
  }, [learningGoal, skillLevel]);

  const toggleDiff = (diff: "beginner" | "intermediate" | "advanced") => {
    setExpandedDiff(prev => prev === diff ? null : diff);
  };

  const toggleQuest = (qId: string) => {
    setExpandedQuest(prev => prev === qId ? null : qId);
  };

  const renderQuestionList = (questions: InterviewQuestion[], diffKey: "beginner" | "intermediate" | "advanced") => {
    return (
      <div className="space-y-4 pt-4 border-t border-[var(--border)]">
        {/* Timeline structure for question cards */}
        <div className="relative border-l border-[var(--border)] ml-2 pl-4 space-y-4">
          {questions.map((item, idx) => {
            const qId = `${diffKey}-${idx}`;
            const isExpanded = expandedQuest === qId;

            return (
              <div 
                key={idx} 
                className="relative bg-[var(--surface-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all hover:border-primary/40 shadow-sm"
              >
                {/* Timeline node */}
                <div className="absolute -left-[21px] top-5 h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(124,92,255,0.8)]" />

                <button
                  type="button"
                  onClick={() => toggleQuest(qId)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                >
                  <div className="flex gap-2">
                    <span className="text-primary font-mono font-bold shrink-0">Q{idx + 1}.</span>
                    <span>{item.question}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="p-5 bg-[var(--surface)] border-t border-[var(--border)] text-xs space-y-4">
                        {/* Detailed Answer */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
                            <MessageSquareCode className="h-3.5 w-3.5" />
                            <span>Detailed Explanation</span>
                          </span>
                          <p className="text-[var(--text-secondary)] leading-relaxed pl-5 whitespace-pre-wrap">
                            {item.answer}
                          </p>
                        </div>

                        {/* Interview Tip */}
                        {(item.proTip || (item as any).tip) && (
                          <div className="p-4.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-amber-500">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <Lightbulb className="h-3.5 w-3.5" />
                              <span>Interview Technique Tip</span>
                            </span>
                            <p className="text-[var(--text-secondary)] leading-normal pl-5 italic">
                              {item.proTip || (item as any).tip}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="interview-section" className="glass-card border border-[var(--border)] rounded-3xl p-6 shadow-[var(--shadow-lg)] space-y-6 mt-8 bg-[var(--surface)]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-sans font-bold text-[var(--text-primary)]">
              AI Interview Preparation Guide
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              30 graded expert questions and curated interview tips to build technical interviewing confidence.
            </p>
          </div>
        </div>

        {prepData && !loading && (
          <button
            onClick={fetchInterviewPrep}
            className="px-4 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-primary/40 rounded-xl text-xs font-bold text-[var(--text-primary)] transition-all flex items-center space-x-1.5 cursor-pointer hover:scale-105 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Regenerate Guide</span>
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
              <p className="text-sm font-bold text-[var(--text-primary)]">Structuring Graded Interview Q&As...</p>
              <p className="text-xs text-[var(--text-muted)]">Formulating 10 Beginner, 10 Intermediate, and 10 Advanced questions.</p>
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
                onClick={fetchInterviewPrep}
                className="mt-2 px-3 py-1.5 btn-premium-primary rounded-lg text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry Generation</span>
              </button>
            </div>
          </motion.div>
        ) : prepData ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Beginner Accordion */}
            <div className="bg-[var(--surface-secondary)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
              <button
                type="button"
                onClick={() => toggleDiff("beginner")}
                className="w-full flex items-center justify-between text-left font-sans font-bold text-[var(--text-primary)] cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 bg-accent rounded-full" />
                  <span>Beginner Section (10 Questions)</span>
                </div>
                {expandedDiff === "beginner" ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
              </button>
              {expandedDiff === "beginner" && renderQuestionList(prepData.beginner, "beginner")}
            </div>

            {/* Intermediate Accordion */}
            <div className="bg-[var(--surface-secondary)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
              <button
                type="button"
                onClick={() => toggleDiff("intermediate")}
                className="w-full flex items-center justify-between text-left font-sans font-bold text-[var(--text-primary)] cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 bg-primary rounded-full" />
                  <span>Intermediate Section (10 Questions)</span>
                </div>
                {expandedDiff === "intermediate" ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
              </button>
              {expandedDiff === "intermediate" && renderQuestionList(prepData.intermediate, "intermediate")}
            </div>

            {/* Advanced Accordion */}
            <div className="bg-[var(--surface-secondary)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
              <button
                type="button"
                onClick={() => toggleDiff("advanced")}
                className="w-full flex items-center justify-between text-left font-sans font-bold text-[var(--text-primary)] cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 bg-accent rounded-full" />
                  <span>Advanced Section (10 Questions)</span>
                </div>
                {expandedDiff === "advanced" ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
              </button>
              {expandedDiff === "advanced" && renderQuestionList(prepData.advanced, "advanced")}
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--text-muted)]">
            <HelpCircle className="h-8 w-8 mb-2 text-primary" />
            <p className="text-sm font-medium">Ready to compile interview prep guidelines.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
