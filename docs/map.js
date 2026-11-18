import { assetUrl, regionHref } from './world.js';

const svgNs = 'http://www.w3.org/2000/svg';

function svgElement(tag, attributes = {}) {
  const node = document.createElementNS(svgNs, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

export function drawMap(world, geometry, { selected, interactive = false } = {}) {
  const groups = new Map(world.groups.map(group => [group.id, group]));
  const regions = new Map(world.regions.map(region => [region.id, region]));
  const [x, y, width, height] = geometry.viewBox;
  const svg = svgElement('svg', {
    class: 'continent-svg', viewBox: geometry.viewBox.join(' '),
    role: interactive ? 'group' : 'img', 'aria-label': interactive ? '三国大洲地图' : '地区在大洲地图中的示意位置',
  });
  if (interactive) svg.setAttribute('tabindex', '0');

  const defs = svgElement('defs');
  const grid = svgElement('pattern', { id: 'map-grid', width: 256, height: 256, patternUnits: 'userSpaceOnUse' });
  grid.append(svgElement('path', { d: 'M256 0H0V256', fill: 'none', stroke: '#b9c7b5', 'stroke-opacity': '.20', 'stroke-width': 3 }));
  const light = svgElement('linearGradient', { id: 'land-light', x1: '.2', y1: '0', x2: '.75', y2: '1' });
  light.append(svgElement('stop', { 'stop-color': '#f2eed4', 'stop-opacity': '.23' }));
  light.append(svgElement('stop', { offset: '100%', 'stop-color': '#47321a', 'stop-opacity': '.2' }));
  defs.append(grid, light);
  svg.append(defs, svgElement('rect', { x, y, width, height, class: 'map-grid' }));

  const land = svgElement('g', { 'aria-hidden': 'true' });
  for (const path of geometry.land) {
    land.append(svgElement('path', { d: path, class: 'shoreline' }), svgElement('path', { d: path, class: 'land' }));
  }
  svg.append(land);

  if (world.mapArtwork) {
    const image = svgElement('image', { x, y, width, height, href: assetUrl(world.mapArtwork), class: 'map-artwork', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    image.addEventListener('load', () => svg.classList.add('has-artwork'), { once: true });
    svg.append(image);
  }

  const countryLines = svgElement('g', { 'aria-hidden': 'true' });
  for (const path of geometry.countries) countryLines.append(svgElement('path', { d: path, class: 'country-line' }));
  const shapes = svgElement('g');
  const labels = svgElement('g', { 'aria-hidden': 'true' });
  const labeled = new Set(geometry.regions.filter(shape => shape.label).map(shape => shape.id));
  const tabbable = new Set();

  for (const shape of geometry.regions) {
    const region = regions.get(shape.id);
    const group = groups.get(region.group);
    const node = svgElement(interactive ? 'a' : 'g', { class: 'region-shape', 'data-region': shape.id });
    node.style.setProperty('--region-color', `color-mix(in srgb, ${region.color ?? group.color} 75%, ${shape.color})`);
    if (selected === shape.id) node.classList.add('is-highlight');
    if (selected && selected !== shape.id) node.classList.add('is-muted');
    if (interactive) {
      const canTab = !tabbable.has(shape.id) && (shape.label || !labeled.has(shape.id));
      node.setAttribute('href', regionHref(shape.id));
      node.setAttribute('tabindex', canTab ? '0' : '-1');
      node.setAttribute('aria-label', region.mapName);
      if (canTab) tabbable.add(shape.id);
      else node.setAttribute('aria-hidden', 'true');
      const title = svgElement('title');
      title.textContent = region.mapName;
      node.append(title);
    }
    node.append(svgElement('path', { d: shape.path }));
    shapes.append(node);

    if (shape.label && (interactive || selected === shape.id)) {
      const label = svgElement('text', { x: shape.label[0], y: shape.label[1], class: 'region-label', 'data-region': shape.id });
      label.textContent = region.name.replace(/地区$/, '');
      if (selected === shape.id) label.classList.add('is-highlight');
      labels.append(label);
    }
  }

  const texture = svgElement('g', { 'aria-hidden': 'true' });
  for (const path of geometry.land) texture.append(svgElement('path', { d: path, class: 'land-texture' }));
  svg.append(shapes, texture, countryLines, labels);
  return svg;
}

export function enableMapControls(svg, initial) {
  const [left, top, fullWidth, fullHeight] = initial;
  const zoomIn = document.querySelector('#zoom-in');
  const zoomOut = document.querySelector('#zoom-out');
  const reset = document.querySelector('#zoom-reset');
  const zoomSteps = [1, 1.5, 2.25, 3.375, 4.5];
  let step = 0;
  let x = left;
  let y = top;
  let pointer;
  let dragged = false;

  function update() {
    const width = fullWidth / zoomSteps[step];
    const height = fullHeight / zoomSteps[step];
    x = Math.max(left, Math.min(left + fullWidth - width, x));
    y = Math.max(top, Math.min(top + fullHeight - height, y));
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    zoomIn.disabled = step === zoomSteps.length - 1;
    zoomOut.disabled = step === 0;
    reset.disabled = step === 0;
    svg.classList.toggle('can-pan', step > 0);
  }

  function zoom(next) {
    const offset = (1 / zoomSteps[step] - 1 / zoomSteps[next]) / 2;
    x += fullWidth * offset;
    y += fullHeight * offset;
    step = next;
    update();
  }

  zoomIn.addEventListener('click', () => zoom(step + 1));
  zoomOut.addEventListener('click', () => zoom(step - 1));
  reset.addEventListener('click', () => zoom(0));
  svg.addEventListener('keydown', event => {
    if (event.target !== svg) return;
    const directions = { ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowDown: [0, 1] };
    const move = directions[event.key];
    if (!move || !step) return;
    event.preventDefault();
    x += move[0] * fullWidth / zoomSteps[step] / 8;
    y += move[1] * fullHeight / zoomSteps[step] / 8;
    update();
  });

  svg.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    dragged = false;
    if (!step) return;
    const scale = svg.getScreenCTM()?.a;
    if (scale) pointer = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, x, y, scale };
  });
  svg.addEventListener('pointermove', event => {
    if (pointer?.id !== event.pointerId) return;
    const dx = event.clientX - pointer.clientX;
    const dy = event.clientY - pointer.clientY;
    if (!dragged && Math.hypot(dx, dy) < 6) return;
    if (!dragged) svg.setPointerCapture(event.pointerId);
    dragged = true;
    svg.classList.add('is-dragging');
    x = pointer.x - dx / pointer.scale;
    y = pointer.y - dy / pointer.scale;
    update();
  });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave']) {
    svg.addEventListener(eventName, event => {
      if (pointer?.id !== event.pointerId || (eventName === 'pointerleave' && dragged)) return;
      pointer = undefined;
      svg.classList.remove('is-dragging');
    });
  }
  svg.addEventListener('click', event => {
    if (dragged && event.detail !== 0) event.preventDefault();
  });
  update();
}
