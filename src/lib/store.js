import { nanoid } from "nanoid";
import emailjs from "@emailjs/browser";

/**
 * LocalStorage-backed mini backend (MVP).
 * Not secure, no real auth. Good enough to test flows.
 */
const KEY = "padel_mvp_v1";

function mondayOfThisWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun ... 1 Mon
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function weekRange(seasonStartISO, weekIndex) {
  const start = new Date(seasonStartISO);
  start.setDate(start.getDate() + weekIndex * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { weekStartISO: start.toISOString(), weekEndISO: end.toISOString() };
}

export function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);

  const initial = {
    facility: { id: "eddies", name: "Eddie Irvine Sports", town: "Bangor, Co Down" },
    season: { id: "s1", name: "Season 1", starts: mondayOfThisWeekISO(), weeks: 8 },
    users: [],
    pairs: [],
    invites: [],
    matches: [],
    session: { userId: null },
  };

  localStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export function getSession() {
  const s = load();
  return s.session;
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

export function getMe() {
  const s = load();
  const id = s.session.userId;
  if (!id) return null;
  return s.users.find((u) => u.id === id) || null;
}

export function createUser({ name, email, leagueType }) {
  const s = load();
  const existing = s.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    existing.leagueType = leagueType || existing.leagueType;
    save(s);
    return existing;
  }

  const user = {
    id: nanoid(8),
    name,
    email,
    leagueType, // "friendly" | "competitive"
    level: 5,
    rating: 500,
    availability: "both",
    status: "new", // "new"|"waiting_for_pair"|"waiting_for_partner"|"paired"
    pairId: null,
  };

  s.users.push(user);
  save(s);
  return user;
}

export function updateUser(userId, patch) {
  const s = load();
  const u = s.users.find((x) => x.id === userId);
  if (!u) throw new Error("User not found");
  Object.assign(u, patch);
  save(s);
  return u;
}

/**
 * Invites: captain creates invite for a partner email.
 * Partner can accept from Dashboard when logged in with that email.
 */
export function createInvite({ createdByUserId, partnerEmail }) {
  const s = load();
  const inviter = s.users.find((u) => u.id === createdByUserId);
  if (!inviter) throw new Error("Inviter not found");

  const inv = {
    code: nanoid(6).toUpperCase(),
    createdByUserId,
    partnerEmail,
    leagueType: inviter.leagueType,
    facilityId: s.facility.id,
    acceptedByUserId: null,
    createdAtISO: new Date().toISOString(),
  };

  s.invites.push(inv);
  save(s);
  return inv;
}

export function acceptInvite({ code, accepterUserId }) {
  const s = load();
  const inv = s.invites.find((i) => i.code === code);
  if (!inv) throw new Error("Invite not found");

  const accepter = s.users.find((u) => u.id === accepterUserId);
  if (!accepter) throw new Error("Accepter not found");

  if (accepter.email.toLowerCase() !== inv.partnerEmail.toLowerCase()) {
    throw new Error("This invite is not for your email.");
  }
  if (inv.acceptedByUserId) throw new Error("Invite already accepted.");

  const pair = {
    id: "pair_" + nanoid(8),
    userIds: [inv.createdByUserId, accepterUserId],
    captainUserId: inv.createdByUserId,
    leagueType: inv.leagueType,
    createdAtISO: new Date().toISOString(),
  };

  s.pairs.push(pair);

  const inviter = s.users.find((u) => u.id === inv.createdByUserId);
  inviter.pairId = pair.id;
  inviter.status = "paired";

  accepter.pairId = pair.id;
  accepter.leagueType = inv.leagueType;
  accepter.status = "paired";

  inv.acceptedByUserId = accepterUserId;

  save(s);
  return pair;
}

/**
 * Friendly solo auto-pairing: pairs up users in waiting pool by closest rating.
 */
export function tryAutoPairFriendly() {
  const s = load();

  const waiting = s.users
    .filter((u) => u.leagueType === "friendly")
    .filter((u) => u.status === "waiting_for_pair")
    .filter((u) => !u.pairId)
    .sort((a, b) => a.rating - b.rating);

  const created = [];

  for (let i = 0; i + 1 < waiting.length; i += 2) {
    const a = waiting[i];
    const b = waiting[i + 1];

    const pair = {
      id: "pair_" + nanoid(8),
      userIds: [a.id, b.id],
      captainUserId: a.id,
      leagueType: "friendly",
      createdAtISO: new Date().toISOString(),
    };

    s.pairs.push(pair);

    a.pairId = pair.id;
    a.status = "paired";
    b.pairId = pair.id;
    b.status = "paired";

    created.push(pair);
  }

  save(s);
  return created;
}

/**
 * Fixtures: for a given weekIndex, pair up pairs within each league type.
 */
export function generateWeeklyFixtures({ weekIndex }) {
  const s = load();
  const { weekStartISO, weekEndISO } = weekRange(s.season.starts, weekIndex);

  const existingWeek = s.matches.some((m) => m.weekIndex === weekIndex);
  if (existingWeek) return [];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const made = [];

  for (const leagueType of ["friendly", "competitive"]) {
    const pairs = shuffle(s.pairs.filter((p) => p.leagueType === leagueType));

    for (let i = 0; i < pairs.length; i += 2) {
      const pA = pairs[i];
      const pB = pairs[i + 1];

      if (!pB) {
        made.push(
          s.matches.push({
            id: "m_" + nanoid(10),
            leagueType,
            facilityId: s.facility.id,
            weekIndex,
            weekStartISO,
            weekEndISO,
            isBye: true,
            pairAId: pA.id,
            pairBId: null,
            status: "bye",
            scheduledAtISO: null,
            scheduledByUserId: null,
            courtNote: "",
            score: null,
            dispute: null,
          })
        );
        continue;
      }

      made.push(
        s.matches.push({
          id: "m_" + nanoid(10),
          leagueType,
          facilityId: s.facility.id,
          weekIndex,
          weekStartISO,
          weekEndISO,
          isBye: false,
          pairAId: pA.id,
          pairBId: pB.id,
          status: "not_scheduled",
          scheduledAtISO: null,
          scheduledByUserId: null,
          courtNote: "",
          score: null,
          dispute: null,
        })
      );
    }
  }

  save(s);
  return made;
}

export function updateMatch(matchId, patch) {
  const s = load();
  const m = s.matches.find((x) => x.id === matchId);
  if (!m) throw new Error("Match not found");
  Object.assign(m, patch);
  save(s);
  return m;
}

function getPairForUser(s, userId) {
  const u = s.users.find((x) => x.id === userId);
  if (!u?.pairId) return null;
  return s.pairs.find((p) => p.id === u.pairId) || null;
}

export function submitScore({ matchId, userId, sets }) {
  const s = load();
  const m = s.matches.find((x) => x.id === matchId);
  if (!m) throw new Error("Match not found");
  if (m.isBye) throw new Error("Cannot submit score for a bye");

  const myPair = getPairForUser(s, userId);
  if (!myPair) throw new Error("You are not in a pair");
  if (myPair.captainUserId !== userId) throw new Error("Only the captain can submit the score.");

  if (m.pairAId !== myPair.id && m.pairBId !== myPair.id) {
    throw new Error("You are not in this match");
  }

  m.score = {
    sets,
    submittedByUserId: userId,
    submittedAtISO: new Date().toISOString(),
  };
  m.status = "pending_confirm";
  m.dispute = null;

  save(s);
  return m;
}

export function confirmScore({ matchId }) {
  const s = load();
  const m = s.matches.find((x) => x.id === matchId);
  if (!m) throw new Error("Match not found");
  if (!m.score) throw new Error("No score to confirm");
  m.status = "confirmed";
  save(s);
  return m;
}

export function disputeScore({ matchId, userId, sets }) {
  const s = load();
  const m = s.matches.find((x) => x.id === matchId);
  if (!m) throw new Error("Match not found");
  if (!m.score) throw new Error("No submitted score to dispute");

  const myPair = getPairForUser(s, userId);
  if (!myPair) throw new Error("You are not in a pair");
  if (m.pairAId !== myPair.id && m.pairBId !== myPair.id) {
    throw new Error("You are not in this match");
  }

  m.dispute = {
    proposedScore: { sets },
    disputedByUserId: userId,
    disputedAtISO: new Date().toISOString(),
  };
  m.status = "disputed";
  save(s);
  return m;
}

export function resolveDisputeAsNoResult({ matchId }) {
  const s = load();
  const m = s.matches.find((x) => x.id === matchId);
  if (!m) throw new Error("Match not found");
  m.status = "no_result";
  save(s);
  return m;
}

/**
 * EmailJS: send invite email
 * Template variables expected: to_email, invite_code, app_url
 */
export async function sendInviteEmail({ to_email, invite_code }) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const appUrl = import.meta.env.VITE_APP_URL;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("Missing EmailJS env vars. Check .env values and restart dev server.");
  }

  return emailjs.send(
    serviceId,
    templateId,
    { to_email, invite_code, app_url: appUrl },
    { publicKey }
  );
}


