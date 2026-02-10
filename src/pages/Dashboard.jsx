import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  load,
  getMe,
  tryAutoPairFriendly,
  acceptInvite,
  generateWeeklyFixtures,
  signOut
} from "../lib/store.js";

export default function Dashboard() {
  const [refresh, setRefresh] = useState(0);
  const s = useMemo(() => load(), [refresh]);
  const me = useMemo(() => getMe(), [refresh]);

  if (!me) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Dashboard</h2>
        <p>No active user session.</p>
        <Link to="/">Go Home</Link>
      </div>
    );
  }

  const myPair = me.pairId ? s.pairs.find((p) => p.id === me.pairId) : null;

  const myInvites = s.invites.filter(
    (i) => i.partnerEmail.toLowerCase() === me.email.toLowerCase() && !i.acceptedByUserId
  );

  const myMatches = myPair
    ? s.matches
        .filter((m) => m.pairAId === myPair.id || m.pairBId === myPair.id)
        .sort((a, b) => b.weekIndex - a.weekIndex)
    : [];

  function currentWeekIndex(seasonStartISO) {
    const start = new Date(seasonStartISO);
    const now = new Date();
    const diffDays = Math.floor((now - start) / (24 * 3600 * 1000));
    return Math.max(0, Math.floor(diffDays / 7));
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => {
            signOut();
            location.href = "#/";
          }}
        >
          Sign out
        </button>
      </div>

      <p>
        <b>{me.name}</b> · {me.email}
        <br />
        League: <b>{me.leagueType}</b> · Status: <b>{me.status}</b>
      </p>

      {!myPair && me.leagueType === "friendly" && me.status === "waiting_for_pair" && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Waiting pool</h3>
          <p style={{ color: "#444" }}>
            You’re in the Friendly solo pool. Click to run auto-pairing.
          </p>
          <button
            onClick={() => {
              tryAutoPairFriendly();
              setRefresh((x) => x + 1);
            }}
          >
            Run auto-pairing now
          </button>
        </div>
      )}

      {myInvites.length > 0 && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Invites for you</h3>
          {myInvites.map((i) => (
            <div key={i.code} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <div>Invite code: <b>{i.code}</b></div>
              <button
                onClick={() => {
                  try {
                    acceptInvite({ code: i.code, accepterUserId: me.id });
                    setRefresh((x) => x + 1);
                  } catch (e) {
                    alert(e.message);
                  }
                }}
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {myPair ? (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Your pair</h3>
          <div>Pair ID: <b>{myPair.id}</b></div>
          <div>Captain: <b>{myPair.captainUserId === me.id ? "You" : "Partner"}</b></div>

          <hr style={{ margin: "14px 0" }} />

          <h3 style={{ marginTop: 0 }}>Matches</h3>
          <button
            onClick={() => {
              generateWeeklyFixtures({ weekIndex: currentWeekIndex(s.season.starts) });
              setRefresh((x) => x + 1);
            }}
          >
            Generate this week’s fixtures
          </button>

          {myMatches.length === 0 ? (
            <p style={{ color: "#666" }}>No matches yet.</p>
          ) : (
            <ul>
              {myMatches.map((m) => (
                <li key={m.id}>
                  Week {m.weekIndex + 1} — <b>{m.status}</b> —{" "}
                  <Link to={`/match/${m.id}`}>Open match</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Not paired yet</h3>
          <p style={{ margin: 0, color: "#444" }}>
            Complete Profile → Partner setup to get paired.
          </p>
          <p style={{ marginBottom: 0 }}>
            <Link to="/profile">Go to Profile</Link>
          </p>
        </div>
      )}
    </div>
  );
}

const card = { border: "1px solid #ddd", borderRadius: 12, padding: 14, marginTop: 14 };
