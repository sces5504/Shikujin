import { dashBuild, shieldBreakBuild, killBuild } from "./builds.js";
import { ENEMY_LOADOUTS, BOSS_LOADOUTS } from "../content/combat.js";
import { projectileType } from "../content/projectiles.js";
import { updateUltimates } from "./ultimates.js";
import { ObjectPool } from "../core/pool.js";
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
import {
  rollGrade,
  updateResonance,
  route,
  rankSector,
  resetSector,
} from "./depth.js";
import {
  ELITE_AFFIXES,
  CARRIER,
  XP_CURVE,
  ENEMY_SCALING,
} from "../content/depth.js";
import {
  STAGE,
  BOUNDS,
  ITEMS,
  SQUAD_REWARDS,
  MEDAL_BASE,
  MEDAL_CHAIN_MAX,
} from "../content/stage.js";
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
      y: STAGE.playerStart,
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
    this.playerTarget = [this.player];
    this.player.multi = s.multi || 1;
    this.player.dash = 0;
    this.player.dashTime = 0;
    passives[this.pilot.id]?.(this.player);
    this.player.cooldownFactor *=
      1 - Math.min(10, Math.floor(bond / 100)) * 0.01;
    applyResearch(this, research);
    this.enemies = [];
    this.bullets = [];
    this.bulletPool = new ObjectPool(() => ({ hit: new Set() }), 2048);
    this.candidates = [];
    this.enemyBulletCount = 0;
    this.playerBulletCount = 0;
    this.rerolls = 3;
    this.mines = [];
    this.squads = new Map();
    this.popups = [];
    this.scroll = 0;
    this.medalChain = 0;
    this.medals = 0;
    this.squadBonuses = 0;
    this.resonance = {};
    this.banishes = 2;
    this.banished = new Set();
    // Level-ups and caches queue picks; combat never pauses for them.
    this.pickQueue = [];
    this.routeId = "standard";
    this.ranks = [];
    this.carrierWave = 0;
    this.strikes = [];
    this.beams = [];
    this.impacts = [];
    this.ultimate = null;
    this.combo = 0;
    this.comboTime = 0;
    this.damageNumbers = [];
    this.explosions = [];
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
    this.nextXp = XP_CURVE.start;
    this.score = 0;
    this.kills = 0;
    this.grazes = 0;
    this.ids = 1;
    this.state = "playing";
    this.missileTimer = 0;
    this.pulseTimer = 0;
    this.stasis = 0;
    this.shake = 0;
    this.flash = 0;
    this.options = [];
    this.settled = false;
    resetSector(this);
  }
  step(dt, input = {}) {
    if (this.state !== "playing") return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 15);
    this.flash = Math.max(0, this.flash - dt * 2.2);
    const bossAlive = this.enemies.some((e) => e.kind === "boss" && e.hp > 0);
    this.scrollSpeed = bossAlive ? STAGE.bossScroll : STAGE.scroll;
    this.scroll += this.scrollSpeed * dt;
    systems.movement(this, dt, input);
    systems.director(this, dt);
    if (this.state !== "playing") return;
    systems.enemies(this, dt);
    this.grid.rebuild(this.enemies);
    systems.weapons(this, dt);
    updateUltimates(this, dt);
    systems.projectiles(this, dt);
    if (this.state === "playing") systems.pickups(this, dt);
    systems.cleanup(this, dt);
  }
  spawn(kind, slot = null) {
    const def = ENEMIES[kind];
    if (!def) return null;
    if (this.enemies.length >= RULES.maxEnemies) {
      if (kind !== "boss") return null;
      this.enemies.shift();
    }
    const boss = kind === "boss";
    const scale = 1 + (this.wave - 1) * ENEMY_SCALING.hpPerWave;
    const bossDef = boss ? BOSSES[this.mapIndex % BOSSES.length] : null;
    const hp =
      (bossDef?.hp || def.hp) *
      scale *
      this.difficulty.hp *
      (route(this).enemyHp || 1);
    const e = {
      ...def,
      projectile: ENEMY_LOADOUTS[kind] || "enemy",
      ...(bossDef
        ? {
            ...BOSS_LOADOUTS[bossDef.id],
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
      // Everything enters from above the visible column unless a formation says otherwise.
      x: slot?.x ?? (boss ? 0 : this.rng.range(-300, 300)),
      y: slot?.y ?? (boss ? BOUNDS.top - 170 : BOUNDS.top - 40),
      path: slot?.path || { mode: "dive" },
      vx: 0,
      vy: 0,
      heading: Math.PI / 2,
      hp,
      maxHp: hp,
      speed: def.speed * (1 + Math.min(0.7, this.wave * 0.018)),
      fire: this.rng.range(0.8, 2),
      age: 0,
      flash: 0,
    };
    this.enemies.push(e);
    return e;
  }
  // Formation members that fly off-screen break the squadron bonus.
  escaped(e) {
    if (e.squad && this.squads.has(e.squad)) this.squads.delete(e.squad);
  }
  popup(x, y, text, color = "#fff2c4") {
    if (this.popups.length >= 16) this.popups.shift();
    this.popups.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
  }
  dropItem(x, y, item) {
    if (this.drops.length >= 750) this.drops.shift();
    this.drops.push({ x, y, value: 0, item, age: 0 });
  }
  collectItem(drop) {
    const p = this.player,
      def = ITEMS[drop.item];
    if (!def) return;
    if (drop.item === "medal") {
      this.medalChain = Math.min(MEDAL_CHAIN_MAX, this.medalChain + 1);
      this.medals++;
      const value = MEDAL_BASE * this.medalChain;
      this.score += value;
      this.popup(drop.x, drop.y - 10, `${value}`, def.color);
    } else if (drop.item === "power") {
      p.overdrive = Math.max(p.overdrive, 6);
      this.popup(drop.x, drop.y - 10, "POWER UP", def.color);
    } else if (drop.item === "bomb") {
      p.cooldown *= 0.5;
      this.popup(drop.x, drop.y - 10, "BURST +", def.color);
    } else if (drop.item === "cache") {
      this.queueUpgrade(true);
      this.popup(drop.x, drop.y - 10, "強化晶片", def.color);
    } else if (drop.item === "repair") {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.15);
      p.shield = p.maxShield;
      this.popup(drop.x, drop.y - 10, "REPAIR", def.color);
    }
    this.burst(drop.x, drop.y, def.color, 10);
    this.events.emit("item", drop.item);
  }
  playerBullet(x, y, angle, speed, damage, pierce, kind = "shot") {
    if (
      this.playerBulletCount >= RULES.maxPlayerBullets ||
      this.bullets.length >= RULES.maxBullets
    )
      return;
    const def = projectileType(kind);
    const crit = this.rng.next() < this.player.crit,
      b = this.bulletPool.acquire();
    b.hit.clear();
    Object.assign(b, {
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
      r: def.radius,
      type: kind,
      age: 0,
      life: 2,
      grazed: false,
      target: null,
    });
    this.bullets.push(b);
    this.playerBulletCount++;
    return b;
  }
  enemyBullet(e, angle, speed, type = e.projectile || "enemy") {
    const def = projectileType(type);
    speed *= route(this).bulletSpeed || 1;
    if (
      this.enemyBulletCount >= RULES.maxEnemyBullets ||
      this.bullets.length >= RULES.maxBullets
    )
      return;
    const b = this.bulletPool.acquire();
    b.hit.clear();
    Object.assign(b, {
      id: this.ids++,
      x: e.x,
      y: e.y,
      angle,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: (12 + this.wave * 0.7) * def.damage,
      type,
      speed,
      age: 0,
      color: e.color,
      pierce: 0,
      kind: "enemy",
      enemy: true,
      r: def.radius,
      life: 7,
      grazed: false,
      crit: false,
      target: null,
    });
    this.bullets.push(b);
    this.enemyBulletCount++;
    return b;
  }
  clearEnemyBullets() {
    // Cancelled bullets burst into score sparks so a bomb feels like a payout.
    let cancelled = 0;
    for (const b of this.bullets)
      if (b.enemy && b.life > 0) {
        b.life = 0;
        cancelled++;
        if (this.particles.length < RULES.maxParticles && cancelled % 2)
          this.particles.push({
            x: b.x,
            y: b.y,
            vx: this.rng.range(-40, 40),
            vy: this.rng.range(-120, -40),
            life: this.rng.range(0.35, 0.7),
            color: "#9dfcff",
            r: 1.6,
          });
      }
    if (cancelled) {
      this.score += cancelled * 3;
      this.popup(
        this.player.x,
        this.player.y - 70,
        `CANCEL ${cancelled}`,
        "#9dfcff",
      );
    }
  }
  resetProjectiles() {
    for (const b of this.bullets) this.bulletPool.release(b);
    this.bullets.length = 0;
    this.enemyBulletCount = 0;
    this.playerBulletCount = 0;
  }

  hit(e, damage) {
    if (e.hp <= 0) return;
    if (e.elite) damage *= ELITE_AFFIXES[e.elite].damageTaken || 1;
    e.hp -= damage;
    if (
      damage > 0 &&
      this.time >= (e.nextImpact || 0) &&
      this.impacts.length < 24
    ) {
      e.nextImpact = this.time + 0.09;
      this.impacts.push({
        x: e.x,
        y: e.y,
        r: e.kind === "boss" ? 32 : 18,
        kind: "hit",
        angle: this.player.angle,
        life: 0.16,
        maxLife: 0.16,
      });
    }
    e.flash = 0.08;
    if (
      this.time - (e.lastNumber || -1) > 0.12 &&
      this.damageNumbers.length < 32 &&
      damage > 3
    ) {
      e.lastNumber = this.time;
      this.damageNumbers.push({
        x: e.x,
        y: e.y - e.r,
        value: Math.round(damage),
        life: 0.6,
      });
    }
    if (e.hp <= 0) {
      killBuild(this, e);
      this.kills++;
      this.combo++;
      this.comboTime = 3.5;
      this.score += Math.round(e.score * (route(this).gain || 1));
      if (e.elite) {
        this.dropItem(e.x, e.y, "cache");
        this.popup(
          e.x,
          e.y - 30,
          `精英擊破 · ${ELITE_AFFIXES[e.elite].name}`,
          e.eliteColor,
        );
        const ring = ELITE_AFFIXES[e.elite].deathRing;
        for (let i = 0; i < (ring || 0); i++)
          this.enemyBullet(e, (i / ring) * Math.PI * 2, 120, "petal");
      }
      if (e.kind === "carrier") {
        this.dropItem(e.x, e.y, "cache");
        this.dropItem(e.x - 40, e.y, "power");
        for (let i = 0; i < CARRIER.medals; i++)
          this.dropItem(e.x + 30 + i * 22, e.y - 10 + (i % 2) * 20, "medal");
        this.popup(e.x, e.y - 40, "補給艦擊破", "#ffd27a");
        this.events.emit("carrier", e);
      }
      const squad = e.squad && this.squads.get(e.squad);
      if (squad && ++squad.killed >= squad.size) {
        this.squads.delete(e.squad);
        const item = SQUAD_REWARDS[this.squadBonuses++ % SQUAD_REWARDS.length];
        this.dropItem(e.x, e.y, item);
        this.score += 50 * squad.size;
        this.popup(e.x, e.y - 24, `SQUADRON ×${squad.size}`, "#9dfcff");
        this.events.emit("squad", squad);
      }
      if (e.kind === "boss") {
        this.xp += e.xp * this.player.xpFactor;
        // Bosses shower medals and repairs for the stage-clear moment.
        for (let i = 0; i < 8; i++)
          this.dropItem(
            e.x + Math.cos(i * 0.785) * 70,
            e.y + Math.sin(i * 0.785) * 50,
            i % 4 === 3 ? "repair" : "medal",
          );
      } else {
        if (this.drops.length < 750)
          this.drops.push({ x: e.x, y: e.y, value: e.xp });
        else {
          let drop = this.drops[this.ids % this.drops.length];
          drop.value += e.xp;
        }
      }
      if (this.explosions.length < 48)
        this.explosions.push({
          x: e.x,
          y: e.y,
          r: e.kind === "boss" ? 180 : 35 + e.r,
          life: e.kind === "boss" ? 1.2 : 0.55,
          maxLife: e.kind === "boss" ? 1.2 : 0.55,
        });
      this.burst(e.x, e.y, "#ffae55", e.kind === "boss" ? 50 : 9);
      if (e.kind !== "boss" && this.rings.length < 24)
        this.rings.push({
          x: e.x,
          y: e.y,
          r: e.r,
          speed: 220 + e.r * 6,
          life: 0.32,
          maxLife: 0.32,
          color: "#ffcf8a",
        });
      if (e.kind === "boss") {
        this.flash = 0.9;
        this.shake = 16;
        for (let i = 0; i < 7 && this.explosions.length < 48; i++)
          this.explosions.push({
            x: e.x + this.rng.range(-110, 110),
            y: e.y + this.rng.range(-80, 80),
            r: this.rng.range(70, 140),
            life: 0.7 + i * 0.12,
            maxLife: 0.7 + i * 0.12,
          });
      }
      this.events.emit("kill", e);
      if (e.kind === "boss") {
        this.bossKills++;
        rankSector(this);
        this.killedBosses.push(e.bossId);
        this.clearEnemyBullets();
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
    if (p.invuln > 0 || this.debugInvincible || this.state !== "playing")
      return;
    damage *= this.difficulty.damage * (route(this).enemyDamage || 1);
    this.sector.hits++;
    const absorbed = Math.min(p.shield, damage);
    p.shield -= absorbed;
    if (absorbed > 0 && p.shield === 0) shieldBreakBuild(this);
    p.hp = Math.max(0, p.hp - (damage - absorbed));
    p.invuln = 0.8;
    p.sinceHit = 0;
    this.shake = 7;
    this.burst(p.x, p.y, "#ff8fa0", 12);
    this.events.emit("hurt", {});
    if (p.hp <= 0) this.finish();
  }
  blast(x, y, r, damage, color) {
    if (this.rings.length >= 32) this.rings.shift();
    this.rings.push({
      x,
      y,
      r: 0,
      speed: r * 2,
      life: 0.5,
      maxLife: 0.5,
      color,
    });
    damage *= this.player.blastMul || 1;
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
  // Each offer carries a rolled grade; caches guarantee rare or better.
  offer(excluded = []) {
    return choices(this, excluded).map((u) => ({
      ...u,
      grade: rollGrade(this, this.upgradeGuaranteed),
    }));
  }
  queueUpgrade(guaranteed = false) {
    if (this.state === "defeat") return;
    this.pickQueue.push(guaranteed);
    if (!this.options.length) this.nextPick();
    else this.events.emit("upgrade", this.options);
  }
  // Advance to the next queued pick; the side panel shows options while play continues.
  nextPick() {
    if (!this.pickQueue.length) {
      this.options = [];
      this.upgradeGuaranteed = false;
    } else {
      this.upgradeGuaranteed = this.pickQueue.shift();
      this.options = this.offer();
    }
    this.events.emit("upgrade", this.options);
  }
  get pendingPicks() {
    return (this.options.length ? 1 : 0) + this.pickQueue.length;
  }
  reroll() {
    if (!this.options.length || this.rerolls <= 0) return false;
    this.rerolls--;
    this.options = this.offer(this.options.map((u) => u.id));
    this.events.emit("upgrade", this.options);
    return true;
  }
  // Banishing removes an upgrade from this run's pool and refills only that slot.
  banish(id) {
    if (
      !this.options.length ||
      this.banishes <= 0 ||
      !this.options.some((u) => u.id === id)
    )
      return false;
    this.banishes--;
    this.banished.add(id);
    const keep = this.options.filter((u) => u.id !== id),
      fresh = this.offer(this.options.map((u) => u.id)).find(
        (u) => !keep.some((k) => k.id === u.id),
      );
    this.options = this.options
      .map((u) => (u.id === id ? fresh : u))
      .filter(Boolean);
    this.events.emit("upgrade", this.options);
    return true;
  }
  continueEndless() {
    if (
      this.state !== "defeat" ||
      !this.result?.clear ||
      this.mode !== "campaign"
    )
      return false;
    this.previousSettlement = { ...this.result };
    this.mode = "endless";
    this.wave++;
    this.waveTime = 0;
    this.mapIndex = 0;
    this.map = MAPS[0];
    this.enemies = [];
    this.squads.clear();
    this.resetProjectiles();
    this.drops = [];
    this.mines = [];
    this.strikes = [];
    this.ultimate = null;
    this.stasis = 0;
    this.spawnTimer = 1;
    this.player.hp = this.player.maxHp;
    this.player.shield = this.player.maxShield;
    this.player.invuln = 2;
    this.settled = false;
    this.result = null;
    this.state = "intermission";
    this.events.emit("map", this.map);
    this.events.emit("wave", this.wave);
    this.events.emit("intermission", this.map);
    return true;
  }
  choose(id) {
    const option = this.options.find((u) => u.id === id);
    if (this.state === "defeat" || !option) return false;
    if (!applyUpgrade(this, id)) return false;
    const grade = option.grade;
    for (let i = 1; i < (grade?.levels || 1); i++) applyUpgrade(this, id);
    if (grade?.heal)
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + this.player.maxHp * grade.heal,
      );
    if (grade?.reroll) this.rerolls += grade.reroll;
    updateResonance(this);
    checkEvolutions(this);
    this.events.emit("chosen", id);
    this.nextPick();
    return true;
  }
  skill() {
    const p = this.player;
    if (this.state !== "playing" || p.cooldown > 0) return false;
    p.cooldown = this.pilot.cooldown * p.cooldownFactor;
    abilities[this.pilot.skill]?.(this);
    this.flash = Math.max(this.flash, 0.4);
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
    dashBuild(this);
    this.events.emit("dash", {});
    return true;
  }
  supply(id, routeId = "standard") {
    if (this.state !== "intermission") return false;
    this.state = "playing";
    this.routeId = routeId;
    resetSector(this);
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
  finish(clear = false, reason = clear ? "clear" : "defeat") {
    if (this.state === "defeat") return;
    this.state = "defeat";
    this.result = {
      clear,
      reason,
      testing: !!this.testing,
      pilot: this.pilot.id,
      bossKills: this.bossKills,
      score: this.score,
      wave: this.wave,
      kills: this.kills,
      time: this.time,
      reward: Math.floor(
        (Math.max(15, Math.floor(this.score / 35) + this.wave * 8) +
          this.bonusCredits +
          (clear || this.previousSettlement ? 350 : 0)) *
          this.rewardFactor,
      ),
    };
    if (this.previousSettlement) {
      const prev = this.previousSettlement;
      this.result.continuation = true;
      this.result.bondWaves = this.wave - prev.wave;
      this.result.kills = Math.max(0, this.kills - prev.kills);
      this.result.bossKills = Math.max(0, this.bossKills - prev.bossKills);
      this.result.reward = Math.max(0, this.result.reward - prev.reward);
    }
    this.events.emit("defeat", this.result);
  }
}
