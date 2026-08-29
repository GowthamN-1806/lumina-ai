import { GoogleGenAI, Type } from "@google/genai";
import type { Difficulty, UserIntent } from "../types/catalog.ts";
import { expandTopics, tokenize } from "./catalogService.ts";

const INTENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    learningGoal: { type: Type.STRING },
    topics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    skillLevel: { type: Type.STRING },
    budget: { type: Type.STRING },
    preferredPlatform: { type: Type.STRING },
    studyTime: { type: Type.STRING },
  },
  required: [
    "learningGoal",
    "topics",
    "skillLevel",
    "budget",
    "preferredPlatform",
    "studyTime",
  ],
};

const MODELS_TO_TRY = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

function normalizeDifficulty(value: string): Difficulty {
  const v = value.toLowerCase();
  if (v.includes("advanc")) return "Advanced";
  if (v.includes("inter")) return "Intermediate";
  return "Beginner";
}

function extractTopicsFromGoal(goal: string): string[] {
  const expanded = expandTopics([goal]);
  const topics = Array.from(expanded).filter((t) => t.length > 2);
  if (topics.length === 0) {
    return tokenize(goal);
  }
  return topics.slice(0, 12);
}

export function extractIntentFromForm(body: {
  learningGoal?: string;
  skillLevel?: string;
  studyTime?: string;
  completionTarget?: string;
  platform?: string;
  budget?: string;
}): UserIntent {
  const learningGoal = (body.learningGoal || "Programming").trim();
  return {
    learningGoal,
    topics: extractTopicsFromGoal(learningGoal),
    skillLevel: normalizeDifficulty(body.skillLevel || "Beginner"),
    budget: body.budget || "Both",
    preferredPlatform: body.platform || "Any",
    studyTime: body.studyTime || "1 hour/day",
    completionTarget: body.completionTarget || "3 months",
  };
}

export async function extractIntentWithGemini(
  ai: GoogleGenAI,
  body: {
    learningGoal?: string;
    skillLevel?: string;
    studyTime?: string;
    completionTarget?: string;
    platform?: string;
    budget?: string;
  }
): Promise<UserIntent> {
  const fallback = extractIntentFromForm(body);

  const prompt = `You are an intent extraction engine for a course recommendation system.
Analyze the user's learning profile and return structured JSON ONLY.

User profile:
- Learning Goal: ${body.learningGoal}
- Skill Level: ${body.skillLevel}
- Daily Study Time: ${body.studyTime}
- Completion Target: ${body.completionTarget}
- Preferred Platform: ${body.platform}
- Budget: ${body.budget}

Extract:
1. learningGoal - normalized concise learning goal
2. topics - array of 2-8 specific topic keywords (e.g. "python", "machine-learning", "react")
3. skillLevel - Beginner, Intermediate, or Advanced
4. budget - Free Only, Paid, or Both
5. preferredPlatform - exact platform name or "Any"
6. studyTime - daily study time string

DO NOT include course names, URLs, or recommendations.`;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: INTENT_SCHEMA,
          temperature: 0.1,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const mergedTopics = new Set([
          ...extractTopicsFromGoal(parsed.learningGoal || fallback.learningGoal),
          ...(Array.isArray(parsed.topics) ? parsed.topics.map(String) : []),
        ]);

        return {
          learningGoal: parsed.learningGoal || fallback.learningGoal,
          topics: Array.from(mergedTopics).slice(0, 12),
          skillLevel: normalizeDifficulty(parsed.skillLevel || fallback.skillLevel),
          budget: parsed.budget || fallback.budget,
          preferredPlatform: parsed.preferredPlatform || fallback.preferredPlatform,
          studyTime: parsed.studyTime || fallback.studyTime,
          completionTarget: body.completionTarget || fallback.completionTarget,
        };
      }
    } catch (err: any) {
      console.warn(`[Intent] Model ${modelName} failed:`, err.message || err);
    }
  }

  console.warn("[Intent] Falling back to rule-based intent extraction");
  return fallback;
}
