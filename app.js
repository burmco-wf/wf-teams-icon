const STORAGE_KEY = 'teamsAvatarConfig';

let pageFontActive = false;

const defaultConfig = {
  text: 'TXT',
  selectedFontName: 'Segoe UI',
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
const IDB_FONTS_KEY = 'fonts';
let customUploadedFonts = [];
let customFontStyleEl = null;
let selectedFontName = defaultConfig.selectedFontName;

// Per-character style overrides
let charStyles = []; // [{ char, fontName, fontSize, color, bold, italic }, ...]
let selectedCharIndices = new Set();
let lastSelectedCharIndex = -1;

function openFontDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(IDB_NAME, 1);
    r.onerror = () => reject(r.error);
    r.onsuccess = () => resolve(r.result);
    r.onupgradeneeded = (e) => e.target.result.createObjectStore(IDB_STORE);
  });
}

function loadCustomFontsFromIDB() {
  return openFontDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const rList = store.get(IDB_FONTS_KEY);
      rList.onsuccess = () => {
        const list = rList.result;
        if (Array.isArray(list)) {
          resolve(list);
          return;
        }
        const rLegacy = store.get('font');
        rLegacy.onsuccess = () => {
          const legacy = rLegacy.result;
          if (legacy && legacy.blob && legacy.format) {
            const id = 'f_' + Date.now() + '_migrated';
            const migrated = [{ id, blob: legacy.blob, format: legacy.format, fileName: null }];
            store.delete('font');
            store.put(migrated, IDB_FONTS_KEY);
            resolve(migrated);
          } else {
            resolve([]);
          }
        };
      };
      tx.onerror = () => reject(tx.error);
    });
  });
}

function saveCustomFontsToIDB(list) {
  return openFontDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(list, IDB_FONTS_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function addCustomFontToIDB(id, blob, format, fileName) {
  return loadCustomFontsFromIDB().then(list => {
    list.push({ id, blob, format, fileName: fileName || null });
    return saveCustomFontsToIDB(list);
  });
}

function removeCustomFontFromIDB(id) {
  return loadCustomFontsFromIDB().then(list => {
    const next = list.filter(item => item.id !== id);
    return saveCustomFontsToIDB(next);
  });
}

function rebuildCustomFontStyle() {
  if (!customFontStyleEl) {
    customFontStyleEl = document.createElement('style');
    customFontStyleEl.id = 'custom-uploaded-font';
    document.head.appendChild(customFontStyleEl);
  }
  const fontFormat = (f) => (f.format === 'otf' ? 'opentype' : 'truetype');
  customFontStyleEl.textContent = customUploadedFonts
    .map(f => `@font-face{font-family:'${f.fontFamily}';src:url('${f.objectURL}') format('${fontFormat(f)}');font-weight:normal;font-style:normal;}`)
    .join('');
}

function applyCustomFont(blob, format, label, id) {
  const fontFamily = 'UploadedFont_' + id;
  const objectURL = URL.createObjectURL(blob);
  const entry = {
    id,
    name: fontFamily,
    fontFamily,
    label: label || 'Custom',
    sub: 'Custom font (saved locally)',
    weight: 'normal',
    objectURL,
    format
  };
  customUploadedFonts.push(entry);
  rebuildCustomFontStyle();
  updatePageFontVariable();
  return document.fonts.load(`normal 12px "${fontFamily}"`).catch(() => {});
}

function removeCustomFontById(id) {
  const idx = customUploadedFonts.findIndex(f => f.id === id);
  if (idx === -1) return Promise.resolve();
  const entry = customUploadedFonts[idx];
  URL.revokeObjectURL(entry.objectURL);
  customUploadedFonts.splice(idx, 1);
  rebuildCustomFontStyle();
  updatePageFontVariable();
  return removeCustomFontFromIDB(id);
}

function updatePageFontVariable() {
  const first = customUploadedFonts[0];
  document.documentElement.style.setProperty(
    '--page-font-family',
    first ? `'${first.fontFamily}', 'CBHandwritten', cursive` : "'CBHandwritten', cursive"
  );
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
  document.querySelectorAll('.card-label, .font-preview-label').forEach(el => add(el));
  document.querySelectorAll('.card-sub').forEach(el => add(el));
  document.querySelectorAll('.config-group label').forEach(el => add(el, 'label-size'));
  document.querySelectorAll('.config-group input[type="text"], .config-group input[type="number"]').forEach(el => add(el, 'input-size'));
  document.querySelectorAll('.config-group input[type="file"]').forEach(el => add(el, 'file-size'));
  add(document.querySelector('.remove-font-btn'));
  document.querySelectorAll('.font-scale-value, .slider-value').forEach(el => add(el));
}

function getAllFonts() {
  return [...fonts, ...customUploadedFonts];
}

function getSelectedFont() {
  return getAllFonts().find(f => f.name === selectedFontName) || fonts[0];
}

function getConfig() {
  return {
    text: document.getElementById('cfgTextValue').value || 'TXT',
    selectedFontName,
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
  const raw = {
    text: document.getElementById('cfgTextValue').value,
    selectedFontName,
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
    if (cfg.selectedFontName !== undefined) selectedFontName = cfg.selectedFontName;
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

function resetConfigToDefault() {
  const cfg = { ...defaultConfig };
  const el = (id, val) => { const e = document.getElementById(id); if (e && val !== undefined) e.value = String(val); };
  el('cfgTextValue', cfg.text);
  selectedFontName = cfg.selectedFontName;
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
  const baseFontSizeEl = document.getElementById('cfgBaseFontSize');
  if (baseFontSizeEl) baseFontSizeEl.value = getDefaultBaseFontSize(getSelectedFont());
  Object.keys(fontSizeOverrides).forEach(k => delete fontSizeOverrides[k]);
  syncCharStyles(cfg.text);
  saveConfig();
  buildGrid();
}

// ── Per-char style helpers ───────────────────────────────────────────────────

function syncCharStyles(text) {
  const chars = [...String(text || '')];
  charStyles = chars.map((ch, i) => {
    const existing = charStyles[i];
    if (existing && existing.char === ch) return existing;
    return { char: ch, fontName: null, fontSize: null, color: null, bgColor: null, bold: null, italic: null };
  });
  selectedCharIndices = new Set([...selectedCharIndices].filter(i => i < chars.length));
}

function buildCharTray() {
  const tray = document.getElementById('charTray');
  if (!tray) return;
  const text = document.getElementById('cfgTextValue').value || '';
  syncCharStyles(text);
  const chars = [...text];

  if (chars.length === 0) {
    tray.style.display = 'none';
    hideCharEditPanel();
    return;
  }
  tray.style.display = '';
  tray.innerHTML = '';

  const allFontsList = [...fonts, ...customUploadedFonts];
  const opts = getConfig();

  chars.forEach((ch, i) => {
    const cs = charStyles[i] || {};
    const charFont = cs.fontName ? (allFontsList.find(f => f.name === cs.fontName) || null) : null;
    const color = cs.color || opts.textColor;
    const isBold = (cs.bold !== null && cs.bold !== undefined) ? cs.bold : opts.bold;
    const isItalic = (cs.italic !== null && cs.italic !== undefined) ? cs.italic : opts.italic;
    const hasCustom = cs.fontName || cs.fontSize !== null || cs.color || cs.bgColor || cs.bold !== null || cs.italic !== null;

    const chip = document.createElement('span');
    chip.className = 'char-chip' +
      (selectedCharIndices.has(i) ? ' char-chip--selected' : '') +
      (hasCustom ? ' char-chip--custom' : '');
    chip.textContent = ch === ' ' ? '·' : ch;
    chip.dataset.index = i;
    chip.style.color = color;
    chip.style.background = cs.bgColor || opts.bg;
    if (charFont) chip.style.fontFamily = charFont.fontFamily || `"${charFont.name}", cursive`;
    chip.style.fontWeight = isBold ? 'bold' : 'normal';
    chip.style.fontStyle = isItalic ? 'italic' : 'normal';
    chip.addEventListener('click', (e) => handleChipClick(i, e.shiftKey));
    tray.appendChild(chip);
  });

  if (selectedCharIndices.size > 0) {
    showCharEditPanel();
  } else {
    hideCharEditPanel();
  }
}

function handleChipClick(index, shiftKey) {
  if (shiftKey && lastSelectedCharIndex >= 0) {
    const min = Math.min(lastSelectedCharIndex, index);
    const max = Math.max(lastSelectedCharIndex, index);
    for (let i = min; i <= max; i++) selectedCharIndices.add(i);
  } else {
    if (selectedCharIndices.size === 1 && selectedCharIndices.has(index)) {
      selectedCharIndices.clear();
      lastSelectedCharIndex = -1;
      buildCharTray();
      return;
    }
    selectedCharIndices = new Set([index]);
    lastSelectedCharIndex = index;
  }
  buildCharTray();
}

function populateCharEditFontSelect() {
  const select = document.getElementById('charEditFont');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">(global font)</option>';
  [...fonts, ...customUploadedFonts].forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.name;
    opt.textContent = f.label;
    select.appendChild(opt);
  });
  select.value = current;
}

function showCharEditPanel() {
  const panel = document.getElementById('charEditPanel');
  if (!panel) return;
  panel.style.display = '';

  const indices = [...selectedCharIndices].sort((a, b) => a - b);
  const count = indices.length;

  const labelEl = document.getElementById('charEditLabel');
  if (labelEl) {
    if (count === 1) {
      const ch = (charStyles[indices[0]] || {}).char || '';
      labelEl.textContent = ch === ' ' ? '(space)' : `"${ch}"`;
    } else {
      labelEl.textContent = `${count} chars`;
    }
  }

  populateCharEditFontSelect();

  const firstCs = charStyles[indices[0]] || {};
  const allSame = (prop) => indices.every(i => (charStyles[i] || {})[prop] === firstCs[prop]);
  const opts = getConfig();

  const fontSelect = document.getElementById('charEditFont');
  if (fontSelect) fontSelect.value = allSame('fontName') ? (firstCs.fontName || '') : '';

  const sizeInput = document.getElementById('charEditSize');
  if (sizeInput && document.activeElement !== sizeInput) {
    if (allSame('fontSize') && firstCs.fontSize !== null) {
      sizeInput.value = firstCs.fontSize;
      sizeInput.placeholder = '';
    } else {
      sizeInput.value = '';
      sizeInput.placeholder = allSame('fontSize') ? '(global)' : '(mixed)';
    }
  }

  const colorInput = document.getElementById('charEditColor');
  if (colorInput) colorInput.value = firstCs.color || opts.textColor;

  const boldCb = document.getElementById('charEditBold');
  if (boldCb) {
    boldCb.indeterminate = !allSame('bold');
    boldCb.checked = (firstCs.bold !== null && firstCs.bold !== undefined) ? firstCs.bold : opts.bold;
  }

  const italicCb = document.getElementById('charEditItalic');
  if (italicCb) {
    italicCb.indeterminate = !allSame('italic');
    italicCb.checked = (firstCs.italic !== null && firstCs.italic !== undefined) ? firstCs.italic : opts.italic;
  }

  const bgEnabledCb = document.getElementById('charEditBgEnabled');
  const bgColorInput = document.getElementById('charEditBgColor');
  if (bgEnabledCb && bgColorInput) {
    const bgVal = allSame('bgColor') ? firstCs.bgColor : null;
    bgEnabledCb.checked = bgVal !== null;
    bgColorInput.value = bgVal || '#ffffff';
    bgColorInput.disabled = !bgEnabledCb.checked;
  }
}

function hideCharEditPanel() {
  const panel = document.getElementById('charEditPanel');
  if (panel) panel.style.display = 'none';
}

function applyToSelectedChars(prop, value) {
  selectedCharIndices.forEach(i => {
    if (charStyles[i]) charStyles[i][prop] = value;
  });
  buildCharTray();
  buildGrid();
}

// ── Canvas rendering ─────────────────────────────────────────────────────────

const fontSizeOverrides = {};

function getDefaultBaseFontSize(font) {
  return font.name === 'Press Start 2P' ? 44 :
         font.name === 'Pacifico' ? 44 :
         font.name === 'Permanent Marker' ? 50 :
         font.name === 'Lobster' ? 52 :
         font.name === 'Caveat' ? 62 :
         font.name === 'Bangers' ? 68 :
         font.name === 'CBHandwritten' ? 70 :
         font.name === 'Upheavtt' ? 68 :
         font.name === 'Segoe UI' ? 52 :
         (font.name && font.name.startsWith('UploadedFont')) ? 54 : 56;
}

function getBaseFontSize(font) {
  if (fontSizeOverrides[font.name] != null) return fontSizeOverrides[font.name];
  return getDefaultBaseFontSize(font);
}

function drawAvatar(font, opts) {
  const { text, bg, textColor, fontScale, size, offsetX, offsetY, rotateDeg, bold, italic, blurAmount, previewOnly } = opts;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const raw = String(text || 'TXT').trim() || 'TXT';
  const chars = [...raw];

  const allFontsList = [...fonts, ...customUploadedFonts];

  // Build effective style + measure width for each character
  const items = chars.map((ch, i) => {
    let charFont, isBold, isItalic, color, bgColor, baseFontSize;
    if (previewOnly) {
      charFont = font;
      isBold = bold;
      isItalic = italic;
      color = textColor;
      bgColor = null;
      baseFontSize = getDefaultBaseFontSize(font);
    } else {
      const cs = charStyles[i] || {};
      charFont = cs.fontName
        ? (allFontsList.find(f => f.name === cs.fontName) || font)
        : font;
      isBold = (cs.bold !== null && cs.bold !== undefined) ? cs.bold : bold;
      isItalic = (cs.italic !== null && cs.italic !== undefined) ? cs.italic : italic;
      color = cs.color || textColor;
      bgColor = cs.bgColor || null;
      baseFontSize = (cs.fontSize !== null && cs.fontSize !== undefined)
        ? cs.fontSize
        : getBaseFontSize(charFont);
    }
    const fontSize = Math.round(baseFontSize * fontScale);
    const weight = isBold ? 'bold' : (charFont.weight || 'normal');
    const style = isItalic ? 'italic' : (charFont.style || 'normal');
    const family = charFont.fontFamily || `"${charFont.name}", cursive`;
    ctx.font = `${style} ${weight} ${fontSize}px ${family}`;
    const width = ctx.measureText(ch).width;
    return { ch, fontSize, weight, style, family, color, bgColor, width };
  });

  // Word-wrap into lines using per-char widths
  const maxLineWidth = Math.max(size * 0.92, 24);
  const lines = [];
  let currentLine = [];
  let currentLineWidth = 0;
  let i = 0;

  while (i < items.length) {
    const item = items[i];
    if (item.ch === ' ') {
      // Only add space if there's already content on the line (no leading spaces)
      if (currentLine.length > 0) {
        currentLine.push(item);
        currentLineWidth += item.width;
      }
      i++;
    } else {
      // Collect a word (run of non-space chars)
      let j = i;
      while (j < items.length && items[j].ch !== ' ') j++;
      const word = items.slice(i, j);
      const wordWidth = word.reduce((s, c) => s + c.width, 0);

      // Trim trailing space from width check
      const trimmedWidth = (currentLine.length > 0 && currentLine[currentLine.length - 1].ch === ' ')
        ? currentLineWidth - currentLine[currentLine.length - 1].width
        : currentLineWidth;

      if (currentLine.length > 0 && trimmedWidth + wordWidth > maxLineWidth) {
        // Flush current line (trimming trailing space)
        while (currentLine.length > 0 && currentLine[currentLine.length - 1].ch === ' ') {
          currentLineWidth -= currentLine.pop().width;
        }
        lines.push(currentLine);
        currentLine = [];
        currentLineWidth = 0;
      }

      if (wordWidth > maxLineWidth && currentLine.length === 0) {
        // Word wider than canvas: split char by char
        for (const wItem of word) {
          if (currentLineWidth + wItem.width > maxLineWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
            currentLineWidth = 0;
          }
          currentLine.push(wItem);
          currentLineWidth += wItem.width;
        }
      } else {
        for (const wItem of word) {
          currentLine.push(wItem);
          currentLineWidth += wItem.width;
        }
      }
      i = j;
    }
  }
  // Flush last line
  while (currentLine.length > 0 && currentLine[currentLine.length - 1].ch === ' ') currentLine.pop();
  if (currentLine.length > 0) lines.push(currentLine);
  if (lines.length === 0) {
    const base = previewOnly ? getDefaultBaseFontSize(font) : getBaseFontSize(font);
    const fs = Math.round(base * fontScale);
    lines.push([{ ch: 'T', fontSize: fs, weight: font.weight || 'normal', style: 'normal', family: font.fontFamily || `"${font.name}"`, color: textColor, width: fs * 0.6 }]);
  }

  // Line heights based on tallest char in each line
  const lineHeights = lines.map(line => Math.max(...line.map(c => c.fontSize)) * 1.15);
  // Total vertical span from first to last baseline
  const totalHeight = lineHeights.slice(0, -1).reduce((s, h) => s + h, 0);

  ctx.save();
  ctx.translate(size / 2 + offsetX, size / 2 + offsetY);
  ctx.rotate(rotateDeg * Math.PI / 180);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  let y = -totalHeight / 2;
  lines.forEach((line, li) => {
    const lineWidth = line.reduce((s, c) => s + c.width, 0);
    let x = -lineWidth / 2;
    line.forEach(item => {
      if (item.bgColor) {
        ctx.fillStyle = item.bgColor;
        ctx.fillRect(x, y - item.fontSize * 0.6, item.width, item.fontSize * 1.15);
      }
      ctx.fillStyle = item.color;
      ctx.font = `${item.style} ${item.weight} ${item.fontSize}px ${item.family}`;
      ctx.fillText(item.ch, x, y);
      x += item.width;
    });
    if (li < lines.length - 1) y += lineHeights[li];
  });
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
  const centerCanvas = document.getElementById('centerCanvas');
  const opts = getConfig();
  const fontsToShow = getAllFonts();
  const PREVIEW_SIZE = 80;
  const CENTER_SIZE = Math.min(256, Math.max(160, Math.round(opts.size * 1.35)));
  const selectedFont = getSelectedFont();

  const baseFontSizeInput = document.getElementById('cfgBaseFontSize');
  if (baseFontSizeInput) baseFontSizeInput.value = getBaseFontSize(selectedFont);

  function populateStrip(stripEl, fontList, titleText) {
    if (!stripEl) return;
    stripEl.innerHTML = '';
    if (titleText) {
      const title = document.createElement('div');
      title.className = 'font-preview-strip-title';
      title.textContent = titleText;
      stripEl.appendChild(title);
    }
    fontList.forEach(font => {
      const previewOpts = {
        text: 'ABC abc',
        bg: opts.bg,
        textColor: opts.textColor,
        size: PREVIEW_SIZE,
        fontScale: 0.5,
        offsetX: 0,
        offsetY: 0,
        rotateDeg: 0,
        bold: false,
        italic: false,
        blurAmount: 0,
        previewOnly: true
      };
      const canvas = drawAvatar(font, previewOpts);
      const card = document.createElement('div');
      card.className = 'font-preview-card' + (font.name === selectedFont.name ? ' font-preview-card--selected' : '');
      card.dataset.fontName = font.name;

      const label = document.createElement('div');
      label.className = 'font-preview-label';
      label.textContent = font.label;

      canvas.onclick = () => {
        selectedFontName = font.name;
        saveConfig();
        buildGrid();
      };

      if (font.id) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'card-delete-btn';
        delBtn.title = 'Remove this font';
        delBtn.setAttribute('aria-label', 'Remove this font');
        delBtn.textContent = '×';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          removeCustomFontById(font.id).then(() => buildGrid());
        };
        card.appendChild(delBtn);
      }

      card.appendChild(canvas);
      card.appendChild(label);
      stripEl.appendChild(card);
    });
  }
  populateStrip(document.getElementById('fontPreviewStripLeft'), fonts, 'Built-in fonts');
  populateStrip(document.getElementById('fontPreviewStripRight'), customUploadedFonts, 'Custom fonts');

  if (centerCanvas) {
    const centerOpts = { ...opts, size: CENTER_SIZE };
    const drawn = drawAvatar(selectedFont, centerOpts);
    centerCanvas.width = drawn.width;
    centerCanvas.height = drawn.height;
    const ctx = centerCanvas.getContext('2d');
    ctx.drawImage(drawn, 0, 0);
  }

  applyPageFontClass();
  buildCharTray();
}

// ── Slider sync ──────────────────────────────────────────────────────────────

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

// ── Event listeners ──────────────────────────────────────────────────────────

function setupConfigListeners() {
  const inputs = ['cfgTextValue', 'cfgBg', 'cfgText', 'cfgFontScale', 'cfgSize', 'cfgOffsetX', 'cfgOffsetY', 'cfgRotate', 'cfgBold', 'cfgItalic', 'cfgBlurAmount'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (id === 'cfgTextValue') syncCharStyles(el.value);
      if (sliderNumPairs.some(p => p.slider === id)) syncSliderToNum(id, sliderNumPairs.find(p => p.slider === id).num);
      buildGrid();
      saveConfig();
    });
    el.addEventListener('change', () => {
      if (id === 'cfgTextValue') syncCharStyles(el.value);
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

  const centerDownloadBtn = document.getElementById('centerDownloadBtn');
  if (centerDownloadBtn) {
    centerDownloadBtn.addEventListener('click', () => {
      const opts = getConfig();
      const canvas = drawAvatar(getSelectedFont(), opts);
      const link = document.createElement('a');
      link.download = `Icon_${getSelectedFont().label.replace(/\s/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  const resetToDefaultBtn = document.getElementById('cfgResetToDefault');
  if (resetToDefaultBtn) {
    resetToDefaultBtn.addEventListener('click', () => resetConfigToDefault());
  }

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
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const addOne = (file) => {
        const isOtf = (file.name || '').toLowerCase().endsWith('.otf');
        const format = isOtf ? 'otf' : 'ttf';
        const id = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        const fileName = (file.name || '').replace(/\.[^.]+$/, '') || 'Custom';
        return addCustomFontToIDB(id, file, format, file.name)
          .then(() => applyCustomFont(file, format, fileName, id));
      };
      let p = Promise.resolve();
      for (let i = 0; i < files.length; i++) p = p.then(() => addOne(files[i]));
      p.then(() => buildGrid()).catch(() => {}).finally(() => { fontUploadInput.value = ''; });
    });
  }

  const baseFontSizeEl = document.getElementById('cfgBaseFontSize');
  if (baseFontSizeEl) {
    baseFontSizeEl.addEventListener('input', () => {
      const font = getSelectedFont();
      if (!font || baseFontSizeEl.value === '') return;
      const num = Number(baseFontSizeEl.value);
      if (!Number.isFinite(num) || num < 1) return;
      fontSizeOverrides[font.name] = Math.min(120, Math.max(10, num));
      buildGrid();
    });
    baseFontSizeEl.addEventListener('change', () => {
      const font = getSelectedFont();
      if (!font) return;
      const val = Math.min(120, Math.max(10, Number(baseFontSizeEl.value) || 54));
      baseFontSizeEl.value = val;
      fontSizeOverrides[font.name] = val;
      buildGrid();
    });
  }

  // Per-character edit panel
  const charEditFont = document.getElementById('charEditFont');
  if (charEditFont) {
    charEditFont.addEventListener('change', () => {
      applyToSelectedChars('fontName', charEditFont.value || null);
    });
  }

  const charEditSize = document.getElementById('charEditSize');
  if (charEditSize) {
    charEditSize.addEventListener('input', () => {
      // Update charStyles + grid directly — avoid buildCharTray which would reset this input mid-type
      if (charEditSize.value === '') {
        selectedCharIndices.forEach(i => { if (charStyles[i]) charStyles[i].fontSize = null; });
        buildGrid();
        return;
      }
      const num = Number(charEditSize.value);
      if (!Number.isFinite(num) || num < 1) return;
      const val = Math.min(120, Math.max(10, num));
      selectedCharIndices.forEach(i => { if (charStyles[i]) charStyles[i].fontSize = val; });
      buildGrid();
    });
    charEditSize.addEventListener('change', () => {
      if (charEditSize.value === '') { applyToSelectedChars('fontSize', null); return; }
      const val = Math.min(120, Math.max(10, Number(charEditSize.value)));
      charEditSize.value = val;
      applyToSelectedChars('fontSize', val);
    });
  }

  const charEditColor = document.getElementById('charEditColor');
  if (charEditColor) {
    charEditColor.addEventListener('input', () => {
      applyToSelectedChars('color', charEditColor.value);
    });
  }

  const charEditBold = document.getElementById('charEditBold');
  if (charEditBold) {
    charEditBold.addEventListener('change', () => {
      charEditBold.indeterminate = false;
      applyToSelectedChars('bold', charEditBold.checked);
    });
  }

  const charEditItalic = document.getElementById('charEditItalic');
  if (charEditItalic) {
    charEditItalic.addEventListener('change', () => {
      charEditItalic.indeterminate = false;
      applyToSelectedChars('italic', charEditItalic.checked);
    });
  }

  const charEditBgEnabled = document.getElementById('charEditBgEnabled');
  const charEditBgColor = document.getElementById('charEditBgColor');
  if (charEditBgEnabled && charEditBgColor) {
    charEditBgEnabled.addEventListener('change', () => {
      charEditBgColor.disabled = !charEditBgEnabled.checked;
      applyToSelectedChars('bgColor', charEditBgEnabled.checked ? charEditBgColor.value : null);
    });
    charEditBgColor.addEventListener('input', () => {
      if (charEditBgEnabled.checked) applyToSelectedChars('bgColor', charEditBgColor.value);
    });
  }

  const charEditReset = document.getElementById('charEditReset');
  if (charEditReset) {
    charEditReset.addEventListener('click', () => {
      selectedCharIndices.forEach(i => {
        if (charStyles[i]) {
          charStyles[i] = { char: charStyles[i].char, fontName: null, fontSize: null, color: null, bgColor: null, bold: null, italic: null };
        }
      });
      buildCharTray();
      buildGrid();
    });
  }

  const charEditClose = document.getElementById('charEditClose');
  if (charEditClose) {
    charEditClose.addEventListener('click', () => {
      selectedCharIndices.clear();
      lastSelectedCharIndex = -1;
      buildCharTray();
    });
  }

  // Konami code
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
  .then(() => loadCustomFontsFromIDB())
  .then((list) => {
    const loads = (list || [])
      .filter((item) => item && item.blob && item.format && item.id)
      .map((item) => applyCustomFont(item.blob, item.format, item.fileName || 'Custom', item.id));
    updatePageFontVariable();
    return Promise.all(loads);
  })
  .catch(() => {})
  .then(() => {
    loadConfig();
    setupConfigListeners();
    buildGrid();
    applyPageFontClass();
  });
