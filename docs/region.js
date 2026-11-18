import { drawMap } from './map.js';
import { assetUrl, element, groupDot, readData } from './world.js';

const container = document.querySelector('#region');

function renderGallery(images) {
  const card = element('section', 'detail-card');
  card.append(element('h2', '', '地区图集'));
  const gallery = element('div', 'gallery');
  for (const image of images) {
    const figure = element('figure');
    const img = element('img');
    img.src = assetUrl(image.src);
    img.alt = image.alt;
    img.loading = 'lazy';
    figure.append(img);
    if (image.caption) figure.append(element('figcaption', '', image.caption));
    gallery.append(figure);
  }
  card.append(gallery);
  return card;
}

function renderRegion(region, group) {
  const header = element('header', 'detail-header');
  const groupLink = element('a', 'detail-group');
  groupLink.href = `./?group=${encodeURIComponent(group.id)}#directory`;
  groupLink.style.setProperty('--group-color', group.color);
  groupLink.append(groupDot(), document.createTextNode(group.name));
  header.append(groupLink, element('h1', '', region.name));
  if (region.subtitle) header.append(element('p', 'detail-subtitle', [region.subtitle, region.latin].filter(Boolean).join(' · ')));
  header.append(element('p', 'detail-summary', region.summary));

  const grid = element('div', 'detail-grid');
  const article = element('div');
  if (region.sections?.length) {
    const lore = element('section', 'detail-card');
    lore.append(element('h2', '', '地区设定'));
    for (const section of region.sections) {
      const block = element('section', 'lore-section');
      block.append(element('h3', '', section.title), ...section.paragraphs.map(paragraph => element('p', '', paragraph)));
      lore.append(block);
    }
    article.append(lore);
  }
  if (region.images?.length) article.append(renderGallery(region.images));

  const side = element('aside', 'detail-card');
  side.append(element('h2', '', '档案概览'));
  const facts = element('dl', 'facts');
  for (const [label, value] of [
    ['归属', region.affiliation ?? group.name],
    ['方位', region.position], ['统治家族', region.house], ['神器', region.artifact], ['地貌与特色', region.tags],
  ]) {
    if (!value) continue;
    const fact = element('div', 'fact');
    fact.append(element('dt', '', label), element('dd', '', value));
    facts.append(fact);
  }
  side.append(facts);
  grid.append(article, side);
  container.replaceChildren(header, grid);
  return side;
}

function renderMessage(title, message) {
  const placeholder = element('div', 'detail-placeholder');
  placeholder.append(element('h1', '', title), element('p', '', message));
  container.replaceChildren(placeholder);
}

async function init() {
  const world = await readData('world');
  document.querySelector('#source').textContent = world.source;
  const id = new URLSearchParams(location.search).get('id');
  const region = world.regions.find(entry => entry.id === id);
  if (!region) {
    renderMessage('找不到该地区', '返回大洲地图或地区索引，选择一条现有资料。');
    return;
  }
  document.title = `${region.name} · ${world.title}`;
  const group = world.groups.find(entry => entry.id === region.group);
  const side = renderRegion(region, group);
  if (region.mapName) {
    try {
      const geometry = await readData('map');
      const locator = element('figure', 'locator');
      locator.append(drawMap(world, geometry, { selected: id }), element('figcaption', '', world.mapNote));
      side.append(locator);
    } catch (error) {
      console.error(error);
    }
  }
}

init().catch(error => {
  console.error(error);
  renderMessage('地区资料加载失败', '请刷新重试，或返回大洲地图。');
});
