import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, saveProfile } from "../lib/store.js";

export default function Profile() {
  const navigate = useNavigate();
  const me = getMe();

  const [level, setLevel] = useState(me?.level || 5);
  const [mode, setMode] = useState(me?.mode || "solo");

  function submit() {
    saveProfile({
      level: Number(level),
      mode
    });
    navigate("/partner");
  }

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>Your profile</h2>

      <label>Playing level (1–10)</label>
      <input
        type="number"
        min="1"
        max="10"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        style={input}
      />

      <div style={{ marginTop: 16 }}>
        <label>
          <input
            type="radio"
            checked={mode === "solo"}
            onChange={() => setMode("solo")}
          />
          Join solo (auto-pair)
        </label>
        <br />
        <label>
          <input
            type="radio"
            checked={mode === "partner"}
            onChange={() => setMode("partner")}
          />
          I already have a partner
        </label>
      </div>

      <button onClick={submit} style={button}>
        Continue
      </button>
    </div>
  );
}

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 12
};

const button = {
  marginTop: 20,
  padding: "10px 14px",
  fontWeight: 700
};
