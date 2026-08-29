import axios from "axios";
import { 
  RecommendationQuery, 
  RecommendationResponse, 
  StudyNotesResponse, 
  QuizResponse, 
  InterviewResponse,
  Course,
} from "../types";

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

export async function getRecommendations(query: RecommendationQuery, signal?: AbortSignal): Promise<RecommendationResponse> {
  const response = await axios.post<RecommendationResponse>("/api/recommend", query, {
    headers: getHeaders(),
    timeout: 30000, // 30 seconds Axios client-side timeout
    signal,
  });
  return response.data;
}

export async function getCourseById(courseId: string): Promise<Course> {
  const response = await axios.get<Course>(`/api/catalog/courses/${courseId}`, {
    headers: getHeaders(),
  });
  return response.data;
}

export async function getSimilarCourses(courseId: string, limit = 8): Promise<Course[]> {
  const response = await axios.get<{ courses: Course[] }>(
    `/api/catalog/courses/${courseId}/similar?limit=${limit}`,
    { headers: getHeaders() }
  );
  return response.data.courses;
}

export interface StudyNotesRequestOptions {
  regenerate?: boolean;
  iteration?: number;
  seed?: number;
}

export async function generateStudyNotes(learningGoal: string, options?: StudyNotesRequestOptions): Promise<StudyNotesResponse> {
  const response = await axios.post<StudyNotesResponse>("/api/notes", { 
    learningGoal,
    ...options
  }, {
    headers: getHeaders(),
  });
  return response.data;
}

export async function generateQuiz(learningGoal: string, skillLevel: string): Promise<QuizResponse> {
  const response = await axios.post<QuizResponse>("/api/quiz", { learningGoal, skillLevel }, {
    headers: getHeaders(),
  });
  return response.data;
}

export async function generateInterviewPrep(learningGoal: string, skillLevel: string): Promise<InterviewResponse> {
  const response = await axios.post<InterviewResponse>("/api/interview", { learningGoal, skillLevel }, {
    headers: getHeaders(),
  });
  return response.data;
}

export interface CourseNotesRequest {
  courseName: string;
  platform: string;
  courseDescription: string;
  difficulty: string;
  roadmap: any[];
  skillsCovered: string[];
  regenerate?: boolean;
  iteration?: number;
  seed?: number;
}

export interface CourseQuizRequest extends CourseNotesRequest {
  skillLevel: string;
}

export async function generateCourseNotes(req: CourseNotesRequest): Promise<StudyNotesResponse> {
  const response = await axios.post<StudyNotesResponse>("/api/course-notes", req, {
    headers: getHeaders(),
  });
  return response.data;
}

export async function generateCourseQuiz(req: CourseQuizRequest): Promise<QuizResponse> {
  const response = await axios.post<QuizResponse>("/api/course-quiz", req, {
    headers: getHeaders(),
  });
  return response.data;
}

export async function generateCourseInterview(req: CourseNotesRequest): Promise<InterviewResponse> {
  const response = await axios.post<InterviewResponse>("/api/course-interview", req, {
    headers: getHeaders(),
  });
  return response.data;
}

export interface CourseRevisionResponse {
  revision: string;
}

export async function generateCourseRevision(req: CourseNotesRequest): Promise<CourseRevisionResponse> {
  const response = await axios.post<CourseRevisionResponse>("/api/course-revision", req, {
    headers: getHeaders(),
  });
  return response.data;
}

export interface TutorMessage {
  role: "user" | "model";
  text: string;
}

export interface TutorRequest {
  messages: TutorMessage[];
  context: {
    learningGoal?: string;
    courseName?: string;
    courseDescription?: string;
    platform?: string;
    difficulty?: string;
    skillLevel?: string;
    studyTime?: string;
    completionTarget?: string;
    roadmap?: any[];
    generatedNotes?: string | null;
    generatedQuiz?: any[] | null;
    generatedInterview?: any | null;
    generatedRevision?: string | null;
  };
  message: string;
}

export interface TutorResponse {
  text: string;
}

export async function askTutor(req: TutorRequest): Promise<TutorResponse> {
  const response = await axios.post<TutorResponse>("/api/tutor", req, {
    headers: getHeaders(),
  });
  return response.data;
}

export function askTutorStream(
  req: TutorRequest,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: any) => void,
  signal?: AbortSignal
): void {
  fetch("/api/tutor", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(req),
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response stream is not readable");
      }

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith("data: ")) {
            const dataStr = cleanLine.substring(6).trim();
            if (dataStr === "[DONE]") {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                onChunk(parsed.text);
              }
            } catch (e: any) {
              if (e.message && e.message.includes("Streaming interrupted")) {
                throw e;
              }
              // Ignore standard JSON parsing issues for broken/split lines
            }
          }
        }
      }

      onDone();
    })
    .catch((err) => {
      if (err.name === "AbortError" || (signal && signal.aborted)) {
        return; // User intentionally stopped the generation
      }
      onError(err);
    });
}



