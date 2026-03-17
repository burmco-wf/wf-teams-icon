const STORAGE_KEY = 'teamsAvatarConfig';

let pageFontActive = false;

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
  italic: false,
  blurAmount: 0
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
  { name: 'CBHandwritten', label: 'CB Handwritten', sub: 'My handwriting', weight: 'normal' },
  { name: 'Upheavtt', label: 'Upheavtt', sub: 'The Binding of Isaac!', weight: 'normal' },
];

const IDB_NAME = 'IconMaker';
const IDB_STORE = 'customFont';
let customUploadedFont = null;
let customFontObjectURL = null;
let customFontStyleEl = null;

function openFontDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(IDB_NAME, 1);
    r.onerror = () => reject(r.error);
    r.onsuccess = () => resolve(r.result);
    r.onupgradeneeded = (e) => e.target.result.createObjectStore(IDB_STORE);
  });
}

function saveCustomFontToIDB(blob, format) {
  return openFontDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put({ blob, format }, 'font');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function loadCustomFontFromIDB() {
  return openFontDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const r = store.get('font');
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  });
}

function deleteCustomFontFromIDB() {
  return openFontDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete('font');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function removeCustomFont() {
  if (customFontObjectURL) {
    URL.revokeObjectURL(customFontObjectURL);
    customFontObjectURL = null;
  }
  customUploadedFont = null;
  if (customFontStyleEl) customFontStyleEl.textContent = '';
  const removeBtn = document.getElementById('cfgCustomFontRemove');
  if (removeBtn) removeBtn.style.display = 'none';
  return deleteCustomFontFromIDB();
}

function updateCustomFontRemoveVisibility() {
  const removeBtn = document.getElementById('cfgCustomFontRemove');
  if (removeBtn) removeBtn.style.display = customUploadedFont ? '' : 'none';
}

function launchConfetti() {
  const colors = ['#ff0f0f', '#ff8c00', '#ffef0f', '#0f0', '#0ff', '#4b0ff0', '#ff0f8c', '#fff'];
  const count = 65;
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = '50%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (6 + Math.random() * 2) + 's';
    piece.style.setProperty('--fan', ((Math.random() - 0.5) * 100) + 'vw');
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 9500);
}

function applyPageFontClass() {
  const on = pageFontActive;
  const add = (el, ...classes) => {
    if (!el) return;
    if (on) el.classList.add('use-my-font', ...classes);
    else el.classList.remove('use-my-font', 'h1-size', 'label-size', 'input-size', 'file-size');
  };
  const h1 = document.querySelector('h1');
  add(h1, 'h1-size');
  add(document.querySelector('p.hint'));
  document.querySelectorAll('.card-label').forEach(el => add(el));
  document.querySelectorAll('.card-sub').forEach(el => add(el));
  document.querySelectorAll('.download-btn').forEach(el => add(el));
  document.querySelectorAll('.config-group label').forEach(el => add(el, 'label-size'));
  document.querySelectorAll('.config-group input[type="text"], .config-group input[type="number"]').forEach(el => add(el, 'input-size'));
  document.querySelectorAll('.config-group input[type="file"]').forEach(el => add(el, 'file-size'));
  add(document.querySelector('.remove-font-btn'));
  document.querySelectorAll('.font-scale-value, .slider-value').forEach(el => add(el));
}

function applyCustomFont(blob, format) {
  if (customFontObjectURL) {
    URL.revokeObjectURL(customFontObjectURL);
    customFontObjectURL = null;
  }
  customFontObjectURL = URL.createObjectURL(blob);
  const fontFormat = format === 'otf' ? 'opentype' : 'truetype';
  if (!customFontStyleEl) {
    customFontStyleEl = document.createElement('style');
    customFontStyleEl.id = 'custom-uploaded-font';
    document.head.appendChild(customFontStyleEl);
  }
  customFontStyleEl.textContent = `@font-face{font-family:'UploadedFont';src:url('${customFontObjectURL}') format('${fontFormat}');font-weight:normal;font-style:normal;}`;
  customUploadedFont = { name: 'UploadedFont', label: 'Uploaded', sub: 'Custom font (saved locally)', weight: 'normal' };
  updateCustomFontRemoveVisibility();
  return document.fonts.load(`12px UploadedFont`);
}

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
    italic: document.getElementById('cfgItalic').checked,
    blurAmount: Math.min(20, Math.max(0, Number(document.getElementById('cfgBlurAmount') && document.getElementById('cfgBlurAmount').value) || 0))
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
    italic: document.getElementById('cfgItalic').checked,
    blurAmount: Math.min(20, Math.max(0, Number(document.getElementById('cfgBlurAmount') && document.getElementById('cfgBlurAmount').value) || 0))
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  } catch (e) {}
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function extractColorsFromImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, w, h).data;
      const margin = Math.max(1, Math.floor(Math.min(w, h) * 0.18));

      const sample = (x, y) => {
        const i = (Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * 4;
        return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
      };
      const avg = (pixels) => {
        const n = pixels.length;
        let r = 0, g = 0, b = 0, count = 0;
        pixels.forEach(p => {
          if (p.a > 128) { r += p.r; g += p.g; b += p.b; count++; }
        });
        return count ? { r: r / count, g: g / count, b: b / count } : null;
      };

      const cornerPixels = [
        sample(margin, margin),
        sample(w - 1 - margin, margin),
        sample(margin, h - 1 - margin),
        sample(w - 1 - margin, h - 1 - margin)
      ];
      const bg = avg(cornerPixels);
      if (!bg) return reject(new Error('Could not read background'));

      const centerLeft = Math.floor(w * 0.35);
      const centerRight = Math.ceil(w * 0.65);
      const centerTop = Math.floor(h * 0.35);
      const centerBottom = Math.ceil(h * 0.65);
      const centerPixels = [];
      for (let y = centerTop; y < centerBottom; y += 2) {
        for (let x = centerLeft; x < centerRight; x += 2) {
          centerPixels.push(sample(x, y));
        }
      }
      const dist = (p, q) => Math.sqrt((p.r - q.r) ** 2 + (p.g - q.g) ** 2 + (p.b - q.b) ** 2);
      const textPixels = centerPixels.filter(p => p.a > 128 && dist(p, bg) > 30);
      const textColor = textPixels.length ? avg(textPixels) : bg;

      resolve({
        bg: rgbToHex(bg.r, bg.g, bg.b),
        textColor: rgbToHex(textColor.r, textColor.g, textColor.b)
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
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
    const blurAmountEl = document.getElementById('cfgBlurAmount');
    const blurAmountNumEl = document.getElementById('cfgBlurAmountNum');
    if (boldEl) boldEl.checked = !!cfg.bold;
    if (italicEl) italicEl.checked = !!cfg.italic;
    if (blurAmountEl) blurAmountEl.value = Math.min(20, Math.max(0, cfg.blurAmount ?? 0));
    if (blurAmountNumEl) blurAmountNumEl.value = Math.min(20, Math.max(0, cfg.blurAmount ?? 0));
  } catch (e) {}
}

function drawAvatar(font, opts) {
  const { text, bg, textColor, fontScale, size, offsetX, offsetY, rotateDeg, bold, italic, blurAmount } = opts;
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
             font.name === 'CBHandwritten' ? 54 :
             font.name === 'Upheavtt' ? 68 :
             font.name === 'Segoe UI' ? 52 :
             font.name === 'UploadedFont' ? 54 : 56;
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

  const blurPx = (blurAmount || 0) * 0.2;
  if (blurPx > 0) {
    const c2 = document.createElement('canvas');
    c2.width = size;
    c2.height = size;
    const ctx2 = c2.getContext('2d');
    ctx2.filter = `blur(${blurPx}px)`;
    ctx2.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(c2, 0, 0);
  }

  return canvas;
}

function buildGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  const opts = getConfig();
  const fontsToShow = customUploadedFont ? [...fonts, customUploadedFont] : fonts;

  fontsToShow.forEach(font => {
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
  applyPageFontClass();
}

const sliderNumPairs = [
  { slider: 'cfgFontScale', num: 'cfgFontScaleNum', min: 50, max: 150 },
  { slider: 'cfgOffsetX', num: 'cfgOffsetXNum', min: -50, max: 50 },
  { slider: 'cfgOffsetY', num: 'cfgOffsetYNum', min: -50, max: 50 },
  { slider: 'cfgRotate', num: 'cfgRotateNum', min: -180, max: 180 },
  { slider: 'cfgBlurAmount', num: 'cfgBlurAmountNum', min: 0, max: 20 }
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
  const inputs = ['cfgTextValue', 'cfgBg', 'cfgText', 'cfgFontScale', 'cfgSize', 'cfgOffsetX', 'cfgOffsetY', 'cfgRotate', 'cfgBold', 'cfgItalic', 'cfgBlurAmount'];
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

  const matchInput = document.getElementById('cfgMatchImage');
  if (matchInput) {
    matchInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      extractColorsFromImage(file).then(({ bg, textColor }) => {
        const bgEl = document.getElementById('cfgBg');
        const textEl = document.getElementById('cfgText');
        if (bgEl) bgEl.value = bg;
        if (textEl) textEl.value = textColor;
        buildGrid();
        saveConfig();
      }).catch(() => {}).finally(() => { matchInput.value = ''; });
    });
  }

  const fontUploadInput = document.getElementById('cfgCustomFontUpload');
  if (fontUploadInput) {
    fontUploadInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const isOtf = (file.name || '').toLowerCase().endsWith('.otf');
      const format = isOtf ? 'otf' : 'ttf';
      saveCustomFontToIDB(file, format).then(() => applyCustomFont(file, format)).then(() => {
        buildGrid();
      }).catch(() => {}).finally(() => { fontUploadInput.value = ''; });
    });
  }

  const fontRemoveBtn = document.getElementById('cfgCustomFontRemove');
  if (fontRemoveBtn) {
    fontRemoveBtn.addEventListener('click', () => {
      removeCustomFont().then(() => buildGrid());
    });
  }

  const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  let konamiIndex = 0;
  document.addEventListener('keydown', (e) => {
    if (e.keyCode === konami[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konami.length) {
        konamiIndex = 0;
        pageFontActive = !pageFontActive;
        document.body.classList.toggle('corvinami-mode', pageFontActive);
        applyPageFontClass();
        if (pageFontActive) {
          launchConfetti();
          const popup = document.createElement('div');
          popup.className = 'corvinami-popup';
          popup.textContent = 'Corvinami Code';
          document.body.appendChild(popup);
          setTimeout(() => popup.remove(), 2200);
        }
      }
    } else {
      konamiIndex = 0;
    }
  });
}

function loadAllFonts() {
  return Promise.all(
    fonts.map(f => document.fonts.load(`${f.weight || 'normal'} 12px "${f.name}"`))
  ).catch(() => {});
}

document.fonts.ready
  .then(() => loadAllFonts())
  .then(() => loadCustomFontFromIDB())
  .then((stored) => {
    if (stored && stored.blob && stored.format) {
      return applyCustomFont(stored.blob, stored.format);
    }
  })
  .then(() => {
    loadConfig();
    setupConfigListeners();
    updateCustomFontRemoveVisibility();
    buildGrid();
    applyPageFontClass();
  });
