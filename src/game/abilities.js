import { startUltimate } from "./ultimates.js";
export const abilities = Object.fromEntries(
  ["overdrive", "stasis", "repair", "nova"].map((kind) => [
    kind,
    (w) => startUltimate(w, kind),
  ]),
);
export const passives = {
  akari(p) {
    p.damage *= 1.15;
  },
  rin(p) {
    p.magnet *= 1.5;
  },
  yuki(p) {
    p.maxShield += 30;
    p.shield += 30;
  },
  mio(p) {
    p.xpFactor += 0.2;
  },
};
