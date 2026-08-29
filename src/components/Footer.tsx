import React from "react";
import { Compass, Mail, Shield, Scale, Linkedin, Github } from "lucide-react";

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--surface-secondary)] text-[var(--text-muted)] border-t border-[var(--border)] transition-colors duration-300">
      <div className="max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab("home")}>
              <div className="relative h-9 w-9 rounded-xl overflow-hidden shadow-md border border-primary/20 bg-[#050816] flex items-center justify-center shrink-0">
                <img 
                  src="/lumina-logo.png" 
                  alt="Lumina AI Logo" 
                  className="h-full w-full object-cover" 
                />
              </div>
              <span className="font-sans font-bold text-lg lg:text-xl text-[var(--text-primary)] tracking-tight">
                Lumina <span className="text-primary">AI</span>
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Navigate your professional learning path with intelligent, AI-tailored course curations, timelines, and milestones.
            </p>
            <div className="flex space-x-3 pt-2">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer"
                className="p-2.5 bg-[var(--surface)] rounded-xl hover:bg-primary/10 text-[var(--text-primary)] transition-colors border border-[var(--border)] hover:scale-105 shadow-sm"
              >
                <Linkedin className="h-4.5 w-4.5" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                className="p-2.5 bg-[var(--surface)] rounded-xl hover:bg-primary/10 text-[var(--text-primary)] transition-colors border border-[var(--border)] hover:scale-105 shadow-sm"
              >
                <Github className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          {/* Quick Nav */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button onClick={() => setActiveTab("home")} className="hover:text-primary transition-colors cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("recommend")} className="hover:text-primary transition-colors cursor-pointer">
                  Generate Recommendation
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("dashboard")} className="hover:text-primary transition-colors cursor-pointer">
                  User Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("about")} className="hover:text-primary transition-colors cursor-pointer">
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Recommended Platforms */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Supported Portals</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:text-sm font-mono text-[var(--text-muted)]">
              <span>Coursera</span>
              <span>Udemy</span>
              <span>YouTube</span>
              <span>MIT OCW</span>
              <span>freeCodeCamp</span>
              <span>edX</span>
              <span>NPTEL</span>
              <span>Infosys Springboard</span>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Support & Legal</h3>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4.5 w-4.5 text-primary" />
                <span className="text-xs sm:text-sm font-mono select-all text-[var(--text-primary)]">support@lumina.ai</span>
              </li>
              <li className="flex items-center space-x-2.5 text-xs sm:text-sm">
                <Shield className="h-4.5 w-4.5 text-primary" />
                <span>Privacy Policy</span>
              </li>
              <li className="flex items-center space-x-2.5 text-xs sm:text-sm">
                <Scale className="h-4.5 w-4.5 text-primary" />
                <span>Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-8 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-[var(--text-muted)]">
          <span>&copy; {currentYear} Lumina AI. All rights reserved. Powered by Google Gemini.</span>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <span className="hover:text-[var(--text-primary)] cursor-pointer">Privacy Policy</span>
            <span>&bull;</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
