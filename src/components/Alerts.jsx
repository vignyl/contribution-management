import React from "react";
import { useApp } from "../context/AppContext";
import { C } from "../utils";

export const Alerts = () => {
  const { visibleAlerts, dismissAlert } = useApp();

  if (visibleAlerts.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {visibleAlerts.map((a) => (
        <div
          key={a.key}
          style={{
            background: `${a.t === "danger" ? C.danger : a.t === "warn" ? C.warn : C.blue}18`,
            border: `1px solid ${a.t === "danger" ? C.danger : a.t === "warn" ? C.warn : C.blue}44`,
            borderRadius: 10,
            padding: "9px 14px",
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
          }}
        >
          <span>{a.t === "danger" ? "🚨" : a.t === "warn" ? "⚠️" : "ℹ️"}</span>
          <span style={{ flex: 1 }}>{a.msg}</span>
          {a.amt && <strong style={{ color: C.accent }}>{a.amt}</strong>}
          <button
            onClick={() => dismissAlert(a.key)}
            style={{
              background: "none",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              fontSize: 17,
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
