import React, { useState } from "react";
import "./App.css";
import QuickReplies from "./components/QuickReplies";
import QuestionnaireScreen from "./screens/QuestionnaireScreen";
import MatrixScreen from "./screens/MatrixScreen";
import MatrixEditScreen from "./screens/MatrixEditScreen";

const API_URL = "http://localhost:3001";
// const API_URL = "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev";

const QUESTIONS = [
  {
    id: "overview",
    section: "Project Overview",
    prompt:
      "Describe your technology or project in detail. What does it do? Who is it intended for? What problem does it aim to solve?",
  },
  {
    id: "stakeholders",
    section: "Stakeholders & Context",
    prompt:
      "Who are the primary and secondary stakeholders affected by this technology? Consider individuals, groups, organizations, and broader communities.",
  },
  {
    id: "benefits",
    section: "Beneficence (Positive Impact)",
    prompt:
      "What are the intended benefits of this technology? How does it improve well-being, efficiency, safety, or access for its users?",
  },
  {
    id: "risks",
    section: "Nonmaleficence (Potential Harm)",
    prompt:
      "What potential harms or unintended consequences could arise from this technology? Consider misuse, bias, exclusion, psychological, financial, or physical harm.",
  },
  {
    id: "autonomy",
    section: "Autonomy & Consent",
    prompt:
      "How does your technology respect user autonomy? Are users able to make informed decisions? Can they opt out or control how the system affects them?",
  },
  {
    id: "justice",
    section: "Justice & Fairness)",
    prompt:
      "Could this technology disproportionately impact certain populations? How does it address fairness, accessibility, and equal treatment?",
  },
  {
    id: "privacy",
    section: "Privacy & Data Governance",
    prompt:
      "What data does your system collect, store, or process? How is user privacy protected? Are there safeguards against data misuse or breaches?",
  },
  {
    id: "transparency",
    section: "Transparency & Accountability",
    prompt:
      "How transparent is your system about how it works? Are decisions explainable? Who is accountable if the system causes harm or makes incorrect decisions?",
  },
];

const DEFINITIONS = {
  beneficence:
    "Beneficence: improving the human condition, which demands that exposure to intentional intervention from outside should benefit the object of intervention",
  "non-maleficence":
    "Non-maleficence: being treated as an end, not as a means to an end, which demands that in whatever an actor does to another, they should do no harm",
  trust:
    "Trust: maintaining and increasing the confidence individuals have in each other and in institution",
  justice:
    "Justice: treating all fairly and equally",
  autonomy:
    "Autonomy: respecting and promoting individual agency",
  transparency:
    "Transparency: openly and clearly communicating the intentions, working, and effects of the tools with human impact",
};

function App() {
  const [sessionId] = useState(() => crypto.randomUUID());

  // Chat state machine (backend-driven)
  const [uiState, setUiState] = useState("WELCOME");

  // Screen router (frontend-driven)
  const [screen, setScreen] = useState("CHAT");
  const [result, setResult] = useState(null); 

  const [quickReplies, setQuickReplies] = useState([
    "Start Now!",
    "More Questions?",
  ]);

  // Now this is safe because quickReplies is defined above
  const activeQuickReplies =
  uiState === "WELCOME" ||
  uiState === "WELCOME_QA" ||
  uiState === "DEFINITIONS_INTRO" ||
  uiState === "MATRIX_EXPLAIN"
    ? quickReplies
    : [];  
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: `Welcome!\nHi, I am Athena. I am here to help you decide if your technology is ethically ready to be deployed.
We will review your project together, and using a decision-making matrix, we will determine if the ethical benefits of your technology are greater than its potential negative impacts.
Are you ready? Do you have any questions?`,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [input, setInput] = useState("");

  async function sendMessage(text) {
    if (!text.trim()) return;

    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userMessage: text,
          uiState,
        }),
      });

      const data = await response.json();

      setUiState(data.uiState);

      setMessages((prev) => [...prev, { role: "bot", content: data.botMessage }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Server error — is the backend running?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function saveMatrix({ matrix, overall }) {
     const response = await fetch(`${API_URL}/matrix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        matrix,
        overall,
      }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to save matrix");
    }
  
    return await response.json();
  }

  function handleSendClick() {
    const text = input.trim();
    if (!text) return;
  
    // If user is in the "More Questions" welcome path,
    // respond with the PDF-like guidance and DO NOT call backend.
    if (uiState === "WELCOME_QA") {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: text },
        {
          role: "bot",
          content:
            "Thanks — I’ll note that. For the best evaluation, please hold detailed questions until we finish the questionnaire, then we’ll review them together. When you’re ready, click **Start Now!**",
        },
      ]);
      setInput("");
      return;
    }
  
    // Otherwise use the normal backend chat
    sendMessage(text);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendClick();
    }
  }

  function pushBotDefinition(termKey) {
    const text = DEFINITIONS[termKey];
    if (!text) return;
  
    setMessages((prev) => [...prev, { role: "bot", content: text }]);
  }
  
  function renderMessageContent(msg) {
    // Only special-render the definitions intro message.
    if (msg.type !== "definitions_intro") {
      return msg.content;
    }
  
    // Keywords to make clickable (and how they map to DEFINITIONS keys)
    const terms = [
      { label: "beneficence", key: "beneficence" },
      { label: "non-maleficence", key: "non-maleficence" },
      { label: "trust", key: "trust" },
      { label: "justice", key: "justice" },
      { label: "autonomy", key: "autonomy" },
      { label: "transparency", key: "transparency" },
    ];
  
    // Render the message as parts, with clickable term spans.
    // We'll split around each keyword occurrence in order.
    let remaining = msg.content;
  
    const parts = [];
    for (const t of terms) {
      const idx = remaining.toLowerCase().indexOf(t.label);
      if (idx === -1) continue;
  
      const before = remaining.slice(0, idx);
      const match = remaining.slice(idx, idx + t.label.length);
      const after = remaining.slice(idx + t.label.length);
  
      if (before) parts.push(<span key={`b-${t.key}-${parts.length}`}>{before}</span>);
  
      parts.push(
        <button
          key={`k-${t.key}-${parts.length}`}
          onClick={() => pushBotDefinition(t.key)}
          style={{
            padding: 0,
            margin: 0,
            border: "none",
            background: "transparent",
            textDecoration: "underline",
            cursor: "pointer",
            font: "inherit",
            color: "inherit",
          }}
        >
          {match}
        </button>
      );
  
      remaining = after;
    }
  
    if (remaining) parts.push(<span key={`r-${parts.length}`}>{remaining}</span>);
  
    return <span style={{ whiteSpace: "pre-wrap" }}>{parts}</span>;
  }

  // Only show input if we're on CHAT screen and not in WELCOME
  const showInput = screen === "CHAT" && (uiState === "WELCOME_QA" || uiState === "CHAT");
  return (
    <div style={{ maxWidth: 650, margin: "50px auto", fontFamily: "Arial" }}>
      <h1>Athena Chatbot</h1>

      {/* CHAT SCREEN */}
      {screen === "CHAT" && (
        <>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "20px",
              minHeight: "260px",
            }}
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              const isLast = index === messages.length - 1;
              const isLastBot = isLast && msg.role === "bot";

              return (
                <div
                  key={index}
                  style={{
                    textAlign: isUser ? "right" : "left",
                    margin: "10px 0",
                  }}
                >
                  <span
                    style={{
                      background: isUser ? "#e0e0e0" : "#f0f0ff",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      display: "inline-block",
                      maxWidth: "85%",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {renderMessageContent(msg)}
                  </span>

                  {/* ✅ Quick Replies under the last BOT message */}
                  {isLastBot && (
                    <QuickReplies
                      items={activeQuickReplies}
                      disabled={loading}
                      onPick={(label) => {
                        const normalized = label.trim().toLowerCase();
                      
                        // 1) START EVALUATING → questionnaire
                        if (normalized === "start evaluating!" || normalized === "start evaluating") {
                          setScreen("QUESTIONNAIRE");
                          setQuickReplies([]);
                          setUiState("CHAT"); // optional reset
                          return;
                        }
                      
                        // 2) DEFINE ALL
                        if (normalized === "define all") {
                          const order = [
                            "beneficence",
                            "non-maleficence",
                            "trust",
                            "justice",
                            "autonomy",
                            "transparency",
                          ];
                      
                          setMessages((prev) => [
                            ...prev,
                            ...order.map((k) => ({ role: "bot", content: DEFINITIONS[k] })),
                          ]);
                      
                          setQuickReplies(["Start evaluating!"]);
                          setUiState("MATRIX_EXPLAIN");
                          return;
                        }
                      
                        // 3) START NOW → definitions intro
                        if (normalized === "start now!" || normalized === "start now") {
                          setScreen("CHAT"); // stay on chat UI
                          setUiState("DEFINITIONS_INTRO");
                          setQuickReplies(["Define all"]);
                      
                          setMessages((prev) => [
                            ...prev,
                            {
                              role: "bot",
                              type: "definitions_intro",
                              content:
                                "Great!\n\nLet us start with a bit of background. My role is to explore with you the ethical effects of your technology on its owner or users. We will try to figure out if the technology will have positive or negative effects in terms of six principles: beneficence, non-maleficence, trust, justice, autonomy, and transparency. Do you want me to define one, several, or all of them?",
                            },
                          ]);
                          return;
                        }
                      
                        // 4) MORE QUESTIONS
                        if (normalized === "more questions?" || normalized === "more questions") {
                          setUiState("WELCOME_QA");
                          setQuickReplies(["Start Now!"]);
                          setMessages((prev) => [
                            ...prev,
                            {
                              role: "bot",
                              content:
                                "Sure — feel free to ask your questions now. (We’ll also revisit and summarize them at the end.)",
                            },
                          ]);
                        }
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {showInput && (
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                }}
              />
              <button
                onClick={handleSendClick}
                disabled={loading || !input.trim()}
                style={{ padding: "10px 15px", borderRadius: "10px" }}
              >
                Send
              </button>
            </div>
          )}
        </>
      )}

      {/* QUESTIONNAIRE SCREEN */}
      {screen === "QUESTIONNAIRE" && (
        <div style={{ marginTop: 18 }}>
          {analysisLoading ? (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "30px 20px",
                textAlign: "center",
              }}
            >
              <h2>Analyzing your answers...</h2>
              <p>Please wait while Athena reviews your responses. This may take a few seconds.</p>
              <div
                style={{
                  margin: "20px auto",
                  width: 40,
                  height: 40,
                  border: "5px solid #ccc",
                  borderTop: "5px solid #4a76ff",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          ) : (
            <>
              <QuestionnaireScreen
                questions={QUESTIONS}
                onSaveProgress={(partialAnswers) => {
                  // later: POST /questionnaire/answers
                  console.log("Saved progress:", partialAnswers);
                }}
                onSubmitAll={async (finalAnswers) => {
                  setAnalysisLoading(true);
                  console.log("All answers:", finalAnswers);

                  try {
                    const response = await fetch(`${API_URL}/ai/analyze`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        sessionId,
                        answers: finalAnswers,
                      }),
                    });

                    if (!response.ok) {
                      const txt = await response.text().catch(() => "");
                      throw new Error(`AI proxy error: ${response.status} ${txt}`);
                    }

                    const data = await response.json();
                    setResult(data);
                    setScreen("RESULT");
                  } catch (err) {
                    console.error(err);
                    alert("Backend scoring failed.");
                  } finally {
                    setAnalysisLoading(false);
                  }
                }}
              />

              <button
                onClick={() => setScreen("CHAT")}
                disabled={analysisLoading}
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  background: "#fff",
                  opacity: analysisLoading ? 0.6 : 1,
                }}
              >
                Back to Chat
              </button>
            </>
          )}
        </div>
      )}

      {/* ===================== RESULT SCREEN (placeholder) ===================== */}
      {screen === "RESULT" && result && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginTop: 18,
          }}
        >
          <h2>Ethical Evaluation Result</h2>

          <h3>Overall Index</h3>
          <p>{result.overallIndex}</p>

          <h3>Conclusion</h3>
          <p>{result.conclusion}</p>

          <h3>Response Source</h3>
          <p>{result.source || "unknown"}</p>
          {result.mockReason && (
            <>
              <h3>Mock Reason</h3>
              <p>{result.mockReason}</p>
            </>
          )}

          <h3>Principle Scores</h3>
          <ul>
            {Object.entries(result.matrix.overall).map(([key, value]) => (
              <li key={key}>
                <b>{key}</b>: {value}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setScreen("MATRIX")}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
              }}
            >
              View Full Ethical Matrix
            </button>

            <button
              onClick={() => setScreen("CHAT")}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
              }}
            >
              Return to Dialogue
            </button>
          </div>
        </div>
      )}
      {screen === "MATRIX" && result && (
        <MatrixScreen
          result={result}
          onBack={() => setScreen("RESULT")}
          onEdit={() => setScreen("MATRIX_EDIT")}
        />
      )}
      {screen === "MATRIX_EDIT" && result && (
        <MatrixEditScreen
          result={result}
          onSave={async (updatedResult) => {
            try {
              const savedResult = await saveMatrix({
                overall: updatedResult.matrix.overall,
              });

              setResult(savedResult);
              setScreen("MATRIX");
            } catch (err) {
              console.error(err);
              alert("Failed to save updated matrix.");
            }
          }}
          onCancel={() => setScreen("MATRIX")}
        />
      )}
    </div>
  );
}

export default App;