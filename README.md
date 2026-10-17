# mmmmagic.github.io

mmmmagic 的个人网站 —— 单文件静态页面，托管在 GitHub Pages。

- 站点：https://mmmmagic.github.io
- 设计/代码：Claude（网页版），由 DeepSeek Harness 代为构建与部署
- 视觉：深色极简，背景为模糊壁纸（参考 DeepSeek Harness Web 的观感），非蓝紫配色

## 本地预览

直接用浏览器打开 `index.html`，或：

```bash
python -m http.server 8000
```

## 结构

- `index.html` —— 页面（内联 CSS/JS，中英双语）
- `assets/avatar.png` —— 头像（favicon / hero / og）
- `assets/lycaon-hero.webp` —— 全站背景壁纸（CSS 模糊 + 压暗处理）
- `assets/lycaon-art.webp` —— 关于区配图（黑白处理以契合配色）
- `assets/og.png` —— 社交分享预览图
- `.nojekyll` —— 跳过 Jekyll 处理

> 本站为个人同人性质页面，莱卡恩相关版权归 HoYoverse / 米哈游所有。
