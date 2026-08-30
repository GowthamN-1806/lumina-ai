import { GoogleGenAI, Type } from "@google/genai";
import type { UserIntent } from "../types/catalog.js";

const STUDY_PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    estimatedCompletionTime: { type: Type.STRING },
    summary: { type: Type.STRING },
    roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          duration: { type: Type.STRING },
          keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "description", "duration", "keyTopics"],
      },
    },
    weeklyPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          week: { type: Type.INTEGER },
          title: { type: Type.STRING },
          focus: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["week", "title", "focus", "tasks"],
      },
    },
    skillsToLearnNext: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "estimatedCompletionTime",
    "summary",
    "roadmap",
    "weeklyPlan",
    "skillsToLearnNext",
  ],
};

const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];

export interface StudyPlanPayload {
  estimatedCompletionTime: string;
  summary: string;
  roadmap: {
    title: string;
    description: string;
    duration: string;
    keyTopics: string[];
  }[];
  weeklyPlan: {
    week: number;
    title: string;
    focus: string;
    tasks: string[];
  }[];
  skillsToLearnNext: string[];
}

export function generateMockStudyPlan(intent: UserIntent): StudyPlanPayload {
  const goal = intent.learningGoal;
  const level = intent.skillLevel;

  return {
    estimatedCompletionTime: intent.completionTarget || "8 to 12 weeks",
    summary: `This structured learning path helps you progress from ${level} level toward mastering ${goal}. The plan balances theory with hands-on practice, aligned to ${intent.studyTime} daily study and verified course resources on your preferred platforms.`,
    roadmap: [
      {
        title: "Phase 1: Foundations & Environment Setup",
        description: `Build core knowledge and configure your development environment for ${goal}.`,
        duration: "Weeks 1-3",
        keyTopics: ["Core Concepts", "Tooling Setup", "Syntax & Fundamentals"],
      },
      {
        title: "Phase 2: Applied Skills & Projects",
        description: `Apply concepts through guided exercises and mini-projects in ${goal}.`,
        duration: "Weeks 4-7",
        keyTopics: ["Hands-on Labs", "Problem Solving", "Best Practices"],
      },
      {
        title: "Phase 3: Advanced Topics & Portfolio",
        description: `Deepen expertise and complete a capstone aligned with ${goal} career outcomes.`,
        duration: "Weeks 8-12",
        keyTopics: ["Advanced Patterns", "Real-world Projects", "Interview Prep"],
      },
    ],
    weeklyPlan: [
      {
        week: 1,
        title: "Getting Started",
        focus: "Environment setup and core fundamentals",
        tasks: [
          "Set up development tools and workspace",
          "Complete introductory modules on core concepts",
          "Write and run first practice exercises",
        ],
      },
      {
        week: 2,
        title: "Core Concepts",
        focus: "Master foundational building blocks",
        tasks: [
          "Study key syntax and data structures",
          "Complete guided coding exercises",
          "Review concepts with flashcards or notes",
        ],
      },
      {
        week: 3,
        title: "First Mini-Project",
        focus: "Apply knowledge in a small project",
        tasks: [
          "Plan and scaffold a mini-project",
          "Implement core features step by step",
          "Test, debug, and document your work",
        ],
      },
      {
        week: 4,
        title: "Intermediate Skills",
        focus: "Expand into intermediate topics",
        tasks: [
          "Study advanced modules from verified courses",
          "Practice with real-world examples",
          "Join community forums for peer learning",
        ],
      },
    ],
    skillsToLearnNext: [
      `Advanced ${goal} patterns`,
      "System design fundamentals",
      "Portfolio project development",
      "Technical interview preparation",
    ],
  };
}

export async function generateStudyPlanWithGemini(
  ai: GoogleGenAI,
  intent: UserIntent
): Promise<StudyPlanPayload> {
  const prompt = `You are Lumina AI, an expert academic advisor.
Create a personalized study plan for a learner with this profile:
- Learning Goal: ${intent.learningGoal}
- Topics: ${intent.topics.join(", ")}
- Skill Level: ${intent.skillLevel}
- Daily Study Time: ${intent.studyTime}
- Completion Target: ${intent.completionTarget}
- Budget: ${intent.budget}
- Preferred Platform: ${intent.preferredPlatform}

Generate:
1. estimatedCompletionTime (e.g. "6 weeks", "3 months")
2. summary - tailored learning journey explanation (2-3 sentences)
3. roadmap - 3 phases with title, description, duration, keyTopics
4. weeklyPlan - 4 weeks with week number, title, focus, and 3 tasks each
5. skillsToLearnNext - 4 practical next skills

IMPORTANT: Do NOT include course names, URLs, or platform links. Only the study plan.`;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: STUDY_PLAN_SCHEMA,
          temperature: 0.3,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          estimatedCompletionTime:
            parsed.estimatedCompletionTime || intent.completionTarget || "8 to 12 weeks",
          summary: parsed.summary || generateMockStudyPlan(intent).summary,
          roadmap: parsed.roadmap || generateMockStudyPlan(intent).roadmap,
          weeklyPlan: parsed.weeklyPlan || generateMockStudyPlan(intent).weeklyPlan,
          skillsToLearnNext:
            parsed.skillsToLearnNext || generateMockStudyPlan(intent).skillsToLearnNext,
        };
      }
    } catch (err: any) {
      console.warn(`[StudyPlan] Model ${modelName} failed:`, err.message || err);
    }
  }

  console.warn("[StudyPlan] Falling back to local study plan generator");
  return generateMockStudyPlan(intent);
}
