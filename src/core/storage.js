import {
  cleanAffection,
  interact,
  readMemory,
  affectionRecord,
} from "./affection.js";
import {
  RESEARCH,
  ACHIEVEMENTS,
  researchCost,
} from "../content/progression.js";
import { SHIPS, PILOTS } from "../content/catalog.js";
export const SAVE_KEY = "shikujin.save.v1";
export const defaultSave = () => ({
  version: 1,
  research: {},
  claimed: [],
  totalKills: 0,
  bossKills: 0,
  clears: 0,
  history: [],
  bond: {},
  affection: {},
  quality: "auto",
  mode: "campaign",
  difficulty: "normal",
  credits: 0,
  owned: ["kestrel"],
  ship: "kestrel",
  pilot: "akari",
  bestWave: 0,
  bestScore: 0,
  runs: 0,
  sound: true,
  music: true,
  reduced: false,
});
export function sanitizeSave(raw) {
  const d = defaultSave();
  if (!raw || raw.version !== 1) return d;
  for (const k of [
    "credits",
    "bestWave",
    "bestScore",
    "runs",
    "totalKills",
    "bossKills",
    "clears",
  ])
    if (Number.isFinite(raw[k])) d[k] = Math.max(0, Math.floor(raw[k]));
  d.owned = [
    ...new Set([
      "kestrel",
      ...(Array.isArray(raw.owned) ? raw.owned : []).filter((id) =>
        SHIPS.some((s) => s.id === id),
      ),
    ]),
  ];
  d.ship = d.owned.includes(raw.ship) ? raw.ship : d.ship;
  d.pilot = PILOTS.some((p) => p.id === raw.pilot) ? raw.pilot : d.pilot;
  for (const k of ["sound", "reduced", "music"])
    if (typeof raw[k] === "boolean") d[k] = raw[k];
  for (const node of RESEARCH)
    d.research[node.id] = Math.max(
      0,
      Math.min(node.max, Math.floor(Number(raw.research?.[node.id]) || 0)),
    );
  d.claimed = (Array.isArray(raw.claimed) ? raw.claimed : []).filter((id) =>
    ACHIEVEMENTS.some((a) => a.id === id),
  );
  for (const p of PILOTS)
    d.bond[p.id] = Math.max(0, Math.min(100000, Number(raw.bond?.[p.id]) || 0));
  for (const p of PILOTS)
    d.affection[p.id] = cleanAffection(raw.affection?.[p.id], d.bond[p.id]);
  d.quality = ["auto", "high", "performance"].includes(raw.quality)
    ? raw.quality
    : "auto";
  d.mode = raw.mode === "endless" ? "endless" : "campaign";
  d.difficulty = ["story", "normal", "expert"].includes(raw.difficulty)
    ? raw.difficulty
    : "normal";
  d.history = (Array.isArray(raw.history) ? raw.history : [])
    .filter(
      (r) =>
        r &&
        Number.isFinite(r.score) &&
        Number.isFinite(r.wave) &&
        Number.isFinite(r.reward),
    )
    .slice(0, 10)
    .map((r) => ({
      score: r.score,
      wave: r.wave,
      reward: r.reward,
      pilot: PILOTS.some((p) => p.id === r.pilot) ? r.pilot : "akari",
      clear: !!r.clear,
      reason: ["retreat", "clear", "defeat"].includes(r.reason)
        ? r.reason
        : r.clear
          ? "clear"
          : "defeat",
    }));
  return d;
}
export class SaveStore {
  constructor(storage) {
    this.storage = storage;
    this.available = true;
    try {
      this.data = sanitizeSave(JSON.parse(storage.getItem(SAVE_KEY)));
    } catch {
      this.data = defaultSave();
    }
  }
  write() {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
      this.available = true;
    } catch {
      this.available = false;
    }
    return this.available;
  }
  buy(id) {
    const ship = SHIPS.find((s) => s.id === id);
    if (!ship || this.data.owned.includes(id) || this.data.credits < ship.cost)
      return false;
    this.data.credits -= ship.cost;
    this.data.owned.push(id);
    this.write();
    return true;
  }
  research(id) {
    const node = RESEARCH.find((n) => n.id === id);
    if (!node) return false;
    const level = this.data.research[id] || 0,
      cost = researchCost(node, level);
    if (level >= node.max || this.data.credits < cost) return false;
    this.data.credits -= cost;
    this.data.research[id] = level + 1;
    this.write();
    return true;
  }
  metric(id) {
    if (id === "ships") return this.data.owned.length;
    if (id === "research")
      return Object.values(this.data.research).reduce((a, b) => a + b, 0);
    return this.data[id] || 0;
  }
  claim(id) {
    const a = ACHIEVEMENTS.find((a) => a.id === id);
    if (
      !a ||
      this.data.claimed.includes(id) ||
      this.metric(a.metric) < a.target
    )
      return false;
    this.data.claimed.push(id);
    this.data.credits += a.reward;
    this.write();
    return true;
  }
  interact(id, kind, gift, day) {
    const r = interact(this.data, id, kind, gift, day);
    if (r.ok) this.write();
    return r;
  }
  memory(id, at) {
    const r = readMemory(this.data, id, at);
    if (r.ok && r.fresh) this.write();
    return r;
  }
  settle(result) {
    this.data.credits += result.reward;
    this.data.bestWave = Math.max(this.data.bestWave, result.wave);
    this.data.bestScore = Math.max(this.data.bestScore, result.score);
    this.data.runs++;
    this.data.totalKills += result.kills || 0;
    this.data.bossKills += result.bossKills || 0;
    if (result.clear) this.data.clears++;
    if (result.pilot)
      this.data.bond[result.pilot] =
        (this.data.bond[result.pilot] || 0) +
        Math.floor((result.kills || 0) / 5) +
        result.wave * 4;
    if (result.pilot) {
      const a = affectionRecord(this.data, result.pilot);
      a.points = Math.min(
        100,
        a.points +
          Math.min(
            18,
            2 +
              Math.floor((result.kills || 0) / 80) +
              (result.bossKills || 0) * 3 +
              (result.clear ? 5 : 0),
          ),
      );
    }
    this.data.history.unshift({
      score: result.score,
      wave: result.wave,
      reward: result.reward,
      pilot: result.pilot || "akari",
      clear: !!result.clear,
      reason: result.reason || (result.clear ? "clear" : "defeat"),
    });
    this.data.history = this.data.history.slice(0, 10);
    this.write();
  }
}
