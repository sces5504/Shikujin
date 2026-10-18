import { BOSSES } from "../content/encounters.js";
import { DIFFICULTIES } from "../content/progression.js";
import { applyResearch, checkEvolutions } from "./progression.js";
import { abilities, passives } from "./abilities.js";
import { Random } from "../core/random.js";
import { Events } from "../core/events.js";
import { SpatialHash } from "../core/spatial.js";
import { SHIPS, PILOTS, MAPS, ENEMIES, RULES } from "../content/catalog.js";
import { choices, applyUpgrade } from "./upgrades.js";
import * as systems from "./systems.js";
export class World {
  constructor({
    ship = "kestrel",
    pilot = "akari",
    seed = Date.now(),
    mode = "campaign",
    difficulty = "normal",
    research = {},
    bond = 0,
  } = {}) {
    this.mode = mode;
    this.difficulty =
      DIFFICULTIES.find((d) => d.id === difficulty) || DIFFICULTIES[1];
    this.rewardFactor = this.difficulty.reward;
    this.bonusCredits = 0;
    this.bossKills = 0;
    this.evolutions = [];
    this.killedBosses = [];
    this.rng = new Random(seed);
    this.events = new Events();
    this.grid = new SpatialHash();
    this.ship = SHIPS.find((s) => s.id === ship) || SHIPS[0];
    this.pilot = PILOTS.find((p) => p.id === pilot) || PILOTS[0];
    const s = this.ship;
    this.player = {
      id: 0,
      x: 0,
      y: 0,
      r: 7,
      hp: s.hp,
      maxHp: s.hp,
      shield: 30,
      maxShield: 30,
      speed: s.speed,
      damage: s.damage,
      interval: s.interval,
      fire: 0,
      angle: -Math.PI / 2,
      multi: 1,
      pierce: 0,
      magnet: 100,
      xpFactor: 1,
      regen: 0,
      crit: 0.05,
      cooldown: 0,
      cooldownFactor: 1,
      invuln: 0,
      overdrive: 0,
      sinceHit: 0,
    };
    this.player.multi = s.multi || 1;
    this.player.dash = 0;
    this.player.dashTime = 0;
    passives[this.pilot.id]?.(this.player);
    this.player.cooldownFactor *=
      1 - Math.min(10, Math.floor(bond / 100)) * 0.01;
    applyResearch(this, research);
    this.enemies = [];
    this.bullets = [];
    this.drops = [];
    this.particles = [];
    this.rings = [];
    this.upgrades = {};
    if (s.drone) this.upgrades.drone = s.drone;
    this.mapIndex = 0;
    this.map = MAPS[0];
    this.time = 0;
    this.wave = 1;
    this.waveTime = 0;
    this.spawnTimer = 0.4;
    this.level = 1;
    this.xp = 0;
    this.nextXp = 35;
    this.score = 0;
    this.kills = 0;
    this.grazes = 0;
    this.ids = 1;
    this.state = "playing";
    this.missileTimer = 0;
    this.pulseTimer = 0;
    this.stasis = 0;
    this.shake = 0;
    this.options = [];
    this.settled = false;
  }
  step(dt, input = {}) {
    if (this.state !== "playing") return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 15);
    systems.movement(this, dt, input);
    systems.director(this, dt);
    if (this.state !== "playing") return;
    systems.enemies(this, dt);
    this.grid.rebuild(this.enemies);
    systems.weapons(this, dt);
    systems.projectiles(this, dt);
    if (this.state === "playing") systems.pickups(this, dt);
    systems.cleanup(this, dt);
  }
  spawn(kind) {
    const def = ENEMIES[kind];
    if (!def) return null;
    if (this.enemies.length >= RULES.maxEnemies) {
      if (kind !== "boss") return null;
      this.enemies.shift();
    }
    const angle = this.rng.range(0, Math.PI * 2),
      d = kind === "boss" ? 460 : this.rng.range(570, 800);
    const scale = 1 + (this.wave - 1) * 0.13;
    const bossDef =
      kind === "boss" ? BOSSES[this.mapIndex % BOSSES.length] : null;
    const hp = (bossDef?.hp || def.hp) * scale * this.difficulty.hp;
    const e = {
      ...def,
      ...(bossDef
        ? {
            bossId: bossDef.id,
            bossName: bossDef.name,
            bossSprite: bossDef.sprite,
            color: bossDef.color,
            shape: bossDef.shape,
            pattern: bossDef.pattern,
          }
        : {}),
      id: this.ids++,
      kind,
      x: this.player.x + Math.cos(angle) * d,
      y: this.player.y + Math.sin(angle) * d,
      hp,
      maxHp: hp,
      speed: def.speed * (1 + Math.min(0.7, this.wave * 0.018)),
      fire: this.rng.range(0.8, 2),
      age: 0,
      flash: 0,
    };
    if (kind === "boss")
      this.bossArena = {
        x: this.player.x,
        y: this.player.y,
        r: bossDef.arenaRadius || 700,
        color: bossDef.color,
      };
    this.enemies.push(e);
    return e;
  }
  playerBullet(x, y, angle, speed, damage, pierce, kind) {
    if (this.bullets.length >= RULES.maxBullets) return;
    const crit = this.rng.next() < this.player.crit;
    this.bullets.push({
      id: this.ids++,
      x,
      y,
      angle,
      speed,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: damage * (crit ? 2 : 1),
      pierce,
      kind,
      enemy: false,
      crit,
      r: kind === "missile" ? 6 : 4,
      life: 2,
      hit: new Set(),
    });
  }
  enemyBullet(e, angle, speed) {
    if (this.bullets.length >= RULES.maxBullets) return;
    this.bullets.push({
      id: this.ids++,
      x: e.x,
      y: e.y,
      angle,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: 12 + this.wave * 0.7,
      color: e.color,
      pierce: 0,
      kind: "enemy",
      enemy: true,
      r: 5,
      life: 7,
      hit: new Set(),
    });
  }
  hit(e, damage) {
    if (e.hp <= 0) return;
    e.hp -= damage;
    e.flash = 0.08;
    if (e.hp <= 0) {
      this.kills++;
      this.score += e.score;
      if (e.kind === "boss") this.xp += e.xp * this.player.xpFactor;
      else {
        if (this.drops.length < 750)
          this.drops.push({ x: e.x, y: e.y, value: e.xp });
        else {
          let drop = this.drops[this.ids % this.drops.length];
          drop.value += e.xp;
        }
      }
      this.burst(e.x, e.y, e.color, e.kind === "boss" ? 50 : 9);
      this.events.emit("kill", e);
      if (e.kind === "boss") {
        this.bossArena = null;
        this.bossKills++;
        this.killedBosses.push(e.bossId);
        this.bullets = this.bullets.filter((b) => !b.enemy);
        this.player.hp = Math.min(
          this.player.maxHp,
          this.player.hp + this.player.maxHp * 0.25,
        );
        this.events.emit("bossKilled", {});
      }
    }
  }
  hurt(damage) {
    const p = this.player;
    if (p.invuln > 0 || this.state !== "playing") return;
    damage *= this.difficulty.damage;
    const absorbed = Math.min(p.shield, damage);
    p.shield -= absorbed;
    p.hp = Math.max(0, p.hp - (damage - absorbed));
    p.invuln = 0.8;
    p.sinceHit = 0;
    this.shake = 7;
    this.burst(p.x, p.y, "#ff8fa0", 12);
    this.events.emit("hurt", {});
    if (p.hp <= 0) this.finish();
  }
  blast(x, y, r, damage, color) {
    this.rings.push({
      x,
      y,
      r: 0,
      speed: r * 2,
      life: 0.5,
      maxLife: 0.5,
      color,
    });
    for (const e of this.enemies)
      if (Math.hypot(e.x - x, e.y - y) < r + e.r) this.hit(e, damage);
    this.shake = 3;
  }
  burst(x, y, color, count) {
    for (
      let i = 0;
      i < count && this.particles.length < RULES.maxParticles;
      i++
    ) {
      const a = this.rng.range(0, Math.PI * 2),
        s = this.rng.range(30, 160);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: this.rng.range(0.2, 0.65),
        color,
        r: this.rng.range(1, 3),
      });
    }
  }
  queueUpgrade() {
    if (this.state !== "playing") return;
    this.state = "upgrade";
    this.options = choices(this);
    this.events.emit("upgrade", this.options);
  }
  choose(id) {
    if (this.state !== "upgrade" || !this.options.some((u) => u.id === id))
      return false;
    if (!applyUpgrade(this, id)) return false;
    this.options = [];
    this.state = "playing";
    checkEvolutions(this);
    this.events.emit("chosen", id);
    return true;
  }
  skill() {
    const p = this.player;
    if (this.state !== "playing" || p.cooldown > 0) return false;
    p.cooldown = this.pilot.cooldown * p.cooldownFactor;
    abilities[this.pilot.skill]?.(this);
    this.burst(p.x, p.y, this.pilot.color, 35);
    this.events.emit("skill", {});
    return true;
  }
  pause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.events.emit("pause", {});
    }
  }
  resume() {
    if (this.state === "paused") {
      this.state = "playing";
      this.events.emit("resume", {});
    }
  }
  dash(input = { x: 0, y: 0 }) {
    const p = this.player;
    if (this.state !== "playing" || p.dash > 0) return false;
    p.dash = 3;
    p.dashTime = 0.22;
    p.invuln = Math.max(p.invuln, 0.32);
    let len = Math.hypot(input.x, input.y);
    this.dashVector = len
      ? { x: input.x / len, y: input.y / len }
      : { x: Math.cos(p.angle), y: Math.sin(p.angle) };
    this.burst(p.x, p.y, this.ship.color, 12);
    this.events.emit("dash", {});
    return true;
  }
  supply(id) {
    if (this.state !== "intermission") return false;
    this.state = "playing";
    if (id === "repair") {
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + this.player.maxHp * 0.5,
      );
      this.player.shield = this.player.maxShield;
    } else if (id === "salvage") this.bonusCredits += 90;
    else if (id === "augment") this.queueUpgrade();
    else {
      this.state = "intermission";
      return false;
    }
    this.events.emit("supply", id);
    return true;
  }
  finish(clear = false) {
    if (this.state === "defeat") return;
    this.state = "defeat";
    this.result = {
      clear,
      pilot: this.pilot.id,
      bossKills: this.bossKills,
      score: this.score,
      wave: this.wave,
      kills: this.kills,
      time: this.time,
      reward: Math.floor(
        (Math.max(15, Math.floor(this.score / 35) + this.wave * 8) +
          this.bonusCredits +
          (clear ? 350 : 0)) *
          this.rewardFactor,
      ),
    };
    this.events.emit("defeat", this.result);
  }
}
