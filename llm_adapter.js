/**
 * llm_adapter.js
 * Provides generatePlanWithLLM(task, options) -> returns array of steps.
 * - If LLM env vars present, it will call them via fetch.
 * - Otherwise it returns a fallback heuristic plan via options.fallback.
 *
 * Environment:
 *   LLM_API_URL  - endpoint
 *   LLM_API_KEY  - key
 *
 * The adapter is intentionally simple: it sends a prompt and expects a text list back.
 * Replace the fetch code with the exact provider shape you need (OpenAI, Anthropic, etc.)
 */

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LLM_API_URL = process.env.LLM_API_URL || "";
const LLM_API_KEY = process.env.LLM_API_KEY || "";

async function callLLMAPI(prompt) {
  if (!LLM_API_URL) throw new Error("LLM_API_URL not set");

  // Generic POST - adapt to your provider's payload
  const payload = {
    prompt,
    max_tokens: 400,
    temperature: 0.6
  };

  const resp = await fetch(LLM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: LLM_API_KEY ? Bearer ${LLM_API_KEY} : ""
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error("LLM API error: " + resp.status + " - " + txt);
  }
  const data = await resp.json();
  // Try to extract text content in common shapes:
  // adapt below to fit your provider
  if (typeof data === "string") return data;
  if (data.choices && data.choices[0] && data.choices[0].text) return data.choices[0].text;
  if (data.output && data.output[0] && data.output[0].content) return data.output[0].content;
  if (data.result) return data.result;
  return JSON.stringify(data);
}

export async function generatePlanWithLLM(task, options = {}) {
  const fallback = options.fallback || (() => ([Fallback plan for: ${task}]));
  if (!LLM_API_URL) {
    // no LLM configured
    return fallback(task);
  }

  const prompt = `
You are an intelligent agent planner. The user asks: "${task}"
Produce a short ordered plan as a plain numbered list (each step one line). Include any clarifying questions if needed.
Return only the list lines, without commentary.
`;

  try {
    const reply = await callLLMAPI(prompt);
    // parse lines into array
    const lines = reply.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => l.replace(/^\d+[\).\s]*/, ""));
    if (lines.length === 0) return fallback(task);
    return lines;
  } catch (err) {
    console.error("LLM adapter error:", err);
    return fallback(task);
  }
}