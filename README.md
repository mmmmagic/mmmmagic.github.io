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
| `.we-layer`（`z-index:-2`）里的 `.we-media` | `body::before`：壁纸 `cover` 铺满视口，左下角参数控制滤镜 |
| `.we-scrim`（`z-index:-1`）一层纯黑 | `body::after`：`rgba(0,0,0,var(--we-scrim))` |
| `html{background-color: 兜底色}` | `html` 的背景色（壁纸没送到屏时不闪白） |

滤镜与变换的公式和插件完全一致：

- 媒体滤镜：`blur(Bpx) brightness(Y%) contrast(Z%) saturate(W%)`
- 模糊会让画面边缘透出毛边 ⇒ 层按插件的补偿公式放大 `scale(1 + B × 0.006)`

可调旋钮都在 `index.html` 的 `:root` 里（对应插件的设置项）：

```css
--we-wallpaper-blur: 28;   /* 壁纸模糊 px，0–60（插件默认 0） */
--we-brightness: 74%;      /* 亮度 40–160%（插件默认 100%） */
--we-contrast: 100%;       /* 对比度 40–200% */
--we-saturate: 100%;       /* 饱和度 0–200% */
--we-scrim: .58;           /* 暗化 0–1（插件默认 .25） */
--we-wallpaper-opacity: 1; /* 壁纸透明度，1 = 不透明 */
```

这张壁纸本身偏亮（大面积白底），所以亮度与暗化比插件默认值压得更低，
才能在深色版式下保持文字对比度；想要更接近 "DSH 原味" 的亮度，
把 `--we-brightness` 调回 `100%`、`--we-scrim` 调回 `.25` 即可。

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
- `.nojekyll` —— 跳过 Jekyll 处理

> 本站为个人同人性质页面，莱卡恩相关版权归 HoYoverse / 米哈游所有。
