import type { CatalogCourse, UserIntent } from "../types/catalog.ts";
import {
  getAllCatalogCourses,
  expandTopics,
  courseMatchesTopics,
  difficultyMatch,
} from "./catalogService.ts";
import { getPlatformSearchUrl, normalizePlatformName } from "./platformFallback.ts";

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

function isBudgetMatch(course: CatalogCourse, budget: string): boolean {
  const b = budget.toLowerCase();
  if (b.includes("free")) {
    return course.isFree === true || course.certificate === false;
  }
  if (b.includes("paid")) {
    return course.isFree === false;
  }
  return true;
}

function studyTimeScore(studyTime: string, duration: string): number {
  const daily = studyTime.toLowerCase();
  const dur = duration.toLowerCase();
  if (daily.includes("15") || daily.includes("30")) {
    if (dur.includes("hour") && !dur.includes("0")) {
      const hours = parseInt(dur, 10);
      if (!isNaN(hours) && hours <= 20) return 1;
      return 0.4;
    }
    if (dur.includes("week")) return 0.8;
  }
  return 0.7;
}

function buildWhyRecommended(course: CatalogCourse, intent: UserIntent, score: number): string {
  const reasons: string[] = [];
  if (course.tags.some((t) => intent.topics.some((topic) => t.includes(topic) || topic.includes(t)))) {
    reasons.push(`Strong match for ${intent.learningGoal}`);
  }
  if (course.difficulty === intent.skillLevel) {
    reasons.push(`Calibrated for ${intent.skillLevel} learners`);
  }
  const platform = normalizePlatformName(intent.preferredPlatform);
  if (platform !== "Any" && course.platform === platform) {
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
  intent: UserIntent,
  score: number
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
    whyRecommended: buildWhyRecommended(course, intent, score),
    expectedOutcome: shortOutcome,
    instructor: course.instructor,
    description: course.description,
    skills: course.skills,
    tags: course.tags,
  };
}

function scoreCourse(course: CatalogCourse, intent: UserIntent, topics: Set<string>): number {
  const topicScore = courseMatchesTopics(course, topics);
  if (topicScore === 0) return 0;

  let score = topicScore * 0.4;
  score += difficultyMatch(course.difficulty, intent.skillLevel) * 0.25;

  const platform = normalizePlatformName(intent.preferredPlatform);
  if (platform !== "Any" && course.platform === platform) {
    score += 0.2;
  } else if (platform === "Any") {
    score += 0.1;
  }

  score += (course.rating / 5) * 0.15;
  score += studyTimeScore(intent.studyTime, course.duration) * 0.05;

  if (!isBudgetMatch(course, intent.budget)) {
    score *= 0.3;
  }

  return score;
}

export function recommendCourses(intent: UserIntent, limit = 5): RecommendedCoursePayload[] {
  const topics = expandTopics([intent.learningGoal, ...intent.topics]);

  // Load complete catalog
  const allCourses = getAllCatalogCourses();

  // Normalize selected platform
  const platform = normalizePlatformName(intent.preferredPlatform);

  // Filter by selected platform
  let catalog =
    platform === "Any"
      ? allCourses
      : allCourses.filter(
          (course) =>
            course.platform.toLowerCase() === platform.toLowerCase()
        );

  // If no courses exist for the selected platform,
  // gracefully fall back to the complete catalog.
  if (catalog.length === 0) {
    catalog = allCourses;
  }

  const scored = catalog
    .map((course) => ({
      course,
      score: scoreCourse(course, intent, topics),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const results: RecommendedCoursePayload[] = [];

  for (const { course, score } of scored) {
    if (seen.has(course.id)) continue;
    seen.add(course.id);

    results.push(catalogToRecommendedCourse(course, intent, score));

    if (results.length >= limit) break;
  }

  // If no recommendation is found,
  // generate an official platform search link.
  if (results.length === 0) {
    const fallbackPlatform =
      platform !== "Any" ? platform : "Coursera";

    const searchUrl = getPlatformSearchUrl(
      fallbackPlatform,
      intent.learningGoal
    );

    results.push({
      id: `fallback-search-${Date.now()}`,
      name: `Explore ${intent.learningGoal} on ${fallbackPlatform}`,
      platform: fallbackPlatform,
      duration: "Self-paced",
      difficulty: intent.skillLevel,
      certificate: false,
      rating: 4.0,
      enrollUrl: searchUrl,
      officialUrl: searchUrl,
      whyRecommended: `No verified catalog course matched your search. Opening the official ${fallbackPlatform} search page.`,
      expectedOutcome: `Browse official ${fallbackPlatform} courses for ${intent.learningGoal}.`,
      instructor: fallbackPlatform,
      description: `Official ${fallbackPlatform} search results for ${intent.learningGoal}.`,
      skills: intent.topics.slice(0, 3),
      tags: intent.topics,
    });
  }

  return results;
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
  return catalogToRecommendedCourse(course, dummyIntent, 1);
}
