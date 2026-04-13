import React, { useState } from "react";

const PRINCIPLES = [
  "beneficence",
  "non-maleficence",
  "trust",
  "justice",
  "autonomy",
  "transparency",
];

const CONTEXTS = [
  "individual",
  "interpersonal",
  "scientific",
  "business",
  "civic-political",
];

function getScoreLabel(score) {
  if (score === undefined || score === null) return "N/A";
  if (score <= -2) return "High Risk";
  if (score === -1) return "Moderate Risk";
  if (score === 0) return "Neutral";
  if (score === 1) return "Moderate Benefit";
  if (score >= 2) return "High Benefit";
  return String(score);
}

function getBarWidth(score) {
  if (score === undefined || score === null) return "0%";
  return `${((score + 3) / 6) * 100}%`;
}

export default function MatrixScreen({ result, onBack , onEdit}) {
  const [view, setView] = useState("overall");

  if (!result || !result.matrix) {
    return <div>No matrix data available.</div>;
  }

  const currentData =
    view === "overall"
      ? result.matrix.overall
      : result.matrix.contexts?.[view] || {};

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <h2>Ethical Matrix</h2>

      <div style={{ marginBottom: 16 }}>
        <button
          className="btnPrimary"
          onClick={() => setView("overall")}
          style={{ marginRight: 8 }}
        >
          Overall
        </button>

        {CONTEXTS.map((context) => (
          <button
            key={context}
            onClick={() => setView(context)}
            style={{
              marginRight: 8,
              marginBottom: 8,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: view === context ? "#e8f0fe" : "#fff",
              cursor: "pointer",
            }}
          >
            {context}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Current View:</strong> {view}
      </div>

      <div>
        {PRINCIPLES.map((principle) => {
          const score = currentData[principle];

          return (
            <div key={principle} style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontWeight: 600 }}>{principle}</span>
                <span>
                  {score !== undefined ? score : "N/A"} — {getScoreLabel(score)}
                </span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: 14,
                  background: "#eee",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: getBarWidth(score),
                    height: "100%",
                    background: "#7aa7ff",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
            onClick={onBack}
            style={{
            padding: "10px 14px",
            borderRadius: 10,
            }}
        >
            Back
        </button>

        <button
            onClick={() => onEdit()}
            style={{
            padding: "10px 14px",
            borderRadius: 10,
            }}
        >
            Edit Matrix
        </button>
        </div>
    </div>
  );
}