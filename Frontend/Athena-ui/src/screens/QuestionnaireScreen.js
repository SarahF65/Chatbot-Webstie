import React, { useState } from "react";

export default function QuestionnaireScreen({
  questions,
  onSubmitAll,
  onSaveProgress,
}) {
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState({});

  const q = questions[idx];
  const total = questions.length;
  const pct = Math.round(((idx + 1) / total) * 100);

  function handleSubmit() {
    if (!draft.trim()) return;
    const next = { ...answers, [q.id]: draft.trim() };
    setAnswers(next);
    setDraft("");

    onSaveProgress?.(next);

    if (idx === total - 1) onSubmitAll(next);
    else setIdx(idx + 1);
  }

  return (
    <div className="card">
      <div className="qHeader">
        <div className="qTitle">{q.section}</div>
        <div className="qMeta">Question: {idx + 1} of {total} / {pct}% Completed</div>
        <div className="progressOuter">
          <div className="progressInner" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="qPrompt">{q.prompt}</div>

      <textarea
        className="qBox"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Type your answer..."
      />

      <div className="qFooter">
        <div className="muted">{draft.length} characters</div>
        <button className="btnPrimary" onClick={handleSubmit} disabled={!draft.trim()}>
          Submit
        </button>
      </div>
    </div>
  );
}