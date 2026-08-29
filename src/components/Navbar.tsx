import React, { useState } from "react";
import { Menu, X, Sun, Moon, GraduationCap, LayoutDashboard, Compass as CompassIcon, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({ activeTab, setActiveTab, darkMode, toggleDarkMode }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navItems = [
    { id: "home", label: "Home", icon: GraduationCap },
    { id: "recommend", label: "Recommend", icon: CompassIcon },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-2xl transition-all duration-300 shadow-[var(--shadow-sm)]">
      <div className="max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 h-20 sm:h-22 flex items-center justify-between">
        
        {/* Left: Brand / Logo */}
        <div 
          onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
          className="flex items-center space-x-3.5 cursor-pointer group shrink-0"
        >
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-2xl overflow-hidden shadow-lg shadow-primary/25 border border-primary/30 group-hover:scale-108 transition-all duration-300 bg-[#050816] flex items-center justify-center">
            <img 
              src="/lumina-logo.png" 
              alt="Lumina AI Logo" 
              className="h-full w-full object-cover group-hover:brightness-110 transition-all duration-300" 
            />
          </div>
          <span className="font-sans font-extrabold text-xl sm:text-2xl tracking-tight text-[var(--text-primary)] group-hover:text-primary transition-colors duration-200">
            Lumina <span className="text-gradient">AI</span>
          </span>
        </div>

        {/* Center: Desktop Large Segmented Navigation Tabs */}
        <nav 
          onMouseLeave={() => setHoveredTab(null)}
          className="hidden md:flex items-center p-1.5 lg:p-2 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] shadow-inner"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hoveredTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                onMouseEnter={() => setHoveredTab(item.id)}
                className={`relative group flex items-center space-x-2.5 px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl text-base lg:text-lg font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {/* Active Tab Spring Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="navbarActiveIndicator"
                    className="absolute inset-0 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-md"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}

                {/* Subtle Hover Spotlight Pill */}
                {isHovered && !isActive && (
                  <motion.div
                    layoutId="navbarHoverIndicator"
                    className="absolute inset-0 bg-[var(--surface)]/60 rounded-xl border border-primary/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Animated Icon */}
                <Icon 
                  className={`h-5 w-5 lg:h-5.5 lg:w-5.5 relative z-10 transition-transform duration-200 group-hover:scale-115 group-hover:-translate-y-0.5 ${
                    isActive ? "text-primary font-extrabold" : "text-[var(--text-muted)] group-hover:text-primary"
                  }`} 
                />

                {/* Tab Label */}
                <span className={`relative z-10 transition-colors duration-200 ${isActive ? "text-[var(--text-primary)]" : "group-hover:text-[var(--text-primary)]"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Theme Toggle & Mobile Menu */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-desktop"
            onClick={toggleDarkMode}
            className="p-3 rounded-2xl bg-[var(--surface-secondary)] hover:bg-primary/10 text-[var(--text-primary)] border border-[var(--border)] transition-all duration-200 cursor-pointer hover:scale-108 hover:border-primary/40 shadow-sm"
            aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-warning transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="h-5 w-5 text-primary transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 rounded-2xl text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border)] hover:bg-primary/10 transition-colors cursor-pointer"
            aria-label="Main menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-2xl px-4 py-4 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-link-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3.5 w-full px-5 py-3.5 rounded-2xl text-base font-bold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
