import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Part } from './core.js'
import { makeWindow, wallGeo, grp, pick } from './parts.js'

const PI = Math.PI
const capCache = new Map()
const capMat = (hex) => { if (!capCache.has(hex)) capCache.set(hex, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.7 })); return capCache.get(hex) }
let _tileGeo
const tileGeo = () => (_tileGeo ??= new RoundedBoxGeometry(0.2, 0.034, 0.18, 2, 0.012))
const shade = (r, kind) => { const v = kind === 'eave' ? 0.52 : kind === 'ridge' ? 0.78 : r() < 0.1 ? 0.62 : 0.84 + r() * 0.26; return new THREE.Color(v, v, v) }
const jitter0 = (hex, r, amt = 0.1) => { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h + (r() - 0.5) * 0.025, Math.min(1, hsl.s * (0.9 + r() * 0.2)), Math.max(0.05, hsl.l * (1 + (r() - 0.5) * amt * 2))); return c }

function strut(P, mat, x, a, b, th, dep) { // box between two (z,y) points on the plane x=const
  const dz = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dz, dy)
  P.box(mat, dep, th, len, x, (a[1] + b[1]) / 2, (a[0] + b[0]) / 2, 0, -Math.atan2(dy, dz))
}

/** Steep, asymmetric gable roof with real instanced tiles, rafters, bargeboards, optional chimney / dormers. Ridge along local x, front = +z. */
export function makeGableRoof(M, r, o) {
  const { L, S, pitch = 1.1, asym = 0.1, ov = 0.3, og = 0.24, palette = [0xc9561f, 0xd9702a, 0xb4471a, 0xe08a3a], gableMat = M.plaster, roundWin = false, chimney = null, dormers = [], timbered = true, finial = true } = o
  const eY = -0.1, rr = S / 2 + ov, zr = asym * S, hr = eY + pitch * (rr - zr), Lx = L + og * 2
  const mk = (sgn) => {
    const ez = sgn * rr, dz = zr - ez, dy = hr - eY, len = Math.hypot(dz, dy), U = [dz / len, dy / len]
    const N = sgn > 0 ? [U[1], -U[0]] : [-U[1], U[0]], phi = sgn > 0 ? Math.asin(U[1]) : -Math.asin(U[1])
    return { sgn, ez, len, U, N, phi, slope: dy / Math.abs(dz), pt: (s, off = 0) => [ez + U[0] * s + N[0] * off, eY + U[1] * s + N[1] * off] }
  }
  const F = mk(1), B = mk(-1)
  const group = new THREE.Group(), shell = new Part(M), frame = new Part(M), fine = new Part(M)
  // underlay + ridge cap
  for (const p of [F, B]) { const c = p.pt(p.len / 2, -0.02); shell.box(M.under, Lx, 0.05, p.len + 0.06, 0, c[1], c[0], 0, p.phi) }
  shell.cyl(M.capA, 0.09, 0.1, Lx + 0.08, 0, hr + 0.035, zr, 7, 0, 0, PI / 2)
  for (let i = 0; i < 14; i++) fine.box(M.capB, 0.012, 0.03, 0.2, -Lx / 2 + 0.2 + (i * (Lx - 0.4)) / 13, hr + 0.1, zr)
  // fascia + rafter tails
  for (const p of [F, B]) {
    frame.box(M.timber, Lx, 0.12, 0.045, 0, eY - 0.06, p.ez + p.sgn * 0.02)
    for (let x = -L / 2 + 0.15; x <= L / 2 - 0.1; x += 0.42) { const zc = p.sgn * (S / 2 - 0.1 + rr) / 2, y = eY - 0.1 + (rr - Math.abs(zc)) * p.slope; frame.box(M.timber, 0.07, 0.1, ov + 0.1, x, y, zc, 0, p.phi); fine.box(M.timber, 0.07, 0.05, 0.05, x, y - 0.03, p.sgn * (rr - 0.03)) }
  }
  // gable end walls + timbering + bargeboards
  const yF = eY + (rr - S / 2) * F.slope, yB = eY + (rr - S / 2) * B.slope
  const gshape = (m) => { const s = new THREE.Shape(), z = (v) => v * m; s.moveTo(z(-S / 2), 0); s.lineTo(z(S / 2), 0); s.lineTo(z(S / 2), yF); s.lineTo(z(zr), hr); s.lineTo(z(-S / 2), yB); s.closePath(); return s }
  for (const sd of [1, -1]) {
    const g = new THREE.ExtrudeGeometry(gshape(sd), { depth: 0.14, bevelEnabled: false }); const k = gableMat.userData.k || 1, uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k)
    shell.geo(gableMat, g, sd * L / 2, 0, 0, 0, -sd * PI / 2, 0, false)
    const xe = sd * (L / 2 + 0.02)
    if (timbered) {
      frame.box(M.timber, 0.06, 0.1, S + 0.1, xe, 0.04, 0); frame.box(M.timber, 0.06, hr - 0.05, 0.1, xe, (hr - 0.05) / 2, zr)
      const yc = hr * 0.5; strut(frame, M.timber, xe, [zr, yc], [-S / 2 + 0.05, 0.05], 0.08, 0.06); strut(frame, M.timber, xe, [zr, yc], [S / 2 - 0.05, 0.05], 0.08, 0.06)
      const cw = S * 0.36; frame.box(M.timber, 0.06, 0.08, cw * 2, xe, hr * 0.62, zr)
    }
    for (const p of [F, B]) { const c = p.pt(p.len / 2, 0.035); frame.box(M.timberLight, 0.055, 0.19, p.len + 0.14, sd * (L / 2 + og - 0.02), c[1], c[0], 0, p.phi); const e = p.pt(0.02, -0.1); fine.sph(M.timberLight, 0.045, sd * (L / 2 + og - 0.02), e[1], e[0], 0.8, 1.4, 1, 4) }
    if (roundWin && hr > 1.2) { const yw = hr * 0.38; frame.geo(M.timber, new THREE.TorusGeometry(0.17, 0.035, 6, 16), sd * (L / 2 + 0.03), yw, zr, 0, PI / 2, 0, false); shell.geo(M.glassC, new THREE.CircleGeometry(0.15, 14), sd * (L / 2 + 0.005), yw, zr, 0, sd * PI / 2, 0, false); frame.box(M.timber, 0.03, 0.3, 0.025, sd * (L / 2 + 0.03), yw, zr); frame.box(M.timber, 0.03, 0.025, 0.3, sd * (L / 2 + 0.03), yw, zr) }
    if (finial) { frame.cyl(M.timberLight, 0.014, 0.03, 0.3, sd * (L / 2 + og), hr + 0.06, zr, 6); frame.sph(M.brass, 0.038, sd * (L / 2 + og), hr + 0.24, zr, 1, 1.3, 1, 4) }
  }
  // instanced tiles, ordered eave -> ridge so they can "assemble"
  const tiles = []
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1)
  const half = 0.5
  for (const p of [F, B]) {
    const rows = Math.ceil(p.len / 0.125), cols = Math.ceil(Lx / 0.2), mesh = new THREE.InstancedMesh(tileGeo(), M.tileInst, rows * (cols + 1))
    let n = 0
    for (let i = 0; i < rows; i++) {
      const s = ((i + 0.5) * p.len) / rows, c = p.pt(s, 0.024 + (i % 2) * 0.006)
      for (let j = 0; j <= cols; j++) {
        const x = -Lx / 2 + (j + 0.5 + (i % 2 ? half : 0)) * (Lx / cols) - (i % 2 ? Lx / cols : 0) * 0 - (i % 2 ? 0.0 : 0)
        if (x > Lx / 2 + 0.02) continue
        e.set(p.phi + p.sgn * 0.06, 0, 0, 'YXZ'); q.setFromEuler(e); v.set(Math.min(x, Lx / 2 - 0.05), c[1], c[0]); sc.set(1, 1, 0.98 + r() * 0.06); m4.compose(v, q, sc)
        mesh.setMatrixAt(n, m4); mesh.setColorAt(n, shade(r, i === 0 ? 'eave' : i === rows - 1 ? 'ridge' : '')); n++
      }
    }
    mesh.count = n; mesh.userData.total = n; mesh.castShadow = true; mesh.receiveShadow = true; tiles.push(mesh); group.add(mesh)
  }
  // chimney
  let chimneyG = null, anchor = null
  if (chimney) {
    const P = new Part(M), cw = 0.4, zc = chimney.z ?? zr - 0.5, xc = chimney.x, pl = zc < zr ? B : F
    const hPlane = hr - (zr - zc) * pl.slope * (zc < zr ? 1 : 0) - (zc >= zr ? (zc - zr) * pl.slope : 0)
    const b0 = hPlane - 0.55, top = Math.max(hPlane, hr) + 0.6, hh = top - b0
    P.box(M.stone, cw, hh, cw, 0, b0 + hh / 2, 0)
    for (const y of [b0 + hh * 0.38, b0 + hh * 0.72]) P.box(M.stoneDark, cw + 0.05, 0.05, cw + 0.05, 0, y, 0)
    P.box(M.stoneDark, cw + 0.12, 0.08, cw + 0.12, 0, top + 0.04, 0); P.box(M.stoneDark, cw + 0.04, 0.05, cw + 0.04, 0, top + 0.1, 0)
    for (const sx of [-1, 1]) { P.cyl(M.clay, 0.06, 0.072, 0.2, sx * 0.09, top + 0.2, 0, 8) ; P.cyl(M.clay, 0.08, 0.06, 0.04, sx * 0.09, top + 0.32, 0, 8) }
    chimneyG = P.build(); chimneyG.position.set(xc, 0, zc); anchor = new THREE.Object3D(); anchor.position.set(0, top + 0.34, 0); chimneyG.add(anchor); group.add(chimneyG)
  }
  // dormers on the front slope
  const dg = []
  for (const d of dormers) {
    const P = new Part(M), Fi = new Part(M), zd = d.z ?? S / 2 - 0.12, yd = eY + (rr - zd) * F.slope, hd = 0.62, yb = yd - 0.18, ytop = yb + hd
    P.geo(gableMat, wallGeo(0.72, hd, [{ x: 0, w: 0.34, h: 0.4, y0: 0.11, arch: false }], 0.1), 0, yb, 0.05, 0, 0, 0); P.box(gableMat, 0.06, hd, 0.62, -0.33, yb + hd / 2, -0.3); P.box(gableMat, 0.06, hd, 0.62, 0.33, yb + hd / 2, -0.3)
    const tri = new THREE.Shape(); tri.moveTo(-0.36, 0); tri.lineTo(0.36, 0); tri.lineTo(0, 0.28); tri.closePath()
    P.geo(gableMat, new THREE.ExtrudeGeometry(tri, { depth: 0.08, bevelEnabled: false }), 0, ytop, -0.04, 0, 0, 0, false)
    const a = 0.62, run = 0.4, w2 = Math.hypot(run, 0.28)
    for (const sd of [-1, 1]) { P.box(M.tilePlane, w2 + 0.04, 0.04, 0.86, sd * run / 2, ytop + 0.15, -0.33, 0, 0, -sd * a); frame.box(M.timberLight, 0.04, 0.1, w2, sd * (run / 2 + 0.02), ytop + 0.15, 0.1, 0, 0, -sd * a) }
    P.cyl(M.capA, 0.03, 0.03, 0.9, 0, ytop + 0.3, -0.33, 6, PI / 2)
    P.box(M.timber, 0.76, 0.05, 0.05, 0, yb + hd + 0.02, 0.05); P.box(M.timber, 0.05, hd, 0.05, -0.36, yb + hd / 2, 0.04); P.box(M.timber, 0.05, hd, 0.05, 0.36, yb + hd / 2, 0.04)
    const g = grp(P.build()); const wn = makeWindow(M, { w: 0.34, h: 0.4, cols: 2, rows: 2, surround: false, sill: false, curtain: true }, r); wn.position.set(0, yb + 0.11 + 0.2, 0.05); g.add(wn)
    g.position.set(d.x, 0, zd); dg.push(g); group.add(g)
  }
  const shellG = shell.build(), frameG = frame.build(), fineG = fine.build({ fine: true })
  group.add(shellG, frameG, fineG)
  return { group, tiles, hr, shellG, frameG, fineG, chimney: chimneyG, anchor, dormers: dg, F, B, S, L, rr, zr, sub: [] }
}

/** Octagonal tower crown: machicolation, crenellations and a tiled conical roof. a = wall apothem. */
export function makeConeRoof(M, r, o) {
  const { a, H = 1.9, palette = [0xc9561f, 0xd9702a, 0xb4471a, 0xe08a3a] } = o
  const Rc = a / Math.cos(PI / 8), Lp = 2 * a * Math.tan(PI / 8), group = new THREE.Group(), P = new Part(M), Pm = new Part(M)
  P.cyl(M.stoneDark, Rc * 1.1, Rc * 1.02, 0.17, 0, 0.02, 0, 8, 0, PI / 8)
  for (let k = 0; k < 8; k++) {
    const ph = (k * PI) / 4, sx = Math.sin(ph), sz = Math.cos(ph), tx = Math.cos(ph), tz = -Math.sin(ph)
    for (const t of [-0.33, 0, 0.33]) { P.box(M.stoneDark, 0.13, 0.22, 0.15, sx * (a + 0.02) + tx * t, -0.1, sz * (a + 0.02) + tz * t, ph); P.box(M.stoneDark, 0.1, 0.1, 0.12, sx * (a + 0.02) + tx * t, -0.22, sz * (a + 0.02) + tz * t, ph, 0, 0) }
    P.box(M.stone, Lp * 1.2, 0.2, 0.13, sx * a * 1.1, 0.21, sz * a * 1.1, ph)
    for (const t of [-0.34, 0, 0.34]) Pm.box(M.stoneDark, 0.22, 0.2, 0.15, sx * a * 1.1 + tx * t, 0.42, sz * a * 1.1 + tz * t, ph)
  }
  const y0 = 0.1, Rb = Rc * 0.96, slant = Math.hypot(H, Rb), cone = new THREE.Mesh(new THREE.CylinderGeometry(0.02, Rb, H, 24), M.under); cone.position.y = y0 + H / 2; cone.castShadow = true; group.add(cone)
  const rows = Math.ceil(slant / 0.12), phi = Math.atan2(H, Rb), tilesArr = []
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1)
  const list = []
  for (let i = 0; i < rows; i++) { const t = (i + 0.5) / rows, rad = Rb * (1 - t), cnt = Math.max(6, Math.ceil((2 * PI * rad) / 0.19)); for (let j = 0; j < cnt; j++) list.push([i, t, rad, ((j + (i % 2) * 0.5) * 2 * PI) / cnt, cnt]) }
  const mesh = new THREE.InstancedMesh(tileGeo(), M.tileInst, list.length)
  list.forEach(([i, t, rad, th, cnt], n) => {
    const off = 0.03, rr2 = rad + off * Math.sin(phi) * 0.4; e.set(phi, th, 0, 'YXZ'); q.setFromEuler(e)
    v.set(Math.sin(th) * (rad + Math.cos(phi) * 0.03), y0 + t * H + Math.sin(phi) * 0.03, Math.cos(th) * (rad + Math.cos(phi) * 0.03)); sc.set(Math.min(1, (rad * 2 * PI / cnt) / 0.2 * 1.1 + 0.15) , 1, 1); m4.compose(v, q, sc)
    mesh.setMatrixAt(n, m4); mesh.setColorAt(n, shade(r, i === 0 ? 'eave' : ''))
  })
  mesh.count = mesh.userData.total = list.length; mesh.castShadow = mesh.receiveShadow = true; group.add(mesh); tilesArr.push(mesh)
  const fine = new Part(M)
  fine.cyl(M.timberLight, 0.018, 0.03, 0.5, 0, y0 + H + 0.2, 0, 6); fine.sph(M.brass, 0.06, 0, y0 + H + 0.1, 0, 1, 0.8, 1, 5); fine.sph(M.brass, 0.04, 0, y0 + H + 0.5, 0, 1, 1.2, 1, 4)
  fine.box(M.cloth, 0.3, 0.17, 0.012, 0.16, y0 + H + 0.36, 0)
  group.add(P.build(), Pm.build(), fine.build())
  return { group, tiles: tilesArr, hr: H, chimney: null, anchor: null, dormers: [], sub: [], shellG: null, frameG: null }
}

/** Pyramid roof for clock-tower caps */
export function makePyramid(M, r, w, h, palette) {
  const group = new THREE.Group(), P = new Part(M)
  P.cyl(M.under, 0.01, w * 0.75, h, 0, h / 2, 0, 4, 0, PI / 4)
  const rows = Math.ceil(h / 0.12), list = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1)
  const phi = Math.atan2(h, w / 2)
  for (let i = 0; i < rows; i++) { const t = (i + 0.5) / rows, half = (w / 2) * (1 - t), cnt = Math.max(2, Math.ceil((half * 2) / 0.19)); for (let side = 0; side < 4; side++) for (let j = 0; j < cnt; j++) { const u = (-half + ((j + 0.5) * 2 * half) / cnt); list.push([i, t, half, side, u]) } }
  const mesh = new THREE.InstancedMesh(tileGeo(), M.tileInst, list.length)
  list.forEach(([i, t, half, side, u], n) => { const yaw = (side * PI) / 2; const px = u, pz = half + 0.02, pos = new THREE.Vector3(px, t * h + 0.02, pz).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw); e.set(phi, yaw, 0, 'YXZ'); q.setFromEuler(e); sc.set(Math.min(1, half * 2 / Math.max(2, Math.ceil(half * 2 / 0.19)) / 0.2 + 0.1), 1, 1); m4.compose(pos, q, sc); mesh.setMatrixAt(n, m4); mesh.setColorAt(n, shade(r, i === 0 ? 'eave' : '')) })
  mesh.castShadow = true; group.add(mesh, P.build())
  const f = new Part(M); f.cyl(M.timberLight, 0.015, 0.025, 0.4, 0, h + 0.15, 0, 5); f.sph(M.brass, 0.045, 0, h + 0.3, 0, 1, 1.3, 1, 4); group.add(f.build())
  return group
}
