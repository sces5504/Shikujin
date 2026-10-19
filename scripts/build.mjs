import { rm, mkdir, cp, readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
async function files(path) {
  const out = [];
  for (const e of await readdir(path, { withFileTypes: true })) {
    const p = `${path}/${e.name}`;
    if (e.isDirectory()) out.push(...(await files(p)));
    else out.push(p);
  }
  return out;
}
const sources = [
    "index.html",
    "style.css",
    ...(await files("src")),
    ...(await files("assets")),
  ].sort(),
  hash = createHash("sha256");
for (const p of sources) {
  hash.update(p);
  hash.update(await readFile(p));
}
hash.update(await readFile("scripts/build.mjs"));
const revision = hash.digest("hex").slice(0, 12);
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const path of ["index.html", "style.css", "src", "assets"])
  await cp(path, `dist/${path}`, { recursive: true });
for (const p of [
  "dist/index.html",
  "dist/style.css",
  ...(await files("dist/src")),
]) {
  let source = await readFile(p, "utf8");
  if (p.endsWith(".js"))
    source = source.replace(
      /((?:from\s*|import\s*)["'])(\.[^"']+\.js)(["'])/g,
      `$1$2?v=${revision}$3`,
    );
  source = source.replace(/\.(webp|woff|ttf)(?=["'`\)])/g, `.$1?v=${revision}`);
  if (p.endsWith(".html"))
    source = source
      .replace("./style.css", `./style.css?v=${revision}`)
      .replace("./src/main.js", `./src/main.js?v=${revision}`)
      .replace("</head>", `<meta name="build" content="${revision}"></head>`);
  await writeFile(p, source);
}
console.log(`Built isolated static game in dist/ (revision ${revision})`);
