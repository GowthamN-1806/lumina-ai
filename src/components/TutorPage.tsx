import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bot, User, Send, Mic, Sparkles, Trash2, Plus, RotateCcw, Copy, Check, ThumbsUp, ThumbsDown,
  AlertCircle, ArrowLeft, MessageSquare, Search, Menu, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { askTutorStream, TutorMessage } from "../services/api";
import { RecommendationResponse, Course } from "../types";

interface ChatSession {
  id: string;
  title: string;
  courseId: string;
  messages: TutorMessage[];
  createdAt: string;
}

// Custom syntax highlighting helper for completed code blocks
function highlightCode(code: string, language: string): React.ReactNode {
  if (!code) return code;
  
  const lines = code.split("\n");
  return (
    <>
      {lines.map((line, lineIdx) => {
        if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
          return (
            <div key={lineIdx} className="text-muted-gray italic min-h-[1.2rem]">
              {line}
            </div>
          );
        }

        const tokens = line.split(/(".*?"|'.*?'|`.*?`|\s+)/);
        
        const highlightedLine = tokens.map((token, tokenIdx) => {
          if (!token) return null;

          if (/^(".*?"|'.*?'|`.*?`)$/.test(token)) {
            return <span key={tokenIdx} className="text-accent font-medium">{token}</span>;
          }

          const subTokens = token.split(/(\W)/);
          return (
            <React.Fragment key={tokenIdx}>
              {subTokens.map((sub, subIdx) => {
                const keywords = [
                  "const", "let", "var", "function", "return", "class", "import", "export", "from", 
                  "if", "else", "for", "while", "async", "await", "def", "print", "import", "as", 
                  "select", "from", "where", "insert", "update", "delete", "create", "table", "null", 
                  "true", "false", "and", "or", "not"
                ];
                const builtins = ["console", "log", "self", "this", "window", "document", "Math", "JSON", "sys", "os", "len", "range"];
                
                if (keywords.includes(sub)) {
                  return <span key={subIdx} className="text-primary font-bold">{sub}</span>;
                }
                if (builtins.includes(sub)) {
                  return <span key={subIdx} className="text-warning font-medium">{sub}</span>;
                }
                if (/^[0-9]+$/.test(sub)) {
                  return <span key={subIdx} className="text-secondary font-medium">{sub}</span>;
                }
                return <span key={subIdx}>{sub}</span>;
              })}
            </React.Fragment>
          );
        });

        return (
          <div key={lineIdx} className="min-h-[1.2rem]">
            {highlightedLine}
          </div>
        );
      })}
    </>
  );
}

export default function TutorPage() {
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Responsive sidebar drawer state for mobile/tablet
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Lists of chats & courses
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RecommendationResponse | null>(null);

  // Search filter for history chats
  const [searchQuery, setSearchQuery] = useState("");

  // Chat UI states
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "like" | "dislike">>({});

  const handleCopyCode = (codeStr: string, id: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCodeIndex(id);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Voice recording simulation (UI indicator only)
  const [isRecordingUI, setIsRecordingUI] = useState(false);

  // Helper: Get active chat session
  const activeChat = chats.find(c => c.id === currentChatId);

  // Ensure window is scrolled to the absolute top on mount
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Initialize: Load courses and existing chats
  useEffect(() => {
    const bookmarks: Course[] = JSON.parse(localStorage.getItem("edu_bookmarks") || "[]");
    const roadmaps: RecommendationResponse[] = JSON.parse(localStorage.getItem("edu_roadmaps") || "[]");

    const coursesMap = new Map<string, Course>();
    bookmarks.forEach(c => coursesMap.set(c.id, c));
    roadmaps.forEach(r => {
      if (r.courses) {
        r.courses.forEach(c => coursesMap.set(c.id, c));
      }
    });

    const uniqueCourses = Array.from(coursesMap.values());
    setAvailableCourses(uniqueCourses);

    const lastActiveCourseId = localStorage.getItem("edu_last_course_id");
    let activeId = "";
    if (lastActiveCourseId && coursesMap.has(lastActiveCourseId)) {
      activeId = lastActiveCourseId;
    } else if (uniqueCourses.length > 0) {
      activeId = uniqueCourses[0].id;
    }
    setSelectedCourseId(activeId);

    const savedChats = localStorage.getItem("edu_tutor_chats");
    if (savedChats) {
      const parsed = JSON.parse(savedChats) as ChatSession[];
      setChats(parsed);
      if (parsed.length > 0) {
        setCurrentChatId(parsed[0].id);
      } else {
        createNewChat(activeId, uniqueCourses.find(c => c.id === activeId));
      }
    } else {
      createNewChat(activeId, uniqueCourses.find(c => c.id === activeId));
    }
  }, []);

  // Update selected course details and associated roadmap silently in the background
  useEffect(() => {
    if (!selectedCourseId) return;

    const course = availableCourses.find(c => c.id === selectedCourseId) || null;
    setSelectedCourse(course);

    const roadmaps: RecommendationResponse[] = JSON.parse(localStorage.getItem("edu_roadmaps") || "[]");
    const foundRoadmap = roadmaps.find(r => r.courses && r.courses.some(c => c.id === selectedCourseId)) || null;
    setSelectedRoadmap(foundRoadmap);

    localStorage.setItem("edu_last_course_id", selectedCourseId);

    if (currentChatId) {
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.id === currentChatId && chat.messages.length === 0) {
            return { ...chat, courseId: selectedCourseId, title: course ? `Learn: ${course.name}` : "New Chat" };
          }
          return chat;
        });
        localStorage.setItem("edu_tutor_chats", JSON.stringify(updated));
        return updated;
      });
    }
  }, [selectedCourseId, availableCourses, currentChatId]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const lastMessageText = activeChat?.messages[activeChat.messages.length - 1]?.text;

  useEffect(() => {
    scrollToBottom();
  }, [chats, isGenerating, lastMessageText]);

  const createNewChat = (courseId: string, courseObj?: Course) => {
    const id = "chat_" + Date.now();
    const title = courseObj ? `${courseObj.name} Session` : "New Conversation";
    const newSession: ChatSession = {
      id,
      title,
      courseId,
      messages: [],
      createdAt: new Date().toISOString()
    };

    setChats(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem("edu_tutor_chats", JSON.stringify(updated));
      return updated;
    });
    setCurrentChatId(id);
    setError(null);
    setIsSidebarOpen(false);
  };

  const toggleVoiceRecording = () => {
    setIsRecordingUI(prev => !prev);
    if (!isRecordingUI) {
      setTimeout(() => {
        setIsRecordingUI(false);
      }, 3500);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setError(null);
    setInput("");

    const userMsg: TutorMessage = { role: "user", text: textToSend };
    const modelPlaceholder: TutorMessage = { role: "model", text: "" };
    
    const currentMessages = activeChat ? [...activeChat.messages, userMsg] : [userMsg];

    setChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id === currentChatId) {
          const title = chat.messages.length === 0 ? textToSend.substring(0, 30) + (textToSend.length > 30 ? "..." : "") : chat.title;
          return { ...chat, messages: [...chat.messages, userMsg, modelPlaceholder], title };
        }
        return chat;
      });
      return updated;
    });

    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const notes = sessionStorage.getItem(`edu_notes_${selectedCourseId}`);
      const revision = sessionStorage.getItem(`edu_revision_${selectedCourseId}`);
      const quiz = sessionStorage.getItem(`edu_quiz_${selectedCourseId}`);
      const interview = sessionStorage.getItem(`edu_interview_${selectedCourseId}`);

      const contextObj = {
        learningGoal: selectedRoadmap?.learningGoal,
        courseName: selectedCourse?.name,
        courseDescription: selectedCourse?.description || selectedCourse?.expectedOutcome,
        platform: selectedCourse?.platform,
        difficulty: selectedCourse?.difficulty,
        skillLevel: selectedRoadmap?.skillLevel,
        studyTime: selectedRoadmap?.dailyStudyTime,
        completionTarget: selectedRoadmap?.completionTarget,
        roadmap: selectedRoadmap?.roadmap,
        generatedNotes: notes ? "true" : "",
        generatedQuiz: quiz ? JSON.parse(quiz) : null,
        generatedInterview: interview ? JSON.parse(interview) : null,
        generatedRevision: revision ? "true" : "",
      };

      let responseText = "";

      askTutorStream(
        {
          messages: currentMessages,
          context: contextObj,
          message: textToSend
        },
        (chunk) => {
          responseText += chunk;
          setChats(prev => {
            const updated = prev.map(chat => {
              if (chat.id === currentChatId) {
                const msgs = [...chat.messages];
                if (msgs.length > 0) {
                  msgs[msgs.length - 1] = {
                    ...msgs[msgs.length - 1],
                    text: responseText
                  };
                }
                return { ...chat, messages: msgs };
              }
              return chat;
            });
            return updated;
          });
        },
        () => {
          setIsGenerating(false);
          abortControllerRef.current = null;
          setChats(prev => {
            localStorage.setItem("edu_tutor_chats", JSON.stringify(prev));
            return prev;
          });
        },
        (err: any) => {
          console.error("Tutor streaming error:", err);
          setError(err.message || "Failed to generate AI response.");
          setIsGenerating(false);
          abortControllerRef.current = null;
        },
        controller.signal
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate AI response.");
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    setChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id === currentChatId) {
          const msgs = [...chat.messages];
          if (msgs.length > 0 && msgs[msgs.length - 1].role === "model" && msgs[msgs.length - 1].text === "") {
            msgs.pop();
          }
          return { ...chat, messages: msgs };
        }
        return chat;
      });
      localStorage.setItem("edu_tutor_chats", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearConversation = () => {
    if (!currentChatId) return;
    setChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, messages: [] };
        }
        return chat;
      });
      localStorage.setItem("edu_tutor_chats", JSON.stringify(updated));
      return updated;
    });
    setFeedback({});
    setError(null);
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = chats.filter(c => c.id !== chatId);
    setChats(remaining);
    localStorage.setItem("edu_tutor_chats", JSON.stringify(remaining));

    if (remaining.length > 0) {
      setCurrentChatId(remaining[0].id);
    } else {
      createNewChat(selectedCourseId, selectedCourse || undefined);
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = async () => {
    if (!activeChat || activeChat.messages.length === 0 || isGenerating) return;

    let lastUserMessageText = "";
    for (let i = activeChat.messages.length - 1; i >= 0; i--) {
      if (activeChat.messages[i].role === "user") {
        lastUserMessageText = activeChat.messages[i].text;
        break;
      }
    }

    if (lastUserMessageText) {
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.id === currentChatId) {
            const msgs = [...chat.messages];
            if (msgs[msgs.length - 1].role === "model") {
              msgs.pop();
            }
            return { ...chat, messages: msgs };
          }
          return chat;
        });
        return updated;
      });
      await handleSend(lastUserMessageText);
    }
  };

  const handleFeedback = (index: number, type: "like" | "dislike") => {
    setFeedback(prev => ({
      ...prev,
      [index]: prev[index] === type ? undefined : type as any
    }));
  };

  const suggestedQuestions = [
    { 
      text: "📖 Explain today's topic", 
      prompt: "Explain a key foundational topic from our current course roadmap in detail." 
    },
    { 
      text: "💡 Show practical example", 
      prompt: "Give me a practical real-world or coding example related to the current course and explain it step by step." 
    },
    { 
      text: "✏️ Quiz me", 
      prompt: "Generate a short quiz question with multiple choice options based on the current course topics to test my active recall." 
    },
    { 
      text: "💼 Interview preparation", 
      prompt: "Give me a realistic technical interview question relevant to the current course/skills and ask me how I would solve it." 
    },
    { 
      text: "🌱 Explain simply", 
      prompt: "Explain the core concept from this course in simple, beginner-friendly terms with an everyday analogy." 
    },
    { 
      text: "🔄 Compare core concepts", 
      prompt: "Compare and contrast the primary concepts and techniques taught in this course, highlighting trade-offs." 
    }
  ];

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-24 sm:py-28 flex flex-col font-sans relative min-h-[90vh]">
      
      {/* Header bar */}
      <header className="flex items-center justify-between py-4 mb-6 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl lg:hidden cursor-pointer"
            title="Open Conversations Sidebar"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>

          <button
            onClick={() => {
              if (selectedCourseId) {
                navigate(`/course/${selectedCourseId}`);
              } else {
                navigate("/");
              }
            }}
            className="flex items-center space-x-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-xs sm:text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Course Syllabus</span>
          </button>
        </div>

        {/* Center Minimal Title */}
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] flex items-center justify-center space-x-2">
            <Bot className="h-5.5 w-5.5 text-primary" />
            <span>Lumina AI Tutor</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-medium">Your Personal Learning Mentor</p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedCourse && (
            <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20 max-w-[180px] sm:max-w-[240px] truncate">
              {selectedCourse.name}
            </span>
          )}
        </div>
      </header>

      {/* Main split dashboard section */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch relative">
        
        {/* MOBILE SIDEBAR DRAWER BACKDROP */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)} 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}

        {/* LEFT PANEL: HISTORY & CHATS LISTING */}
        <aside 
          className={`
            fixed inset-y-0 left-0 w-80 bg-[var(--surface-secondary)] border-r border-[var(--border)] p-5 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:static lg:w-auto lg:h-auto lg:col-span-4 xl:col-span-3 lg:bg-transparent lg:border-r-0 lg:p-0 lg:translate-x-0
            ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          `}
        >
          {/* Drawer close header for mobile */}
          <div className="flex items-center justify-between mb-4 lg:hidden pb-2 border-b border-[var(--border)]">
            <span className="text-sm font-bold text-[var(--text-primary)]">Conversations</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-primary/10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="glass-card p-6 flex flex-col h-full space-y-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-[var(--shadow)]">
            
            {/* New Chat Button */}
            <button
              onClick={() => createNewChat(selectedCourseId, selectedCourse || undefined)}
              className="w-full py-3.5 btn-premium-primary text-sm font-bold flex items-center justify-center space-x-2 shrink-0 rounded-2xl hover:scale-102 transition-all cursor-pointer shadow-md"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>New Chat</span>
            </button>

            {/* Conversation Search Bar */}
            <div className="relative shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[var(--input)] border border-[var(--input-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Chats List Container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh] lg:max-h-none scrollbar-thin">
              {filteredChats.map(chat => {
                const isActive = chat.id === currentChatId;
                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      if (chat.courseId && chat.courseId !== selectedCourseId) {
                        setSelectedCourseId(chat.courseId);
                      }
                      setIsSidebarOpen(false);
                    }}
                    className={`group flex items-center justify-between p-3.5 rounded-2xl transition-all border cursor-pointer ${
                      isActive 
                        ? "bg-primary/10 border-primary/25 text-primary font-bold shadow-sm" 
                        : "border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate flex-1">
                      <MessageSquare className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-primary" : "text-[var(--text-muted)]"}`} />
                      <span className="text-xs sm:text-sm truncate font-medium">{chat.title}</span>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="p-1 hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0 border border-transparent hover:border-rose-500/20"
                      title="Delete chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {filteredChats.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-[var(--text-muted)] italic">No conversations found</p>
                </div>
              )}
            </div>

            {/* Bottom Panel Actions */}
            <div className="pt-4 border-t border-[var(--border)] shrink-0">
              <button
                onClick={handleClearConversation}
                disabled={!activeChat || activeChat.messages.length === 0}
                className="w-full py-2.5 bg-[var(--surface-secondary)] hover:bg-rose-500/10 border border-[var(--border)] text-xs sm:text-sm font-bold text-[var(--text-primary)] rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 text-rose-500" />
                <span>Clear Current Chat</span>
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL: CHAT INTERFACE */}
        <section className="lg:col-span-8 xl:col-span-9 h-full flex flex-col min-h-0">
          <div className="glass-card border border-[var(--border)] rounded-3xl overflow-hidden shadow-[var(--shadow-lg)] flex flex-col h-[76vh] lg:h-[80vh] xl:h-[82vh] bg-[var(--surface)]">
            
            {/* INNER CHAT CONTAINER - ONLY SCROLLABLE PART */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 sm:space-y-8 bg-transparent scrollbar-thin"
            >
              
              {/* DEFAULT WELCOME BLOCK */}
              <div className="flex items-start space-x-4">
                <div className="p-2.5 bg-primary/20 text-secondary border border-primary/20 rounded-2xl mt-0.5 shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="bg-[var(--surface-secondary)] border border-[var(--border)] p-6 rounded-3xl rounded-tl-none max-w-[85%] shadow-sm text-xs sm:text-sm lg:text-base leading-relaxed space-y-3.5 text-[var(--text-primary)]">
                  <p className="font-extrabold text-[var(--text-primary)] text-base sm:text-lg">Hello! 👋</p>
                  <p>Welcome to <strong>Lumina AI Tutor</strong>.</p>
                  <p>I'm your personal AI learning mentor.</p>
                  <p>Ask me anything related to your learning path, courses, notes, quizzes, interview preparation, or revision.</p>
                  <p>Let's learn together.</p>
                </div>
              </div>

              {/* MESSAGES LOOP */}
              {activeChat && activeChat.messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div key={index} className={`flex items-start space-x-4 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
                    
                    {/* User / Bot Icon */}
                    <div className={`p-2.5 rounded-2xl mt-0.5 shrink-0 border ${
                       isUser 
                        ? "bg-primary/20 border-primary/30 text-primary" 
                        : "bg-primary/20 border-primary/20 text-secondary"
                    }`}>
                      {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                    </div>
 
                    {/* Speech Bubble */}
                    <div className={`p-5 sm:p-6 rounded-3xl max-w-[85%] shadow-sm text-xs sm:text-sm lg:text-base leading-relaxed ${
                      isUser 
                        ? "bg-primary text-white rounded-tr-none border border-primary/10" 
                        : "bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none"
                    }`}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                      ) : msg.text === "" ? (
                        <div className="flex items-center space-x-2 py-2 px-1">
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                        </div>
                      ) : (
                        <div className="markdown-body space-y-3">
                          <Markdown
                            components={{
                              code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeString = String(children).replace(/\n$/, '');
                                
                                if (match) {
                                  const isLastMsg = index === activeChat.messages.length - 1;
                                  const isComplete = !isGenerating || !isLastMsg;
                                  const codeId = `code-${index}-${match[1]}`;
                                  const isCopied = copiedCodeIndex === codeId;

                                  return (
                                    <div className="relative group my-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b0f19]">
                                      {/* Header Bar */}
                                      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                        <span className="text-[11px] text-muted-gray uppercase select-none font-mono font-bold tracking-wider">
                                          {match[1]}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyCode(codeString, codeId)}
                                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer transition-all border border-white/10 shadow-sm"
                                          title="Copy code to clipboard"
                                        >
                                          {isCopied ? (
                                            <>
                                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                                              <span className="text-emerald-400 font-bold text-[11px]">Copied</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="h-3.5 w-3.5 text-white/70" />
                                              <span className="text-[11px]">Copy Code</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                      <pre className="overflow-x-auto p-4 sm:p-5 text-white font-mono text-xs sm:text-sm">
                                        <code className="block whitespace-pre">
                                          {isComplete ? highlightCode(codeString, match[1]) : codeString}
                                        </code>
                                      </pre>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <code className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-mono text-xs sm:text-sm" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }
                            }}
                          >
                            {msg.text}
                          </Markdown>
                        </div>
                      )}
 
                      {/* Msg Actions */}
                      {!isUser && (
                        <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex items-center justify-between text-[var(--text-muted)] text-xs">
                          <div className="flex items-center space-x-4">
                            {msg.text !== "" && (
                              <button
                                onClick={() => {
                                  const isLastMsg = index === activeChat.messages.length - 1;
                                  const isCopyDisabled = isGenerating && isLastMsg;
                                  if (!isCopyDisabled) {
                                    handleCopyMessage(msg.text, index);
                                  }
                                }}
                                disabled={isGenerating && index === activeChat.messages.length - 1}
                                className={`flex items-center space-x-1.5 transition-colors ${
                                  isGenerating && index === activeChat.messages.length - 1
                                    ? "opacity-35 cursor-not-allowed"
                                    : "hover:text-[var(--text-primary)] cursor-pointer"
                                }`}
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-accent" />
                                    <span className="text-accent font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            )}
 
                            {index === activeChat.messages.length - 1 && !isGenerating && (
                              <button
                                onClick={handleRegenerate}
                                className="flex items-center space-x-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                              >
                                <RotateCcw className="h-3.5 w-3.5 text-primary" />
                                <span>Regenerate</span>
                              </button>
                            )}
                          </div>
 
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleFeedback(index, "like")}
                              className={`p-1.5 rounded-lg hover:bg-primary/10 cursor-pointer ${feedback[index] === "like" ? "text-primary font-bold" : ""}`}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleFeedback(index, "dislike")}
                              className={`p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer ${feedback[index] === "dislike" ? "text-rose-500 font-bold" : ""}`}
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* ERROR STATE VIEW */}
              {error && (
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-start space-x-4">
                  <AlertCircle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Notice</p>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">{error}</p>
                    <button
                      onClick={() => {
                        if (activeChat && activeChat.messages.length > 0) {
                          handleRegenerate();
                        }
                      }}
                      className="px-4 py-2 btn-premium-primary rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* EMPTY STATE COMPONENT CARD */}
              {(!activeChat || activeChat.messages.length === 0) && !isGenerating && (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="p-5 bg-primary/20 border border-primary/20 text-secondary rounded-3xl animate-bounce" style={{ animationDuration: "6s" }}>
                    <Bot className="h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Start learning with your AI Tutor</h3>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                      Select one of the quick chips below or ask any concept, code review, or revision questions!
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* CHIPS AND CHAT INPUT SECTION */}
            <div className="p-6 border-t border-[var(--border)] bg-[var(--surface-secondary)] shrink-0 space-y-4">
              
              {/* Floating suggested question chips */}
              {!isGenerating && (
                <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-thin">
                  {suggestedQuestions.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(chip.prompt)}
                      disabled={isGenerating}
                      className="whitespace-nowrap px-4 py-2 bg-[var(--surface)] hover:bg-primary/10 border border-[var(--border)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer shrink-0 shadow-sm"
                    >
                      {chip.text}
                    </button>
                  ))}
                </div>
              )}

              {/* Stop Generating Button */}
              {isGenerating && (
                <div className="flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full border border-rose-500/20 text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                    <span>Stop Generating</span>
                  </button>
                </div>
              )}

              {/* Chat Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center space-x-3"
              >
                <div className="relative flex-1 flex items-center bg-[var(--input)] border border-[var(--input-border)] focus-within:border-primary rounded-2xl pr-2 shadow-sm">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isGenerating}
                    placeholder={
                      selectedCourse 
                        ? `Ask anything about ${selectedCourse.name}...` 
                        : "Ask your AI Tutor..."
                    }
                    className="w-full pl-5 py-3.5 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none text-xs sm:text-sm"
                  />

                  {/* Speak indicator UI Only Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`p-2.5 text-[var(--text-muted)] rounded-xl transition-all hover:text-primary cursor-pointer ${
                      isRecordingUI ? "bg-rose-500/20 text-rose-500 animate-ping" : "hover:bg-[var(--surface-secondary)]"
                    }`}
                    title="Simulate Voice Input"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  className="p-3.5 btn-premium-primary text-white rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 border border-transparent hover:scale-105 shadow-md"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>

              {isRecordingUI && (
                <p className="text-xs text-rose-500 text-center animate-pulse font-semibold">
                  🎙️ Voice recording simulated... speak your prompt!
                </p>
              )}
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
