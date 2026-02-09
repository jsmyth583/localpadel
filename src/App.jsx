import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import Partner from "./pages/Partner.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Match from "./pages/Match.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup/:leagueType" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/partner" element={<Partner />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/match/:matchId" element={<Match />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
