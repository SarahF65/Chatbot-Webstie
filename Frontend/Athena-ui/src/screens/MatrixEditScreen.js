import React, { useState } from "react";

const PRINCIPLES = [
  "beneficence",
  "non-maleficence",
  "trust",
  "justice",
  "autonomy",
  "transparency",
];

export default function MatrixEditScreen({ result, onSave, onCancel }) {
  const [editedOverall, setEditedOverall] = useState(
    result?.matrix?.overall || {}
  );

  function handleChange(principle, value) {
    setEditedOverall((prev) => ({
      ...prev,
      [principle]: Number(value),
    }));
  }

  function handleSave() {
    const updatedResult = {
      ...result,
      matrix: {
        ...result.matrix,
        overall: editedOverall,
      },
    };

    onSave(updatedResult);
  }

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "10px",
        padding: "20px",
        marginTop: 18,
      }}
    >
      <h2>Edit Overall Matrix</h2>
      <p>Adjust each principle score from -3 to +3.</p>

      {PRINCIPLES.map((principle) => (
        <div key={principle} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <strong>{principle}</strong>
            <span>{editedOverall[principle]}</span>
          </div>

          <input
            type="range"
            min="-3"
            max="3"
            step="1"
            value={editedOverall[principle] ?? 0}
            onChange={(e) => handleChange(principle, e.target.value)}
            style={{ width: "100%" }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#666",
              marginTop: 4,
            }}
          >
            <span>-3</span>
            <span>0</span>
            <span>+3</span>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleSave}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
          }}
        >
          Save Changes
        </button>

        <button
          onClick={onCancel}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}