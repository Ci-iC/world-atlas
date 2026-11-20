import { drawMap } from './map.js';
import { appendSections, artwork, assetUrl, element, entryHref, groupDot, readData } from './world.js';

const container = document.querySelector('#region');

function renderGallery(images) {
  const card = element('section', 'detail-card');
  card.append(element('h2', '', '地区图集'));
  const gallery = element('div', 'gallery');
  for (const image of images) {
    const figure = element('figure');
    figure.append(artwork(image));
    if (image.caption) figure.append(element('figcaption', '', image.caption));
    gallery.append(figure);
  }
  card.append(gallery);
  return card;
}

function renderRegionalMap(region, detail) {
  const section = element('section', 'regional-map');
  section.id = 'regional-map';
  section.setAttribute('aria-labelledby', 'regional-map-title');
  const heading = element('div', 'section-toolbar');
  const title = element('h2', '', `${region.name}地图`);
  title.id = 'regional-map-title';
  const original = element('a', 'text-link', '查看原图');
  original.href = assetUrl(detail.map.src);
  original.target = '_blank';
  original.rel = 'noopener';
  heading.append(title, original);

  const figure = element('figure', 'regional-figure');
  const surface = element('div', 'hotspot-map');
  surface.append(artwork(detail.map, { eager: true }));
  for (const city of detail.landmarks) {
    const [x, y, width, height] = city.hotspot;
    const link = element('a', 'map-hotspot');
    link.href = entryHref(region.id, city.id);
    link.title = city.name;
    link.setAttribute('aria-label', `地图地标：${city.name}，${city.role}`);
    for (const [key, value] of Object.entries({ x, y, width, height })) link.style.setProperty(`--hotspot-${key}`, `${value}%`);
    const marker = element('span', 'hotspot-marker');
    marker.setAttribute('aria-hidden', 'true');
    link.append(marker);
    surface.append(link);
  }
  figure.append(surface, element('figcaption', '', detail.map.caption));

  const cities = element('nav', 'landmark-index');
  cities.setAttribute('aria-label', '奥瑞斯坦地标索引');
  for (const city of detail.landmarks) {
    const link = element('a', 'landmark-index-link');
    link.href = entryHref(region.id, city.id);
    link.append(element('strong', '', city.name), element('span', '', city.role));
    cities.append(link);
  }
  section.append(heading, figure, cities);
  return section;
}

function renderAbilityLink(region, ability) {
  const link = element('a', 'ability-link');
  link.href = entryHref(region.id);
  link.append(element('span', 'detail-kicker', region.artifact), element('strong', '', '三级授印能力'),
    element('span', 'ability-link-levels', ability.levels.map(level => level.name).join(' · ')));
  return link;
}

function renderRegion(region, group, detail) {
  const header = element('header', 'detail-header');
  const groupLink = element('a', 'detail-group');
  groupLink.href = `./?group=${encodeURIComponent(group.id)}#directory`;
  groupLink.style.setProperty('--group-color', group.color);
  groupLink.append(groupDot(), document.createTextNode(group.name));
  header.append(groupLink, element('h1', '', region.name));
  if (region.subtitle || region.latin) header.append(element('p', 'detail-subtitle', [region.subtitle, region.latin].filter(Boolean).join(' · ')));
  header.append(element('p', 'detail-summary', region.summary));

  const grid = element('div', 'detail-grid');
  const article = element('div');
  if (region.sections?.length) {
    const lore = element('section', 'detail-card');
    lore.append(element('h2', '', '地区设定'));
    appendSections(lore, region.sections);
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
  if (detail) {
    const mapFrame = element('div', 'regional-layout');
    const visit = element('div', 'regional-side');
    if (detail.abilities) {
      const quickLink = renderAbilityLink(region, detail.abilities);
      quickLink.id = 'regional-abilities';
      visit.append(quickLink);
    }
    visit.append(side);
    mapFrame.append(renderRegionalMap(region, detail), visit);
    article.classList.add('regional-introduction');
    container.replaceChildren(header, mapFrame, article);
  } else {
    grid.append(article, side);
    container.replaceChildren(header, grid);
  }
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
  const detail = region.detail ? await readData(region.id) : null;
  if (detail?.source) document.querySelector('#source').textContent = detail.source;
  const side = renderRegion(region, group, detail);
  if (location.hash === '#regional-map') document.querySelector('#regional-map')?.scrollIntoView();
  if (location.hash === '#regional-abilities') document.querySelector('#regional-abilities')?.scrollIntoView();
  if (region.mapName && !detail) {
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
