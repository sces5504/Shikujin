import { SecretCode } from "../core/secret-code.js";
import { testLevels, testWave } from "../game/debug.js";
import { SHIPS, MAPS, UPGRADES, RULES } from "../content/catalog.js";
import { applyUpgrade } from "../game/upgrades.js";
import { checkEvolutions } from "../game/progression.js";
const $ = (id) => document.getElementById(id);
export class DebugUI {
  constructor(app) {
    this.app = app;
    this.code = new SecretCode();
    const button = document.createElement("button");
    button.id = "debugToggle";
    button.className = "debug-toggle hidden";
    button.textContent = "⚙ 測試工具";
    button.onclick = () => this.open();
    document.body.append(button);
    window.addEventListener(
      "keydown",
      (e) => {
        if (this.code.feed(e)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          button.classList.remove("hidden");
          this.open();
        } else if (e.key === "Escape" && app.menu === "debug") {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.close();
        }
      },
      true,
    );
  }
  open() {
    const a = this.app;
    if (a.menu === "debug") return;
    this.saved = {
      menu: a.menu,
      hidden: $("overlay").classList.contains("hidden"),
      nodes: [...$("overlayContent").childNodes],
      state: a.world?.state,
    };
    // Detach prior modal nodes so callbacks and upgrade choices survive the tool.
    $("overlayContent").replaceChildren();
    if (a.world?.state === "playing") a.world.pause();
    a.input.clear();
    a.modal(
      `<div class="panel debug-panel"><div class="modal-eyebrow">FLIGHT TEST CONSOLE</div><h2 class="modal-title">測試工具</h2><p class="modal-subtitle">戰鬥已暫停。信用點與機庫解鎖會立即存檔；局內調整只影響這次出擊。</p><div class="debug-status" id="debugStatus" role="status"></div><h3>機庫資源</h3><div class="debug-grid"><button data-debug="money">信用點 +1,000</button><button data-debug="rich">信用點 +10,000</button><button data-debug="ships">解鎖全部機體</button></div><h3>當前出擊</h3><div class="debug-grid"><button data-debug="level" data-live>等級 +1／隨機強化</button><button data-debug="levels" data-live>等級 +10／十項強化</button><button data-debug="heal" data-live>補滿生命與護盾</button><button data-debug="skill" data-live>重置大絕與衝刺</button><button data-debug="god" data-live>切換無敵</button><button data-debug="clear" data-live>清除敵彈</button></div><label class="debug-field">指定強化<select id="debugUpgrade">${UPGRADES.map((u) => `<option value="${u.id}">${u.name}</option>`).join("")}</select><button data-debug="upgrade" data-live>增加一級</button></label><label class="debug-field">跳至波次<input id="debugWave" type="number" min="1" max="999" value="${a.world?.wave || 1}"><button data-debug="wave" data-live>前往</button></label><label class="debug-field">切換地圖<select id="debugMap">${MAPS.map((m, i) => `<option value="${i}" ${a.world?.mapIndex === i ? "selected" : ""}>${m.name}</option>`).join("")}</select><button data-debug="map" data-live>前往</button></label><div class="debug-grid"><button data-debug="boss" data-live>進入下一個 Boss 波</button></div><div class="modal-actions"><button id="debugClose" class="primary-button">返回原畫面</button></div></div>`,
      "debug",
    );
    const live = !!a.world && a.world.state !== "defeat";
    document
      .querySelectorAll("[data-live]")
      .forEach((b) => (b.disabled = !live));
    document
      .querySelectorAll("[data-debug]")
      .forEach((b) => (b.onclick = () => this.action(b.dataset.debug)));
    $("debugClose").onclick = () => this.close();
    this.status();
  }
  status(message = "") {
    const a = this.app,
      w = a.world;
    $("debugStatus").textContent =
      `${message ? message + " · " : ""}信用點 ${a.store.data.credits.toLocaleString()}${w ? ` / 等級 ${w.level} / 波次 ${w.wave} / 無敵 ${w.debugInvincible ? "ON" : "OFF"}` : " / 機庫待命"}`;
  }
  action(id) {
    const a = this.app,
      w = a.world;
    let message = "已套用";
    if (id === "money" || id === "rich") {
      a.store.data.credits = Math.min(
        1e9,
        a.store.data.credits + (id === "money" ? 1000 : 10000),
      );
      a.save();
    } else if (id === "ships") {
      a.store.data.owned = SHIPS.map((s) => s.id);
      a.save();
    } else if (w && w.state !== "defeat") {
      w.testing = true;
      if (id === "level" || id === "levels")
        testLevels(w, id === "level" ? 1 : 10);
      if (id === "heal") {
        w.player.hp = w.player.maxHp;
        w.player.shield = w.player.maxShield;
      }
      if (id === "skill") {
        w.player.cooldown = 0;
        w.player.dash = 0;
      }
      if (id === "god") w.debugInvincible = !w.debugInvincible;
      if (id === "clear") w.clearEnemyBullets();
      if (id === "upgrade") {
        if (!applyUpgrade(w, $("debugUpgrade").value))
          message = "此強化已達上限";
        checkEvolutions(w);
      }
      if (id === "wave") testWave(w, Number($("debugWave").value));
      if (id === "map")
        testWave(w, Number($("debugMap").value) * RULES.bossEvery + 1);
      if (id === "boss")
        testWave(
          w,
          (Math.floor(w.wave / RULES.bossEvery) + 1) * RULES.bossEvery,
        );
      a.updateBuild();
      a.renderHud();
    }
    this.status(message);
  }
  close() {
    const a = this.app,
      s = this.saved;
    if (!s) return;
    this.saved = null;
    a.input.clear();
    if (s.state === "playing" && a.world?.state === "paused") a.world.resume();
    $("overlayContent").replaceChildren(...s.nodes);
    $("overlay").classList.toggle("hidden", s.hidden);
    a.menu = s.menu;
    a.input.active = a.world?.state === "playing" && !a.menu;
    $("credits").textContent = a.store.data.credits.toLocaleString();
    if (!a.world) a.drawLoadout();
    if (a.world) a.renderHud();
    if (s.menu === "upgrade") a.upgrade();
    if (s.menu === "intermission") a.intermission();
  }
}
