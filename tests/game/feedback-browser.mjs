import { chromium } from "../../tools/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const server = spawn(
  "python3",
  ["-m", "http.server", "4186", "--bind", "127.0.0.1"],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4186")).ok) break;
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
    if (r.url().includes("127.0.0.1") && r.status() >= 400)
      errors.push(`${r.status()} ${r.url()}`);
  });
  await mkdir("test-results", { recursive: true });
  // Verify the secret in the production build without the QA harness.
  await page.goto("http://127.0.0.1:4186/dist/");
  assert.equal(await page.evaluate(() => !!window.__SHIKUJIN__), false);
  await page.keyboard.type("wwssadadbx");
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#debugClose").count(), 0);
  await page.keyboard.type("wwssadadba");
  await page.keyboard.press("Enter");
  await page.locator("[data-debug=rich]").click();
  await page.locator("[data-debug=ships]").click();
  await page.screenshot({ path: "test-results/debug-desktop.png" });
  await page.locator("#debugClose").click();
  assert.equal(await page.locator("#credits").textContent(), "10,000");
  await page.reload();
  assert.equal(await page.locator("#credits").textContent(), "10,000");
  console.log("FEEDBACK: production secret, money/unlocks and persistence");
  await page.goto("http://127.0.0.1:4186/?qa");
  await page.locator("[data-pilot=rin]").click();
  await page.locator("#launch").click();
  await page.keyboard.type("wwssadadba");
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.state),
    "paused",
  );
  await page.locator("[data-debug=levels]").click();
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.level),
    11,
  );
  await page.locator("[data-debug=god]").click();
  await page.locator("#debugWave").fill("5");
  await page.locator("[data-debug=wave]").click();
  assert.ok(
    await page.evaluate(() =>
      window.__SHIKUJIN__.app.world.enemies.some((e) => e.kind === "boss"),
    ),
  );
  await page.locator("#debugClose").click();
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.state),
    "playing",
  );
  await page.evaluate(() => {
    const { app } = window.__SHIKUJIN__,
      w = app.world;
    w.enemies.length = 0;
    w.spawnTimer = 1e6;
    w.waveTime = -1e6;
    w.player.fire = 1e6;
    w.player.cooldown = 0;
    for (let i = 0; i < 18; i++) {
      const e = w.spawn(i % 2 ? "tank" : "striker");
      e.x = Math.cos((i / 18) * Math.PI * 2) * 330;
      e.y = Math.sin((i / 18) * Math.PI * 2) * 230;
      e.hp = e.maxHp = 1e8;
      for (let j = 0; j < 3; j++)
        w.enemyBullet(
          e,
          (i / 18) * Math.PI * 2 + Math.PI + (j - 1) * 0.12,
          100,
        );
    }
    w.skill();
    window.__frozen = w.bullets
      .filter((b) => b.enemy)
      .map((b) => [b.id, b.x, b.y, b.life]);
  });
  await page.waitForTimeout(2400);
  const frozen = await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    return window.__frozen.every(([id, x, y, life]) => {
      const b = w.bullets.find((b) => b.id === id);
      return b && b.x === x && b.y === y && b.life === life;
    });
  });
  assert.equal(frozen, true);
  await page.screenshot({ path: "test-results/stasis-field.png" });
  await page.evaluate(() => {
    const w = window.__SHIKUJIN__.app.world;
    w.ultimate = null;
    w.stasis = 0;
    w.resetProjectiles();
    w.enemies.length = 0;
    w.player.x = 3170;
    w.player.y = 0;
  });
  await page.waitForTimeout(300);
  // The vertical stage clamps the ship inside the visible column instead of warning.
  assert.ok(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.player.x <= 360),
  );
  await page.screenshot({ path: "test-results/boundary-desktop.png" });
  // Open from pause; closing tools must restore the actual pause menu and callbacks.
  await page.keyboard.press("Escape");
  await page.locator("#debugToggle").click();
  await page.locator("#debugClose").click();
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.state),
    "paused",
  );
  await page.locator("#abandon").click();
  assert.ok(
    (await page.locator(".modal-title").textContent()).includes("平安返航"),
  );
  assert.equal(await page.locator(".result-art.damaged").count(), 0);
  assert.equal(
    await page.evaluate(() => window.__SHIKUJIN__.app.world.result.reason),
    "retreat",
  );
  await page.screenshot({ path: "test-results/retreat.png" });
  await page.locator("#returnHangar").click();
  console.log(
    "FEEDBACK: levels, boss/map tools, frozen hazards, boundary, pause restoration and safe return",
  );
  // Screenshot and exercise every weapon with fixed, durable targets.
  for (const ship of ["kestrel", "wraith", "bastion", "seraph", "oracle"]) {
    await page.locator(`[data-ship=${ship}]`).click();
    await page.locator("#launch").click();
    await page.evaluate(() => {
      const { app } = window.__SHIKUJIN__,
        w = app.world;
      w.debugInvincible = true;
      window.__weaponKinds = new Set();
      const emit = w.playerBullet.bind(w);
      w.playerBullet = (...args) => {
        const bullet = emit(...args);
        if (bullet) window.__weaponKinds.add(bullet.kind);
        return bullet;
      };
      w.spawnTimer = 1e6;
      w.waveTime = -1e6;
      for (let i = 0; i < 8; i++) {
        const e = w.spawn("tank");
        e.x = -240 + i * 70;
        e.y = -260;
        e.hp = e.maxHp = 1e8;
        e.fire = 1e6;
        e.speed = 0;
      }
      app.bannerUntil = 0;
      app.commsUntil = 0;
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `test-results/weapon-${ship}.png` });
    const config = await page.evaluate(() => {
      const w = window.__SHIKUJIN__.app.world;
      return {
        weapon: w.ship.weapon,
        beams: w.beams.length,
        kinds: [...window.__weaponKinds],
      };
    });
    if (ship === "wraith") assert.ok(config.beams > 0);
    if (ship === "oracle")
      assert.ok(
        config.kinds.includes("escort") && config.kinds.includes("missile"),
      );
    await page.keyboard.press("Escape");
    await page.locator("#abandon").click();
    await page.locator("#returnHangar").click();
  }
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto("http://127.0.0.1:4186/?qa");
  await mobile.keyboard.type("wwssadadba");
  await mobile.keyboard.press("Enter");
  await mobile.locator("[data-debug=money]").click();
  await mobile.screenshot({ path: "test-results/debug-mobile.png" });
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await mobile.locator("#debugClose").click();
  await mobile.locator("#launch").click();
  await mobile.keyboard.press("Escape");
  await mobile.locator("#abandon").click();
  assert.equal(await mobile.locator(".result-art.damaged").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: secret console without QA, persisted edits, five weapon families, frozen bullet hazards, edge signage, retreat art, desktop/mobile, no browser errors.",
  );
} finally {
  await browser?.close();
  server.kill();
}
