import { GoogleGenAI } from "@google/genai";
import { initCatalog } from "../backend/services/catalogService.js";
import {
  extractIntentFromForm,
  extractIntentWithGemini,
} from "../backend/services/intentService.js";
import { recommendCourses } from "../backend/services/recommendationService.js";
import {
  generateMockStudyPlan,
  generateStudyPlanWithGemini,
} from "../backend/services/studyPlanService.js";

// Initialize course catalog
initCatalog();

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
  // CORS Preflight Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key"
  );

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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
    } = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

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
      req.headers ? (req.headers["x-gemini-api-key"] as string | undefined) : undefined;

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

    // Fast recommendation flow
    intent = extractIntentFromForm(formBody);
    studyPlan = generateMockStudyPlan(intent);

    if (aiInstance) {
      try {
        const geminiPromise = generateStudyPlanWithGemini(aiInstance, intent);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Fast timeout for Gemini study plan")), 2500);
        });
        studyPlan = await Promise.race([geminiPromise, timeoutPromise]);
      } catch (aiError: any) {
        console.warn(
          "[API /api/recommend] Gemini timed out or failed. Using instant local study plan:",
          aiError?.message || aiError
        );
      }
    }

    // Get verified courses from catalog
    const courses = recommendCourses(intent, 8);

    // Build response
    const response = {
      id: "rec-" + Math.random().toString(36).slice(2, 11),
      learningGoal: intent.learningGoal,
      skillLevel: intent.skillLevel,
      dailyStudyTime: intent.studyTime,
      completionTarget: intent.completionTarget || completionTarget,
      estimatedCompletionTime: studyPlan.estimatedCompletionTime,
      summary: studyPlan.summary,
      roadmap: studyPlan.roadmap,
      courses,
      weeklyPlan: studyPlan.weeklyPlan,
      skillsToLearnNext: studyPlan.skillsToLearnNext,
      createdAt: new Date().toISOString(),
    };

    console.log(`[API /api/recommend] Returned ${courses.length} courses`);
    return res.status(200).json(response);
  } catch (error: any) {
    console.error("[API /api/recommend] Unexpected error:", error);

    // Final fallback
    try {
      const formBody = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const intent = extractIntentFromForm(formBody);
      const studyPlan = generateMockStudyPlan(intent);
      const courses = recommendCourses(intent, 8);

      return res.status(200).json({
        id: "rec-" + Math.random().toString(36).slice(2, 11),
        learningGoal: intent.learningGoal,
        skillLevel: intent.skillLevel,
        dailyStudyTime: intent.studyTime,
        completionTarget: intent.completionTarget,
        estimatedCompletionTime: studyPlan.estimatedCompletionTime,
        summary: studyPlan.summary,
        roadmap: studyPlan.roadmap,
        courses,
        weeklyPlan: studyPlan.weeklyPlan,
        skillsToLearnNext: studyPlan.skillsToLearnNext,
        createdAt: new Date().toISOString(),
      });
    } catch (fallbackError: any) {
      console.error("[API /api/recommend] Fallback failed:", fallbackError);
      return res.status(500).json({
        error: "Failed to generate recommendation",
      });
    }
  }
}