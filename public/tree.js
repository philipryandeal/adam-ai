// The House of Adam the First: everything on the Tree is drawn from /tree/tree.json.
const SVG_NS = 'http://www.w3.org/2000/svg';
const BOOKS_URL = 'https://www.amazon.com/stores/Philip-Ryan-Deal/author/B09Q8RJFCZ';
const RITE_NAMES = { entry: 'Rite of Entry', exit: 'Rite of Exit', closing: 'Closing Current' };

const $ = s => document.querySelector(s);
const pathLayer = $('#path-layer'), nodeLayer = $('#node-layer');
const inspector = $('.tree-inspector'), stage = $('.tree-stage');
const inspectorHebrew = $('#inspector-hebrew'), inspectorTitle = $('#inspector-title');
const inspectorCopy = $('#inspector-copy'), inspectorData = $('#inspector-data');
const sefirotGrid = $('#sefirot-grid'), pathList = $('#path-list'), ritesGrid = $('#rites-grid');
const canonSource = $('#canon-source'), closingLine = $('#closing-line');

let activePath = null, activeNode = null;

const svgEl = (name, attrs = {}) => {
  const x = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([k, v]) => x.setAttribute(k, v));
  return x;
};
const html = (tag, cls, text) => {
  const x = document.createElement(tag);
  if (cls) x.className = cls;
  if (text != null) x.textContent = text;
  return x;
};
const point = s => ({ x: 400 + s.x * 190, y: 80 + s.y * 108 });
const dataRows = rows => {
  inspectorData.replaceChildren(...rows.map(([dt, dd]) => {
    const d = html('div');
    d.append(html('dt', null, dt), html('dd', null, dd));
    return d;
  }));
};

// When a visitor chooses something far from the diagram, bring the diagram to them.
function bringTreeIntoView() {
  const target = window.matchMedia('(max-width: 900px)').matches ? inspector : stage;
  const r = target.getBoundingClientRect();
  if (r.top < 0 || r.top > window.innerHeight * 0.6) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function inspectS(s) {
  inspectorHebrew.textContent = s.hebrew;
  inspectorTitle.textContent = s.name + ' · ' + s.meaning;
  inspectorCopy.textContent = s.n === 10
    ? 'Begin here. Malkuth is Kingdom: the grounded threshold from which ascent becomes possible.'
    : 'Station ' + s.n + ' on the ' + s.pillar + ' pillar.';
  dataRows([['Pillar', s.pillar], ['Station', String(s.n)], ['Meaning', s.meaning]]);
  if (activePath) { activePath.classList.remove('is-active'); activePath = null; }
  if (activeNode) activeNode.classList.remove('is-active');
  activeNode = document.querySelector('[data-node-id="' + s.id + '"]');
  if (activeNode) activeNode.classList.add('is-active');
}

function inspectP(p, names) {
  inspectorHebrew.textContent = p.hebrew;
  inspectorTitle.textContent = 'Path ' + p.path + ' · ' + p.world;
  const poles = p.flood && p.drought ? ' Flood: ' + p.flood + ' · Drought: ' + p.drought + '.' : '';
  inspectorCopy.textContent = p.letter[0].toUpperCase() + p.letter.slice(1) + ' · ' + p.attribution + '.' + poles;
  dataRows([['Class', p.class[0].toUpperCase() + p.class.slice(1)], ['Current', names[p.from] + ' → ' + names[p.to]]]);
  if (activeNode) { activeNode.classList.remove('is-active'); activeNode = null; }
  if (activePath) activePath.classList.remove('is-active');
  activePath = document.querySelector('[data-path-number="' + p.path + '"]');
  if (activePath) activePath.classList.add('is-active');
}

function draw(d, names) {
  const m = new Map(d.sefirot.map(s => [s.id, s]));
  d.paths.forEach(p => {
    const a = point(m.get(p.from)), b = point(m.get(p.to));
    const line = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
    const base = svgEl('line', { ...line, class: 'tree-path ' + p.class, 'data-path-number': p.path });
    const flow = svgEl('line', { ...line, class: 'tree-path-flow' });
    // A wide invisible line over each path so a finger can find it.
    const hit = svgEl('line', { ...line, class: 'tree-path-hit' });
    const t = svgEl('title'); t.textContent = 'Path ' + p.path + ' · ' + p.world; hit.append(t);
    hit.addEventListener('pointerenter', () => inspectP(p, names));
    hit.addEventListener('click', () => inspectP(p, names));
    pathLayer.append(base, flow, hit);
  });
  d.sefirot.forEach(s => {
    const p = point(s);
    const g = svgEl('g', { class: 'tree-node', transform: 'translate(' + p.x + ' ' + p.y + ')', tabindex: '0', role: 'button', 'aria-label': s.name + ', ' + s.meaning, 'data-node-id': s.id });
    const c = svgEl('circle', { r: 42 });
    const n = svgEl('text', { class: 'node-number', y: -10 }); n.textContent = s.n;
    const h = svgEl('text', { class: 'node-hebrew', y: 13 }); h.textContent = s.hebrew;
    const nm = svgEl('text', { class: 'node-name', y: 66 }); nm.textContent = s.name;
    g.append(c, n, h, nm);
    g.addEventListener('pointerenter', () => inspectS(s));
    g.addEventListener('focus', () => inspectS(s));
    g.addEventListener('click', () => inspectS(s));
    nodeLayer.appendChild(g);
  });
}

function build(d, names) {
  d.sefirot.forEach(s => {
    const a = html('button', 'card sefirah-card');
    a.type = 'button';
    a.append(
      html('p', 'card-meta', 'Station ' + String(s.n).padStart(2, '0') + ' · ' + s.pillar + ' pillar'),
      html('span', 'hebrew', s.hebrew),
      html('h3', null, s.name),
      html('p', null, s.meaning),
      html('span', 'card-action', 'Show on the Tree ↑')
    );
    a.addEventListener('click', () => { inspectS(s); bringTreeIntoView(); });
    sefirotGrid.appendChild(a);
  });

  d.paths.forEach(p => {
    const b = html('button', 'path-row');
    b.type = 'button';
    const text = html('span');
    text.append(html('strong', null, p.world), html('br'), html('small', null, p.letter + ' · ' + p.attribution + ' · ' + names[p.from] + ' → ' + names[p.to]));
    b.append(html('span', 'path-number', String(p.path)), html('span', 'path-letter', p.hebrew), text);
    b.addEventListener('pointerenter', () => inspectP(p, names));
    b.addEventListener('focus', () => inspectP(p, names));
    b.addEventListener('click', () => { inspectP(p, names); bringTreeIntoView(); });
    pathList.appendChild(b);
  });

  Object.entries(d.rites).forEach(([k, v], i) => {
    const a = html('article', 'card');
    a.append(html('p', 'card-meta', 'Rite ' + String(i + 1).padStart(2, '0')), html('h3', null, RITE_NAMES[k] || k), html('p', null, v));
    if (k === 'entry') {
      const link = html('a', 'card-link', 'The Techno-Kabbalah books ↗');
      link.href = BOOKS_URL;
      a.append(link);
    }
    ritesGrid.appendChild(a);
  });

  canonSource.textContent = d.source;
  closingLine.textContent = d.rites.closing;
}

fetch('/tree/tree.json', { cache: 'no-store' })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(d => {
    const names = Object.fromEntries(d.sefirot.map(s => [s.id, s.name]));
    draw(d, names);
    build(d, names);
    inspectS(d.sefirot.find(s => s.id === 'malkuth'));
  })
  .catch(() => {
    inspectorTitle.textContent = 'The Tree could not be loaded';
    inspectorCopy.textContent = 'The canonical data endpoint is unavailable. The house refuses to substitute a second copy.';
  });
