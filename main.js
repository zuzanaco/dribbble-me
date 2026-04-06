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

const themeSelect = document.getElementById('theme-select')
const modeSelect = document.getElementById('mode-select')
const screenCountSelect = document.getElementById('screen-count-select')
const layoutSelect = document.getElementById('layout-select')
const frameSelect = document.getElementById('frame-select')

const THEMES = {
  white: { label: 'White' },
  cream: { label: 'Cream' },
  sage: { label: 'Sage' }
}

const MODES = {
  light: { label: 'Light' },
  dark: { label: 'Dark' }
}

const FRAMES = {
  phone: { label: 'Phone' },
  'phone-bare': { label: 'Phone (chromeless)' },
  browser: { label: 'Browser' },
  screen: { label: 'Screen only' },
  tablet: { label: 'Tablet' }
}

let lastShot = null
let activeDrop = null
const imgStore = {}

const state = {
  theme: 'white',
  mode: 'light',
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
  if (frame === 'tablet') return 'medium'
  return 'wide'
}

function phHTML() {
  return `<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg><span>upload</span></div><img>`
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
      return `<div class="frame frame-phone family-${family}${fitClass}"><div class="notch"><div class="npill"></div></div><div class="scr-phone">${dropHTML(id)}</div></div>`
    case 'phone-bare':
      return `<div class="frame frame-phone-bare family-${family}${fitClass}"><div class="scr-phone">${dropHTML(id)}</div></div>`
    case 'tablet':
      return `<div class="frame frame-tablet family-${family}${fitClass}"><div class="scr-tablet">${dropHTML(id)}</div></div>`
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
  return `<div class="layout-slot" style="${toStyle(styleObject)}">${renderFrame(frame, screenId(index))}</div>`
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

function carHTML(id) {
  return `<div class="car" data-id="${id}">${phHTML()}</div>`
}

function filmstripSlotHTML(frame, id) {
  if (frame === 'phone-bare') {
    return carHTML(id)
  }
  return `<div class="car-wrap">${renderFrame(frame, id)}</div>`
}

const LAYOUTS = {
  solo: {
    label: 'Solo',
    minScreens: 1,
    maxScreens: 1,
    defaultFrame: 'browser',
    allowedFrames: ['browser', 'screen', 'phone', 'phone-bare', 'tablet'],
    render: ({ frame }) => `<div class="layout layout-solo">${absoluteSlot(frame, 0, { width: soloWidth(frame) })}</div>`
  },
  split: {
    label: 'Split',
    minScreens: 3,
    maxScreens: 3,
    defaultFrame: 'screen',
    allowedFrames: ['browser', 'screen', 'phone', 'phone-bare', 'tablet'],
    render: ({ frame }) => `<div class="layout layout-split">${[0, 1, 2].map(index => panelSlot('split-panel', frame, index)).join('')}</div>`
  },
  filmstrip: {
    label: 'Film strip',
    minScreens: 3,
    maxScreens: 3,
    defaultFrame: 'phone-bare',
    allowedFrames: ['phone-bare', 'phone'],
    render: ({ frame }) => `<div class="layout layout-filmstrip"><div class="filmstrip"><div class="train train1">${filmstripSlotHTML(frame, screenId(0))}</div><div class="train train2">${filmstripSlotHTML(frame, screenId(1))}${filmstripSlotHTML(frame, screenId(2))}</div></div></div>`
  }
}

function getLayout() {
  return LAYOUTS[state.layout]
}

function setCanvasTheme() {
  canvas.className = 'canvas'
  canvas.classList.add(`theme-${state.theme}`, `mode-${state.mode}`)
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

  setOptions(
    themeSelect,
    Object.entries(THEMES).map(([value, config]) => ({ value, label: config.label })),
    state.theme
  )

  setOptions(
    modeSelect,
    Object.entries(MODES).map(([value, config]) => ({ value, label: config.label })),
    state.mode
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

  setOptions(
    screenCountSelect,
    Array.from({ length: layout.maxScreens - layout.minScreens + 1 }, (_, index) => {
      const count = layout.minScreens + index
      return { value: count, label: `${count}` }
    }),
    state.screenCount
  )

  screenCountSelect.disabled = layout.minScreens === layout.maxScreens
  frameSelect.disabled = layout.allowedFrames.length === 1
}

function render() {
  stage.innerHTML = getLayout().render(state)
  restoreImages()
  bindAll()
}

function updateUI() {
  syncStateToLayout()
  setCanvasTheme()
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

themeSelect.addEventListener('change', () => {
  state.theme = themeSelect.value
  setCanvasTheme()
})

modeSelect.addEventListener('change', () => {
  state.mode = modeSelect.value
  setCanvasTheme()
})

layoutSelect.addEventListener('change', () => {
  state.layout = layoutSelect.value
  updateUI()
})

frameSelect.addEventListener('change', () => {
  state.frame = frameSelect.value
  updateUI()
})

screenCountSelect.addEventListener('change', () => {
  state.screenCount = Number(screenCountSelect.value)
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
