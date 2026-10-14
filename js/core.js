import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const rngOf = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

/* ───────── procedural canvas textures ───────── */
function tex(size, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size
  const g = c.getContext('2d'); draw(g, size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
const R = rngOf(1234)
const speckle = (g, s, n, cols, a0, a1, rmax) => { for (let i = 0; i < n; i++) { g.globalAlpha = a0 + R() * (a1 - a0); g.fillStyle = cols[(R() * cols.length) | 0]; const r = 0.5 + R() * rmax; g.fillRect(R() * s, R() * s, r, r) } g.globalAlpha = 1 }
const blotch = (g, s, n, col, a, rmin, rmax) => { for (let i = 0; i < n; i++) { const x = R() * s, y = R() * s, r = rmin + R() * (rmax - rmin); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2) } }

export function makeTextures() {
  const T = {}
  T.plaster = tex(512, (g, s) => {
    g.fillStyle = '#f3e7c9'; g.fillRect(0, 0, s, s)
    blotch(g, s, 40, 'rgba(190,160,110,A)', 0.16, 40, 120); blotch(g, s, 30, 'rgba(255,250,235,A)', 0.25, 30, 90)
    speckle(g, s, 5000, ['#d8c59c', '#b9a47a', '#fff7e3', '#c9b78e'], 0.08, 0.3, 2.2)
    g.strokeStyle = 'rgba(120,95,60,.12)'; g.lineWidth = 1
    for (let i = 0; i < 7; i++) { let x = R() * s, y = R() * s; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (R() - .5) * 26; y += R() * 18; g.lineTo(x, y) } g.stroke() }
  })
  T.wood = tex(512, (g, s) => { // grain runs along V (vertical)
    g.fillStyle = '#a89886'; g.fillRect(0, 0, s, s)
    for (let x = 0; x < s; x += 2) { const v = 0.55 + R() * 0.45; g.fillStyle = `rgba(${60 * v | 0},${44 * v | 0},${30 * v | 0},${0.18 + R() * 0.22})`; g.fillRect(x, 0, 1 + R() * 2, s) }
    for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(40,28,18,${0.15 + R() * 0.2})`; g.lineWidth = 0.6 + R(); const x = R() * s; g.beginPath(); g.moveTo(x, R() * s); g.bezierCurveTo(x + (R() - .5) * 8, R() * s, x + (R() - .5) * 8, R() * s, x + (R() - .5) * 6, R() * s); g.stroke() }
    for (let i = 0; i < 4; i++) { const x = R() * s, y = R() * s; g.fillStyle = 'rgba(50,34,22,.5)'; g.beginPath(); g.ellipse(x, y, 5 + R() * 4, 9 + R() * 8, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(50,34,22,.3)'; g.beginPath(); g.ellipse(x, y, 11, 20, 0, 0, 7); g.stroke() }
    speckle(g, s, 1500, ['#7b5a40', '#3a281a'], 0.1, 0.3, 1.5)
  })
  T.stone = tex(512, (g, s) => { // irregular blocks, mortar lines
    g.fillStyle = '#6f685d'; g.fillRect(0, 0, s, s)
    let y = 0
    while (y < s) { const h = 40 + R() * 36; let x = -R() * 60; while (x < s) { const w = 50 + R() * 90; const l = 120 + R() * 55 | 0, wr = 0.88 + R() * 0.12
      g.fillStyle = `rgb(${l * wr + 6 | 0},${l * 0.96 | 0},${l * 0.86 | 0})`
      g.beginPath(); const r = 7; const x0 = x + 2, y0 = y + 2, x1 = x + w - 2, y1 = y + h - 2
      g.moveTo(x0 + r + R() * 3, y0 + R() * 3); g.lineTo(x1 - r, y0 + R() * 3); g.quadraticCurveTo(x1 + R() * 2, y0, x1, y0 + r); g.lineTo(x1 - R() * 3, y1 - r); g.quadraticCurveTo(x1, y1 + R() * 2, x1 - r, y1); g.lineTo(x0 + r, y1 - R() * 3); g.quadraticCurveTo(x0, y1, x0 + R() * 2, y1 - r); g.closePath(); g.fill()
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x0 + 6, y0 + 3, w - 16, 3); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x0 + 6, y1 - 5, w - 16, 3)
      x += w } y += h }
    speckle(g, s, 5000, ['#4a453d', '#9a9283', '#7d766a'], 0.1, 0.35, 2)
    blotch(g, s, 24, 'rgba(70,95,50,A)', 0.14, 20, 60)
  })
  T.planks = tex(512, (g, s) => { // vertical boards with dark gaps
    const n = 8, w = s / n
    for (let i = 0; i < n; i++) { const v = 0.8 + R() * 0.3; g.fillStyle = `rgb(${142 * v | 0},${98 * v | 0},${60 * v | 0})`; g.fillRect(i * w, 0, w, s)
      for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(60,36,18,${0.1 + R() * 0.2})`; g.lineWidth = 0.7; const x = i * w + 3 + R() * (w - 6); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - .5) * 4, s); g.stroke() }
      g.fillStyle = 'rgba(30,16,8,.85)'; g.fillRect(i * w, 0, 3, s); g.fillStyle = 'rgba(255,220,170,.12)'; g.fillRect(i * w + 3, 0, 2, s) }
    speckle(g, s, 800, ['#3a2412', '#b98a5a'], 0.1, 0.3, 1.5)
  })
  T.tilePlane = tex(256, (g, s) => { // scale pattern for small roofs
    g.fillStyle = '#5a2512'; g.fillRect(0, 0, s, s)
    const rows = 6, rh = s / rows, tw = s / 4
    for (let r = 0; r < rows; r++) for (let c = -1; c < 5; c++) { const x = c * tw + (r % 2) * tw / 2, y = r * rh; const v = 0.85 + R() * 0.3
      g.fillStyle = `rgb(${206 * v | 0},${92 * v | 0},${38 * v | 0})`; g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + tw - 2, y); g.lineTo(x + tw - 2, y + rh * 0.55); g.quadraticCurveTo(x + tw / 2, y + rh * 1.25, x + 2, y + rh * 0.55); g.fill()
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 2, y + rh * 0.78, tw - 4, 3) }
  })
  T.grass = tex(1024, (g, s) => {
    g.fillStyle = '#4f8a3b'; g.fillRect(0, 0, s, s)
    blotch(g, s, 160, 'rgba(36,92,42,A)', 0.35, 30, 110); blotch(g, s, 120, 'rgba(120,170,70,A)', 0.28, 20, 80); blotch(g, s, 40, 'rgba(160,130,70,A)', 0.14, 30, 90)
    for (let i = 0; i < 9000; i++) { g.strokeStyle = ['#3d7433', '#66a047', '#2f6030', '#7bb352'][(R() * 4) | 0]; g.globalAlpha = 0.3 + R() * 0.5; g.lineWidth = 1; const x = R() * s, y = R() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 5, y - 3 - R() * 6); g.stroke() }
    g.globalAlpha = 1
    const fl = ['#fff6d8', '#ffd45a', '#ff8fb0', '#b8a2ff']; for (let i = 0; i < 260; i++) { g.fillStyle = fl[(R() * 4) | 0]; g.beginPath(); g.arc(R() * s, R() * s, 1.2 + R() * 1.5, 0, 7); g.fill() }
  })
  T.awning = tex(128, (g, s) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f5ecd8' : '#c43b2d'; g.fillRect(i * s / 8, 0, s / 8, s) } g.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 400; i++) g.fillRect(R() * s, R() * s, 2, 1) })
  T.glass = tex(64, (g, s) => { const gr = g.createRadialGradient(s * .5, s * .62, 2, s * .5, s * .5, s * .75); gr.addColorStop(0, '#fff0b8'); gr.addColorStop(.55, '#ffc15e'); gr.addColorStop(1, '#d9741f'); g.fillStyle = gr; g.fillRect(0, 0, s, s) })
  T.shade = tex(64, (g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s) }, { linear: true })
  T.blob = tex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(.6, 'rgba(0,0,0,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s) }, { linear: true })
  for (const k of ['grass', 'plaster', 'stone', 'wood', 'planks', 'tilePlane']) T[k].colorSpace = THREE.SRGBColorSpace
  return T
}

/* ───────── materials ───────── */
export function makeMaterials(T) {
  const std = (o) => new THREE.MeshStandardMaterial(o)
  const M = {}
  M.plaster = std({ map: T.plaster, bumpMap: T.plaster, bumpScale: 0.6, roughness: 0.92, color: 0xffffff }); M.plaster.userData.k = 1 / 1.6
  M.plasterWarm = M.plaster.clone(); M.plasterWarm.color.set(0xffe2b8)
  M.plasterRose = M.plaster.clone(); M.plasterRose.color.set(0xf3c9ab)
  M.plasterSage = M.plaster.clone(); M.plasterSage.color.set(0xdfe6c4)
  M.plasterGrey = M.plaster.clone(); M.plasterGrey.color.set(0xe4dccb)
  M.stone = std({ map: T.stone, bumpMap: T.stone, bumpScale: 1.2, roughness: 0.95 }); M.stone.userData.k = 1 / 1.7
  M.stoneWarm = M.stone.clone(); M.stoneWarm.color.set(0xf2dcc0); M.stoneWarm.userData.k = 1 / 1.7
  M.stoneDark = M.stone.clone(); M.stoneDark.color.set(0xb7aea2); M.stoneDark.userData.k = 1 / 1.7
  M.timber = std({ map: T.wood, bumpMap: T.wood, bumpScale: 0.8, roughness: 0.7, color: 0x8a6446 }); M.timber.userData.k = 1 / 1.2
  M.timberLight = M.timber.clone(); M.timberLight.color.set(0xc79a74); M.timberLight.userData.k = 1 / 1.2
  M.planks = std({ map: T.planks, bumpMap: T.planks, bumpScale: 1, roughness: 0.8 }); M.planks.userData.k = 1 / 1.4
  M.planksDark = M.planks.clone(); M.planksDark.color.set(0xb8906a); M.planksDark.userData.k = 1 / 1.4
  M.tilePlane = std({ map: T.tilePlane, roughness: 0.7 }); M.tilePlane.userData.k = 1 / 0.9
  M.tileInst = std({ roughness: 0.62, metalness: 0.0, color: 0xd4622a })
  M.tileDark = std({ roughness: 0.7, color: 0xffffff })
  M.under = std({ color: 0x5a4331, roughness: 0.9 })
  M.iron = std({ color: 0x25272b, roughness: 0.45, metalness: 0.75 })
  M.brass = std({ color: 0xc89b3c, roughness: 0.35, metalness: 0.85 })
  M.awning = std({ map: T.awning, roughness: 0.85, side: THREE.DoubleSide }); M.awning.userData.k = 1 / 1.2; M.awning.userData.noSwap = true
  M.glassA = std({ map: T.glass, color: 0xffe3aa, emissive: 0xff9a35, emissiveMap: T.glass, emissiveIntensity: 0.7, roughness: 0.15 })
  M.glassB = M.glassA.clone(); M.glassB.color.set(0xffd18c); M.glassB.emissiveIntensity = 0.55
  M.glassC = M.glassA.clone(); M.glassC.color.set(0xfff0c8); M.glassC.emissiveIntensity = 0.9
  M.glassList = [M.glassA, M.glassB, M.glassC]
  M.curtain = std({ color: 0xf6e8d0, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  M.leaf = std({ color: 0x3f8a3c, roughness: 0.9, flatShading: true }); M.leaf2 = std({ color: 0x5aa04a, roughness: 0.9, flatShading: true }); M.leaf3 = std({ color: 0x2f6e35, roughness: 0.9, flatShading: true })
  M.petals = [0xff6d8f, 0xffd14a, 0xfff2e0, 0xc89bff, 0xff9a4d].map((c) => std({ color: c, roughness: 0.8 }))
  M.shutters = [0x2f6b52, 0x2c5f8a, 0x8f3a2e, 0x4b7a3b].map((c) => std({ color: c, roughness: 0.8 }))
  M.lantern = std({ color: 0xffd78a, emissive: 0xffa43a, emissiveIntensity: 1.6, roughness: 0.3 })
  M.clay = std({ color: 0xb4592f, roughness: 0.85 })
  M.hay = std({ color: 0xd9bb62, roughness: 1, flatShading: true })
  M.cloth = std({ color: 0xc43b2d, roughness: 0.9 })
  M.smoke = new THREE.MeshBasicMaterial({ color: 0xf3efe6, transparent: true, opacity: 0.5, depthWrite: false })
  M.shade = new THREE.MeshBasicMaterial({ map: T.shade, transparent: true, depthWrite: false })
  M.blob = new THREE.MeshBasicMaterial({ map: T.blob, transparent: true, depthWrite: false })
  M.signBoard = std({ color: 0xe8c987, roughness: 0.8 })
  M.metalRoof = std({ color: 0x59606a, roughness: 0.5, metalness: 0.5 })
  return M
}

/* ───────── part builder: collect geometry, merge per material ───────── */
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1)
function prep(g, k) {
  if (g.index) g = g.toNonIndexed()
  for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n)
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
  return g
}
function boxUV(g, w, h, d, k, swap) {
  const uv = g.attributes.uv, n = uv.count // faces: px nx py ny pz nz, 4 verts each (indexed geometry)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const idx = f * 4 + i; let u = uv.getX(idx) * dims[f][0] * k, v = uv.getY(idx) * dims[f][1] * k; if (swap) [u, v] = [v, u]; uv.setXY(idx, u, v) }
}
export class Part {
  constructor(M) { this.M = M; this.by = new Map() }
  _add(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    geo = prep(geo); _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz); _m.compose(_p, _q, _s); geo.applyMatrix4(_m)
    if (!this.by.has(mat)) this.by.set(mat, []); this.by.get(mat).push(geo); return this
  }
  box(mat, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) {
    const g = new THREE.BoxGeometry(w, h, d); const k = mat.userData.k || 1
    if (mat.map) boxUV(g, w, h, d, k, ((w > h && w >= d) || (d > h && d > w)) && !mat.userData.noSwap)
    return this._add(g, mat, x, y, z, rx, ry, rz)
  }
  cyl(mat, rt, rb, h, x, y, z, seg = 10, rx = 0, ry = 0, rz = 0) { return this._add(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, rx, ry, rz) }
  sph(mat, r, x, y, z, sx = 1, sy = 1, sz = 1, seg = 6) { return this._add(new THREE.IcosahedronGeometry(r, seg > 6 ? 2 : 1), mat, x, y, z, 0, 0, 0, sx, sy, sz) }
  geo(mat, g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, metric = true) {
    if (metric && mat.userData.k) { g = g.clone(); const k = mat.userData.k, uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k) }
    return this._add(g, mat, x, y, z, rx, ry, rz)
  }
  build(opts = {}) {
    const grp = new THREE.Group()
    for (const [mat, geos] of this.by) {
      const merged = mergeGeometries(geos, false); if (!merged) continue
      const m = new THREE.Mesh(merged, mat); m.castShadow = opts.cast !== false; m.receiveShadow = opts.receive !== false
      if (opts.fine) m.userData.fine = true
      grp.add(m)
    }
    for (const geos of this.by.values()) geos.forEach((g) => g.dispose())
    this.by.clear(); return grp
  }
}
