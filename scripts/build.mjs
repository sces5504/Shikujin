import { rm, mkdir, cp } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const path of ["index.html", "style.css", "src"])
  await cp(path, `dist/${path}`, { recursive: true });
await cp("assets", "dist/assets", { recursive: true });
console.log("Built isolated static game in dist/");
