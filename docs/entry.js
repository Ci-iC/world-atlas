import { appendSections, artwork, assetUrl, element, entryHref, readData, regionHref } from './world.js';

const container = document.querySelector('#entry');
const trail = document.querySelector('#entry-trail');

function pageHeader(kicker, title, summary) {
  const header = element('header', 'detail-header entry-header');
  header.append(element('p', 'detail-kicker', kicker), element('h1', '', title));
  if (summary) header.append(element('p', 'detail-summary', summary));
  return header;
}

function picture(data) {
  const figure = element('figure', 'entry-picture');
  const open = element('a');
  open.href = assetUrl(data.src);
  open.target = '_blank';
  open.rel = 'noopener';
  open.setAttribute('aria-label', `查看原图：${data.caption ?? data.alt}`);
  open.append(artwork(data));
  figure.append(open);
  if (data.caption) figure.append(element('figcaption', '', data.caption));
  return figure;
}

function textLink(href, text, className = 'entry-text-link') {
  const link = element('a', className, text);
  link.href = href;
  return link;
}

function cityHero(city, region, street, overview) {
  const hero = element('header', 'city-hero');
  if (street) {
    hero.classList.add('has-street');
    const photo = artwork(street, { eager: true });
    photo.className = 'city-hero-image';
    hero.append(photo);
  }
  const content = element('div', 'city-hero-text');
  content.append(element('p', 'entry-kicker', `${region.name} · ${city.role}`), element('h1', '', city.name),
    element('p', 'city-english', city.latin), element('p', 'city-lede', city.summary));
  const actions = element('div', 'city-actions');
  if (overview) actions.append(textLink('#city-plan', '查看城市全景', 'entry-action'));
  actions.append(textLink('#city-story', '阅读城市设定'));
  content.append(actions);
  hero.append(content);
  if (street) {
    const original = textLink(assetUrl(street.src), '查看街景原图', 'city-photo-link');
    original.target = '_blank';
    original.rel = 'noopener';
    hero.append(original);
  }
  return hero;
}

function cityPlan(city, overview) {
  const section = element('section', 'city-plan entry-chapter');
  section.id = 'city-plan';
  section.append(element('h2', 'entry-title', '沿运河读城'));
  const layout = element('div', 'city-plan-layout');
  layout.append(picture(overview));
  if (city.guide?.length) {
    const guide = element('aside', 'city-map-key');
    guide.append(element('h3', '', '图上位置'));
    const list = element('dl');
    for (const { label, description } of city.guide) {
      const row = element('div', 'city-map-key-row');
      row.append(element('dt', '', label), element('dd', '', description));
      list.append(row);
    }
    guide.append(list);
    layout.append(guide);
  }
  section.append(layout);
  return section;
}

function landmarkPage(city, region, detail) {
  if (!city.sections?.length) {
    container.replaceChildren(pageHeader(`${city.latin} · ${city.role}`, city.name), element('p', 'entry-empty', '地标详细设定待补。'));
    return;
  }

  document.body.classList.add('night-city');
  const street = city.images?.find(image => image.kind === 'street');
  const overview = city.images?.find(image => image.kind === 'overview');
  const hero = cityHero(city, region, street, overview);
  const story = element('section', 'city-story entry-chapter');
  story.id = 'city-story';
  story.append(element('h2', 'entry-title', '城里的日夜'));
  const sections = element('div', 'city-story-layout');
  appendSections(sections, city.sections);
  story.append(sections);

  const remaining = (city.images ?? []).filter(image => image !== street && image !== overview);
  if (remaining.length) {
    const extras = element('div', 'entry-gallery');
    extras.append(...remaining.map(picture));
    story.append(extras);
  }

  const next = element('nav', 'neighbor-cities entry-chapter');
  next.setAttribute('aria-label', '同地区的其他城市');
  next.append(element('h2', 'entry-title', `继续探索${region.name}`));
  const links = element('div', 'neighbor-links');
  for (const place of detail.landmarks.filter(place => place.id !== city.id)) {
    const link = element('a', 'neighbor-link');
    link.href = entryHref(region.id, place.id);
    link.append(element('strong', '', place.name), element('span', '', place.role));
    links.append(link);
  }
  next.append(links);
  container.replaceChildren(hero, ...(overview ? [cityPlan(city, overview)] : []), story, next);
}

function abilitiesPage(ability, region) {
  document.body.classList.add('imprint-page');
  const hero = element('header', 'imprint-hero');
  const intro = element('div', 'imprint-intro');
  intro.append(element('p', 'entry-kicker', `${region.name} · 三级授印`), element('h1', '', region.artifact || ability.title),
    element('p', 'imprint-lede', ability.summary), textLink('#imprint-rules', '查阅授印规则'));
  const nav = element('nav', 'imprint-roster');
  nav.setAttribute('aria-label', '授印等级');
  const levels = element('div', 'imprint-profiles');
  for (const [index, level] of ability.levels.entries()) {
    const link = element('a', 'imprint-portrait');
    link.href = `#${level.id}`;
    const portrait = artwork({ ...level.image, alt: '' }, { eager: true });
    const label = element('span', 'imprint-portrait-label');
    label.append(element('span', '', level.rank), element('strong', '', level.name));
    link.append(portrait, label);
    nav.append(link);

    const panel = element('section', 'imprint-profile');
    panel.id = level.id;
    panel.dataset.stage = String(index + 1);
    const text = element('div', 'imprint-profile-text');
    const title = element('h2', '', level.name);
    title.id = `${level.id}-title`;
    panel.setAttribute('aria-labelledby', title.id);
    text.append(element('p', 'entry-kicker', `${level.rank}授印`), title, element('p', 'imprint-focus', level.focus));
    if (level.flavor) text.append(element('p', 'imprint-vignette', level.flavor));
    appendSections(text, level.sections);
    panel.append(picture(level.image), text);
    levels.append(panel);
  }
  hero.append(intro, nav);
  const rules = element('section', 'imprint-rules entry-chapter');
  rules.id = 'imprint-rules';
  const notes = element('div', 'imprint-rule-notes');
  appendSections(notes, ability.rules);
  rules.append(element('h2', 'entry-title', '授印规则'), notes);
  container.replaceChildren(hero, levels, rules);
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
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

init().catch(error => {
  console.error(error);
  showMessage('资料加载失败', '请刷新网页，或从大洲地图重新进入。');
});
