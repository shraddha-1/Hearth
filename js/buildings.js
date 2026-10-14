import * as THREE from 'three'
import { Part, rngOf } from './core.js'
import { wallGeo, makeWindow, makeDoor, makeBalcony, makeAwning, makeSign, makeLantern, makePot, makeVine, makeBarrel, makeColumn, makeClockTexture, grp, pick } from './parts.js'
import { makeGableRoof, makeConeRoof, makePyramid } from './roofs.js'

const PI = Math.PI, FH = 0.32 // foundation height
const win = (x, o = {}) => ({ kind: 'win', x, w: 0.5, h: 0.64, y0: 0.58, ...o })
const door = (x, o = {}) => ({ kind: 'door', x, w: 0.64, h: 1.1, y0: 0.02, ...o })
const balc = (x, o = {}) => ({ kind: 'balc', x, w: 0.6, h: 1.04, y0: 0.02, ...o })

/* ─────────────────────── style definitions ─────────────────────── */
export const STYLES = {
  cottage: {
    name: 'Forest cottage', blurb: 'Cream plaster, dark timber, orange tiles', start: 2, max: 3,
    blocks: [{ w: 3.2, d: 2.7, H: 1.45, ox: 0, oz: 0, wall: 'plaster', frame: 'timber', axis: 'x',
      ops: (s, lv) => {
        if (s === 0) return lv === 0 ? [door(-0.55, { type: 'plank', steps: true, hood: true }), win(0.85, { box: true, shutter: 0 })] : lv === 1 ? [balc(-0.55, { balc: { w: 1.15, pots: true } }), win(0.85, { box: true, shutter: 0 })] : [win(-0.55, { shutter: 1 }), win(0.85, { shutter: 0 })]
        if (s === 1) return [win(-0.8, { box: lv === 0 }), win(0.8, { box: lv === 0 })]
        return [win(0, { shutter: s === 2 ? 2 : 1, box: lv === 0 })]
      } }],
    roof: (B, blk, n, r) => makeGableRoof(B.M, r, { L: blk.w, S: blk.d, pitch: 1.2, asym: 0.1, ov: 0.3, og: 0.26, roundWin: true, chimney: { x: 0.95 }, dormers: n >= 2 ? [{ x: -0.55 }, { x: 0.85 }] : [] }),
    decor: (fl, B, r) => {
      const M = B.M
      if (fl.level === 0) { fl.put(makeLantern(M), 0, -0.05, 1.02, 0); fl.put(makePot(M, r, true), 0, -1.3, -FH, 0.34); fl.put(makePot(M, r), 0, 0.2, -FH, 0.3); fl.put(makeBarrel(M, r), 3, 0.7, -FH, 0.3) }
      if (fl.level < 2) fl.put(makeVine(M, fl.H * 0.95, r), 0, -1.5, 0, 0.07)
    } },

  manor: {
    name: 'Fantasy manor', blurb: 'Wings, balconies and carved gables', start: 2, max: 4,
    blocks: [
      { w: 4.4, d: 3.0, H: 1.5, ox: 0, oz: 0.0, wall: 'plasterWarm', frame: 'timber', axis: 'x', floors: (n) => n,
        ops: (s, lv) => {
          if (s === 0) { const wn = (x) => win(x, { w: 0.44, h: 0.78, arch: true, shutter: Math.abs(x) > 1.5 ? 1 : undefined, box: lv === 0, y0: 0.55 }); return lv === 0 ? [door(0, { w: 0.84, h: 1.34, arch: true, stoneArch: true, type: 'plank', steps: true }), wn(-1.15), wn(1.15), wn(-1.8), wn(1.8)] : lv === 1 ? [balc(0, { w: 0.66, h: 1.14, arch: true, balc: { w: 1.5, pots: true } }), wn(-1.15), wn(1.15), wn(-1.8), wn(1.8)] : [win(0, { w: 0.5, h: 0.8, arch: true }), wn(-1.15), wn(1.15), wn(-1.8), wn(1.8)] }
          if (s === 1) return [win(-1.2, { w: 0.46, h: 0.76, arch: true }), win(0, { w: 0.46, h: 0.76, arch: true }), win(1.2, { w: 0.46, h: 0.76, arch: true })]
          if (s === 3) return [win(0, { w: 0.46, h: 0.76, arch: true, shutter: 1 })]
          return []
        } },
      { w: 2.0, d: 3.5, H: 1.5, ox: 3.1, oz: -0.2, wall: 'plasterWarm', frame: 'timber', axis: 'z', floors: (n) => Math.max(1, n - 1),
        ops: (s, lv) => {
          if (s === 0) return [win(0, { w: 0.46, h: 0.76, arch: true, shutter: 1, box: lv === 0 })]
          if (s === 1) return [win(0, { w: 0.46, h: 0.76, arch: true })]
          if (s === 2) return [win(-0.95, { w: 0.46, h: 0.76, arch: true, shutter: 1 }), win(0.95, { w: 0.46, h: 0.76, arch: true, shutter: 1 })]
          return []
        } }],
    roof: (B, blk, n, r, bi) => {
      if (bi === 1) return makeGableRoof(B.M, r, { L: blk.d, S: blk.w, pitch: 1.05, asym: -0.12, ov: 0.28, og: 0.24, roundWin: true, palette: [0xb94d1b, 0xcf6424, 0xa83f16, 0xdc7a30] })
      const R = makeGableRoof(B.M, r, { L: blk.w, S: blk.d, pitch: 1.0, asym: 0.1, ov: 0.3, og: 0.26, roundWin: true, chimney: { x: -1.5 }, dormers: n >= 3 ? [{ x: -1.5 }, { x: 1.5 }] : [] })
      const cw = 1.9, c = makeGableRoof(B.M, r, { L: blk.d / 2, S: cw, pitch: 1.0, asym: 0, ov: 0.18, og: 0.2, roundWin: true, gableMat: B.M.plasterWarm, finial: true })
      c.group.rotation.y = PI / 2; c.group.position.set(0, 0, blk.d / 4 + 0.0); R.group.add(c.group); R.tiles.push(...c.tiles); R.sub.push(c); return R
    },
    decor: (fl, B, r) => {
      const M = B.M
      if (fl.blk.axis === 'x' && fl.level === 0) { fl.put(makeLantern(M), 0, -0.66, 1.28, 0); fl.put(makeLantern(M), 0, 0.66, 1.28, 0); fl.put(makePot(M, r, true), 0, -0.9, -FH, 0.45); fl.put(makePot(M, r, true), 0, 0.9, -FH, 0.45) }
      if (fl.blk.axis === 'x' && fl.level === 1) { fl.put(makeVine(M, fl.H * 1.1, r), 0, 2.05, 0, 0.07) }
    } },

  tower: {
    name: 'Medieval tower', blurb: 'Stone walls, arrow slits, conical roof', start: 3, max: 5,
    blocks: [{ shape: 'oct', a: 1.15, H: 1.6, ox: 0, oz: 0, wall: 'stone', frame: 'stone', axis: 'x',
      ops: (s, lv) => { const slit = (y0 = 0.6) => win(0, { w: 0.22, h: 0.62, y0, arch: true, cols: 1, rows: 2, glass: undefined, curtain: false }); if (s === 0) return lv === 0 ? [door(0, { w: 0.66, h: 1.08, arch: true, stoneArch: true, type: 'plank', steps: true })] : [slit()]; return (s + lv) % 2 === 0 ? [slit(0.55 + (lv % 2) * 0.1)] : [] } }],
    roof: (B, blk, n, r) => makeConeRoof(B.M, r, { a: blk.a, H: 2.0 }),
    decor: (fl, B, r) => { const M = B.M; if (fl.level === 0) { fl.put(makeLantern(M), 0, -0.52, 1.0, 0); fl.put(makeLantern(M), 0, 0.52, 1.0, 0); fl.put(makeBarrel(M, r), 1, 0.2, -FH, 0.28) } if (fl.level === 1) fl.put(makeVine(M, fl.H * 1.2, r), 3, 0.2, -fl.H * 0.2, 0.08) } },

  bakery: {
    name: 'Village bakery', blurb: 'Warm shop window, striped awning, sign', start: 2, max: 3,
    blocks: [{ w: 3.6, d: 3.0, H: 1.45, ox: 0, oz: 0, wall: 'plasterRose', frame: 'timber', axis: 'x',
      ops: (s, lv) => {
        if (s === 0) return lv === 0 ? [win(-0.75, { w: 1.3, h: 0.78, y0: 0.5, cols: 4, rows: 2, glass: undefined, shutter: undefined, stoneSill: true, curtain: false }), door(1.1, { w: 0.7, h: 1.12, type: 'glazed', steps: true })] : [win(-0.75, { box: true, shutter: 0 }), win(1.1, { box: true, shutter: 0 })]
        if (s === 1) return [win(-0.9), win(0.9)]
        return [win(s === 3 ? 0.2 : -0.2, { shutter: 0, box: lv === 0 })]
      } }],
    roof: (B, blk, n, r) => makeGableRoof(B.M, r, { L: blk.w, S: blk.d, pitch: 1.1, asym: 0.06, ov: 0.3, og: 0.26, roundWin: false, chimney: { x: 1.1 }, dormers: n >= 2 ? [{ x: -0.75 }] : [], gableMat: B.M.plasterRose }),
    decor: (fl, B, r) => {
      const M = B.M
      if (fl.level === 0) {
        fl.put(makeAwning(M, 3.05, 0.9), 0, 0.02, 1.37, 0); const sg = makeSign(M, 'BAKERY'); fl.put(sg, 0, -1.66, 1.2, 0); B.swingers.push(sg.userData.swing)
        fl.put(makeBarrel(M, r), 0, 1.7, -FH, 0.35); fl.put(makePot(M, r, true), 0, -1.65, -FH, 0.32); fl.put(makePot(M, r), 0, 0.2, -FH, 0.3)
        const P = new Part(M); for (let i = 0; i < 5; i++) { P.sph(M.hay, 0.07, -1.15 + i * 0.1, 0.52, 0.18, 1.5, 0.8, 0.9, 4) } fl.put(P.build({ fine: true }), 0, 0, 0, 0)
      }
    } },

  workshop: {
    fpExtra: { x1: 1.7 }, name: 'Workshop', blurb: 'Timber walls, big doors, covered work area', start: 2, max: 3,
    blocks: [{ w: 3.8, d: 3.0, H: 1.45, ox: 0, oz: 0, wall: 'planks', frame: 'timber', axis: 'x',
      ops: (s, lv) => {
        if (s === 0) return lv === 0 ? [door(-0.75, { type: 'barn', w: 1.4, h: 1.16, steps: false, leafMat: 'doorDark' }), win(1.2, { w: 0.58, h: 0.5, y0: 0.68, cols: 2, rows: 2, shutter: 3 })] : [door(-0.75, { w: 0.7, h: 0.86, y0: 0.35, type: 'plank', leafMat: 'doorDark' }), win(1.2, { w: 0.58, h: 0.5, y0: 0.68, cols: 2, rows: 2, shutter: 3 })]
        if (s === 1) return [win(-0.9, { shutter: 3 }), win(0.9, { shutter: 3 })]
        return s === 2 ? [] : [win(0, { shutter: 3 })]
      } }],
    roof: (B, blk, n, r) => makeGableRoof(B.M, r, { L: blk.w, S: blk.d, pitch: 0.95, asym: 0.0, ov: 0.34, og: 0.28, roundWin: false, chimney: { x: -1.2 }, gableMat: B.M.planks, palette: [0xa8461c, 0xb9541f, 0x923c18, 0xc2652b] }),
    decor: (fl, B, r) => {
      const M = B.M
      if (fl.level === 0) {
        fl.put(makeLantern(M), 0, 0.25, 1.1, 0)
        const P = new Part(M), x0 = 1.9
        for (const [sx, sz] of [[2.65, -0.9], [2.65, 1.2], [1.9, 1.2], [1.9, -0.9]]) P.box(M.timber, 0.13, 1.35, 0.13, sx, 0.675 - FH * 0 + 0.0, sz)
        P.box(M.timber, 0.12, 0.14, 2.3, 2.65, 1.27, 0.15); P.box(M.timber, 0.12, 0.14, 2.3, 1.9, 1.5, 0.15)
        const a = Math.atan2(0.25, 0.75), w2 = Math.hypot(0.75, 0.25)
        P.box(M.tilePlane, w2 + 0.3, 0.05, 2.7, 2.27, 1.43, 0.15, 0, 0, -a); P.box(M.timber, w2 + 0.3, 0.06, 0.07, 2.27, 1.37, 1.52, 0, 0, -a); P.box(M.timber, w2 + 0.3, 0.06, 0.07, 2.27, 1.37, -1.22, 0, 0, -a)
        P.box(M.stoneDark, 0.9, 0.04, 2.4, 2.25, -0.3, 0.15)
        P.box(M.timberLight, 0.7, 0.07, 0.3, 2.2, 0.62, -0.7); for (const [sx, sz] of [[-0.3, -0.12], [0.3, -0.12], [-0.3, 0.12], [0.3, 0.12]]) P.box(M.timber, 0.06, 0.6, 0.06, 2.2 + sx, 0.3, -0.7 + sz)
        P.box(M.timberLight, 0.5, 0.05, 0.22, 2.2, 0.9, -0.7, 0, 0, 0.0); P.box(M.iron, 0.22, 0.12, 0.2, 2.2, 0.72, -0.0, 0.2); P.box(M.iron, 0.3, 0.06, 0.16, 2.2, 0.8, 0.0, 0.2); P.cyl(M.timber, 0.13, 0.15, 0.4, 2.2, -0.1, 0.0, 9)
        P.box(M.iron, 0.7, 0.05, 0.02, 0.0, 1.0, 0.0)
        fl.add(P.build(), 'details')
        const e = new Part(M); // saw + hammer hung on the wall, axe in stump, wood pile, wheel
        e.box(M.iron, 0.55, 0.1, 0.012, 1.85, 0.95, 0.03); e.box(M.timberLight, 0.1, 0.06, 0.03, 1.57, 0.95, 0.03); e.box(M.timber, 0.04, 0.32, 0.03, 1.5, 0.7, 0.04); e.box(M.iron, 0.14, 0.07, 0.04, 1.5, 0.88, 0.04)
        fl.put(e.build({ fine: true }), 3, 0, 0, 0)
        const q = new Part(M); q.cyl(M.timber, 0.2, 0.22, 0.38, 1.45, -0.13, 1.85, 9); q.box(M.timber, 0.04, 0.45, 0.04, 1.45, 0.22, 1.85, 0, 0, 0.35); q.box(M.iron, 0.16, 0.12, 0.02, 1.52, 0.38, 1.85, 0, 0, 0.35)
        for (let i = 0; i < 9; i++) q.cyl(M.timberLight, 0.075, 0.075, 0.6, -2.35, -0.22 + (i % 3 === 2 ? 0.22 : (i % 3) * 0.14) - 0.0, 0.2 + ((i * 7) % 5) * 0.0 + (i % 3) * 0.16 - 0.1, 7, 0, 0, PI / 2)
        q.geo(M.timber, new THREE.TorusGeometry(0.3, 0.035, 5, 14), -1.7, 0.0, 1.75, 0, 0.6, 0, false)
        fl.add(q.build({ fine: true }), 'details')
      }
    } },

  townhall: {
    name: 'Town hall', blurb: 'Symmetrical, columns and a clock tower', start: 2, max: 3,
    blocks: [{ w: 5.2, d: 3.4, H: 1.5, ox: 0, oz: 0, wall: 'plasterGrey', frame: 'timber', axis: 'x',
      ops: (s, lv) => {
        const wn = (x) => win(x, { w: 0.48, h: 0.8, arch: true, y0: 0.56, shutter: Math.abs(x) > 2 ? 0 : undefined, box: lv === 0 })
        if (s === 0) return lv === 0 ? [door(0, { w: 0.96, h: 1.36, arch: true, stoneArch: true, type: 'plank', steps: true }), wn(-1.45), wn(1.45), wn(-2.15), wn(2.15)] : lv === 1 ? [balc(0, { w: 0.7, h: 1.18, arch: true, balc: null }), wn(-1.45), wn(1.45), wn(-2.15), wn(2.15)] : [win(0, { w: 0.6, h: 0.8, arch: true, shutter: 0 }), wn(-1.45), wn(1.45), wn(-2.15), wn(2.15)]
        if (s === 1) return [win(-1.5, { w: 0.46, h: 0.76, arch: true }), win(0, { w: 0.46, h: 0.76, arch: true }), win(1.5, { w: 0.46, h: 0.76, arch: true })]
        return [win(0, { w: 0.46, h: 0.76, arch: true, shutter: 0 })]
      } }],
    roof: (B, blk, n, r) => {
      const R = makeGableRoof(B.M, r, { L: blk.w, S: blk.d, pitch: 0.82, asym: 0, ov: 0.34, og: 0.3, roundWin: true, palette: [0xb64a1e, 0xc85c25, 0xa43f18, 0xd36d2e], chimney: { x: -1.9, z: -0.5 }, gableMat: B.M.plasterGrey })
      const c = makeGableRoof(B.M, r, { L: blk.d / 2, S: 2.5, pitch: 0.82, asym: 0, ov: 0.2, og: 0.24, roundWin: true, gableMat: B.M.plasterGrey })
      c.group.rotation.y = PI / 2; c.group.position.set(0, 0, blk.d / 4); R.group.add(c.group); R.tiles.push(...c.tiles); R.sub.push(c)
      // clock tower
      const P = new Part(B.M), F = new Part(B.M), hb = R.hr - 0.5, tw = 0.9, th = 1.25
      P.box(B.M.plasterGrey, tw, th, tw, 0, hb + th / 2, 0); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.box(B.M.timber, 0.1, th, 0.1, sx * (tw / 2 - 0.02), hb + th / 2, sz * (tw / 2 - 0.02))
      P.box(B.M.timber, tw + 0.14, 0.1, tw + 0.14, 0, hb + th, 0); P.box(B.M.timber, tw + 0.1, 0.09, tw + 0.1, 0, hb + 0.55, 0)
      for (let i = 0; i < 4; i++) { const ang = (i * PI) / 2; F.box(B.M.glassC, 0.22, 0.34, 0.02, Math.sin(ang) * (tw / 2 + 0.01), hb + th - 0.28, Math.cos(ang) * (tw / 2 + 0.01), ang) }
      const ct = makeClockTexture(), cm = new THREE.MeshStandardMaterial({ map: ct, roughness: 0.5 }), cg = new THREE.Group()
      for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.3, 28), cm); const ang = (i * PI) / 2; m.position.set(Math.sin(ang) * (tw / 2 + 0.02), hb + 0.95 - 0.2, Math.cos(ang) * (tw / 2 + 0.02)); m.rotation.y = ang; cg.add(m) }
      const py = makePyramid(B.M, r, tw + 0.3, 0.95, [0xb64a1e, 0xc85c25, 0xa43f18]); py.position.y = hb + th + 0.05
      const crown = grp(P.build(), F.build({ fine: true }), cg, py); crown.position.set(0, 0, R.zr); R.group.add(crown); R.crown = crown
      return R
    },
    decor: (fl, B, r) => {
      const M = B.M
      if (fl.level === 0) { fl.put(makeLantern(M), 0, -0.68, 1.08, 0); fl.put(makeLantern(M), 0, 0.68, 1.08, 0); fl.put(makePot(M, r, true), 0, -1.9, -FH, 0.3); fl.put(makePot(M, r, true), 0, 1.9, -FH, 0.3) }
      if (fl.level === 1) { // portico: columns + deck that grow with the second storey
        for (const x of [-1.0, 1.0]) fl.put(makeColumn(M, fl.H - 0.05, 0.1), 0, x, -fl.H, 1.0)
        fl.put(makeBalcony(M, { w: 2.5, depth: 1.1, pots: true }), 0, 0, 0, 0)
      }
    } },
}

/* ─────────────────────── looks, names ─────────────────────── */
export const SWATCH = {
  wall: ['#f3e7c9', '#f6dd9a', '#f1c7a4', '#ebb2ab', '#cfe0b8', '#b9d4e6', '#d8c9e6', '#fbf7ee', '#e3a27c', '#cfc8ba'],
  stone: ['#ffffff', '#e8d9c0', '#c9d0d6', '#b7c6a5', '#d9b9a0', '#9a9aa2'],
  timber: ['#8a6446', '#4a3a30', '#b98c62', '#3f6b4a', '#2f4f7a', '#7a2f35', '#5b5b66', '#d8d0c0'],
  roof: ['#d4622a', '#e0792f', '#b4472a', '#c8704a', '#5d7b99', '#6f9a58', '#8a4f6e', '#3f8c8c', '#d6a24a', '#5a5a62'],
  shutter: ['#2f6b52', '#2c5f8a', '#8f3a2e', '#4b7a3b', '#c79a2c', '#7a4a7c', '#f1ead8', '#2b2b30'],
  door: ['#ffffff', '#c98a8a', '#8fb3d9', '#8ec79a', '#e0b45a', '#6a5646'],
}
const pk = (r, a) => a[(r() * a.length) | 0]
export function randomLook(type, r) {
  const tower = type === 'tower'
  return { wall: pk(r, tower ? SWATCH.stone : SWATCH.wall), timber: pk(r, SWATCH.timber), roof: pk(r, SWATCH.roof), shutter: pk(r, SWATCH.shutter), door: pk(r, SWATCH.door) }
}
const NAMES = {
  cottage: [['Willow', 'Hazel', 'Bramble', 'Thistle', 'Fernwood', 'Honeysuckle', 'Primrose', 'Juniper', 'Marigold', 'Clover'], ['Cottage', 'Cot', 'Lodge', 'House']],
  manor: [['Ravenmoor', 'Silverbrook', 'Oakhaven', 'Wyndham', 'Starling', 'Ashgrove', 'Evermere', 'Larkspur'], ['Manor', 'Hall', 'House', 'Court']],
  tower: [['Greywatch', 'Stormcrest', 'Highmere', 'Ironcliff', 'Moonspire', 'Dawnwatch', 'Eagle’s Rest'], ['Tower', 'Keep', 'Spire']],
  bakery: [['The Golden Crust', 'Rosie’s Rolls', 'The Rising Loaf', 'Honeycomb Bakery', 'Sunday Buns', 'The Flour Pot', 'Butter & Bramble'], ['']],
  workshop: [['Old Oak Workshop', 'Ironhollow Forge', 'Tinker’s Bench', 'The Copper Kettle', 'Hammer & Hearth', 'Cogwheel Works', 'The Busy Anvil'], ['']],
  townhall: [['Hearthwood', 'Millbrook', 'Maplewick', 'Stonebridge', 'Foxglove', 'Dunmere'], ['Town Hall', 'Guildhall', 'Council House']],
}
export function makeName(type, r) { const [a, s] = NAMES[type]; const n = pk(r, a), sfx = pk(r, s); return sfx ? `${n} ${sfx}` : n }

/* ─────────────────────── building class ─────────────────────── */
let UID = 1
export class Building {
  constructor(type, deps, opts = {}) {
    this.type = type; this.S = STYLES[type]; this.D = deps; this.id = UID++
    this.seed = opts.seed ?? (this.id * 7919 + (Math.random() * 1e6 | 0)); this.rng = rngOf(this.seed)
    this.M = this.makeMats(deps.M); this.look = opts.look || randomLook(type, rngOf(this.seed ^ 0x5bd1)); this.name = opts.name || makeName(type, rngOf(this.seed ^ 0x1234)); this.mirror = opts.mirror ?? 1
    this.applyLook(this.look)
    this.group = new THREE.Group(); this.group.userData.building = this
    this.floorsN = 0; this.blocks = this.S.blocks.map((b, i) => ({ ...b, bi: i, group: new THREE.Group(), floors: [], roof: null, found: [], built: 0 }))
    this.blocks.forEach((b) => { b.group.position.set(b.ox, 0, b.oz); this.group.add(b.group); b.wallMat = this.M[b.wall] })
    this.swingers = []; this.smokes = []; this.busyUntil = 0; this.fineGroups = []
    this.fpL = this.footprint(); this.fp = this.mirror < 0 ? { ...this.fpL, x0: -this.fpL.x1, x1: -this.fpL.x0, cx: -this.fpL.cx } : this.fpL; this.group.scale.x = this.mirror
    const fpb = this.fpL
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.M.blob); blob.rotation.x = -PI / 2; blob.position.y = 0.012
    blob.scale.set(fpb.w + 1.6, fpb.d + 1.6, 1); blob.position.x = fpb.cx; blob.position.z = fpb.cz; blob.renderOrder = 1; this.group.add(blob); this.blob = blob
  }
  makeMats(M) {
    const MM = Object.create(M)
    for (const k of ['plaster', 'plasterWarm', 'plasterRose', 'plasterSage', 'plasterGrey', 'planks', 'planksDark', 'stone', 'stoneWarm', 'stoneDark', 'timber', 'timberLight', 'tileInst']) MM[k] = M[k].clone()
    MM.door = M.planks.clone(); MM.doorDark = M.planks.clone(); MM.shutters = M.shutters.map((m) => m.clone())
    MM.capA = new THREE.MeshStandardMaterial({ roughness: 0.7 }); MM.capB = new THREE.MeshStandardMaterial({ roughness: 0.7 })
    return MM
  }
  /** Re-colour this building live. Keys: wall, timber, roof, shutter, door (hex strings). */
  applyLook(p) {
    Object.assign(this.look ??= {}, p); const M = this.M, L = this.look, C = (h) => new THREE.Color(h)
    if (p.wall !== undefined) {
      const c = C(L.wall)
      if (this.S.blocks[0].wall === 'stone') { M.stone.color.copy(c); M.stoneWarm.color.copy(c).lerp(C('#f2dcc0'), 0.45); M.stoneDark.color.copy(c).multiplyScalar(0.78) }
      else for (const k of ['plaster', 'plasterWarm', 'plasterRose', 'plasterSage', 'plasterGrey', 'planks']) M[k].color.copy(c)
    }
    if (p.timber !== undefined) { const c = C(L.timber); M.timber.color.copy(c); M.timberLight.color.copy(c).multiplyScalar(1.28) }
    if (p.shutter !== undefined) M.shutters.forEach((m) => m.color.set(L.shutter))
    if (p.door !== undefined) { M.door.color.set(L.door); M.doorDark.color.set(L.door).multiplyScalar(0.78) }
    if (p.roof !== undefined) { const c = C(L.roof); M.tileInst.color.copy(c); M.capA.color.copy(c).multiplyScalar(0.62); M.capB.color.copy(c).multiplyScalar(0.46) }
  }
  footprint() {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9
    for (const b of this.blocks) { const hw = b.shape === 'oct' ? b.a * 1.1 : b.w / 2, hd = b.shape === 'oct' ? b.a * 1.1 : b.d / 2; x0 = Math.min(x0, b.ox - hw); x1 = Math.max(x1, b.ox + hw + (this.S.fpExtra?.x1 ?? 0)); z0 = Math.min(z0, b.oz - hd); z1 = Math.max(z1, b.oz + hd) }
    return { w: x1 - x0, d: z1 - z0, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, x0, x1, z0, z1 }
  }
  targetFloors(b, n) { return b.floors_ ? b.floors_(n) : b.floors ? 0 : 0 }
  floorsFor(b, n) { const f = this.S.blocks[b.bi].floors; return f ? Math.min(f(n), this.S.max) : n }
  baseY(level, H) { return FH + level * H }

  /* sides of a block in block-local coordinates */
  sidesOf(b) {
    if (b.shape === 'oct') { const Lp = 2 * b.a * Math.tan(PI / 8) + 0.03; return Array.from({ length: 8 }, (_, k) => { const ph = (k * PI) / 4; return { idx: k, L: Lp, pos: [b.a * Math.sin(ph), 0, b.a * Math.cos(ph)], ry: ph } }) }
    return [{ idx: 0, L: b.w, pos: [0, 0, b.d / 2], ry: 0 }, { idx: 1, L: b.w, pos: [0, 0, -b.d / 2], ry: PI }, { idx: 2, L: b.d, pos: [b.w / 2, 0, 0], ry: PI / 2 }, { idx: 3, L: b.d, pos: [-b.w / 2, 0, 0], ry: -PI / 2 }]
  }

  makeFoundation(b) {
    const M = this.M, r = this.rng, out = []
    for (const s of this.sidesOf(b)) {
      const P = new Part(M), L = s.L + 0.16, mats = [M.stone, M.stoneWarm, M.stoneDark]
      for (let row = 0; row < 2; row++) { let x = -L / 2 - (row ? 0.12 : 0); while (x < L / 2) { const w = 0.2 + r() * 0.3, h = 0.155 * (0.92 + r() * 0.08); const cx = Math.min(x + w / 2, L / 2); P.box(pick(r, mats), Math.min(w, L / 2 - x + 0.02) - 0.012, h, 0.26, x + w / 2, row * 0.16 + h / 2, 0.055 - (r() * 0.025), (r() - 0.5) * 0.05, 0, (r() - 0.5) * 0.02); x += w } }
      P.box(M.stoneDark, L + 0.12, 0.04, 0.3, 0, FH + 0.0, 0.04)
      const g = new THREE.Group(); g.position.set(...s.pos); g.rotation.y = s.ry; g.add(P.build()); b.group.add(g); out.push(g)
    }
    b.found = out; return out
  }

  /* one storey: walls with real openings, timber frame, windows, doors, balconies, details */
  makeFloor(b, level) {
    const M = this.M, r = this.rng, H = b.H, fl = { level, H, blk: b, group: new THREE.Group(), stages: { posts: [], beams: [], walls: [], openings: [], details: [] }, sides: [] }
    fl.group.position.y = this.baseY(level, H); b.group.add(fl.group)
    fl.put = (obj, sideIdx, x, y, z, stage = 'details') => { const s = fl.sides[sideIdx]; obj.position.set(x, y, z); s.g.add(obj); fl.stages[stage].push(obj); return obj }
    fl.add = (obj, stage = 'details') => { fl.group.add(obj); fl.stages[stage].push(obj); return obj }
    const matOf = (m) => (typeof m === 'string' ? M[m] : m)
    for (const s of this.sidesOf(b)) {
      const sg = new THREE.Group(); sg.position.set(...s.pos); sg.rotation.y = s.ry; fl.group.add(sg); fl.sides[s.idx] = { g: sg, L: s.L }
      const ops = b.ops(s.idx, level, s.L) || [], holes = ops.map((o) => ({ x: o.x, w: o.w, h: o.h, y0: o.y0, arch: o.arch }))
      const wg = new THREE.Group(); const wm = new THREE.Mesh(wallGeo(s.L, H, holes), b.wallMat); wm.castShadow = true; wm.receiveShadow = true; wg.add(wm); sg.add(wg); fl.stages.walls.push(wg)
      // frame
      if (b.frame === 'timber') {
        const P = new Part(M); P.box(M.timber, s.L + 0.04, 0.14, 0.15, 0, H - 0.07, 0.02); P.box(M.timber, s.L + 0.04, 0.1, 0.14, 0, 0.05, 0.015)
        P.box(M.timber, s.L + 0.08, 0.04, 0.19, 0, H + 0.0, 0.03)
        if (level > 0) P.box(M.timber, s.L + 0.04, 0.04, 0.17, 0, 0.0, 0.025)
        const bg = grp(P.build()); sg.add(bg); fl.stages.beams.push(bg)
        const Q = new Part(M), edges = [-s.L / 2, ...ops.flatMap((o) => [o.x - o.w / 2 - 0.1, o.x + o.w / 2 + 0.1]).sort((a, c) => a - c), s.L / 2]
        for (let i = 0; i < edges.length; i += 2) { const g0 = edges[i], g1 = edges[i + 1], gap = g1 - g0, xc = (g0 + g1) / 2
          if (gap > 0.45 && gap < s.L) Q.box(M.timber, 0.12, H - 0.2, 0.1, xc, H / 2, 0.02)
          if (gap > 0.95 && r() < 0.8) { const ang = Math.atan2(H * 0.5, gap * 0.4); for (const sd of [-1, 1]) Q.box(M.timber, Math.hypot(gap * 0.4, H * 0.5) - 0.1, 0.075, 0.09, xc + sd * gap * 0.22, H * 0.5, 0.018, 0, 0, sd * ang) } }
        const pg = grp(Q.build()); sg.add(pg); fl.stages.posts.push(pg)
        if (r() < 0.9) { const K = new Part(M); for (const sd of [-1, 1]) K.box(M.timber, 0.07, 0.3, 0.1, sd * (s.L / 2 - 0.2), H - 0.28, 0.03, 0, 0, sd * 0.7); const kg = grp(K.build({ fine: true })); sg.add(kg); fl.stages.details.push(kg) }
      } else {
        const P = new Part(M); P.box(M.stoneDark, s.L + 0.06, 0.13, 0.2, 0, H - 0.065, 0.03); P.box(M.stoneDark, s.L + 0.04, 0.06, 0.17, 0, 0.03, 0.02)
        P.box(M.stone, s.L + 0.1, 0.05, 0.24, 0, H + 0.0, 0.04)
        const bg = grp(P.build()); sg.add(bg); fl.stages.beams.push(bg)
      }
      // openings
      for (const o of ops) {
        let obj
        if (o.kind === 'win') { const oo = { ...o }; if (b.wall === 'stone' || o.arch) oo.stoneSill = true; obj = makeWindow(M, { ...oo, frameMat: M.timber }, r); obj.position.set(o.x, o.y0 + o.h / 2, 0) }
        else { const oo = { ...o, leafMat: matOf(o.leafMat), type: o.kind === 'balc' ? 'glazed' : o.type }; obj = makeDoor(M, oo, r); obj.position.set(o.x, o.y0 - 0.02 + (o.kind === 'door' && level === 0 ? 0 : 0), 0) }
        sg.add(obj); fl.stages.openings.push(obj)
        if (o.kind === 'balc' && o.balc) { const bo = makeBalcony(M, o.balc); bo.position.set(o.x, 0, 0); sg.add(bo); fl.stages.details.push(bo) }
      }
    }
    // corner posts / quoins
    if (b.shape === 'oct') { const Rc = b.a / Math.cos(PI / 8) - 0.03; for (let k = 0; k < 8; k++) { const ph = (k * PI) / 4 + PI / 8, P = new Part(M); P.box(M.stoneDark, 0.17, H, 0.17, 0, H / 2, 0); const g = grp(P.build()); g.position.set(Rc * Math.sin(ph), 0, Rc * Math.cos(ph)); g.rotation.y = ph; fl.group.add(g); fl.stages.posts.push(g) } }
    else if (b.frame === 'timber') for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const P = new Part(M); P.box(M.timber, 0.17, H + 0.02, 0.17, 0, H / 2, 0); const g = grp(P.build()); g.position.set(sx * (b.w / 2 - 0.04), 0, sz * (b.d / 2 - 0.04)); fl.group.add(g); fl.stages.posts.push(g) }
    // eave shade (fake AO) under the floor band
    this.S.decor?.(fl, this, r)
    fl.group.traverse((o) => { if (o.userData.fine) this.fineGroups.push(o) })
    b.floors.push(fl); return fl
  }

  /* ───────── build orchestration + animation ───────── */
  /** @param n target floors  @param animate  @param t0 start delay (s) */
  buildAll(n, animate = true, t0 = 0) {
    this.floorsN = n; let tEnd = t0
    for (const b of this.blocks) {
      const c = this.floorsFor(b, n), r = this.rng
      const fnd = this.makeFoundation(b); tEnd = Math.max(tEnd, this.revealFoundation(fnd, animate, t0))
      let t = t0 + 0.55
      for (let lv = 0; lv < c; lv++) { const fl = this.makeFloor(b, lv); t = this.revealFloor(fl, animate, t) + 0.05; b.built = lv + 1 }
      b.roof = this.makeRoof(b, c); const topY = this.baseY(c, b.H); b.roof.group.position.y = topY; b.group.add(b.roof.group)
      t = this.revealRoof(b.roof, animate, t)
      tEnd = Math.max(tEnd, t)
    }
    this.busyUntil = this.D.A.time + (animate ? tEnd : 0) + 0.1; return tEnd
  }
  makeRoof(b, n) {
    const R = this.S.roof(this, b, this.floorsN, this.rng, b.bi)
    if (b.axis === 'z') R.group.rotation.y = PI / 2
    if (b.axis === 'x' || b.axis === 'z') {}
    R.group.traverse((o) => { if (o.userData.fine) this.fineGroups.push(o) })
    if (R.anchor) this.smokeFor(R.anchor, b.bi === 0 ? 7 : 5)
    return R
  }
  smokeFor(anchor, n) {
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(this.D.puffGeo, this.M.smoke.clone()); m.visible = false; m.userData = { anchor, i, n, ph: this.rng() * 10 }; this.D.scene.add(m); this.smokes.push(m) }
  }
  reveal(obj, kind, delay, dur = 0.35, ex = {}) {
    const A = this.D.A; if (!obj) return
    obj.visible = false
    const y0 = obj.position.y, s0 = obj.scale.clone()
    A.add({ delay, dur, ease: kind === 'pop' ? 'outBack' : kind === 'drop' ? 'outBounce' : 'outCubic',
      start: () => { obj.visible = true },
      update: (u) => {
        if (kind === 'grow') obj.scale.set(s0.x, Math.max(0.001, u) * s0.y, s0.z)
        else if (kind === 'pop') obj.scale.setScalar(Math.max(0.001, u))
        else if (kind === 'drop') obj.position.y = y0 + (ex.h ?? 0.9) * (1 - u)
        else if (kind === 'fade') obj.scale.setScalar(Math.max(0.001, u))
      } })
  }
  revealFoundation(sides, animate, t0) { if (!animate) return t0; sides.forEach((g, i) => this.reveal(g, 'drop', t0 + i * 0.09, 0.5, { h: 1.1 })); return t0 + 0.5 + sides.length * 0.09 }
  revealFloor(fl, animate, t) {
    if (!animate) return t
    const S = fl.stages
    S.posts.forEach((o, i) => this.reveal(o, 'grow', t + i * 0.07, 0.4)); t += 0.28 + S.posts.length * 0.03
    S.beams.forEach((o, i) => this.reveal(o, 'drop', t + i * 0.06, 0.4, { h: 0.7 })); t += 0.28
    S.walls.forEach((o, i) => this.reveal(o, 'grow', t + i * 0.1, 0.45)); t += 0.4 + S.walls.length * 0.05
    S.openings.forEach((o, i) => this.reveal(o, 'pop', t + i * 0.06, 0.35)); t += 0.3 + S.openings.length * 0.03
    S.details.forEach((o, i) => this.reveal(o, 'pop', t + i * 0.03, 0.3)); t += 0.3
    return t
  }
  revealRoof(R, animate, t) {
    if (!animate) return t
    const A = this.D.A
    ;[R.shellG, R.frameG, R.fineG].forEach((o, i) => o && this.reveal(o, 'drop', t + i * 0.05, 0.45, { h: 1.0 }))
    t += 0.35
    for (const m of R.tiles) { const total = m.userData.total; m.count = 0; A.add({ delay: t, dur: 0.15 + total * 0.0016, ease: 'linear', update: (u) => { m.count = Math.floor(u * total) }, end: () => { m.count = total } }) }
    const tt = t + 0.15 + Math.max(...R.tiles.map((m) => m.userData.total)) * 0.0016
    R.sub.forEach((s) => { ;[s.shellG, s.frameG, s.fineG].forEach((o) => o && this.reveal(o, 'drop', t, 0.4, { h: 1 })) })
    if (R.chimney) this.reveal(R.chimney, 'grow', tt, 0.4)
    R.dormers.forEach((d, i) => this.reveal(d, 'pop', tt + 0.1 + i * 0.1, 0.35))
    if (R.crown) this.reveal(R.crown, 'grow', tt, 0.5)
    return tt + 0.5
  }

  /* add one storey, animating only the new floor and the roof lift */
  addStorey() {
    if (this.D.A.time < this.busyUntil || this.floorsN >= this.S.max) return false
    this.floorsN++; let tEnd = 0
    for (const b of this.blocks) {
      const c = this.floorsFor(b, this.floorsN)
      if (c <= b.built) continue
      const A = this.D.A, roof = b.roof, y0 = roof.group.position.y, y1 = this.baseY(c, b.H)
      // roof rebuild so dormers / ridge details match the new height; keep the old one while it lifts
      const lift = 0.45
      A.add({ delay: 0, dur: lift, ease: 'outCubic', update: (u) => { roof.group.position.y = y0 + (b.H + 0.9) * u } })
      const fl = this.makeFloor(b, c - 1); b.built = c
      let t = this.revealFloor(fl, true, 0.35)
      // refresh roof (dormers etc.) after floor is up
      const old = roof, nu = this.makeRoof(b, c); nu.group.position.y = y1 + 0.9; nu.group.visible = false; b.group.add(nu.group)
      A.add({ delay: t, dur: 0.01, update: () => {}, end: () => { b.group.remove(old.group); this.disposeRoof(old); nu.group.visible = true; b.roof = nu } })
      A.add({ delay: t + 0.02, dur: 0.6, ease: 'outBounce', update: (u) => { nu.group.position.y = y1 + 0.9 * (1 - u) } })
      this.smokes = this.smokes.filter((m) => { if (m.userData.anchor === old.anchor) { this.D.scene.remove(m); m.material.dispose(); return false } return true })
      tEnd = Math.max(tEnd, t + 0.7)
    }
    this.busyUntil = this.D.A.time + tEnd + 0.1; return true
  }
  removeStorey() {
    if (this.D.A.time < this.busyUntil || this.floorsN <= 1) return false
    this.floorsN--
    for (const b of this.blocks) {
      const c = this.floorsFor(b, this.floorsN)
      if (c >= b.built || b.built <= 1) continue
      const fl = b.floors.pop(); b.built--; const A = this.D.A, roof = b.roof, y0 = roof.group.position.y
      A.add({ delay: 0, dur: 0.4, ease: 'outCubic', update: (u) => { fl.group.scale.y = Math.max(0.001, 1 - u) }, end: () => { b.group.remove(fl.group); fl.group.traverse((o) => { if (o.geometry) o.geometry.dispose() }) } })
      A.add({ delay: 0.15, dur: 0.5, ease: 'outCubic', update: (u) => { roof.group.position.y = y0 - b.H * u } })
      // re-make roof for new height (dormers)
      const nu = this.makeRoof(b, c); nu.group.position.y = this.baseY(c, b.H); nu.group.visible = false; b.group.add(nu.group)
      A.add({ delay: 0.66, dur: 0.01, update: () => {}, end: () => { b.group.remove(roof.group); this.disposeRoof(roof); nu.group.visible = true; b.roof = nu } })
      this.smokes = this.smokes.filter((m) => { if (m.userData.anchor === roof.anchor) { this.D.scene.remove(m); m.material.dispose(); return false } return true })
    }
    this.busyUntil = this.D.A.time + 0.8; return true
  }
  disposeRoof(R) { R.group.traverse((o) => { if (o.isInstancedMesh) o.dispose(); else if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose() }) }

  topY() { const b = this.blocks[0]; return this.baseY(this.floorsFor(b, this.floorsN), b.H) + (b.roof?.hr ?? 1.4) }
  update(time, camDist) {
    for (const m of this.smokes) {
      const { anchor, i, n, ph } = m.userData, t = ((time * 0.22 + i / n) % 1), p = new THREE.Vector3(); anchor.getWorldPosition(p)
      if (!anchor.visible || (anchor.parent && !anchor.parent.visible)) { m.visible = false; continue }
      let vis = true; anchor.traverseAncestors((a) => { if (!a.visible) vis = false }); m.visible = vis
      m.position.set(p.x + Math.sin(t * 5 + ph) * 0.05 + t * 0.55, p.y + t * 1.5, p.z + Math.cos(t * 4 + ph) * 0.04); m.scale.setScalar(0.5 + t * 1.5); m.material.opacity = 0.5 * Math.sin(Math.min(1, t * 1.15) * PI) * (1 - t * 0.2)
    }
    for (const s of this.swingers) s.rotation.x = Math.sin(time * 1.6) * 0.07
  }
}

export function styleFootprint(type, mirror = 1) {
  const S = STYLES[type]; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9
  for (const b of S.blocks) { const hw = b.shape === 'oct' ? b.a * 1.1 : b.w / 2, hd = b.shape === 'oct' ? b.a * 1.1 : b.d / 2; x0 = Math.min(x0, b.ox - hw); x1 = Math.max(x1, b.ox + hw + (S.fpExtra?.x1 ?? 0)); z0 = Math.min(z0, b.oz - hd); z1 = Math.max(z1, b.oz + hd) }
  const f = { w: x1 - x0, d: z1 - z0, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, x0, x1, z0, z1 }
  return mirror < 0 ? { ...f, x0: -f.x1, x1: -f.x0, cx: -f.cx } : f
}
