import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, updateUser, createInvite, sendInviteEmail } from "../lib/store.js";

export default function Partner() {
  const me = getMe();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  if (!me) return <div style={{ padding: 20 }}>No session. Go Home.</div>;

  const isFriendly = me.leagueType === "friendly";

  function joinSoloFriendly() {
    updateUser(me.id, { status: "waiting_for_pair" });
    navigate("/dashboard");
  }

  async function sendInvite() {
    console.log("SENDING EMAIL WITH:", {
  SERVICE_ID,
  TEMPLATE_ID,
  PUBLIC_KEY,
  APP_URL,
  toEmail,
  code: inv.code
});


    const toEmail = email.trim();
    if (!toEmail) return alert("Enter partner email");

    // Create invite in local storage first (so you always have the code)
    const inv = createInvite({
      createdByUserId: me.id,
      partnerEmail: toEmail,
    });

    setSending(true);

    try {
      // This calls EmailJS inside store.js using your .env vars
      await sendInviteEmail({
        to_email: toEmail,
        invite_code: inv.code,
      });

      updateUser(me.id, { status: "waiting_for_partner" });

      alert(`Invite email sent to ${toEmail} ✅\nInvite code: ${inv.code}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("EmailJS failed:", err);

      // Still let you continue by sharing the code manually
      updateUser(me.id, { status: "waiting_for_partner" });

      alert(
        `Email failed ❌\nShare this code manually: ${inv.code}\n\nOpen F12 → Console and copy the red error.`
      );
      navigate("/dashboard");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h2>Partner setup</h2>

      {isFriendly ? (
        <>
          <p style={{ color: "#444" }}>
            Friendly allows solo signup or invite a partner.
          </p>

          <button style={btn} onClick={joinSoloFriendly} disabled={sending}>
            Join solo (auto-pair me)
          </button>

          <hr style={{ margin: "14px 0" }} />

          <div style={{ fontWeight: 800, marginBottom: 8 }}>Invite a partner</div>
          <input
            style={inp}
            placeholder="partner@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            style={{ ...btn, marginTop: 10, opacity: sending ? 0.7 : 1 }}
            onClick={sendInvite}
            disabled={sending}
          >
            {sending ? "Sending..." : "Create invite"}
          </button>
        </>
      ) : (
        <>
          <p style={{ color: "#444" }}>Competitive requires a fixed partner.</p>

          <input
            style={inp}
            placeholder="partner@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            style={{ ...btn, marginTop: 10, opacity: sending ? 0.7 : 1 }}
            onClick={sendInvite}
            disabled={sending}
          >
            {sending ? "Sending..." : "Create invite"}
          </button>
        </>
      )}
    </div>
  );
}

const inp = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ccc",
};

const btn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #333",
  fontWeight: 800,
  background: "white",
};


