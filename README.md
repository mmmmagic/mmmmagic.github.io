# mmmmagic.github.io

mmmmagic 的个人网站 —— 单文件静态页面，托管在 GitHub Pages。

- 站点：https://mmmmagic.github.io
- 设计/代码：Claude（网页版），由 DeepSeek Harness 代为构建与部署
- 视觉：深色极简，背景复刻 DeepSeek Harness 的 `dsh-plugin-wallpaper-engine` 渲染链路

## 背景是怎么渲染的

不是随手一张模糊图，而是照 `dsh-plugin-wallpaper-engine`（`lib/client.js` 的
`applyEffects` + 内置样式表）一项项搬过来的：

| 插件里的东西 | 本站里的对应物 |
| --- | --- |
| `.we-layer`（`z-index:-2`）里的 `.we-media`（`object-fit` + 滤镜 + `scale(1 + blur×0.006)`） | `body::before` |
| `.we-scrim`（`z-index:-1`）`rgba(0,0,0,scrim)` | `body::after` |
| `html{background-color: 兜底色}` | `html` 的背景色（壁纸没铺满时不闪白） |
| 设置真源：宿主文件 `%USERPROFILE%\.dsh-wallpaper-engine\config.json` 的 `config.settings` | `index.html` 的 `:root` 变量（同一批键名） |
| localStorage 缓存键 `dsh-wallpaper-engine:selection` | 页面加载时读同名键，存在就覆盖默认值（字段、范围与插件 `settings-schema.js` 一致） |

### 当前值与 DSH 存档逐字段相同

来源 `config.json`（`settingsVersion` 5）——两边的设置是同一份，不是两套相似的数值：

| 插件字段 | DSH 里的值 | 本站变量 |
| --- | --- | --- |
| `wallpaperBlur` | 3 | `--we-wallpaper-blur:3` |
| `backgroundBrightness` | 90 | `--we-brightness:90%` |
| `backgroundContrast` | 100 | `--we-contrast:100%` |
| `backgroundSaturate` | 100 | `--we-saturate:100%` |
| `scrim` | 0.25 | `--we-scrim:.25` |
| `wallpaperOpacity` | 60 | `--we-wallpaper-opacity:.4`（= (100−60)/100，与插件同算法） |
| `objectFit` | contain | `--we-object-fit:contain` |
| `flip` | false | `--we-flip-x:1` |

滤镜与变换公式和插件完全一致：`blur(Bpx) brightness(Y%) contrast(Z%) saturate(W%)`，
模糊边缘按 `scale(1 + B × 0.006)` 补偿。

### 改完 DSH 的壁纸设置后，一键同步

```bash
cd website
node tools/sync-dsh-background.mjs            # 读存档，重写 index.html 的 :root 变量
node tools/sync-dsh-background.mjs --dry-run  # 只看将写入什么，不动文件
git add -A && git commit -m "Sync wallpaper settings with DSH" && git push
```

脚本只认 `config.json`（插件认定的唯一真源；localStorage 只是它的缓存），
所以 DSH 里拖动滑杆 → 关一次设置面板让它落盘 → 跑脚本 → push，网站就跟着变。

唯一有意偏离的地方：手机端（`@media (max-width:768px)`）把 `object-fit` 覆盖成 `cover`，
否则 `contain` 在竖屏上只剩一条窄图；桌面端与 DSH 完全一致。

## 本地预览

直接用浏览器打开 `index.html`，或：

```bash
python -m http.server 8000
```

## 结构

- `index.html` —— 页面（内联 CSS/JS，中英双语）
- `assets/wallpaper.webp` —— 全站背景壁纸（原图 `白尾红眸狼耳战士.png` 带透明通道，转带 alpha 的 WebP 后 89 KB；透明处按插件行为露出页面底色）
- `assets/avatar.png` —— 头像（favicon / hero / og）
- `assets/lycaon-art.webp` —— 关于区配图（黑白处理以契合配色）
- `assets/lycaon-hero.webp` —— 旧背景壁纸，现未引用（留作备用）
- `assets/og.png` —— 社交分享预览图
- `tools/sync-dsh-background.mjs` —— 从 DSH 插件存档同步背景设置（见上）
- `.nojekyll` —— 跳过 Jekyll 处理

> 本站为个人同人性质页面，莱卡恩相关版权归 HoYoverse / 米哈游所有。
