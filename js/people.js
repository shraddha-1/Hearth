import * as THREE from 'three'
const PI = Math.PI
const cache = new Map()
const mat = (hex, rough = 0.85) => { const k = hex + '|' + rough; if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: rough })); return cache.get(k) }
const pick = (r, a) => a[(r() * a.length) | 0]
const SKIN = [0xf2c9a0, 0xe0ac80, 0xc68a5e, 0x8d5a3b, 0xf6d7b8, 0xb87a52, 0xfbe0c8, 0x6b4429, 0x4a2f1f, 0xd8a67a]
const SHIRT = [0xd9692a, 0x3f7fb5, 0x6aa84a, 0xc94f6a, 0xe0b341, 0x8a6bc4, 0xf0e6d2, 0x3f8c8c]
const PANTS = [0x4a3a30, 0x2f4f7a, 0x5b5b66, 0x6a4a35, 0x3a4a3a]
const HAIR = [0x2a1c12, 0x6b4423, 0xc9a14a, 0x8a8a8a, 0xb5502a, 0x111111, 0xe8d9a8, 0xd6d6d6, 0x7a2a1a]
const G = {
  leg: new THREE.CylinderGeometry(0.036, 0.032, 0.3, 6), shoe: new THREE.BoxGeometry(0.07, 0.04, 0.11), torso: new THREE.BoxGeometry(0.2, 0.27, 0.13),
  head: new THREE.SphereGeometry(0.085, 10, 8), arm: new THREE.CylinderGeometry(0.03, 0.026, 0.24, 6), hand: new THREE.SphereGeometry(0.031, 6, 5), eye: new THREE.SphereGeometry(0.01, 4, 3),
}
const add = (parent, geo, m, x = 0, y = 0, z = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh }

function hatFor(kind, head, r) {
  const g = new THREE.Group(); g.position.y = 0.1; head.add(g)
  if (kind === 'chef') { add(g, new THREE.CylinderGeometry(0.075, 0.07, 0.1, 8), mat(0xffffff), 0, 0.07, 0); add(g, new THREE.SphereGeometry(0.1, 8, 6), mat(0xffffff), 0, 0.16, 0) }
  else if (kind === 'straw') { add(g, new THREE.CylinderGeometry(0.17, 0.17, 0.014, 12), mat(0xe2c36b), 0, 0.03, 0); add(g, new THREE.SphereGeometry(0.075, 8, 6, 0, PI * 2, 0, PI / 2), mat(0xe2c36b), 0, 0.035, 0) }
  else if (kind === 'cap') { add(g, new THREE.SphereGeometry(0.092, 8, 6, 0, PI * 2, 0, PI / 2), mat(pick(r, [0x3f7fb5, 0x8a3a2e, 0x4b7a3b])), 0, 0.01, 0); add(g, new THREE.BoxGeometry(0.1, 0.012, 0.07), mat(0x2a2a2a), 0, 0.012, 0.09) }
  else if (kind === 'helmet') { add(g, new THREE.SphereGeometry(0.1, 8, 6, 0, PI * 2, 0, PI / 2), mat(0x9aa0aa, 0.4), 0, 0.0, 0); add(g, new THREE.BoxGeometry(0.02, 0.06, 0.14), mat(0xc43b2d), 0, 0.1, 0) }
  else if (kind === 'hood') { add(g, new THREE.SphereGeometry(0.1, 8, 6, 0, PI * 2, 0, PI * 0.62), mat(0x3f6b4a), 0, 0.0, -0.01) }
  else if (kind === 'bonnet') { add(g, new THREE.SphereGeometry(0.095, 8, 6, 0, PI * 2, 0, PI / 2), mat(0xf4e8d0), 0, 0.0, 0) ; add(g, new THREE.BoxGeometry(0.02, 0.02, 0.2), mat(0xc94f6a), 0, 0.08, 0) }
}

export function makeTool(kind) {
  const g = new THREE.Group(), wood = mat(0x7b5636), iron = mat(0x4a4d55, 0.4)
  const rod = (len, m = wood) => { const c = add(g, new THREE.CylinderGeometry(0.012, 0.012, len, 5), m, 0, len / 2 - 0.05, 0) }
  if (kind === 'hammer') { rod(0.22); add(g, new THREE.BoxGeometry(0.1, 0.055, 0.055), iron, 0, 0.19, 0) }
  else if (kind === 'axe') { rod(0.3); add(g, new THREE.BoxGeometry(0.02, 0.08, 0.09), iron, 0, 0.27, 0.04) }
  else if (kind === 'broom') { rod(0.5); add(g, new THREE.ConeGeometry(0.06, 0.12, 6), mat(0xd2b25a), 0, -0.1, 0) }
  else if (kind === 'can') { add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8), mat(0x4a8ab5, 0.4), 0, 0, 0); add(g, new THREE.CylinderGeometry(0.01, 0.015, 0.1, 5), mat(0x4a8ab5, 0.4), 0.07, 0.03, 0).rotation.z = -0.8 }
  else if (kind === 'spear') { rod(0.7); add(g, new THREE.ConeGeometry(0.02, 0.07, 4), iron, 0, 0.7, 0) }
  else if (kind === 'scroll') { add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.09, 6), mat(0xf4ead2), 0, 0.02, 0).rotation.z = PI / 2 }
  else if (kind === 'dough') { add(g, new THREE.SphereGeometry(0.05, 6, 5), mat(0xf1dcae), 0, 0, 0) }
  return g
}

const HAIRSTYLES = ['short', 'short', 'long', 'bun', 'pony', 'curly', 'bald', 'pig', 'long', 'short']
export function makePerson(o = {}, r = Math.random) {
  const outer = new THREE.Group(), root = new THREE.Group(), rig = {}; outer.add(root)
  const skin = mat(o.skin ?? pick(r, SKIN)), shirt = mat(o.shirt ?? pick(r, SHIRT)), pants = mat(o.pants ?? pick(r, PANTS)), hairC = o.hair ?? pick(r, HAIR), hair = mat(hairC)
  const w = o.build ?? pick(r, [0.86, 0.94, 1, 1, 1.1, 1.24]), h = o.height ?? (0.92 + r() * 0.18), wz = 1 + (w - 1) * 0.7
  const style = o.hairStyle ?? (o.dress ? pick(r, ['long', 'bun', 'pony', 'pig', 'curly', 'long']) : pick(r, HAIRSTYLES))
  root.scale.set(h * (0.96 + (w - 1) * 0.1), h, h * (0.96 + (w - 1) * 0.1))
  for (const sd of [-1, 1]) { const p = new THREE.Group(); p.position.set(sd * 0.05 * w, 0.31, 0); add(p, G.leg, pants, 0, -0.15, 0).scale.set(w, 1, w); add(p, G.shoe, mat(pick(r, [0x2a1f18, 0x2a1f18, 0x6a4a35, 0xe8e2d4])), 0, -0.31, 0.02); root.add(p); rig[sd < 0 ? 'legL' : 'legR'] = p }
  const body = new THREE.Group(); body.position.y = 0.31; root.add(body); rig.body = body
  add(body, G.torso, shirt, 0, 0.135, 0).scale.set(w, 1, wz)
  if (o.apron) add(body, new THREE.BoxGeometry(0.18 * w, 0.2, 0.02), mat(0xf6f1e4), 0, 0.1, 0.075 * wz)
  else if (!o.dress && r() < 0.28) { add(body, new THREE.BoxGeometry(0.205 * w, 0.17, 0.135 * wz), mat(pick(r, [0x6a4a35, 0x3a4a3a, 0x2f4f7a])), 0, 0.09, 0); add(body, new THREE.BoxGeometry(0.01, 0.17, 0.138 * wz), mat(0xe0c070), 0, 0.09, 0.0) }
  if (!o.dress && r() < 0.5) add(body, new THREE.BoxGeometry(0.205 * w, 0.026, 0.135 * wz), mat(0x3a2a20), 0, 0.01, 0)
  if (o.dress) add(body, new THREE.CylinderGeometry(0.1 * w, 0.17 * w, 0.2, 8), shirt, 0, -0.02, 0)
  const head = new THREE.Group(); head.position.set(0, 0.27 + 0.02, 0); body.add(head); rig.head = head
  add(head, G.head, skin, 0, 0.08, 0).scale.setScalar(0.96 + (w - 1) * 0.25)
  const hh = add(head, new THREE.SphereGeometry(0.09, 9, 7, 0, PI * 2, 0, PI * 0.55), hair, 0, 0.09, -0.012); hh.rotation.x = -0.25
  if (style === 'bald') hh.scale.set(0.001, 0.001, 0.001)
  else if (style === 'curly') { hh.scale.setScalar(1.16); for (const [x, y, z] of [[-0.075, 0.1, 0], [0.075, 0.1, 0], [0, 0.16, -0.01], [0, 0.11, -0.07], [-0.055, 0.15, -0.03], [0.055, 0.15, -0.03]]) add(head, new THREE.SphereGeometry(0.04, 6, 5), hair, x, y, z) }
  else if (style === 'long') { add(head, new THREE.BoxGeometry(0.17, 0.24, 0.05), hair, 0, 0.0, -0.065); add(head, new THREE.BoxGeometry(0.02, 0.17, 0.08), hair, -0.085, 0.04, -0.03); add(head, new THREE.BoxGeometry(0.02, 0.17, 0.08), hair, 0.085, 0.04, -0.03) }
  else if (style === 'bun') add(head, new THREE.SphereGeometry(0.05, 7, 6), hair, 0, 0.17, -0.05)
  else if (style === 'pony') { add(head, new THREE.SphereGeometry(0.03, 6, 5), hair, 0, 0.12, -0.1); const t = add(head, new THREE.CylinderGeometry(0.03, 0.012, 0.17, 6), hair, 0, 0.03, -0.12); t.rotation.x = -0.25 }
  else if (style === 'pig') for (const sd of [-1, 1]) { add(head, new THREE.SphereGeometry(0.04, 6, 5), hair, sd * 0.09, 0.115, -0.03); add(head, new THREE.CylinderGeometry(0.02, 0.01, 0.1, 5), hair, sd * 0.1, 0.05, -0.03) }
  if (!o.dress && !o.hat && style !== 'long' && o.beard !== false && (o.beard || r() < 0.2)) add(head, new THREE.BoxGeometry(0.1, 0.055, 0.045), hair, 0, 0.025, 0.06)
  add(head, G.eye, mat(0x1a1a1a), -0.03, 0.09, 0.077); add(head, G.eye, mat(0x1a1a1a), 0.03, 0.09, 0.077)
  if (o.hat && o.hat !== 'none') hatFor(o.hat, head, r)
  for (const sd of [-1, 1]) { const a = new THREE.Group(); a.position.set(sd * 0.125 * w, 0.235, 0); add(a, G.arm, shirt, 0, -0.12, 0); const hd = new THREE.Group(); hd.position.y = -0.25; add(hd, G.hand, skin); a.add(hd); body.add(a); rig[sd < 0 ? 'armL' : 'armR'] = a; rig[sd < 0 ? 'handL' : 'handR'] = hd }
  outer.userData.rig = rig; outer.userData.r = r; return outer
}

/* ───────── poses ───────── */
const ease = (x) => x * x * (3 - 2 * x)
function resetRig(rg) { rg.legL.rotation.set(0, 0, 0); rg.legR.rotation.set(0, 0, 0); rg.armL.rotation.set(0, 0, 0.1); rg.armR.rotation.set(0, 0, -0.1); rg.body.rotation.set(0, 0, 0); rg.body.position.y = 0.31; rg.head.rotation.set(0, 0, 0) }
export function pose(root, mode, t, extra = {}) {
  const rg = root.userData.rig; resetRig(rg)
  switch (mode) {
    case 'walk': { const ph = t * 7.5, k = extra.k ?? 1; rg.legL.rotation.x = Math.sin(ph) * 0.7 * k; rg.legR.rotation.x = -Math.sin(ph) * 0.7 * k; rg.armL.rotation.x = -Math.sin(ph) * 0.6 * k; rg.armR.rotation.x = Math.sin(ph) * 0.6 * k; rg.body.position.y = 0.31 + Math.abs(Math.sin(ph)) * 0.016 * k; rg.body.rotation.z = Math.sin(ph) * 0.03 * k; break }
    case 'hammer': { const s = (t * 1.5) % 1, ang = s < 0.7 ? -0.3 - 1.9 * ease(s / 0.7) : -2.2 + 1.9 * Math.pow((s - 0.7) / 0.3, 2); rg.armR.rotation.x = ang; rg.armL.rotation.x = -0.9; rg.armL.rotation.z = 0.35; rg.body.rotation.x = s > 0.85 ? 0.22 : 0.04; rg.head.rotation.x = 0.25; extra.strike = s > 0.93 && s < 0.99; break }
    case 'chop': { const s = (t * 1.1) % 1, ang = s < 0.65 ? -0.4 - 2.3 * ease(s / 0.65) : -2.7 + 2.3 * Math.pow((s - 0.65) / 0.35, 2); rg.armR.rotation.x = ang; rg.armL.rotation.x = ang * 0.9; rg.body.rotation.x = s > 0.8 ? 0.3 : -0.08 * (s / 0.65); rg.head.rotation.x = 0.2; break }
    case 'knead': { const a = Math.sin(t * 5.5); rg.armL.rotation.x = -1.0 + a * 0.35; rg.armR.rotation.x = -1.0 - a * 0.35; rg.body.rotation.x = 0.16 + a * 0.04; rg.head.rotation.x = 0.35; rg.body.position.y = 0.31 + Math.abs(a) * 0.006; break }
    case 'sweep': { const a = Math.sin(t * 2.6); rg.armL.rotation.x = -0.75; rg.armR.rotation.x = -0.85; rg.armL.rotation.z = 0.15 + a * 0.22; rg.armR.rotation.z = -0.1 + a * 0.22; rg.body.rotation.y = a * 0.3; rg.body.rotation.x = 0.12; rg.head.rotation.x = 0.3; rg.legL.rotation.x = Math.max(0, a) * 0.2; rg.legR.rotation.x = Math.max(0, -a) * 0.2; break }
    case 'water': { const a = Math.sin(t * 1.4); rg.armR.rotation.x = -1.2 - 0.2 * a; rg.armL.rotation.x = 0.3 * Math.sin(t * 1.4 + 1); rg.body.rotation.y = a * 0.35; rg.head.rotation.x = 0.3; break }
    case 'wave': { rg.armR.rotation.x = -PI + 0.5; rg.armR.rotation.z = -0.2 + Math.sin(t * 7) * 0.45; rg.armL.rotation.z = 0.12; rg.head.rotation.y = Math.sin(t * 1.2) * 0.2; rg.body.position.y = 0.31 + Math.sin(t * 2) * 0.004; break }
    case 'idle': default: { rg.body.scale.y = 1 + Math.sin(t * 2) * 0.012; rg.head.rotation.y = Math.sin(t * 0.9) * 0.45; rg.armL.rotation.x = Math.sin(t * 1.1) * 0.05; break }
  }
}

/* ───────── workers: stationary jobs next to a building ───────── */
const TOOLS = { hammer: ['handR', 'hammer'], axe: ['handR', 'axe'], broom: ['handR', 'broom'], can: ['handR', 'can'], spear: ['handR', 'spear'], scroll: ['handL', 'scroll'], dough: ['handL', 'dough'] }
function station(b) {
  const bl = b.S.blocks[0], f = bl.shape === 'oct' ? bl.a : bl.d / 2
  switch (b.type) {
    case 'cottage': return [{ job: 'water', x: 0.95, z: f + 0.65, ry: 0.5, tool: 'can', hat: 'straw', apron: true }]
    case 'manor': return [{ job: 'sweep', x: -1.35, z: f + 0.6, ry: 0.3, tool: 'broom', hat: 'bonnet', dress: true }]
    case 'tower': return [{ job: 'guard', x: 1.0, z: f + 0.5, ry: 0.2, tool: 'spear', hat: 'helmet', shirt: 0x7a7f8a }]
    case 'bakery': return [{ job: 'knead', x: -0.75, z: f + 0.72, ry: 0, hat: 'chef', apron: true, table: true }, { job: 'wave', x: 1.85, z: f + 0.7, ry: -0.5, hat: 'none', dress: true }]
    case 'workshop': return [{ job: 'hammer', x: 2.3, z: 0.62, ry: PI, tool: 'hammer', apron: true, hat: 'cap' }, { job: 'chop', x: 1.45, z: f + 0.95, ry: PI, tool: 'axe', hat: 'cap' }]
    case 'townhall': return [{ job: 'pace', x: -1.9, z: f + 0.6, ry: 0.1, tool: 'scroll', hat: 'none', shirt: 0x7a2f35 }, { job: 'wave', x: 1.9, z: f + 0.55, ry: -0.2, hat: 'none', dress: true }]
  }
  return []
}
export function spawnWorkers(b, r) {
  const out = []
  for (const s of station(b)) {
    const p = makePerson({ hat: s.hat, apron: s.apron, dress: s.dress, shirt: s.shirt }, r), rg = p.userData.rig
    if (s.tool) { const [hand, kind] = TOOLS[s.tool] ? TOOLS[s.tool] : ['handR', s.tool]; const tool = makeTool(s.tool); tool.rotation.x = s.tool === 'broom' || s.tool === 'spear' ? 0 : PI / 2; tool.position.z = 0.02; rg[hand].add(tool); p.userData.tool = tool }
    if (s.job === 'chop') p.userData.tool.rotation.x = PI / 2 + 0.1
    if (s.table) { const t = new THREE.Group(); const top = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.3), mat(0xb88a5a)); top.position.set(0, 0.39, 0.3); top.castShadow = true; t.add(top); for (const [x, z] of [[-0.2, 0.18], [0.2, 0.18], [-0.2, 0.42], [0.2, 0.42]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.38, 0.035), mat(0x6b4a35)); l.position.set(x, 0.19, z); t.add(l) } for (let i = 0; i < 4; i++) { const lo = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), mat(0xd9a45a)); lo.scale.set(1.5, 0.8, 1); lo.position.set(-0.17 + i * 0.11, 0.45, 0.3); t.add(lo) } p.add(t) }
    let spark = null
    if (s.job === 'hammer') { spark = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true })); spark.position.set(0, 0.42, 0.34); spark.visible = false; p.add(spark) }
    p.position.set(s.x, 0, s.z); p.rotation.y = s.ry; p.visible = false
    out.push({ p, job: s.job, t: r() * 10, spark, base: new THREE.Vector3(s.x, 0, s.z), ry: s.ry, sparkT: 0 })
  }
  return out
}
export function updateWorker(w, dt) {
  w.t += dt; const p = w.p
  if (w.job === 'guard' || w.job === 'pace') {
    const ph = w.t * 0.45, vx = Math.cos(ph), x = Math.sin(ph) * (w.job === 'guard' ? 0.35 : 0.7)
    p.position.x = w.base.x + x; const moving = Math.abs(vx) > 0.25
    p.rotation.y = w.ry + (vx > 0 ? 1 : -1) * 0.9 * (moving ? 1 : 0.0) + (moving ? 0 : Math.sin(w.t * 0.8) * 0.5)
    pose(p, moving ? 'walk' : 'idle', w.t, { k: 0.8 }); return
  }
  const ex = {}; pose(p, w.job, w.t, ex)
  if (w.spark) { if (ex.strike) w.sparkT = 0.22; w.sparkT = Math.max(0, w.sparkT - dt); w.spark.visible = w.sparkT > 0; w.spark.scale.setScalar(0.6 + (1 - w.sparkT / 0.22) * 1.8); w.spark.material.opacity = w.sparkT / 0.22 }
}

/* ───────── wanderers: villagers strolling the meadow ───────── */
export class Crowd {
  constructor(scene, blocked, limit) { this.scene = scene; this.blocked = blocked; this.limit = limit; this.list = []; this.r = Math.random }
  setCount(n) {
    while (this.list.length < n) this.add()
    while (this.list.length > n) { const w = this.list.pop(); this.scene.remove(w.p) }
  }
  add() {
    const r = this.r, hats = ['none', 'straw', 'cap', 'hood', 'bonnet', 'none'], dress = r() < 0.35
    const p = makePerson({ hat: pick(r, hats), dress, apron: r() < 0.2 }, r)
    let x = 0, z = 0, k = 0; do { const a = r() * PI * 2, d = 3 + r() * (this.limit - 2); x = Math.cos(a) * d; z = Math.sin(a) * d } while (this.blocked(x, z) && k++ < 40)
    p.position.set(x, 0, z); this.scene.add(p)
    const w = { p, state: 'wait', t: r() * 3, wait: r() * 2, tx: x, tz: z, mode: 'idle', speed: 0.55 + r() * 0.3, tt: r() * 10 }; this.list.push(w)
  }
  update(dt) {
    for (const w of this.list) {
      const p = w.p; w.tt += dt
      if (w.state === 'wait') {
        w.t += dt; pose(p, w.mode, w.tt)
        if (w.t > w.wait) { // pick new target
          let k = 0, x, z; do { const a = Math.random() * PI * 2, d = 2 + Math.random() * (this.limit + 1); x = Math.cos(a) * d; z = Math.sin(a) * d } while (this.blocked(x, z) && k++ < 30)
          w.tx = x; w.tz = z; w.state = 'walk'; w.stuck = 0
        }
      } else {
        const dx = w.tx - p.position.x, dz = w.tz - p.position.z, d = Math.hypot(dx, dz)
        if (d < 0.15 || w.stuck > 0.8) { w.state = 'wait'; w.t = 0; w.wait = 1.5 + Math.random() * 4; w.mode = ['idle', 'wave', 'idle', 'sweepless'][(Math.random() * 3) | 0]; if (w.mode === 'sweepless') w.mode = 'idle'; continue }
        const sp = w.speed * dt, nx = p.position.x + (dx / d) * sp, nz = p.position.z + (dz / d) * sp
        if (this.blocked(nx, nz)) { // slide along obstacles, otherwise give up soon
          if (!this.blocked(nx, p.position.z)) p.position.x = nx; else if (!this.blocked(p.position.x, nz)) p.position.z = nz; else w.stuck += dt
        } else { p.position.x = nx; p.position.z = nz; w.stuck = 0 }
        const want = Math.atan2(dx, dz); let da = want - p.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); p.rotation.y += da * Math.min(1, dt * 6)
        pose(p, 'walk', w.tt, { k: 1 })
      }
    }
  }
}
