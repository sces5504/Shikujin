import { portraitStyle } from "./portraits.js";
import {
  RESEARCH,
  ACHIEVEMENTS,
  researchCost,
  DIFFICULTIES,
  EVOLUTIONS,
} from "../content/progression.js";
import { BOSSES } from "../content/encounters.js";
import { MAPS, ENEMIES, PILOTS } from "../content/catalog.js";
import { sanitizeSave } from "../core/storage.js";
const $ = (id) => document.getElementById(id);
export class MetaUI {
  constructor(app) {
    this.app = app;
    for (const [id, fn] of [
      ["researchButton", "research"],
      ["achievementsButton", "achievements"],
      ["archiveButton", "archive"],
      ["modeButton", "mode"],
    ])
      $(id).onclick = () => this[fn]();
  }
  shell(eyebrow, title, sub, body, name) {
    this.app.modal(
      `<div class="meta-panel"><div class="meta-header"><div><div class="modal-eyebrow">${eyebrow}</div><h2 class="modal-title">${title}</h2><p class="modal-subtitle">${sub}</p></div><button id="closeMeta" class="icon-button" aria-label="關閉">×</button></div>${body}</div>`,
      name,
    );
    $("closeMeta").onclick = () => {
      this.app.closeModal();
      this.updateLabel();
      this.app.drawLoadout();
      $("credits").textContent = this.app.store.data.credits.toLocaleString();
    };
  }
  research() {
    const s = this.app.store;
    this.shell(
      "PERMANENT DEVELOPMENT",
      "研發中樞",
      `信用點 ✧ ${s.data.credits} · 永久強化所有機體`,
      `<div class="research-grid">${RESEARCH.map((n) => {
        const lv = s.data.research[n.id] || 0,
          cost = researchCost(n, lv),
          max = lv >= n.max;
        return `<div class="research-card"><span class="research-icon">${n.icon}</span><small>LV. ${lv} / ${n.max}</small><h3>${n.name}</h3><p>${n.description}</p><div class="research-pips">${Array.from({ length: n.max }, (_, i) => `<i class="${i < lv ? "filled" : ""}"></i>`).join("")}</div><button data-research="${n.id}" class="${max ? "secondary-button" : "primary-button"}" ${max || s.data.credits < cost ? "disabled" : ""}>${max ? "研發完成" : `研發 · ✧ ${cost}`}</button></div>`;
      }).join("")}</div>`,
      "research",
    );
    document.querySelectorAll("[data-research]").forEach(
      (b) =>
        (b.onclick = () => {
          if (s.research(b.dataset.research)) {
            this.app.audio.tone(650, 0.2);
            this.research();
          }
        }),
    );
  }
  achievements() {
    const s = this.app.store;
    this.shell(
      "PILOT COMMENDATIONS",
      "星海勳章",
      "每個成就獎勵僅能領取一次。",
      `<div class="achievement-grid">${ACHIEVEMENTS.map((a) => {
        const value = s.metric(a.metric),
          claimed = s.data.claimed.includes(a.id),
          ready = value >= a.target;
        return `<div class="achievement-card"><span>${a.icon}</span><div><h3>${a.name}</h3><p>${a.description}</p><div class="bar xp"><i style="width:${Math.min(100, (value / a.target) * 100)}%"></i></div><small>${Math.min(value, a.target)} / ${a.target}</small></div><button class="${ready && !claimed ? "primary-button" : "secondary-button"}" data-claim="${a.id}" ${!ready || claimed ? "disabled" : ""}>${claimed ? "已領取" : `✧ ${a.reward}`}</button></div>`;
      }).join("")}</div>`,
      "achievements",
    );
    document.querySelectorAll("[data-claim]").forEach(
      (b) =>
        (b.onclick = () => {
          if (s.claim(b.dataset.claim)) {
            this.app.audio.tone(800, 0.2);
            this.achievements();
          }
        }),
    );
  }
  archive(tab = "boss") {
    const s = this.app.store;
    const tabs = [
      ["boss", "首領情報"],
      ["evolution", "進化藍圖"],
      ["pilot", "駕駛員"],
      ["history", "作戰紀錄"],
    ];
    let body = "";
    if (tab === "boss")
      body = `<div class="archive-grid">${BOSSES.map((b, i) => `<article class="archive-card"><div class="boss-art" style="background-position:${(i % 3) * 50}% ${Math.floor(i / 3) * 100}%"></div><small>SECTOR ${String(i + 1).padStart(2, "0")} / WAVE ${(i + 1) * 5}</small><h3>${b.name}</h3><b>${b.en}</b><p>${b.description}</p><span style="color:${MAPS[i].color}">${MAPS[i].name}</span></article>`).join("")}</div>`;
    if (tab === "evolution")
      body = `<div class="archive-grid">${EVOLUTIONS.map((e) => `<article class="archive-card"><div class="boss-sigil" style="color:${e.color}">${e.icon}</div><small>ULTIMATE EVOLUTION</small><h3>${e.name}</h3><p>${e.description}</p><span>滿足條件時自動進化</span></article>`).join("")}</div>`;
    if (tab === "pilot")
      body = `<div class="pilot-archive">${PILOTS.map((p, i) => {
        const xp = s.data.bond[p.id] || 0,
          level = 1 + Math.min(10, Math.floor(xp / 100));
        return `<article><div class="portrait" style="${portraitStyle(p)}"></div><div><small>${p.en} / ${p.age} 歲</small><h3>${p.name} · ${p.title}</h3><p>${p.lines[0]}</p><b>默契 LV.${level}</b><p>共同出擊累積默契，技能冷卻額外降低 ${level - 1}%</p><div class="bar xp"><i style="width:${xp % 100}%"></i></div></div></article>`;
      }).join("")}</div>`;
    if (tab === "history")
      body = s.data.history.length
        ? `<div class="history-table"><div class="history-row heading"><span>駕駛員</span><span>波次</span><span>分數</span><span>信用點</span></div>${s.data.history.map((r) => `<div class="history-row"><span>${PILOTS.find((p) => p.id === r.pilot)?.name || "—"} ${r.clear ? "✦" : ""}</span><b>${r.wave}</b><b>${r.score}</b><span>+${r.reward}</span></div>`).join("")}</div>`
        : '<p class="modal-subtitle empty-state">尚無作戰紀錄。星海等待你的第一道航跡。</p>';
    this.shell(
      "ORBITAL INTELLIGENCE",
      "情報資料庫",
      "理解你的敵人，規劃下一次突破。",
      `<div class="meta-tabs">${tabs.map(([id, name]) => `<button data-tab="${id}" class="${id === tab ? "selected" : ""}">${name}</button>`).join("")}</div>${body}`,
      "archive",
    );
    document
      .querySelectorAll("[data-tab]")
      .forEach((b) => (b.onclick = () => this.archive(b.dataset.tab)));
  }
  mode() {
    const d = this.app.store.data;
    this.shell(
      "OPERATION PARAMETERS",
      "作戰計畫",
      "25 波章節戰役有完整結局；無盡作戰持續突破紀錄。",
      `<div class="mode-grid">${[
        ["campaign", "章節戰役", "CAMPAIGN", "穿越五大空域，擊破終焉日蝕。"],
        ["endless", "無盡作戰", "ENDLESS", "無限循環空域，挑戰更強的敵潮。"],
      ]
        .map(
          ([id, name, en, desc]) =>
            `<button class="mode-card ${d.mode === id ? "selected" : ""}" data-mode="${id}"><small>${en}</small><h3>${name}</h3><p>${desc}</p></button>`,
        )
        .join(
          "",
        )}</div><div class="difficulty-title">作戰難度</div><div class="difficulty-grid">${DIFFICULTIES.map((n) => `<button data-difficulty="${n.id}" class="mode-card ${d.difficulty === n.id ? "selected" : ""}"><small>${n.en}</small><h3>${n.name}</h3><p>${n.description}</p></button>`).join("")}</div><div class="modal-actions"><button id="saveMode" class="primary-button">確認作戰計畫</button></div>`,
      "mode",
    );
    document.querySelectorAll("[data-mode]").forEach(
      (b) =>
        (b.onclick = () => {
          d.mode = b.dataset.mode;
          this.app.save();
          this.mode();
        }),
    );
    document.querySelectorAll("[data-difficulty]").forEach(
      (b) =>
        (b.onclick = () => {
          d.difficulty = b.dataset.difficulty;
          this.app.save();
          this.mode();
        }),
    );
    $("saveMode").onclick = () => {
      this.app.closeModal();
      this.updateLabel();
    };
  }
  updateLabel() {
    $("modeButton").innerHTML =
      `<span>◎</span> ${this.app.store.data.mode === "campaign" ? "章節戰役" : "無盡作戰"} <small>${DIFFICULTIES.find((d) => d.id === this.app.store.data.difficulty).name} ▾</small>`;
  }
  exportSave() {
    const blob = new Blob([JSON.stringify(this.app.store.data, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "Shikujin-save.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async importSave(file) {
    if (!file || file.size > 100000) {
      this.app.toast("請選擇小於 100KB 的 Shikujin 存檔。");
      return;
    }
    try {
      const raw = JSON.parse(await file.text());
      if (raw.version !== 1 || !Array.isArray(raw.owned)) throw Error();
      this.app.store.data = sanitizeSave(raw);
      this.app.save();
      this.app.ship = this.app.store.data.ship;
      this.app.pilot = this.app.store.data.pilot;
      this.app.applySettings();
      this.updateLabel();
      this.app.hangar();
      this.app.toast("存檔匯入完成。");
    } catch {
      this.app.toast("無法辨識存檔，原有進度未變更。");
    }
  }
}
