import { drawMap, enableMapControls } from './map.js';
import { element, groupDot, readData, regionHref } from './world.js';

const directory = document.querySelector('#region-list');
const search = document.querySelector('#search');
const filters = document.querySelector('#filters');
const map = document.querySelector('#continent');

function initDirectory(world) {
  const all = { id: '', name: '全部' };
  const initialGroup = new URLSearchParams(location.search).get('group');
  let groupId = world.groups.some(group => group.id === initialGroup) ? initialGroup : '';
  let visibleIds = new Set();

  function updateMapFilter() {
    for (const node of map.querySelectorAll('[data-region]')) {
      node.classList.toggle('is-muted', !visibleIds.has(node.dataset.region));
    }
  }

  function renderResults() {
    const query = search.value.trim().toLowerCase();
    const matches = world.regions.filter(region => {
      if (groupId && groupId !== region.group) return false;
      const terms = [region.name, region.subtitle, region.latin, region.house, region.artifact, region.tags];
      return terms.some(term => term?.toLowerCase().includes(query));
    });
    visibleIds = new Set(matches.map(region => region.id));
    const sections = [];
    for (const group of world.groups) {
      const items = matches.filter(region => region.group === group.id);
      if (!items.length) continue;
      const section = element('section', 'region-group');
      section.style.setProperty('--group-color', group.color);
      const heading = element('h3', 'group-title');
      heading.append(groupDot(), document.createTextNode(group.name), element('small', '', `${items.length} 条`));
      const list = element('ul');
      for (const region of items) {
        const item = element('li');
        const link = element('a', 'region-link');
        link.href = regionHref(region.id);
        const text = element('span');
        text.append(element('strong', '', region.name), element('small', '', [region.subtitle, region.tags].filter(Boolean).join(' · ')));
        const arrow = element('span', 'link-arrow', '↗');
        arrow.setAttribute('aria-hidden', 'true');
        link.append(text, arrow);
        item.append(link);
        list.append(item);
      }
      section.append(heading, list);
      sections.push(section);
    }
    directory.replaceChildren(...(sections.length ? sections : [element('p', 'message', '没有找到符合条件的地区。')]));
    directory.scrollTop = 0;
    document.querySelector('#result-count').textContent = `${matches.length} 条资料`;
    updateMapFilter();
  }

  const buttons = [all, ...world.groups].map(group => {
    const button = element('button', 'filter', group.name);
    button.type = 'button';
    button.dataset.group = group.id;
    button.setAttribute('aria-pressed', String(group.id === groupId));
    button.addEventListener('click', () => {
      groupId = group.id;
      for (const filter of buttons) filter.setAttribute('aria-pressed', String(filter.dataset.group === groupId));
      renderResults();
    });
    return button;
  });
  filters.append(...buttons);
  search.addEventListener('input', renderResults);
  renderResults();
  return updateMapFilter;
}

function renderOverview(world) {
  for (const group of world.groups) {
    const note = element('article', 'note');
    note.style.setProperty('--group-color', group.color);
    const title = element('h3');
    title.append(groupDot(), document.createTextNode(group.name));
    note.append(title, element('p', '', group.description));
    document.querySelector('#world-groups').append(note);
  }
}

async function init() {
  const world = await readData('world');
  document.querySelector('#atlas-title').textContent = world.title;
  document.title = `${world.title} · 世界图鉴`;
  document.querySelector('#source').textContent = world.source;
  document.querySelector('#map-note').textContent = world.mapNote;
  const updateMapFilter = initDirectory(world);
  renderOverview(world);
  try {
    const geometry = await readData('map');
    const svg = drawMap(world, geometry, { interactive: true });
    map.append(svg);
    enableMapControls(svg, geometry.viewBox);
    updateMapFilter();
  } catch (error) {
    console.error(error);
    map.replaceChildren(element('p', 'message', '地图加载失败。可从地区索引打开档案。'));
  }
}

const mapPanel = document.querySelector('.map-panel');
new ResizeObserver(([entry]) => {
  document.querySelector('.directory').style.setProperty('--directory-height', `${entry.target.offsetHeight}px`);
}).observe(mapPanel);

init().catch(error => {
  console.error(error);
  directory.replaceChildren(element('p', 'message', '地区资料加载失败，请刷新重试。'));
  map.replaceChildren(element('p', 'message', '地图加载失败，请刷新重试。'));
});
