import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, updateUser, createInvite } from "../lib/store.js";

export default function Partner() {
  const me = getMe();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  if (!me) return <div style={{ padding: 20 }}>No session. Go Home.</div>;

  const isFriendly = me.leagueType === "friendly";

  function joinSoloFriendly() {
    updateUser(me.id, { status: "waiting_for_pair" });
    navigate("/dashboard");
  }

  function sendInvite() {
    if (!email.trim()) return alert("Enter partner email");
    const inv = createInvite({ createdByUserId: me.id, partnerEmail: email.trim() });
    updateUser(me.id, { status: "waiting_for_partner" });
    alert(`Invite code (share this with your partner): ${inv.code}`);
    navigate("/dashboard");
  }

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h2>Partner setup</h2>

      {isFriendly ? (
        <>
          <p style={{ color: "#444" }}>Friendly allows solo signup or invite a partner.</p>

          <button style={btn} onClick={joinSoloFriendly}>Join solo (auto-pair me)</button>

          <hr style={{ margin: "14px 0" }} />

          <div style={{ fontWeight: 800, marginBottom: 8 }}>Invite a partner</div>
          <input style={inp} placeholder="partner@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button style={{ ...btn, marginTop: 10 }} onClick={sendInvite}>Create invite</button>
        </>
      ) : (
        <>
          <p style={{ color: "#444" }}>Competitive requires a fixed partner.</p>
          <input style={inp} placeholder="partner@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button style={{ ...btn, marginTop: 10 }} onClick={sendInvite}>Create invite</button>
        </>
      )}
    </div>
  );
}

const inp = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" };
const btn = { padding: "10px 12px", borderRadius: 10, border: "1px solid #333", fontWeight: 800, background: "white" };
