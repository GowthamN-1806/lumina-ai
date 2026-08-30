import app from "../server";

export default async function handler(req: any, res: any) {
  // Set CORS headers for Vercel Serverless Functions
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key"
  );

  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Delegate POST requests to Express app in server.ts
  if (req.method === "POST") {
    return app(req, res);
  }

  return res.status(405).json({
    success: false,
    error: "Method not allowed. Use POST for /api/tutor.",
  });
}