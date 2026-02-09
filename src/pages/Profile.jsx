import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, updateUser, load } from "../lib/store.js";

export default function Profile() {
  const navigate = useNavigate();
  const s = load();
  const me = getMe();

  const [level, setLevel] = useState(me?.level ?? 5);
  const [availability, setAvailability] = useState(me?.availability ?? "both");

  function submit() {
    const lv = Math.max(1, Math.min(10, Number(level)));

    updateUser(me.id, {
      level: lv,
      availability,
      rating: lv * 100,
      status: "needs_partner"
    });

    navigate("/partner");
  }

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h2>Your details</h2>
      <p style={{ color: "#444" }}>
        League: <b>{me.leagueType}</b> · Facility: <b>{s.facility.name}, {s.facility.town}</b>
      </p>

      <label style={lbl}>Playing level (1–10)</label>
      <input
        style={inp}
        type="number"
        min={1}
        max={10}
        value={level}
        onChange={(e) => setLevel(e.target.value)}
      />

      <label style={lbl}>Availability</label>
      <select style={inp} value={availability} onChange={(e) => setAvailability(e.target.value)}>
        <option value="weeknights">Weeknights</option>
        <option value="weekends">Weekends</option>
        <option value="both">Both</option>
      </select>

      <button style={btn} onClick={submit}>
        Continue
      </button>
    </div>
  );
}

const lbl = { display: "block", marginTop: 10, marginBottom: 6, fontWeight: 700 };
const inp = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" };
const btn = { marginTop: 14, padding: "10px 12px", borderRadius: 10, border: "1px solid #333", fontWeight: 800 };
