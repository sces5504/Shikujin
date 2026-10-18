// Abilities mutate simulation only; VFX and dialogue subscribe to the resulting event.
export const abilities = {
  overdrive(w) {
    w.player.overdrive = 8;
  },
  stasis(w) {
    w.stasis = 6;
  },
  repair(w) {
    const p = w.player;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.3);
    p.shield = p.maxShield;
    w.bullets = w.bullets.filter((b) => !b.enemy);
  },
  nova(w) {
    for (const e of [...w.enemies]) w.hit(e, w.player.damage * 15);
    w.bullets = w.bullets.filter((b) => !b.enemy);
    w.blast(w.player.x, w.player.y, 900, 0, "#ffb2c3");
  },
};
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
