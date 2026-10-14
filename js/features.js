import * as THREE from 'three'
import { Part, rngOf } from './core.js'
import { makePerson, makeTool, pose } from './people.js'
import { makeButterfly } from './butterflies.js'

const PI = Math.PI
const cache = new Map()
const mat = (hex, rough = 0.9) => { const k = hex + '|' + rough; if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, flatShading: true })); return cache.get(k) }
const pick = (r, a) => a[(r() * a.length) | 0]
const WOOD = 0x6b4a35, WOOD2 = 0x8a6446, STONE = [0x9a958a, 0x8a867c, 0xaaa398, 0x7e7a72]

export const FEATURES = {
  pond: { name: 'Pond', blurb: 'Ducks, reeds and lily pads', hw: 2.1, hd: 1.6 },
  well: { name: 'Stone well', blurb: 'Roofed well with a bucket', hw: 0.8, hd: 0.8 },
  farm: { name: 'Farm field', blurb: 'Crops, scarecrow and a farmer', hw: 2.3, hd: 1.8 },
  playground: { name: 'Kids garden', blurb: 'Swings, slide, seesaw, sandbox and children playing', hw: 2.3, hd: 2.0, h: 1.7 },
  barn: { name: 'Central barn', blurb: 'Big red barn, silo, hay and a cow', hw: 1.95, hd: 2.25, group: 'town', h: 2.9 },
  market: { name: 'Market square', blurb: 'Cobbled square with merchant stalls trading goods and gold', hw: 2.7, hd: 2.7, group: 'town', h: 1.8 },
}
export function featureFootprint(kind) { const f = FEATURES[kind]; return { x0: -f.hw, x1: f.hw, z0: -f.hd, z1: f.hd, w: f.hw * 2, d: f.hd * 2, cx: 0, cz: 0 } }

const mesh = (geo, m, x = 0, y = 0, z = 0, cast = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; return o }

/* ───────── pond ───────── */
function blobPts(r, n, sx, sz, wob = 0.12) {
  const a = r() * 6, b = r() * 6, pts = []
  for (let i = 0; i < n; i++) { const t = (i / n) * PI * 2, k = 1 + wob * Math.sin(2 * t + a) + wob * 0.7 * Math.sin(3 * t + b); pts.push(new THREE.Vector2(Math.cos(t) * k * sx, Math.sin(t) * k * sz)) }
  return pts
}
function makePond(r) {
  const F = FEATURES.pond, g = new THREE.Group(), P = new Part({}), sx = F.hw * 0.86, sz = F.hd * 0.84
  const shoreG = new THREE.ExtrudeGeometry(new THREE.Shape(blobPts(rngOf(1), 36, sx * 1.1, sz * 1.1, 0.08)), { depth: 0.05, bevelEnabled: false }); shoreG.rotateX(-PI / 2)
  g.add(mesh(shoreG, mat(0x7a6648, 1), 0, 0.005, 0, false))
  const wpts = blobPts(rngOf(1), 36, sx, sz, 0.08)
  const wg = new THREE.ShapeGeometry(new THREE.Shape(wpts)); wg.rotateX(-PI / 2)
  const wm = new THREE.MeshStandardMaterial({ color: 0x3f9bd0, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.9, emissive: 0x0a2e48, emissiveIntensity: 0.4 })
  const water = mesh(wg, wm, 0, 0.068, 0, false); water.castShadow = false; g.add(water)
  // deeper centre
  const dg = new THREE.ShapeGeometry(new THREE.Shape(blobPts(rngOf(1), 28, sx * 0.62, sz * 0.62, 0.08))); dg.rotateX(-PI / 2)
  const deep = mesh(dg, new THREE.MeshStandardMaterial({ color: 0x2f7fb8, roughness: 0.1, transparent: true, opacity: 0.55 }), 0, 0.072, 0, false); g.add(deep)
  // rocks round the rim
  for (let i = 0; i < 16; i++) { const t = (i / 16) * PI * 2 + r() * 0.2, k = 1.12 + r() * 0.1, s = 0.1 + r() * 0.12; P.sph(mat(pick(r, STONE)), s, Math.cos(t) * sx * k, s * 0.45, Math.sin(t) * sz * k, 1.2, 0.7, 1, 5) }
  // reeds & cattails on the back and sides
  for (let c = 0; c < 6; c++) {
    const t = PI * (0.1 + c * 0.32) + r() * 0.3 + PI, bx = Math.cos(t) * sx * 1.02, bz = Math.sin(t) * sz * 1.02
    for (let i = 0; i < 6; i++) { const h = 0.5 + r() * 0.5, x = bx + (r() - 0.5) * 0.3, z = bz + (r() - 0.5) * 0.3, lean = (r() - 0.5) * 0.3
      P.cyl(mat(0x6a8a3a), 0.008, 0.016, h, x, h / 2, z, 4, lean, 0, lean * 0.5); if (i % 3 === 0) P.cyl(mat(0x5a3a22), 0.028, 0.028, 0.14, x, h + 0.04, z, 6, lean, 0, lean * 0.5) }
  }
  // lily pads + flowers
  const flowers = []
  for (let i = 0; i < 6; i++) { const t = r() * PI * 2, d = 0.25 + r() * 0.6, x = Math.cos(t) * sx * d, z = Math.sin(t) * sz * d; const pad = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 9), mat(0x4e9a45, 0.7), x, 0.085, z, false); pad.rotation.y = r() * 6; g.add(pad); flowers.push(pad)
    if (r() < 0.55) { const f = mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(pick(r, [0xf7a8c4, 0xffffff, 0xf6d36a])), x, 0.11, z, false); f.scale.y = 0.7; g.add(f); flowers.push(f) } }
  // wooden dock (half the ponds)
  if (r() < 0.6) {
    const dz = sz * 0.9, len = 1.2, dx = (r() - 0.5) * 0.8
    for (let i = 0; i < 7; i++) P.box(mat(WOOD2), 0.44, 0.04, 0.15, dx, 0.15, dz + 0.55 - i * (len / 6), 0)
    for (const sd of [-1, 1]) for (const k of [0, 1, 2]) P.cyl(mat(WOOD), 0.03, 0.03, 0.34, dx + sd * 0.2, 0.08, dz + 0.55 - k * 0.55, 6)
  }
  g.add(P.build())
  // ducks
  const ducks = []
  const duck = () => { const d = new THREE.Group(); const body = mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0xf6f3ea, 0.7), 0, 0.09, 0); body.scale.set(0.9, 0.7, 1.35); d.add(body); const h = mesh(new THREE.SphereGeometry(0.05, 7, 5), mat(0x2f7a48, 0.7), 0, 0.2, 0.1); d.add(h); const beak = mesh(new THREE.ConeGeometry(0.02, 0.06, 5), mat(0xf0a020), 0, 0.195, 0.16); beak.rotation.x = PI / 2; d.add(beak); const w = mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0xb89c78), 0, 0.12, -0.01); w.scale.set(0.3, 0.5, 1); d.add(w); const tail = mesh(new THREE.ConeGeometry(0.04, 0.08, 4), mat(0xf6f3ea), 0, 0.14, -0.14); tail.rotation.x = -PI / 2.6; d.add(tail); return d }
  const nd = 2 + ((r() * 2) | 0)
  for (let i = 0; i < nd; i++) { const d = duck(); g.add(d); ducks.push({ d, a: r() * 6.28, sp: (0.14 + r() * 0.12) * (r() < 0.5 ? -1 : 1), rx: 0.35 + r() * 0.25, ph: r() * 6 }) }
  // ripples & sparkles
  const rippleM = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  const ripples = []
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 24), rippleM()); m.rotation.x = -PI / 2; m.position.y = 0.08; g.add(m); ripples.push({ m, t: r() * 3, x: 0, z: 0 }) }
  const sparks = []
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -PI / 2; m.position.y = 0.083; const t = r() * 6.28, d = r() * 0.85; m.position.x = Math.cos(t) * sx * d; m.position.z = Math.sin(t) * sz * d; g.add(m); sparks.push({ m, ph: r() * 6, sp: 0.8 + r() * 1.2 }) }
  let time = 0
  const update = (dt) => {
    time += dt
    for (const k of ducks) { k.a += k.sp * dt; const x = Math.cos(k.a) * sx * k.rx * 1.6, z = Math.sin(k.a) * sz * k.rx * 1.5; const dx = -Math.sin(k.a) * k.sp, dz = Math.cos(k.a) * k.sp; k.d.position.set(x, 0.062 + Math.sin(time * 2 + k.ph) * 0.008, z); k.d.rotation.y = Math.atan2(dx * sx, dz * sz) * 1; k.d.rotation.z = Math.sin(time * 2 + k.ph) * 0.05 }
    for (const rp of ripples) { rp.t += dt * 0.45; if (rp.t > 1) { rp.t = 0; const a = Math.random() * 6.28, d = Math.random() * 0.8; rp.x = Math.cos(a) * sx * d; rp.z = Math.sin(a) * sz * d } const s = 0.05 + rp.t * 0.45; rp.m.position.x = rp.x; rp.m.position.z = rp.z; rp.m.scale.set(s, s, s); rp.m.material.opacity = (1 - rp.t) * 0.5 * Math.min(1, rp.t * 8) }
    for (const s of sparks) s.m.material.opacity = Math.max(0, Math.sin(time * s.sp + s.ph)) ** 6 * 0.9
    for (let i = 0; i < flowers.length; i++) flowers[i].position.y += Math.sin(time * 1.3 + i) * 0.00025
    wm.emissiveIntensity = 0.4 + Math.sin(time * 0.8) * 0.06
  }
  return { g, update }
}

/* ───────── well ───────── */
function makeWell(r) {
  const g = new THREE.Group(), P = new Part({})
  const rows = 3, per = 10
  for (let j = 0; j < rows; j++) for (let i = 0; i < per; i++) { const a = (i + (j % 2) * 0.5) / per * PI * 2; P.box(mat(pick(r, STONE)), 0.32, 0.19, 0.15, Math.cos(a) * 0.43, 0.1 + j * 0.19, Math.sin(a) * 0.43, -a + PI / 2) }
  P.cyl(mat(0x6a665e), 0.5, 0.52, 0.04, 0, 0.02, 0, 12)
  for (const sd of [-1, 1]) P.box(mat(WOOD), 0.09, 1.25, 0.09, sd * 0.5, 0.62 + 0.2, 0, 0)
  const rf = mat(pick(r, [0xb5502a, 0x6a4a35, 0x4a6a9a, 0x8a5a9a]))
  for (const sd of [-1, 1]) P.box(rf, 1.35, 0.045, 0.62, 0, 1.55 + 0.0, sd * 0.27, 0, sd * -0.5 + 0.0)
  P.box(mat(WOOD), 1.3, 0.05, 0.05, 0, 1.88, 0)
  for (const sd of [-1, 1]) { P.box(mat(WOOD2), 0.05, 0.38, 0.05, sd * 0.6, 1.72, 0, 0, 0, 0) }
  g.add(P.build())
  const dark = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.5, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x15212e, side: THREE.BackSide })); dark.position.y = 0.3; g.add(dark)
  const wat = new THREE.Mesh(new THREE.CircleGeometry(0.32, 12), new THREE.MeshStandardMaterial({ color: 0x3f9bd0, roughness: 0.1, metalness: 0.2 })); wat.rotation.x = -PI / 2; wat.position.y = 0.38; g.add(wat)
  const beam = new THREE.Group(); beam.position.y = 0.98; g.add(beam)
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8), mat(WOOD2)); cyl.rotation.z = PI / 2; cyl.castShadow = true; beam.add(cyl)
  const crank = mesh(new THREE.BoxGeometry(0.04, 0.26, 0.04), mat(WOOD), 0.5, 0, 0); beam.add(crank); const knob = mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), mat(WOOD), 0.58, 0.13, 0); beam.add(knob)
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 4), mat(0xc9b27a)); rope.position.set(0, 0.7, 0); g.add(rope)
  const bucket = new THREE.Group(); bucket.add(mesh(new THREE.CylinderGeometry(0.095, 0.075, 0.14, 10), mat(WOOD2), 0, 0, 0)); const band = mesh(new THREE.TorusGeometry(0.087, 0.008, 4, 10), mat(0x3a3a40), 0, 0.02, 0); band.rotation.x = PI / 2; bucket.add(band); g.add(bucket)
  let t = 0
  const update = (dt) => { t += dt; const ph = (Math.sin(t * 0.45) + 1) / 2, y = 0.42 + ph * 0.5; bucket.position.set(0, y, 0); bucket.rotation.z = Math.sin(t * 2) * 0.05 * (1 - ph) ; const top = 0.98 - 0.07; rope.scale.y = top - (y + 0.08); rope.position.y = (top + y + 0.08) / 2; beam.rotation.x = -(0.42 - y) * 9; wat.position.y = 0.38 + Math.sin(t * 1.5) * 0.004 }
  update(0)
  return { g, update }
}

/* ───────── farm ───────── */
const CROPS = ['wheat', 'cabbage', 'carrot', 'corn', 'tomato', 'sunflower']
function crop(P, kind, x, z, r, y0) {
  switch (kind) {
    case 'wheat': for (let i = 0; i < 3; i++) { const dx = (r() - 0.5) * 0.12, dz = (r() - 0.5) * 0.12, h = 0.34 + r() * 0.1, l = (r() - 0.5) * 0.18; P.cyl(mat(0xc9ae52), 0.006, 0.01, h, x + dx, y0 + h / 2, z + dz, 4, l, 0, l); P.cyl(mat(0xe0c25a), 0.022, 0.012, 0.11, x + dx + l * 0.2, y0 + h + 0.03, z + dz, 5, l, 0, l) } break
    case 'cabbage': { const s = 0.085 + r() * 0.02; P.sph(mat(0x6aae4a), s, x, y0 + s * 0.8, z, 1.1, 0.85, 1.1, 5); P.sph(mat(0x8cc468), s * 0.65, x, y0 + s * 1.05, z, 1, 0.8, 1, 4) } break
    case 'carrot': for (let i = 0; i < 4; i++) { const a = i * 1.6 + r(); P.cyl(mat(0x4e9a45), 0.004, 0.012, 0.2, x + Math.cos(a) * 0.04, y0 + 0.14, z + Math.sin(a) * 0.04, 4, Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4) } P.cyl(mat(0xe8761e), 0.03, 0.005, 0.05, x, y0 + 0.02, z, 5); break
    case 'corn': { const h = 0.62 + r() * 0.2; P.cyl(mat(0x5a9a3c), 0.012, 0.022, h, x, y0 + h / 2, z, 5); for (let i = 0; i < 3; i++) { const a = i * 2.1 + r(); P.box(mat(0x6aae4a), 0.03, 0.01, 0.2, x + Math.cos(a) * 0.07, y0 + h * (0.45 + i * 0.15), z + Math.sin(a) * 0.07, -a + PI / 2, 0, 0.5) } P.cyl(mat(0xf2d04a), 0.025, 0.02, 0.11, x + 0.025, y0 + h * 0.62, z, 6, 0, 0, 0.3) } break
    case 'tomato': { const h = 0.38; P.cyl(mat(WOOD2), 0.008, 0.008, h + 0.1, x, y0 + (h + 0.1) / 2, z, 4); P.sph(mat(0x4e9a45), 0.08, x, y0 + 0.18, z, 1, 1.4, 1, 4); for (let i = 0; i < 3; i++) P.sph(mat(0xd9302a), 0.032, x + (r() - 0.5) * 0.14, y0 + 0.1 + r() * 0.2, z + (r() - 0.5) * 0.14, 1, 1, 1, 4) } break
    case 'sunflower': { const h = 0.55 + r() * 0.15; P.cyl(mat(0x3e7a38), 0.012, 0.016, h, x, y0 + h / 2, z, 4); P.cyl(mat(0xf5c518), 0.07, 0.07, 0.02, x, y0 + h, z + 0.025, 8, PI / 2 - 0.25); P.cyl(mat(0x5a3a1a), 0.035, 0.035, 0.03, x, y0 + h, z + 0.03, 6, PI / 2 - 0.25) } break
  }
}
function makeFarm(r) {
  const F = FEATURES.farm, g = new THREE.Group(), P = new Part({}), C = new Part({})
  const hx = 2.0, hz = 1.15, y0 = 0.07
  // soil
  P.box(mat(0x5a3d26, 1), hx * 2 + 0.3, 0.06, 2 * hz + 0.3, 0, 0.03, 0)
  P.box(mat(0x8a7a4a, 1), F.hw * 2 - 0.2, 0.025, F.hd * 2 - 0.2, 0, 0.013, 0) // trampled grass-brown base
  const rows = 8, bands = [pick(r, CROPS), 0, 0].map((_, i) => i), types = []
  const pool = [...CROPS].sort(() => r() - 0.5); for (let i = 0; i < 3; i++) types.push(pool[i])
  for (let j = 0; j < rows; j++) {
    const z = -hz + 0.1 + j * ((2 * hz - 0.2) / (rows - 1)), kind = types[Math.min(2, (j / 8 * 3) | 0)], step = kind === 'corn' || kind === 'sunflower' ? 0.34 : kind === 'wheat' ? 0.2 : 0.27
    P.box(mat(0x6a4a2e, 1), hx * 2 - 0.1, 0.07, 0.17, 0, 0.06, z)
    for (let x = -hx + 0.2; x <= hx - 0.15; x += step) crop(C, kind, x + (r() - 0.5) * 0.04, z + (r() - 0.5) * 0.03, r, 0.095)
  }
  // fence
  const fx = F.hw - 0.08, fz = F.hd - 0.06, wood = mat(WOOD, 0.95), wood2 = mat(WOOD2, 0.95)
  const post = (x, z, h = 0.5) => P.box(wood, 0.07, h, 0.07, x, h / 2, z)
  for (let x = -fx; x <= fx + 0.01; x += 0.575) { post(x, -fz); if (Math.abs(x) > 0.5) post(x, fz) }
  for (let z = -fz; z <= fz + 0.01; z += 0.6) { post(-fx, z); post(fx, z) }
  for (const y of [0.18, 0.36]) {
    P.box(wood2, fx * 2, 0.04, 0.03, 0, y, -fz); P.box(wood2, fx - 0.5, 0.04, 0.03, -(fx + 0.5) / 2, y, fz); P.box(wood2, fx - 0.5, 0.04, 0.03, (fx + 0.5) / 2, y, fz)
    P.box(wood2, 0.03, 0.04, fz * 2, -fx, y, 0); P.box(wood2, 0.03, 0.04, fz * 2, fx, y, 0)
  }
  post(-0.5, fz, 0.7); post(0.5, fz, 0.7)
  // hay bales & crate
  for (const [x, z, a] of [[-fx + 0.35, fz - 0.28, 0.2], [-fx + 0.75, fz - 0.26, -0.1]]) { P.cyl(mat(0xd9b84a), 0.17, 0.17, 0.32, x, 0.17, z, 9, 0, a, PI / 2); P.cyl(mat(0xb8962f), 0.172, 0.172, 0.02, x, 0.17, z, 9, 0, a, PI / 2) }
  P.box(wood2, 0.3, 0.2, 0.22, fx - 0.35, 0.1, fz - 0.25, 0.3); for (let i = 0; i < 4; i++) P.sph(mat(pick(r, [0xd9302a, 0xe8761e, 0x6aae4a])), 0.06, fx - 0.42 + (i % 2) * 0.12, 0.23, fz - 0.28 + ((i / 2) | 0) * 0.1, 1, 1, 1, 4)
  g.add(P.build()); const cg = C.build(); g.add(cg)
  // scarecrow
  const sc = new THREE.Group(); sc.position.set(fx - 0.3, 0.08, -fz + 0.35); sc.rotation.y = -0.5
  sc.add(mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.1, 5), mat(WOOD), 0, 0.55, 0)); const arms = mesh(new THREE.BoxGeometry(0.85, 0.035, 0.035), mat(WOOD), 0, 0.82, 0); sc.add(arms)
  sc.add(mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.36, 7), mat(pick(r, [0xb5502a, 0x4a6a9a, 0x8a5a9a])), 0, 0.72, 0))
  sc.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0xe2cf9c), 0, 1.05, 0.01)); sc.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 10), mat(0xc9a24a), 0, 1.12, 0)); sc.add(mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.1, 8), mat(0x8a6a2a), 0, 1.17, 0))
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const s = mesh(new THREE.ConeGeometry(0.01, 0.12, 3), mat(0xd9b84a), sd * (0.43 + i * 0.012), 0.76 - i * 0.04, 0); s.rotation.z = sd * PI; sc.add(s) }
  for (const sd of [-1, 1]) sc.add(mesh(new THREE.SphereGeometry(0.012, 4, 3), mat(0x222222), sd * 0.035, 1.07, 0.1, false))
  g.add(sc)
  // farmer tending the front strip
  const farmer = makePerson({ hat: 'straw', apron: r() < 0.5, dress: r() < 0.3 }, r), rg = farmer.userData.rig; const can = makeTool('can'); can.rotation.x = PI / 2; rg.handR.add(can); farmer.position.set(-1, 0.03, fz - 0.28); g.add(farmer)
  const F2 = { x: -1, dir: 1, t: 0, wait: 0 }
  let time = 0
  const update = (dt) => {
    time += dt; sc.rotation.z = Math.sin(time * 1.1) * 0.03; arms.rotation.z = Math.sin(time * 1.6) * 0.04; cg.rotation.z = Math.sin(time * 0.9) * 0.004
    F2.t += dt
    if (F2.wait > 0) { F2.wait -= dt; farmer.rotation.y = PI; pose(farmer, 'water', F2.t); if (F2.wait <= 0) F2.dir *= -1; return }
    F2.x += F2.dir * 0.42 * dt; farmer.position.x = F2.x; farmer.rotation.y = F2.dir > 0 ? PI / 2 : -PI / 2; pose(farmer, 'walk', F2.t, { k: 0.8 })
    if ((F2.dir > 0 && F2.x > 1.1) || (F2.dir < 0 && F2.x < -1.1)) F2.wait = 3.2
  }
  return { g, update }
}


/* ───────── barn ───────── */
function makeBarn(r) {
  const g = new THREE.Group(), P = new Part({}), d = 3.0, W = 1.1
  const red = pick(r, [0xa8402e, 0x8f3a2c, 0x3f6a8a, 0x4f7a4a, 0xb8862e]), trim = 0xf3ecdc, dark = 0x6a2a1e
  const wallM = new THREE.MeshStandardMaterial({ color: red, roughness: 0.9, flatShading: true })
  const prof = new THREE.Shape([[-W, 0], [W, 0], [W, 1.1], [0.8, 1.75], [0, 2.3], [-0.8, 1.75], [-W, 1.1]].map(([x, y]) => new THREE.Vector2(x, y)))
  const bg = new THREE.ExtrudeGeometry(prof, { depth: d, bevelEnabled: false }); bg.translate(0, 0.1, -d / 2)
  const body = new THREE.Group(); body.position.x = -0.3; g.add(body)
  const wm = new THREE.Mesh(bg, wallM); wm.castShadow = wm.receiveShadow = true; body.add(wm)
  const Q = new Part({})
  Q.box(mat(0x7d776c), W * 2 + 0.12, 0.12, d + 0.12, 0, 0.06, 0)
  for (let i = -4; i <= 4; i++) for (const sd of [-1, 1]) { Q.box(mat(dark), 0.025, 0.95, 0.02, i * 0.24, 0.62, sd * (d / 2 + 0.005)) }
  for (let i = -5; i <= 5; i++) for (const sd of [-1, 1]) Q.box(mat(dark), 0.02, 0.95, 0.03, sd * (W + 0.005), 0.62, i * 0.27)
  // corner trim & door
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Q.box(mat(trim), 0.08, 1.2, 0.08, sx * W, 0.7, sz * d / 2)
  const fz = d / 2 + 0.02
  Q.box(mat(trim), 1.14, 0.07, 0.04, 0, 1.12, fz); for (const sx of [-1, 1]) Q.box(mat(trim), 0.07, 1.0, 0.04, sx * 0.57, 0.62, fz)
  for (const sx of [-1, 1]) { Q.box(mat(dark), 0.52, 0.95, 0.03, sx * 0.275, 0.6, fz); Q.box(mat(trim), 0.5, 0.04, 0.035, sx * 0.275, 0.6, fz + 0.01, 0, 0, 0.82 * sx); Q.box(mat(trim), 0.5, 0.04, 0.035, sx * 0.275, 0.6, fz + 0.01, 0, 0, -0.82 * sx) }
  Q.box(mat(trim), 0.5, 0.05, 0.04, 0, 1.78, fz); Q.box(mat(0x2a1a14), 0.34, 0.34, 0.03, 0, 1.55, fz); for (const sx of [-1, 1]) Q.box(mat(trim), 0.04, 0.38, 0.04, sx * 0.19, 1.55, fz + 0.01); Q.box(mat(trim), 0.42, 0.04, 0.04, 0, 1.74, fz + 0.01)
  for (let i = 0; i < 6; i++) Q.cyl(mat(0xe0c25a), 0.012, 0.012, 0.22, -0.12 + i * 0.05, 1.46, fz + 0.04, 4, 0.5 + r() * 0.3, 0, (r() - 0.5) * 0.6)
  // roof slabs
  const roofM = mat(pick(r, [0x4a4048, 0x5b4a44, 0x3e4a52]), 0.95)
  for (const sd of [-1, 1]) for (const [a, b] of [[[W, 1.1], [0.8, 1.75]], [[0.8, 1.75], [0, 2.3]]]) {
    const x0 = a[0] * sd, y0 = a[1] + 0.1, x1 = b[0] * sd, y1 = b[1] + 0.1, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx), nx = (-dy / len) * sd * -1, ny = dx / len * sd * -1
    const nxs = dy / len * sd * (sd > 0 ? 1 : 1), nys = -dx / len * (sd > 0 ? 1 : 1)
    Q.box(roofM, len + 0.06, 0.07, d + 0.34, (x0 + x1) / 2 + (sd > 0 ? Math.abs(dy) / len : -Math.abs(dy) / len) * 0.04, (y0 + y1) / 2 + 0.035, 0, 0, 0, ang)
  }
  Q.box(mat(trim), 0.14, 0.05, d + 0.36, 0, 2.43, 0)
  const bgrp = Q.build(); body.add(bgrp)
  // silo
  const silo = new THREE.Group(); silo.position.set(1.3, 0, -0.9); g.add(silo)
  silo.add(mesh(new THREE.CylinderGeometry(0.5, 0.52, 2.1, 12), mat(0xcfc8b4, 0.9), 0, 1.05, 0))
  for (let i = 0; i < 5; i++) silo.add(mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.04, 12), mat(0x6b665e), 0, 0.3 + i * 0.4, 0, false))
  silo.add(mesh(new THREE.SphereGeometry(0.52, 12, 6, 0, PI * 2, 0, PI / 2), mat(0x6b7a86, 0.5), 0, 2.1, 0)); silo.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 5), mat(0x4a4d55), 0, 2.7, 0))
  const lad = new Part({}); for (let i = 0; i < 12; i++) lad.box(mat(WOOD), 0.18, 0.025, 0.025, 0, 0.2 + i * 0.16, 0.53); silo.add(lad.build())
  // weathervane
  const wv = new THREE.Group(); wv.position.set(-0.3, 2.53, 0); g.add(wv)
  wv.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 4), mat(0x2a2a30), 0, 0.21, 0)); const arrow = new THREE.Group(); arrow.position.y = 0.4; arrow.add(mesh(new THREE.BoxGeometry(0.012, 0.012, 0.36), mat(0x2a2a30), 0, 0, 0)); arrow.add(mesh(new THREE.ConeGeometry(0.035, 0.09, 4), mat(0x2a2a30), 0, 0, 0.2)).rotation.x = PI / 2; const tail = mesh(new THREE.BoxGeometry(0.01, 0.1, 0.1), mat(0x2a2a30), 0, 0.03, -0.17); arrow.add(tail); const cock = mesh(new THREE.SphereGeometry(0.04, 6, 4), mat(0xd9a020), 0, 0.07, 0.02); arrow.add(cock); wv.add(arrow)
  // yard: hay bales, barrels, fence bit, cow, farmer
  const Y = new Part({})
  for (const [x, z, a] of [[-1.4, 1.95, 0.3], [-0.95, 1.9, -0.2], [-1.2, 1.78, 0.1]]) { Y.cyl(mat(0xd9b84a), 0.17, 0.17, 0.32, x, 0.17 + (z < 1.85 ? 0.28 : 0), z, 9, 0, a, PI / 2) }
  Y.box(mat(WOOD2), 0.5, 0.26, 0.35, 1.5, 0.13, 1.7, 0.3); Y.cyl(mat(WOOD), 0.15, 0.15, 0.32, 1.0, 0.16, 1.95, 9); Y.cyl(mat(0x3a3a40), 0.152, 0.152, 0.02, 1.0, 0.26, 1.95, 9)
  g.add(Y.build())
  const cow = new THREE.Group(); cow.position.set(0.5, 0, 1.85); cow.rotation.y = -0.6
  const cm = mat(0xf6f1e6, 0.8), cp = mat(0x3a2a22, 0.8)
  const cb = mesh(new THREE.BoxGeometry(0.3, 0.26, 0.55), cm, 0, 0.32, 0); cow.add(cb); cow.add(mesh(new THREE.BoxGeometry(0.31, 0.12, 0.22), cp, 0, 0.4, 0.1))
  for (const [x, z] of [[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.2], [0.1, -0.2]]) cow.add(mesh(new THREE.BoxGeometry(0.07, 0.2, 0.07), cm, x, 0.1, z))
  const head = new THREE.Group(); head.position.set(0, 0.42, 0.3); head.add(mesh(new THREE.BoxGeometry(0.18, 0.17, 0.2), cm, 0, 0, 0.06)); head.add(mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), mat(0xe8b0a0), 0, -0.04, 0.17)); for (const sd of [-1, 1]) { head.add(mesh(new THREE.ConeGeometry(0.018, 0.07, 4), mat(0xe8dcc0), sd * 0.08, 0.1, 0.03)); head.add(mesh(new THREE.BoxGeometry(0.05, 0.03, 0.07), cp, sd * 0.11, 0.05, 0.02)) } cow.add(head)
  const tl = new THREE.Group(); tl.position.set(0, 0.42, -0.28); tl.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 4), cp, 0, -0.1, 0)); cow.add(tl); g.add(cow)
  const farmer = makePerson({ hat: 'straw', apron: false }, r), rg = farmer.userData.rig; const br = makeTool('broom'); rg.handR.add(br); br.position.z = 0.02; farmer.position.set(-0.3, 0, 2.0); farmer.rotation.y = 0.5; g.add(farmer)
  let t = 0
  const update = (dt) => { t += dt; arrow.rotation.y = Math.sin(t * 0.4) * 1.6 + Math.sin(t * 1.3) * 0.2; head.rotation.x = 0.35 + Math.sin(t * 0.7) * 0.3; tl.rotation.x = Math.sin(t * 2.4) * 0.4; pose(farmer, 'sweep', t) }
  return { g, update }
}

/* ───────── market square ───────── */
const tcache = new Map()
function canvasTex(key, w, h, draw, rx = 1, ry = 1) {
  if (tcache.has(key)) return tcache.get(key)
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(rx, ry); t.anisotropy = 4; tcache.set(key, t); return t
}
const cobbleTex = () => canvasTex('cob', 256, 256, (x, w, h) => {
  const rr = rngOf(7); x.fillStyle = '#7e7566'; x.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) { const a = rr() * w, b = rr() * h, sw = 22 + rr() * 16, sh = 16 + rr() * 12, l = 58 + rr() * 22; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { x.fillStyle = `hsl(${32 + rr() * 8},${10 + rr() * 8}%,${l}%)`; x.beginPath(); x.roundRect(a + ox, b + oy, sw, sh, 6); x.fill() } }
}, 5, 5)
const stripeTex = (c) => canvasTex('str' + c, 128, 32, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f6efe0' : '#' + c.toString(16).padStart(6, '0'); x.fillRect(i * 16, 0, 16, h) } }, 3, 1)
const GOLD = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.28, metalness: 0.75, emissive: 0x6a4400, emissiveIntensity: 0.55, flatShading: true })
function makeStall(kind, r, awn) {
  const g = new THREE.Group(), P = new Part({}), wd = mat(WOOD, 0.95), wd2 = mat(WOOD2, 0.95)
  for (const sx of [-1, 1]) { P.box(wd, 0.07, 1.4, 0.07, sx * 0.8, 0.7, 0.5); P.box(wd, 0.07, 1.62, 0.07, sx * 0.8, 0.81, -0.45) }
  P.box(wd2, 1.56, 0.06, 0.56, 0, 0.6, 0.28); P.box(wd, 1.56, 0.5, 0.04, 0, 0.33, 0.55); P.box(wd, 1.56, 0.5, 0.04, 0, 0.33, 0.0); for (const sx of [-1, 1]) P.box(wd, 0.04, 0.5, 0.55, sx * 0.76, 0.33, 0.28)
  P.box(mat(0x8a6a50, 1), 1.6, 1.0, 0.04, 0, 0.5, -0.47)
  const m = (h) => mat(h, 0.8), put = (c) => c
  switch (kind) {
    case 'fruit': for (const [x, c] of [[-0.45, 0xd9302a], [0, 0xe8761e], [0.45, 0x6aae4a]]) { P.box(wd2, 0.36, 0.1, 0.3, x, 0.68, 0.3); for (let i = 0; i < 7; i++) P.sph(m(c), 0.055, x + (r() - 0.5) * 0.26, 0.77 + r() * 0.04, 0.3 + (r() - 0.5) * 0.2, 1, 1, 1, 4) } break
    case 'bread': for (let i = 0; i < 6; i++) P.sph(m(0xd9a45a), 0.07, -0.55 + i * 0.2, 0.69, 0.22 + (i % 2) * 0.16, 1.5, 0.8, 1, 5); for (let i = 0; i < 3; i++) P.cyl(m(0xc98a3a), 0.025, 0.025, 0.4, 0.3 + i * 0.08, 0.7, 0.4, 5, PI / 2, 0, 0.3); P.cyl(m(0xb08a58), 0.2, 0.15, 0.1, -0.5, 0.68, 0.38, 9); break
    case 'cloth': for (const [i, c] of [0xb5304a, 0x3f6fb5, 0xe0b341, 0x5a9a5a, 0x8a5ac4].entries()) P.cyl(m(c), 0.08, 0.08, 0.5, -0.55 + i * 0.27, 0.72 + (i % 2) * 0.13, 0.3, 8, 0, 0, PI / 2 + 0.0 * i); for (const [i, c] of [0xb5304a, 0x3f8c8c, 0xe0b341].entries()) P.box(m(c), 0.3, 0.7, 0.02, -0.45 + i * 0.45, 1.05, -0.4); break
    case 'pottery': for (let i = 0; i < 5; i++) { const x = -0.55 + i * 0.27, h = 0.14 + r() * 0.08, c = pick(r, [0xb5622e, 0xc98a5a, 0x8a4a2e, 0x4a7a8a]); P.cyl(m(c), 0.05, 0.075, h, x, 0.63 + h / 2, 0.3, 8); P.sph(m(c), 0.08, x, 0.66 + h * 0.5, 0.3, 1, 0.9, 1, 5) } break
    case 'fish': P.box(wd2, 1.2, 0.04, 0.4, 0, 0.64, 0.3); for (let i = 0; i < 7; i++) { P.sph(m(0xb9c4cc), 0.05, -0.5 + i * 0.17, 0.7, 0.2 + (i % 2) * 0.18, 2.2, 0.6, 0.8, 5); } break
    case 'gold': {
      for (let i = 0; i < 4; i++) { const n = 3 + ((r() * 5) | 0); for (let k = 0; k < n; k++) P.cyl(GOLD, 0.055, 0.055, 0.016, -0.55 + i * 0.16, 0.64 + k * 0.017, 0.15, 10) }
      for (let k = 0; k < 4; k++) P.box(GOLD, 0.2, 0.05, 0.1, 0.1 + (k % 2) * 0.02, 0.66 + k * 0.05 - (k > 1 ? 0.1 : 0), 0.45 - (k > 1 ? 0.0 : 0), 0.1 * k)
      P.box(wd, 0.34, 0.2, 0.22, 0.5, 0.73, 0.28); P.box(GOLD, 0.3, 0.02, 0.18, 0.5, 0.84, 0.28); for (let i = 0; i < 6; i++) P.sph(GOLD, 0.03, 0.4 + (r() - 0.5) * 0.18, 0.86, 0.28 + (r() - 0.5) * 0.12, 1, 0.5, 1, 4)
      P.cyl(mat(0x3a3a40), 0.01, 0.01, 0.3, -0.1, 0.78, 0.35, 4); P.box(mat(0x3a3a40), 0.36, 0.015, 0.015, -0.1, 0.93, 0.35, 0); for (const sx of [-1, 1]) P.cyl(mat(0xc9a24a), 0.06, 0.04, 0.02, -0.1 + sx * 0.17, 0.85, 0.35, 8)
      P.sph(m(0xd9304f), 0.035, -0.32, 0.66, 0.45, 1, 1, 1, 4); P.sph(m(0x3f7fd9), 0.035, -0.26, 0.66, 0.42, 1, 1, 1, 4); P.sph(m(0x4ac98a), 0.035, -0.38, 0.66, 0.42, 1, 1, 1, 4)
    } break
  }
  g.add(P.build())
  // striped awning
  const am = new THREE.MeshStandardMaterial({ map: stripeTex(awn), roughness: 0.9, side: THREE.DoubleSide })
  const aw = mesh(new THREE.BoxGeometry(1.8, 0.035, 1.18), am, 0, 1.5, 0.07); aw.rotation.x = 0.22; g.add(aw)
  const fl = mesh(new THREE.BoxGeometry(1.8, 0.14, 0.025), am, 0, 1.4, 0.64); fl.rotation.x = 0.1; g.add(fl)
  // merchant
  const merch = makePerson({ hat: pick(r, ['cap', 'bonnet', 'hood', 'straw']), apron: true, dress: kind === 'bread' || kind === 'cloth' }, r); merch.position.set(0, 0, 0.0); g.add(merch)
  const sparks = []
  if (kind === 'gold') for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.03), new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0 })); s.position.set(-0.55 + i * 0.28 + (r() - 0.5) * 0.1, 0.95 + r() * 0.15, 0.3 + r() * 0.15); g.add(s); sparks.push({ s, ph: r() * 6 }) }
  return { g, merch, sparks, t: r() * 10, kind }
}
function makeMarket(r) {
  const F = FEATURES.market, g = new THREE.Group(), P = new Part({})
  const pav = new THREE.Mesh(new THREE.BoxGeometry(F.hw * 2 - 0.1, 0.06, F.hd * 2 - 0.1), new THREE.MeshStandardMaterial({ map: cobbleTex(), roughness: 1 })); pav.position.y = 0.03; pav.receiveShadow = true; g.add(pav)
  const e = F.hw - 0.05
  for (const [w, d, x, z] of [[e * 2 + 0.1, 0.14, 0, -e], [e * 2 + 0.1, 0.14, 0, e], [0.14, e * 2 - 0.1, -e, 0], [0.14, e * 2 - 0.1, e, 0]]) P.box(mat(0x6f695e), w, 0.1, d, x, 0.05, z)
  // fountain
  P.cyl(mat(0x8f897c), 0.62, 0.66, 0.26, 0, 0.19, 0, 14); P.cyl(mat(0xa8a296), 0.55, 0.55, 0.05, 0, 0.34, 0, 14); P.cyl(mat(0x8f897c), 0.12, 0.16, 0.6, 0, 0.62, 0, 8); P.cyl(mat(0x9a9488), 0.3, 0.1, 0.1, 0, 0.94, 0, 12)
  // lamp posts, barrels, crates, banners
  for (const [x, z] of [[-e + 0.2, -e + 0.2], [e - 0.2, -e + 0.2], [e - 0.2, e - 0.2], [-e + 0.2, e - 0.2]]) { P.cyl(mat(0x2e2e34), 0.03, 0.04, 1.5, x, 0.75, z, 5); P.box(mat(0x2e2e34), 0.14, 0.14, 0.14, x, 1.55, z); P.box(mat(0xffd98a, 0.3), 0.1, 0.1, 0.1, x, 1.55, z) }
  for (const [x, z] of [[-2.3, 2.15], [2.25, -2.2], [-2.2, -2.0]]) { P.cyl(mat(WOOD2), 0.17, 0.15, 0.36, x, 0.24, z, 9); P.cyl(mat(0x3a3a40), 0.175, 0.175, 0.02, x, 0.3, z, 9) }
  for (const [x, z, a] of [[2.2, 2.15, 0.3], [-2.3, -2.3, 0.1]]) { P.box(mat(WOOD2), 0.3, 0.24, 0.3, x, 0.18, z, a); P.box(mat(WOOD), 0.28, 0.22, 0.28, x + 0.02, 0.42, z, a + 0.4) }
  g.add(P.build())
  // fountain water + spray
  const wat = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.02, 14), new THREE.MeshStandardMaterial({ color: 0x3f9bd0, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.9 }), 0, 0.33, 0, false); g.add(wat)
  const drops = []; const dm = new THREE.MeshBasicMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.85 })
  for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), dm); g.add(d); drops.push({ d, a: (i / 14) * PI * 2, ph: i / 14, sp: 0.9 + (i % 3) * 0.1 }) }
  // stalls
  const kinds = ['gold', ...[...['fruit', 'bread', 'cloth', 'pottery', 'fish']].sort(() => r() - 0.5).slice(0, 3)].sort(() => r() - 0.5)
  const AW = [0xb5304a, 0x3f6fb5, 0x2f8a5a, 0xd9892a, 0x8a5ac4, 0xc9b030].sort(() => r() - 0.5)
  const stalls = [], R = 1.78
  kinds.forEach((k, i) => { const th = [0, -PI / 2, PI, PI / 2][i], pos = [[0, -R], [R, 0], [0, R], [-R, 0]][i], S = makeStall(k, r, AW[i]); S.g.position.set(pos[0], 0.06, pos[1]); S.g.rotation.y = th; S.th = th; g.add(S.g); stalls.push(S) })
  // customers
  const ring = stalls.map((S) => ({ x: Math.sin(S.th) * -1 * 0 + (-Math.sin(S.th)) * 0.0, z: 0 }))
  const spots = stalls.map((S) => { const fx = Math.sin(S.th), fz = Math.cos(S.th); return { x: S.g.position.x + fx * 0.95, z: S.g.position.z + fz * 0.95, face: S.th + PI, S } })
  const cust = []
  for (let i = 0; i < 3; i++) { const p = makePerson({ hat: pick(r, ['none', 'cap', 'bonnet', 'hood', 'straw']), dress: r() < 0.4 }, r); const sp = spots[i % 4]; p.position.set(sp.x, 0.06, sp.z); g.add(p)
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 8), GOLD); coin.visible = false; g.add(coin)
    cust.push({ p, coin, at: i % 4, to: i % 4, state: 'wait', wait: 1 + r() * 2, t: r() * 10, ct: -1, x: sp.x, z: sp.z, rot: sp.face }) }
  let time = 0
  const update = (dt) => {
    time += dt
    for (const d of drops) { const u = (time * d.sp * 0.7 + d.ph) % 1, rad = Math.sin(u * PI) * 0.34 * (d.ph > 0.5 ? 1 : 0.7); d.d.position.set(Math.cos(d.a) * rad, 0.98 + Math.sin(u * PI) * 0.4 - u * u * 0.05 - (u > 0.9 ? (u - 0.9) * 3 : 0), Math.sin(d.a) * rad); d.d.visible = u < 0.98 }
    wat.position.y = 0.33 + Math.sin(time * 2) * 0.004
    for (const S of stalls) { S.t += dt; const m = S.merch; const wv = (S.t % 7) < 2.4; pose(m, wv ? 'wave' : 'idle', S.t); for (const s of S.sparks) s.s.material.opacity = Math.max(0, Math.sin(time * 2.2 + s.ph)) ** 8 }
    for (const c of cust) {
      c.t += dt
      if (c.state === 'wait') {
        const sp = spots[c.at]; let d = c.rot - c.p.rotation.y; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; c.p.rotation.y += d * Math.min(1, dt * 6)
        pose(c.p, c.wait > 1.2 ? 'idle' : 'wave', c.t); c.wait -= dt
        // coin toss to the merchant mid-wait
        if (c.wait < 1.6 && c.wait > 0.5) { if (c.ct < 0) c.ct = 0; c.ct += dt * 1.8; const u = Math.min(1, c.ct), S = sp.S, mp = S.g.position, fx = Math.sin(S.th), fz = Math.cos(S.th); const tx = mp.x + fx * 0.3, tz = mp.z + fz * 0.3; c.coin.visible = u < 1; c.coin.position.set(c.x + (tx - c.x) * u, 0.5 + Math.sin(u * PI) * 0.35, c.z + (tz - c.z) * u); c.coin.rotation.x = u * 12 } else c.coin.visible = false
        if (c.wait <= 0) { c.ct = -1; c.coin.visible = false; c.to = (c.at + (r() < 0.5 ? 1 : 3)) % 4; c.state = 'walk'; c.k = 0 }
      } else {
        const sp = spots[c.at], tp = spots[c.to]; // walk along the ring through a mid-point
        const mx = (sp.x + tp.x) * 0.5 * 1.18, mz = (sp.z + tp.z) * 0.5 * 1.18, wp = c.k < 1 ? [mx, mz] : [tp.x, tp.z]
        const dx = wp[0] - c.x, dz = wp[1] - c.z, dist = Math.hypot(dx, dz), step = 0.55 * dt
        if (dist < step) { c.x = wp[0]; c.z = wp[1]; if (c.k < 1) c.k = 1; else { c.state = 'wait'; c.at = c.to; c.wait = 2.6 + r() * 2; c.rot = tp.face } } else { c.x += dx / dist * step; c.z += dz / dist * step; c.p.rotation.y = Math.atan2(dx, dz) }
        pose(c.p, 'walk', c.t, { k: 0.8 })
      }
      c.p.position.x = c.x; c.p.position.z = c.z
    }
  }
  return { g, update }
}


/* ───────── kids garden ───────── */
const SHIRTS = [0xe8505b, 0x3f9bd0, 0xf2c230, 0x5aa04a, 0xb06ad0, 0xf08a3c, 0x3fb6a8]
function makeKid(r, hat) {
  const k = makePerson({ hat: hat ?? pick(r, ['none', 'cap', 'bonnet', 'straw', 'none', 'none']), dress: r() < 0.4, shirt: pick(r, SHIRTS), beard: false, build: pick(r, [0.86, 0.95, 1, 1.1]), height: 0.88 + r() * 0.2 }, r); k.scale.setScalar(0.7); return k
}
const sit = (k, legs, arms = -0.6) => { const rg = k.userData.rig; rg.legL.rotation.x = rg.legR.rotation.x = legs; rg.armL.rotation.x = rg.armR.rotation.x = arms; rg.body.rotation.set(0, 0, 0); rg.head.rotation.set(0, 0, 0) }
function makePlayground(r) {
  const F = FEATURES.playground, g = new THREE.Group(), P = new Part({})
  const white = mat(0xf6f1e6, 0.9), wd = mat(WOOD, 0.95), wd2 = mat(WOOD2, 0.95)
  // play surface
  P.box(mat(0xd7b87a, 1), 4.4, 0.04, 3.9, 0, 0.02, 0)
  P.box(mat(0x8bbf5a, 1), 4.8, 0.02, 4.3, 0, 0.008, 0)
  // picket fence with a gate gap at the front
  const fx = 2.2, fz = 1.95
  const picket = (x, z, ry = 0) => { P.box(white, 0.07, 0.4, 0.025, x, 0.2, z, ry); P.cyl(white, 0.0, 0.04, 0.06, x, 0.43, z, 4) }
  for (let x = -fx; x <= fx + 0.01; x += 0.17) { picket(x, -fz); if (Math.abs(x) > 0.3) picket(x, fz) }
  for (let z = -fz; z <= fz + 0.01; z += 0.17) { picket(-fx, z, PI / 2); picket(fx, z, PI / 2) }
  for (const y of [0.14, 0.3]) { P.box(wd2, fx * 2, 0.04, 0.03, 0, y, -fz - 0.03); P.box(wd2, fx - 0.3, 0.04, 0.03, -(fx + 0.3) / 2, y, fz + 0.03); P.box(wd2, fx - 0.3, 0.04, 0.03, (fx + 0.3) / 2, y, fz + 0.03); P.box(wd2, 0.03, 0.04, fz * 2, -fx - 0.03, y, 0); P.box(wd2, 0.03, 0.04, fz * 2, fx + 0.03, y, 0) }
  for (const sx of [-1, 1]) { P.box(wd, 0.09, 0.62, 0.09, sx * 0.3, 0.31, fz); P.sph(mat(0xe8505b), 0.06, sx * 0.3, 0.66, fz, 1, 1, 1, 5) }
  // swing frame (at the back left)
  const sbx = -1.1, sbz = -1.4, bh = 1.3
  const fr = mat(0xf0661c), ba = mat(0x8d9096), spread = 0.46, ang2 = Math.atan(spread / bh), len2 = Math.hypot(bh, spread) + 0.05
  P.cyl(ba, 0.03, 0.03, 1.95, sbx, bh + 0.02, sbz, 8, 0, 0, PI / 2)
  for (const sx of [-0.88, 0.88]) {
    for (const sd of [-1, 1]) P.cyl(fr, 0.032, 0.032, len2, sbx + sx, bh / 2, sbz + sd * spread / 2, 7, -sd * ang2, 0, 0)
    P.box(fr, 0.05, 0.05, spread * 1.25, sbx + sx, 0.42, sbz)
    P.box(fr, 0.09, 0.05, 0.09, sbx + sx, bh + 0.02, sbz)
  }
  // slide (at the back right)
  const slx = 1.35, slz = -1.3, H = 0.72
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.box(wd, 0.06, H, 0.06, slx + a * 0.27, H / 2, slz + b * 0.27)
  P.box(wd2, 0.66, 0.05, 0.66, slx, H, slz); for (const sx of [-1, 1]) P.box(wd2, 0.04, 0.2, 0.66, slx + sx * 0.31, H + 0.12, slz)
  P.box(wd2, 0.66, 0.2, 0.04, slx, H + 0.12, slz - 0.31)
  const ang = Math.atan2(H - 0.05, 1.25), len = Math.hypot(H - 0.05, 1.25), mz = slz + 0.33 + 0.62, my = (H + 0.05) / 2
  P.box(mat(0xf2c230, 0.5), 0.46, 0.035, len, slx, my, slz + 0.33 + 0.625 - 0.0, 0, ang)
  for (const sx of [-1, 1]) P.box(mat(0xe8505b), 0.035, 0.1, len, slx + sx * 0.25, my + 0.05, slz + 0.33 + 0.625, 0, ang)
  for (const sd of [-1, 1]) P.box(wd, 0.04, 0.9, 0.04, slx + 0.48, 0.38, slz + sd * 0.2, 0, 0, 0.45)
  for (let i = 0; i < 5; i++) P.box(wd2, 0.03, 0.03, 0.44, slx + 0.46 - i * 0.045 + 0.045 * 0 - (i * 0.0), 0.1 + i * 0.14, slz, 0)
  // sandbox (front right)
  const sbxx = 1.3, sbzz = 0.85
  P.box(wd2, 1.2, 0.14, 0.07, sbxx, 0.1, sbzz - 0.6); P.box(wd2, 1.2, 0.14, 0.07, sbxx, 0.1, sbzz + 0.6); P.box(wd2, 0.07, 0.14, 1.2, sbxx - 0.6, 0.1, sbzz); P.box(wd2, 0.07, 0.14, 1.2, sbxx + 0.6, 0.1, sbzz)
  P.box(mat(0xe6cf8e, 1), 1.12, 0.1, 1.12, sbxx, 0.09, sbzz)
  P.cyl(mat(0xe0c47a), 0.2, 0.26, 0.14, sbxx - 0.1, 0.19, sbzz, 8); P.cyl(mat(0xe0c47a), 0.12, 0.17, 0.12, sbxx - 0.1, 0.3, sbzz, 8); P.cyl(mat(0xc9a24a), 0.0, 0.07, 0.1, sbxx - 0.1, 0.4, sbzz, 6)
  P.cyl(mat(0x3f9bd0), 0.06, 0.045, 0.08, sbxx + 0.3, 0.18, sbzz + 0.2, 8); P.box(mat(0xe8505b), 0.05, 0.015, 0.12, sbxx + 0.2, 0.15, sbzz - 0.25, 0.6)
  // seesaw support + flower beds + toys
  const ssx = -1.0, ssz = 0.75
  for (const dx of [-0.08, 0.08]) { P.box(mat(0x4f78c4), 0.05, 0.12, 0.34, ssx + dx, 0.06, ssz); P.cyl(mat(0x4f78c4), 0.17, 0.17, 0.05, ssx + dx, 0.12, ssz, 14, 0, 0, PI / 2) }
  P.cyl(mat(0xdfe3ea), 0.025, 0.025, 0.2, ssx, 0.15, ssz, 8, 0, 0, PI / 2)
  const bed = (x, z, w, d) => { P.box(wd2, w, 0.12, 0.05, x, 0.07, z - d / 2); P.box(wd2, w, 0.12, 0.05, x, 0.07, z + d / 2); P.box(wd2, 0.05, 0.12, d, x - w / 2, 0.07, z); P.box(wd2, 0.05, 0.12, d, x + w / 2, 0.07, z); P.box(mat(0x5a3d26, 1), w, 0.09, d, x, 0.06, z)
    for (let i = 0; i < 16; i++) { const fxx = x + (r() - 0.5) * (w - 0.1), fzz = z + (r() - 0.5) * (d - 0.1), h = 0.15 + r() * 0.15; P.cyl(mat(0x3e7a38), 0.01, 0.012, h, fxx, 0.1 + h / 2, fzz, 4); P.sph(mat(pick(r, [0xe84a5f, 0xffd24a, 0xff8fb0, 0xb48be0, 0xffffff, 0xff9a4d])), 0.04, fxx, 0.1 + h + 0.02, fzz, 1, 0.7, 1, 4) } }
  bed(-1.7, 1.5, 0.8, 0.45); bed(0.2, -1.62, 1.0, 0.4)
  // small tree
  P.cyl(mat(0x5b4030), 0.05, 0.08, 0.6, 1.85, 0.3, 0.1, 7); for (const [x, y, z, rr] of [[0, 0.95, 0, 0.36], [0.2, 0.8, 0.1, 0.25], [-0.18, 0.82, -0.1, 0.26]]) P.sph(mat(pick(r, [0x4e9a45, 0x5aa04a])), rr, 1.85 + x, y, 0.1 + z, 1, 0.9, 1, 6)
  // ball + bench
  P.sph(mat(0xe8505b), 0.07, 0.55, 0.07, 1.05, 1, 1, 1, 5)
  P.box(wd2, 0.8, 0.04, 0.25, -0.2, 0.28, 1.65, 0); P.box(wd, 0.8, 0.22, 0.03, -0.2, 0.4, 1.77); for (const sx of [-1, 1]) P.box(wd, 0.05, 0.26, 0.22, -0.2 + sx * 0.35, 0.13, 1.65)
  g.add(P.build())
  // swings
  const swings = []
  for (const [i, sx] of [-0.3, 0.3].entries()) {
    const sw = new THREE.Group(); sw.position.set(sbx + sx, bh, sbz); g.add(sw)
    const ch = mat(0x7a5fd0)
    for (const cx of [-0.17, 0.17]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.95, 5), ch); c.position.set(cx, -0.475, 0); sw.add(c) }
    sw.add(mesh(new THREE.BoxGeometry(0.4, 0.04, 0.17), mat(0xf2c230), 0, -0.95, 0))
    const kid = makeKid(r); kid.position.set(0, -0.935 - 0.217 + 0.03, 0); sw.add(kid); swings.push({ sw, kid, ph: i * 1.7, sp: 1.9 + i * 0.25, amp: 0.5 + i * 0.1 })
  }
  // seesaw
  const see = new THREE.Group(); see.position.set(ssx, 0.3, ssz); g.add(see)
  see.add(mesh(new THREE.BoxGeometry(1.7, 0.05, 0.13), mat(0xf5a640), 0, 0, 0))
  for (const sd of [-1, 1]) {
    see.add(mesh(new THREE.BoxGeometry(0.34, 0.05, 0.28), mat(0xf5a640), sd * 0.84, 0, 0)); see.add(mesh(new THREE.BoxGeometry(0.34, 0.025, 0.28), mat(0xd9822e), sd * 0.84, -0.037, 0))
    see.add(mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), mat(0xd9402f), sd * 0.62, 0.125, 0)); see.add(mesh(new THREE.BoxGeometry(0.045, 0.035, 0.26), mat(0xd9402f), sd * 0.62, 0.235, 0))
  }
  for (const sd of [-1, 1]) { const kid = makeKid(r); kid.position.set(sd * 0.84, 0.025 - 0.217 + 0.02, 0); kid.rotation.y = sd > 0 ? -PI / 2 : PI / 2; see.add(kid); sit(kid, -1.3); (see.userData.kids ||= []).push(kid) }
  // sliding kid
  const slider = makeKid(r); g.add(slider)
  const sl = { u: 0, state: 'climb', t: 0 }
  // sandbox kid + runners
  const digger = makeKid(r); digger.position.set(sbxx + 0.1, 0, sbzz + 0.78); digger.rotation.y = PI; g.add(digger)
  const runners = [0, 1].map((i) => { const k = makeKid(r); g.add(k); return { k, a: i * 2.6, rx: 0.65, rz: 0.5 } })
  // butterflies
  const flies = ['monarch', 'swallowtail', 'pink'].map((k) => { const B = makeButterfly(k, r, { cx: 0, cz: 0, rx: 1.9, rz: 1.5, y0: 0.5, y1: 1.4 }); g.add(B.g); return B })
  let t = 0
  const update = (dt) => {
    t += dt
    for (const s of swings) { const a = Math.sin(t * s.sp + s.ph) * s.amp; s.sw.rotation.x = a; sit(s.kid, -1.35 + Math.cos(t * s.sp + s.ph) * 0.45, -0.7); s.kid.userData.rig.armL.rotation.z = -0.28; s.kid.userData.rig.armR.rotation.z = 0.28 }
    const sa = Math.sin(t * 1.4) * 0.2; see.rotation.z = sa; see.userData.kids.forEach((k, i) => { k.rotation.z = -sa; sit(k, -1.2 + (i ? 1 : -1) * Math.sin(t * 1.4) * 0.2) })
    // slide kid state machine: climb the ladder, slide down, walk back
    sl.t += dt; const lx = slx + 0.88, lz = slz
    if (sl.state === 'climb') { const u = Math.min(1, sl.t / 2.2); slider.position.set(lx - 0.35 * u, 0.0 + H * u, lz); slider.rotation.y = -PI / 2; pose(slider, 'walk', sl.t * 1.2, { k: 0.6 }); slider.userData.rig.armL.rotation.x = slider.userData.rig.armR.rotation.x = -2.2; if (u >= 1) { sl.state = 'top'; sl.t = 0 } }
    else if (sl.state === 'top') { slider.position.set(slx, H, slz); slider.rotation.y = 0; slider.position.x = THREE.MathUtils.lerp(lx - 0.35, slx, Math.min(1, sl.t / 0.5)); pose(slider, 'idle', sl.t); if (sl.t > 0.9) { sl.state = 'slide'; sl.t = 0 } }
    else if (sl.state === 'slide') { const u = Math.min(1, sl.t / 1.15), e = u * u * (1.6 - 0.6 * u); slider.position.set(slx, H + 0.0 - (H - 0.05) * e - 0.04, slz + 0.33 + 1.25 * e); slider.rotation.set(0, 0, 0); sit(slider, -1.4, -2.4); if (u >= 1) { sl.state = 'walk'; sl.t = 0 } }
    else { const u = Math.min(1, sl.t / 2.6), fx2 = slx, tx = lx - 0.0, p = u < 0.5 ? u / 0.5 : 1; slider.position.set(THREE.MathUtils.lerp(fx2, tx, p), 0, THREE.MathUtils.lerp(slz + 1.58, lz, p)); const dx = tx - fx2, dz = lz - (slz + 1.58); slider.rotation.y = Math.atan2(dx, dz); pose(slider, 'walk', sl.t * 1.3, { k: 0.9 }); if (u >= 1) { sl.state = 'climb'; sl.t = 0 } }
    pose(digger, 'knead', t * 0.9)
    for (const q of runners) { q.a += dt * 1.25; const x = 0.3 + Math.cos(q.a) * q.rx, z = -0.05 + Math.sin(q.a) * q.rz; q.k.position.set(x, 0.0, z); q.k.rotation.y = Math.atan2(-Math.sin(q.a) * q.rx, Math.cos(q.a) * q.rz); pose(q.k, 'walk', t * 1.5, { k: 1.25 }) }
    for (const f of flies) f.update(dt)
  }
  update(0)
  return { g, update }
}

export function makeFeature(kind, seed = 1) {
  const r = rngOf(seed)
  const out = { pond: makePond, well: makeWell, farm: makeFarm, barn: makeBarn, market: makeMarket, playground: makePlayground }[kind](r)
  out.kind = kind; return out
}
