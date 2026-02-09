import { nanoid } from "nanoid";

/**
 * localStorage-backed mini "backend"
 * Everything is plain JSON. No auth security — this is for testing flows.
 */

const KEY = "padel_mvp_v1";

export function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);

  const initial = {
    facility: { id: "eddies", name: "Eddie Irvine Sports", town: "Bangor, Co Down" },
    season: { id: "s1", name: "Season 1", starts: mondayOfThisWeekISO(), weeks: 8 },
    users: [],
    pairs: [],
    invites: [], // { code, leagueType, facilityId, createdByUserId, partnerEmail, acceptedByUserId }
    matches: [], // generated weekly
    session: { userId: null }
  };

  localStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetAll() {
  localStorage.removeItem(KEY);
}

export function getSession() {
  return load().session;
}

export function signOut() {
  const s = load();
  s.session.userId = null;
  save(s);
}

export function signInAs(userId) {
  const s = load();
  s.session.userId = userId;
  save(s);
}

export function createUser({ name, email, leagueType }) {
  const s = load();
  const user = {
    id: nanoid(10),
    name,
    email: email.toLowerCase().trim(),
    leagueType, // "friendly" | "competitive"
    facilityId: s.facility.id,
    level: null,
    availability: null, // "weeknights" | "weekends" | "both"
    status: "needs_profile", // needs_profile | needs_partner | waiting_for_pair | waiting_for_partner | paired
    rating: null, // level*100
    pairId: null
  };
  s.users.push(user);
  save(s);
  return user;
}

export function updateUser(userId, patch) {
  const s = load();
  const u = s.users.find(x => x.id === userId);
  if (!u) throw new Error("User not found");
  Object.assign(u, patch);
  save(s);
  return u;
}

export function getMe() {
  const s = load();
  const id = s.session.userId;
  return id ? s.users.find(u => u.id === id) : null;
}

export function createInvite({ createdByUserId, partnerEmail }) {
  const s = load();
  const me = s.users.find(u => u.id === createdByUserId);
  if (!me) throw new Error("No user");
  const inv = {
    code: nanoid(8),
    leagueType: me.leagueType,
    facilityId: me.facilityId,
    createdByUserId,
    partnerEmail: partnerEmail.toLowerCase().trim(),
    acceptedByUserId: null
  };
  s.invites.push(inv);
  save(s);
  return inv;
}

export function acceptInvite({ code, accepterUserId }) {
  const s = load();
  const inv = s.invites.find(i => i.code === code);
  if (!inv) throw new Error("Invite not found");

  const a = s.users.find(u => u.id === accepterUserId);
  const b = s.users.find(u => u.id === inv.createdByUserId);
  if (!a || !b) throw new Error("Users missing");

  // must match league/facility
  if (a.leagueType !== inv.leagueType) throw new Error("League type mismatch");
  if (a.facilityId !== inv.facilityId) throw new Error("Facility mismatch");

  inv.acceptedByUserId = accepterUserId;

  // Create pair
  const pair = createPairInternal(s, { userA: b, userB: a, captainUserId: b.id });
  save(s);
  return pair;
}

function createPairInternal(s, { userA, userB, captainUserId }) {
  const pair = {
    id: nanoid(10),
    leagueType: userA.leagueType,
    facilityId: userA.facilityId,
    captainUserId,
    userIds: [userA.id, userB.id],
    createdAt: new Date().toISOString()
  };
  s.pairs.push(pair);

  // attach to users
  for (const uid of pair.userIds) {
    const u = s.users.find(x => x.id === uid);
    u.pairId = pair.id;
    u.status = "paired";
  }
  return pair;
}

export function tryAutoPairFriendly() {
  const s = load();

  // Eligible solo friendly players
  const pool = s.users
    .filter(u =>
      u.leagueType === "friendly" &&
      u.status === "waiting_for_pair" &&
      u.level != null &&
      u.availability != null &&
      !u.pairId
    )
    .sort((a, b) => a.level - b.level);

  const used = new Set();
  const maxGap = 2;

  for (let i = 0; i < pool.length; i++) {
    const a = pool[i];
    if (used.has(a.id)) continue;

    // look ahead to closest-level candidates
    const candidates = [];
    for (let j = i + 1; j < Math.min(pool.length, i + 6); j++) {
      const b = pool[j];
      if (used.has(b.id)) continue;
      const gap = Math.abs(a.level - b.level);
      if (gap > maxGap) continue;

      const availMismatch = availabilityOverlap(a.availability, b.availability) ? 0 : 1;
      const score = gap * 10 + availMismatch * 5;

      candidates.push({ b, score });
    }

    if (candidates.length === 0) continue;
    candidates.sort((x, y) => x.score - y.score);
    const b = candidates[0].b;

    used.add(a.id);
    used.add(b.id);

    // captain = earliest created (approx = lower index in users array)
    const idxA = s.users.findIndex(u => u.id === a.id);
    const idxB = s.users.findIndex(u => u.id === b.id);
    const captainUserId = idxA <= idxB ? a.id : b.id;

    createPairInternal(s, { userA: a, userB: b, captainUserId });
  }

  save(s);
  return s.pairs;
}

function availabilityOverlap(a, b) {
  if (a === "both" || b === "both") return true;
  return a === b;
}

export function generateWeeklyFixtures({ weekIndex }) {
  const s = load();
  const seasonStart = new Date(s.season.starts);
  const weekStart = new Date(seasonStart.getTime() + weekIndex * 7 * 24 * 3600 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 3600 * 1000);

  // Friendly weekly matching (greedy min-cost)
  const friendlyPairs = s.pairs.filter(p => p.leagueType === "friendly");

  const alreadyThisWeek = new Set(
    s.matches.filter(m => m.weekIndex === weekIndex && m.leagueType === "friendly").map(m => m.id)
  );
  // we won't regenerate if already exist
  if (alreadyThisWeek.size > 0) return s.matches;

  const pairs = [...friendlyPairs];

  // compute pair rating (average of users)
  const pairRating = (pairId) => {
    const p = s.pairs.find(x => x.id === pairId);
    const us = p.userIds.map(uid => s.users.find(u => u.id === uid));
    return Math.round((us[0].rating + us[1].rating) / 2);
  };

  // repeat history (this season)
  const played = new Set();
  for (const m of s.matches.filter(m => m.leagueType === "friendly")) {
    const key = [m.pairAId, m.pairBId].sort().join("|");
    played.add(key);
  }

  // build all matchup costs
  const matchups = [];
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const a = pairs[i];
      const b = pairs[j];
      const gap = Math.abs(pairRating(a.id) - pairRating(b.id));
      const repeatPenalty = played.has([a.id, b.id].sort().join("|")) ? 1000 : 0;
      const cost = gap + repeatPenalty;
      matchups.push({ aId: a.id, bId: b.id, cost });
    }
  }
  matchups.sort((x, y) => x.cost - y.cost);

  const used = new Set();
  const fixtures = [];

  for (const mu of matchups) {
    if (used.has(mu.aId) || used.has(mu.bId)) continue;
    used.add(mu.aId);
    used.add(mu.bId);

    fixtures.push(makeMatch(s, {
      leagueType: "friendly",
      weekIndex,
      weekStartISO: isoDate(weekStart),
      weekEndISO: isoDate(weekEnd),
      pairAId: mu.aId,
      pairBId: mu.bId
    }));
  }

  // BYE if odd
  const remaining = pairs.filter(p => !used.has(p.id));
  if (remaining.length === 1) {
    fixtures.push(makeMatch(s, {
      leagueType: "friendly",
      weekIndex,
      weekStartISO: isoDate(weekStart),
      weekEndISO: isoDate(weekEnd),
      pairAId: remaining[0].id,
      pairBId: null,
      isBye: true
    }));
  }

  s.matches.push(...fixtures);
  save(s);
  return s.matches;
}

function makeMatch(s, { leagueType, weekIndex, weekStartISO, weekEndISO, pairAId, pairBId, isBye = false }) {
  return {
    id: nanoid(10),
    leagueType,
    facilityId: s.facility.id,
    seasonId: s.season.id,
    weekIndex,
    weekStartISO,
    weekEndISO,
    pairAId,
    pairBId,
    isBye,
    scheduledAtISO: null, // when court booked
    scheduledByUserId: null,
    courtNote: "",
    status: isBye ? "bye" : "not_scheduled", // not_scheduled | scheduled | pending_confirm | disputed | confirmed | no_result
    score: null, // { sets: ["6-4","6-3"], submittedBy, submittedAtISO }
    dispute: null // { disputedBy, disputedAtISO, proposedScore }
  };
}

export function updateMatch(matchId, patch) {
  const s = load();
  const m = s.matches.find(x => x.id === matchId);
  if (!m) throw new Error("Match not found");
  Object.assign(m, patch);
  save(s);
  return m;
}

export function submitScore({ matchId, userId, sets }) {
  const s = load();
  const m = s.matches.find(x => x.id === matchId);
  if (!m) throw new Error("Match not found");
  if (m.isBye) throw new Error("Cannot score a BYE");

  // basic validation
  if (!Array.isArray(sets) || sets.length < 2 || sets.length > 3) throw new Error("Enter 2–3 sets");
  for (const st of sets) {
    if (!/^\d{1,2}-\d{1,2}$/.test(st)) throw new Error("Set format must be like 6-4");
  }

  m.score = { sets, submittedBy: userId, submittedAtISO: new Date().toISOString() };
  m.status = "pending_confirm";
  m.dispute = null;
  save(s);
  return m;
}

export function confirmScore({ matchId }) {
  const s = load();
  const m = s.matches.find(x => x.id === matchId);
  if (!m?.score) throw new Error("No score to confirm");
  m.status = "confirmed";
  save(s);
  return m;
}

export function disputeScore({ matchId, userId, sets }) {
  const s = load();
  const m = s.matches.find(x => x.id === matchId);
  if (!m?.score) throw new Error("No score to dispute");
  m.dispute = { disputedBy: userId, disputedAtISO: new Date().toISOString(), proposedScore: { sets } };
  m.status = "disputed";
  save(s);
  return m;
}

export function resolveDisputeAsNoResult({ matchId }) {
  const s = load();
  const m = s.matches.find(x => x.id === matchId);
  m.status = "no_result";
  save(s);
  return m;
}

// Helpers
function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayOfThisWeekISO() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return isoDate(monday);
}

