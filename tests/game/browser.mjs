import { chromium } from "../../tools/node_modules/playwright/index.mjs";
import { spawn, execFileSync } from "node:child_process";
execFileSync(process.execPath, ["scripts/build.mjs"], { stdio: "inherit" });
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const server = spawn(
  "python3",
  ["-m", "http.server", "4179", "--bind", "127.0.0.1"],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch("http://127.0.0.1:4179/index.html");
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 960 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith("http://127.0.0.1") && r.status() >= 400)
      errors.push(`${r.status()} ${r.url()}`);
  });
  console.log("QA: hangar");
  await page.goto("http://127.0.0.1:4179/?qa");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__SHIKUJIN__);
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/hangar-desktop.png" });
  assert.equal(await page.locator("[data-pilot]").count(), 4);
  await page.locator('[data-pilot="mio"]').click();
  await page.locator("#launch").click();
  await page.waitForTimeout(180);
  const x = await page.evaluate(() => window.__SHIKUJIN__.app.world.player.x);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(250);
  await page.keyboard.up("KeyD");
  assert.ok(
    (await page.evaluate(() => window.__SHIKUJIN__.app.world.player.x)) > x,
  );
  await page.keyboard.press("Space");
  assert.ok(
    (await page.evaluate(() => window.__SHIKUJIN__.app.world.player.cooldown)) >
      0,
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.state),
    "paused",
  );
  const t = await page.evaluate(() => window.__SHIKUJIN__.app.world.time);
  await page.waitForTimeout(100);
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.time),
    t,
  );
  await page.locator("#resume").click();
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    w.xp = w.nextXp;
  });
  await page.waitForSelector("[data-upgrade]");
  assert.equal(await page.locator("[data-upgrade]").count(), 3);
  await page.screenshot({ path: "test-results/upgrade.png" });
  await page.keyboard.press("Digit1");
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.state),
    "playing",
  );
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    w.player.invuln = 999;
    w.wave = 4;
    w.waveTime = 24;
  });
  await page.waitForTimeout(120);
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.wave),
    5,
  );
  assert.ok(await page.locator("#bossHud").isVisible());
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    w.player.hp = 1e6;
    w.player.maxHp = 1e6;
    w.player.invuln = 999;
    w.upgrades = { missile: 3, drone: 4, pulse: 3 };
    w.player.multi = 4;
    for (let i = 0; i < 70; i++) {
      const e = w.spawn(i % 3 ? "scout" : "striker");
      const a = (i / 70) * Math.PI * 2;
      e.x = w.player.x + Math.cos(a) * (160 + i * 3);
      e.y = w.player.y + Math.sin(a) * (160 + i * 3);
    }
  });
  console.log("QA: combat");
  await page.waitForTimeout(1400);
  await page.screenshot({ path: "test-results/combat.png" });
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    const b = w.enemies.find((e) => e.kind === "boss");
    w.state = "playing";
    w.xp = 0;
    w.drops = [];
    window.__SHIKUJIN__.app.closeModal();
    w.hit(b, 1e9);
    w.waveTime = 24;
  });
  await page.waitForTimeout(120);
  if (await page.locator("[data-upgrade]:visible").count())
    await page.locator("[data-upgrade]").first().click();
  await page.waitForTimeout(120);
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.mapIndex),
    1,
  );
  await page.waitForSelector('[data-supply="repair"]');
  await page.locator('[data-supply="repair"]').click();
  assert.ok(
    ["playing", "upgrade"].includes(
      await page.evaluate(() => window.__SHIKUJIN__.app.world.state),
    ),
  );
  await page.evaluate(() => window.__SHIKUJIN__.app.world.finish());
  console.log("QA: settlement");
  await page.waitForSelector("#returnHangar");
  await page.screenshot({ path: "test-results/defeat.png" });
  const credits = await page.evaluate(
    () => window.__SHIKUJIN__.store.data.credits,
  );
  assert.ok(credits > 0);
  await page.locator("#returnHangar").click();
  await page.reload();
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.store.data.credits),
    credits,
  );
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.store.data.pilot),
    "mio",
  );
  await page.evaluate(() => {
    window.__SHIKUJIN__.store.data.credits = 400;
    window.__SHIKUJIN__.store.write();
  });
  await page.reload();
  await page.locator('[data-ship="wraith"]').click();
  await page.locator("#launch").click();
  assert.ok(
    await page.evaluate(() =>
      window.__SHIKUJIN__.store.data.owned.includes("wraith"),
    ),
  );
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.store.data.credits),
    220,
  );
  await page.reload();
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.ship),
    "wraith",
  );
  console.log("QA: progression menus");
  await page.evaluate(() => {
    window.__SHIKUJIN__.store.data.credits = 1000;
    window.__SHIKUJIN__.store.write();
  });
  await page.reload();
  await page.locator("#researchButton").click();
  await page.locator('[data-research="power"]').click();
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.store.data.research.power),
    1,
  );
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.store.data.credits),
    920,
  );
  await page.screenshot({ path: "test-results/research.png" });
  await page.locator("#closeMeta").click();
  await page.locator("#achievementsButton").click();
  await page.locator('[data-claim="first"]').click();
  assert.ok(
    await page.evaluate(() =>
      window.__SHIKUJIN__.store.data.claimed.includes("first"),
    ),
  );
  assert.ok(await page.locator('[data-claim="first"]').isDisabled());
  await page.locator("#closeMeta").click();
  await page.locator("#archiveButton").click();
  await page.screenshot({ path: "test-results/boss-archive.png" });
  await page.locator('[data-tab="pilot"]').click();
  assert.equal(await page.locator(".pilot-archive article").count(), 4);
  await page.locator("#closeMeta").click();
  await page.locator("#modeButton").click();
  await page.locator('[data-mode="endless"]').click();
  await page.locator('[data-difficulty="expert"]').click();
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.store.data.mode),
    "endless",
  );
  await page.locator('[data-mode="campaign"]').click();
  await page.locator('[data-difficulty="normal"]').click();
  await page.locator("#saveMode").click();
  await page.locator("#settingsButton").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportSave").click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "Shikujin-save.json");
  await page.locator("#closeSettings").click();
  console.log("QA: mobile");
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto("http://127.0.0.1:4179/?qa");
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.screenshot({
    path: "test-results/hangar-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await mobile.locator("#launch").click();
  await mobile.waitForTimeout(100);
  const touch = await mobile.context().newCDPSession(mobile);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 100, y: 350 }],
  });
  // Touch steering is 1:1 relative drag: sample before the finger moves.
  const before = await mobile.evaluate(
    () => window.__SHIKUJIN__.app.world.player.x,
  );
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 150, y: 350 }],
  });
  await mobile.waitForTimeout(200);
  assert.ok(
    (await mobile.evaluate(() => window.__SHIKUJIN__.app.world.player.x)) >
      before,
  );
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await mobile.locator("#skillButton").click();
  assert.ok(
    (await mobile.evaluate(
      () => window.__SHIKUJIN__.app.world.player.cooldown,
    )) > 0,
  );
  await mobile.screenshot({ path: "test-results/combat-mobile.png" });
  // Production build serves under a repository subpath, including portrait and module URLs.
  console.log("QA: built subpath");
  await page.bringToFront();
  await page.goto("http://127.0.0.1:4179/dist/?qa");
  await page.waitForFunction(() => window.__SHIKUJIN__);
  await page.locator("#launch").click();
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.state),
    "playing",
  );
  console.log("QA: campaign ending");
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    w.wave = 24;
    w.waveTime = 24;
    w.mapIndex = 4;
    w.player.invuln = 999;
  });
  await page.waitForFunction(() =>
    document.querySelector("#bossName").textContent.includes("終焉日蝕"),
  );
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    w.hit(
      w.enemies.find((e) => e.kind === "boss"),
      1e9,
    );
    w.waveTime = 24;
  });
  await page.waitForSelector("#returnHangar");
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.result.clear),
    true,
  );
  await page.screenshot({ path: "test-results/campaign-clear.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: desktop/mobile, input, skills, pause, upgrades, Boss/map, settlement, purchase, reload and Pages subpath; no browser errors.",
  );
} finally {
  await browser?.close();
  server.kill();
}
