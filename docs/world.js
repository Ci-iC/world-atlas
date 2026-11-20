const base = new URL('./', import.meta.url);

export async function readData(file) {
  const response = await fetch(new URL(`data/${file}.json`, base));
  if (!response.ok) throw new Error(`读取 ${file} 失败（${response.status}）`);
  return response.json();
}

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function assetUrl(path) {
  const url = new URL(path, base);
  if (url.origin !== base.origin || !url.href.startsWith(new URL('assets/', base).href)) {
    throw new Error(`图片需位于 assets/ 下：${path}`);
  }
  return url.href;
}

export function regionHref(id) {
  return `./region.html?id=${encodeURIComponent(id)}`;
}

export function entryHref(regionId, landmarkId) {
  const query = new URLSearchParams({ region: regionId });
  if (landmarkId) query.set('landmark', landmarkId);
  else query.set('view', 'abilities');
  return `./entry.html?${query}`;
}

export function artwork(data, { eager = false } = {}) {
  const img = element('img');
  img.src = assetUrl(data.src);
  img.alt = data.alt;
  if (data.width && data.height) {
    img.width = data.width;
    img.height = data.height;
  }
  img.loading = eager ? 'eager' : 'lazy';
  return img;
}

export function appendSections(parent, sections) {
  for (const section of sections) {
    const block = element('section', 'lore-section');
    block.append(element('h3', '', section.title), ...section.paragraphs.map(paragraph => element('p', '', paragraph)));
    parent.append(block);
  }
}

export function groupDot() {
  const dot = element('span', 'group-dot');
  dot.setAttribute('aria-hidden', 'true');
  return dot;
}
