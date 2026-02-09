import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMe,
  markWaitingForPair,
  createInvite
} from "../lib/store.js";

export default function Partner() {
  const me = getMe();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  function solo() {
    markWaitingForPair();
    navigate("/dashboard");
  }

  function invite() {
    if (!email.trim()) {
      alert("Enter partner email");
      return;
    }
    createInvite(email.trim());
    navigate("/dashboard");
  }

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>Partner setup</h2>

      {me.mode === "solo" ? (
        <>
          <p>You’ll be auto-paired with a similar level player.</p>
          <button onClick={solo} style={button}>
            Join waiting pool
          </button>
        </>
      ) : (
        <>
          <p>Invite your partner to join your team.</p>
          <input
            placeholder="Partner email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />
          <button onClick={invite} style={button}>
            Send invite
          </button>
        </>
      )}
    </div>
  );
}

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 12
};

const button = {
  padding: "10px 14px",
  fontWeight: 700
};
