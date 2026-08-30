import fs from "fs";
import path from "path";
import coursesData from "../data/courses.json";
import type { CatalogCourse, Difficulty } from "../types/catalog.ts";

let allCourses: CatalogCourse[] = (coursesData.courses || []) as CatalogCourse[];
let coursesById = new Map<string, CatalogCourse>(allCourses.map((c) => [c.id, c]));

export function initCatalog(): void {
  try {
    if (allCourses.length === 0) {
      const candidatePaths = [
        path.join(process.cwd(), "backend", "data", "courses.json"),
        path.resolve(process.cwd(), "backend/data/courses.json"),
        path.join(__dirname, "../data/courses.json"),
        path.join(__dirname, "../../backend/data/courses.json"),
      ];

      let loadedRaw: string | null = null;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          loadedRaw = fs.readFileSync(p, "utf-8");
          break;
        }
      }

      if (loadedRaw) {
        const data = JSON.parse(loadedRaw) as { courses: CatalogCourse[] };
        allCourses = data.courses || [];
      } else {
        allCourses = (coursesData.courses || []) as CatalogCourse[];
      }
    }
    coursesById = new Map(allCourses.map((c) => [c.id, c]));
    console.log(`[Catalog] Loaded ${allCourses.length} verified courses`);
  } catch (err: any) {
    console.error("[Catalog] Error initializing catalog:", err.message || err);
    allCourses = (coursesData.courses || []) as CatalogCourse[];
    coursesById = new Map(allCourses.map((c) => [c.id, c]));
  }
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

const STOP_WORDS = new Set([
  "course", "courses", "learning", "tutorial", "tutorials", "for", "and", "the",
  "in", "of", "to", "a", "an", "guide", "full", "masterclass", "complete", "bootcamp",
  "beginner", "beginners", "intermediate", "advanced", "development", "dev"
]);

const CONCEPT_MAP = [
  { key: "web", synonyms: ["web development", "web-development", "web dev", "frontend development", "front end", "back end", "backend", "full stack", "fullstack", "react", "javascript", "js", "html", "css", "web design"] },
  { key: "ml", synonyms: ["machine learning", "machine-learning", "ml", "machinelearning", "deep learning", "neural network", "neural networks"] },
  { key: "ai", synonyms: ["artificial intelligence", "artificial-intelligence", "ai", "artificialintelligence"] },
  { key: "dl", synonyms: ["deep learning", "deep-learning", "dl", "neural network", "neural networks", "neural-network"] },
  { key: "ds", synonyms: ["data science", "data-science", "datascience", "data analytics", "data analysis"] },
  { key: "py", synonyms: ["python", "py", "python3", "programming for everybody"] },
  { key: "gamedev", synonyms: ["game development", "game dev", "gamedev", "unity", "game design", "c#"] },
  { key: "js", synonyms: ["javascript", "js", "ecmascript"] },
  { key: "ts", synonyms: ["typescript", "ts"] },
  { key: "react", synonyms: ["react", "reactjs", "react.js"] },
  { key: "node", synonyms: ["node", "nodejs", "node.js", "express"] },
  { key: "sql", synonyms: ["sql", "mysql", "postgresql", "postgres", "database", "dbms", "rdbms"] },
  { key: "dsa", synonyms: ["data structures", "algorithms", "dsa", "leetcode", "problem solving"] },
  { key: "os", synonyms: ["operating system", "operating-system", "operating systems", "os"] },
  { key: "networks", synonyms: ["computer networks", "networking", "network", "tcp/ip", "computer-networks"] },
  { key: "cloud", synonyms: ["cloud computing", "cloud", "aws", "azure", "docker", "kubernetes", "devops"] },
  { key: "cyber", synonyms: ["cybersecurity", "cyber security", "security", "ethical hacking", "infosec"] },
  { key: "mobile", synonyms: ["android", "flutter", "ios", "react native", "mobile development"] }
];

function normText(text: string): string {
  return (text || "").toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

export function expandTopics(rawTopics: string[]): Set<string> {
  const expanded = new Set<string>();
  const input = normText(rawTopics.join(" "));

  for (const group of CONCEPT_MAP) {
    for (const syn of group.synonyms) {
      const sNorm = normText(syn);
      if (sNorm.length <= 3) {
        const regex = new RegExp(`\\b${sNorm}\\b`, "i");
        if (regex.test(input)) {
          expanded.add(group.key);
          group.synonyms.forEach((s) => expanded.add(s));
          break;
        }
      } else if (input.includes(sNorm)) {
        expanded.add(group.key);
        group.synonyms.forEach((s) => expanded.add(s));
        break;
      }
    }
  }

  rawTopics.forEach((t) => {
    tokenize(t).forEach((tok) => {
      if (!STOP_WORDS.has(tok)) expanded.add(tok);
    });
  });

  return expanded;
}

export function courseMatchesTopics(course: CatalogCourse, topics: Set<string>): number {
  const titleHaystack = normText(course.title);
  const tagHaystack = normText([...course.skills, ...course.tags].join(" "));
  const descHaystack = normText(course.description);

  let score = 0;
  for (const topic of topics) {
    const normalized = normText(topic);
    if (normalized.length <= 1 || STOP_WORDS.has(normalized)) continue;

    if (normalized.length <= 3) {
      const regex = new RegExp(`\\b${normalized}\\b`, "i");
      if (regex.test(titleHaystack)) score += 8;
      else if (regex.test(tagHaystack)) score += 5;
      else if (regex.test(descHaystack)) score += 2;
    } else {
      if (titleHaystack.includes(normalized)) score += 8;
      else if (tagHaystack.includes(normalized)) score += 5;
      else if (descHaystack.includes(normalized)) score += 2;
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

export function searchAndRankCatalog(query: string, platformFilter = "Any"): CatalogCourse[] {
  if (allCourses.length === 0) {
    initCatalog();
  }

  const qNorm = normText(query);
  const rawTokens = qNorm.split(" ").filter((t) => t.length > 0 && !STOP_WORDS.has(t));

  const matchedConcepts = new Set<string>();
  for (const group of CONCEPT_MAP) {
    for (const syn of group.synonyms) {
      const synNorm = normText(syn);
      if (synNorm.length <= 3) {
        const regex = new RegExp(`\\b${synNorm}\\b`, "i");
        if (regex.test(qNorm)) {
          matchedConcepts.add(group.key);
          break;
        }
      } else if (qNorm.includes(synNorm)) {
        matchedConcepts.add(group.key);
        break;
      }
    }
  }

  let subset = allCourses;
  if (platformFilter && platformFilter.toLowerCase() !== "any") {
    const pNorm = normText(platformFilter);
    subset = allCourses.filter((c) => {
      const cpNorm = normText(c.platform);
      return cpNorm.includes(pNorm) || pNorm.includes(cpNorm);
    });

    if (subset.length === 0) {
      subset = allCourses;
    }
  }

  const scored = subset.map((c) => {
    const title = normText(c.title);
    const tags = normText((c.tags || []).join(" "));
    const skills = normText((c.skills || []).join(" "));
    const desc = normText(c.description);
    const fullText = `${title} ${tags} ${skills} ${desc}`;

    let score = 0;

    if (title.includes(qNorm) && qNorm.length > 2) score += 30;
    else if (fullText.includes(qNorm) && qNorm.length > 2) score += 15;

    for (const token of rawTokens) {
      if (token.length <= 1) continue;
      if (token.length <= 3) {
        const regex = new RegExp(`\\b${token}\\b`, "i");
        if (regex.test(title)) score += 10;
        else if (regex.test(tags) || regex.test(skills)) score += 6;
        else if (regex.test(desc)) score += 2;
      } else {
        if (title.includes(token)) score += 10;
        else if (tags.includes(token) || skills.includes(token)) score += 6;
        else if (desc.includes(token)) score += 2;
      }
    }

    for (const conceptKey of matchedConcepts) {
      const conceptObj = CONCEPT_MAP.find((g) => g.key === conceptKey);
      if (!conceptObj) continue;
      for (const syn of conceptObj.synonyms) {
        const sNorm = normText(syn);
        if (sNorm.length <= 3) {
          const regex = new RegExp(`\\b${sNorm}\\b`, "i");
          if (regex.test(title)) { score += 18; break; }
          if (regex.test(tags) || regex.test(skills)) { score += 12; break; }
          if (regex.test(desc)) { score += 4; break; }
        } else {
          if (title.includes(sNorm)) { score += 18; break; }
          if (tags.includes(sNorm) || skills.includes(sNorm)) { score += 12; break; }
          if (desc.includes(sNorm)) { score += 4; break; }
        }
      }
    }

    if (score === 0 && (rawTokens.length === 0 || matchedConcepts.size > 0)) {
      score = 5;
    }

    return { course: c, score };
  });

  const matches = scored.filter((item) => item.score > 0);
  matches.sort((a, b) => b.score - a.score || b.course.rating - a.course.rating);

  return matches.map((m) => m.course);
}

export function findSimilarCourses(courseId: string, limit = 5): CatalogCourse[] {
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
  return searchAndRankCatalog(query, "Any").slice(0, limit);
}
