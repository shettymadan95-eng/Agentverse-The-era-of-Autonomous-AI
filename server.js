import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { tools } from "./tools.js";
import { clearScreenDown } from "readline";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());

// setup dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const memoryFile = path.join(__dirname, "memory.json");


app.use(cors());

// Initialize memory if not exists
if (!(await fs.pathExists(memoryFile))) {
  await fs.writeJson(memoryFile, { notes: [] });
}

/* --------------------------
   PLAN ENDPOINT
--------------------------- */
app.post("/api/agent/plan", async (req, res) => {
  const { task } = req.body;
  try {
    const prompt = `
You are an autonomous AI agent.
Given the task: "${task}"
Break it into a clear step-by-step plan.
Respond ONLY as a JSON array of steps.
Example:
["Research topic", "Make a schedule", "Practice daily"]
`;

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature: 0.7,
    });

    const text = completion.output[0].content[0].text;
    let plan;
    try {
      plan = JSON.parse(text);
    } catch {
      plan = text.match(/"(.*?)"/g)?.map(s => s.replace(/"/g, "")) || [];
    }

    res.json({ plan });
  } catch (err) {
    console.error("❌ /plan error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* --------------------------
   EXECUTE ENDPOINT
--------------------------- */
// app.post("/api/agent/execute", async (req, res) => {
//   const { steps, context } = req.body;
//   const memory = await fs.readJson(memoryFile);
//   try {
//     const summaryPrompt = `
// Task: ${context}
// Steps: ${steps.join(", ")}
// Summarize results after executing this plan as if the agent completed it.
// `;

//     const completion = await client.responses.create({
//       model: "gpt-4.1-mini",
//       input: summaryPrompt,
//       temperature: 0.7,
//     });

//     const result = completion.output[0].content[0].text;

//     memory.notes.push({
//       type: "execution",
//       text: result,
//       time: new Date().toISOString(),
//     });

//     await fs.writeJson(memoryFile, memory, { spaces: 2 });

//     res.json({ result });
//   } catch (err) {
//     console.error("❌ /execute error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });
app.post("/api/agent/execute", async (req, res) => {
  const { steps, context } = req.body;
  let memory = await fs.readJson(memoryFile);

  // ✅ Ensure memory.notes exists
  if (!memory.notes || !Array.isArray(memory.notes)) {
    memory = { notes: [] };
  }

  try {
    const summaryPrompt = `
Task: ${context}
Steps: ${steps.join(", ")}
Summarize results after executing this plan as if the agent completed it.
`;

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: summaryPrompt,
      temperature: 0.7,
    });

    const result = completion.output[0].content[0].text;

    // ✅ Safe push
    memory.notes.push({
      type: "execution",
      text: result,
      time: new Date().toISOString(),
    });

    await fs.writeJson(memoryFile, memory, { spaces: 2 });

    res.json({ result });
  } catch (err) {
    console.error("❌ /execute error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* --------------------------
   MEMORY ENDPOINT
--------------------------- */
app.get("/api/agent/memory", async (req, res) => {
  const memory = await fs.readJson(memoryFile);
  res.json({ memory: memory.notes });
});

/* --------------------------
   HEALTH CHECK
--------------------------- */
app.get("/", (req, res) => {
  res.send("✅ Agentverse Backend is running!");
});

/* --------------------------
   START SERVER
--------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});