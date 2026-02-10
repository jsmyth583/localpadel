import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createUser, signInAs } from "../lib/store.js";

export default function Signup() {
  const { leagueType } = useParams();
  const navigate = useNavigate();

  const league = leagueType === "competitive" ? "competitive" : "friendly";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit() {
    if (!name.trim() || !email.trim()) return alert("Enter name and email");

    const user = createUser({
      name: name.trim(),
      email: email.trim(),
      leagueType: league
    });

    signInAs(user.id);
    navigate("/profile");
  }

  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <h2>Sign up — {league}</h2>

      <label style={lbl}>Name</label>
      <input style={inp} value={name} onChange={(e) => setName(e.target.value)} />

      <label style={lbl}>Email</label>
      <input style={inp} value={email} onChange={(e) => setEmail(e.target.value)} />

      <button style={btn} onClick={submit}>Create account</button>
    </div>
  );
}

const lbl = { display: "block", marginTop: 10, marginBottom: 6, fontWeight: 700 };
const inp = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" };
const btn = { marginTop: 14, padding: "10px 12px", borderRadius: 10, border: "1px solid #333", fontWeight: 800, background: "white" };
