export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Platform =
  | "Coursera"
  | "Udemy"
  | "YouTube"
  | "freeCodeCamp"
  | "NPTEL"
  | "MIT OCW"
  | "Infosys Springboard"
  | "edX";

export interface CatalogCourse {
  id: string;
  title: string;
  platform: Platform;
  officialUrl: string;
  instructor: string;
  rating: number;
  duration: string;
  difficulty: Difficulty;
  certificate: boolean;
  description: string;
  skills: string[];
  tags: string[];
  thumbnail?: string;
  isFree?: boolean;
}

export interface CatalogData {
  courses: CatalogCourse[];
}

export interface UserIntent {
  learningGoal: string;
  topics: string[];
  skillLevel: Difficulty;
  budget: string;
  preferredPlatform: string;
  studyTime: string;
  completionTarget?: string;
}
