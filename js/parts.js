import * as THREE from 'three'
import { Part } from './core.js'

const PI = Math.PI
const grp = (...c) => { const g = new THREE.Group(); c.forEach((x) => x && g.add(x)); return g }
const pick = (r, a) => a[(r() * a.length) | 0]

/* wall with real openings (extruded shape with holes). Outer face on z=0, extruded inward. */
export function wallGeo(L, H, ops, t = 0.16) {
  const s = new THREE.Shape(); s.moveTo(-L / 2, 0); s.lineTo(L / 2, 0); s.lineTo(L / 2, H); s.lineTo(-L / 2, H); s.closePath()
  for (const o of ops) {
    const p = new THREE.Path(), x0 = o.x - o.w / 2, x1 = o.x + o.w / 2, y0 = o.y0, y1 = o.y0 + o.h
    if (o.arch) { const r = o.w / 2; p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1 - r); p.absarc(o.x, y1 - r, r, 0, PI, false); p.lineTo(x0, y0) }
    else { p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.lineTo(x0, y0) }
    s.holes.push(p)
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 8 }); g.translate(0, 0, -t); return g
}

function archShape(w, h, inset = 0) {
  const r = w / 2 - inset, hh = h - w / 2, s = new THREE.Shape()
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hh); s.absarc(0, hh, r, 0, PI, false); s.lineTo(-r, 0); return s
}
function normUV(g, w, h, ox, oy) { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - ox) / w + 0.5, (p.getY(i) - oy) / h + 0.5); return g }

/* ───────── window ───────── origin = opening centre, wall face z=0 */
export function makeWindow(M, o, r) {
  const P = new Part(M), F = new Part(M), { w, h } = o, arch = !!o.arch
  const tm = o.frameMat || M.timber, ft = 0.05, zf = -0.065, hh = arch ? h - w / 2 : h, yb = -h / 2
  const cols = o.cols ?? 2, rows = o.rows ?? 3
  P.box(tm, ft, hh, 0.08, -w / 2 + ft / 2, yb + hh / 2, zf); P.box(tm, ft, hh, 0.08, w / 2 - ft / 2, yb + hh / 2, zf)
  P.box(tm, w, ft, 0.08, 0, yb + ft / 2, zf)
  const gm = o.glass || M.glassList[(r() * 3) | 0]
  if (!arch) { P.box(tm, w, ft, 0.08, 0, h / 2 - ft / 2, zf); P.box(gm, w - ft * 2, h - ft * 2, 0.012, 0, 0, zf - 0.02) }
  else {
    P.geo(tm, new THREE.TorusGeometry(w / 2 - ft / 2, ft / 2 + 0.004, 6, 16, PI), 0, yb + hh, zf, 0, 0, 0, false)
    P.box(gm, w - ft * 2, hh - ft, 0.012, 0, yb + ft + (hh - ft) / 2, zf - 0.02)
    const ag = normUV(new THREE.ShapeGeometry(archShape(w, h, ft), 14), w, w / 2, 0, 0); ag.translate(0, yb + hh - 0.0, 0); P.geo(gm, ag, 0, 0, zf - 0.02, 0, 0, 0, false)
  }
  for (let i = 1; i < cols; i++) P.box(tm, 0.022, hh - ft * 1.5, 0.05, -w / 2 + ft + (i * (w - ft * 2)) / cols, yb + hh / 2, zf + 0.005)
  for (let j = 1; j < rows; j++) P.box(tm, w - ft * 2, 0.022, 0.05, 0, yb + ft + (j * (hh - ft * 1.5)) / rows, zf + 0.005)
  if (arch) P.box(tm, 0.022, w / 2, 0.05, 0, yb + hh + w / 4 - 0.01, zf + 0.005)
  if (o.sill !== false) P.box(o.stoneSill ? M.stoneWarm : tm, w + 0.16, 0.055, 0.15, 0, yb - 0.025, 0.02)
  if (arch) { // carved stone surround + keystone
    P.geo(M.stoneWarm, new THREE.TorusGeometry(w / 2 + 0.05, 0.04, 6, 18, PI), 0, yb + hh, 0.015, 0, 0, 0, false)
    P.box(M.stoneWarm, 0.1, hh, 0.05, -w / 2 - 0.05, yb + hh / 2, 0.01); P.box(M.stoneWarm, 0.1, hh, 0.05, w / 2 + 0.05, yb + hh / 2, 0.01)
    P.box(M.stoneWarm, 0.11, 0.1, 0.07, 0, yb + hh + w / 2 + 0.06, 0.02)
  } else if (o.surround !== false) {
    P.box(tm, w + 0.2, 0.07, 0.09, 0, h / 2 + 0.04, 0.01); P.box(tm, 0.06, h, 0.06, -w / 2 - 0.04, 0, 0.012); P.box(tm, 0.06, h, 0.06, w / 2 + 0.04, 0, 0.012)
    P.box(tm, 0.07, 0.07, 0.1, -w / 2 - 0.08, h / 2 + 0.04, 0.012); P.box(tm, 0.07, 0.07, 0.1, w / 2 + 0.08, h / 2 + 0.04, 0.012) // carved ends
  }
  if (r() < 0.55 && o.curtain !== false) { const side = r() < 0.5 ? -1 : 1; P.box(M.curtain, w * 0.42, h * 0.82, 0.01, side * w * 0.26, 0, zf - 0.045) }
  if (o.shutter != null) {
    const sm = M.shutters[o.shutter % M.shutters.length]
    for (const sd of [-1, 1]) { P.box(sm, w * 0.5, hh + 0.02, 0.03, sd * (w / 2 + w * 0.27 + 0.1), yb + hh / 2, 0.02); for (let k = 1; k < 5; k++) F.box(M.under, w * 0.46, 0.012, 0.012, sd * (w / 2 + w * 0.27 + 0.1), yb + (k * hh) / 5, 0.04) }
  }
  if (o.box) {
    P.box(tm, w + 0.14, 0.1, 0.14, 0, yb - 0.12, 0.1); F.box(M.under, w + 0.1, 0.03, 0.1, 0, yb - 0.065, 0.1)
    for (let i = 0; i < 9; i++) { const x = -w / 2 - 0.03 + (i * (w + 0.06)) / 8; F.sph(r() < 0.3 ? M.leaf2 : pick(r, M.petals), 0.032 + r() * 0.022, x, yb - 0.02 + r() * 0.06, 0.1 + (r() - 0.5) * 0.06, 1, 1, 1, 4) }
    for (let i = 0; i < 6; i++) F.sph(M.leaf, 0.04, -w / 2 + (i * w) / 5, yb - 0.05, 0.14, 1.2, 0.8, 1, 4)
  }
  return grp(P.build(), F.build({ fine: true }))
}

/* ───────── door ───────── origin = bottom centre of opening on wall face */
export function makeDoor(M, o, r) {
  const P = new Part(M), F = new Part(M), { w, h } = o, arch = !!o.arch, tm = o.frameMat || M.timber
  const lm = o.leafMat || M.door || M.planks
  const hh = arch ? h - w / 2 : h
  if (o.type === 'barn') {
    const lw = w / 2 - 0.02
    for (const sd of [-1, 1]) {
      const cx = sd * (w / 4)
      P.box(lm, lw, h - 0.06, 0.06, cx, h / 2, -0.08)
      P.box(tm, 0.08, h - 0.06, 0.07, cx - sd * (lw / 2 - 0.04), h / 2, -0.07); P.box(tm, 0.08, h - 0.06, 0.07, cx + sd * (lw / 2 - 0.04), h / 2, -0.07)
      P.box(tm, lw, 0.09, 0.07, cx, 0.12, -0.065); P.box(tm, lw, 0.09, 0.07, cx, h - 0.12, -0.065)
      const dg = Math.hypot(lw, h - 0.4), ang = Math.atan2(h - 0.4, lw)
      P.box(tm, dg - 0.15, 0.07, 0.07, cx, h / 2, -0.062, 0, 0, sd * ang)
      P.box(M.iron, lw * 0.7, 0.04, 0.012, cx - sd * lw * 0.12, h * 0.8, -0.03); P.box(M.iron, lw * 0.7, 0.04, 0.012, cx - sd * lw * 0.12, h * 0.2, -0.03)
    }
    F.cyl(M.iron, 0.035, 0.035, 0.03, -0.1, h / 2, -0.03, 8, PI / 2); F.cyl(M.iron, 0.035, 0.035, 0.03, 0.1, h / 2, -0.03, 8, PI / 2)
  } else {
    if (arch) {
      const g = new THREE.ExtrudeGeometry(archShape(w, h, 0.06), { depth: 0.06, bevelEnabled: false, curveSegments: 10 }); P.geo(lm, g, 0, 0, -0.12)
      P.geo(o.stoneArch ? M.stoneWarm : tm, new THREE.TorusGeometry(w / 2 - 0.03, 0.045, 6, 18, PI), 0, hh, -0.04, 0, 0, 0, false)
      P.box(M.stoneWarm, 0.12, hh, 0.12, -w / 2 - 0.02, hh / 2, 0.0); P.box(M.stoneWarm, 0.12, hh, 0.12, w / 2 + 0.02, hh / 2, 0.0)
      P.geo(M.stoneWarm, new THREE.TorusGeometry(w / 2 + 0.06, 0.055, 6, 18, PI), 0, hh, 0.0, 0, 0, 0, false)
      P.box(M.stoneWarm, 0.14, 0.13, 0.12, 0, hh + w / 2 + 0.07, 0.01)
      for (let i = 0; i < 5; i++) { const a = (PI * (i + 0.5)) / 5; F.box(M.stoneWarm, 0.1, 0.09, 0.1, Math.cos(a) * (w / 2 + 0.05), hh + Math.sin(a) * (w / 2 + 0.05), 0.0, 0, 0, a - PI / 2) }
    } else {
      P.box(lm, w - 0.1, h - 0.06, 0.06, 0, h / 2, -0.09)
      P.box(tm, 0.07, h, 0.1, -w / 2 - 0.015, h / 2, -0.01); P.box(tm, 0.07, h, 0.1, w / 2 + 0.015, h / 2, -0.01); P.box(tm, w + 0.2, 0.09, 0.12, 0, h + 0.035, 0.0)
      P.box(tm, 0.08, 0.08, 0.13, -w / 2 - 0.07, h + 0.035, 0.0); P.box(tm, 0.08, 0.08, 0.13, w / 2 + 0.07, h + 0.035, 0.0)
    }
    if (o.type === 'glazed') {
      const gm = M.glassC
      for (const sd of [-1, 1]) P.box(gm, w * 0.34, h * 0.42, 0.014, sd * w * 0.22, h * 0.62, -0.06)
      P.box(tm, 0.035, h * 0.42, 0.04, 0, h * 0.62, -0.05); P.box(tm, w * 0.8, 0.035, 0.04, 0, h * 0.62, -0.05); P.box(tm, w * 0.8, 0.05, 0.04, 0, h * 0.42, -0.05); P.box(tm, w * 0.8, 0.05, 0.04, 0, h * 0.83, -0.05)
    } else {
      for (const k of [0.22, 0.74]) { P.box(M.iron, w - 0.16, 0.045, 0.014, 0, h * k, -0.055); F.cyl(M.iron, 0.03, 0.03, 0.02, -w / 2 + 0.1, h * k, -0.05, 8, PI / 2); F.cyl(M.iron, 0.03, 0.03, 0.02, w / 2 - 0.1, h * k, -0.05, 8, PI / 2) }
    }
    const hx = w / 2 - 0.14
    F.box(M.iron, 0.05, 0.14, 0.012, hx, h * 0.48, -0.052); F.geo(M.brass, new THREE.TorusGeometry(0.034, 0.008, 5, 12), hx, h * 0.46, -0.04, 0, 0, 0, false); F.sph(M.brass, 0.018, hx, h * 0.5, -0.04, 1, 1, 1, 4)
  }
  if (o.steps) {
    const sw = w + 0.5
    P.box(M.stoneDark, sw, 0.11, 0.3, 0, -0.055, 0.15); P.box(M.stoneDark, sw + 0.1, 0.11, 0.3, 0, -0.165, 0.38); P.box(M.stoneDark, sw + 0.2, 0.11, 0.3, 0, -0.275, 0.62)
  }
  if (o.hood) { // small tiled porch hood on carved brackets
    const hw = w + 0.55, L = 0.62, a = 0.5
    P.box(M.tilePlane, hw, 0.045, L, 0, h + 0.3 - Math.sin(a) * L * 0.5 + 0.1, Math.cos(a) * L * 0.5, 0, a)
    P.box(M.timber, hw + 0.04, 0.07, 0.05, 0, h + 0.3 - Math.sin(a) * L + 0.12, Math.cos(a) * L)
    for (const sd of [-1, 1]) { P.box(M.timber, 0.06, 0.06, 0.55, sd * (hw / 2 - 0.06), h + 0.07, 0.25, 0, -0.75); P.box(M.timber, 0.05, 0.4, 0.05, sd * (hw / 2 - 0.06), h + 0.1, 0.5) }
  }
  return grp(P.build(), F.build({ fine: true }))
}

/* ───────── balcony ───────── origin = centre of wall face at floor level */
export function makeBalcony(M, o) {
  const P = new Part(M), F = new Part(M), { w } = o, d = o.depth ?? 0.58, tm = M.timber
  P.box(M.timberLight, w, 0.07, d, 0, -0.035, d / 2); P.box(tm, w + 0.06, 0.05, 0.06, 0, -0.065, d)
  for (let i = 0; i < 6; i++) P.box(tm, 0.05, 0.08, d, -w / 2 + 0.1 + (i * (w - 0.2)) / 5, -0.11, d / 2)
  const n = Math.round(w / 0.13)
  for (let i = 0; i <= n; i++) { const x = -w / 2 + 0.04 + (i * (w - 0.08)) / n; F.box(tm, 0.025, 0.4, 0.025, x, 0.22, d - 0.03); }
  for (const sd of [-1, 1]) { const nd = Math.round(d / 0.13); for (let i = 1; i < nd; i++) F.box(tm, 0.025, 0.4, 0.025, sd * (w / 2 - 0.04), 0.22, 0.04 + (i * (d - 0.08)) / nd) }
  P.box(tm, w, 0.05, 0.06, 0, 0.45, d - 0.03); P.box(tm, w, 0.04, 0.045, 0, 0.07, d - 0.03)
  for (const sd of [-1, 1]) { P.box(tm, 0.05, 0.05, d, sd * (w / 2 - 0.03), 0.45, d / 2); P.box(tm, 0.04, 0.04, d, sd * (w / 2 - 0.03), 0.07, d / 2) }
  for (const [x, z] of [[-1, d - 0.03], [1, d - 0.03], [-1, 0.04], [1, 0.04]]) { P.box(tm, 0.07, 0.5, 0.07, x * (w / 2 - 0.035), 0.25, z); F.sph(M.timberLight, 0.04, x * (w / 2 - 0.035), 0.54, z, 1, 1, 1, 4) }
  for (const sd of [-1, 1]) P.box(tm, 0.06, 0.06, d * 1.25, sd * (w / 2 - 0.12), -0.3, d * 0.45, 0, -0.62)
  if (o.pots) for (let i = 0; i < 3; i++) { const x = -w / 2 + 0.2 + i * (w - 0.4) / 2; F.cyl(M.clay, 0.06, 0.045, 0.09, x, 0.5, d - 0.03, 8); F.sph(M.leaf2, 0.07, x, 0.58, d - 0.03, 1, 0.8, 1, 4); F.sph(pick(Math.random, M.petals), 0.035, x, 0.64, d - 0.03, 1, 1, 1, 4) }
  return grp(P.build(), F.build({ fine: true }))
}

/* ───────── striped awning ───────── origin = top attach line on wall (y=0, z=0) */
export function makeAwning(M, w, L = 0.8, a = 0.55) {
  const P = new Part(M), F = new Part(M)
  P.box(M.awning, w, 0.03, L, 0, -Math.sin(a) * L * 0.5, Math.cos(a) * L * 0.5, 0, a)
  P.box(M.awning, w, 0.13, 0.02, 0, -Math.sin(a) * L - 0.06, Math.cos(a) * L)
  for (let i = 0; i <= 8; i++) F.cyl(i % 2 ? M.awning : M.awning, 0.032, 0.032, 0.02, -w / 2 + 0.03 + (i * (w - 0.06)) / 8, -Math.sin(a) * L - 0.15, Math.cos(a) * L, 7, PI / 2)
  P.box(M.timber, w + 0.06, 0.06, 0.06, 0, 0.0, 0.03)
  for (const sd of [-1, 1]) F.box(M.iron, 0.02, 0.02, L * 1.1, sd * (w / 2 - 0.03), -Math.sin(a) * L * 0.5 - 0.02, Math.cos(a) * L * 0.5, 0, a)
  return grp(P.build(), F.build({ fine: true }))
}

/* ───────── hanging sign ───────── */
export function makeSign(M, text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d')
  g.fillStyle = '#e9c98c'; g.fillRect(0, 0, 256, 160); g.strokeStyle = '#6d4425'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 150)
  g.fillStyle = '#4a2c14'; g.font = '700 38px Georgia, serif'; g.textAlign = 'center'; g.fillText(text, 128, 112); g.fillStyle = '#b8742f'; g.beginPath(); g.ellipse(128, 62, 52, 26, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#e9c98c'; g.lineWidth = 5; g.lineCap = 'round'; for (const dx of [-26, 0, 26]) { g.beginPath(); g.moveTo(128 + dx - 8, 70); g.lineTo(128 + dx + 8, 52); g.stroke() }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  const gr = new THREE.Group(), P = new Part(M)
  P.box(M.iron, 0.04, 0.04, 0.62, 0, 0, 0.31); P.box(M.iron, 0.04, 0.04, 0.3, 0, -0.12, 0.08, 0, 0.9)
  P.sph(M.iron, 0.03, 0, 0, 0.62, 1, 1, 1, 4)
  gr.add(P.build())
  const sm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.29, 0.46), [sm, sm, M.timber, M.timber, M.timber, M.timber])
  m.position.set(0, -0.2, 0.44); m.castShadow = true; gr.add(m)
  for (const sd of [-1, 1]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 4), M.iron); ch.position.set(0, -0.04, 0.44 + sd * 0.18); gr.add(ch) }
  gr.userData.swing = m; return gr
}

export function makeLantern(M) {
  const P = new Part(M)
  P.box(M.iron, 0.03, 0.03, 0.26, 0, 0, 0.13); P.box(M.iron, 0.025, 0.12, 0.025, 0, -0.04, 0.02, 0, 0, 0, 0)
  P.box(M.lantern, 0.1, 0.14, 0.1, 0, -0.17, 0.26); P.cyl(M.iron, 0.0, 0.085, 0.07, 0, -0.07, 0.26, 4, 0, PI / 4); P.box(M.iron, 0.11, 0.02, 0.11, 0, -0.26, 0.26)
  return P.build({ cast: false })
}

export function makePot(M, r, big = false) {
  const P = new Part(M), s = big ? 1.4 : 1
  P.cyl(M.clay, 0.1 * s, 0.07 * s, 0.14 * s, 0, 0.07 * s, 0, 9); P.cyl(M.clay, 0.115 * s, 0.1 * s, 0.03 * s, 0, 0.15 * s, 0, 9)
  for (let i = 0; i < 4; i++) P.sph(r() < 0.5 ? M.leaf : M.leaf2, (0.07 + r() * 0.04) * s, (r() - 0.5) * 0.1 * s, (0.2 + r() * 0.08) * s, (r() - 0.5) * 0.1 * s, 1, 0.85, 1, 4)
  for (let i = 0; i < 5; i++) P.sph(pick(r, M.petals), 0.03 * s, (r() - 0.5) * 0.15 * s, (0.27 + r() * 0.1) * s, (r() - 0.5) * 0.15 * s, 1, 1, 1, 4)
  return P.build({ fine: true })
}

export function makeVine(M, h, r) {
  const P = new Part(M)
  for (let i = 0; i < 26; i++) { const t = r(), y = t * h; P.sph(pick(r, [M.leaf, M.leaf2, M.leaf3]), 0.05 + r() * 0.06 * (1 - t * 0.5), (r() - 0.5) * 0.14 + Math.sin(y * 4) * 0.05, y, (r() - 0.2) * 0.1, 1, 0.8, 0.8, 4) }
  for (let i = 0; i < 6; i++) P.sph(pick(r, M.petals), 0.025, (r() - 0.5) * 0.2, r() * h, 0.07, 1, 1, 1, 4)
  return P.build({ fine: true })
}

export function makeBarrel(M, r) {
  const P = new Part(M)
  P.cyl(M.timberLight, 0.17, 0.14, 0.18, 0, 0.09, 0, 10); P.cyl(M.timberLight, 0.2, 0.17, 0.12, 0, 0.24, 0, 10); P.cyl(M.timberLight, 0.17, 0.2, 0.12, 0, 0.36, 0, 10); P.cyl(M.timberLight, 0.14, 0.17, 0.18, 0, 0.51, 0, 10)
  for (const y of [0.06, 0.22, 0.38, 0.54]) P.cyl(M.iron, 0.205, 0.205, 0.022, 0, y, 0, 10)
  return P.build({ fine: true })
}

export function makeColumn(M, h, rad = 0.1) {
  const P = new Part(M)
  P.box(M.stoneWarm, rad * 2.9, 0.12, rad * 2.9, 0, 0.06, 0); P.cyl(M.stoneWarm, rad, rad * 1.12, h - 0.3, 0, 0.12 + (h - 0.3) / 2, 0, 12)
  P.cyl(M.stoneWarm, rad * 1.3, rad * 1.0, 0.1, 0, h - 0.13, 0, 12); P.box(M.stoneWarm, rad * 3, 0.1, rad * 3, 0, h - 0.05, 0)
  return P.build()
}

export function makeClockTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')
  g.fillStyle = '#f6ecd2'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 10; g.stroke()
  g.fillStyle = '#3a2a1a'; g.font = '700 26px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
  for (let i = 1; i <= 12; i++) { const a = (i * PI) / 6 - PI / 2; g.fillText(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][i - 1], 128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92) }
  g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(-1.9) * 56, 128 + Math.sin(-1.9) * 56); g.stroke()
  g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(0.4) * 84, 128 + Math.sin(0.4) * 84); g.stroke()
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}
export { grp, pick, archShape }
