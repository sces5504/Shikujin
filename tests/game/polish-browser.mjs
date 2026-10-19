import { chromium } from "../../tools/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const server = spawn(
  "python3",
  ["-m", "http.server", "4184", "--bind", "127.0.0.1"],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4184")).ok) break;
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
  await mkdir("test-results", { recursive: true });
  await page.goto("http://127.0.0.1:4184/?qa");
  await page.evaluate(() => {
    const s = window.__SHIKUJIN__.store;
    s.data.credits = 200;
    s.data.affection.akari = {
      points: 18,
      day: "",
      chats: 0,
      gifts: 0,
      memories: [],
    };
    s.write();
  });
  await page.reload();
  console.log("POLISH: affection, gifts, memories and persistence");
  await page.locator("#bondButton").click();
  await page.locator("#bondChat").click();
  assert.equal(
    await page.evaluate(
      () => window.__SHIKUJIN__.store.data.affection.akari.points,
    ),
    20,
  );
  await page.locator('[data-gift="cake"]').click();
  assert.equal(
    await page.evaluate(
      () => window.__SHIKUJIN__.store.data.affection.akari.points,
    ),
    28,
  );
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.store.data.credits),
    175,
  );
  await page.locator('[data-memory="20"]').click();
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.store.data.credits),
    210,
  );
  for (let i = 0; i < 3; i++) await page.locator("#nextStory").click();
  await page.locator('[data-gallery="memory"]').click();
  await page.screenshot({ path: "test-results/bond-desktop.png" });
  await page.locator("#closeBond").click();
  await page.reload();
  assert.equal(
    await page.evaluate(
      () => window.__SHIKUJIN__.store.data.affection.akari.points,
    ),
    28,
  );
  console.log("POLISH: four distinct ultimates, cut-ins and layer recovery");
  for (const [pilot, kind] of [
    ["akari", "overdrive"],
    ["rin", "stasis"],
    ["yuki", "repair"],
    ["mio", "nova"],
  ]) {
    await page.locator(`[data-pilot="${pilot}"]`).click();
    await page.locator("#launch").click();
    await page.evaluate(() => {
      const w = window.__SHIKUJIN__.app.world;
      w.player.invuln = 999;
      const e = w.spawn("tank");
      e.x = 150;
      e.y = -140;
    });
    await page.locator("#skillButton").click();
    assert.equal(
      await page.evaluate(() => window.__SHIKUJIN__.app.world.ultimate.kind),
      kind,
    );
    assert.ok(
      await page
        .locator("#ultimateOverlay")
        .evaluate((e) => e.classList.contains("active")),
    );
    await page.waitForTimeout(400);
    await page.screenshot({ path: `test-results/ultimate-${pilot}.png` });
    await page.evaluate(() => window.__SHIKUJIN__.app.world.finish());
    await page.locator("#returnHangar").click();
  }
  await page.locator("#launch").click();
  await page.waitForFunction(
    () => window.__SHIKUJIN__.app.renderer.fx.available,
  );
  const supported = await page.evaluate(() => {
    const fx = window.__SHIKUJIN__.app.renderer.fx;
    window.__gpuLoss = fx.gl.getExtension("WEBGL_lose_context");
    return !!window.__gpuLoss;
  });
  assert.ok(supported);
  await page.evaluate(() => window.__gpuLoss.loseContext());
  await page.waitForFunction(
    () => !window.__SHIKUJIN__.app.renderer.fx.available,
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.state),
    "paused",
  );
  await page.locator("#resume").click();
  await page.evaluate(() => window.__gpuLoss.restoreContext());
  await page.waitForFunction(
    () => window.__SHIKUJIN__.app.renderer.fx.available,
  );
  assert.equal(
    await page.evaluate(() =>
      window.__SHIKUJIN__.app.renderer.fx.gl.getError(),
    ),
    0,
  );
  console.log("POLISH: sustained density, responsive pause and bounded pool");
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    w.resetProjectiles();
    w.enemies = [];
    w.drops = [];
    w.player.invuln = 1e6;
    w.player.fire = 1e6;
    w.player.hp = 1e8;
    w.player.magnet = 0;
    w.nextXp = 1e9;
    w.xp = 0;
    w.spawnTimer = 1e6;
    w.waveTime = -1e6;
    for (let i = 0; i < 240; i++) {
      const e = w.spawn("scout");
      e.x = ((i % 20) - 10) * 45;
      e.y = (Math.floor(i / 20) - 6) * 45;
      e.speed = 0;
      e.hp = e.maxHp = 1e8;
    }
    for (let i = 0; i < 1000; i++) {
      const e = w.enemies[i % 240];
      w.enemyBullet(e, i, 12);
      const b = w.bullets.at(-1);
      b.x = ((i % 40) - 20) * 25;
      b.y = (Math.floor(i / 40) - 12) * 25;
      b.life = 60;
    }
    window.__longTasks = [];
    window.__observer = new PerformanceObserver((list) =>
      window.__longTasks.push(...list.getEntries().map((e) => e.duration)),
    );
    window.__observer.observe({ entryTypes: ["longtask"] });
  });
  await page.waitForTimeout(4000);
  await page.keyboard.press("Escape");
  await page.waitForSelector("#resume", { timeout: 3000 });
  const metrics = await page.evaluate(() => {
    window.__observer.disconnect();
    return {
      created: window.__SHIKUJIN__.app.world.bulletPool.created,
      maxTask: Math.max(0, ...window.__longTasks),
      state: window.__SHIKUJIN__.app.world.state,
    };
  });
  assert.ok(metrics.created < 2600);
  assert.ok(
    metrics.maxTask < 600,
    `unresponsive long task ${metrics.maxTask}ms`,
  );
  assert.equal(metrics.state, "paused");
  console.log(JSON.stringify(metrics));
  await page.locator("#abandon").click();
  await page.locator("#returnHangar").click();
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto("http://127.0.0.1:4184/?qa");
  await mobile.locator("#bondButton").click();
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await mobile.screenshot({
    path: "test-results/bond-mobile.png",
    fullPage: true,
  });
  await mobile.locator("#closeBond").click();
  await mobile.locator("#launch").click();
  await mobile.locator("#skillButton").click();
  await mobile.waitForTimeout(400);
  await mobile.screenshot({ path: "test-results/ultimate-mobile.png" });
  await mobile.locator("#pauseButton").click();
  await mobile.locator("#inGameSettings").click();
  await mobile.locator("#qualityToggle").click();
  assert.equal(
    await mobile.evaluate(() => window.__SHIKUJIN__.store.data.quality),
    "high",
  );
  await mobile.locator("#closeSettings").click();
  assert.ok(await mobile.locator("#resume").isVisible());
  assert.deepEqual(errors, []);
  console.log(
    "PASS: affection, consistent gallery, all ultimate effects/cut-ins, GPU fallback/recovery, sustained density, bounded allocations, mobile and quality settings.",
  );
} finally {
  await browser?.close();
  server.kill();
}
