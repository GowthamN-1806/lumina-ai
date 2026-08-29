import type { Platform } from "../types/catalog.ts";

const PLATFORM_SEARCH_URLS: Record<string, (query: string) => string> = {
  Coursera: (q) => `https://www.coursera.org/search?query=${encodeURIComponent(q)}`,
  Udemy: (q) => `https://www.udemy.com/courses/search/?q=${encodeURIComponent(q)}`,
  YouTube: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  freeCodeCamp: (q) =>
    `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(q)}`,
  NPTEL: (q) => `https://nptel.ac.in/courses?search=${encodeURIComponent(q)}`,
  "MIT OCW": (q) => `https://ocw.mit.edu/search/?q=${encodeURIComponent(q)}`,
  edX: (q) => `https://www.edx.org/search?q=${encodeURIComponent(q)}`,
  "Infosys Springboard": (q) =>
    `https://infyspringboard.onwingspan.com/web/en/search?searchWords=${encodeURIComponent(q)}`,
};

export function getPlatformSearchUrl(platform: string, learningGoal: string): string {
  const builder = PLATFORM_SEARCH_URLS[platform];
  if (builder) {
    return builder(learningGoal);
  }
  return `https://www.coursera.org/search?query=${encodeURIComponent(learningGoal)}`;
}

export function normalizePlatformName(platform: string): Platform | "Any" {
  const p = platform.trim().toLowerCase();
  if (!p || p === "any" || p.includes("any platform")) return "Any";
  if (p.includes("coursera")) return "Coursera";
  if (p.includes("udemy")) return "Udemy";
  if (p.includes("youtube")) return "YouTube";
  if (p.includes("freecodecamp") || p.includes("free code camp")) return "freeCodeCamp";
  if (p.includes("nptel")) return "NPTEL";
  if (p.includes("mit")) return "MIT OCW";
  if (p.includes("edx")) return "edX";
  if (p.includes("infosys") || p.includes("springboard")) return "Infosys Springboard";
  return "Any";
}

export function isFreePlatform(platform: string): boolean {
  const freePlatforms = ["youtube", "freecodecamp", "nptel", "mit ocw", "infosys springboard"];
  return freePlatforms.some((fp) => platform.toLowerCase().includes(fp));
}
