#!/usr/bin/env node
/**
 * sync-dsh-background.mjs
 *
 * 把 DSH 插件 dsh-plugin-wallpaper-engine 的真实存档同步到网站背景 CSS。
 *
 * 为什么是"存档"而不是"滑杆截屏"：
 *   插件把设置写在宿主文件 %USERPROFILE%\.dsh-wallpaper-engine\config.json
 *   （PORT-INDEPENDENT，插件认定的唯一真源；localStorage 只是同源缓存）。
 *   所以这里直接读那个文件，取 config.settings 里的背景相关字段，
 *   按插件 settings-schema.js 的 KINDS 范围收敛后，重写 index.html 里
 *   "==== DSH dsh-plugin-wallpaper-engine settings (auto-sync) ====" 标记之间的 CSS 变量。
 *
 * 用法：
 *   node tools/sync-dsh-background.mjs              # 读取默认存档并写回 index.html
 *   node tools/sync-dsh-background.mjs --dry-run    # 只打印将要写入的值
 *   node tools/sync-dsh-background.mjs --config <path>
 *
 * 字段映射（与 lib/settings-schema.js / lib/client.js applyEffects 一致）：
 *   wallpaperBlur            → --we-wallpaper-blur        px
 *   backgroundBrightness     → --we-brightness            %
 *   backgroundContrast       → --we-contrast              %
 *   backgroundSaturate       → --we-saturate              %
 *   scrim                    → --we-scrim                 0–1
 *   wallpaperOpacity         → --we-wallpaper-opacity     (100 - v) / 100
 *   objectFit                → --we-object-fit            contain | cover
 *   flip                     → --we-flip-x                -1 | 1
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = resolve(ROOT, "index.html");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const cfgIdx = args.indexOf("--config");
const defaultConfig = resolve(homedir(), ".dsh-wallpaper-engine", "config.json");
const configPath = cfgIdx >= 0 && args[cfgIdx + 1] ? resolve(args[cfgIdx + 1]) : defaultConfig;

if (!existsSync(configPath)) {
  console.error(`✗ 找不到 DSH 插件存档：${configPath}`);
  console.error("  先在 DSH 里打开壁纸设置改一下任意滑杆，插件会把 config.json 落盘。");
  process.exit(1);
}

const raw = readFileSync(configPath, "utf8");
const parsed = JSON.parse(raw);
const settings = parsed && parsed.settings;
if (!settings || typeof settings !== "object") {
  console.error(`✗ ${configPath} 里没有 settings 对象，格式不对。`);
  process.exit(1);
}

/** 与插件 settings-schema.js 的 KINDS 区间一致；非法值回落到插件默认值。 */
const clamp = (v, lo, hi, dflt) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(hi, Math.max(lo, n));
};

const v = {
  wallpaperBlur: clamp(settings.wallpaperBlur, 0, 60, 0),
  backgroundBrightness: clamp(settings.backgroundBrightness, 40, 160, 100),
  backgroundContrast: clamp(settings.backgroundContrast, 40, 200, 100),
  backgroundSaturate: clamp(settings.backgroundSaturate, 0, 200, 100),
  scrim: clamp(settings.scrim, 0, 1, 0.25),
  wallpaperOpacity: clamp(settings.wallpaperOpacity, 0, 90, 0),
  objectFit: settings.objectFit === "contain" ? "contain" : "cover",
  flip: settings.flip === true,
};

const block = `  /* ==== DSH dsh-plugin-wallpaper-engine settings (auto-sync) ==== */
  --we-wallpaper-blur:${v.wallpaperBlur};       /* wallpaperBlur px (0–60) */
  --we-brightness:${v.backgroundBrightness}%;         /* backgroundBrightness (40–160%) */
  --we-contrast:${v.backgroundContrast}%;          /* backgroundContrast (40–200%) */
  --we-saturate:${v.backgroundSaturate}%;          /* backgroundSaturate (0–200%) */
  --we-scrim:${v.scrim};              /* scrim 0–1 */
  --we-wallpaper-opacity:${(100 - v.wallpaperOpacity) / 100};   /* (100 - wallpaperOpacity) / 100 */
  --we-object-fit:${v.objectFit};     /* objectFit: contain | cover */
  --we-flip-x:${v.flip ? -1 : 1};               /* flip ? -1 : 1 */
  /* ==== /DSH settings ==== */`;

const START = "  /* ==== DSH dsh-plugin-wallpaper-engine settings (auto-sync) ==== */";
const END = "  /* ==== /DSH settings ==== */";

const html = readFileSync(INDEX, "utf8");
const startIdx = html.indexOf(START);
const endIdx = html.indexOf(END);
if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
  console.error(`✗ index.html 里找不到同步标记（${START.trim()} … ${END.trim()}）。`);
  process.exit(1);
}

const next = html.slice(0, startIdx) + block + html.slice(endIdx + END.length);
const changed = next !== html;

const pretty = {
  "wallpaperBlur → --we-wallpaper-blur": `${v.wallpaperBlur}px`,
  "backgroundBrightness → --we-brightness": `${v.backgroundBrightness}%`,
  "backgroundContrast → --we-contrast": `${v.backgroundContrast}%`,
  "backgroundSaturate → --we-saturate": `${v.backgroundSaturate}%`,
  "scrim → --we-scrim": v.scrim,
  "wallpaperOpacity → --we-wallpaper-opacity": (100 - v.wallpaperOpacity) / 100,
  "objectFit → --we-object-fit": v.objectFit,
  "flip → --we-flip-x": v.flip ? -1 : 1,
};

console.log(`来源存档：${configPath}`);
console.log(`settingsVersion：${settings.settingsVersion ?? "(缺失)"}`);
for (const [k, val] of Object.entries(pretty)) console.log(`  ${k.padEnd(46)} ${val}`);

if (dryRun) {
  console.log("\n--dry-run：不写文件。");
  process.exit(0);
}

if (!changed) {
  console.log("\n✓ index.html 已经与存档一致，无需改动。");
  process.exit(0);
}

writeFileSync(INDEX, next, "utf8");
console.log("\n✓ 已写入 index.html。记得提交并推送：");
console.log("  git add -A && git commit -m \"Sync wallpaper settings with DSH\" && git push");
