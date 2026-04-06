import { domToPng } from 'modern-screenshot'

const stage = document.getElementById('stage')
const canvas = document.getElementById('canvas')
const fi = document.getElementById('fi')
const exportBtn = document.getElementById('exportBtn')
const modal = document.getElementById('modal')
const modalImg = document.getElementById('modal-img')
const modalClose = document.getElementById('modal-close')
const modalDl = document.getElementById('modal-dl')
const copyBtn = document.getElementById('copyBtn')
const canvasView = document.getElementById('canvas-view')

const bgColorSelect = document.getElementById('bg-color-select')
const deviceColorSelect = document.getElementById('device-color-select')
const layoutSelect = document.getElementById('layout-select')
const frameSelect = document.getElementById('frame-select')

const BG_COLORS = [
  { id: 'white',      label: 'White',      value: '#ffffff' },
  { id: 'linen',      label: 'Linen',      value: '#f8f3ec' },
  { id: 'butter',     label: 'Butter',     value: '#fdf5d0' },
  { id: 'peach',      label: 'Peach',      value: '#fce5d0' },
  { id: 'blush',      label: 'Blush',      value: '#f8dde0' },
  { id: 'lilac',      label: 'Lilac',      value: '#ede0f5' },
  { id: 'sage',       label: 'Sage',       value: '#d8ebdc' },
  { id: 'sky',        label: 'Sky',        value: '#d5e8f8' },
  { id: 'clay',       label: 'Clay',       value: '#ece0d8' },
  { id: 'mocha',      label: 'Mocha',      value: '#1e1812' },
  { id: 'plum',       label: 'Plum',       value: '#1e1428' },
]

const DEVICE_COLORS = [
  { id: 'black',      label: 'Black',      border: '#111114', surface: '#080808', chrome: '#1c1c1e', chromeAccent: '#282828', screenBorder: 'rgba(255,255,255,0.06)' },
  { id: 'graphite',   label: 'Graphite',   border: '#403c38', surface: '#121010', chrome: '#343030', chromeAccent: '#403c38', screenBorder: 'rgba(255,255,255,0.07)' },
  { id: 'titanium',   label: 'Titanium',   border: '#8a8680', surface: '#1a1816', chrome: '#706c68', chromeAccent: '#7e7a74', screenBorder: 'rgba(255,255,255,0.09)' },
  { id: 'silver',     label: 'Silver',     border: '#c8c8cc', surface: '#f8f8fa', chrome: '#dcdce0', chromeAccent: '#c8c8cc', screenBorder: 'rgba(0,0,0,0.06)' },
  { id: 'gold',       label: 'Gold',       border: '#c8a87a', surface: '#100e08', chrome: '#c8a87a', chromeAccent: '#b8986a', screenBorder: 'rgba(255,255,255,0.08)' },
  { id: 'rosegold',   label: 'Rose Gold',  border: '#c89898', surface: '#120c0c', chrome: '#c89898', chromeAccent: '#b88888', screenBorder: 'rgba(255,255,255,0.08)' },
  { id: 'merlot',     label: 'Merlot',     border: '#6a1e30', surface: '#0e0408', chrome: '#6a1e30', chromeAccent: '#7a2838', screenBorder: 'rgba(255,255,255,0.07)' },
  { id: 'sage',       label: 'Sage',       border: '#3a5a48', surface: '#080c0a', chrome: '#3a5a48', chromeAccent: '#486858', screenBorder: 'rgba(255,255,255,0.07)' },
  { id: 'indigo',     label: 'Indigo',     border: '#263898', surface: '#04060e', chrome: '#263898', chromeAccent: '#3448a8', screenBorder: 'rgba(255,255,255,0.07)' },
  { id: 'bone',       label: 'Bone',       border: '#e8e2d4', surface: '#f8f6f0', chrome: '#e8e2d4', chromeAccent: '#dcd6c6', screenBorder: 'rgba(0,0,0,0.06)' },
]

const FRAMES = {
  phone: { label: 'Phone' },
  'phone-bare': { label: 'Phone (chromeless)' },
  browser: { label: 'Browser' },
  screen: { label: 'Browser (chromeless)' },
  tablet: { label: 'Tablet' },
  'tablet-bare': { label: 'Tablet (chromeless)' }
}

let lastShot = null
let activeDrop = null
const imgStore = {}

const state = {
  bgColor: 'linen',
  deviceColor: 'black',
  layout: 'filmstrip',
  frame: 'phone',
  screenCount: 4
}

function updateScale() {
  const vw = canvasView.offsetWidth
  const vh = canvasView.offsetHeight
  const scale = Math.min(vw / 800, vh / 600) * 0.95
  canvas.style.transform = `scale(${scale})`
}

window.addEventListener('resize', updateScale)
setTimeout(updateScale, 100)

function screenId(index) {
  return `screen-${index + 1}`
}

function getFrameFamily(frame) {
  if (frame === 'phone' || frame === 'phone-bare') return 'tall'
  if (frame === 'tablet' || frame === 'tablet-bare') return 'medium'
  return 'wide'
}

function phHTML() {
  return `<div class="ph"><div class="ph-btn"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg><span>Select Image</span></div></div><img>`
}

function dropHTML(id) {
  return `<div class="drop" data-id="${id}">${phHTML()}</div>`
}

function renderFrame(frame, id, options = {}) {
  const family = getFrameFamily(frame)
  const fitClass = options.fit ? ' frame-fit' : ''

  switch (frame) {
    case 'browser':
      return `<div class="frame frame-browser family-${family}${fitClass}"><div class="bbar"><div class="bdot" style="background:#ff5f57"></div><div class="bdot" style="background:#febc2e"></div><div class="bdot" style="background:#28c840"></div><div class="burl"></div></div><div class="scr-browser">${dropHTML(id)}</div></div>`
    case 'screen':
      return `<div class="frame frame-screen family-${family}${fitClass}"><div class="scr-screen">${dropHTML(id)}</div></div>`
    case 'phone':
      return `<div class="frame frame-phone family-${family}${fitClass}"><div class="scr-phone"><div class="dynamic-island"></div>${dropHTML(id)}</div></div>`
    case 'phone-bare':
      return `<div class="frame frame-phone-bare family-${family}${fitClass}"><div class="scr-phone">${dropHTML(id)}</div></div>`
    case 'tablet':
      return `<div class="frame frame-tablet family-${family}${fitClass}"><div class="scr-tablet">${dropHTML(id)}</div></div>`
    case 'tablet-bare':
      return `<div class="frame frame-tablet-bare family-${family}${fitClass}"><div class="scr-tablet">${dropHTML(id)}</div></div>`
    default:
      return ''
  }
}

function toStyle(styleObject) {
  return Object.entries(styleObject)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}:${typeof value === 'number' ? `${value}px` : value}`)
    .join(';')
}

function absoluteSlot(frame, index, styleObject) {
  return `<div class="layout-slot" style="${toStyle(styleObject)}">${wrappedFrame(frame, screenId(index))}</div>`
}

function panelSlot(panelClass, frame, index) {
  return `<div class="${panelClass}">${renderFrame(frame, screenId(index), { fit: true })}</div>`
}

function soloWidth(frame) {
  const family = getFrameFamily(frame)
  if (family === 'tall') return 220
  if (family === 'medium') return 500
  return 620
}

const SHADOW_RADII = { browser: 22, screen: 24, phone: 28, 'phone-bare': 22, tablet: 22, 'tablet-bare': 22 }
function shadowRadius(frame) { return SHADOW_RADII[frame] || 22 }

function wrappedFrame(frame, id, options = {}) {
  const r = shadowRadius(frame)
  return `<div class="device-wrapper" style="--shadow-r:${r}px"><div class="device-shadow"></div>${renderFrame(frame, id, options)}</div>`
}

function gridSlot(index) {
  return `<div class="grid-item">${renderFrame('screen', screenId(index))}</div>`
}

function carHTML(id, pos = 'center') {
  return `<div class="car car--${pos}" data-id="${id}">${phHTML()}</div>`
}

function filmstripSlotHTML(frame, id, pos = 'center') {
  const r = shadowRadius(frame)
  const inner = frame === 'phone-bare'
    ? carHTML(id, pos)
    : `<div class="car-wrap">${renderFrame(frame, id)}</div>`
  return `<div class="device-wrapper" style="--shadow-r:${r}px"><div class="device-shadow"></div>${inner}</div>`
}

const THREEUP_W = 220
const THREEUP_H = Math.round(THREEUP_W * 19.5 / 9)

function threeUpSlot(frame, index, { cx, cy, z = 1, rot = 0, w = THREEUP_W }) {
  const h = Math.round(w * 19.5 / 9)
  const r = shadowRadius(frame)
  const parts = [
    `position:absolute`,
    `left:${Math.round(cx - w / 2)}px`,
    `top:${Math.round(cy - h / 2)}px`,
    `width:${w}px`,
    `height:${h}px`,
    `z-index:${z}`,
    rot ? `transform:rotate(${rot}deg)` : null,
    `--shadow-r:${r}px`
  ].filter(Boolean).join(';')
  return `<div class="device-wrapper" style="${parts}"><div class="device-shadow"></div>${renderFrame(frame, screenId(index))}</div>`
}

function threeUp(frame, slots) {
  return `<div class="layout layout-3up">${slots.map((s, i) => threeUpSlot(frame, i, s)).join('')}</div>`
}

const LAYOUTS = {
  solo: {
    label: 'Solo',
    minScreens: 1,
    maxScreens: 1,
    defaultFrame: 'browser',
    allowedFrames: ['browser', 'screen', 'phone', 'phone-bare', 'tablet', 'tablet-bare'],
    render: ({ frame }) => `<div class="layout layout-solo">${absoluteSlot(frame, 0, { width: soloWidth(frame) })}</div>`
  },
  '3up-level': {
    label: '3-Up: Level',
    minScreens: 3, maxScreens: 3,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone', 'phone-bare'],
    render: ({ frame }) => threeUp(frame, [
      { cx: 160, cy: 300 },
      { cx: 400, cy: 300 },
      { cx: 640, cy: 300 }
    ])
  },
  '3up-v': {
    label: '3-Up: V',
    minScreens: 3, maxScreens: 3,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone', 'phone-bare'],
    render: ({ frame }) => threeUp(frame, [
      { cx: 160, cy: 265 },
      { cx: 400, cy: 335 },
      { cx: 640, cy: 265 }
    ])
  },
  '3up-arch': {
    label: '3-Up: ∧',
    minScreens: 3, maxScreens: 3,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone', 'phone-bare'],
    render: ({ frame }) => threeUp(frame, [
      { cx: 160, cy: 335 },
      { cx: 400, cy: 265 },
      { cx: 640, cy: 335 }
    ])
  },
  '3up-stairs-down': {
    label: '3-Up: Stairs ↓',
    minScreens: 3, maxScreens: 3,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone', 'phone-bare'],
    render: ({ frame }) => threeUp(frame, [
      { cx: 160, cy: 255 },
      { cx: 400, cy: 300 },
      { cx: 640, cy: 345 }
    ])
  },
  '3up-stairs-up': {
    label: '3-Up: Stairs ↑',
    minScreens: 3, maxScreens: 3,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone', 'phone-bare'],
    render: ({ frame }) => threeUp(frame, [
      { cx: 160, cy: 345 },
      { cx: 400, cy: 300 },
      { cx: 640, cy: 255 }
    ])
  },
  '3up-overlap': {
    label: '3-Up: Overlap',
    minScreens: 3, maxScreens: 3,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone', 'phone-bare'],
    render: ({ frame }) => threeUp(frame, [
      { cx: 400, cy: 300, z: 3, rot: 0 },
      { cx: 222, cy: 310, z: 1, rot: -10, w: 195 },
      { cx: 578, cy: 310, z: 2, rot: 10,  w: 195 }
    ])
  },
  'split-1': {
    label: 'Split 1',
    minScreens: 3,
    maxScreens: 3,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone-bare'],
    render: ({ frame }) => `<div class="layout layout-split layout-split-1">${[0, 1, 2].map(index => wrappedFrame(frame, screenId(index))).join('')}</div>`
  },
  'split-2': {
    label: 'Split 2',
    minScreens: 4,
    maxScreens: 4,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone-bare'],
    render: ({ frame }) => `<div class="layout layout-split layout-split-2">${[0, 1, 2, 3].map(index => wrappedFrame(frame, screenId(index))).join('')}</div>`
  },
  filmstrip: {
    label: 'Film strip',
    minScreens: 3,
    maxScreens: 3,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone-bare', 'phone'],
    render: ({ frame }) => `<div class="layout layout-filmstrip"><div class="filmstrip"><div class="train train1">${filmstripSlotHTML(frame, screenId(0))}</div><div class="train train2">${filmstripSlotHTML(frame, screenId(1), 'bottom')}${filmstripSlotHTML(frame, screenId(2), 'top')}</div></div></div>`
  },
  'grid-1': {
    label: 'Grid 1',
    minScreens: 3,
    maxScreens: 3,
    defaultFrame: 'screen',
    allowedFrames: ['screen'],
    render: () => `<div class="layout layout-grid layout-grid-1"><div class="grid-container">${[0, 1, 2].map(index => gridSlot(index)).join('')}</div></div>`
  },
  'grid-2': {
    label: 'Grid 2',
    minScreens: 4,
    maxScreens: 4,
    defaultFrame: 'screen',
    allowedFrames: ['screen'],
    render: () => `<div class="layout layout-grid layout-grid-2"><div class="grid-col">${gridSlot(0)}${gridSlot(1)}</div><div class="grid-col">${gridSlot(2)}${gridSlot(3)}</div></div>`
  }
}

function getLayout() {
  return LAYOUTS[state.layout]
}

function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function applyCanvasColors() {
  const bg = BG_COLORS.find(c => c.id === state.bgColor)
  const dev = DEVICE_COLORS.find(c => c.id === state.deviceColor)
  const light = isLightColor(bg.value)
  const devLight = isLightColor(dev.surface)

  // Derive shadow tint from bg hue: keep hue, boost saturation, force dark lightness
  const [h, s] = hexToHsl(bg.value)
  const shadowHsl = `hsla(${Math.round(h)}, ${Math.round(Math.min(s * 2.5, 55))}%, 18%, `
  const shadowColor1 = shadowHsl + '0.28)'
  const shadowColor2 = shadowHsl + '0.17)'

  const vars = {
    '--canvas-bg': bg.value,
    '--canvas-fg': light ? '#151515' : '#f5f6f7',
    '--surface-bg': dev.surface,
    '--device-border': dev.border,
    '--chrome-bg': dev.chrome,
    '--chrome-accent': dev.chromeAccent,
    '--screen-border': dev.screenBorder,
    '--placeholder-bg': devLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
    '--placeholder-stroke': devLight ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.28)',
    '--placeholder-label': devLight ? 'rgba(0,0,0,0.42)' : 'rgba(255,255,255,0.42)',
    '--device-shadow': `0 32px 48px ${shadowColor1}, 0 12px 18px ${shadowColor2}`,
  }
  for (const [k, v] of Object.entries(vars)) canvas.style.setProperty(k, v)
}

function syncStateToLayout() {
  const layout = getLayout()

  if (!layout.allowedFrames.includes(state.frame)) {
    state.frame = layout.defaultFrame
  }

  if (state.screenCount < layout.minScreens) {
    state.screenCount = layout.minScreens
  }

  if (state.screenCount > layout.maxScreens) {
    state.screenCount = layout.maxScreens
  }
}

function setOptions(select, options, selectedValue) {
  select.innerHTML = options
    .map(({ value, label }) => `<option value="${value}"${String(value) === String(selectedValue) ? ' selected' : ''}>${label}</option>`)
    .join('')
}

function refreshControls() {
  const layout = getLayout()
  const isGridLayout = state.layout.startsWith('grid-')

  setOptions(
    bgColorSelect,
    BG_COLORS.map(({ id, label }) => ({ value: id, label })),
    state.bgColor
  )

  setOptions(
    deviceColorSelect,
    DEVICE_COLORS.map(({ id, label }) => ({ value: id, label })),
    state.deviceColor
  )

  setOptions(
    layoutSelect,
    Object.entries(LAYOUTS).map(([value, config]) => ({ value, label: config.label })),
    state.layout
  )

  setOptions(
    frameSelect,
    layout.allowedFrames.map(value => ({ value, label: FRAMES[value].label })),
    state.frame
  )

  frameSelect.disabled = layout.allowedFrames.length === 1
  deviceColorSelect.disabled = isGridLayout
}

function render() {
  stage.innerHTML = getLayout().render(state)
  restoreImages()
  bindAll()
}

function updateUI() {
  syncStateToLayout()
  applyCanvasColors()
  refreshControls()
  render()
}

function restoreImages() {
  stage.querySelectorAll('.drop, .car').forEach(drop => {
    const id = drop.dataset.id

    if (!imgStore[id]) return

    const img = drop.querySelector('img')
    const ph = drop.querySelector('.ph')

    img.src = imgStore[id]
    img.classList.add('vis')
    ph.style.display = 'none'
  })
}

function bindAll() {
  stage.querySelectorAll('.drop, .car').forEach(drop => {
    drop.addEventListener('click', () => {
      activeDrop = drop
      fi.click()
    })

    drop.addEventListener('dragover', event => {
      event.preventDefault()
      drop.classList.add('over')
    })

    drop.addEventListener('dragleave', () => {
      drop.classList.remove('over')
    })

    drop.addEventListener('drop', event => {
      event.preventDefault()
      drop.classList.remove('over')
      loadImage(event.dataTransfer.files[0], drop)
    })
  })
}

function loadImage(file, drop) {
  if (!file || !file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = event => {
    const img = drop.querySelector('img')
    img.src = event.target.result
    img.classList.add('vis')
    drop.querySelector('.ph').style.display = 'none'
    imgStore[drop.dataset.id] = event.target.result
  }
  reader.readAsDataURL(file)
}

fi.addEventListener('change', () => {
  if (!activeDrop || !fi.files[0]) return
  loadImage(fi.files[0], activeDrop)
  fi.value = ''
})

bgColorSelect.addEventListener('change', () => {
  state.bgColor = bgColorSelect.value
  applyCanvasColors()
})

deviceColorSelect.addEventListener('change', () => {
  state.deviceColor = deviceColorSelect.value
  applyCanvasColors()
})

layoutSelect.addEventListener('change', () => {
  state.layout = layoutSelect.value
  updateUI()
})

frameSelect.addEventListener('change', () => {
  state.frame = frameSelect.value
  updateUI()
})

async function waitForRenderableAssets(root) {
  const images = Array.from(root.querySelectorAll('img.vis'))

  await Promise.all(images.map(img => {
    if (img.complete) return Promise.resolve()
    return new Promise(resolve => {
      img.onload = resolve
      img.onerror = resolve
    })
  }))

  await document.fonts.ready
  await new Promise(resolve => setTimeout(resolve, 100))
}

async function renderCanvasPng() {
  await waitForRenderableAssets(canvas)
  const prevTransform = canvas.style.transform
  const prevBorderRadius = canvas.style.borderRadius

  try {
    canvas.style.transform = 'none'
    canvas.style.borderRadius = '0'
    return await domToPng(canvas, {
      width: 800,
      height: 600,
      scale: 2
    })
  } finally {
    canvas.style.transform = prevTransform
    canvas.style.borderRadius = prevBorderRadius
  }
}

copyBtn.onclick = async () => {
  const originalText = copyBtn.textContent
  copyBtn.textContent = 'Copying...'
  copyBtn.disabled = true

  try {
    const dataUrl = await renderCanvasPng()
    const blob = await (await fetch(dataUrl)).blob()
    const item = new ClipboardItem({ 'image/png': blob })
    await navigator.clipboard.write([item])
    copyBtn.textContent = 'Copied!'
    setTimeout(() => {
      copyBtn.textContent = originalText
      copyBtn.disabled = false
    }, 2000)
  } catch (err) {
    console.error('Copy failed:', err)
    alert('Copy failed. Try downloading instead.')
    copyBtn.textContent = originalText
    copyBtn.disabled = false
  }
}

function triggerDownload(dataUrl) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `dribbble-shot-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

exportBtn.onclick = async () => {
  const originalText = exportBtn.textContent
  exportBtn.textContent = 'Exporting...'
  exportBtn.disabled = true

  try {
    const dataUrl = await renderCanvasPng()
    lastShot = dataUrl

    triggerDownload(dataUrl)

    modalImg.src = dataUrl
    modal.classList.add('vis')
  } catch (err) {
    console.error('Export failed:', err)
    alert(`Export failed: ${err.message || 'Check console'}`)
  } finally {
    exportBtn.textContent = originalText
    exportBtn.disabled = false
  }
}

modalDl.onclick = () => {
  if (lastShot) triggerDownload(lastShot)
}

modalClose.onclick = () => {
  modal.classList.remove('vis')
  modalImg.src = ''
}

modal.addEventListener('click', event => {
  if (event.target === modal) {
    modal.classList.remove('vis')
    modalImg.src = ''
  }
})

updateUI()
setTimeout(updateScale, 500)

const footerYear = document.getElementById('footer-year')
if (footerYear) {
  const start = 2026, now = new Date().getFullYear()
  footerYear.textContent = now > start ? `${start}–${now}` : `${start}`
}
