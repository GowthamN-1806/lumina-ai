import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Clock, Globe, BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ThreeDOrb from "./ThreeDOrb";

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreSkills: (skill: string) => void;
}

const headlinePhrases = [
  "Learn Smarter.",
  "Practice Better.",
  "Build Your Career."
];

const quotes = [
  "Learning never exhausts the mind.",
  "Knowledge compounds like interest.",
  "Consistency beats intensity.",
  "The future belongs to lifelong learners."
];

export default function LandingPage({ onGetStarted, onExploreSkills }: LandingPageProps) {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  
  // Parallax cursor positions
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // Rotate headline every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % headlinePhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Rotate quotes every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Mouse Parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setParallaxOffset({ x, y });
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Course Curations",
      description: "Get personalized choices mined from high-grade indices matched exactly to your budget and capability limits.",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: Clock,
      title: "Optimized Weekly Timelines",
      description: "Structure your studies around your custom daily time constraint (e.g. 30m vs 2h) with a customized weekly calendar.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Globe,
      title: "Cross-Platform Indexing",
      description: "Consolidate courses from Coursera, Udemy, YouTube, freeCodeCamp, edX, MIT OCW, and more in a unified dashboard.",
      color: "from-emerald-500 to-teal-500",
    },
  ];

  const popularSkills = [
    { name: "Python Programming", category: "Programming" },
    { name: "Web Development (React & Node)", category: "Development" },
    { name: "Machine Learning & AI", category: "Data Science" },
    { name: "Cloud Computing (AWS/GCP)", category: "Infrastructure" },
    { name: "UI/UX Product Design", category: "Design" },
    { name: "Cybersecurity Fundamentals", category: "Security" },
  ];

  return (
    <div 
      className="w-full max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-24 space-y-16 sm:space-y-20 lg:space-y-28 pb-36"
      onMouseMove={handleMouseMove}
    >
      {/* SECTION 1: HERO & ORB GRID (Balanced 50/50 Desktop Composition) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 2xl:gap-20 items-center min-h-[70vh] lg:min-h-[75vh] xl:min-h-[80vh] pt-4 sm:pt-6">
        {/* HERO HEADER - BALANCED 50% LEFT COLUMN */}
        <motion.div 
          style={{ transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)` }}
          className="col-span-12 lg:col-span-6 xl:col-span-6 space-y-6 sm:space-y-8 lg:space-y-10 flex flex-col justify-center text-left"
        >
          {/* Animated Headline Carousel */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6.5xl xl:text-7.5xl 2xl:text-8xl font-sans font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.12] sm:leading-[1.1] min-h-[140px] sm:min-h-[170px] md:min-h-[200px] lg:min-h-[230px] xl:min-h-[260px]">
            Find the perfect path.<br />
            <span className="relative inline-block overflow-hidden h-[1.25em] w-full">
              <AnimatePresence mode="wait">
                <motion.span
                  key={headlineIndex}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute left-0 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent"
                >
                  {headlinePhrases[headlineIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="text-[var(--text-secondary)] text-base sm:text-lg lg:text-xl xl:text-1.5xl max-w-xl lg:max-w-2xl leading-relaxed font-normal">
            Overcome study decision fatigue. Get custom course recommendations, visual roadmaps, and detailed syllabi instantly designed around your constraints.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 pt-2 sm:pt-4">
            <button
              onClick={onGetStarted}
              className="px-7 sm:px-9 lg:px-10 py-3.5 sm:py-4.5 lg:py-5 btn-premium-primary text-sm sm:text-base lg:text-lg font-bold rounded-2xl flex items-center justify-center space-x-2.5 hover:scale-105 transition-all duration-300 shadow-xl shadow-primary/20"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                const element = document.getElementById("popular-skills-section");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="px-7 sm:px-9 lg:px-10 py-3.5 sm:py-4.5 lg:py-5 btn-premium-secondary text-sm sm:text-base lg:text-lg font-bold rounded-2xl flex items-center justify-center space-x-2.5 hover:scale-105 transition-all duration-300"
            >
              <span>Explore Goals</span>
              <BookOpen className="h-5 w-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </motion.div>

        {/* 3D HOLOGRAPHIC ORB CONTAINER - BALANCED 50% RIGHT COLUMN */}
        <motion.div 
          style={{ transform: `translate3d(${-parallaxOffset.x * 1.5}px, ${-parallaxOffset.y * 1.5}px, 0)` }}
          className="col-span-12 lg:col-span-6 xl:col-span-6 flex justify-center items-center h-[340px] sm:h-[440px] md:h-[500px] lg:h-[580px] xl:h-[650px] 2xl:h-[720px] relative"
        >
          <ThreeDOrb />
        </motion.div>
      </div>

      {/* SECTION 2: ROTATING MOTIVATIONAL QUOTE CAROUSEL */}
      <div className="flex justify-center py-4 sm:py-6">
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1440px] glass-card p-8 sm:p-12 lg:p-14 text-center relative overflow-hidden flex flex-col justify-center min-h-[180px] lg:min-h-[220px] border border-[var(--border)] shadow-[var(--shadow-lg)] rounded-3xl bg-[var(--surface)]">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45 }}
              className="space-y-4 relative z-10"
            >
              <p className="text-xl sm:text-2xl lg:text-3xl xl:text-3.5xl font-medium text-[var(--text-primary)] italic font-sans tracking-wide leading-relaxed">
                &ldquo;{quotes[quoteIndex]}&rdquo;
              </p>
              <p className="text-xs sm:text-sm uppercase tracking-widest text-primary font-semibold font-mono">
                Lumina Catalyst
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* SECTION 3: FEATURES BENTO SECTION */}
      <div className="space-y-10 sm:space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-primary text-xs sm:text-sm font-mono font-bold tracking-widest uppercase">
            Curated Syllabi
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold tracking-tight text-[var(--text-primary)]">
            Why Use Lumina AI?
          </h2>
          <p className="text-[var(--text-muted)] text-sm sm:text-base lg:text-lg leading-relaxed">
            We bypass infinite search fatigue to generate cohesive custom learning sequences that fit your daily schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 xl:gap-10">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="glass-card p-8 lg:p-10 xl:p-12 border border-[var(--border)] hover:border-primary/40 relative group flex flex-col justify-between rounded-3xl bg-[var(--surface)] shadow-[var(--shadow)]"
              >
                <div className="space-y-5">
                  <div className={`p-4 bg-gradient-to-tr ${feature.color} rounded-2xl text-white inline-block shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 lg:h-8 lg:w-8" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-sans font-bold text-[var(--text-primary)]">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-xs sm:text-sm lg:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: PROTOCOL */}
      <div className="glass rounded-[36px] lg:rounded-[44px] p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center border border-[var(--border)] shadow-[var(--shadow-lg)] relative overflow-hidden bg-[var(--surface)]">
        <div className="absolute -right-32 -bottom-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="lg:col-span-5 space-y-6 lg:space-y-8">
          <span className="text-accent text-xs sm:text-sm font-mono font-bold tracking-widest uppercase">
            Simple Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-[var(--text-primary)] leading-tight">
            Crafting Your Course Roadmap in 3 Steps
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-[var(--text-secondary)] leading-relaxed">
            Our recommendation logic tracks target durations, filters by price restrictions, validates course availability, and maps the timeline onto your dashboard.
          </p>
          <div className="pt-2">
            <button
              onClick={onGetStarted}
              className="px-7 py-4 btn-premium-primary text-sm sm:text-base font-bold flex items-center space-x-2 rounded-2xl hover:scale-105 transition-all duration-300"
            >
              <span>Launch Assistant</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 gap-4 sm:gap-5">
          {[
            { step: "1", title: "Set Your Preferences", desc: "Choose your topic, availability (e.g. 1 hour/day), target platforms, and maximum budget bounds." },
            { step: "2", title: "AI Generation Pipeline", desc: "Gemini cross-analyzes indices, estimates match scores, and structures weekly outlines." },
            { step: "3", title: "Dashboard Integration", desc: "Bookmark courses, check off lectures, review generated notes, and test yourself on quizzes." }
          ].map((item, idx) => (
            <div key={idx} className="flex space-x-5 p-6 sm:p-7 bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border)] shadow-sm">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/20 text-primary font-bold font-mono text-base border border-primary/20">
                {item.step}
              </div>
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{item.title}</h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: CATEGORIES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 pt-4" id="popular-skills-section">
        {/* Suggested blueprint widget */}
        <div className="col-span-12 lg:col-span-4 glass-card p-7 sm:p-9 lg:p-10 flex flex-col justify-between border border-[var(--border)] relative rounded-3xl bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-5 relative z-10">
            <div className="flex justify-between items-center">
              <h3 className="font-sans font-extrabold text-[var(--text-primary)] text-lg sm:text-xl">AI Suggested Blueprint</h3>
              <span className="px-3 py-1 text-[10px] font-mono font-bold bg-primary/10 text-primary rounded-full border border-primary/20">PRESET</span>
            </div>

            <div className="bg-[var(--surface-secondary)] p-5 rounded-2xl flex gap-4 border border-[var(--border)] shadow-sm">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-tight">Generative AI for Developers</p>
                <p className="text-[var(--text-muted)] text-xs mt-1">Platform: Coursera • 8 Weeks</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[var(--text-secondary)] pt-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span>Skill Level: Intermediate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Certificate: Included</span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed italic border-l-2 border-primary pl-3.5 py-2 bg-primary/5 rounded-r-lg mt-2">
                &ldquo;Bridges the gap between traditional Python backend work and generative AI.&rdquo;
              </p>
            </div>
          </div>

          <button
            onClick={onGetStarted}
            className="w-full mt-8 py-4 btn-premium-primary text-sm sm:text-base font-bold rounded-2xl hover:scale-105 transition-all duration-300"
          >
            Configure Custom Path
          </button>
        </div>

        {/* Categories bento layout */}
        <div className="col-span-12 lg:col-span-8 glass-card p-7 sm:p-9 lg:p-10 flex flex-col justify-between border border-[var(--border)] rounded-3xl bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="space-y-2 mb-6">
            <span className="text-primary text-xs sm:text-sm font-mono font-bold tracking-widest uppercase">
              Curated Categories
            </span>
            <h3 className="font-sans font-extrabold text-[var(--text-primary)] text-2xl sm:text-3xl">Most Requested Learning Goals</h3>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm">Select any card below to launch the path assessment immediately.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {popularSkills.map((skill, idx) => (
              <div
                key={idx}
                onClick={() => onExploreSkills(skill.name)}
                className="group p-6 bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border)] hover:border-primary/40 cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col justify-between min-h-[140px] lg:min-h-[160px] hover:-translate-y-1"
              >
                <div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-primary">
                    {skill.category}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-1.5 leading-snug group-hover:text-primary transition-colors">
                    {skill.name}
                  </h4>
                </div>
                <div className="self-end h-9 w-9 rounded-xl bg-[var(--surface)] text-[var(--text-muted)] group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-300 border border-[var(--border)] shadow-sm">
                  <ArrowRight className="h-4.5 w-4.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
