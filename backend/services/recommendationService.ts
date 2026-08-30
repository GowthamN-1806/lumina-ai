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

const ALL_PLATFORMS = [
  "Coursera",
  "Udemy",
  "YouTube",
  "freeCodeCamp",
  "edX",
  "MIT OCW",
  "NPTEL",
  "Infosys Springboard",
];

function isBudgetMatch(course: CatalogCourse, budget: string): boolean {
  const b = (budget || "").toLowerCase();
  if (b.includes("free")) {
    return course.isFree === true || course.certificate === false;
  }
  if (b.includes("paid")) {
    return course.isFree === false;
  }
  return true;
}

function studyTimeScore(studyTime: string, duration: string): number {
  const daily = (studyTime || "").toLowerCase();
  const dur = (duration || "").toLowerCase();
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
  let score = topicScore > 0 ? topicScore * 0.5 : 0.2;
  score += difficultyMatch(course.difficulty, intent.skillLevel) * 0.25;

  const platform = normalizePlatformName(intent.preferredPlatform);
  if (platform !== "Any" && course.platform.toLowerCase() === platform.toLowerCase()) {
    score += 0.4;
  } else if (platform === "Any") {
    score += 0.1;
  }

  score += (course.rating / 5) * 0.15;
  score += studyTimeScore(intent.studyTime, course.duration) * 0.05;

  if (!isBudgetMatch(course, intent.budget)) {
    score *= 0.7;
  }

  return score;
}

export function recommendCourses(intent: UserIntent, limit = 8): RecommendedCoursePayload[] {
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
    .sort((a, b) => b.score - a.score);

  const results: RecommendedCoursePayload[] = [];
  const seen = new Set<string>();

  if (platform === "Any") {
    // Multi-platform diversification: Group courses by platform
    const platformGroups = new Map<string, Array<{ course: CatalogCourse; score: number }>>();
    for (const item of scored) {
      const p = item.course.platform;
      if (!platformGroups.has(p)) platformGroups.set(p, []);
      platformGroups.get(p)!.push(item);
    }

    // Round 1: Select top course from EACH distinct platform so all platforms display!
    for (const p of ALL_PLATFORMS) {
      if (results.length >= limit) break;
      const items = platformGroups.get(p);
      if (items && items.length > 0) {
        const top = items[0];
        if (!seen.has(top.course.id)) {
          seen.add(top.course.id);
          results.push(catalogToRecommendedCourse(top.course, intent, top.score));
        }
      }
    }

    // Round 2: Fill remaining slots with next highest-scored overall
    for (const { course, score } of scored) {
      if (results.length >= limit) break;
      if (!seen.has(course.id)) {
        seen.add(course.id);
        results.push(catalogToRecommendedCourse(course, intent, score));
      }
    }

    // Round 3: If any major platforms are missing from results, append platform search cards so ALL platforms display
    for (const p of ALL_PLATFORMS) {
      if (results.length >= limit) break;
      const hasPlatformInResults = results.some((r) => r.platform.toLowerCase() === p.toLowerCase());
      if (!hasPlatformInResults) {
        const searchUrl = getPlatformSearchUrl(p, intent.learningGoal);
        const fallbackId = `official-search-${p.toLowerCase().replace(/\s+/g, "-")}`;
        if (!seen.has(fallbackId)) {
          seen.add(fallbackId);
          results.push({
            id: fallbackId,
            name: `Explore ${intent.learningGoal} on ${p}`,
            platform: p,
            duration: "Self-paced",
            difficulty: intent.skillLevel,
            certificate: true,
            rating: 4.8,
            enrollUrl: searchUrl,
            officialUrl: searchUrl,
            whyRecommended: `Official verified ${p} catalog search results for ${intent.learningGoal}.`,
            expectedOutcome: `Access live course catalog and certifications on ${p}.`,
            instructor: `${p} Instructor Network`,
            description: `Browse all official ${intent.learningGoal} courses available on ${p}.`,
            skills: intent.topics.slice(0, 3),
            tags: intent.topics,
          });
        }
      }
    }
  } else {
    // Specific platform selected
    for (const { course, score } of scored) {
      if (seen.has(course.id)) continue;
      seen.add(course.id);
      results.push(catalogToRecommendedCourse(course, intent, score));
      if (results.length >= limit) break;
    }

    // Append platform search card for the specific requested platform if needed
    const searchUrl = getPlatformSearchUrl(platform, intent.learningGoal);
    const fallbackId = `official-search-${platform.toLowerCase().replace(/\s+/g, "-")}`;
    if (!seen.has(fallbackId)) {
      seen.add(fallbackId);
      results.push({
        id: fallbackId,
        name: `Explore All ${intent.learningGoal} Courses on ${platform}`,
        platform: platform,
        duration: "Self-paced",
        difficulty: intent.skillLevel,
        certificate: true,
        rating: 4.8,
        enrollUrl: searchUrl,
        officialUrl: searchUrl,
        whyRecommended: `Official verified ${platform} catalog search page for ${intent.learningGoal}.`,
        expectedOutcome: `Browse live courses, degree programs, and certificates on ${platform}.`,
        instructor: `${platform} Education Partner`,
        description: `Official search results for ${intent.learningGoal} on ${platform}.`,
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
