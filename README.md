# 三国大洲 · 世界图鉴

可独立发布到 GitHub Pages 的静态世界观站点。地图显示参考区划草案，地区索引收录 15 个地区、五部共同圣地和 5 条未归属区域资料。其中东部与南部远海通过索引进入。

## 本地查看

使用 Node.js 20 或更新版本。在 Windows 双击 `preview.cmd`，或从本站目录运行 `node tools/preview.mjs`。打开 [本地地图](http://127.0.0.1:4180/world-atlas/)。预览使用 GitHub Pages 项目站点的子路径结构。

## 更新设定和图片

- `docs/data/world.json` 保存地区说明、家族、神器与正文。用 `id` 定位已有条目，保留该字段可以沿用地区链接，例如 `region.html?id=vesaryn`。地区的 `sections` 按顺序展示，每节有 `title` 和 `paragraphs`。
- 地区图片放在 `docs/assets/regions/<id>/`。在对应地区增加 `images`，其中每项使用相对站点根目录的图片路径，并附上替代文字。网站有图片时才显示图集。

```json
"images": [
  {"src": "assets/regions/vesaryn/plateau.webp", "alt": "层叠的白珊瑚台地", "caption": "维萨伦概念图"}
]
```

- 新增只在索引展示的条目时，可省略 `mapName`。已有地图覆盖区域通过 `mapName` 对应地图编辑器中的区域名称。新增或调整边界后，在本站目录用编辑器工程重新生成 `docs/data/map.json`。

```powershell
node tools/import-map.mjs '../map-editor/drafts/三国大洲-参考草案.atlas.json'
```

- 换美术底图时，把与矢量画布对齐的图片放入 `docs/assets/`，在 `world.json` 顶层加入 `"mapArtwork": "assets/continent.webp"`。当前画布为 4096 × 3072，底图需要匹配该构图范围。若新图移动了海岸或区域位置，应同时更新矢量点击范围。

## GitHub Pages

将 `world-atlas` 作为独立仓库根目录，推送 `main`。在仓库 **Settings → Pages** 选择 **Deploy from a branch → main → /docs** 并保存。`docs/` 是发布目录，站点无需安装依赖或执行构建。此后推送至 `main` 的更新会触发重新发布。

原始工程和原始设定文件留在工作区。发布站点只使用 `docs/` 下的整理稿和导出资源。
