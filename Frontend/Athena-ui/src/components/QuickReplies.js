// src/components/QuickReplies.js
import React from "react";

export default function QuickReplies({ items = [], disabled, onPick }) {
  if (!items.length) return null;

  return (
    <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
      {items.map((label) => {
        const isPrimary = /start/i.test(label); // "Start Now!" becomes primary
        return (
          <button
            key={label}
            onClick={() => onPick(label)}
            disabled={disabled}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: isPrimary ? "none" : "1px solid #ccc",
              background: isPrimary ? "#2e7d32" : "#fff",
              color: isPrimary ? "#fff" : "#111",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}