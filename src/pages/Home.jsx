import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>LocalPadel</h1>
      <p>
        Doubles only (2v2). Venue: Eddie Irvine Sports, Bangor. Captains submit scores.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Link to="/signup/friendly"><button style={btn}>Join Friendly</button></Link>
        <Link to="/signup/competitive"><button style={btn}>Join Competitive</button></Link>
        <Link to="/admin"><button style={btn}>Admin</button></Link>
      </div>
    </div>
  );
}

const btn = { padding: "10px 14px", fontWeight: 800, borderRadius: 10, border: "1px solid #333", background: "white" };
