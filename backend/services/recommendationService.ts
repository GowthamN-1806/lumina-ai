import type { CatalogCourse, UserIntent } from "../types/catalog.js";
import {
  getAllCatalogCourses,
  searchAndRankCatalog,
} from "./catalogService.js";
import { getPlatformSearchUrl, normalizePlatformName } from "./platformFallback.js";

export interface RecommendedCoursePayload {
  id: string;
  name: string;
  platform: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  certificate: boolean;
  rating: number;
  enrollUrl: string;
  officialUrl: string;
  whyRecommended: string;
  expectedOutcome: string;
  instructor: string;
  description: string;
  skills: string[];
  tags: string[];
}

function buildWhyRecommended(course: CatalogCourse, intent: UserIntent): string {
  const reasons: string[] = [];
  if (course.tags.some((t) => intent.topics.some((topic) => t.toLowerCase().includes(topic.toLowerCase())))) {
    reasons.push(`Strong match for ${intent.learningGoal}`);
  }
  if (course.difficulty === intent.skillLevel) {
    reasons.push(`Calibrated for ${intent.skillLevel} learners`);
  }
  const platform = normalizePlatformName(intent.preferredPlatform);
  if (platform !== "Any" && course.platform.toLowerCase().includes(platform.toLowerCase())) {
    reasons.push(`Available on your preferred platform (${course.platform})`);
  }
  if (course.rating >= 4.7) {
    reasons.push(`Highly rated (${course.rating.toFixed(1)}/5)`);
  }
  if (reasons.length === 0) {
    reasons.push(`Verified ${course.platform} course covering core ${intent.learningGoal} skills`);
  }
  return reasons.slice(0, 2).join(". ") + ".";
}

export function catalogToRecommendedCourse(
  course: CatalogCourse,
  intent: UserIntent
): RecommendedCoursePayload {
  const shortOutcome =
    course.description.length > 180
      ? course.description.slice(0, 177) + "..."
      : course.description;

  return {
    id: course.id,
    name: course.title,
    platform: course.platform,
    duration: course.duration,
    difficulty: course.difficulty,
    certificate: course.certificate,
    rating: course.rating,
    enrollUrl: course.officialUrl,
    officialUrl: course.officialUrl,
    whyRecommended: buildWhyRecommended(course, intent),
    expectedOutcome: shortOutcome,
    instructor: course.instructor,
    description: course.description,
    skills: course.skills,
    tags: course.tags,
  };
}

export function recommendCourses(intent: UserIntent, limit = 8): RecommendedCoursePayload[] {
  const query = intent.learningGoal || "";
  const platformFilter = intent.preferredPlatform || "Any";

  // Step 1: Search and rank all 91 verified catalog courses
  const matchedCourses = searchAndRankCatalog(query, platformFilter);

  // Step 2: If catalog matches exist, return top 5-10 catalog courses
  if (matchedCourses.length > 0) {
    const results = matchedCourses.slice(0, Math.max(limit, 6)).map((course) => {
      return catalogToRecommendedCourse(course, intent);
    });

    return results;
  }

  // Step 3: ONLY if genuinely 0 catalog courses matched after searching all 91 courses, use external fallback search
  const fallbackPlatform = normalizePlatformName(platformFilter) !== "Any" ? normalizePlatformName(platformFilter) : "YouTube";
  const searchUrl = getPlatformSearchUrl(fallbackPlatform, query);

  return [
    {
      id: `fallback-search-${Date.now()}`,
      name: `Explore ${query} on ${fallbackPlatform}`,
      platform: fallbackPlatform,
      duration: "Self-paced",
      difficulty: intent.skillLevel,
      certificate: true,
      rating: 4.8,
      enrollUrl: searchUrl,
      officialUrl: searchUrl,
      whyRecommended: `No exact matches found in local verified catalog for '${query}'. Redirecting to official ${fallbackPlatform} search portal.`,
      expectedOutcome: `Browse live courses for ${query} directly on ${fallbackPlatform}.`,
      instructor: `${fallbackPlatform} Certified Partner`,
      description: `Official search results for ${query} on ${fallbackPlatform}.`,
      skills: intent.topics.slice(0, 3),
      tags: intent.topics,
    },
  ];
}

export function catalogCourseToFrontend(course: CatalogCourse): RecommendedCoursePayload {
  const dummyIntent: UserIntent = {
    learningGoal: course.title,
    topics: course.tags,
    skillLevel: course.difficulty,
    budget: "Both",
    preferredPlatform: course.platform,
    studyTime: "1 hour/day",
  };
  return catalogToRecommendedCourse(course, dummyIntent);
}
