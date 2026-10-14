import * as THREE from 'three'
import { Part, rngOf } from './core.js'

const cache = new Map()
const mat = (hex, rough = 0.9) => { const k = hex + '|' + rough; if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, flatShading: true })); return cache.get(k) }
const pick = (r, a) => a[(r() * a.length) | 0]
const BARK = 0x5b4030, BIRCH = 0xe8e2d4
const GREENS = [0x3f8a3c, 0x4e9a45, 0x2f7a38, 0x5aa04a]

export const PLANTS = {
  oak: { name: 'Oak tree', r: 0.9 },
  pine: { name: 'Pine', r: 0.75 },
  birch: { name: 'Birch', r: 0.6 },
  cherry: { name: 'Cherry blossom', r: 0.9 },
  apple: { name: 'Apple tree', r: 0.85 },
  bush: { name: 'Bush', r: 0.5 },
  rose: { name: 'Rose bush', r: 0.45 },
  lavender: { name: 'Lavender', r: 0.4 },
  sunflower: { name: 'Sunflowers', r: 0.4 },
  tulip: { name: 'Tulips', r: 0.35 },
  hedge: { name: 'Hedge', r: 0.55 },
  pumpkin: { name: 'Pumpkins', r: 0.45 },
}

export function makePlant(kind, seed = 1) {
  const r = rngOf(seed), P = new Part({}), s = 0.9 + r() * 0.3
  const blob = (m, x, y, z, rad, sy = 0.9) => P.sph(m, rad, x, y, z, 1, sy, 1, 7)
  const trunk = (m, h, rb, rt) => P.cyl(m, rt, rb, h, 0, h / 2, 0, 7)
  switch (kind) {
    case 'oak': { trunk(mat(BARK), 1.1, 0.16, 0.11); const g = mat(pick(r, GREENS)), g2 = mat(pick(r, GREENS)); blob(g, 0, 1.55, 0, 0.78); blob(g2, 0.5, 1.25, 0.2, 0.52); blob(g2, -0.45, 1.3, -0.2, 0.55); blob(g, 0.1, 2.05, -0.1, 0.5); break }
    case 'pine': { trunk(mat(BARK), 0.7, 0.14, 0.1); const g = mat(0x1f5a35), g2 = mat(0x2a7041); for (let i = 0; i < 4; i++) P.cyl(i % 2 ? g2 : g, 0.02, 0.85 - i * 0.17, 0.8, 0, 0.9 + i * 0.52, 0, 7); break }
    case 'birch': { trunk(mat(BIRCH), 1.5, 0.1, 0.07); for (let i = 0; i < 5; i++) P.box(mat(0x3a3a3a), 0.12, 0.05, 0.12, 0, 0.25 + i * 0.26, 0, i); const g = mat(0x8cc063), g2 = mat(0xa3d176); blob(g, 0, 1.75, 0, 0.55, 1.1); blob(g2, 0.3, 1.45, 0.1, 0.38); blob(g2, -0.28, 1.55, -0.1, 0.4); break }
    case 'cherry': { trunk(mat(0x6a4a3a), 1.0, 0.15, 0.1); const g = mat(0xf4a6c3), g2 = mat(0xf9c6d9), g3 = mat(0xf08bb0); blob(g, 0, 1.5, 0, 0.75); blob(g2, 0.5, 1.2, 0.2, 0.5); blob(g3, -0.45, 1.3, -0.15, 0.5); blob(g2, 0.05, 1.95, 0.0, 0.48); for (let i = 0; i < 12; i++) P.sph(mat(0xfbd6e3), 0.035, (r() - 0.5) * 1.8, 0.02, (r() - 0.5) * 1.8, 1, 0.4, 1, 4); break }
    case 'apple': { trunk(mat(BARK), 0.9, 0.15, 0.1); const g = mat(0x4e9a45), g2 = mat(0x5aa04a); blob(g, 0, 1.35, 0, 0.7); blob(g2, 0.45, 1.1, 0.2, 0.45); blob(g2, -0.42, 1.15, -0.15, 0.48); for (let i = 0; i < 9; i++) { const a = r() * 6.28, h = 1 + r() * 0.8; P.sph(mat(0xd9382e), 0.07, Math.cos(a) * 0.72, h, Math.sin(a) * 0.72, 1, 1, 1, 4) } break }
    case 'bush': { blob(mat(0x3f8a3c), 0, 0.3, 0, 0.42); blob(mat(0x4e9a45), 0.3, 0.25, 0.1, 0.3); blob(mat(0x2f7a38), -0.28, 0.25, -0.05, 0.32); break }
    case 'rose': { blob(mat(0x3a7a38), 0, 0.28, 0, 0.38); blob(mat(0x4e9a45), 0.25, 0.22, 0.1, 0.27); const cs = [0xd9304f, 0xf06a8a, 0xfff0f0, 0xe85a6b]; for (let i = 0; i < 12; i++) { const a = r() * 6.28, h = 0.18 + r() * 0.35; P.sph(mat(pick(r, cs)), 0.05, Math.cos(a) * 0.36, h + 0.1, Math.sin(a) * 0.36, 1, 1, 1, 4) } break }
    case 'lavender': for (let i = 0; i < 7; i++) { const x = (r() - 0.5) * 0.7, z = (r() - 0.5) * 0.7; blob(mat(0x6a9a5a), x, 0.12, z, 0.14, 0.7); for (let k = 0; k < 5; k++) P.cyl(mat(pick(r, [0x9a6bd4, 0x8a5cc4, 0xb48be0])), 0.012, 0.016, 0.38, x + (k - 2) * 0.03, 0.34, z + (r() - 0.5) * 0.04, 5) } break
    case 'sunflower': for (let i = 0; i < 5; i++) { const x = (r() - 0.5) * 0.6, z = (r() - 0.5) * 0.6, h = 0.7 + r() * 0.45; P.cyl(mat(0x3e7a38), 0.02, 0.025, h, x, h / 2, z, 5); P.cyl(mat(0xf5c518), 0.17, 0.17, 0.035, x, h + 0.02, z + 0.04, 10, Math.PI / 2 - 0.3); P.cyl(mat(0x5a3a1a), 0.075, 0.075, 0.05, x, h + 0.02, z + 0.05, 8, Math.PI / 2 - 0.3); blob(mat(0x4e9a45), x + 0.1, h * 0.5, z, 0.09, 0.4) } break
    case 'tulip': for (let i = 0; i < 9; i++) { const x = (r() - 0.5) * 0.7, z = (r() - 0.5) * 0.7, h = 0.28 + r() * 0.15; P.cyl(mat(0x3e7a38), 0.012, 0.014, h, x, h / 2, z, 4); P.cyl(mat(pick(r, [0xe84a5f, 0xffd24a, 0xff8fb0, 0xb48be0, 0xffffff, 0xff9a4d])), 0.05, 0.015, 0.1, x, h + 0.04, z, 6); blob(mat(0x4e9a45), x, 0.07, z, 0.07, 0.5) } break
    case 'hedge': { P.box(mat(0x2f7a38), 1.0, 0.5, 0.5, 0, 0.25, 0); for (let i = 0; i < 6; i++) blob(mat(pick(r, GREENS)), -0.42 + i * 0.17, 0.55, (r() - 0.5) * 0.2, 0.2, 0.8); break }
    case 'pumpkin': for (let i = 0; i < 4; i++) { const x = (r() - 0.5) * 0.6, z = (r() - 0.5) * 0.6, k = 0.14 + r() * 0.1; P.sph(mat(0xe8761e), k, x, k * 0.8, z, 1.15, 0.8, 1.15, 7); P.cyl(mat(0x4b6a2a), 0.02, 0.03, 0.06, x, k * 1.55, z, 5); P.sph(mat(0x3e7a38), 0.1, x + 0.2, 0.05, z, 1.4, 0.3, 1, 4) } break
  }
  const g = P.build(); g.scale.setScalar(s); g.userData.plant = { kind, seed, scale: s, r: PLANTS[kind].r * s }
  g.userData.sway = ['oak', 'pine', 'birch', 'cherry', 'apple'].includes(kind) ? 0.012 : 0.03
  return g
}
