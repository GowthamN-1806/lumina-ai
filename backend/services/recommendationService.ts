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

export function recommendCourses(intent: UserIntent, limit = 6): RecommendedCoursePayload[] {
  const topics = expandTopics([intent.learningGoal, ...intent.topics]);
  const allCourses = getAllCatalogCourses();
  const platform = normalizePlatformName(intent.preferredPlatform);

  let catalog =
    platform === "Any"
      ? allCourses
      : allCourses.filter(
          (course) => course.platform.toLowerCase() === platform.toLowerCase()
        );

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

  const results: RecommendedCoursePayload[] = [];
  const seen = new Set<string>();

  if (platform === "Any") {
    // Multi-platform diversification: pick top course per platform first
    const platformGroups = new Map<string, Array<{ course: CatalogCourse; score: number }>>();
    for (const item of scored) {
      const p = item.course.platform;
      if (!platformGroups.has(p)) platformGroups.set(p, []);
      platformGroups.get(p)!.push(item);
    }

    // Round 1: Select 1 top course from each distinct platform
    for (const [p, items] of platformGroups.entries()) {
      if (results.length >= limit) break;
      const top = items[0];
      if (!seen.has(top.course.id)) {
        seen.add(top.course.id);
        results.push(catalogToRecommendedCourse(top.course, intent, top.score));
      }
    }

    // Round 2: Fill remaining slots with next highest scored overall
    for (const { course, score } of scored) {
      if (results.length >= limit) break;
      if (!seen.has(course.id)) {
        seen.add(course.id);
        results.push(catalogToRecommendedCourse(course, intent, score));
      }
    }
  } else {
    // Specific platform selected: select top matches for that platform
    for (const { course, score } of scored) {
      if (seen.has(course.id)) continue;
      seen.add(course.id);
      results.push(catalogToRecommendedCourse(course, intent, score));
      if (results.length >= limit) break;
    }
  }

  // If results are sparse or empty for a requested platform, attach official search link
  if (results.length < limit) {
    const targetPlatform = platform !== "Any" ? platform : "Coursera";
    const searchUrl = getPlatformSearchUrl(targetPlatform, intent.learningGoal);
    const fallbackId = `official-search-${targetPlatform.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    if (!seen.has(fallbackId)) {
      results.push({
        id: fallbackId,
        name: `Browse ${intent.learningGoal} Catalog on ${targetPlatform}`,
        platform: targetPlatform,
        duration: "Self-paced",
        difficulty: intent.skillLevel,
        certificate: true,
        rating: 4.8,
        enrollUrl: searchUrl,
        officialUrl: searchUrl,
        whyRecommended: `Explore official verified ${targetPlatform} catalog search results for ${intent.learningGoal}.`,
        expectedOutcome: `Access live course list and certifications directly on ${targetPlatform}.`,
        instructor: `${targetPlatform} Verified Partner`,
        description: `Official search destination for ${intent.learningGoal} courses on ${targetPlatform}.`,
        skills: intent.topics.slice(0, 3),
        tags: intent.topics,
      });
    }
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
