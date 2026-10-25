import { SaveStore } from "./core/storage.js";
import { Input } from "./core/input.js";
import { Renderer } from "./render/renderer.js";
import { Audio } from "./render/audio.js";
import { App } from "./ui/app.js";
const canvas = document.getElementById("battlefield");
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw Error("storage unavailable");
    },
  };
}
const store = new SaveStore(storage),
  renderer = new Renderer(canvas),
  audio = new Audio();
let app;
const input = new Input(canvas, () => app?.world?.skill());
renderer.input = input;
input.scale = () => renderer.scale;
app = new App(store, renderer, audio, input);
let last = performance.now(),
  accumulator = 0;
const fixed = 1 / 60;
function frame(now) {
  const frameMs = now - last;
  const elapsed = Math.min(frameMs / 1000, 0.05);
  last = now;
  if (app.world?.state === "playing") {
    accumulator = Math.min(accumulator + elapsed, fixed * 3);
    while (accumulator >= fixed) {
      app.world.step(fixed, input.get());
      accumulator -= fixed;
      if (app.world.state !== "playing") {
        accumulator = 0;
        break;
      }
    }
  } else accumulator = 0;
  renderer.adapt(frameMs, app.world?.state === "playing");
  renderer.render(app.world, now / 1000);
  app.frame(now);
  requestAnimationFrame(frame);
}
window.addEventListener("resize", () => renderer.resize());
requestAnimationFrame(frame);
// Explicit opt-in test harness; absent during normal play, no query changes game balance.
if (new URLSearchParams(location.search).has("qa"))
  window.__SHIKUJIN__ = { app, store };
