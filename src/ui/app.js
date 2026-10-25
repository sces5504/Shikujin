import { bindCombatAction } from "../core/input.js";
import { DebugUI } from "./debug.js";
import { WEAPONS } from "../content/weapons.js";
import { BondUI } from "./bond.js";
import { portraitStyle } from "./portraits.js";
import { MetaUI } from "./meta.js";
import { SUPPLIES } from "../content/encounters.js";
import { EVOLUTIONS } from "../content/progression.js";
import { SHIPS, PILOTS, UPGRADES, RULES } from "../content/catalog.js";
import { World } from "../game/world.js";
import { drawShip } from "../render/renderer.js";
import { ROUTES, RESONANCE_TIERS } from "../content/depth.js";
import { tagLevels, resonanceOf, upgradeTags, route } from "../game/depth.js";
const $ = (id) => document.getElementById(id);
const pad = (n, width = 2) => String(Math.floor(n)).padStart(width, "0");
export class App {
  constructor(store, renderer, audio, input) {
    this.store = store;
    this.renderer = renderer;
    this.audio = audio;
    this.input = input;
    this.world = null;
    this.ship = store.data.ship;
    this.pilot = store.data.pilot;
    this.toastTimer = null;
    this.commsUntil = 0;
    this.bannerUntil = 0;
    this.menu = null;
    this.lastHud = 0;
    this.previewCtx = $("shipPreview").getContext("2d");
    $("settingsButton").onclick = () => this.settings();
    $("helpButton").onclick = () => this.help();
    $("launch").onclick = () => this.launch();
    $("pauseButton").onclick = () => this.pause();
    bindCombatAction($("dashButton"), () => this.world?.dash(this.input.get()));
    bindCombatAction($("skillButton"), () => this.world?.skill());
    window.addEventListener("keydown", (e) => {
      if (
        e.repeat ||
        this.menu === "debug" ||
        e.target.closest?.("input,textarea,select")
      )
        return;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight")
        this.world?.dash(this.input.get());
      if (
        this.world?.state === "playing" &&
        this.world.options.length &&
        ["Digit1", "Digit2", "Digit3"].includes(e.code)
      ) {
        this.choose(this.world.options[Number(e.code.slice(-1)) - 1]?.id);
      }
      if (
        (e.code === "Escape" || e.code === "KeyP") &&
        this.world?.state === "playing"
      ) {
        this.pause();
        return;
      }
      if (
        (e.code === "Escape" || e.code === "KeyP") &&
        this.world?.state === "paused"
      ) {
        if (this.menu === "settings") {
          this.world.resume();
          this.pause();
        } else this.resume();
      } else if (e.code === "Escape" && this.menu && !this.world)
        this.closeModal();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pause(false);
    });
    window.addEventListener("blur", () => this.pause(false));
    this.bond = new BondUI(this);
    this.meta = new MetaUI(this);
    this.meta.updateLabel();
    this.applySettings();
    this.hangar();
    this.debug = new DebugUI(this);
  }
  applySettings() {
    const quality = this.store.data.quality || "auto";
    if (this.renderer.quality !== quality) {
      this.renderer.quality = quality;
      this.renderer.resolution = 1;
      this.renderer.resize();
    }
    this.audio.enabled = this.store.data.sound;
    this.audio.music = this.store.data.music;
    this.renderer.reduced =
      this.store.data.reduced ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  save() {
    if (!this.store.write()) this.toast("瀏覽器無法儲存進度；目前仍可遊玩。");
  }
  toast(text) {
    $("toast").textContent = text;
    $("toast").classList.add("visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(
      () => $("toast").classList.remove("visible"),
      3500,
    );
  }
  hangar() {
    this.world = null;
    this.input.active = false;
    this.input.clear();
    $("hangar").classList.remove("hidden");
    $("hud").classList.add("hidden");
    this.closeModal();
    $("credits").textContent = this.store.data.credits.toLocaleString();
    $("bestWave").innerHTML =
      `${pad(this.store.data.bestWave)}<span> WAVES</span>`;
    $("bestScore").textContent = pad(this.store.data.bestScore, 5);
    this.drawLoadout();
  }
  drawLoadout() {
    const s = SHIPS.find((s) => s.id === this.ship),
      p = PILOTS.find((p) => p.id === this.pilot);
    const owned = this.store.data.owned.includes(s.id);
    $("shipList").innerHTML = SHIPS.map(
      (ship) =>
        `<button class="ship-option ${ship.id === s.id ? "selected" : ""}" data-ship="${ship.id}" aria-label="選擇 ${ship.name}${this.store.data.owned.includes(ship.id) ? "" : `，${ship.cost} 信用點`}" aria-pressed="${ship.id === s.id}"><div class="ship-icon" style="background-position:${(ship.shape % 3) * 50}% ${Math.floor(ship.shape / 3) * 100}%"></div><span>${ship.name}</span>${this.store.data.owned.includes(ship.id) ? "" : `<em>✧ ${ship.cost}</em>`}</button>`,
    ).join("");
    document.querySelectorAll("[data-ship]").forEach(
      (el) =>
        (el.onclick = () => {
          this.ship = el.dataset.ship;
          if (this.store.data.owned.includes(this.ship)) {
            this.store.data.ship = this.ship;
            this.save();
          }
          this.drawLoadout();
        }),
    );
    $("shipName").innerHTML = `${s.name} <span>${s.en}</span>`;
    $("shipNumber").textContent = pad(s.shape + 1);
    $("shipRole").textContent = s.role;
    $("shipDescription").textContent = WEAPONS[s.weapon].description;
    $("shipRole").textContent = `${s.role} / ${WEAPONS[s.weapon].name}`;
    $("shipStats").innerHTML = [
      ["裝甲", s.hp, s.hp / 180],
      ["機動", s.speed, s.speed / 330],
      ["火力", Math.round(s.damage / s.interval), s.damage / s.interval / 100],
    ]
      .map(
        ([name, value, ratio]) =>
          `<div class="stat"><div><span>${name}</span><b>${value}</b></div><div class="stat-track"><i style="width:${Math.min(100, ratio * 100)}%"></i></div></div>`,
      )
      .join("");
    $("pilotList").innerHTML = PILOTS.map(
      (pilot, i) =>
        `<button class="pilot-option ${pilot.id === p.id ? "selected" : ""}" data-pilot="${pilot.id}" aria-label="選擇駕駛員 ${pilot.name}" aria-pressed="${pilot.id === p.id}"><div class="portrait" style="${portraitStyle(pilot)}"></div><span>${pilot.en}</span></button>`,
    ).join("");
    document.querySelectorAll("[data-pilot]").forEach(
      (el) =>
        (el.onclick = () => {
          this.pilot = el.dataset.pilot;
          this.store.data.pilot = this.pilot;
          this.save();
          this.drawLoadout();
        }),
    );
    $("pilotName").textContent = p.name;
    $("pilotTitle").textContent = p.title;
    $("pilotPassive").textContent =
      `被動 · ${p.passive} / 默契 LV.${1 + Math.min(10, Math.floor((this.store.data.bond[p.id] || 0) / 100))}`;
    $("pilotAbility").textContent = `${p.ability} / ${p.cooldown}s`;
    $("pilotSkillDescription").textContent = p.description;
    $("launch").innerHTML = owned
      ? "出 擊 <span>SORTIE →</span>"
      : `解鎖機體 <span>✧ ${s.cost}</span>`;
  }
  launch() {
    const ship = SHIPS.find((s) => s.id === this.ship);
    if (!this.store.data.owned.includes(ship.id)) {
      if (this.store.data.credits < ship.cost) {
        this.toast(
          `信用點不足：還需要 ${ship.cost - this.store.data.credits} 點。出擊可獲得信用點。`,
        );
        return;
      }
      this.store.buy(ship.id);
      this.store.data.ship = ship.id;
      this.save();
      this.toast(`${ship.name}已加入機庫`);
      $("credits").textContent = this.store.data.credits;
      this.drawLoadout();
      return;
    }
    this.audio.unlock();
    this.audio.tone(440, 0.3);
    this.store.data.ship = this.ship;
    this.save();
    this.world = new World({
      ship: this.ship,
      pilot: this.pilot,
      mode: this.store.data.mode,
      difficulty: this.store.data.difficulty,
      research: this.store.data.research,
      bond: this.store.data.bond[this.pilot] || 0,
    });
    const w = this.world;
    this.input.active = true;
    this.input.clear();
    $("hangar").classList.add("hidden");
    $("hud").classList.remove("hidden");
    $("pickPanel").classList.add("hidden");
    $("buildIcons").innerHTML = "";
    this.closeModal();
    $("hudPilot").textContent = w.pilot.en;
    $("hudShip").textContent = w.ship.name;
    $("skillName").textContent = w.pilot.ability;
    const i = PILOTS.indexOf(w.pilot);
    $("commsPortrait").style.cssText = portraitStyle({
      ...w.pilot,
      portrait: w.pilot.radioPortrait || w.pilot.portrait,
    });
    $("commsName").textContent = `${w.pilot.en} / ${w.pilot.name}`;
    w.events.on("intermission", () => this.intermission());
    w.events.on("evolution", (e) => {
      this.banner(e.name, "ULTIMATE EVOLUTION · 武裝進化");
      this.audio.tone(1200, 0.5);
      this.comms("武裝進化完成！我們已經超越極限。");
    });
    w.events.on("bossPhase", (e) => {
      this.banner("PHASE II", `${e.name} · 核心解放`);
      this.comms("敵方進入第二階段！注意彈幕變化。");
    });
    w.events.on("dash", () => this.audio.tone(180, 0.1, "triangle", 0.02));
    w.events.on("shoot", () => this.audio.shoot());
    w.events.on("hurt", () => {
      this.audio.tone(100, 0.16, "sawtooth", 0.03);
      if (w.player.hp / w.player.maxHp < 0.35)
        this.comms("裝甲臨界！拉開距離，等待護盾恢復。");
    });
    w.events.on("kill", (e) => {
      if (e.kind === "boss") this.audio.tone(100, 0.8, "triangle", 0.12);
    });
    w.events.on("pickup", () => {});
    w.events.on("item", (item) =>
      this.audio.tone(item === "medal" ? 1320 : 980, 0.12, "triangle", 0.04),
    );
    w.events.on("squad", () => this.audio.tone(1560, 0.18, "sine", 0.035));
    w.events.on("resonance", (r) => {
      this.banner(
        `${r.name} ${"◆".repeat(r.tier)}`,
        `流派共鳴 · ${r.text[r.tier - 1]}`,
      );
      this.audio.tone(1100, 0.35, "triangle", 0.06);
      this.updateBuild();
    });
    w.events.on("carrierIncoming", () =>
      this.comms("補給運輸艦通過空域！擊落它就能回收強化晶片。"),
    );
    w.events.on("carrier", () => this.audio.tone(700, 0.4, "triangle", 0.06));
    w.events.on("upgrade", () => this.upgrade());
    w.events.on("wave", (wave) => {
      this.banner(
        `WAVE ${pad(wave)}`,
        wave % RULES.bossEvery === 0
          ? "首領接近 · 準備迎擊"
          : wave % RULES.surgeEvery === 0
            ? "大量敵人來襲 · 突破包圍"
            : "新的敵群正在接近",
      );
      if (wave % RULES.surgeEvery === 0) this.comms(w.pilot.lines[1]);
    });
    w.events.on("boss", () => {
      const warning = $("bossWarning");
      warning.classList.remove("active");
      void warning.offsetWidth;
      warning.classList.add("active");
      this.comms("偵測到高能量反應。首領進入作戰空域！");
      this.audio.tone(160, 0.6, "sawtooth", 0.04);
    });
    w.events.on("map", (map) => {
      this.banner(map.en, `進入新空域 · ${map.name}`);
    });
    w.events.on("bossKilled", () => {
      this.comms("首領擊破！航道已開啟，準備躍遷。");
    });
    w.events.on("skill", () => {
      this.ultimateCutin();
      this.comms(w.pilot.lines[2]);
      this.audio.tone(800, 0.4, "triangle", 0.07);
    });
    w.events.on("defeat", (r) => this.defeat(r));
    this.comms(w.pilot.lines[0]);
    this.banner("SORTIE COMMENCED", "海岸防衛線 · 蒼藍海岸");
    this.updateBuild();
    this.lastHud = 0;
    this.renderHud();
  }
  ultimateCutin() {
    const p = this.world.pilot;
    $("ultimateArt").style.cssText = portraitStyle({
      ...p,
      portrait: p.burstPortrait || p.ultimatePortrait || p.portrait,
    });
    $("ultimatePilot").textContent = `${p.en} / ${p.name}`;
    $("ultimateName").textContent = p.ability;
    $("ultimateOverlay").style.setProperty("--burst-color", p.color);
    $("ultimateOverlay").classList.remove("active");
    void $("ultimateOverlay").offsetWidth;
    $("ultimateOverlay").classList.add("active");
    this.ultimateUntil = performance.now() + 1900;
  }
  comms(line) {
    $("commsLine").textContent = line;
    $("comms").classList.add("visible");
    this.commsUntil = performance.now() + 6500;
  }
  banner(title, sub) {
    $("waveBanner").querySelector("strong").textContent = title;
    $("waveBanner").querySelector("span").textContent = sub;
    $("waveBanner").classList.add("visible");
    this.bannerUntil = performance.now() + 3000;
  }
  modal(html, name) {
    this.menu = name;
    $("overlayContent").innerHTML = html;
    $("overlay").classList.remove("hidden");
    this.input.active = false;
    requestAnimationFrame(() =>
      $("overlayContent")
        .querySelector("button")
        ?.focus({ preventScroll: true }),
    );
  }
  closeModal() {
    this.menu = null;
    $("credits").textContent = this.store.data.credits.toLocaleString();
    $("overlay").classList.add("hidden");
    $("overlayContent").innerHTML = "";
    if (this.world?.state === "playing") this.input.active = true;
  }
  // Non-blocking pick panel: combat keeps running while the player chooses.
  upgrade() {
    const w = this.world,
      panel = $("pickPanel");
    if (!w || !w.options.length) {
      panel.classList.add("hidden");
      panel.innerHTML = "";
      return;
    }
    const levels = tagLevels(w),
      fresh = panel.classList.contains("hidden");
    // Each card shows its grade and how far it pushes each tag toward the next resonance tier.
    const tagLine = (u) =>
      upgradeTags(u)
        .map((tag) => {
          const now = levels[tag] || 0,
            gain = Math.min(
              u.max - (w.upgrades[u.id] || 0),
              u.grade?.levels || 1,
            ),
            next = RESONANCE_TIERS.find((t) => t > now),
            hit = next && now + gain >= next;
          return `<span class="tag-chip ${hit ? "tier-up" : ""}">${tag} ${now}→${now + gain}${next ? `/${next}` : ""}</span>`;
        })
        .join("");
    panel.innerHTML = `<div class="pick-head"><b>${w.upgradeGuaranteed ? "強化晶片" : "待選強化"}</b><span>×${w.pendingPicks}</span><button id="rerollUpgrade" ${w.rerolls <= 0 ? "disabled" : ""} title="重新解析">↻ ${w.rerolls}</button></div>${w.options
      .map(
        (u, i) =>
          `<div class="pick-slot"><button class="pick-card grade-${u.grade?.id || "common"}" data-upgrade="${u.id}" style="--grade:${u.grade?.color || "#9fd8e0"}" title="${u.description}"><kbd>${i + 1}</kbd><span class="pick-icon">${u.icon}</span><span class="pick-body"><b>${u.name}</b><small>${u.grade?.name || ""} · LV.${w.upgrades[u.id] || 0}→${Math.min(u.max, (w.upgrades[u.id] || 0) + (u.grade?.levels || 1))}</small><em>${u.description}</em><span class="tag-row">${tagLine(u)}</span></span></button><button class="pick-banish" data-banish="${u.id}" ${w.banishes <= 0 ? "disabled" : ""} title="封印：永久移出本局卡池（剩 ${w.banishes}）">✕</button></div>`,
      )
      .join("")}<div class="pick-hint">按 1／2／3 或點選 · 戰鬥不暫停</div>`;
    panel.classList.remove("hidden");
    if (fresh) {
      panel.classList.remove("arrive");
      void panel.offsetWidth;
      panel.classList.add("arrive");
      this.audio.tone(900, 0.12, "triangle", 0.03);
    }
    // pointerdown activation works with a second finger while the first keeps steering.
    bindCombatAction($("rerollUpgrade"), () => w.reroll());
    panel
      .querySelectorAll("[data-upgrade]")
      .forEach((el) =>
        bindCombatAction(el, () => this.choose(el.dataset.upgrade)),
      );
    panel
      .querySelectorAll("[data-banish]")
      .forEach((el) => bindCombatAction(el, () => w.banish(el.dataset.banish)));
  }
  choose(id) {
    if (this.world?.choose(id)) {
      this.audio.tone(600, 0.12);
      this.updateBuild();
    }
  }
  intermission() {
    const w = this.world,
      rank = w.ranks.at(-1),
      // UI-only randomness: never consume the seeded simulation RNG here.
      offered = [
        ROUTES[0],
        ...ROUTES.slice(1)
          .map((r) => [Math.random(), r])
          .sort((a, b) => a[0] - b[0])
          .slice(0, 2)
          .map(([, r]) => r),
      ];
    let chosen = "standard";
    this.modal(
      `<div class="modal-eyebrow">SECTOR CLEARED / HYPERSPACE TRANSIT</div>${
        rank
          ? `<div class="sector-rank" style="--rank:${rank.color}"><b>${rank.rank}</b><div><small>SECTOR RANK</small><span>被擊中 ${rank.hits} 次 · 擊破 ${rank.kills} · 勳章 ${rank.medals} · ${Math.round(rank.time)} 秒</span><span>獎勵 +${rank.credits} 信用點 · +${rank.score} 分</span></div></div>`
          : ""
      }<h2 class="modal-title">星門已開啟</h2><p class="modal-subtitle">下一站：${w.map.name}。先選擇航線，再選擇補給出發。</p><div class="route-grid">${offered
        .map(
          (r) =>
            `<button class="route-card ${r.id === "standard" ? "selected" : ""}" data-route="${r.id}"><span>${r.icon}</span><b>${r.name}</b><small>${r.description}</small></button>`,
        )
        .join(
          "",
        )}</div><div class="upgrade-grid">${SUPPLIES.map((s) => `<button class="upgrade-card" data-supply="${s.id}"><div class="rarity">ORBITAL RESUPPLY</div><div class="upgrade-icon">${s.icon}</div><h3>${s.name}</h3><p>${s.description}</p></button>`).join("")}</div>`,
      "intermission",
    );
    document.querySelectorAll("[data-route]").forEach(
      (b) =>
        (b.onclick = () => {
          chosen = b.dataset.route;
          document
            .querySelectorAll("[data-route]")
            .forEach((x) => x.classList.toggle("selected", x === b));
        }),
    );
    document.querySelectorAll("[data-supply]").forEach(
      (b) =>
        (b.onclick = () => {
          this.closeModal();
          w.supply(b.dataset.supply, chosen);
          this.input.active = w.state === "playing";
          this.input.clear();
          const r = route(w);
          if (r.id !== "standard") this.banner(r.name, r.description);
        }),
    );
  }
  updateBuild() {
    const w = this.world;
    $("buildIcons").innerHTML =
      w.evolutions
        .map((id) => {
          const e = EVOLUTIONS.find((e) => e.id === id);
          return `<div class="build-item evolved" title="${e.name}">${e.icon}</div>`;
        })
        .join("") +
      Object.entries(w.resonance)
        .map(([tag, tier]) => {
          const r = resonanceOf(tag);
          return `<div class="build-item resonance tier-${tier}" title="${r.name}：${r.text.slice(0, tier).join("、")}">${tag}<small>${"◆".repeat(tier)}</small></div>`;
        })
        .join("") +
      Object.entries(w.upgrades)
        .map(([id, n]) => {
          const u = UPGRADES.find((u) => u.id === id);
          return `<div class="build-item" title="${u.name} ×${n}">${u.icon}<small>${n}</small></div>`;
        })
        .join("");
  }
  pause(toggle = true) {
    const w = this.world;
    if (!w) return;
    if (w.state === "paused" && toggle) {
      this.resume();
      return;
    }
    if (w.state !== "playing") return;
    w.pause();
    this.input.clear();
    this.modal(
      `<div class="panel"><div class="modal-eyebrow">FLIGHT SUSPENDED</div><h2 class="modal-title">暫停作戰</h2><p class="modal-subtitle">深呼吸。星海會等你。</p><div class="modal-actions"><button id="resume" class="primary-button">繼續作戰</button><button id="inGameSettings" class="secondary-button">音效與畫面設定</button><button id="abandon" class="secondary-button">結算並返回機庫</button></div></div>`,
      "pause",
    );
    $("resume").onclick = () => this.resume();
    $("inGameSettings").onclick = () => this.settings(true);
    $("abandon").onclick = () => w.finish(false, "retreat");
  }
  resume() {
    this.audio.unlock();
    this.world?.resume();
    this.closeModal();
    this.input.clear();
  }
  settings(inGame = false) {
    this.modal(
      `<div class="panel"><div class="modal-eyebrow">SYSTEM CONFIGURATION</div><h2 class="modal-title">系統設定</h2><div class="settings-row"><div>作戰音效<small>射擊、升級與事件提示音</small></div><button id="soundToggle" class="toggle"></button></div><div class="settings-row"><div>原創星海配樂<small>隨戰況變化的合成器音樂</small></div><button id="musicToggle" class="toggle"></button></div><div class="settings-row"><div>畫質與效能<small>自動調整只影響顯示，不刪除敵彈或碰撞</small></div><button id="qualityToggle" class="toggle"></button></div><div class="settings-row"><div>減少動態效果<small>減少粒子與閃光，關閉鏡頭震動</small></div><button id="reducedToggle" class="toggle"></button></div><p class="modal-subtitle">進度僅保存在這個瀏覽器；戰鬥中途不存檔。</p><div class="save-actions"><button id="exportSave" class="secondary-button">匯出存檔</button><label class="secondary-button">匯入存檔<input id="importSave" type="file" accept="application/json,.json" hidden></label></div><div class="modal-actions"><button id="closeSettings" class="primary-button">返回</button></div></div>`,
      "settings",
    );
    const update = () => {
      $("qualityToggle").textContent = {
        auto: "自動",
        high: "高畫質",
        performance: "效能",
      }[this.store.data.quality || "auto"];
      $("musicToggle").textContent = this.store.data.music ? "ON" : "OFF";
      $("soundToggle").textContent = this.store.data.sound ? "ON" : "OFF";
      $("reducedToggle").textContent = this.store.data.reduced ? "ON" : "OFF";
    };
    update();
    $("qualityToggle").onclick = () => {
      const modes = ["auto", "high", "performance"];
      this.store.data.quality =
        modes[(modes.indexOf(this.store.data.quality || "auto") + 1) % 3];
      this.applySettings();
      this.save();
      update();
    };
    $("musicToggle").onclick = () => {
      this.store.data.music = !this.store.data.music;
      this.applySettings();
      this.audio.unlock();
      this.save();
      update();
    };
    $("soundToggle").onclick = () => {
      this.store.data.sound = !this.store.data.sound;
      this.applySettings();
      this.audio.unlock();
      this.save();
      update();
    };
    $("reducedToggle").onclick = () => {
      this.store.data.reduced = !this.store.data.reduced;
      this.applySettings();
      this.save();
      update();
    };
    if ($("exportSave")) $("exportSave").onclick = () => this.meta.exportSave();
    if ($("importSave"))
      $("importSave").onchange = (e) => {
        if (inGame) {
          this.toast("請先返回機庫再匯入存檔。");
          return;
        }
        this.meta.importSave(e.target.files[0]);
      };
    $("closeSettings").onclick = () => {
      this.closeModal();
      if (inGame) {
        this.world.resume();
        this.pause();
      }
    };
  }
  help() {
    this.modal(
      `<div class="panel"><div class="modal-eyebrow">PILOT FIELD MANUAL</div><h2 class="modal-title">飛行指南</h2><div class="guide-copy"><p><b>移動與射擊</b><br>WASD／方向鍵移動；手機或滑鼠在戰場上拖曳，戰機 1:1 跟隨手指。主砲持續向前開火，雷射會彎向鎖定目標。</p><p><b>編隊與道具</b><br>整隊擊落敵方編隊會掉落道具：★勳章（連續拾取分數倍增，漏接會斷鏈）、P 火力全開、B 大絕充能、+ 裝甲修復。飛到畫面上方黃色箭頭線以上，會自動吸取所有掉落物。</p><p><b>強化與技能</b><br>靠近綠色經驗晶體即可吸收，升級時三選一。Shift／衝刺按鈕可短暫無敵閃避，空白鍵或右下角按鈕釋放駕駛員技能。5 秒未受傷後，護盾會自動恢復。</p><p><b>波次與返航</b><br>每 3 波有大量敵潮，每 5 波出現 Boss。擊敗 Boss 後前往新地圖。ESC／P 暫停，可隨時結算返航。結算信用點用於解鎖機體。</p></div><div class="modal-actions"><button id="closeHelp" class="primary-button">準備就緒</button></div></div>`,
      "help",
    );
    $("closeHelp").onclick = () => this.closeModal();
  }
  defeat(result) {
    const w = this.world;
    if (!w.settled) {
      w.settled = true;
      this.store.settle(result);
      if (!this.store.available) this.toast("進度無法寫入瀏覽器儲存空間。");
    }
    this.input.active = false;
    this.input.clear();
    $("pickPanel").classList.add("hidden");
    this.audio.tone(180, 0.8, "triangle");
    const retreat = result.reason === "retreat";
    const damaged = !result.clear && !retreat;
    this.modal(
      `<div class="result-layout"><div class="result-art portrait ${damaged ? "damaged" : ""}" style="${portraitStyle(w.pilot, damaged)}"></div><div class="result-data"><div class="modal-eyebrow" style="color:#ff96ac">${result.clear ? "MISSION COMPLETE / DAWN RISING" : retreat ? "MISSION DEBRIEF / SAFE RETURN" : "SIGNAL LOST / RETURN TO BASE"}</div><h2 class="modal-title">${result.clear ? "破曉之時，與你同在。" : retreat ? "平安返航，整備再出發。" : "航跡未完，待續。"}</h2><p class="result-quote">${w.pilot.name}：「${result.clear ? "星海重歸寧靜。謝謝你，陪我飛到了最後。下一段航程，也一起吧。" : retreat ? "作戰資料已帶回。休息一下，再一起出擊吧。" : w.pilot.defeat}」</p><div class="result-stats"><div><small>抵達波次</small><b>${pad(result.wave)}</b></div><div><small>作戰分數</small><b>${pad(result.score, 5)}</b></div><div><small>敵機擊破</small><b>${result.kills}</b></div><div><small>生存時間</small><b>${pad(result.time / 60)}:${pad(result.time % 60)}</b></div></div>${w.ranks.length ? `<div class="rank-strip"><small>各章評價</small>${w.ranks.map((r) => `<b style="color:${r.color}">${r.rank}</b>`).join("")}</div>` : ""}<div class="reward"><span>✧ 獲得信用點</span><b>+ ${result.reward}</b></div><div class="modal-actions">${result.clear && w.mode === "campaign" ? `<button id="continueEndless" class="primary-button">繼續遠征 · 無盡第 2 輪</button>` : ""}<button id="retry" class="primary-button">再次出擊</button><button id="returnHangar" class="secondary-button">返回機庫 · 更換搭檔</button></div></div></div>`,
      "defeat",
    );
    if ($("continueEndless"))
      $("continueEndless").onclick = () => w.continueEndless();
    $("retry").onclick = () => this.launch();
    $("returnHangar").onclick = () => this.hangar();
  }
  renderHud() {
    const w = this.world;
    if (!w) return;
    const p = w.player;
    $("boundaryWarning").classList.add("hidden");
    $("navigation").textContent =
      `${w.map.name}${w.routeId !== "standard" ? ` · ${route(w).name}` : ""} / 航程 ${(w.scroll / 1000).toFixed(1)} km / ★×${w.medalChain}${w.stasis > 0 ? ` / 時間凍結 ${w.stasis.toFixed(1)}s` : ""}${w.testing ? " / TEST FLIGHT" : ""}`;
    $("healthText").textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    $("shieldText").textContent = `SHIELD ${Math.ceil(p.shield)}`;
    $("healthFill").style.width = `${(p.hp / p.maxHp) * 100}%`;
    $("shieldFill").style.width =
      `${p.maxShield ? (p.shield / p.maxShield) * 100 : 0}%`;
    $("xpFill").style.width = `${(w.xp / w.nextXp) * 100}%`;
    $("levelText").textContent = `LV. ${pad(w.level)}`;
    $("mapText").textContent = w.map.en;
    $("waveText").textContent = `WAVE ${pad(w.wave)}`;
    $("timeText").textContent = `${pad(w.time / 60)}:${pad(w.time % 60)}`;
    $("scoreText").textContent = pad(w.score, 5);
    $("killsText").textContent = `${w.kills} 擊破`;
    $("comboHud").classList.toggle("visible", w.combo >= 5);
    $("comboCount").textContent = `${w.combo} ×`;
    $("skillCooldown").textContent =
      p.cooldown > 0 ? `${Math.ceil(p.cooldown)}s` : "BURST READY";
    $("dashCooldown").textContent =
      p.dash > 0 ? `${p.dash.toFixed(1)}s` : "SHIFT";
    $("dashButton").disabled = p.dash > 0 || w.state !== "playing";
    $("skillButton").disabled = p.cooldown > 0 || w.state !== "playing";
    const boss = w.enemies.find((e) => e.kind === "boss" && e.hp > 0);
    $("bossHud").classList.toggle("hidden", !boss);
    if (boss) {
      $("bossFill").style.width = `${(boss.hp / boss.maxHp) * 100}%`;
      $("bossName").textContent =
        `${boss.bossName} / ${boss.enraged ? "II" : "I"}`;
    }
  }
  frame(now) {
    if (now > (this.ultimateUntil || 0))
      $("ultimateOverlay").classList.remove("active");
    this.audio.scene = this.world?.state === "playing" ? "battle" : "hangar";
    this.audio.boss = !!this.world?.enemies.some(
      (e) => e.kind === "boss" && e.hp > 0,
    );
    if (now > this.commsUntil) $("comms").classList.remove("visible");
    if (now > this.bannerUntil) $("waveBanner").classList.remove("visible");
    if (now - this.lastHud > 80) {
      this.renderHud();
      this.lastHud = now;
    }
    if (!this.world) {
      const c = this.previewCtx,
        s = SHIPS.find((s) => s.id === this.ship);
      c.clearRect(0, 0, 620, 620);
      c.save();
      c.translate(310, 287 + Math.sin(now * 0.001) * 8);
      c.rotate(-0.25);
      const glow = c.createRadialGradient(0, 20, 0, 0, 20, 170);
      glow.addColorStop(0, s.color + "24");
      glow.addColorStop(1, s.color + "00");
      c.fillStyle = glow;
      c.fillRect(-200, -200, 400, 400);
      const model = this.renderer.cache.sprite("preview", s.shape);
      if (model) c.drawImage(model, -155, -155, 310, 310);
      else drawShip(c, 0, 0, -Math.PI / 2, s.color, s.shape, 106, now * 0.001);
      c.restore();
    }
  }
}
