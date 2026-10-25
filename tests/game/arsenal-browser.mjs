import { chromium } from "../../tools/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const server = spawn(
  "python3",
  ["-m", "http.server", "4188", "--bind", "127.0.0.1"],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4188")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ headless: true });
  await mkdir("test-results", { recursive: true });
  const errors = [];
  for (const mobile of [false, true]) {
    const page = await browser.newPage(
      mobile
        ? {
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
          }
        : { viewport: { width: 1440, height: 960 } },
    );
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:4188/?qa");
    await page.locator("#launch").click();
    await page.waitForFunction(() =>
      window.__SHIKUJIN__.app.renderer.cache.sprite("craft", 0),
    );
    // Rasterize every directional archetype at eight angles in BOTH rendering paths.
    // Measure pixel covariance, so a texture/shader y-flip cannot pass by checking input angles.
    const measurements = await page.evaluate(async () => {
      const { PROJECTILES } = await import("./src/content/projectiles.js");
      const r = window.__SHIKUJIN__.app.renderer,
        w = window.__SHIKUJIN__.app.world;
      w.state = "paused";
      const stats = [];
      const measure = (pixels, W, H, flip) => {
        let mass = 0,
          x = 0,
          y = 0,
          xx = 0,
          yy = 0,
          xy = 0;
        for (let py = 0; py < H; py++)
          for (let px = 0; px < W; px++) {
            const o = (py * W + px) * 4,
              weight =
                pixels[o + 3] > 30
                  ? Math.max(pixels[o], pixels[o + 1], pixels[o + 2]) / 255
                  : 0;
            if (!weight) continue;
            const sy = flip ? H - 1 - py : py;
            mass += weight;
            x += px * weight;
            y += sy * weight;
            xx += px * px * weight;
            yy += sy * sy * weight;
            xy += px * sy * weight;
          }
        if (mass < 4) throw Error("projectile raster empty");
        return (
          0.5 *
          Math.atan2(
            2 * (xy - (x * y) / mass),
            xx - (x * x) / mass - yy + (y * y) / mass,
          )
        );
      };
      for (const gpu of [true, false])
        for (const [id, def] of Object.entries(PROJECTILES)) {
          if (def.shape === "orb") continue;
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4,
              b = {
                x: 0,
                y: 0,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                life: 1,
                type: id,
                kind: id,
                enemy: false,
              };
            w.bullets = [b];
            r.fx.available = gpu;
            let observed;
            if (gpu) {
              // Synthetic raster: drop the stage-column scissor (resize() restores it).
              r.fx.clip = null;
              r.fx.begin(160, 160, 0, 0, 2);
              r.fx.resize(160, 160, 2);
              r.projectiles(r.ctx, w, () => true);
              r.fx.flush();
              const gl = r.fx.gl,
                pixels = new Uint8Array(320 * 320 * 4);
              gl.readPixels(0, 0, 320, 320, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
              observed = measure(pixels, 320, 320, true);
            } else {
              const cv = document.createElement("canvas");
              cv.width = cv.height = 320;
              const c = cv.getContext("2d");
              c.translate(160, 160);
              c.scale(4, 4);
              r.projectiles(c, w, () => true);
              observed = measure(
                c.getImageData(0, 0, 320, 320).data,
                320,
                320,
                false,
              );
            }
            const error = Math.abs(
              Math.atan2(
                Math.sin(2 * (observed - angle)),
                Math.cos(2 * (observed - angle)),
              ) / 2,
            );
            stats.push({ id, gpu, angle, error });
          }
        }
      w.bullets = [];
      r.fx.available = true;
      r.resize();
      return stats;
    });
    assert.ok(
      measurements.every((m) => m.error < 0.09),
      JSON.stringify(measurements.filter((m) => m.error >= 0.09)),
    );
    console.log(
      `${mobile ? "mobile" : "desktop"}: ${measurements.length} actual raster orientation checks passed`,
    );
    await page.evaluate(() => {
      const { app } = window.__SHIKUJIN__,
        w = app.world;
      w.state = "playing";
      w.spawnTimer = 1e6;
      w.waveTime = -1e6;
      w.debugInvincible = true;
      for (let i = 0; i < 10; i++) {
        const e = w.spawn("tank");
        Object.assign(e, {
          x: -300 + i * 65,
          y: -270,
          hp: 1e7,
          maxHp: 1e7,
          speed: 0,
          fire: 1e6,
        });
      }
      w.queueUpgrade();
    });
    const oldIds = await page
      .locator("[data-upgrade]")
      .evaluateAll((es) => es.map((e) => e.dataset.upgrade));
    await page.locator("#rerollUpgrade").click();
    const ids = await page
      .locator("[data-upgrade]")
      .evaluateAll((es) => es.map((e) => e.dataset.upgrade));
    assert.ok(ids.every((id) => !oldIds.includes(id)));
    await page.screenshot({
      path: `test-results/build-${mobile ? "mobile" : "desktop"}.png`,
    });
    await page.locator("[data-upgrade]").first().click();
    await page.evaluate(async () => {
      const { app } = window.__SHIKUJIN__,
        w = app.world,
        { SHIPS } = await import("./src/content/catalog.js");
      w.ship = SHIPS.find((s) => s.weapon === "laser");
      w.player.invuln = 4;
      w.upgrades = { arc: 3, burn: 2, frost: 2, mines: 2, wing: 2, pulse: 2 };
      w.player.multi = 3;
      // Collect actual alpha submitted for the player's texture throughout invulnerability.
      const r = app.renderer,
        emit = r.fx.sprite.bind(r.fx);
      window.__playerAlphas = [];
      r.fx.sprite = (image, x, y, size, angle, alpha, black) => {
        if (size === r.shipSize && !black) window.__playerAlphas.push(alpha);
        return emit(image, x, y, size, angle, alpha, black);
      };
      app.bannerUntil = 0;
      app.commsUntil = 0;
    });
    await page.waitForTimeout(650);
    assert.ok(
      await page.evaluate(
        () =>
          window.__playerAlphas.length > 5 &&
          window.__playerAlphas.every((a) => a >= 0.65),
      ),
    );
    await page.screenshot({
      path: `test-results/arsenal-${mobile ? "mobile" : "desktop"}.png`,
    });
    await page.evaluate(() => {
      const w = window.__SHIKUJIN__.app.world;
      w.wave = 25;
      w.finish(true);
    });
    const credits = await page.evaluate(
      () => window.__SHIKUJIN__.store.data.credits,
    );
    await page.locator("#continueEndless").click();
    await page.locator('[data-supply="repair"]').click();
    const end = await page.evaluate(() => {
      const { app, store } = window.__SHIKUJIN__;
      return {
        wave: app.world.wave,
        mode: app.world.mode,
        map: app.world.mapIndex,
        credits: store.data.credits,
      };
    });
    assert.deepEqual(end, { wave: 26, mode: "endless", map: 0, credits });
    await page.evaluate(() =>
      window.__SHIKUJIN__.app.world.finish(false, "retreat"),
    );
    await page.locator("#returnHangar").click();
    await page.reload();
    assert.equal(
      await page.evaluate(() => window.__SHIKUJIN__.store.data.runs),
      1,
    );
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: builds, reroll, visible player, curved laser, campaign continuation and persisted single settlement; desktop/mobile raster angles.",
  );
} finally {
  await browser?.close();
  server.kill();
}
