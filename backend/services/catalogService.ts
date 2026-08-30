import fs from "fs";
import path from "path";
import coursesData from "../data/courses.json" with { type: "json" };
import type { CatalogCourse, Difficulty } from "../types/catalog.js";

let allCourses: CatalogCourse[] = (coursesData.courses || []) as CatalogCourse[];
let coursesById = new Map<string, CatalogCourse>(
  allCourses.map((c) => [c.id, c])
);

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
        const data = JSON.parse(loadedRaw) as {
          courses: CatalogCourse[];
        };

        allCourses = data.courses || [];
      } else {
        allCourses = (coursesData.courses || []) as CatalogCourse[];
      }
    }

    coursesById = new Map(allCourses.map((c) => [c.id, c]));

    console.log(`[Catalog] Loaded ${allCourses.length} verified courses`);
  } catch (err: any) {
    console.error(
      "[Catalog] Error initializing catalog:",
      err.message || err
    );

    allCourses = (coursesData.courses || []) as CatalogCourse[];

    coursesById = new Map(
      allCourses.map((c) => [c.id, c])
    );
  }
}

export function getCatalogSize(): number {
  return allCourses.length;
}

export function getAllCatalogCourses(): CatalogCourse[] {
  return allCourses;
}

export function getCourseById(
  id: string
): CatalogCourse | undefined {
  return coursesById.get(id);
}

/* =========================================================
   TEXT NORMALIZATION
   ========================================================= */

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/*
 * IMPORTANT:
 * "development" and "dev" are intentionally NOT stop words.
 *
 * Searches such as:
 *   Web Development
 *   Game Development
 *   Mobile Development
 *   Backend Development
 *
 * need these words for accurate matching.
 */
const STOP_WORDS = new Set([
  "course",
  "courses",
  "learning",
  "tutorial",
  "tutorials",
  "for",
  "and",
  "the",
  "in",
  "of",
  "to",
  "a",
  "an",
  "guide",
  "full",
  "masterclass",
  "complete",
  "bootcamp",
  "learn",
  "best",
  "online",
]);

/* =========================================================
   CONCEPT MAP
   ========================================================= */

const CONCEPT_MAP = [
  {
    key: "web",
    synonyms: [
      "web development",
      "web-development",
      "web dev",
      "frontend development",
      "front end",
      "front-end",
      "backend development",
      "back end",
      "back-end",
      "backend",
      "full stack",
      "fullstack",
      "full-stack",
      "react",
      "javascript",
      "js",
      "html",
      "css",
      "web design",
      "responsive web design",
    ],
  },

  {
    key: "ml",
    synonyms: [
      "machine learning",
      "machine-learning",
      "ml",
      "machinelearning",
      "deep learning",
      "neural network",
      "neural networks",
    ],
  },

  {
    key: "ai",
    synonyms: [
      "artificial intelligence",
      "artificial-intelligence",
      "ai",
      "artificialintelligence",
    ],
  },

  {
    key: "dl",
    synonyms: [
      "deep learning",
      "deep-learning",
      "dl",
      "neural network",
      "neural networks",
      "neural-network",
    ],
  },

  {
    key: "ds",
    synonyms: [
      "data science",
      "data-science",
      "datascience",
      "data analytics",
      "data analysis",
    ],
  },

  {
    key: "py",
    synonyms: [
      "python",
      "py",
      "python3",
      "programming for everybody",
    ],
  },

  {
    key: "gamedev",
    synonyms: [
      "game development",
      "game development",
      "game dev",
      "gamedev",
      "unity",
      "game design",
      "unreal engine",
      "godot",
      "c#",
    ],
  },

  {
    key: "js",
    synonyms: [
      "javascript",
      "java script",
      "js",
      "ecmascript",
    ],
  },

  {
    key: "ts",
    synonyms: [
      "typescript",
      "type script",
      "ts",
    ],
  },

  {
    key: "react",
    synonyms: [
      "react",
      "reactjs",
      "react.js",
    ],
  },

  {
    key: "node",
    synonyms: [
      "node",
      "nodejs",
      "node.js",
      "express",
      "expressjs",
    ],
  },

  {
    key: "sql",
    synonyms: [
      "sql",
      "mysql",
      "postgresql",
      "postgres",
      "database",
      "dbms",
      "rdbms",
    ],
  },

  {
    key: "dsa",
    synonyms: [
      "data structures",
      "algorithms",
      "dsa",
      "leetcode",
      "problem solving",
    ],
  },

  {
    key: "os",
    synonyms: [
      "operating system",
      "operating-system",
      "operating systems",
      "os",
    ],
  },

  {
    key: "networks",
    synonyms: [
      "computer networks",
      "networking",
      "network",
      "tcp/ip",
      "computer-networks",
    ],
  },

  {
    key: "cloud",
    synonyms: [
      "cloud computing",
      "cloud",
      "aws",
      "azure",
      "docker",
      "kubernetes",
      "devops",
    ],
  },

  {
    key: "cyber",
    synonyms: [
      "cybersecurity",
      "cyber security",
      "security",
      "ethical hacking",
      "infosec",
    ],
  },

  {
    key: "mobile",
    synonyms: [
      "android",
      "flutter",
      "ios",
      "react native",
      "mobile development",
    ],
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function normText(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsWord(
  text: string,
  word: string
): boolean {
  if (!word) return false;

  const normalizedText = normText(text);
  const normalizedWord = normText(word);

  if (normalizedWord.length <= 3) {
    return new RegExp(
      `\\b${normalizedWord}\\b`,
      "i"
    ).test(normalizedText);
  }

  return normalizedText.includes(normalizedWord);
}

function getCourseSearchText(
  course: CatalogCourse
): {
  title: string;
  tags: string;
  skills: string;
  description: string;
} {
  return {
    title: normText(course.title),
    tags: normText((course.tags || []).join(" ")),
    skills: normText((course.skills || []).join(" ")),
    description: normText(course.description),
  };
}

/* =========================================================
   TOPIC EXPANSION
   ========================================================= */

export function expandTopics(
  rawTopics: string[]
): Set<string> {
  const expanded = new Set<string>();

  const input = normText(
    rawTopics.join(" ")
  );

  for (const group of CONCEPT_MAP) {
    for (const synonym of group.synonyms) {
      const synonymNorm = normText(synonym);

      if (synonymNorm.length <= 3) {
        if (containsWord(input, synonymNorm)) {
          expanded.add(group.key);

          group.synonyms.forEach((s) => {
            expanded.add(normText(s));
          });

          break;
        }
      } else if (input.includes(synonymNorm)) {
        expanded.add(group.key);

        group.synonyms.forEach((s) => {
          expanded.add(normText(s));
        });

        break;
      }
    }
  }

  rawTopics.forEach((topic) => {
    tokenize(topic).forEach((token) => {
      if (!STOP_WORDS.has(token)) {
        expanded.add(token);
      }
    });
  });

  return expanded;
}

/* =========================================================
   BASIC TOPIC MATCHING
   ========================================================= */

export function courseMatchesTopics(
  course: CatalogCourse,
  topics: Set<string>
): number {
  const titleHaystack = normText(course.title);

  const tagHaystack = normText(
    [
      ...(course.skills || []),
      ...(course.tags || []),
    ].join(" ")
  );

  const descHaystack = normText(
    course.description
  );

  let score = 0;

  for (const topic of topics) {
    const normalized = normText(topic);

    if (
      normalized.length <= 1 ||
      STOP_WORDS.has(normalized)
    ) {
      continue;
    }

    if (containsWord(titleHaystack, normalized)) {
      score += 8;
    } else if (
      containsWord(tagHaystack, normalized)
    ) {
      score += 5;
    } else if (
      containsWord(descHaystack, normalized)
    ) {
      score += 2;
    }
  }

  return score;
}

/* =========================================================
   DIFFICULTY
   ========================================================= */

export function difficultyMatch(
  courseDifficulty: Difficulty,
  userLevel: Difficulty
): number {
  const levels: Difficulty[] = [
    "Beginner",
    "Intermediate",
    "Advanced",
  ];

  const courseIdx =
    levels.indexOf(courseDifficulty);

  const userIdx =
    levels.indexOf(userLevel);

  const diff = Math.abs(
    courseIdx - userIdx
  );

  if (diff === 0) return 1;
  if (diff === 1) return 0.5;

  return 0.1;
}

/* =========================================================
   MAIN COURSE SEARCH + RANKING
   ========================================================= */

export function searchAndRankCatalog(
  query: string,
  platformFilter = "Any"
): CatalogCourse[] {
  if (allCourses.length === 0) {
    initCatalog();
  }

  const qNorm = normText(query);

  if (!qNorm) {
    return [];
  }

  /*
   * Create meaningful query tokens.
   *
   * IMPORTANT:
   * "development" and "dev" remain searchable.
   */
  const rawTokens = qNorm
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .filter(
      (token) => !STOP_WORDS.has(token)
    );

  /* -------------------------------------------------------
     Detect concepts
  ------------------------------------------------------- */

  const matchedConcepts =
    new Set<string>();

  for (const group of CONCEPT_MAP) {
    for (const synonym of group.synonyms) {
      const synonymNorm =
        normText(synonym);

      if (synonymNorm.length <= 3) {
        if (
          containsWord(
            qNorm,
            synonymNorm
          )
        ) {
          matchedConcepts.add(
            group.key
          );

          break;
        }
      } else if (
        qNorm.includes(synonymNorm)
      ) {
        matchedConcepts.add(
          group.key
        );

        break;
      }
    }
  }

  /*
   * Expand concepts into search terms.
   */
  const expandedTerms =
    new Set<string>(rawTokens);

  for (const conceptKey of matchedConcepts) {
    const concept =
      CONCEPT_MAP.find(
        (group) =>
          group.key === conceptKey
      );

    if (!concept) continue;

    concept.synonyms.forEach(
      (synonym) => {
        expandedTerms.add(
          normText(synonym)
        );
      }
    );
  }

  /* -------------------------------------------------------
     Score EVERY course
  ------------------------------------------------------- */

  const scored = allCourses.map(
    (course) => {
      const {
        title,
        tags,
        skills,
        description,
      } = getCourseSearchText(course);

      let score = 0;

      /* Exact title match */

      if (title === qNorm) {
        score += 120;
      }

      /* Title contains complete query */

      else if (
        title.includes(qNorm)
      ) {
        score += 80;
      }

      /* Tags / skills contain complete query */

      else if (
        tags.includes(qNorm) ||
        skills.includes(qNorm)
      ) {
        score += 60;
      }

      /* Description contains complete query */

      else if (
        description.includes(qNorm)
      ) {
        score += 30;
      }

      /* ---------------------------------------------------
         Individual query tokens
      --------------------------------------------------- */

      let matchedTokenCount = 0;

      for (const token of rawTokens) {
        const titleMatch =
          containsWord(
            title,
            token
          );

        const tagMatch =
          containsWord(
            tags,
            token
          );

        const skillMatch =
          containsWord(
            skills,
            token
          );

        const descriptionMatch =
          containsWord(
            description,
            token
          );

        if (titleMatch) {
          score += 25;
          matchedTokenCount++;
        } else if (
          tagMatch ||
          skillMatch
        ) {
          score += 15;
          matchedTokenCount++;
        } else if (
          descriptionMatch
        ) {
          score += 6;
          matchedTokenCount++;
        }
      }

      /*
       * Reward courses matching multiple
       * words in the user's query.
       */
      if (
        rawTokens.length > 1 &&
        matchedTokenCount ===
          rawTokens.length
      ) {
        score += 25;
      }

      /* ---------------------------------------------------
         Concept matching
      --------------------------------------------------- */

      for (const conceptKey of matchedConcepts) {
        const concept =
          CONCEPT_MAP.find(
            (group) =>
              group.key ===
              conceptKey
          );

        if (!concept) continue;

        let matched =
          false;

        for (
          const synonym of
            concept.synonyms
        ) {
          const synonymNorm =
            normText(
              synonym
            );

          if (
            containsWord(
              title,
              synonymNorm
            )
          ) {
            score += 30;
            matched = true;
            break;
          }

          if (
            containsWord(
              tags,
              synonymNorm
            ) ||
            containsWord(
              skills,
              synonymNorm
            )
          ) {
            score += 20;
            matched = true;
            break;
          }

          if (
            containsWord(
              description,
              synonymNorm
            )
          ) {
            score += 8;
            matched = true;
            break;
          }
        }

        /*
         * Small additional bonus when the course
         * clearly belongs to the requested concept.
         */
        if (matched) {
          score += 5;
        }
      }

      /* ---------------------------------------------------
         Platform preference
      --------------------------------------------------- */

      const requestedPlatform =
        normText(
          platformFilter
        );

      const coursePlatform =
        normText(
          course.platform
        );

      if (
        requestedPlatform &&
        requestedPlatform !==
          "any"
      ) {
        if (
          coursePlatform ===
          requestedPlatform
        ) {
          score += 12;
        }
      }

      /* ---------------------------------------------------
         Rating
         --------------------------------------------------- */

      /*
       * Rating should influence ranking,
       * but NOT overpower relevance.
       */
      score +=
        course.rating * 0.5;

      return {
        course,
        score,
        matchedTokenCount,
      };
    }
  );

  /* -------------------------------------------------------
     Remove irrelevant courses
  ------------------------------------------------------- */

  const matches = scored
    .filter((item) => {
      /*
       * If there are explicit query tokens,
       * require at least one meaningful match.
       */
      if (rawTokens.length > 0) {
        return (
          item.score >= 10 &&
          item.matchedTokenCount > 0
        );
      }

      /*
       * Concept-only queries can still match
       * through concept synonyms.
       */
      if (
        matchedConcepts.size > 0
      ) {
        return item.score >= 15;
      }

      return item.score >= 10;
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        b.course.rating -
        a.course.rating
      );
    });

  /* -------------------------------------------------------
     Platform preference
  ------------------------------------------------------- */

  const requestedPlatform =
    normText(
      platformFilter
    );

  if (
    requestedPlatform &&
    requestedPlatform !==
      "any"
  ) {
    matches.sort(
      (a, b) => {
        const aPreferred =
          normText(
            a.course.platform
          ) === requestedPlatform;

        const bPreferred =
          normText(
            b.course.platform
          ) === requestedPlatform;

        if (
          aPreferred !==
          bPreferred
        ) {
          return aPreferred
            ? -1
            : 1;
        }

        return (
          b.score -
            a.score ||
          b.course.rating -
            a.course.rating
        );
      }
    );
  }

  return matches.map(
    (item) => item.course
  );
}

/* =========================================================
   SIMILAR COURSES
   ========================================================= */

export function findSimilarCourses(
  courseId: string,
  limit = 5
): CatalogCourse[] {
  const source =
    getCourseById(courseId);

  if (!source) {
    return [];
  }

  const sourceTags =
    new Set(
      source.tags.map(
        (tag) =>
          tag.toLowerCase()
      )
    );

  const scored = allCourses
    .filter(
      (course) =>
        course.id !== courseId
    )
    .map((course) => {
      let score = 0;

      course.tags.forEach(
        (tag) => {
          if (
            sourceTags.has(
              tag.toLowerCase()
            )
          ) {
            score += 3;
          }
        }
      );

      course.skills.forEach(
        (skill) => {
          source.skills.forEach(
            (sourceSkill) => {
              if (
                sourceSkill.toLowerCase() ===
                skill.toLowerCase()
              ) {
                score += 2;
              }
            }
          );
        }
      );

      if (
        course.platform ===
        source.platform
      ) {
        score += 1;
      }

      if (
        course.difficulty ===
        source.difficulty
      ) {
        score += 1;
      }

      score +=
        course.rating * 0.2;

      return {
        course,
        score,
      };
    })
    .filter(
      (item) =>
        item.score > 0
    )
    .sort(
      (a, b) =>
        b.score - a.score
    );

  return scored
    .slice(0, limit)
    .map(
      (item) =>
        item.course
    );
}

/* =========================================================
   SIMPLE TEXT SEARCH
   ========================================================= */

export function searchCatalogByText(
  query: string,
  limit = 20
): CatalogCourse[] {
  return searchAndRankCatalog(
    query,
    "Any"
  ).slice(0, limit);
}