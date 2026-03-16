const STORAGE_KEY = 'teamsAvatarConfig';

const defaultConfig = {
  text: 'TXT',
  bg: '#c7d4e7',
  textColor: '#001e4f',
  fontScale: 100,
  size: 128,
  offsetX: 0,
  offsetY: 0,
  rotateDeg: 0,
  bold: false,
  italic: false
};

const fonts = [
  { name: 'CBHand', label: 'CB Hand', sub: 'Custom TTF font', weight: 'normal' },
  { name: 'Comic Sans MS', label: 'Comic Sans', sub: 'The classic', weight: 'bold' },
  { name: 'Bangers', label: 'Bangers', sub: 'Comic-Book Style', weight: 'normal' },
  { name: 'Fredoka One', label: 'Fredoka One', sub: 'Round & friendly', weight: 'normal' },
  { name: 'Pacifico', label: 'Pacifico', sub: 'Casual script', weight: 'normal' },
  { name: 'Permanent Marker', label: 'Permanent Marker', sub: 'Marker look', weight: 'normal' },
  { name: 'Press Start 2P', label: 'Press Start 2P', sub: 'Retro Pixel', weight: 'normal' },
  { name: 'Lobster', label: 'Lobster', sub: 'Elegant script', weight: 'normal' },
  { name: 'Rubik Bubbles', label: 'Rubik Bubbles', sub: 'Bubble effect', weight: 'normal' },
  { name: 'Caveat', label: 'Caveat', sub: 'Handwritten', weight: '700' },
  { name: 'Righteous', label: 'Righteous', sub: 'Retro funky', weight: 'normal' },
];

function getConfig() {
  return {
    text: document.getElementById('cfgTextValue').value || 'TXT',
    bg: document.getElementById('cfgBg').value,
    textColor: document.getElementById('cfgText').value,
    fontScale: Number(document.getElementById('cfgFontScale').value) / 100,
    size: Number(document.getElementById('cfgSize').value),
    offsetX: Number(document.getElementById('cfgOffsetX').value),
    offsetY: Number(document.getElementById('cfgOffsetY').value),
    rotateDeg: Number(document.getElementById('cfgRotate').value),
    bold: document.getElementById('cfgBold').checked,
    italic: document.getElementById('cfgItalic').checked
  };
}

function saveConfig() {
  const cfg = getConfig();
  const raw = {
    text: document.getElementById('cfgTextValue').value,
    bg: document.getElementById('cfgBg').value,
    textColor: document.getElementById('cfgText').value,
    fontScale: Number(document.getElementById('cfgFontScale').value),
    size: Number(document.getElementById('cfgSize').value),
    offsetX: Number(document.getElementById('cfgOffsetX').value),
    offsetY: Number(document.getElementById('cfgOffsetY').value),
    rotateDeg: Number(document.getElementById('cfgRotate').value),
    bold: document.getElementById('cfgBold').checked,
    italic: document.getElementById('cfgItalic').checked
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  } catch (e) {}
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    const cfg = { ...defaultConfig, ...saved };
    const el = (id, val) => { const e = document.getElementById(id); if (e && val !== undefined) e.value = String(val); };
    el('cfgTextValue', cfg.text);
    el('cfgBg', cfg.bg);
    el('cfgText', cfg.textColor);
    el('cfgFontScale', cfg.fontScale);
    el('cfgSize', cfg.size);
    el('cfgOffsetX', cfg.offsetX);
    el('cfgOffsetY', cfg.offsetY);
    el('cfgRotate', cfg.rotateDeg);
    const boldEl = document.getElementById('cfgBold');
    const italicEl = document.getElementById('cfgItalic');
    if (boldEl) boldEl.checked = !!cfg.bold;
    if (italicEl) italicEl.checked = !!cfg.italic;
    const scaleVal = document.getElementById('cfgFontScaleVal');
    if (scaleVal) scaleVal.textContent = (cfg.fontScale ?? document.getElementById('cfgFontScale')?.value ?? 100) + '%';
  } catch (e) {}
}

function drawAvatar(font, opts) {
  const { text, bg, textColor, fontScale, size, offsetX, offsetY, rotateDeg, bold, italic } = opts;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  let baseFontSize = font.name === 'Press Start 2P' ? 22 :
             font.name === 'Pacifico' ? 44 :
             font.name === 'Permanent Marker' ? 50 :
             font.name === 'Lobster' ? 52 :
             font.name === 'Caveat' ? 62 :
             font.name === 'Bangers' ? 68 :
             font.name === 'CBHand' ? 54 : 56;
  const fontSize = Math.round(baseFontSize * fontScale);

  const weight = bold ? 'bold' : (font.weight || 'normal');
  const style = italic ? 'italic' : (font.style || 'normal');
  ctx.fillStyle = textColor;
  ctx.font = `${style} ${weight} ${fontSize}px "${font.name}", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.save();
  ctx.translate(size / 2 + offsetX, size / 2 + offsetY);
  ctx.rotate(rotateDeg * Math.PI / 180);
  ctx.fillText(text, 0, 0);
  ctx.restore();

  return canvas;
}

function buildGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  const opts = getConfig();

  fonts.forEach(font => {
    const canvas = drawAvatar(font, opts);
    const card = document.createElement('div');
    card.className = 'card';

    const label = document.createElement('div');
    label.className = 'card-label';
    label.textContent = font.label;

    const sub = document.createElement('div');
    sub.className = 'card-sub';
    sub.textContent = font.sub;

    const btn = document.createElement('button');
    btn.className = 'download-btn';
    btn.textContent = '⬇ Download';
    btn.onclick = (e) => {
      e.stopPropagation();
      const link = document.createElement('a');
      link.download = `Icon_${font.label.replace(/\s/g, '_')}.png`;
      link.href = drawAvatar(font, getConfig()).toDataURL('image/png');
      link.click();
    };

    canvas.onclick = () => btn.click();

    card.appendChild(canvas);
    card.appendChild(label);
    card.appendChild(sub);
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

function setupConfigListeners() {
  const inputs = ['cfgTextValue', 'cfgBg', 'cfgText', 'cfgFontScale', 'cfgSize', 'cfgOffsetX', 'cfgOffsetY', 'cfgRotate', 'cfgBold', 'cfgItalic'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      updateSliderDisplay(id, el);
      buildGrid();
      saveConfig();
    });
    el.addEventListener('change', () => {
      updateSliderDisplay(id, el);
      buildGrid();
      saveConfig();
    });
  });
  document.getElementById('cfgFontScaleVal').textContent = document.getElementById('cfgFontScale').value + '%';
  document.getElementById('cfgOffsetXVal').textContent = document.getElementById('cfgOffsetX').value;
  document.getElementById('cfgOffsetYVal').textContent = document.getElementById('cfgOffsetY').value;
  document.getElementById('cfgRotateVal').textContent = document.getElementById('cfgRotate').value + '°';
}

function updateSliderDisplay(id, el) {
  const val = el.value;
  if (id === 'cfgFontScale') {
    const span = document.getElementById('cfgFontScaleVal');
    if (span) span.textContent = val + '%';
  } else if (id === 'cfgOffsetX') {
    const span = document.getElementById('cfgOffsetXVal');
    if (span) span.textContent = val;
  } else if (id === 'cfgOffsetY') {
    const span = document.getElementById('cfgOffsetYVal');
    if (span) span.textContent = val;
  } else if (id === 'cfgRotate') {
    const span = document.getElementById('cfgRotateVal');
    if (span) span.textContent = val + '°';
  }
}

function loadAllFonts() {
  return Promise.all(
    fonts.map(f => document.fonts.load(`${f.weight || 'normal'} 12px "${f.name}"`))
  ).catch(() => {});
}

document.fonts.ready
  .then(() => loadAllFonts())
  .then(() => {
    loadConfig();
    setupConfigListeners();
    buildGrid();
  });
