import React from "react";
import { Compass, Sparkles, Cpu, Code2 } from "lucide-react";
import { motion } from "motion/react";

export default function AboutPage() {
  const stats = [
    { label: "Powered By", value: "Gemini 3.5" },
    { label: "Indexed Portals", value: "8+ Top Portals" },
    { label: "Customizability", value: "100% Granular" },
    { label: "Syllabus Formats", value: "JSON Curation" },
  ];

  const faqs = [
    {
      q: "How does Lumina AI generate these recommendations?",
      a: "Lumina AI uses advanced semantic prompt parameters to query Google's highly advanced Gemini 3.5 model. It cross-references your current skill level, study time limits, budget, and preferred online platforms to curate suitable course catalogs and map a custom milestone-based study plan.",
    },
    {
      q: "Are the course links real?",
      a: "The recommendations map to the highest-rated existing curriculums on Coursera, Udemy, YouTube, freeCodeCamp, MIT OCW, edX, and NPTEL. The generated links are designed to launch searches or direct pathways directly to these resources, resolving choice paralysis.",
    },
    {
      q: "How is my progress tracked?",
      a: "All bookmarks, saved curriculums, and completed syllabus tasks are saved securely on your device using client-side localStorage. This ensures complete privacy and responsive state management without needing external databases.",
    },
    {
      q: "What is Infosys Springboard and NPTEL?",
      a: "NPTEL provides free open online college courses from prestigious Indian Institutes of Technology (IITs). Infosys Springboard is a flagship digital learning platform providing free business and tech training. Both are highly respected, accessible learning systems that our AI can prioritize for your budget.",
    },
  ];

  return (
    <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 space-y-16 lg:space-y-20 pb-36 relative">
      {/* Intro section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex p-3.5 bg-primary/10 border border-primary/20 rounded-2xl text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
          About Lumina AI
        </h1>
        <p className="text-[var(--text-secondary)] leading-relaxed text-base sm:text-lg lg:text-xl">
          Lumina AI is an AI-powered learning platform that helps learners discover the best online courses, generate study notes, practice with quizzes, prepare for interviews, revise efficiently, and receive personalized guidance from an AI tutor.
        </p>
      </section>

      {/* Grid Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
        {stats.map((s, idx) => (
          <div key={idx} className="glass-card border border-[var(--border)] p-7 lg:p-9 rounded-3xl text-center bg-[var(--surface)] shadow-[var(--shadow)]">
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-sans font-extrabold text-primary">
              {s.value}
            </span>
            <span className="text-xs sm:text-sm text-[var(--text-muted)] font-bold uppercase tracking-wider block mt-2">
              {s.label}
            </span>
          </div>
        ))}
      </section>

      {/* Our engine breakdown */}
      <section className="glass-card border border-[var(--border)] rounded-[36px] p-8 sm:p-12 lg:p-14 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center space-x-2 text-primary">
            <Cpu className="h-5 w-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest">Semantic Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-[var(--text-primary)] leading-tight">
            Driven by Gemini 3.5 AI Core
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            By querying Gemini with precise, structured schemas, Lumina AI ensures responses return as pure, clean, and validation-safe JSON structures, rendering course cards, certificate labels, and timelines with 100% consistency.
          </p>
        </div>

        <div className="space-y-4 bg-[var(--surface-secondary)] p-6 sm:p-8 rounded-3xl border border-[var(--border)] font-mono text-xs sm:text-sm text-[var(--text-muted)] shadow-inner">
          <div className="flex items-center space-x-2 text-primary mb-2">
            <Code2 className="h-4.5 w-4.5" />
            <span className="font-bold uppercase tracking-wider text-xs">Prompt Schema</span>
          </div>
          <p className="border-l-2 border-primary pl-4 py-2 bg-[var(--surface)] p-3 rounded-xl leading-relaxed text-[var(--text-primary)]">
            &ldquo;Return JSON matching type.OBJECT with fields: learningGoal, weeklyPlan, roadmap, and courses (name, platform, duration, enrollUrl).&rdquo;
          </p>
          <div className="flex justify-between items-center text-xs font-bold text-[var(--text-muted)] pt-2">
            <span>TYPE: APPLICATION/JSON</span>
            <span>TEMP: 0.2</span>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-8 sm:space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-[var(--text-primary)]">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Everything you need to know about Lumina AI curation rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {faqs.map((f, idx) => (
            <div
              key={idx}
              className="glass-card border border-[var(--border)] p-7 lg:p-8 rounded-3xl space-y-3 bg-[var(--surface)] shadow-[var(--shadow)]"
            >
              <h3 className="text-base sm:text-lg font-sans font-bold text-[var(--text-primary)] flex items-start space-x-2.5">
                <span className="text-primary font-mono font-bold">Q.</span>
                <span>{f.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pl-5">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
