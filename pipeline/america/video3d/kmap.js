import * as THREE from 'three';
import { OUT, hash, tex, face, mat, ibox, plane, glowSprite, floorGlow, grain } from './tex.js';
import { FlagK, sky, clouds, lights, sm } from './kcommon.js';

export const MAPS = {};
export async function loadMaps() {
  for (const n of ['map_wide', 'map_close']) {
    const meta = await (await fetch(`assets/${n}.json`)).json();
    const img = new Image(); img.src = `assets/${n}.png`; await img.decode();
    const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; MAPS[n] = { meta, tex: t };
  }
}
const woodT = () => tex(512, 512, (c, W) => { c.fillStyle = '#b07a46'; c.fillRect(0, 0, W, W); for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(${hash(i) > .5 ? '90,50,20' : '210,160,100'},.14)`; c.fillRect(0, i * W / 26, W, W / 52 + hash(i) * 8); } grain(c, W, W, .08, 4000); }, [4, 4]);
export function lab(txt, col = '#fff', size = 64) { return tex(512, 128, (c, W, H) => { c.font = `900 ${size}px Montserrat`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = size / 5; c.strokeStyle = '#0a0a0a'; c.strokeText(txt, W / 2, H / 2 + 4); c.fillStyle = col; c.fillText(txt, W / 2, H / 2 + 4); }); }
export function trefoil(col = '#ffd23f') { return tex(256, 256, (c) => { c.fillStyle = col; c.beginPath(); c.arc(128, 128, 118, 0, 7); c.fill(); c.lineWidth = 12; c.strokeStyle = '#111'; c.stroke(); c.fillStyle = '#111'; for (let k = 0; k < 3; k++) { const a0 = k * Math.PI * 2 / 3 - Math.PI / 2 - Math.PI / 6; c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 88, a0, a0 + Math.PI / 3); c.closePath(); c.fill(); } c.beginPath(); c.arc(128, 128, 16, 0, 7); c.fill(); }); }

export function buildMap() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#e9d8b8'); S.fog = new THREE.Fog('#e9d8b8', 140, 420);
  lights(S, '#fff2d8', 2.2, '#fff4e0', '#b08a5a', 1.2, [-30, 80, 60]);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ map: woodT(), roughness: .9 })); table.rotation.x = -Math.PI / 2; table.position.y = -.4; S.add(table);
  const mk = (name, ox, oz, s) => {
    const { meta, tex } = MAPS[name]; const w = (meta.lon1 - meta.lon0) * meta.cos * s, h = (meta.lat1 - meta.lat0) * s;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: .95, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: .25 })); g.rotation.x = -Math.PI / 2; g.position.set(ox, 0, oz); S.add(g);
    const edge = ibox(w + .8 * s, .4, h + .8 * s, { color: '#f6efe0' }); edge.position.set(ox, -.22, oz); S.add(edge);
    const P = (lon, lat, y = 0) => new THREE.Vector3(ox + ((lon - meta.lon0) * meta.cos - w / s / 2) * s, y, oz - (lat - (meta.lat0 + meta.lat1) / 2) * s);
    return { name, meta, s, w, h, P, ox, oz };
  };
  const wide = mk('map_wide', 0, 0, 1.0), close = mk('map_close', 80, 0, 2.2);
  S.wide = wide; S.close = close;
  // ---- pins ----
  const pins = {};
  const pinMake = (map, key, lon, lat, col, sc = 1) => {
    const g = new THREE.Group(); const p = map.P(lon, lat); g.position.copy(p); g.visible = false; S.add(g);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.3 * sc, .9 * sc, 14), new THREE.MeshStandardMaterial({ color: col, roughness: .3, emissive: col, emissiveIntensity: .45 })); cone.rotation.x = Math.PI; cone.position.y = .45 * sc; g.add(cone);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.42 * sc, 18, 14), new THREE.MeshStandardMaterial({ color: col, roughness: .25, emissive: col, emissiveIntensity: .6 })); head.position.y = 1.15 * sc; g.add(head);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.5 * sc, .62 * sc, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .06; g.add(ring);
    const glow = glowSprite(col, 3 * sc, .55); glow.position.y = 1.1 * sc; g.add(glow);
    const o = { g, p, ring, set(t, t0, h0 = 4.5) { const tau = t - t0; g.visible = tau >= 0 && t0 < 1e8; if (!g.visible) return; const G = 30; let y; const tf = Math.sqrt(2 * h0 / G); if (tau < tf) y = h0 - .5 * G * tau * tau; else { const v = G * tf * .35, u = tau - tf, tb = 2 * v / G; y = u < tb ? v * u - .5 * G * u * u : 0; } g.position.y = p.y + Math.max(0, y); const r = ((tau * 1.4) % 1); ring.material.opacity = tau > tf ? (1 - r) * .9 : 0; ring.scale.setScalar(1 + r * 3.2); } };
    pins[key] = o; return o;
  };
  S.pins = pins;
  pinMake(wide, 'kash', 74.8, 34.1, '#ff3a3a', 1.5); pinMake(wide, 'del', 77.2, 28.6, '#ff9933', 1.2); pinMake(wide, 'isb', 73.05, 33.68, '#27a844', 1.2);
  pinMake(close, 'cKash', 74.8, 34.1, '#ff3a3a', 1.2); pinMake(close, 'cSri', 74.8, 34.08, '#ff3a3a', 1.2); pinMake(close, 'cAks', 79.3, 35.1, '#d4261c', 1.1); pinMake(close, 'cSia', 77.1, 35.4, '#5ec8ff', 1.0);
  // ---- flags on the map ----
  const fl = {}; S.mflags = fl;
  const mf = (map, key, kind, lon, lat, sc = 1) => { const f = new FlagK(S, kind, 1.5 * sc, 1.0 * sc); const p = map.P(lon, lat); f.at(p.x, .1, p.z); f.g.visible = false; fl[key] = f; fl[key].p = p; fl[key].sc = sc; return f; };
  mf(wide, 'cn', 'cn', 87, 36.5, 1.5); mf(wide, 'af', 'pk', 66.5, 34.5, 0); delete fl.af; mf(wide, 'in', 'in', 78, 26, 1.5); mf(wide, 'pk', 'pk', 70, 29, 1.5); mf(wide, 'kz', 'cn', 70, 40.5, 0); delete fl.kz;
  mf(close, 'cin', 'in', 77.2, 32.2, 1.1); mf(close, 'cpk', 'pk', 72.6, 32.6, 1.1); mf(close, 'ccn', 'cn', 81.2, 36.8, 1.1);
  const lb = (txt, col = '#fff') => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: lab(txt, col), transparent: true, depthWrite: false })); s.scale.set(5, 1.25, 1); return s; };
  // ---- LoC dashes ----
  const mkDash = (map, segs, col, size, step) => { const items = []; let total = 0; segs.forEach(sg => { for (let i = 0; i < sg.length - 1; i++) { const a = map.P(sg[i][0], sg[i][1], .12), b = map.P(sg[i + 1][0], sg[i + 1][1], .12); const L = a.distanceTo(b); const n = Math.max(1, Math.round(L / step)); for (let k = 0; k < n; k++) { const u = (k + .5) / n; const pm = a.clone().lerp(b, u); const m = new THREE.Mesh(new THREE.BoxGeometry(size * .9, size * .35, L / n * .65), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.1 })); m.position.copy(pm); m.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); m.visible = false; S.add(m); items.push(m); } } }); return items; };
  S.locC = mkDash(close, close.meta.loc, '#ff2a2a', .22, .32); S.locW = mkDash(wide, wide.meta.loc, '#ff2a2a', .16, .22); S.partW = mkDash(wide, wide.meta.part, '#ffe14a', .18, .22);
  // dash sets reveal in order
  S.reveal = (items, k, t = 0) => { const n = items.length; items.forEach((m, i) => { m.visible = (i + 1) / n <= k + 1e-4; m.scale.y = 1 + .6 * Math.sin(t * 8 + i * .4) * (k > .99 ? 1 : 0); }); };
  // ---- rivers: flowing droplets ----
  const flows = []; const rivName = ['Indus', 'Jhelum', 'Chenab', 'Ravi', 'Sutlej'];
  close.meta.rivers.forEach(r => { const pts = r.p.map(c => close.P(c[0], c[1], .16)); let L = 0; const cum = [0]; for (let i = 1; i < pts.length; i++) { L += pts[i].distanceTo(pts[i - 1]); cum.push(L); } if (L < 1.2) return; const n = Math.round(L / .5); const spr = []; for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#d9f3ff' })); s.visible = false; s.scale.set(1, .5, 1); S.add(s); spr.push(s); } flows.push({ pts, cum, L, spr, name: r.n }); });
  S.flowSet = (k, t) => { flows.forEach((f, fi) => { f.spr.forEach((s, i) => { const d = (((i / f.spr.length) * f.L + t * 1.3) % f.L); const vis = k > 0 && d / f.L <= k; s.visible = vis; if (!vis) return; let j = 1; while (j < f.cum.length - 1 && f.cum[j] < d) j++; const u = (d - f.cum[j - 1]) / (f.cum[j] - f.cum[j - 1] + 1e-9); s.position.lerpVectors(f.pts[j - 1], f.pts[j], Math.min(1, u)); }); }); };
  // ---- arrows ----
  S.arrows = [];
  const arrow = (map, from, to, col) => { const a = map.P(...from, .5), b = map.P(...to, .5); const dir = b.clone().sub(a); const L = dir.length(); const g = new THREE.Group(); g.position.copy(a); g.rotation.y = Math.atan2(dir.x, dir.z); const shaft = new THREE.Mesh(new THREE.BoxGeometry(.42, .3, L - 1.2), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .7 })); shaft.position.z = (L - 1.2) / 2; g.add(shaft); const head = new THREE.Mesh(new THREE.ConeGeometry(.75, 1.4, 4), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .7 })); head.rotation.x = Math.PI / 2; head.position.z = L - .7; head.scale.set(1, 1, .5); g.add(head); g.visible = false; S.add(g); const o = { g, L, shaft, head, set(k) { g.visible = k > 0; const kk = Math.min(1, k); g.scale.set(1, 1, Math.max(.001, kk)); } }; S.arrows.push(o); return o; };
  S.arr = { cn: arrow(wide, [86, 37.4], [76, 34.8], '#ff5a4a'), af: arrow(wide, [64.5, 35.6], [73.2, 34.4], '#ffd23f'), ca: arrow(wide, [72, 41.2], [74.6, 35.6], '#59d0ff'), sa: arrow(wide, [78, 25.8], [75.6, 33.2], '#ff9933') };
  // ---- nuclear markers ----
  S.nuke = {};
  const nk = (key, map, lon, lat, col) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: trefoil(), transparent: true, depthWrite: false })); const p = map.P(lon, lat, 2.6); s.position.copy(p); s.scale.set(2.2, 2.2, 1); s.visible = false; S.add(s); const rings = [0, 1].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(.8, 1.0, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(p.x, .15, p.z); r.visible = false; S.add(r); return r; }); S.nuke[key] = { s, rings, p, set(t, t0) { const tau = t - t0; const on = tau >= 0; s.visible = on; rings.forEach(r => r.visible = on); if (!on) return; const k = Math.min(1, tau / .25); const ob = 1 + 1.6 * Math.pow(1 - k, 2) * Math.sin(k * 3); s.scale.setScalar(2.2 * Math.min(1, k * 1.3) * (1 + .1 * Math.sin(tau * 8))); rings.forEach((r, i) => { const u = ((tau * .9 + i * .5) % 1); r.scale.setScalar(1 + u * 9); r.material.opacity = (1 - u) * .8; }); } }; };
  nk('in', wide, 77.2, 28.6, '#ff9933'); nk('pk', wide, 73.05, 33.0, '#27a844'); nk('cn', wide, 84, 36.8, '#ff4a3a');
  // question mark
  const q = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(256, 256, (c) => { c.font = '900 230px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 26; c.strokeStyle = '#111'; c.strokeText('?', 128, 134); c.fillStyle = '#ffd23f'; c.fillText('?', 128, 134); }), transparent: true, depthWrite: false })); q.visible = false; S.add(q); S.q = q;
  S.clouds = clouds(S, 0, [0, 1, 0, 1], 0, 1);
  S.hatchGlow = (key, k) => { };
  S.reset = () => { Object.values(pins).forEach(p => p.g.visible = false); Object.values(fl).forEach(f => f.g.visible = false); S.reveal(S.locC, 0); S.reveal(S.locW, 0); S.reveal(S.partW, 0); S.flowSet(0, 0); S.arrows.forEach(a => a.set(0)); Object.values(S.nuke).forEach(n => n.set(0, 1e9)); q.visible = false; };
  S.update = (t, cam) => { Object.values(fl).forEach((f, i) => f.wave(t + i, .08)); };
  S.chars = {};
  return S;
}
