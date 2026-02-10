import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  load,
  getMe,
  updateMatch,
  submitScore,
  confirmScore,
  disputeScore,
  resolveDisputeAsNoResult
} from "../lib/store.js";

export default function Match() {
  const { matchId } = useParams();
  const [refresh, setRefresh] = useState(0);

  const s = useMemo(() => load(), [refresh]);
  const me = useMemo(() => getMe(), [refresh]);

  const m = s.matches.find((x) => x.id === matchId);
  if (!m) return <div style={{ padding: 20 }}>Match not found.</div>;
  if (m.isBye) return <div style={{ padding: 20 }}>This is a BYE week.</div>;
  if (!me) return <div style={{ padding: 20 }}>No session.</div>;

  const pairA = s.pairs.find((p) => p.id === m.pairAId);
  const pairB = s.pairs.find((p) => p.id === m.pairBId);

  const myPair = me.pairId ? s.pairs.find((p) => p.id === me.pairId) : null;
  const myCaptain = myPair?.captainUserId === me.id;

  const teamNames = (pair) =>
    pair.userIds.map((uid) => s.users.find((u) => u.id === uid)?.name).join(" & ");

  const [dateTime, setDateTime] = useState(m.scheduledAtISO ? m.scheduledAtISO.slice(0, 16) : "");
  const [courtNote, setCourtNote] = useState(m.courtNote || "");
  const [setsRaw, setSetsRaw] = useState(m.score?.sets?.join(", ") || "6-4, 6-3");
  const [disputeSetsRaw, setDisputeSetsRaw] = useState("6-4, 4-6, 10-8");

  function parseSets(raw) {
    const sets = raw.split(",").map((x) => x.trim()).filter(Boolean);
    if (sets.length < 2 || sets.length > 3) throw new Error("Enter 2–3 sets, like: 6-4, 6-3");
    for (const st of sets) if (!/^\d{1,2}-\d{1,2}$/.test(st)) throw new Error("Each set must look like 6-4");
    return sets;
  }

  return (
    <div style={{ padding: 20, display: "grid", gap: 14 }}>
      <Link to="/dashboard">← Back</Link>

      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Match</h2>
        <div>Week: <b>{m.weekStartISO}</b> → <b>{m.weekEndISO}</b></div>
        <div>Venue: <b>{s.facility.name}, {s.facility.town}</b></div>
        <div>Status: <b>{m.status}</b></div>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Teams</h3>
        <div><b>Pair A:</b> {teamNames(pairA)}</div>
        <div><b>Pair B:</b> {teamNames(pairB)}</div>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Court booking (external)</h3>
        <p style={{ marginTop: 0, color: "#444" }}>One captain books the court externally. Record it here.</p>

        <label style={lbl}>Booked date/time</label>
        <input style={inp} type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />

        <label style={lbl}>Court note (optional)</label>
        <input style={inp} value={courtNote} onChange={(e) => setCourtNote(e.target.value)} placeholder="Court 2, bring balls, etc." />

        <button
          style={btn}
          onClick={() => {
            updateMatch(m.id, {
              scheduledAtISO: dateTime ? new Date(dateTime).toISOString() : null,
              scheduledByUserId: me.id,
              courtNote,
              status: dateTime ? "scheduled" : "not_scheduled"
            });
            setRefresh((x) => x + 1);
          }}
        >
          Save booking info
        </button>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Score</h3>

        {!m.score ? (
          <>
            <p style={{ marginTop: 0, color: "#444" }}>Captain submits score. Format: <b>6-4, 6-3</b></p>

            <label style={lbl}>Sets</label>
            <input style={inp} value={setsRaw} onChange={(e) => setSetsRaw(e.target.value)} />

            <button
              style={btn}
              disabled={!myCaptain}
              onClick={() => {
                try {
                  if (!myCaptain) return alert("Only the captain can submit.");
                  const sets = parseSets(setsRaw);
                  submitScore({ matchId: m.id, userId: me.id, sets });
                  setRefresh((x) => x + 1);
                } catch (e) {
                  alert(e.message);
                }
              }}
            >
              Submit score (captain)
            </button>

            {!myCaptain && <div style={{ color: "#777", marginTop: 8 }}>You’re not the captain for your pair.</div>}
          </>
        ) : (
          <>
            <div>Submitted sets: <b>{m.score.sets.join(", ")}</b></div>

            {m.status === "pending_confirm" && (
              <>
                <hr style={{ margin: "12px 0" }} />
                <button
                  style={btn}
                  onClick={() => {
                    confirmScore({ matchId: m.id });
                    setRefresh((x) => x + 1);
                  }}
                >
                  Confirm score
                </button>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Dispute score (enter your version)</div>
                  <input style={inp} value={disputeSetsRaw} onChange={(e) => setDisputeSetsRaw(e.target.value)} />
                  <button
                    style={btn}
                    onClick={() => {
                      try {
                        const sets = parseSets(disputeSetsRaw);
                        disputeScore({ matchId: m.id, userId: me.id, sets });
                        setRefresh((x) => x + 1);
                      } catch (e) {
                        alert(e.message);
                      }
                    }}
                  >
                    Dispute
                  </button>
                </div>
              </>
            )}

            {m.status === "disputed" && (
              <>
                <hr style={{ margin: "12px 0" }} />
                <div style={{ color: "#b00", fontWeight: 900 }}>DISPUTED</div>
                <div>Proposed score: <b>{m.dispute?.proposedScore?.sets?.join(", ")}</b></div>
                <button
                  style={btn}
                  onClick={() => {
                    resolveDisputeAsNoResult({ matchId: m.id });
                    setRefresh((x) => x + 1);
                  }}
                >
                  Set as No Result
                </button>
              </>
            )}

            {m.status === "confirmed" && <div style={{ marginTop: 12, color: "#090", fontWeight: 900 }}>Confirmed ✅</div>}
            {m.status === "no_result" && <div style={{ marginTop: 12, color: "#b00", fontWeight: 900 }}>No Result</div>}
          </>
        )}
      </div>
    </div>
  );
}

const card = { border: "1px solid #ddd", borderRadius: 12, padding: 14 };
const lbl = { display: "block", marginTop: 10, marginBottom: 6, fontWeight: 700 };
const inp = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" };
const btn = { marginTop: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #333", fontWeight: 800, background: "white" };
