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
  { name: 'Segoe UI', label: 'Segoe UI', sub: 'Teams default', weight: '600', fontFamily: '"Segoe UI", "Segoe UI Web", Tahoma, sans-serif' },
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
  { name: 'CBHandwritten', label: 'CB Handwritten', sub: 'Custom TTF font', weight: 'normal' },

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
             font.name === 'CBHand' ? 54 :
             font.name === 'Segoe UI' ? 52 : 56;
  const fontSize = Math.round(baseFontSize * fontScale);

  const weight = bold ? 'bold' : (font.weight || 'normal');
  const style = italic ? 'italic' : (font.style || 'normal');
  const family = font.fontFamily || `"${font.name}", cursive`;
  ctx.fillStyle = textColor;
  ctx.font = `${style} ${weight} ${fontSize}px ${family}`;
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

const sliderNumPairs = [
  { slider: 'cfgFontScale', num: 'cfgFontScaleNum', min: 50, max: 150 },
  { slider: 'cfgOffsetX', num: 'cfgOffsetXNum', min: -50, max: 50 },
  { slider: 'cfgOffsetY', num: 'cfgOffsetYNum', min: -50, max: 50 },
  { slider: 'cfgRotate', num: 'cfgRotateNum', min: -180, max: 180 }
];

function syncSliderToNum(sliderId, numId) {
  const s = document.getElementById(sliderId);
  const n = document.getElementById(numId);
  if (s && n) n.value = s.value;
}

function syncNumToSlider(sliderId, numId, min, max) {
  const s = document.getElementById(sliderId);
  const n = document.getElementById(numId);
  if (!s || !n) return;
  let val = Number(n.value);
  if (Number.isNaN(val)) val = min;
  val = Math.min(max, Math.max(min, val));
  n.value = val;
  s.value = val;
}

function setupConfigListeners() {
  const inputs = ['cfgTextValue', 'cfgBg', 'cfgText', 'cfgFontScale', 'cfgSize', 'cfgOffsetX', 'cfgOffsetY', 'cfgRotate', 'cfgBold', 'cfgItalic'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (sliderNumPairs.some(p => p.slider === id)) syncSliderToNum(id, sliderNumPairs.find(p => p.slider === id).num);
      buildGrid();
      saveConfig();
    });
    el.addEventListener('change', () => {
      if (sliderNumPairs.some(p => p.slider === id)) syncSliderToNum(id, sliderNumPairs.find(p => p.slider === id).num);
      buildGrid();
      saveConfig();
    });
  });

  sliderNumPairs.forEach(({ slider, num, min, max }) => {
    const numEl = document.getElementById(num);
    if (!numEl) return;
    numEl.addEventListener('input', () => {
      syncNumToSlider(slider, num, min, max);
      buildGrid();
      saveConfig();
    });
    numEl.addEventListener('change', () => {
      syncNumToSlider(slider, num, min, max);
      buildGrid();
      saveConfig();
    });
  });

  sliderNumPairs.forEach(({ slider, num }) => syncSliderToNum(slider, num));
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
