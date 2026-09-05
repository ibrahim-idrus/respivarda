import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export function hasGemini(): boolean {
  return Boolean(apiKey);
}

export function getGeminiModel() {
  if (!apiKey) throw new Error("GEMINI_API_KEY belum diatur.");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
}
