import { domToPng } from 'modern-screenshot';

const stage = document.getElementById('stage');
const canvas = document.getElementById('canvas');
const fi = document.getElementById('fi');
const exportBtn = document.getElementById('exportBtn');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalClose = document.getElementById('modal-close');
const modalDl = document.getElementById('modal-dl');
const canvasView = document.getElementById('canvas-view');

function updateScale() {
  const vw = canvasView.offsetWidth;
  const vh = canvasView.offsetHeight;
  const scale = Math.min(vw / 800, vh / 600) * 0.95; // 0.95 to leave a tiny bit of breathing room
  canvas.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', updateScale);
setTimeout(updateScale, 100);

let lastShot = null;

// Add Copy to Clipboard button dynamically
const copyBtn = document.createElement('button');
copyBtn.className = 'b export';
copyBtn.id = 'copyBtn';
copyBtn.textContent = 'Copy to Clipboard';
exportBtn.parentNode.insertBefore(copyBtn, exportBtn);

let activeDrop = null;
let imgStore = {};

function phHTML(id) {
  return `<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg><span>upload</span></div><img>`;
}

function makeCar(id) {
  return `<div class="car" data-id="${id}">${phHTML(id)}</div>`;
}

function d(id) {
  return `<div class="drop" data-id="${id}"><div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg><span>upload</span></div><img data-id="${id}"></div>`;
}

const DEVICES = {
  browser: () => `<div class="frame-browser"><div class="bbar"><div class="bdot" style="background:#ff5f57"></div><div class="bdot" style="background:#febc2e"></div><div class="bdot" style="background:#28c840"></div><div class="burl"></div></div><div class="scr-browser">${d('d1')}</div></div>`,
  bare: () => `<div class="frame-full">${d('b1')}</div>`,
  phone: () => `<div class="frame-phone"><div class="notch"><div class="npill"></div></div><div class="scr-phone">${d('p1')}</div></div>`,
  'phone-bare': () => `<div class="frame-phone-bare"><div class="scr-phone">${d('pb1')}</div></div>`,
  dual: () => `<div class="dual"><div class="frame-phone"><div class="notch"><div class="npill"></div></div><div class="scr-phone">${d('dp1')}</div></div><div class="frame-phone"><div class="notch"><div class="npill"></div></div><div class="scr-phone">${d('dp2')}</div></div></div>`,
  'triple-bare': () => `<div class="triple-bare"><div class="tpanel">${d('tb1')}</div><div class="tpanel">${d('tb2')}</div><div class="tpanel">${d('tb3')}</div></div>`,
  filmstrip: () => `<div class="filmstrip"><div class="train train1">${makeCar('f1a')}${makeCar('f1b')}${makeCar('f1c')}</div><div class="train train2">${makeCar('f2a')}${makeCar('f2b')}${makeCar('f2c')}</div></div>`,
  tablet: () => `<div class="frame-tablet-bare"><div class="scr-tablet">${d('t1')}</div></div>`,
  diag3: () => `<div class="diag diag3"><div class="pane" style="width:240px;height:300px">${d('g1')}</div><div class="pane" style="width:200px;height:320px;z-index:2">${d('g2')}</div><div class="pane" style="width:180px;height:260px">${d('g3')}</div></div>`,
  diag2: () => `<div class="diag diag2"><div class="pane" style="width:320px;height:300px">${d('g4')}</div><div class="pane" style="width:300px;height:280px;z-index:2">${d('g5')}</div></div>`,
  carousel: () => `<div class="carousel"><div class="panel">${d('c1')}</div><div class="divider"></div><div class="panel">${d('c2')}</div><div class="divider"></div><div class="panel">${d('c3')}</div></div>`,
  stack: () => `<div class="stack"><div class="card"><div class="scr-card">${d('s1')}</div></div><div class="card"><div class="scr-card">${d('s2')}</div></div><div class="card"><div class="scr-card">${d('s3')}</div></div></div>`,
  collage: () => `<div class="collage"><div class="col-side">${d('cl1')}</div><div class="col-gap"></div><div class="col-side" style="width:18%">${d('cl2')}</div><div class="col-gap"></div><div class="col-main">${d('cl3')}</div><div class="col-gap"></div><div class="col-side" style="width:18%">${d('cl4')}</div><div class="col-gap"></div><div class="col-side">${d('cl5')}</div></div>`,
  'collage-grid': () => `<div class="collage-grid"><div class="cell tall">${d('cg1')}</div><div class="cell">${d('cg2')}</div><div class="cell">${d('cg3')}</div></div>`,
  combo: () => `<div class="combo"><div class="frame-browser"><div class="bbar"><div class="bdot" style="background:#ff5f57"></div><div class="bdot" style="background:#febc2e"></div><div class="bdot" style="background:#28c840"></div><div class="burl"></div></div><div class="scr-browser">${d('cb1')}</div></div><div class="phone-over"><div class="notch-sm"><div class="npill-sm"></div></div><div class="scr-ph-sm">${d('cb2')}</div></div></div>`
};

function render(dev) {
  stage.innerHTML = DEVICES[dev]();
  restoreImages();
  bindAll();
}

function restoreImages() {
  stage.querySelectorAll('.drop').forEach(dr => {
    const id = dr.dataset.id;
    if (imgStore[id]) {
      const img = dr.querySelector('img');
      img.src = imgStore[id];
      img.classList.add('vis');
      dr.querySelector('.ph').style.display = 'none';
    }
  });
  stage.querySelectorAll('.car').forEach(car => {
    const id = car.dataset.id;
    if (imgStore[id]) {
      const img = car.querySelector('img');
      img.src = imgStore[id];
      img.classList.add('vis');
      car.querySelector('.ph').style.display = 'none';
    }
  });
}

function bindAll() {
  stage.querySelectorAll('.drop').forEach(dr => {
    dr.addEventListener('click', () => { activeDrop = { type: 'drop', el: dr }; fi.click(); });
    dr.addEventListener('dragover', e => { e.preventDefault(); dr.classList.add('over'); });
    dr.addEventListener('dragleave', () => dr.classList.remove('over'));
    dr.addEventListener('drop', e => { e.preventDefault(); dr.classList.remove('over'); loadImgDrop(e.dataTransfer.files[0], dr); });
  });
  stage.querySelectorAll('.car').forEach(car => {
    car.addEventListener('click', () => { activeDrop = { type: 'car', el: car }; fi.click(); });
    car.addEventListener('dragover', e => { e.preventDefault(); car.classList.add('over'); });
    car.addEventListener('dragleave', () => car.classList.remove('over'));
    car.addEventListener('drop', e => { e.preventDefault(); car.classList.remove('over'); loadImgCar(e.dataTransfer.files[0], car); });
  });
}

function loadImgDrop(file, drop) {
  if (!file || !file.type.startsWith('image/')) return;
  const r = new FileReader();
  r.onload = e => {
    const img = drop.querySelector('img');
    img.src = e.target.result;
    img.classList.add('vis');
    drop.querySelector('.ph').style.display = 'none';
    imgStore[drop.dataset.id] = e.target.result;
  };
  r.readAsDataURL(file);
}

function loadImgCar(file, car) {
  if (!file || !file.type.startsWith('image/')) return;
  const r = new FileReader();
  r.onload = e => {
    const img = car.querySelector('img');
    img.src = e.target.result;
    img.classList.add('vis');
    car.querySelector('.ph').style.display = 'none';
    imgStore[car.dataset.id] = e.target.result;
  };
  r.readAsDataURL(file);
}

fi.addEventListener('change', () => {
  if (!activeDrop || !fi.files[0]) return;
  if (activeDrop.type === 'car') loadImgCar(fi.files[0], activeDrop.el);
  else loadImgDrop(fi.files[0], activeDrop.el);
  fi.value = '';
});

// BG Listeners
[
  { id: 'bg-white', cls: 'bg-white' },
  { id: 'bg-cream', cls: 'bg-cream' },
  { id: 'bg-dark', cls: 'bg-dark' },
  { id: 'bg-lavender', cls: 'bg-lavender' },
  { id: 'bg-sage', cls: 'bg-sage' },
  { id: 'bg-black', cls: 'bg-black' }
].forEach(bg => {
  const btn = document.getElementById(bg.id);
  if (btn) btn.onclick = (e) => setBg(bg.cls, e.target);
});

function setBg(cls, btn) {
  ['bg-white', 'bg-cream', 'bg-dark', 'bg-lavender', 'bg-sage', 'bg-black'].forEach(c => canvas.classList.remove(c));
  canvas.classList.add(cls);
  document.querySelectorAll('.bar .b').forEach(b => {
    if (['White', 'Cream', 'Dark', 'Lavender', 'Sage', 'Black'].includes(b.textContent)) b.classList.remove('on');
  });
  btn.classList.add('on');
}

// Device Listeners
[
  { id: 'dev-browser', dev: 'browser' },
  { id: 'dev-bare', dev: 'bare' },
  { id: 'dev-phone', dev: 'phone' },
  { id: 'dev-phone-bare', dev: 'phone-bare' },
  { id: 'dev-dual', dev: 'dual' },
  { id: 'dev-triple-bare', dev: 'triple-bare' },
  { id: 'dev-filmstrip', dev: 'filmstrip' },
  { id: 'dev-tablet', dev: 'tablet' },
  { id: 'dev-diag3', dev: 'diag3' },
  { id: 'dev-diag2', dev: 'diag2' },
  { id: 'dev-carousel', dev: 'carousel' },
  { id: 'dev-stack', dev: 'stack' },
  { id: 'dev-collage', dev: 'collage' },
  { id: 'dev-collage-grid', dev: 'collage-grid' },
  { id: 'dev-combo', dev: 'combo' }
].forEach(d => {
  const btn = document.getElementById(d.id);
  if (btn) btn.onclick = (e) => setDevice(d.dev, e.target);
});

function setDevice(dev, btn) {
  document.querySelectorAll('.bar .b').forEach(b => {
    if (!['White', 'Cream', 'Dark', 'Lavender', 'Sage', 'Black'].includes(b.textContent) && !b.classList.contains('export')) b.classList.remove('on');
  });
  btn.classList.add('on');
  render(dev);
}

async function waitForRenderableAssets(root) {
  const images = Array.from(root.querySelectorAll('img.vis'));
  await Promise.all(images.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));

  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function renderCanvasPng() {
  await waitForRenderableAssets(canvas);
  const prevTransform = canvas.style.transform;
  const prevBorderRadius = canvas.style.borderRadius;
  try {
    canvas.style.transform = 'none';
    canvas.style.borderRadius = '0';
    return await domToPng(canvas, {
      width: 800,
      height: 600,
      scale: 2
    });
  } finally {
    canvas.style.transform = prevTransform;
    canvas.style.borderRadius = prevBorderRadius;
  }
}

// Copy to Clipboard logic
copyBtn.onclick = async () => {
  const originalText = copyBtn.textContent;
  copyBtn.textContent = 'Copying...';
  copyBtn.disabled = true;

  try {
    const dataUrl = await renderCanvasPng();
    const blob = await (await fetch(dataUrl)).blob();
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.disabled = false;
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
    alert('Copy failed. Try downloading instead.');
    copyBtn.textContent = originalText;
    copyBtn.disabled = false;
  }
};

function triggerDownload(dataUrl) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `dribbble-shot-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export Functionality
exportBtn.onclick = async () => {
  const originalText = exportBtn.textContent;
  exportBtn.textContent = 'Exporting...';
  exportBtn.disabled = true;

  try {
    const dataUrl = await renderCanvasPng();
    lastShot = dataUrl;
    
    // Attempt auto-download
    triggerDownload(dataUrl);
    
    // Show modal preview as failsafe
    modalImg.src = dataUrl;
    modal.classList.add('vis');
    
  } catch (err) {
    console.error('Export failed:', err);
    alert(`Export failed: ${err.message || 'Check console'}`);
  } finally {
    exportBtn.textContent = originalText;
    exportBtn.disabled = false;
  }
};

modalDl.onclick = () => {
  if (lastShot) triggerDownload(lastShot);
};

modalClose.onclick = () => {
  modal.classList.remove('vis');
  modalImg.src = '';
};

render('filmstrip');
setTimeout(updateScale, 500);
