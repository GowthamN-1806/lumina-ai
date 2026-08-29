export interface Course {
  id: string;
  name: string;
  platform: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  certificate: boolean;
  rating: number;
  enrollUrl: string;
  whyRecommended: string;
  expectedOutcome: string;
  instructor?: string;
  description?: string;
  skills?: string[];
  tags?: string[];
  officialUrl?: string;
  thumbnail?: string;
}

export interface LearningMilestone {
  title: string;
  description: string;
  duration: string;
  keyTopics: string[];
}

export interface WeeklyPlanItem {
  week: number;
  title: string;
  focus: string;
  tasks: string[];
}

export interface RecommendationResponse {
  id: string;
  learningGoal: string;
  skillLevel: string;
  dailyStudyTime: string;
  completionTarget: string;
  estimatedCompletionTime: string;
  summary: string;
  roadmap: LearningMilestone[];
  courses: Course[];
  weeklyPlan: WeeklyPlanItem[];
  skillsToLearnNext: string[];
  createdAt: string;
}

export interface RecommendationQuery {
  learningGoal: string;
  skillLevel: string;
  studyTime: string;
  completionTarget: string;
  platform: string;
  budget: string;
}

export interface UserProgress {
  courseId: string;
  courseName: string;
  progress: number; // percentage 0-100
  lastUpdated: string;
}

export interface StudyNotesResponse {
  notes: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  explanation: string;
  whyAsk: string;
  commonMistakes: string;
  proTip: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  frequency: "Low" | "Medium" | "High";
}

export interface InterviewResponse {
  beginner: InterviewQuestion[];
  intermediate: InterviewQuestion[];
  advanced: InterviewQuestion[];
}

