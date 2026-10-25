import { BOUNDS } from "../content/stage.js";
// Squadron layouts. Each returns spawn slots; behaviors read `path` to fly them.
// Slots are staggered off-screen so members enter one after another.
const top = BOUNDS.top - 50;
export const formations = {
  vee(w, n) {
    const cx = w.rng.range(-200, 200);
    return Array.from({ length: n }, (_, i) => {
      const k = Math.ceil(i / 2) * (i % 2 ? -1 : 1);
      return {
        x: cx + k * 52,
        y: top - Math.abs(k) * 46,
        path: { mode: "dive" },
      };
    });
  },
  snake(w, n) {
    const cx = w.rng.range(-170, 170),
      amp = w.rng.range(90, 150),
      phase = w.rng.range(0, Math.PI * 2);
    return Array.from({ length: n }, (_, i) => ({
      x: cx,
      y: top - i * 58,
      path: { mode: "snake", cx, amp, phase, delay: i * 0.36 },
    }));
  },
  sweep(w, n) {
    const dir = w.rng.next() < 0.5 ? 1 : -1;
    return Array.from({ length: n }, (_, i) => ({
      x: -dir * (BOUNDS.right + 40 + i * 62),
      y: BOUNDS.top + w.rng.range(80, 140) + i * 6,
      path: { mode: "sweep", dir },
    }));
  },
  row(w, n) {
    const span = Math.min(560, 150 * n);
    return Array.from({ length: n }, (_, i) => ({
      x: n === 1 ? w.rng.range(-220, 220) : -span / 2 + (span / (n - 1)) * i,
      y: top - i * 24,
      path: {
        mode: "hover",
        stopY: BOUNDS.top + w.rng.range(150, 330),
        hold: 6,
      },
    }));
  },
  arc(w, n) {
    const dir = w.rng.next() < 0.5 ? 1 : -1;
    return Array.from({ length: n }, (_, i) => ({
      x: -dir * 250,
      y: top - i * 64,
      path: { mode: "arc", dir },
    }));
  },
  heavy(w) {
    return [
      { x: w.rng.range(-180, 180), y: top - 30, path: { mode: "crawl" } },
    ];
  },
  pair(w, n) {
    return Array.from({ length: n }, (_, i) => ({
      x: (i % 2 ? 1 : -1) * w.rng.range(90, 260),
      y: top - i * 40,
      path: { mode: "lunge" },
    }));
  },
};
// Which formations suit each enemy archetype, and their base squad size.
export const SQUADS = {
  scout: { shapes: ["vee", "snake", "sweep"], size: 5 },
  striker: { shapes: ["row"], size: 2 },
  orbiter: { shapes: ["arc", "sweep"], size: 4 },
  tank: { shapes: ["heavy"], size: 1, escort: "scout" },
  charger: { shapes: ["pair"], size: 2 },
  healer: { shapes: ["row"], size: 1, escort: "striker" },
};
export function spawnSquad(w, kind, extra = 0) {
  const def = SQUADS[kind] || SQUADS.scout,
    shape = w.rng.pick(def.shapes),
    n = Math.max(1, def.size + extra);
  const squad = { id: w.ids++, size: 0, killed: 0, escaped: false };
  w.squads.set(squad.id, squad);
  const spawned = [];
  for (const slot of formations[shape](w, n)) {
    const e = w.spawn(kind, slot);
    if (e) spawned.push(e);
  }
  if (def.escort)
    for (const slot of formations.vee(w, 2 + Math.min(2, extra))) {
      const e = w.spawn(def.escort, slot);
      if (e) spawned.push(e);
    }
  for (const e of spawned) e.squad = squad.id;
  squad.size = spawned.length;
  if (!squad.size) w.squads.delete(squad.id);
  return spawned;
}
