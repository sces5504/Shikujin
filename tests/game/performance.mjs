import { chromium } from "../../tools/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const baseline = process.argv.includes("--baseline");
const server = spawn(
  "python3",
  ["-m", "http.server", "4182", "--bind", "127.0.0.1"],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4182")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4182/?qa");
  await page.locator("#launch").click();
  const result = await page.evaluate(async () => {
    const { app } = window.__SHIKUJIN__,
      w = app.world;
    w.enemies = [];
    w.resetProjectiles();
    w.drops = [];
    w.spawnTimer = 1e6;
    w.waveTime = -1e6;
    w.player.hp = 1e8;
    w.player.invuln = 1e6;
    w.player.fire = 1e6;
    w.player.magnet = 0;
    app.closeModal();
    for (let i = 0; i < 240; i++) {
      const e = w.spawn(
        ["scout", "striker", "orbiter", "tank", "charger", "healer"][i % 6],
      );
      e.x = ((i % 20) - 10) * 58;
      e.y = (Math.floor(i / 20) - 6) * 60;
      e.speed = 0;
      e.fire = 1e6;
      e.hp = e.maxHp = 1e7;
    }
    for (let i = 0; i < 1000; i++) {
      const e = w.enemies[i % 240];
      w.enemyBullet(e, i * 0.7, 5);
      const b = w.bullets.at(-1);
      b.x = ((i % 40) - 20) * 30;
      b.y = (Math.floor(i / 40) - 12) * 29;
      b.life = 100;
    }
    for (let i = 0; i < 750; i++)
      w.drops.push({
        x: ((i % 30) - 15) * 38,
        y: (Math.floor(i / 30) - 12) * 29,
        value: 1,
      });
    w.state = "paused";
    const cpu = [],
      render = [],
      submit = [],
      canvasSync = [],
      gpuSync = [];
    for (let i = 0; i < 72; i++) {
      w.state = "playing";
      const a = performance.now();
      w.step(1 / 60);
      cpu.push(performance.now() - a);
      w.state = "paused";
      const t = performance.now();
      app.renderer.render(w, i / 60);
      const afterSubmit = performance.now();
      app.renderer.ctx.getImageData(0, 0, 1, 1);
      const afterCanvas = performance.now();
      app.renderer.fx?.readPixels();
      const afterGpu = performance.now();
      submit.push(afterSubmit - t);
      canvasSync.push(afterCanvas - afterSubmit);
      gpuSync.push(afterGpu - afterCanvas);
      const elapsed = afterGpu - t;
      render.push(elapsed);
      app.renderer.adapt(elapsed, true);
      if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    const summarize = (a) => {
      a.sort((a, b) => a - b);
      return {
        median: +a[Math.floor(a.length * 0.5)].toFixed(2),
        p95: +a[Math.floor(a.length * 0.95)].toFixed(2),
        max: +a.at(-1).toFixed(2),
      };
    };
    return {
      gpu: app.renderer.fx?.available,
      autoResolution: app.renderer.resolution,
      gpuError: app.renderer.fx?.error,
      glError: app.renderer.fx?.gl?.getError(),
      renderSubmit: app.renderer.stats.renderMs,
      simulationMs: summarize(cpu.slice(-24)),
      submitMs: summarize(submit.slice(-24)),
      canvasSyncMs: summarize(canvasSync.slice(-24)),
      gpuSyncMs: summarize(gpuSync.slice(-24)),
      renderAndRasterMs: summarize(render.slice(-24)),
      enemies: w.enemies.length,
      bullets: w.bullets.length,
      drops: w.drops.length,
    };
  });
  assert.deepEqual(errors, []);
  await mkdir("test-results", { recursive: true });
  await writeFile(
    `test-results/performance-${baseline ? "before" : "after"}.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
  if (!baseline) {
    assert.ok(result.simulationMs.p95 < 20, "simulation p95 exceeds 20ms");
    assert.ok(
      result.renderAndRasterMs.p95 < 60,
      "1000 bullet raster p95 exceeds 60ms in software Chromium",
    );
  }
} finally {
  await browser?.close();
  server.kill();
}
