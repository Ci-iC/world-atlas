import { appendSections, artwork, assetUrl, element, entryHref, readData, regionHref } from './world.js';

const container = document.querySelector('#entry');
const trail = document.querySelector('#entry-trail');

function pageHeader(kicker, title, summary) {
  const header = element('header', 'detail-header entry-header');
  header.append(element('p', 'detail-kicker', kicker), element('h1', '', title));
  if (summary) header.append(element('p', 'detail-summary', summary));
  return header;
}

function picture(data, eager) {
  const figure = element('figure', 'entry-picture');
  const open = element('a');
  open.href = assetUrl(data.src);
  open.target = '_blank';
  open.rel = 'noopener';
  open.setAttribute('aria-label', `查看原图：${data.caption ?? data.alt}`);
  open.append(artwork(data, { eager }));
  figure.append(open);
  if (data.caption) figure.append(element('figcaption', '', data.caption));
  return figure;
}

function loreCard(title, sections) {
  const card = element('section', 'detail-card');
  card.append(element('h2', '', title));
  appendSections(card, sections);
  return card;
}

function landmarkPage(city, region, detail) {
  const header = pageHeader(`${city.latin} · ${city.role}`, city.name, city.summary);
  if (!city.sections?.length) {
    container.replaceChildren(header, element('p', 'entry-empty', '地标详细设定待补。'));
    return;
  }

  const images = element('div', 'city-artwork');
  for (const [index, image] of (city.images ?? []).entries()) images.append(picture(image, index === 0));
  const body = element('div', 'landmark-layout');
  body.append(images, loreCard('城市设定', city.sections));

  const next = element('nav', 'landmark-index related-places');
  next.setAttribute('aria-label', '同地区的其他城市');
  for (const place of detail.landmarks.filter(place => place.id !== city.id)) {
    const link = element('a', 'landmark-index-link');
    link.href = entryHref(region.id, place.id);
    link.append(element('strong', '', place.name), element('span', '', place.role));
    next.append(link);
  }
  container.replaceChildren(header, body, next);
}

function abilitiesPage(ability, region) {
  const header = pageHeader(region.name, ability.title, ability.summary);
  const nav = element('nav', 'landmark-index ability-index');
  nav.setAttribute('aria-label', '授印等级');
  const levels = element('div', 'ability-levels');
  for (const [index, level] of ability.levels.entries()) {
    const link = element('a', 'landmark-index-link');
    link.href = `#${level.id}`;
    link.append(element('strong', '', level.name), element('span', '', level.rank));
    nav.append(link);

    const panel = element('section', 'ability-level');
    panel.id = level.id;
    const text = element('div', 'ability-level-text');
    text.append(element('p', 'detail-kicker', level.rank), element('h2', '', level.name), element('p', 'ability-focus', level.focus));
    appendSections(text, level.sections);
    panel.append(picture(level.image, index === 0), text);
    levels.append(panel);
  }
  const rules = loreCard('授印规则', ability.rules);
  rules.classList.add('imprint-rules');
  container.replaceChildren(header, nav, levels, rules);
  const target = ability.levels.find(level => `#${level.id}` === location.hash);
  if (target) document.getElementById(target.id).scrollIntoView();
}

function showMessage(title, message) {
  container.replaceChildren(pageHeader('', title, message));
}

async function init() {
  const query = new URLSearchParams(location.search);
  const world = await readData('world');
  const region = world.regions.find(candidate => candidate.id === query.get('region') && candidate.detail);
  if (!region) {
    showMessage('找不到该档案', '从大洲地图选择地区后，再进入对应的地标或授印资料。');
    return;
  }

  const isAbilities = query.get('view') === 'abilities';
  const divider = element('span', 'entry-trail-divider', '/');
  divider.setAttribute('aria-hidden', 'true');
  const regionLink = element('a', '', region.name);
  regionLink.href = `${regionHref(region.id)}${isAbilities ? '#regional-abilities' : '#regional-map'}`;
  trail.append(divider, regionLink);
  const detail = await readData(region.id);
  document.querySelector('#source').textContent = detail.source ?? world.source;
  const city = detail.landmarks.find(candidate => candidate.id === query.get('landmark'));
  if (isAbilities && detail.abilities) {
    document.title = `${detail.abilities.title} · ${region.name}`;
    abilitiesPage(detail.abilities, region);
  } else if (city) {
    document.title = `${city.name} · ${region.name}`;
    landmarkPage(city, region, detail);
  } else {
    showMessage('找不到该档案', `返回${region.name}查看已收录的地标和能力。`);
  }
}

init().catch(error => {
  console.error(error);
  showMessage('资料加载失败', '请刷新网页，或从大洲地图重新进入。');
});
