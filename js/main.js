import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { makeTextures, makeMaterials, rngOf, Part } from './core.js'
import { Building, STYLES, SWATCH, randomLook, makeName, styleFootprint } from './buildings.js'
import { PLANTS, makePlant } from './plants.js'
import { spawnWorkers, updateWorker, Crowd } from './people.js'
import { FEATURES, makeFeature, featureFootprint } from './features.js'
import { icon } from './icons.js'
import { makeButterfly, BUTTERFLY_KINDS } from './butterflies.js'

const PI = Math.PI
const $ = (s) => document.querySelector(s)

/* ───────── renderer / scene ───────── */
const canvas = $('#c')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 200); camera.position.set(14, 12.5, 16)
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.6, 0); controls.enableDamping = true; controls.dampingFactor = 0.07; controls.minDistance = 3; controls.maxDistance = 48
controls.maxPolarAngle = PI * 0.485; controls.minPolarAngle = 0.15; controls.zoomSpeed = 0.8; controls.autoRotateSpeed = 0.35; controls.screenSpacePanning = false

const T = makeTextures(), M = makeMaterials(T)
// ease + animator
const EASE = { linear: (t) => t, outCubic: (t) => 1 - Math.pow(1 - t, 3), outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }, outBounce: (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375 } }
class Anim {
  constructor() { this.time = 0; this.items = [] }
  add(o) { o.t = -(o.delay || 0); o.started = false; this.items.push(o); return o }
  update(dt) {
    this.time += dt
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]; it.t += dt; if (it.t < 0) continue
      if (!it.started) { it.started = true; it.start?.() }
      const u = Math.min(1, it.t / Math.max(1e-4, it.dur)); it.update?.((EASE[it.ease] || EASE.outCubic)(u))
      if (u >= 1) { it.end?.(); this.items.splice(this.items.indexOf(it), 1) }
    }
  }
}
const A = new Anim()
const puffGeo = new THREE.IcosahedronGeometry(0.1, 1); puffGeo.userData.shared = true
const deps = { M, T, A, scene, puffGeo }

/* ───────── sky / light / time of day ───────── */
const hemi = new THREE.HemisphereLight(0xffffff, 0x446633, 0.7); scene.add(hemi)
const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 1; sc.far = 90
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.035; sun.shadow.radius = 3
scene.add(sun, sun.target)
const fill = new THREE.DirectionalLight(0xbfd6ff, 0.35); fill.position.set(-14, 8, -10); scene.add(fill); const camFill = new THREE.DirectionalLight(0xfff0dd, 0.3); scene.add(camFill, camFill.target)
const PRE = {
  day: { top: '#79b4ea', bot: '#e3eed2', sun: '#fff1d6', sunI: 3.0, el: 52, az: 40, hs: '#cfe6ff', hg: '#6f8f4e', hi: 1.05, exp: 1.0, glow: 0.3, fill: 0.55 },
  golden: { top: '#6f9fd6', bot: '#f8dcaa', sun: '#ffc680', sunI: 3.1, el: 27, az: 58, hs: '#ffe3c0', hg: '#5e7c46', hi: 0.95, exp: 1.05, glow: 0.65, fill: 0.5 },
  dusk: { top: '#2a3878', bot: '#f09a72', sun: '#ff9f6c', sunI: 1.3, el: 9, az: 72, hs: '#8a8fe0', hg: '#38452f', hi: 0.7, exp: 1.0, glow: 1.2, fill: 0.5 },
  night: { top: '#080d2b', bot: '#1c2e55', sun: '#9db4ff', sunI: 0.75, el: 42, az: -28, hs: '#4a5da0', hg: '#1d2e24', hi: 0.55, exp: 0.95, glow: 2.1, fill: 0.2 },
}
const ORDER = ['night', 'dusk', 'golden', 'day']
const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t)
const skyTex = { t: null }
function skyGradient(top, bot) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256)
  gr.addColorStop(0, top); gr.addColorStop(0.55, bot); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}
function applyTime(v) { // v in 0..1 across night→day
  const x = v * 3, i = Math.min(2, Math.floor(x)), f = x - i, a = PRE[ORDER[i]], b = PRE[ORDER[i + 1]], L = (p, q) => p + (q - p) * f
  const top = '#' + lerpC(a.top, b.top, f).getHexString(), bot = '#' + lerpC(a.bot, b.bot, f).getHexString()
  scene.background?.dispose?.(); scene.background = skyGradient(top, bot)
  scene.fog = new THREE.Fog(lerpC(a.bot, b.bot, f), 38, 88)
  sun.color.copy(lerpC(a.sun, b.sun, f)); sun.intensity = L(a.sunI, b.sunI)
  const el = (L(a.el, b.el) * PI) / 180, az = (L(a.az, b.az) * PI) / 180
  sun.position.set(Math.sin(az) * Math.cos(el) * 45, Math.sin(el) * 45, Math.cos(az) * Math.cos(el) * 45); sun.target.position.set(0, 0, 0)
  hemi.color.copy(lerpC(a.hs, b.hs, f)); hemi.groundColor.copy(lerpC(a.hg, b.hg, f)); hemi.intensity = L(a.hi, b.hi); fill.intensity = L(a.fill, b.fill)
  renderer.toneMappingExposure = L(a.exp, b.exp)
  const g = L(a.glow, b.glow); M.glassList.forEach((m, k) => (m.emissiveIntensity = (0.45 + k * 0.18) * (0.4 + g * 1.1)))
  M.lantern.emissiveIntensity = 0.8 + g * 1.6
  canvas.dataset.night = v < 0.3 ? '1' : '0'; document.body.dataset.night = v < 0.35 ? '1' : '0'
}

/* ───────── ground, plaza, forest, clouds ───────── */
const R = rngOf(77)
T.grass.repeat.set(26, 26)
const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ map: T.grass, roughness: 1 })); ground.rotation.x = -PI / 2; ground.receiveShadow = true; scene.add(ground)
function cobbleTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#9b8a6e'; g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 520; i++) { const x = R() * 512, y = R() * 512, w = 16 + R() * 26, h = 12 + R() * 18, l = 128 + R() * 64; g.fillStyle = `rgb(${l},${l * 0.93 | 0},${l * 0.82 | 0})`; g.beginPath(); g.ellipse(x, y, w / 2, h / 2, R() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,45,30,.45)'; g.lineWidth = 2; g.stroke() }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t
}
function radialAlpha() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#fff'); gr.addColorStop(0.72, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c) }
function treeSet() {
  const mk = (geos, mats) => geos
  // conifer foliage: 3 stacked cones, vertex-less (instance colour)
  const cg = []; for (let i = 0; i < 4; i++) { const g = new THREE.ConeGeometry(1.25 - i * 0.26, 1.35, 7, 1); g.translate(0, 1.7 + i * 0.85, 0); cg.push(g.index ? g.toNonIndexed() : g) }
  const cone = mergeGeometries(cg.map((g) => { g.deleteAttribute('uv'); return g }))
  const rg = []; for (const [x, y, z, s] of [[0, 2.3, 0, 1.1], [0.55, 1.9, 0.25, 0.75], [-0.5, 2.0, -0.25, 0.8], [0.1, 2.9, -0.2, 0.7]]) { const g = new THREE.IcosahedronGeometry(s, 1); g.translate(x, y, z); const ng = g.index ? g.toNonIndexed() : g; ng.deleteAttribute('uv'); rg.push(ng) }
  const blob = mergeGeometries(rg)
  const trunk = new THREE.CylinderGeometry(0.13, 0.2, 1.8, 6); trunk.translate(0, 0.9, 0)
  const fm = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), tm = new THREE.MeshStandardMaterial({ color: 0x5b4030, roughness: 1 })
  const N1 = 220, N2 = 140
  const cf = new THREE.InstancedMesh(cone, fm, N1), ct1 = new THREE.InstancedMesh(trunk, tm, N1), bf = new THREE.InstancedMesh(blob, fm, N2), bt = new THREE.InstancedMesh(trunk, tm, N2)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), e = new THREE.Euler(), col = new THREE.Color()
  const place = (n, I, T2, greens) => { for (let i = 0; i < n; i++) { let x, z, rad; do { const a = R() * PI * 2; rad = 19 + Math.pow(R(), 0.75) * 44; x = Math.cos(a) * rad; z = Math.sin(a) * rad } while (false); const sc = (0.45 + R() * 0.5) * (rad > 34 ? 1.5 : 1); e.set(0, R() * 6.28, 0); q.setFromEuler(e); p.set(x, 0, z); s.set(sc, sc * (0.9 + R() * 0.3), sc); m.compose(p, q, s); I.setMatrixAt(i, m); T2.setMatrixAt(i, m); col.set(greens[(R() * greens.length) | 0]).offsetHSL(0, 0, (R() - 0.5) * 0.06); I.setColorAt(i, col) }; I.castShadow = T2.castShadow = true; I.receiveShadow = true; scene.add(I, T2) }
  place(N1, cf, ct1, [0x1f5a35, 0x24663b, 0x2a7041, 0x1a4f31]); place(N2, bf, bt, [0x3f8a3c, 0x4e9a45, 0x2f7a38, 0x6aa84a, 0xb8782e])
  // bushes, rocks, flowers
  const bush = new THREE.IcosahedronGeometry(0.55, 1), bI = new THREE.InstancedMesh(bush, fm, 170)
  for (let i = 0; i < 170; i++) { const a = R() * 6.28, rad = 16 + R() * 36; p.set(Math.cos(a) * rad, 0.2, Math.sin(a) * rad); const k = 0.4 + R() * 0.6; s.set(k, k * 0.7, k); e.set(0, R() * 6, 0); q.setFromEuler(e); m.compose(p, q, s); bI.setMatrixAt(i, m); bI.setColorAt(i, col.set([0x3f8a3c, 0x2f6e35, 0x58a047][(R() * 3) | 0])) }
  bI.castShadow = true; scene.add(bI)
  const rock = new THREE.DodecahedronGeometry(0.45, 0), rI = new THREE.InstancedMesh(rock, new THREE.MeshStandardMaterial({ color: 0x8a8578, roughness: 1, flatShading: true }), 70)
  for (let i = 0; i < 70; i++) { const a = R() * 6.28, rad = 15 + R() * 36; p.set(Math.cos(a) * rad, 0.1, Math.sin(a) * rad); const k = 0.4 + R() * 0.9; s.set(k * 1.3, k * 0.7, k); e.set(R(), R() * 6, R()); q.setFromEuler(e); m.compose(p, q, s); rI.setMatrixAt(i, m) }
  rI.castShadow = true; scene.add(rI)
}
treeSet()
const clouds = []
for (let i = 0; i < 7; i++) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, transparent: true, opacity: 0.92, emissive: 0x334455, emissiveIntensity: 0.15 })
  for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 + R() * 0.9, 1), mat); s.position.set(k * 1.3 - 2.6, R() * 0.5, (R() - 0.5) * 1.2); s.scale.y = 0.65; g.add(s) }
  g.position.set((R() - 0.5) * 90, 22 + R() * 8, -20 - R() * 40); g.userData.v = 0.25 + R() * 0.35; scene.add(g); clouds.push(g)
}

/* ───────── village state ───────── */
const buildings = [], plants = [], features = []
const MAX_B = 40, MAX_P = 200, LIMIT = 16
const facingRy = (x, z) => Math.atan2(-x, -z)
const placed = new THREE.Group(); scene.add(placed)
const MIRRORABLE = ['cottage', 'manor', 'workshop']
function worldRect(fp, x, z, ry) {
  const cs = [[fp.x0, fp.z0], [fp.x1, fp.z0], [fp.x1, fp.z1], [fp.x0, fp.z1]], c = Math.cos(ry), s = Math.sin(ry); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9
  for (const [lx, lz] of cs) { const wx = x + lx * c + lz * s, wz = z - lx * s + lz * c; x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz) }
  return { x0, x1, z0, z1 }
}
function inBuilding(b, x, z, m) { // point (+margin) inside building footprint (oriented)
  const ry = b.group.rotation.y, c = Math.cos(ry), s = Math.sin(ry), dx = x - b.group.position.x, dz = z - b.group.position.z, lx = dx * c - dz * s, lz = dx * s + dz * c, f = b.fp
  return lx > f.x0 - m && lx < f.x1 + m && lz > f.z0 - m && lz < f.z1 + m
}
function inFeature(f, x, z, m) { const ry = f.g.rotation.y, c = Math.cos(ry), s = Math.sin(ry), dx = x - f.x, dz = z - f.z, lx = dx * c - dz * s, lz = dx * s + dz * c; return lx > f.fp.x0 - m && lx < f.fp.x1 + m && lz > f.fp.z0 - m && lz < f.fp.z1 + m }
function circleHitsRect(fp, x, z, ry, cx, cz, r) { // circle (cx,cz,r) vs oriented rect
  const c = Math.cos(ry), s = Math.sin(ry), dx = cx - x, dz = cz - z, lx = dx * c - dz * s, lz = dx * s + dz * c
  const qx = Math.max(fp.x0, Math.min(fp.x1, lx)), qz = Math.max(fp.z0, Math.min(fp.z1, lz)); return Math.hypot(lx - qx, lz - qz) < r
}
function canPlace(fp, x, z, ry, ignore) {
  const r = worldRect(fp, x, z, ry); const rad = Math.max(Math.hypot(r.x0, r.z0), Math.hypot(r.x1, r.z1), Math.hypot(r.x0, r.z1), Math.hypot(r.x1, r.z0)); if (rad > LIMIT + 1.5) return false
  for (const b of buildings) { if (b === ignore) continue; const o = worldRect(b.fp, b.group.position.x, b.group.position.z, b.group.rotation.y); if (r.x0 < o.x1 + 0.5 && r.x1 > o.x0 - 0.5 && r.z0 < o.z1 + 0.5 && r.z1 > o.z0 - 0.5) return false }
  for (const f of features) { if (f === ignore) continue; const o = worldRect(f.fp, f.x, f.z, f.g.rotation.y); if (r.x0 < o.x1 + 0.4 && r.x1 > o.x0 - 0.4 && r.z0 < o.z1 + 0.4 && r.z1 > o.z0 - 0.4) return false }
  for (const p of plants) if (circleHitsRect(fp, x, z, ry, p.x, p.z, p.r * 0.7 + 0.05)) return false
  return true
}
function canPlant(x, z, r, ignore) {
  if (Math.hypot(x, z) > LIMIT + 3) return false
  for (const b of buildings) if (inBuilding(b, x, z, r * 0.8 + 0.1)) return false
  for (const f of features) if (inFeature(f, x, z, r * 0.6 + 0.05)) return false
  for (const p of plants) if (p !== ignore && Math.hypot(p.x - x, p.z - z) < (p.r + r) * 0.55) return false
  return true
}
const butterflies = []
for (let i = 0; i < 6; i++) { const B = makeButterfly(BUTTERFLY_KINDS[i % BUTTERFLY_KINDS.length], Math.random, { cx: 0, cz: 0, rx: 11, rz: 9, y0: 0.6, y1: 2.0 }); scene.add(B.g); butterflies.push(B) }
const crowd = new Crowd(scene, (x, z) => { if (Math.hypot(x, z) > LIMIT + 3) return true; for (const b of buildings) if (inBuilding(b, x, z, 0.5)) return true; for (const f of features) if (inFeature(f, x, z, 0.3)) return true; for (const p of plants) if (Math.hypot(p.x - x, p.z - z) < p.r * 0.7) return true; return false }, LIMIT)

/* labels */
const labels = $('#labels')
function labelFor(b) { const d = document.createElement('div'); d.className = 'nm'; d.textContent = b.name; labels.appendChild(d); b.label = d }
let showNames = false

function addBuilding(type, x, z, ry, { animate = true, delay = 0, floors, look, name, mirror = 1 } = {}) {
  const b = new Building(type, deps, { look, name, mirror }); b.group.position.set(x, 0, z); b.group.rotation.y = ry; placed.add(b.group)
  const n = floors ?? STYLES[type].start; const tEnd = b.buildAll(n, animate, delay)
  const fpl = b.fpL, proxy = new THREE.Mesh(new THREE.BoxGeometry(fpl.w, 1, fpl.d), new THREE.MeshBasicMaterial({ visible: false })); proxy.position.set(fpl.cx, 0, fpl.cz); proxy.userData.building = b; b.group.add(proxy); b.proxy = proxy
  buildings.push(b); labelFor(b); fitProxy(b); updateCount()
  A.add({ delay: tEnd + 0.1, dur: 0.01, end: () => { if (!buildings.includes(b)) return; b.workers = spawnWorkers(b, Math.random); b.workers.forEach((w, i) => { b.group.add(w.p); const p = w.p; p.visible = false; A.add({ delay: i * 0.25, dur: 0.4, ease: 'outBack', start: () => { p.visible = true }, update: (u) => p.scale.setScalar(Math.max(0.001, u)) }) }) } })
  return b
}
function fitProxy(b) { const h = 0.32 + b.floorsN * b.blocks[0].H + 2.2; b.proxy.scale.y = h; b.proxy.position.y = h / 2 }
function removeBuilding(b) {
  if (selected?.obj === b) select(null)
  const i = buildings.indexOf(b); if (i < 0) return; buildings.splice(i, 1); b.label?.remove()
  const g = b.group; A.add({ dur: 0.45, ease: 'outCubic', update: (u) => g.scale.set(Math.max(0.001, 1 - u) * b.mirror, Math.max(0.001, 1 - u), Math.max(0.001, 1 - u)), end: () => { placed.remove(g); g.traverse((o) => { if (o.isInstancedMesh) o.dispose(); else if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose() }) } })
  b.smokes.forEach((m) => { scene.remove(m); m.material.dispose() }); b.smokes = []
  updateCount()
}
function rebuild(b) { const { x, z } = b.group.position, ry = b.group.rotation.y, o = { type: b.type, floors: b.floorsN, look: { ...b.look }, name: b.name, mirror: b.mirror }; removeBuilding(b); setTimeout(() => { const nb = addBuilding(o.type, x, z, ry, o); select(nb) }, 480) }
function addPlant(key, x, z, scale = null, animate = true) {
  const g = makePlant(key, (Math.random() * 1e6) | 0); if (scale) { g.scale.setScalar(scale); g.userData.plant.r *= scale / g.userData.plant.scale; g.userData.plant.scale = scale }
  const rec = { g, kind: key, x, z, r: g.userData.plant.r, ph: Math.random() * 6 }
  g.position.set(x, 0, z); g.rotation.y = Math.random() * 6.28; scene.add(g)
  const proxy = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), new THREE.MeshBasicMaterial({ visible: false })); proxy.userData.plantObj = rec; scene.add(proxy); rec.proxy = proxy; fitPlant(rec)
  if (animate) { const s1 = g.scale.x; A.add({ dur: 0.5, ease: 'outBack', update: (u) => g.scale.setScalar(Math.max(0.001, u) * s1) }) }
  plants.push(rec); updateCount(); return rec
}
function fitPlant(p) { p.r = PLANTS[p.kind].r * p.g.scale.x / (p.g.userData.plant.scale / (p.g.userData.plant.scale)); p.r = PLANTS[p.kind].r * (p.g.userData.plant.scale); p.proxy.position.set(p.x, 0.9, p.z); p.proxy.scale.set(p.r * 1.1, 1.8, p.r * 1.1) }
function removePlant(p) { if (selected?.obj === p) select(null); const i = plants.indexOf(p); if (i < 0) return; plants.splice(i, 1); const g = p.g, s0 = g.scale.x; A.add({ dur: 0.3, ease: 'outCubic', update: (u) => g.scale.setScalar(Math.max(0.001, (1 - u) * s0)), end: () => { scene.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose() }) } }); scene.remove(p.proxy); updateCount() }

function addFeature(kind, x, z, ry, { animate = true, seed } = {}) {
  seed = seed ?? ((Math.random() * 1e6) | 0)
  const F = makeFeature(kind, seed), g = F.g; g.position.set(x, 0, z); g.rotation.y = ry; placed.add(g)
  const fp = featureFootprint(kind), proxy = new THREE.Mesh(new THREE.BoxGeometry(fp.w, 1, fp.d), new THREE.MeshBasicMaterial({ visible: false })); const h = FEATURES[kind].h ?? (kind === 'well' ? 2.1 : kind === 'farm' ? 1.2 : 0.5); proxy.scale.y = h; proxy.position.y = h / 2; g.add(proxy)
  const rec = { isFeature: true, g, kind, x, z, fp, seed, proxy, upd: F.update }; proxy.userData.feature = rec; features.push(rec)
  if (animate) A.add({ dur: 0.6, ease: 'outBack', update: (u) => g.scale.setScalar(Math.max(0.001, u)) })
  updateCount(); return rec
}
function removeFeature(f) {
  if (selected?.obj === f) select(null); const i = features.indexOf(f); if (i < 0) return; features.splice(i, 1); const g = f.g
  A.add({ dur: 0.4, ease: 'outCubic', update: (u) => g.scale.setScalar(Math.max(0.001, 1 - u)), end: () => { placed.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose() }) } }); updateCount()
}
function reshuffleFeature(f) { const x = f.x, z = f.z, ry = f.g.rotation.y, k = f.kind; removeFeature(f); setTimeout(() => select(addFeature(k, x, z, ry)), 320) }

/* ───────── ghost + selection visuals ───────── */
const ghostMat = new THREE.MeshBasicMaterial({ color: 0x66e08a, transparent: true, opacity: 0.32, depthWrite: false })
const ghost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), ghostMat); ghost.visible = false; scene.add(ghost)
const ghostEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); ghost.add(ghostEdge)
const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
const ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 4, 1, PI / 4), ringMat); ring.rotation.x = -PI / 2; ring.visible = false; scene.add(ring)
const ringFill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.12, depthWrite: false })); ringFill.rotation.x = -PI / 2; ringFill.visible = false; scene.add(ringFill)
const pring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 40), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })); pring.rotation.x = -PI / 2; pring.visible = false; scene.add(pring)
let hintDone = false, placing = null, placeRot = 0, selected = null, hoverKey = '', gx = 0, gz = 0, gOK = false, mirrorNext = 1

/* ───────── UI: palette tabs, panels ───────── */
const palette = $('#palette'); let tab = 'houses'
function buildPalette() {
  palette.innerHTML = ''; palette.className = tab
  if (tab === 'houses') for (const [k, s] of Object.entries(STYLES)) { const b = document.createElement('button'); b.className = 'card'; b.dataset.k = k; b.innerHTML = `${icon(k)}<span class="tx"><b>${s.name}</b><i>${s.blurb}</i></span>`; b.onclick = () => setPlacing(placing?.key === k ? null : { kind: 'building', key: k }); palette.appendChild(b) }
  if (tab === 'houses') { const hd = document.createElement('div'); hd.className = 'sep'; hd.textContent = 'Village centre'; palette.appendChild(hd); for (const [k, s] of Object.entries(FEATURES)) if (s.group) { const b = document.createElement('button'); b.className = 'card'; b.dataset.k = k; b.innerHTML = `${icon(k)}<span class="tx"><b>${s.name}</b><i>${s.blurb}</i></span>`; b.onclick = () => setPlacing(placing?.key === k ? null : { kind: 'feature', key: k }); palette.appendChild(b) } }
  else if (tab === 'places') for (const [k, s] of Object.entries(FEATURES).filter(([, v]) => !v.group)) { const b = document.createElement('button'); b.className = 'card'; b.dataset.k = k; b.innerHTML = `${icon(k)}<span class="tx"><b>${s.name}</b><i>${s.blurb}</i></span>`; b.onclick = () => setPlacing(placing?.key === k ? null : { kind: 'feature', key: k }); palette.appendChild(b) }
  else for (const [k, s] of Object.entries(PLANTS)) { const b = document.createElement('button'); b.className = 'card plant'; b.dataset.k = k; b.innerHTML = `${icon(k)}<span class="tx"><b>${s.name}</b></span>`; b.onclick = () => setPlacing(placing?.key === k ? null : { kind: 'plant', key: k }); palette.appendChild(b) }
  markCards()
}
function markCards() { document.querySelectorAll('#palette .card').forEach((c) => c.classList.toggle('on', !!placing && c.dataset.k === placing.key)) }
document.querySelectorAll('.tabs button').forEach((t) => (t.onclick = () => { tab = t.dataset.t; document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === t)); buildPalette() }))
buildPalette()
function setPlacing(p) {
  placing = p; markCards(); ghost.visible = false
  if (p) { select(null); placeRot = 0; mirrorNext = 1; ghost.userData.fp = p.kind === 'building' ? styleFootprint(p.key) : p.kind === 'feature' ? featureFootprint(p.key) : null; $('#tip').textContent = p.kind === 'feature' ? `Click the grass to place the ${FEATURES[p.key].name.toLowerCase()} · R rotates · Esc cancels` : p.kind === 'building' ? `Click the grass to build the ${STYLES[p.key].name.toLowerCase()} · R rotates · Esc cancels` : `Click the grass to plant ${PLANTS[p.key].name.toLowerCase()} (keep clicking for more) · Esc to stop`; if (matchMedia('(pointer:coarse)').matches) $('#tip').textContent = $('#tip').textContent.replace('Click', 'Tap').replace(/ · R rotates · Esc cancels/, '').replace(/ \(keep clicking for more\) · Esc to stop/, ''); $('#tip').classList.add('show'); canvas.style.cursor = 'crosshair' }
  else { $('#tip').classList.remove('show'); canvas.style.cursor = '' }
}
const panel = $('#sel'), ppanel = $('#psel'), fpanel = $('#fsel')
function select(o) {
  document.body.classList.toggle('sheet', !!o); const was = selected; selected = null; ring.visible = ringFill.visible = pring.visible = false; panel.classList.remove('show'); ppanel.classList.remove('show'); fpanel.classList.remove('show')
  document.querySelectorAll('.nm').forEach((n) => n.classList.remove('on'))
  document.body.classList.toggle('selecting', !!o)
  if (!o) return
  if (o.group) { selected = { kind: 'building', obj: o }; ring.visible = ringFill.visible = true; panel.classList.add('show'); o.label?.classList.add('on'); fillPanel(o) }
  else if (o.isFeature) { selected = { kind: 'feature', obj: o }; ring.visible = ringFill.visible = true; fpanel.classList.add('show'); $('#fn').textContent = FEATURES[o.kind].name }
  else { selected = { kind: 'plant', obj: o }; pring.visible = true; ppanel.classList.add('show'); $('#pn').textContent = PLANTS[o.kind].name }
}
/* colour rows */
const ROWS = [['wall', 'Walls'], ['timber', 'Timber'], ['roof', 'Roof'], ['shutter', 'Shutters'], ['door', 'Door']]
const looks = $('#looks')
for (const [k, label] of ROWS) { const d = document.createElement('div'); d.className = 'lk'; d.dataset.k = k; d.innerHTML = `<label>${label}</label><div class="sw"></div><input type="color" aria-label="${label} colour">`; looks.appendChild(d) }
function fillPanel(b) {
  $('#nm').value = b.name; $('#ty').textContent = STYLES[b.type].name; updatePanel()
  for (const d of looks.children) {
    const k = d.dataset.k, sw = d.querySelector('.sw'), pal = k === 'wall' && b.type === 'tower' ? SWATCH.stone : SWATCH[k]; sw.innerHTML = ''
    for (const c of pal) { const s = document.createElement('button'); s.style.background = c; s.title = c; s.onclick = () => { b.applyLook({ [k]: c }); fillPanel(b) }; if (c.toLowerCase() === (b.look[k] || '').toLowerCase()) s.className = 'on'; sw.appendChild(s) }
    const inp = d.querySelector('input'); inp.value = b.look[k]; inp.oninput = () => { b.applyLook({ [k]: inp.value }); sw.querySelectorAll('button').forEach((x) => x.classList.remove('on')) }
  }
}
function updatePanel() { if (selected?.kind !== 'building') return; const b = selected.obj, S = b.S; $('#fl').textContent = `${b.floorsN} ${b.floorsN === 1 ? 'storey' : 'storeys'}`; $('#add').disabled = b.floorsN >= S.max; $('#sub').disabled = b.floorsN <= 1; $('#fmax').textContent = `max ${S.max}` }
function updateCount() { if (buildings.length + plants.length + features.length > 0) $('#empty').classList.add('hide'); $('#count').textContent = `${buildings.length} building${buildings.length === 1 ? '' : 's'} · ${plants.length} plant${plants.length === 1 ? '' : 's'} · ${features.length} extra${features.length === 1 ? '' : 's'}`; crowd.setCount(buildings.length ? Math.min(12, buildings.length * 2) : 0) }
$('#nm').oninput = (e) => { const b = selected?.obj; if (b && selected.kind === 'building') { b.name = e.target.value; b.label.textContent = b.name } }
$('#nm').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur() })
$('#add').onclick = () => { const b = selected?.obj; if (!b) return; if (b.addStorey()) { fitProxy(b); updatePanel(); toast('Adding a storey…') } else toast(b.floorsN >= b.S.max ? 'This building is already at its full height.' : 'Still building, one moment.') }
$('#sub').onclick = () => { const b = selected?.obj; if (b?.removeStorey()) { fitProxy(b); updatePanel() } }
$('#rot').onclick = () => rotateSel(1)
$('#del').onclick = () => selected && (selected.kind === 'building' ? removeBuilding(selected.obj) : selected.kind === 'feature' ? removeFeature(selected.obj) : removePlant(selected.obj))
$('#reb').onclick = () => selected?.kind === 'building' && rebuild(selected.obj)
$('#foc').onclick = () => selected?.kind === 'building' && focus(selected.obj)
$('#shuf').onclick = () => { const b = selected?.obj; if (b) { b.applyLook(randomLook(b.type, Math.random)); fillPanel(b) } }
$('#close').onclick = () => select(null)
$('#pdel').onclick = () => selected?.kind === 'plant' && removePlant(selected.obj)
$('#pbig').onclick = () => resizePlant(1.18); $('#psmall').onclick = () => resizePlant(0.85)
$('#pclose').onclick = () => select(null)
$('#fclose').onclick = () => select(null); $('#fdel').onclick = () => selected?.kind === 'feature' && removeFeature(selected.obj); $('#frot').onclick = () => rotateSel(1); $('#fshuf').onclick = () => selected?.kind === 'feature' && reshuffleFeature(selected.obj)
function resizePlant(f) { const p = selected?.obj; if (!p || selected.kind !== 'plant') return; const s = Math.max(0.5, Math.min(2.6, p.g.scale.x * f)); p.g.userData.plant.scale = s; const s0 = p.g.scale.x; A.add({ dur: 0.3, ease: 'outBack', update: (u) => p.g.scale.setScalar(s0 + (s - s0) * u), end: () => fitPlant(p) }) }
function rotateSel(d) {
  if (selected?.kind === 'feature') { const f = selected.obj, ny = f.g.rotation.y + d * PI / 2; if (!canPlace(f.fp, f.x, f.z, ny, f)) return toast('No room to rotate here.'); const y0 = f.g.rotation.y; A.add({ dur: 0.4, ease: 'outBack', update: (u) => { f.g.rotation.y = y0 + (ny - y0) * u } }); return }
  if (selected?.kind !== 'building') return; const b = selected.obj, ny = b.group.rotation.y + d * PI / 2; if (!canPlace(b.fp, b.group.position.x, b.group.position.z, ny, b)) return toast('No room to rotate here.'); const y0 = b.group.rotation.y; A.add({ dur: 0.4, ease: 'outBack', update: (u) => { b.group.rotation.y = y0 + (ny - y0) * u } })
}
let toastT; function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1800) }
function focus(b) {
  const tgt = new THREE.Vector3(b.group.position.x, 0.32 + b.floorsN * b.blocks[0].H * 0.55 + 0.3, b.group.position.z), dir = camera.position.clone().sub(controls.target).normalize()
  const dist = 7.5 + b.floorsN * 1.3, p0 = camera.position.clone(), t0 = controls.target.clone(), p1 = tgt.clone().addScaledVector(dir, dist)
  A.add({ dur: 1.0, ease: 'outCubic', update: (u) => { camera.position.lerpVectors(p0, p1, u); controls.target.lerpVectors(t0, tgt, u) } })
}
$('#time').oninput = (e) => { applyTime(+e.target.value / 100); document.querySelectorAll('.pre button').forEach((b) => b.classList.remove('on')) }
document.querySelectorAll('.pre button').forEach((b) => (b.onclick = () => { const v = { night: 0, dusk: 1 / 3, golden: 2 / 3, day: 1 }[b.dataset.p]; $('#time').value = v * 100; applyTime(v); document.querySelectorAll('.pre button').forEach((x) => x.classList.toggle('on', x === b)) }))
$('#reset').onclick = () => { [...buildings].forEach(removeBuilding);[...plants].forEach(removePlant);[...features].forEach(removeFeature) }
$('#names').onclick = (e) => { showNames = !showNames; e.currentTarget.classList.toggle('on', showNames) }
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return
  if (e.key === 'Escape') { if (placing) setPlacing(null); else select(null) }
  if (e.key === 'r' || e.key === 'R') { if (placing) placeRot++; else rotateSel(1) }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selected) $('#del').click()
  if ((e.key === '+' || e.key === '=') && selected?.kind === 'building') $('#add').click()
  if ((e.key === '-' || e.key === '_') && selected?.kind === 'building') $('#sub').click()
})

/* ───────── pointer: place · select · drag · roof click ───────── */
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3()
let down = null, drag = null, needHover = false
function setMouse(e) { const r = canvas.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, camera) }
function pickAny() { // nearest building / plant proxy
  const hits = ray.intersectObjects([...buildings.map((b) => b.proxy), ...plants.map((p) => p.proxy), ...features.map((f) => f.proxy)], false)
  for (const h of hits) { if (h.object.userData.building) return { kind: 'building', obj: h.object.userData.building, d: h.distance }; if (h.object.userData.feature) return { kind: 'feature', obj: h.object.userData.feature, d: h.distance }; if (h.object.userData.plantObj) return { kind: 'plant', obj: h.object.userData.plantObj, d: h.distance } }
  return null
}
function pickRoof() { // roof meshes only for the few buildings whose proxy box is under the cursor
  const hits = ray.intersectObjects(buildings.map((b) => b.proxy), false).slice(0, 3); let best = null
  for (const h of hits) { const b = h.object.userData.building; for (const bl of b.blocks) { if (!bl.roof || !bl.roof.group.visible) continue; const r = ray.intersectObject(bl.roof.group, true)[0]; if (r && (!best || r.distance < best.d)) best = { b, d: r.distance } } }
  return best
}
function groundAt() { return ray.ray.intersectPlane(plane, hit) ? hit : null }
function updateGhost() {
  if (!placing) { ghost.visible = false; return }
  if (!groundAt()) { ghost.visible = false; return }
  if (placing.kind === 'plant') {
    const r = PLANTS[placing.key].r, sx = Math.round(hit.x * 4) / 4, sz = Math.round(hit.z * 4) / 4; gx = sx; gz = sz; gOK = canPlant(sx, sz, r)
    ghost.visible = true; ghost.rotation.y = 0; ghost.position.set(sx, 0.4, sz); ghost.scale.set(r * 2, 0.8, r * 2); ghostMat.color.set(gOK ? 0x66e08a : 0xff6b5e); ghostEdge.material.color.set(gOK ? 0xdfffe8 : 0xffd0cb); return
  }
  const sx = Math.round(hit.x * 2) / 2, sz = Math.round(hit.z * 2) / 2; gx = sx; gz = sz
  const fp = ghost.userData.fp, base = Math.round(facingRy(sx, sz) / (PI / 2)) * (PI / 2), ry = (placing.kind === 'feature' ? 0 : base) + placeRot * PI / 2; ghost.userData.ry = ry; gOK = canPlace(fp, sx, sz, ry)
  ghost.visible = true; ghost.position.set(sx, 0.9, sz); ghost.rotation.y = ry
  const c = Math.cos(ry), s = Math.sin(ry), ox = fp.cx * c + fp.cz * s, oz = -fp.cx * s + fp.cz * c; ghost.position.x += ox; ghost.position.z += oz
  ghost.scale.set(fp.w, 1.8, fp.d); ghostMat.color.set(gOK ? 0x66e08a : 0xff6b5e); ghostEdge.material.color.set(gOK ? 0xdfffe8 : 0xffd0cb)
}
canvas.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary) { if (drag) { drag = null; controls.enabled = true } return }
  if (e.button !== 0) return; setMouse(e); down = { x: e.clientX, y: e.clientY }
  if (placing) return
  const h = pickAny(); if (!h) return
  groundAt(); const ox = (h.kind === 'building' ? h.obj.group.position.x : h.obj.x) - hit.x, oz = (h.kind === 'building' ? h.obj.group.position.z : h.obj.z) - hit.z
  drag = { ...h, ox, oz, moved: false, orig: h.kind === 'building' ? { x: h.obj.group.position.x, z: h.obj.group.position.z } : { x: h.obj.x, z: h.obj.z }, ok: true }
  controls.enabled = false
}, true)
addEventListener('pointermove', (e) => {
  if (e.target !== canvas && !drag) return
  setMouse(e)
  if (drag) {
    if (!drag.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) return
    if (!drag.moved) { drag.moved = true; select(drag.kind === 'building' ? drag.obj : drag.obj); canvas.style.cursor = 'grabbing' }
    if (!groundAt()) return
    if (drag.kind === 'building') {
      const b = drag.obj, nx = Math.round((hit.x + drag.ox) * 2) / 2, nz = Math.round((hit.z + drag.oz) * 2) / 2; b.group.position.x = nx; b.group.position.z = nz
      drag.ok = canPlace(b.fp, nx, nz, b.group.rotation.y, b); ringMat.color.set(drag.ok ? 0xffd36a : 0xff5a4a)
    } else if (drag.kind === 'feature') {
      const f = drag.obj, nx = Math.round((hit.x + drag.ox) * 2) / 2, nz = Math.round((hit.z + drag.oz) * 2) / 2; f.x = nx; f.z = nz; f.g.position.x = nx; f.g.position.z = nz
      drag.ok = canPlace(f.fp, nx, nz, f.g.rotation.y, f); ringMat.color.set(drag.ok ? 0xffd36a : 0xff5a4a)
    } else {
      const p = drag.obj, nx = Math.round((hit.x + drag.ox) * 4) / 4, nz = Math.round((hit.z + drag.oz) * 4) / 4; p.x = nx; p.z = nz; p.g.position.x = nx; p.g.position.z = nz; p.proxy.position.set(nx, 0.9, nz)
      drag.ok = canPlant(nx, nz, p.r, p); pring.material.color.set(drag.ok ? 0xffd36a : 0xff5a4a)
    }
    return
  }
  if (placing) updateGhost(); else needHover = true
})
addEventListener('pointerup', (e) => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null
  if (drag) {
    const d = drag; drag = null; controls.enabled = true; canvas.style.cursor = ''; ringMat.color.set(0xffd36a); pring.material.color.set(0xffd36a)
    if (d.moved) {
      if (!d.ok) { // snap back
        toast('Not enough room there, so it moved back.')
        if (d.kind === 'building') { const b = d.obj, p0 = { x: b.group.position.x, z: b.group.position.z }; A.add({ dur: 0.35, ease: 'outBack', update: (u) => { b.group.position.x = p0.x + (d.orig.x - p0.x) * u; b.group.position.z = p0.z + (d.orig.z - p0.z) * u } }) }
        else if (d.kind === 'feature') { const f = d.obj, p0 = { x: f.x, z: f.z }; A.add({ dur: 0.35, ease: 'outBack', update: (u) => { f.x = p0.x + (d.orig.x - p0.x) * u; f.z = p0.z + (d.orig.z - p0.z) * u; f.g.position.x = f.x; f.g.position.z = f.z } }) }
        else { const p = d.obj, p0 = { x: p.x, z: p.z }; A.add({ dur: 0.35, ease: 'outBack', update: (u) => { p.x = p0.x + (d.orig.x - p0.x) * u; p.z = p0.z + (d.orig.z - p0.z) * u; p.g.position.set(p.x, 0, p.z); p.proxy.position.set(p.x, 0.9, p.z) } }) }
      }
      return
    }
    // plain click on an object
    if (d.kind === 'plant' || d.kind === 'feature') { select(d.obj); return }
    setMouse(e); const rf = pickRoof()
    if (rf) { select(rf.b); if (rf.b.floorsN >= rf.b.S.max) toast('This building is already at its full height.'); else if (rf.b.addStorey()) { fitProxy(rf.b); updatePanel() } else toast('Still building, one moment.'); return }
    select(d.obj); return
  }
  if (moved > 6 || e.target !== canvas) return
  setMouse(e)
  if (placing) {
    updateGhost(); if (!ghost.visible) return
    if (placing.kind === 'plant') { if (plants.length >= MAX_P) return toast('That is plenty of plants!'); if (!gOK) return toast('Something is in the way.'); addPlant(placing.key, gx, gz); return }
    if (placing.kind === 'feature') { if (features.length >= 24) return toast('That is plenty of extras!'); updateGhost(); if (!gOK) return toast('Not enough room here.'); const nf = addFeature(placing.key, gx, gz, ghost.userData.ry); setPlacing(null); select(nf); return }
    if (buildings.length >= MAX_B) return toast('The village is full. Remove a building first.')
    let mir = MIRRORABLE.includes(placing.key) && Math.random() < 0.5 ? -1 : 1, fp = styleFootprint(placing.key, mir)
    if (!canPlace(fp, gx, gz, ghost.userData.ry)) { mir = 1; fp = styleFootprint(placing.key, 1) }
    if (!canPlace(fp, gx, gz, ghost.userData.ry)) return toast('Not enough room here.')
    const b = addBuilding(placing.key, gx, gz, ghost.userData.ry, { mirror: mir }); select(b); setPlacing(null); return
  }
  select(null)
})
canvas.addEventListener('dblclick', (e) => { setMouse(e); const h = pickAny(); if (h?.kind === 'building') { select(h.obj); focus(h.obj) } })
function doHover() {
  if (!needHover || drag || placing) return; needHover = false
  const rf = pickRoof(), h = rf ? null : pickAny(), key = rf ? 'r' + rf.b.id : h ? 'o' : ''
  if (key !== hoverKey) { hoverKey = key; canvas.style.cursor = rf ? 's-resize' : h ? 'grab' : ''; $('#tip').textContent = rf ? (rf.b.floorsN >= rf.b.S.max ? 'This building is at full height' : 'Click the roof to add a storey') : ''; $('#tip').classList.toggle('show', !!rf) }
}
function sync() {
  if (!selected) return
  if (selected.kind === 'plant') { const p = selected.obj; pring.position.set(p.x, 0.04, p.z); pring.scale.setScalar(p.r * 1.25 + 0.15); return }
  const b = selected.obj, isF = selected.kind === 'feature', fp = b.fp, ry = isF ? b.g.rotation.y : b.group.rotation.y, px = isF ? b.x : b.group.position.x, pz = isF ? b.z : b.group.position.z, c = Math.cos(ry), sn = Math.sin(ry), ox = fp.cx * c + fp.cz * sn, oz = -fp.cx * sn + fp.cz * c
  for (const m of [ring, ringFill]) { m.position.set(px + ox, 0.03, pz + oz); m.rotation.set(-PI / 2, 0, ry) }
  ringFill.scale.set(fp.w + 0.9, fp.d + 0.9, 1); ring.scale.set((fp.w + 0.9) / 2, (fp.d + 0.9) / 2, 1)
}

/* ───────── loop ───────── */
const clock = new THREE.Clock(); let frame = 0
let viewShift = -170
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.9 ? 52 : 34; if (w > 760) camera.setViewOffset(w, h, viewShift, 14, w, h); else if (!document.body.classList.contains('sidehidden')) camera.setViewOffset(w, h, 0, 60, w, h); else camera.clearViewOffset(); camera.updateProjectionMatrix() }
addEventListener('resize', resize); resize()
applyTime(2 / 3); document.querySelector('.pre [data-p=golden]').classList.add('on'); controls.autoRotate = false
const tmpV = new THREE.Vector3()
function loop() {
  const dt = Math.min(0.05, clock.getDelta()); A.update(dt); controls.update(); frame++
  for (const c of clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 60) c.position.x = -60 }
  for (const b of buildings) { b.update(A.time, 0); b.workers?.forEach((w) => w.p.visible && updateWorker(w, dt)) }
  crowd.update(dt); for (const f of features) f.upd(dt)
  for (const bf of butterflies) bf.update(dt)
  for (const p of plants) p.g.rotation.z = Math.sin(A.time * 1.2 + p.ph) * p.g.userData.sway
  doHover()
  if (selected) { sync(); (selected.kind === 'plant' ? pring : ring).material.opacity = 0.6 + Math.sin(A.time * 4) * 0.3; if (selected.kind === 'building') { if (!buildings.includes(selected.obj)) select(null); else updatePanel() } }
  // name labels
  for (const b of buildings) { tmpV.set(b.group.position.x, b.topY() + 0.55, b.group.position.z).project(camera); const el = b.label, vis = tmpV.z < 1 && Math.abs(tmpV.x) < 1.1 && Math.abs(tmpV.y) < 1.1; const on = vis && (showNames || selected?.obj === b); el.style.display = on ? '' : 'none'; if (on) { const hw = el.offsetWidth / 2 + 6, px = Math.max(hw, Math.min(innerWidth - hw, (tmpV.x + 1) / 2 * innerWidth)); el.style.transform = `translate(-50%,-100%) translate(${px.toFixed(1)}px,${((1 - tmpV.y) / 2 * innerHeight).toFixed(1)}px)` } }
  camFill.position.copy(camera.position); camFill.target.position.copy(controls.target); camFill.intensity = 0.28 * (document.body.dataset.night === '1' ? 0.4 : 1)
  renderer.render(scene, camera); requestAnimationFrame(loop)
}
loop()
window.__v = { proj: (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight] }, ff: (sec) => { for (let i = 0; i < sec * 20; i++) { A.update(0.05); } }, buildings, plants, features, addFeature, camera, controls, addBuilding, addPlant, select, A, applyTime, setPlacing, crowd }

/* ───────── welcome: name the village · fading hint · info panel ───────── */

/* offscreen thumbnail renderer (used to bake the 3D menu icons) */
window.__v.thumb = (kind, cat, size = 256) => {
  const ts = new THREE.Scene(); ts.add(new THREE.HemisphereLight(0xfff4e0, 0x6a8a55, 1.0)); const dl = new THREE.DirectionalLight(0xfff0d8, 2.6); dl.position.set(5, 9, 6); ts.add(dl); const fl = new THREE.DirectionalLight(0xbcd2ff, 0.5); fl.position.set(-6, 3, -4); ts.add(fl)
  let g
  if (cat === 'house') { const b = new Building(kind, deps, { look: randomLook(kind, () => 0.5), name: 'x', mirror: 1 }); g = b.group; b.buildAll(STYLES[kind].start, false, 0) }
  else if (cat === 'plant') g = makePlant(kind, 7)
  else g = makeFeature(kind, 11).g
  ts.add(g); g.updateMatrixWorld(true)
  const bx = new THREE.Box3().setFromObject(g), c = bx.getCenter(new THREE.Vector3()), sz = bx.getSize(new THREE.Vector3())
  const r = Math.max(sz.x, sz.z, sz.y * 1.1) * 0.62
  const sh = new THREE.Mesh(new THREE.CircleGeometry(Math.max(sz.x, sz.z) * 0.62, 32), new THREE.MeshBasicMaterial({ color: 0x1d2a14, transparent: true, opacity: 0.16, depthWrite: false })); sh.rotation.x = -PI / 2; sh.position.set(c.x, 0.01, c.z); ts.add(sh)
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 300), d = r / Math.tan(13 * PI / 180)
  cam.position.set(c.x + d * 0.62, c.y + d * 0.5, c.z + d * 0.78); cam.lookAt(c.x, c.y - sz.y * 0.04, c.z)
  const ps = renderer.getPixelRatio(), sb = ts.background, oldSh = renderer.shadowMap.enabled
  renderer.setPixelRatio(1); renderer.setSize(size, size, false); renderer.shadowMap.enabled = false; renderer.setClearColor(0x000000, 0)
  renderer.render(ts, cam)
  const cv = document.createElement('canvas'); cv.width = cv.height = size; cv.getContext('2d').drawImage(renderer.domElement, 0, 0)
  renderer.setPixelRatio(ps); renderer.shadowMap.enabled = oldSh; resize?.()
  return cv.toDataURL('image/png')
}
const SUGGEST = ['Riverbend', 'Oakwood', 'Willowmere']
const vname = $('#vname'), wname = $('#wname'), welcome = $('#welcome')
const store = { get: (k) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch { } } }
const setVillageName = (n) => { n = (n || '').trim() || 'Hearth'; vname.value = n; document.title = n + ' · a tiny village'; store.set('village-name', n) }
for (const n of SUGGEST) { const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.onclick = () => { wname.value = n; document.querySelectorAll('#wsug button').forEach((x) => x.classList.toggle('on', x === b)) }; $('#wsug').appendChild(b) }
wname.value = store.get('village-name') || ''; setTimeout(() => wname.focus(), 50)
wname.oninput = () => document.querySelectorAll('#wsug button').forEach((x) => x.classList.toggle('on', x.textContent === wname.value.trim()))
let hintT
const startVillage = () => {
  setVillageName(wname.value); welcome.classList.add('gone'); setTimeout(() => welcome.remove(), 500)
  if (!buildings.length && !plants.length && !features.length) { const em = $('#empty'); em.classList.remove('hide'); hintT = setTimeout(() => em.classList.add('hide'), 8000) } hintDone = true
}
$('#wgo').onclick = startVillage; wname.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); startVillage() } })
vname.oninput = () => { document.title = (vname.value.trim() || 'Hearth') + ' · a tiny village' }
vname.onchange = () => setVillageName(vname.value); vname.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') vname.blur() })
const infoB = $('#info'), infoP = $('#infop')
const toggleInfo = (on) => { infoP.classList.toggle('show', on); infoB.setAttribute('aria-expanded', on) }
infoB.onclick = (e) => { e.stopPropagation(); toggleInfo(!infoP.classList.contains('show')) }
addEventListener('pointerdown', (e) => { if (!infoP.contains(e.target) && e.target !== infoB) toggleInfo(false) })
addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleInfo(false) })

/* ───────── collapsible build menu ───────── */
function setSide(open) { document.body.classList.toggle('sidehidden', !open); const a = viewShift, b = open ? -170 : 0; A.add({ dur: 0.45, ease: 'outCubic', update: (u) => { viewShift = a + (b - a) * u; resize() } }) }
$('#sidex').onclick = () => setSide(false); $('#sidebtn').onclick = () => setSide(true)
addEventListener('keydown', (e) => { if (e.target.tagName !== 'INPUT' && (e.key === 'b' || e.key === 'B')) setSide(document.body.classList.contains('sidehidden')) })

$('#sunbtn').onclick = (e) => { e.stopPropagation(); document.body.classList.toggle('topopen') }
addEventListener('pointerdown', (e) => { if (!e.target.closest('#top') && !e.target.closest('#sunbtn')) document.body.classList.remove('topopen') })