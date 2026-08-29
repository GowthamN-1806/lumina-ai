import { initCatalog, getCourseById, findSimilarCourses } from "../services/catalogService.ts";
import { extractIntentFromForm } from "../services/intentService.ts";
import { recommendCourses, catalogCourseToFrontend } from "../services/recommendationService.ts";

initCatalog();

const intent = extractIntentFromForm({
  learningGoal: "Python",
  skillLevel: "Beginner",
  platform: "Coursera",
  budget: "Free Only",
  studyTime: "1 hour/day",
});

const courses = recommendCourses(intent, 5);
console.log("Python top 5:");
courses.forEach((c) => console.log(` - ${c.platform}: ${c.name} -> ${c.enrollUrl}`));

const reactCourses = recommendCourses(
  extractIntentFromForm({ learningGoal: "React", skillLevel: "Intermediate", platform: "Any", budget: "Both" }),
  5
);
console.log("\nReact top 5:", reactCourses.map((c) => c.name));

const similar = findSimilarCourses("coursera-python-everybody", 5).map(catalogCourseToFrontend);
console.log("\nSimilar to Python Everybody:", similar.map((s) => s.name));

console.log("\nCatalog getById OK:", !!getCourseById("coursera-python-everybody"));
