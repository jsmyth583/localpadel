import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>LocalPadel</h1>
      <p>Pairing local padel players</p>

      <div style={{ marginTop: 20 }}>
        <Link to="/signup/friendly">
          <button style={btn}>Join Friendly</button>
        </Link>

        <br /><br />

        <Link to="/signup/competitive">
          <button style={btn}>Join Competitive</button>
        </Link>
      </div>
    </div>
  );
}

const btn = {
  padding: "10px 16px",
  fontSize: 16,
  cursor: "pointer"
};
