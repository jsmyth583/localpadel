import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
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
    const toEmail = email.trim();
    if (!toEmail) return alert("Enter partner email");

    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const APP_URL = import.meta.env.VITE_APP_URL;

    // Quick sanity check (common reason for “no email”)
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY || !APP_URL) {
      console.log("ENV:", { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY, APP_URL });
      return alert("Missing .env values. Stop server and run npm run dev again.");
    }

    const inv = createInvite({
      createdByUserId: me.id,
      partnerEmail: toEmail,
    });

    setSending(true);

    try {
      // These names must match your EmailJS template variables:
      // {{invite_code}} and {{app_url}}
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          invite_code: inv.code,
          app_url: APP_URL,
          to_email: toEmail, // optional (some templates use it)
        },
        {
          publicKey: PUBLIC_KEY,
        }
      );

      updateUser(me.id, { status: "waiting_for_partner" });

      alert(`Invite sent to ${toEmail}\nInvite code: ${inv.code}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("EmailJS error:", err);

      // Still show the code so you can continue even if email fails
      alert(
        `Email failed to send.\nInvite code: ${inv.code}\n\nOpen F12 → Console and send me the error.`
      );
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

