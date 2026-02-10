import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  load,
  getMe,
  tryAutoPairFriendly,
  acceptInvite,
  generateWeeklyFixtures
} from "../lib/store.js";

export default function Dashboard() {
  const [s, setS] = useState(load());
  const me = getMe();

  useEffect(() => {
    setS(load());
  }, []);

  if (!me) {
    return <p>No active user</p>;
  }

  const myInvites = s.invites.filter(
    (i) => i.partnerEmail === me.email && !i.accepted
  );

  function runPairing() {
    tryAutoPairFriendly();
    setS(load());
  }

  function accept(code) {
    acceptInvite(code);
    setS(load());
  }

  function genFixtures() {
    generateWeeklyFixtures();
    setS(load());
  }

  const myMatches = s.matches.filter(
    (m) => m.pairA.includes(me.id) || m.pairB.includes(me.id)
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      <p>
        Status: <b>{me.status}</b>
      </p>

      {me.status === "waiting_for_pair" && (
        <>
          <p>You’re in the waiting pool.</p>
          <button onClick={runPairing}>Run auto-pairing</button>
        </>
      )}

      {me.status === "waiting_for_partner" && (
        <p>Waiting for your partner to accept the invite.</p>
      )}

      {myInvites.length > 0 && (
        <>
          <h3>Invites</h3>
          {myInvites.map((i) => (
            <div key={i.code}>
              Invite code: <b>{i.code}</b>
              <button onClick={() => accept(i.code)}>Accept</button>
            </div>
          ))}
        </>
      )}

      {me.pairId && (
        <>
          <h3>Your matches</h3>

          <button onClick={genFixtures}>
            Generate this week’s fixtures
          </button>

          {myMatches.length === 0 && <p>No matches yet.</p>}

          {myMatches.map((m) => (
            <div
              key={m.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 10,
                marginTop: 10
              }}
            >
              <div>
                <b>{m.week}</b>
              </div>
              <div>
                Pair A vs Pair B
              </div>
              <Link to={`/match/${m.id}`}>Open match</Link>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
