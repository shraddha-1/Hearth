import * as THREE from 'three'

const PI = Math.PI
const SPECIES = {
  monarch: { base: ['#f08a24', '#e0640f'], edge: '#1b1410', vein: '#241a12', dots: '#fff6e6', body: 0x1d1814 },
  swallowtail: { base: ['#f7de52', '#efc02a'], edge: '#171310', vein: '#1b1612', dots: '#4c8fe0', body: 0x1d1814, tail: true },
  morpho: { base: ['#3f86f0', '#1c4fc4'], edge: '#0d1220', vein: '#14203f', dots: '#d6e6ff', body: 0x1a1a22 },
  pink: { base: ['#ffd1e0', '#f08ab0'], edge: '#5a2a3a', vein: '#8a4a62', dots: '#ffffff', body: 0x3a2a30 },
}
const cache = {}
const W = 256, H = 256
// wing outline in wing space: x 0..1 outward, y -0.6..0.6 (forward positive)
const outline = (tail) => {
  const s = new THREE.Shape()
  s.moveTo(0, 0.1)
  s.bezierCurveTo(0.2, 0.56, 0.74, 0.62, 1.0, 0.42)
  s.bezierCurveTo(1.06, 0.22, 0.9, 0.06, 0.7, 0.0)
  if (tail) { s.bezierCurveTo(0.88, -0.1, 0.9, -0.34, 0.74, -0.5); s.bezierCurveTo(0.72, -0.66, 0.6, -0.7, 0.55, -0.52) } else s.bezierCurveTo(0.95, -0.1, 0.86, -0.55, 0.55, -0.55)
  s.bezierCurveTo(0.3, -0.55, 0.12, -0.3, 0, -0.12)
  s.lineTo(0, 0.1)
  return s
}
const px = (x, y) => [x * W, (1 - (y + 0.7) / 1.4) * H]
function wingAssets(name) {
  if (cache[name]) return cache[name]
  const sp = SPECIES[name], c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')
  const grad = g.createRadialGradient(...px(0.05, 0.0), 8, ...px(0.6, 0.1), 190); grad.addColorStop(0, sp.base[1]); grad.addColorStop(0.5, sp.base[0]); grad.addColorStop(1, sp.base[0])
  g.fillStyle = grad; g.fillRect(0, 0, W, H)
  if (name === 'morpho') { const sh = g.createLinearGradient(...px(0.1, 0.4), ...px(0.9, -0.4)); sh.addColorStop(0, 'rgba(120,200,255,.55)'); sh.addColorStop(0.5, 'rgba(60,120,240,0)'); sh.addColorStop(1, 'rgba(120,200,255,.35)'); g.fillStyle = sh; g.fillRect(0, 0, W, H) }
  // veins
  g.strokeStyle = sp.vein; g.lineCap = 'round'
  const vein = (x1, y1, x2, y2, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(...px(x1, y1)); g.lineTo(...px(x2, y2)); g.stroke() }
  for (const [x, y] of [[0.95, 0.42], [0.9, 0.3], [0.78, 0.55], [0.6, 0.5], [0.85, 0.12], [0.8, -0.2], [0.7, -0.45], [0.5, -0.5], [0.3, -0.38]]) vein(0.03, 0.02, x, y, name === 'swallowtail' ? 3.4 : 2.4)
  if (name === 'swallowtail') for (const a of [0.2, 0.4]) { g.lineWidth = 7; g.beginPath(); g.moveTo(...px(a, 0.5)); g.lineTo(...px(a + 0.08, -0.45)); g.stroke() }
  // thick dark margin
  const path = new THREE.Path(outline(sp.tail).getPoints(40)); const pts = path.getPoints()
  g.lineJoin = 'round'; g.lineWidth = name === 'pink' ? 10 : 20; g.strokeStyle = sp.edge; g.beginPath(); pts.forEach((p, i) => { const [a, b] = px(p.x, p.y); i ? g.lineTo(a, b) : g.moveTo(a, b) }); g.closePath(); g.stroke()
  // white / coloured dots along the margin
  g.fillStyle = sp.dots
  for (let i = 0; i < pts.length; i += 2) { const p = pts[i], [a, b] = px(p.x, p.y); const k = (p.x * 0.9 + 0.1), ox = (0.5 - p.x) * 0.0; g.beginPath(); g.arc(a + (127 - a) * 0.075, b + (127 - b) * 0.075, name === 'pink' ? 2 : 3.4, 0, PI * 2); g.fill() }
  if (name === 'monarch') for (const [x, y] of [[0.78, 0.4], [0.9, 0.3], [0.68, 0.46], [0.84, 0.18]]) { g.beginPath(); const [a, b] = px(x, y); g.arc(a, b, 4.5, 0, PI * 2); g.fill() }
  if (name === 'swallowtail') for (const [x, y] of [[0.6, -0.4], [0.7, -0.3]]) { g.fillStyle = '#2f6fd0'; const [a, b] = px(x, y); g.beginPath(); g.arc(a, b, 9, 0, PI * 2); g.fill(); g.fillStyle = '#f08a24'; g.beginPath(); g.arc(a, b, 4, 0, PI * 2); g.fill() }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
  const geo = new THREE.ShapeGeometry(outline(sp.tail), 24), pos = geo.attributes.position, uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), (pos.getY(i) + 0.7) / 1.4)
  geo.rotateX(PI / 2)
  const mat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.75, metalness: name === 'morpho' ? 0.25 : 0, transparent: false })
  return (cache[name] = { geo, mat, sp })
}
const bodyMat = {}
export const BUTTERFLY_KINDS = Object.keys(SPECIES)

/* opts: { cx, cz, rx, rz, y0, y1, scale } wander bounds in the parent's space */
export function makeButterfly(kind, r = Math.random, o = {}) {
  const { geo, mat, sp } = wingAssets(kind), S = (o.scale ?? 0.13), root = new THREE.Group(), fly = new THREE.Group(); root.add(fly)
  const bm = bodyMat[sp.body] ||= new THREE.MeshStandardMaterial({ color: sp.body, roughness: 0.8 })
  const add = (geo, m, x, y, z, p) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); if (p) mesh.rotation.set(...p); mesh.castShadow = false; fly.add(mesh); return mesh }
  add(new THREE.SphereGeometry(0.05, 8, 6), bm, 0, 0, 0.0).scale.set(1, 0.9, 1.5)
  add(new THREE.SphereGeometry(0.03, 7, 5), bm, 0, 0.0, 0.1)
  const ab = add(new THREE.CylinderGeometry(0.022, 0.012, 0.3, 6), bm, 0, -0.01, -0.2, [PI / 2 + 0.1, 0, 0])
  for (const sd of [-1, 1]) { const a = add(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 4), bm, sd * 0.03, 0.06, 0.2, [0.9, 0, sd * 0.35]); const k = add(new THREE.SphereGeometry(0.01, 5, 4), bm, sd * 0.07, 0.13, 0.3) }
  const wings = []
  for (const sd of [-1, 1]) { const pivot = new THREE.Group(); pivot.position.set(sd * 0.02, 0.03, 0); const w = new THREE.Mesh(geo, mat); w.scale.set(sd * 0.55, 1, 0.55); pivot.add(w); fly.add(pivot); wings.push([pivot, sd]) }
  root.scale.setScalar(S)
  const st = { x: (o.cx ?? 0) + (r() - 0.5) * (o.rx ?? 2), z: (o.cz ?? 0) + (r() - 0.5) * (o.rz ?? 2), y: 0.8, head: r() * PI * 2, ph: r() * 10, t: r() * 100, glide: 0, speed: 0.35, yBase: 0, vy: 0 }
  const y0 = o.y0 ?? 0.5, y1 = o.y1 ?? 1.5; st.y = y0 + r() * (y1 - y0); st.yTarget = st.y
  const update = (dt) => {
    st.t += dt; const t = st.t
    // flutter / glide rhythm
    if (st.glide > 0) st.glide -= dt; else if (r() < dt * 0.35) st.glide = 0.5 + r() * 0.7
    const gliding = st.glide > 0, hz = gliding ? 2.2 : 9 + Math.sin(t * 1.3) * 1.5
    st.ph += dt * hz * PI * 2
    const sw = Math.sin(st.ph), a = gliding ? 0.75 + Math.sin(st.ph) * 0.12 : 0.15 + (sw + 0.28 * Math.sin(2 * st.ph + 0.6)) * 0.85
    for (const [p, sd] of wings) p.rotation.z = sd * a
    // wandering heading with smooth erratic changes
    const turn = Math.sin(t * 0.9 + st.ph * 0.0) * 0.9 + Math.sin(t * 2.3 + 1.7) * 0.7 + Math.sin(t * 0.37) * 0.5
    st.head += turn * dt
    // keep inside the ellipse
    const ex = (st.x - (o.cx ?? 0)) / (o.rx ?? 2), ez = (st.z - (o.cz ?? 0)) / (o.rz ?? 2), out = ex * ex + ez * ez
    if (out > 1) { const want = Math.atan2(-(st.x - (o.cx ?? 0)), -(st.z - (o.cz ?? 0))); let d = want - st.head; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; st.head += d * Math.min(1, dt * 2.5) }
    const sp2 = (gliding ? 0.22 : 0.34 + (sw > 0.5 ? 0.12 : 0)) * (o.speed ?? 1)
    st.x += Math.sin(st.head) * sp2 * dt; st.z += Math.cos(st.head) * sp2 * dt
    // altitude: bobbing with each wingbeat, slow drift between targets
    if (Math.abs(st.y - st.yTarget) < 0.05 && r() < dt * 0.4) st.yTarget = y0 + r() * (y1 - y0)
    const vy = THREE.MathUtils.clamp(st.yTarget - st.y, -0.4, 0.4) * 0.6; st.y += (vy + (gliding ? -0.06 : sw * 0.12)) * dt; st.vy = vy
    root.position.set(st.x, st.y, st.z)
    fly.rotation.set(-st.vy * 0.8 + 0.18 + Math.sin(st.ph) * 0.05, st.head, Math.sin(t * 1.1) * 0.12 + turn * 0.08, 'YXZ')
    ab.rotation.x = PI / 2 + 0.1 + Math.sin(st.ph) * 0.12
  }
  update(0)
  return { g: root, update }
}
