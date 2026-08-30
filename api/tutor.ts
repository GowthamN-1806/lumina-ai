import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { message, course, conversationHistory } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is not configured",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const courseTitle =
      course?.title ||
      course?.name ||
      course?.courseName ||
      "General Learning";

    const history = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-10)
      : [];

    const contents = [
      ...history
        .filter((msg: any) => msg?.text)
        .map((msg: any) => ({
          role: msg.role === "model" ? "model" : "user",
          parts: [{ text: String(msg.text) }],
        })),

      {
        role: "user",
        parts: [
          {
            text: `
You are Lumina AI Tutor.

Current course: ${courseTitle}

Help the student understand the topic clearly.
Give accurate explanations and examples.
Stay relevant to the student's question.

Student question:
${message.trim()}
`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        temperature: 0.7,
      },
    });

    return res.status(200).json({
      success: true,
      text: response.text || "",
    });
  } catch (error: any) {
    console.error("[Vercel Tutor Error]", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Gemini request failed",
    });
  }
}