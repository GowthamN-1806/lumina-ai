import fs from "fs";
import path from "path";
import type { CatalogCourse, Difficulty } from "../types/catalog.ts";

let coursesById = new Map<string, CatalogCourse>();
let allCourses: CatalogCourse[] = [];

const CATALOG_PATH = path.join(process.cwd(), "backend", "data", "courses.json");

export function initCatalog(): void {
  const raw = fs.readFileSync(CATALOG_PATH, "utf-8");
  const data = JSON.parse(raw) as { courses: CatalogCourse[] };
  allCourses = data.courses;
  coursesById = new Map(allCourses.map((c) => [c.id, c]));
  console.log(`[Catalog] Loaded ${allCourses.length} verified courses`);
}

export function getCatalogSize(): number {
  return allCourses.length;
}

export function getAllCatalogCourses(): CatalogCourse[] {
  return allCourses;
}

export function getCourseById(id: string): CatalogCourse | undefined {
  return coursesById.get(id);
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

const TOPIC_SYNONYMS: Record<string, string[]> = {
  python: ["python", "py"],
  java: ["java"],
  cpp: ["c++", "cpp", "cplusplus"],
  c: ["c", "c-programming"],
  javascript: ["javascript", "js", "ecmascript"],
  typescript: ["typescript", "ts"],
  html: ["html", "html5"],
  css: ["css", "css3", "styling"],
  react: ["react", "reactjs", "react.js"],
  nodejs: ["node", "nodejs", "node.js", "express"],
  sql: ["sql", "mysql", "postgresql", "postgres"],
  dbms: ["dbms", "database", "rdbms", "database-management"],
  os: ["operating-system", "operating-systems", "os"],
  networks: ["network", "networks", "networking", "computer-networks", "tcp"],
  dsa: ["data-structures", "algorithms", "dsa", "leetcode"],
  ai: ["ai", "artificial-intelligence", "artificial intelligence"],
  ml: ["machine-learning", "ml"],
  dl: ["deep-learning", "dl", "neural-network", "neural-networks"],
  datascience: ["data-science", "data-science", "analytics"],
  cybersecurity: ["cybersecurity", "cyber-security", "security", "infosec", "ethical-hacking"],
  cloud: ["cloud", "cloud-computing"],
  aws: ["aws", "amazon-web-services"],
  azure: ["azure", "microsoft-azure"],
  docker: ["docker", "container", "containers"],
  kubernetes: ["kubernetes", "k8s"],
  git: ["git", "version-control"],
  github: ["github", "git-hub"],
  flutter: ["flutter", "dart"],
  android: ["android", "android-development", "kotlin-android"],
  unity: ["unity", "game-development", "gamedev"],
  uiux: ["ui", "ux", "ui-ux", "ui/ux", "user-experience", "user-interface"],
  figma: ["figma", "design-tool"],
  web: ["web-development", "web", "full-stack", "fullstack"],
};

export function expandTopics(rawTopics: string[]): Set<string> {
  const expanded = new Set<string>();
  const input = rawTopics.join(" ").toLowerCase();

  for (const [key, synonyms] of Object.entries(TOPIC_SYNONYMS)) {
    if (synonyms.some((s) => input.includes(s.replace(/-/g, " ")) || input.includes(s))) {
      expanded.add(key);
      synonyms.forEach((s) => expanded.add(s));
    }
  }

  rawTopics.forEach((t) => {
    tokenize(t).forEach((tok) => expanded.add(tok));
  });

  return expanded;
}

export function courseMatchesTopics(course: CatalogCourse, topics: Set<string>): number {
  const titleHaystack = course.title.toLowerCase();
  const tagHaystack = [...course.skills, ...course.tags].join(" ").toLowerCase();
  const descHaystack = course.description.toLowerCase();

  let score = 0;
  for (const topic of topics) {
    const normalized = topic.replace(/-/g, " ");
    if (titleHaystack.includes(normalized) || titleHaystack.includes(topic)) {
      score += topic.length > 3 ? 4 : 2;
    } else if (tagHaystack.includes(normalized) || tagHaystack.includes(topic)) {
      score += topic.length > 3 ? 3 : 1;
    } else if (descHaystack.includes(normalized) || descHaystack.includes(topic)) {
      score += 1;
    }
  }
  return score;
}

export function difficultyMatch(
  courseDifficulty: Difficulty,
  userLevel: Difficulty
): number {
  const levels: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
  const courseIdx = levels.indexOf(courseDifficulty);
  const userIdx = levels.indexOf(userLevel);
  const diff = Math.abs(courseIdx - userIdx);
  if (diff === 0) return 1;
  if (diff === 1) return 0.5;
  return 0.1;
}

export function findSimilarCourses(
  courseId: string,
  limit = 5
): CatalogCourse[] {
  const source = getCourseById(courseId);
  if (!source) return [];

  const sourceTags = new Set(source.tags.map((t) => t.toLowerCase()));

  const scored = allCourses
    .filter((c) => c.id !== courseId)
    .map((c) => {
      let score = 0;
      c.tags.forEach((tag) => {
        if (sourceTags.has(tag.toLowerCase())) score += 3;
      });
      c.skills.forEach((skill) => {
        source.skills.forEach((ss) => {
          if (ss.toLowerCase() === skill.toLowerCase()) score += 2;
        });
      });
      if (c.platform === source.platform) score += 1;
      if (c.difficulty === source.difficulty) score += 1;
      score += c.rating * 0.2;
      return { course: c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.course);
}

export function searchCatalogByText(query: string, limit = 20): CatalogCourse[] {
  const topics = expandTopics([query]);
  const scored = allCourses
    .map((c) => ({ course: c, score: courseMatchesTopics(c, topics) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.course.rating - a.course.rating);

  return scored.slice(0, limit).map((s) => s.course);
}
