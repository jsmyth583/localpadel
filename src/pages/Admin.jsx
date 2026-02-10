import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { load, tryAutoPairFriendly, generateWeeklyFixtures } from "../lib/store.js";

const KEY = "padel_mvp_v1"; // must match store.js

export default function Admin() {
  const [refresh, setRefresh] = useState(0);
  const s = useMemo(() => load(), [refresh]);

  function currentWeekIndex(seasonStartISO) {
    const start = new Date(seasonStartISO);
    const now = new Date();
    const diffDays = Math.floor((now - start) / (24 * 3600 * 1000));
    return Math.max(0, Math.floor(diffDays / 7));
  }

  return (
    <div style={{ padding: 20, display: "grid", gap: 12 }}>
      <Link to="/">← Home</Link>

      <h2 style={{ margin: 0 }}>Admin</h2>
      <p style={{ margin: 0, color: "#444" }}>
        Facility: <b>{s.facility.name}</b> · Season: <b>{s.season.name}</b>
      </p>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Actions</h3>

        <button
          style={btn}
          onClick={() => {
            tryAutoPairFriendly();
            setRefresh((x) => x + 1);
          }}
        >
          Run auto-pairing (Friendly)
        </button>

        <button
          style={btn}
          onClick={() => {
            generateWeeklyFixtures({ weekIndex: currentWeekIndex(s.season.starts) });
            setRefresh((x) => x + 1);
          }}
        >
          Generate fixtures for current week
        </button>

        <button
          style={{ ...btn, borderColor: "#b00", color: "#b00" }}
          onClick={() => {
            if (!confirm("Wipe ALL local data and reset the app?")) return;
            localStorage.removeItem(KEY);
            location.href = "#/";
          }}
        >
          Wipe local data (reset)
        </button>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Quick stats</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Users: {s.users.length}</li>
          <li>Pairs: {s.pairs.length}</li>
          <li>Invites: {s.invites.length}</li>
          <li>Matches: {s.matches.length}</li>
        </ul>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Raw data (debug)</h3>
        <pre style={pre}>{JSON.stringify(s, null, 2)}</pre>
      </div>
    </div>
  );
}

const card = { border: "1px solid #ddd", borderRadius: 12, padding: 14 };
const btn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #333",
  fontWeight: 800,
  background: "white",
  marginRight: 10,
  marginBottom: 10,
  cursor: "pointer"
};
const pre = { whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 };
