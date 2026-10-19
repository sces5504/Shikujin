import { PILOTS } from "../content/catalog.js";
import {
  AFFECTION,
  AFFINITY_STAGES,
  GIFTS,
  affinityStage,
  taipeiDay,
} from "../content/affection.js";
import { affectionRecord } from "../core/affection.js";
import { portraitStyle } from "./portraits.js";
const $ = (id) => document.getElementById(id);
export class BondUI {
  constructor(app) {
    this.app = app;
    this.art = "normal";
    $("bondButton").onclick = () => this.open();
  }
  open(id = this.app.pilot, line = null) {
    this.id = id;
    const p = PILOTS.find((p) => p.id === id),
      s = this.app.store,
      a = affectionRecord(s.data, id),
      stage = affinityStage(a.points),
      today = a.day === taipeiDay(),
      remaining = 3 - (today ? a.chats : 0),
      artPilot = {
        ...p,
        portrait:
          this.art === "ultimate"
            ? p.ultimatePortrait
            : this.art === "memory"
              ? p.memoryPortrait
              : this.art === "damaged"
                ? p.defeatPortrait
                : p.portrait,
      };
    this.app.modal(
      `<div class="bond-panel"><div class="bond-top"><span class="modal-eyebrow">PILOT CONNECTION / 私人頻道</span><button id="closeBond" class="icon-button" aria-label="關閉休息室">×</button></div><div class="bond-tabs">${PILOTS.map((q, i) => `<button data-bond-pilot="${q.id}" class="${id === q.id ? "selected" : ""}">${q.name}<small>${q.en}</small></button>`).join("")}</div><div class="bond-layout"><div class="bond-art portrait" style="${portraitStyle(artPilot)}"><div class="bond-art-caption">${p.en}<small>${p.title}</small></div></div><div class="bond-content"><div class="bond-subtitle">${p.age} 歲 / ${p.title}</div><h2>${p.name}<span>${p.en}</span></h2><div class="affection-heading"><b>♡ ${stage.name}</b><span>${a.points} / 100</span></div><div class="bar affinity-bar"><i style="width:${a.points}%"></i></div><p class="bond-description">出擊、交流與禮物累積好感，解鎖專屬故事與回憶 CG。</p><div class="bond-dialogue" aria-live="polite"><small>PRIVATE CHANNEL</small><p>${line || AFFECTION[id].intro}</p></div><div class="bond-actions"><button id="bondChat" class="primary-button" ${remaining <= 0 ? "disabled" : ""}>交流 <small>${remaining}/3</small></button><button id="bondPartner" class="secondary-button">${this.app.pilot === id ? "目前搭檔" : "設為搭檔"}</button></div><div class="bond-gift-label">送一份心意 <span>今日 ${today ? a.gifts : 0}/3</span></div><div class="gift-grid">${GIFTS.map((g) => `<button data-gift="${g.id}" ${s.data.credits < g.cost || (today && a.gifts >= 3) ? "disabled" : ""}><span>${g.icon}</span><div>${g.name}<small>✧ ${g.cost}${AFFECTION[id].favorite === g.id ? " · 喜愛" : ""}</small></div></button>`).join("")}</div><div class="bond-wallet">可用信用點 ✧ ${s.data.credits}</div><div class="memory-label">專屬回憶 <small>首次閱讀獲得 35 信用點</small></div><div class="memory-list">${AFFINITY_STAGES.map((n) => `<button data-memory="${n.at}" class="${a.memories.includes(n.at) ? "read" : ""}" ${a.points < n.at ? "disabled" : ""}><span>${a.points < n.at ? "♧" : a.memories.includes(n.at) ? "✓" : "♡"}</span><div>${n.title}<small>${a.points < n.at ? `好感 ${n.at} 解鎖` : a.memories.includes(n.at) ? "重溫回憶" : "可以閱讀"}</small></div></button>`).join("")}</div></div></div><div class="cg-gallery">${[
        ["normal", "日常"],
        ["ultimate", "大絕招"],
        ["memory", "回憶 CG"],
        ["damaged", "戰損"],
      ]
        .map(
          ([key, name]) =>
            `<button data-gallery="${key}" class="${this.art === key ? "selected" : ""}">${name}${key === "memory" && a.points < 20 ? " ♧" : ""}${key === "damaged" && !s.data.runs ? " ♧" : ""}</button>`,
        )
        .join("")}<span>同一角色設定 · 專屬 CG 畫廊</span></div></div>`,
      "bond",
    );
    $("closeBond").onclick = () => this.close();
    document.querySelectorAll("[data-bond-pilot]").forEach(
      (b) =>
        (b.onclick = () => {
          this.art = "normal";
          this.open(b.dataset.bondPilot);
        }),
    );
    $("bondChat").onclick = () => this.interact("chat");
    $("bondPartner").onclick = () => {
      this.app.pilot = id;
      s.data.pilot = id;
      this.app.save();
      this.app.drawLoadout();
      this.open(id, "搭檔已確認。下一次出擊，也請多指教。");
    };
    document
      .querySelectorAll("[data-gift]")
      .forEach(
        (b) => (b.onclick = () => this.interact("gift", b.dataset.gift)),
      );
    document
      .querySelectorAll("[data-memory]")
      .forEach((b) => (b.onclick = () => this.story(Number(b.dataset.memory))));
    document.querySelectorAll("[data-gallery]").forEach(
      (b) =>
        (b.onclick = () => {
          const key = b.dataset.gallery;
          if (key === "memory" && a.points < 20) {
            this.app.toast("好感達到 20 後解鎖回憶 CG。");
            return;
          }
          if (key === "damaged" && !s.data.runs) {
            this.app.toast("完成一場出擊後解鎖戰損紀錄。");
            return;
          }
          this.art = key;
          this.open(id);
        }),
    );
  }
  interact(kind, gift) {
    const r = this.app.store.interact(this.id, kind, gift);
    if (!r.ok) {
      this.app.toast(r.reason);
      return;
    }
    this.app.audio.unlock();
    this.app.audio.tone(650, 0.2);
    this.open(this.id, r.line);
    this.app.toast(`♡ 好感 +${r.gain}`);
  }
  story(at) {
    const r = this.app.store.memory(this.id, at);
    if (!r.ok) return;
    this.storyAt = at;
    this.storyPage = 0;
    this.storyData = r;
    this.showStory();
    if (r.fresh) this.app.toast("回憶已收藏 · 信用點 +35");
  }
  showStory() {
    const r = this.storyData,
      p = PILOTS.find((p) => p.id === this.id),
      artPilot = {
        ...p,
        portrait: this.storyAt >= 20 ? p.memoryPortrait : p.portrait,
      };
    this.app.modal(
      `<div class="story-panel"><div class="story-art portrait" style="${portraitStyle(artPilot)}"></div><div class="story-copy"><div class="modal-eyebrow">MEMORY ARCHIVE / ${this.storyPage + 1} OF ${r.lines.length}</div><h2>${r.title}</h2><b>${p.name}</b><p>${r.lines[this.storyPage]}</p><button id="nextStory" class="primary-button">${this.storyPage === r.lines.length - 1 ? "收藏這段回憶" : "繼續 →"}</button></div></div>`,
      "story",
    );
    $("nextStory").onclick = () => {
      if (++this.storyPage < r.lines.length) this.showStory();
      else this.open(this.id);
    };
  }
  close() {
    this.app.closeModal();
    this.app.drawLoadout();
    $("credits").textContent = this.app.store.data.credits.toLocaleString();
  }
}
