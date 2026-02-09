import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createUser, signInAs } from "../lib/store.js";

export default function Signup() {
  const { leagueType } = useParams();
  const navigate = useNavigate();

  const league =
    leagueType === "competitive" ? "competitive" : "friendly";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit() {
    if (!name.trim() || !email.trim()) {
      alert("Please enter name and email");
      return;
    }

    const user = createUser({
      name: name.trim(),
      email: email.trim(),
      leagueType: league
    });

    signInAs(user.id);
    navigate("/profile");
  }

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>Sign up – {league}</h2>

      <label>Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={input}
      />

      <label>Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={input}
      />

      <button onClick={submit} style={button}>
        Create account
      </button>
    </div>
  );
}

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 12,
  borderRadius: 6,
  border: "1px solid #ccc"
};

const button = {
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer"
};
