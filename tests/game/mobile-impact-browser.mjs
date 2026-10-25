import { chromium } from "../../tools/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const server = spawn(
  "python3",
  ["-m", "http.server", "4192", "--bind", "127.0.0.1"],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4192")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4192/?qa");
  await page.locator("#launch").click();
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    w.debugInvincible = true;
    w.spawnTimer = 1e8;
    w.waveTime = -1e8;
    window.__actions = { skill: 0, dash: 0 };
    w.events.on("skill", () => window.__actions.skill++);
    w.events.on("dash", () => window.__actions.dash++);
  });
  const cdp = await page.context().newCDPSession(page);
  const send = (type, touchPoints) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints });
  const held = { id: 1, x: 160, y: 380, radiusX: 4, radiusY: 4 };
  await send("touchStart", [{ ...held, x: 115, y: 435 }]);
  await send("touchMove", [held]);
  const center = async (id) => {
    const r = await page.locator(id).boundingBox();
    return {
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      radiusX: 4,
      radiusY: 4,
    };
  };
  await send("touchStart", [
    held,
    { id: 2, ...(await center("#skillButton")) },
  ]);
  assert.equal(
    await page.evaluate(() => window.__actions.skill),
    1,
    "second finger must activate skill before release",
  );
  assert.ok(
    // Movement drag stays owned by the first finger while the skill finger is down.
    await page.evaluate(() => window.__SHIKUJIN__.app.input.vector.x > 0.5),
  );
  await send("touchEnd", [held]);
  await send("touchStart", [held, { id: 3, ...(await center("#dashButton")) }]);
  assert.equal(
    await page.evaluate(() => window.__actions.dash),
    1,
    "second finger must dash while movement remains held",
  );
  await send("touchEnd", [held]);
  await send("touchEnd", []);
  await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(() => window.__actions), {
    skill: 1,
    dash: 1,
  });
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.input.pointer),
    null,
  );
  // Double tap and pinch on the playfield must not change the visual viewport.
  const scale = await page.evaluate(() => visualViewport.scale);
  for (let i = 0; i < 2; i++) {
    await send("touchStart", [{ id: 4, x: 140, y: 420 }]);
    await send("touchEnd", []);
  }
  await send("touchStart", [
    { id: 5, x: 120, y: 420 },
    { id: 6, x: 220, y: 420 },
  ]);
  await send("touchMove", [
    { id: 5, x: 60, y: 420 },
    { id: 6, x: 280, y: 420 },
  ]);
  await send("touchEnd", []);
  assert.equal(await page.evaluate(() => visualViewport.scale), scale);
  const css = await page.evaluate(() => ({
    body: getComputedStyle(document.body).userSelect,
    skill: getComputedStyle(document.querySelector("#skillButton")).touchAction,
  }));
  assert.equal(css.body, "none");
  assert.equal(css.skill, "none");
  const field = await page.evaluate(() => {
    const t = document.createElement("textarea");
    t.value = "save";
    document.body.append(t);
    t.select();
    const result = {
      select: getComputedStyle(t).userSelect,
      start: t.selectionStart,
      end: t.selectionEnd,
    };
    t.remove();
    return result;
  });
  assert.deepEqual(field, { select: "text", start: 0, end: 4 });
  await send("touchStart", [{ id: 7, x: 120, y: 400 }]);
  await send("touchMove", [{ id: 7, x: 160, y: 350 }]);
  await send("touchCancel", []);
  assert.deepEqual(
    await page.evaluate(() => window.__SHIKUJIN__.app.input.get()),
    { drag: { x: 0, y: 0 }, x: 0, y: 0 },
  );
  await page.evaluate(async () => {
    const { app } = window.__SHIKUJIN__,
      w = app.world,
      { applyUpgrade } = await import("./src/game/upgrades.js");
    for (const id of [
      "starburst",
      "refraction",
      "dashburst",
      "frost",
      "shatter",
    ])
      applyUpgrade(w, id);
    w.player.cooldown = 0;
    w.player.dash = 0;
    w.wave = 5;
    const e = w.spawn("boss");
    e.x = 100;
    e.y = -230;
    app.bannerUntil = 0;
    app.commsUntil = 0;
  });
  await page.locator("#dashButton").tap();
  await page.waitForTimeout(250);
  await page.screenshot({ path: "test-results/mobile-impact.png" });
  // Mouse and assistive/keyboard click paths must remain one-shot.
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    w.player.cooldown = 0;
    window.__actions.skill = 0;
  });
  await page.locator("#skillButton").click();
  assert.equal(await page.evaluate(() => window.__actions.skill), 1);
  await page.evaluate(() => {
    window.__SHIKUJIN__.app.world.player.cooldown = 0;
    document.querySelector("#skillButton").disabled = false;
    document.querySelector("#skillButton").click();
  });
  assert.equal(await page.evaluate(() => window.__actions.skill), 2);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: native multi-touch move + skill/dash, no duplicate activation, double tap/pinch viewport stable, selection policy and combat visuals.",
  );
} finally {
  await browser?.close();
  server.kill();
}
