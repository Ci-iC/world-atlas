import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [draft, editor = '../map-editor'] = process.argv.slice(2);
if (!draft) {
  console.error('用法：node tools/import-map.mjs <地图编辑器导出的 .atlas.json> [地图编辑器目录]');
  process.exit(1);
}

const world = JSON.parse(await readFile(new URL('../docs/data/world.json', import.meta.url), 'utf8'));
const atlas = JSON.parse(await readFile(draft, 'utf8'));
if (atlas.schema !== 'atlas-forge/v1') throw new Error('需要地图编辑器的 atlas-forge/v1 工程文件。');

// Use the editor's curve and label placement so the published draft follows the exported geometry.
const { outline, labelPoint } = await import(pathToFileURL(join(resolve(editor), 'src/geometry.js')));
const { pointsOf } = await import(pathToFileURL(join(resolve(editor), 'src/model.js')));
const geometry = { viewBox: [0, 0, atlas.width, atlas.height], land: [], countries: [], regions: [] };
const entries = new Map(world.regions.filter(region => region.mapName).map(region => [region.mapName, region.id]));
const mapped = new Set();
const labeled = new Set();

for (const area of atlas.areas) {
  if (!['land', 'countries', 'regions'].includes(area.layerId)) continue;

  const points = pointsOf(atlas, area);
  const path = outline(points, area.smooth);
  if (area.layerId !== 'regions') {
    geometry[area.layerId].push(path);
    continue;
  }

  const id = entries.get(area.name);
  if (!id) throw new Error(`地区「${area.name}」缺少对应的 world.json mapName。`);
  mapped.add(id);
  const shape = { id, path, color: area.color };
  if (area.showLabel !== false && !labeled.has(id)) {
    const { x, y } = area.labelPosition || labelPoint(points);
    shape.label = [Math.round(x), Math.round(y)];
    labeled.add(id);
  }
  geometry.regions.push(shape);
}

for (const [name, id] of entries) {
  if (!mapped.has(id)) throw new Error(`工程找不到地区「${name}」的矢量形状。`);
}

const output = new URL('../docs/data/map.json', import.meta.url);
await writeFile(output, `${JSON.stringify(geometry)}\n`);
console.log(`已写入 ${geometry.regions.length} 个点击区域，共 ${mapped.size} 条地区记录。`);
