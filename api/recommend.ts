import { GoogleGenAI } from "@google/genai";

import {
  initCatalog,
} from "../backend/services/catalogService.ts";

import {
  extractIntentFromForm,
  extractIntentWithGemini,
} from "../backend/services/intentService.ts";

import {
  recommendCourses,
} from "../backend/services/recommendationService.ts";

import {
  generateMockStudyPlan,
  generateStudyPlanWithGemini,
} from "../backend/services/studyPlanService.ts";

// Initialize course catalog
initCatalog();

// Create Gemini client
function getGeminiClient(customKey?: string): GoogleGenAI | null {
  const apiKey = customKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      learningGoal,
      skillLevel,
      studyTime,
      completionTarget,
      platform,
      budget,
    } = req.body || {};

    // Validate learning goal
    if (!learningGoal) {
      return res.status(400).json({
        error: "Learning goal is required",
      });
    }

    console.log(
      "[API /api/recommend] Generating recommendation for:",
      learningGoal
    );

    // Allow user's Gemini key through the request header
    const clientApiKey =
      req.headers["x-gemini-api-key"] as string | undefined;

    const aiInstance = getGeminiClient(clientApiKey);

    const formBody = {
      learningGoal,
      skillLevel,
      studyTime,
      completionTarget,
      platform,
      budget,
    };

    let intent;
    let studyPlan;

    // -----------------------------------------
    // AI recommendation
    // -----------------------------------------
    if (aiInstance) {
      try {
        intent = await extractIntentWithGemini(
          aiInstance,
          formBody
        );

        studyPlan = await generateStudyPlanWithGemini(
          aiInstance,
          intent
        );
      } catch (aiError: any) {
        console.warn(
          "[API /api/recommend] Gemini failed. Using local fallback:",
          aiError?.message || aiError
        );

        intent = extractIntentFromForm(formBody);
        studyPlan = generateMockStudyPlan(intent);
      }
    }

    // -----------------------------------------
    // No Gemini key → local fallback
    // -----------------------------------------
    else {
      console.log(
        "[API /api/recommend] No Gemini key. Using local fallback."
      );

      intent = extractIntentFromForm(formBody);
      studyPlan = generateMockStudyPlan(intent);
    }

    // -----------------------------------------
    // Get verified courses from catalog
    // -----------------------------------------
    const courses = recommendCourses(intent, 5);

    // -----------------------------------------
    // Build response
    // -----------------------------------------
    const response = {
      id: "rec-" + Math.random().toString(36).slice(2, 11),

      learningGoal: intent.learningGoal,

      skillLevel: intent.skillLevel,

      dailyStudyTime: intent.studyTime,

      completionTarget:
        intent.completionTarget || completionTarget,

      estimatedCompletionTime:
        studyPlan.estimatedCompletionTime,

      summary: studyPlan.summary,

      roadmap: studyPlan.roadmap,

      courses,

      weeklyPlan: studyPlan.weeklyPlan,

      skillsToLearnNext:
        studyPlan.skillsToLearnNext,

      createdAt: new Date().toISOString(),
    };

    console.log(
      `[API /api/recommend] Returned ${courses.length} courses`
    );

    return res.status(200).json(response);

  } catch (error: any) {
    console.error(
      "[API /api/recommend] Unexpected error:",
      error
    );

    // -----------------------------------------
    // Final fallback
    // -----------------------------------------
    try {
      const formBody = req.body || {};

      const intent = extractIntentFromForm(formBody);

      const studyPlan = generateMockStudyPlan(intent);

      const courses = recommendCourses(intent, 5);

      return res.status(200).json({
        id: "rec-" + Math.random().toString(36).slice(2, 11),

        learningGoal: intent.learningGoal,

        skillLevel: intent.skillLevel,

        dailyStudyTime: intent.studyTime,

        completionTarget: intent.completionTarget,

        estimatedCompletionTime:
          studyPlan.estimatedCompletionTime,

        summary: studyPlan.summary,

        roadmap: studyPlan.roadmap,

        courses,

        weeklyPlan: studyPlan.weeklyPlan,

        skillsToLearnNext:
          studyPlan.skillsToLearnNext,

        createdAt: new Date().toISOString(),
      });

    } catch (fallbackError: any) {
      console.error(
        "[API /api/recommend] Fallback failed:",
        fallbackError
      );

      return res.status(500).json({
        error: "Failed to generate recommendation",
      });
    }
  }
}