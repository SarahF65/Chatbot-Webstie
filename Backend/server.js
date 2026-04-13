require('dotenv').config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

app = express();
PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

sessions = {};

QUESTIONS = [
  { id: "overview", section: "Project Overview", prompt: "Describe your technology or project in detail. What does it do? Who is it intended for? What problem does it aim to solve?" },
  { id: "stakeholders", section: "Stakeholders & Context", prompt: "Who are the primary and secondary stakeholders affected by this technology? Consider individuals, groups, organizations, and broader communities." },
  { id: "benefits", section: "Beneficence (Positive Impact)", prompt: "What are the intended benefits of this technology? How does it improve well-being, efficiency, safety, or access for its users?" },
  { id: "risks", section: "Nonmaleficence (Potential Harm)", prompt: "What potential harms or unintended consequences could arise from this technology? Consider misuse, bias, exclusion, psychological, financial, or physical harm." },
  { id: "autonomy", section: "Autonomy & Consent", prompt: "How does your technology respect user autonomy? Are users able to make informed decisions? Can they opt out or control how the system affects them?" },
  { id: "justice", section: "Justice & Fairness", prompt: "Could this technology disproportionately impact certain populations? How does it address fairness, accessibility, and equal treatment?" },
  { id: "privacy", section: "Privacy & Data Governance", prompt: "What data does your system collect, store, or process? How is user privacy protected? Are there safeguards against data misuse or breaches?" },
  { id: "transparency", section: "Transparency & Accountability", prompt: "How transparent is your system about how it works? Are decisions explainable? Who is accountable if the system causes harm or makes incorrect decisions?" },
];

function buildResultFromMatrix(matrix) {
  const overall = {};
  for (const [principle, contexts] of Object.entries(matrix)) {
    overall[principle] = Object.values(contexts).reduce((s, v) => s + Number(v || 0), 0);
  }
  const overallIndex = Object.values(overall).reduce((s, v) => s + v, 0);
  let conclusion = overallIndex >= 12 ? "Ethically Ready" : overallIndex >= 0 ? "Needs Review" : "Not Ready";
  return { overallIndex, conclusion, matrix: { overall, details: matrix } };
}

function buildMockResult(answers = {}) {
  const matrixDetails = {
    beneficence: { individual: 1, interpersonal: 1, scientific: 0, business: 0, "civic-political": 0 },
    "non-maleficence": { individual: 0, interpersonal: 0, scientific: 0, business: 0, "civic-political": 0 },
    trust: { individual: 0, interpersonal: 0, scientific: 0, business: 0, "civic-political": 0 },
    justice: { individual: 0, interpersonal: 0, scientific: 0, business: 0, "civic-political": 0 },
    autonomy: { individual: 0, interpersonal: 0, scientific: 0, business: 0, "civic-political": 0 },
    transparency: { individual: 0, interpersonal: 0, scientific: 0, business: 0, "civic-political": 0 },
  };
  const result = buildResultFromMatrix(matrixDetails);
  return { ...result, receivedAnswers: answers, source: "mock" };
}

function tryParseJSONFromText(text) {
  if (!text || typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }
  return null;
}

app.get("/", (req, res) => res.json({ ok: true, message: "Athena backend running." }));
app.get("/questions", (req, res) => res.json({ questions: QUESTIONS }));
app.get("/session/:sessionId", (req, res) => res.json(sessions[req.params.sessionId] || null));

app.post("/chat", (req, res) => {
  const { sessionId, userMessage, uiState } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
  if (!sessions[sessionId]) sessions[sessionId] = { uiState: "WELCOME", messages: [], answers: {}, result: null, matrix: null };
  sessions[sessionId].messages.push({ role: "user", content: userMessage, timestamp: Date.now() });
  if (uiState === "WELCOME") {
    const text = (userMessage || "").toLowerCase();
    if (text.includes("more questions")) return res.json({ uiState: "WELCOME_QA", botMessage: "Ask your questions; we will summarize later.", quickReplies: ["Start Now!"] });
    if (text.includes("start now")) return res.json({ uiState: "DEFINITIONS_INTRO", botMessage: "Intro about principles. Click Start evaluating!", quickReplies: ["Start evaluating!"] });
  }
  return res.json({ uiState: uiState || "WELCOME", botMessage: "I’m ready to continue.", quickReplies: [] });
});

app.post("/questionnaire/save", (req, res) => {
  const { sessionId, answers } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
  if (!sessions[sessionId]) sessions[sessionId] = { uiState: "WELCOME", messages: [], answers: {}, result: null, matrix: null };
  sessions[sessionId].answers = { ...sessions[sessionId].answers, ...(answers || {}) };
  res.json({ ok: true });
});

app.post("/score", (req, res) => {
  const { sessionId, answers } = req.body;
  if (!sessionId || !answers) return res.status(400).json({ error: "sessionId and answers are required" });
  if (!sessions[sessionId]) sessions[sessionId] = { uiState: "WELCOME", messages: [], answers: {}, result: null, matrix: null };
  const result = buildMockResult(answers);
  sessions[sessionId].answers = answers;
  sessions[sessionId].result = result;
  sessions[sessionId].matrix = result.matrix.details;
  res.json(result);
});

app.post("/matrix", (req, res) => {
  const { sessionId, matrix, overall } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
  if (!sessions[sessionId]) sessions[sessionId] = { uiState: "WELCOME", messages: [], answers: {}, result: null, matrix: null };
  if (matrix) {
    const updated = buildResultFromMatrix(matrix);
    sessions[sessionId].matrix = matrix;
    sessions[sessionId].result = updated;
    return res.json(updated);
  }
  if (overall) {
    const overallIndex = Object.values(overall).reduce((sum, v) => sum + Number(v || 0), 0);
    const conclusion = overallIndex >= 12 ? "Ethically Ready" : overallIndex >= 0 ? "Needs Review" : "Not Ready";
    const previousDetails = sessions[sessionId].result?.matrix?.details || sessions[sessionId].matrix || null;
    const updatedResult = { ...sessions[sessionId].result, overallIndex, conclusion, matrix: { overall, details: previousDetails } };
    sessions[sessionId].result = updatedResult;
    return res.json(updatedResult);
  }
  res.status(400).json({ error: "Either matrix or overall must be provided" });
});

app.post("/ai/analyze", async (req, res) => {
  const { sessionId, answers } = req.body;
  if (!sessionId || !answers) return res.status(400).json({ error: "sessionId and answers required" });
  if (!sessions[sessionId]) sessions[sessionId] = { uiState: "WELCOME", messages: [], answers: {}, result: null, matrix: null };
  sessions[sessionId].answers = answers;

  const answersText = Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join("\n\n");
  const systemPrompt = `You are Athena, an ethics assistant. Analyze the questionnaire answers and return valid JSON only with keys:
{"overallIndex": <number 0-100>, "conclusion": <string>, "matrix": {"overall": {"beneficence": <int -3..3>,"non-maleficence": <int -3..3>,"trust": <int -3..3>,"justice": <int -3..3>,"autonomy": <int -3..3>,"transparency": <int -3..3>}, "details": {}} }`;

  if (!process.env.OPENAI_API_KEY) {
    const fallback = buildMockResult(answers);
    fallback.mockReason = "no_api_key";
    sessions[sessionId].result = fallback;
    sessions[sessionId].matrix = fallback.matrix.details;
    return res.json(fallback);
  }

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Questionnaire answers:\n\n${answersText}` },
    ];

    const aiResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.0,
      max_tokens: 800,
    });

    const reply = aiResp?.choices?.[0]?.message?.content?.trim() || "";
    let parsed = tryParseJSONFromText(reply);
    if (!parsed) {
      parsed = buildMockResult(answers);
      parsed.mockReason = "openai_parse_failed";
    }
    if (!parsed.source) parsed.source = "openai";

    sessions[sessionId].result = parsed;
    sessions[sessionId].matrix = parsed?.matrix?.details || parsed?.matrix?.overall || null;
    res.json(parsed);
  } catch (err) {
    const fallback = buildMockResult(answers);
    fallback.mockReason = `openai_error: ${err?.message || "unknown"}`;
    sessions[sessionId].result = fallback;
    sessions[sessionId].matrix = fallback.matrix.details;
    res.json(fallback);
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
