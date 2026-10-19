import {
  AFFECTION,
  AFFINITY_STAGES,
  GIFTS,
  taipeiDay,
} from "../content/affection.js";
const dailyCount = (v) =>
  Number.isFinite(v) ? Math.max(0, Math.min(3, Math.floor(v))) : 0;
export const cleanAffection = (raw, legacyBond = 0) => ({
  points: Math.max(
    0,
    Math.min(
      100,
      Number.isFinite(raw?.points) ? raw.points : Math.floor(legacyBond / 10),
    ),
  ),
  day: typeof raw?.day === "string" ? raw.day : "",
  chats: dailyCount(raw?.chats),
  gifts: dailyCount(raw?.gifts),
  memories: [
    ...new Set(
      (Array.isArray(raw?.memories) ? raw.memories : []).filter((n) =>
        AFFINITY_STAGES.some((s) => s.at === n),
      ),
    ),
  ],
});
export function affectionRecord(data, id) {
  return (data.affection[id] ||= cleanAffection(null, data.bond[id] || 0));
}
export function interact(data, id, kind, giftId, day = taipeiDay()) {
  const personality = Object.hasOwn(AFFECTION, id) ? AFFECTION[id] : null;
  if (!personality) return { ok: false, reason: "無效的駕駛員。" };
  const a = affectionRecord(data, id),
    newDay = a.day !== day,
    chats = newDay ? 0 : a.chats,
    gifts = newDay ? 0 : a.gifts;
  let gain = 0,
    line,
    cost = 0;
  if (kind === "chat") {
    if (chats >= 3)
      return { ok: false, reason: "今日交流已完成，明天再來聊聊吧。" };
    gain = 2;
    line = personality.chats[chats];
  } else if (kind === "gift") {
    const g = GIFTS.find((g) => g.id === giftId);
    if (!g) return { ok: false, reason: "無效的禮物。" };
    if (gifts >= 3) return { ok: false, reason: "今天已送過三份心意。" };
    if (data.credits < g.cost)
      return { ok: false, reason: "信用點不足，出擊後再帶禮物回來吧。" };
    cost = g.cost;
    gain = personality.favorite === g.id ? 8 : 4;
    line = personality.gift;
  } else return { ok: false, reason: "無效的互動。" };
  a.day = day;
  a.chats = chats + (kind === "chat" ? 1 : 0);
  a.gifts = gifts + (kind === "gift" ? 1 : 0);
  data.credits -= cost;
  const before = a.points;
  a.points = Math.min(100, a.points + gain);
  return { ok: true, line, gain: a.points - before };
}
export function readMemory(data, id, at) {
  if (!Object.hasOwn(AFFECTION, id)) return { ok: false };
  const index = AFFINITY_STAGES.findIndex((s) => s.at === at),
    a = affectionRecord(data, id);
  if (!AFFECTION[id] || index < 0 || a.points < at) return { ok: false };
  const fresh = !a.memories.includes(at);
  if (fresh) {
    a.memories.push(at);
    data.credits += 35;
  }
  return {
    ok: true,
    fresh,
    title: AFFINITY_STAGES[index].title,
    lines: AFFECTION[id].stories[index],
  };
}
