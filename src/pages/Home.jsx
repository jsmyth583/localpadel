import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>LocalPadel</h1>
      <p>Pairing local padel players</p>

      <div style={{ marginTop: 20 }}>
        <Link to="/signup/friendly">
          <button>Join Friendly</button>
        </Link>

        <br /><br />

        <Link to="/signup/competitive">
          <button>Join Competitive</button>
        </Link>
      </div>
    </div>
  );
}
