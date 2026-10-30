import * as THREE from 'three';
import { OUT, hash, tex, face, mat, basic, ibox, plane, glowSprite, floorGlow, rr, sline, grain } from './tex.js';
import { Char, drawChar } from './chars.js';

// ---------- people ----------
const tops = ['#3d6fb6', '#d9483b', '#e8a33a', '#2f9b8f', '#7b4fa8', '#86b06f', '#f0841e', '#5d6b7a', '#c2507a', '#3a3a44'];
const hairs = ['helmet', 'bob', 'curly', 'bun'], hcols = ['#3a2618', '#6b4428', '#1d1612', '#8a5a34', '#c9a050'];
export const person = (i, x = {}) => ({ body: tops[i % tops.length], hair: hairs[i % 4], hairCol: hcols[(i * 3 + 1) % 5], zip: i % 2 === 0, collar: i % 3 === 0, seed: 10 + i * 1.37, ...x });
export const POLICE = (i) => ({ body: '#1f2a44', hair: 'bald', hat: 'riot', seed: 50 + i, zip: true });
export const HOOD = (i) => ({ body: '#1a1a1f', hair: 'bald', hat: 'hood', mask: true, seed: 70 + i });
export const MINISTER = { body: '#2b3040', hair: 'helmet', hairCol: '#6a6a6a', tie: '#1f4fa0', collar: true, lapel: true, seed: 90 };
export const TEACHER = { body: '#8a5a8a', hair: 'bun', hairCol: '#5b3a1e', collar: true, glasses: true, seed: 95 };
export const signsFR = ['PLUS DE PROFS', 'ÉCOLE EN RUINE', 'VIE CHÈRE', 'SALAIRES !', 'ON BLOQUE TOUT', 'JUSTICE'];

// static crowd: pre-rendered textures used by cheap sprites
const crowdTexCache = {};
function crowdTex(key, opts) {
  if (crowdTexCache[key]) return crowdTexCache[key];
  const c = document.createElement('canvas'); c.width = 384; c.height = 512; const full = document.createElement('canvas'); full.width = 768; full.height = 1024;
  drawChar(full.getContext('2d'), { ...opts, t: 0 }); c.getContext('2d').drawImage(full, 0, 0, 384, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; crowdTexCache[key] = t; return t;
}
export function crowd(scene, n, area, gen, h = 1.95) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const o = gen(i); const key = JSON.stringify(o);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: crowdTex(key, o), transparent: true, alphaTest: .35, color: '#d8d8d8' }));
    sp.center.set(.5, 0); sp.scale.set(h * .75, h, 1);
    sp.position.set(area[0] + hash(i * 3.1) * (area[1] - area[0]), 0, area[2] + hash(i * 7.7) * (area[3] - area[2]));
    sp.userData.seed = hash(i * 13); scene.add(sp); list.push(sp);
  }
  return { list, update(t, jump = 0) { list.forEach(s => { s.position.y = Math.abs(Math.sin(t * (2 + jump * 3) + s.userData.seed * 9)) * (.03 + jump * .12); }); } };
}

// ---------- flags ----------
export function flagTex(kind) {
  return tex(384, 256, (c, W, H) => {
    if (kind === 'fr') { ['#002395', '#ffffff', '#ed2939'].forEach((col, i) => { c.fillStyle = col; c.fillRect(i * W / 3, 0, W / 3 + 1, H); }); }
    if (kind === 'eu') { c.fillStyle = '#003399'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffcc00'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.arc(W / 2 + Math.cos(a) * 80, H / 2 + Math.sin(a) * 80, 10, 0, 7); c.fill(); } }
    if (kind === 'us') { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#b22234'; c.fillRect(0, i * H / 13, W, H / 13 + 1); } c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, W * .4, H * 7 / 13); c.fillStyle = '#fff'; for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(12 + k * 25 + (r % 2) * 6, 14 + r * 26, 4.5, 0, 7); c.fill(); } }
    if (kind === 'pk') { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W / 4, H); c.fillStyle = '#01411c'; c.fillRect(W / 4, 0, W * .75, H); c.fillStyle = '#fff'; c.beginPath(); c.arc(W * .62, H * .5, 70, 0, 7); c.fill(); c.fillStyle = '#01411c'; c.beginPath(); c.arc(W * .66, H * .45, 60, 0, 7); c.fill(); c.fillStyle = '#fff'; c.save(); c.translate(W * .72, H * .38); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5 + .5, r = i % 2 ? 9 : 22; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore(); }
    c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(0, 0, W, H);
  });
}
export class Flag {
  constructor(scene, kind, w = 1.5, h = 1) {
    this.geo = new THREE.PlaneGeometry(w, h, 24, 12); this.geo.translate(w / 2, -h / 2, 0); this.base = this.geo.attributes.position.array.slice();
    const m = flagTex(kind); this.mesh = new THREE.Mesh(this.geo, new THREE.MeshStandardMaterial({ map: m, side: THREE.DoubleSide, roughness: .8, emissive: 0xffffff, emissiveMap: m, emissiveIntensity: .1 })); scene.add(this.mesh); this.w = w;
  }
  wave(t, amp = .09) { const p = this.geo.attributes.position.array, b = this.base; for (let i = 0; i < p.length; i += 3) { const x = b[i], y = b[i + 1], k = x / this.w; p[i + 2] = Math.sin(x * 4.2 - t * 6 + y * 1.5) * amp * k + Math.sin(x * 9 - t * 9) * amp * .25 * k; } this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); }
}
function pole(scene, x, y, z, h, rotZ = 0) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.03, .035, h, 10), new THREE.MeshStandardMaterial({ color: '#d9d4c8', metalness: .4, roughness: .4 })); p.position.set(x, y + h / 2, z); p.rotation.z = rotZ; scene.add(p); return p; }

// ---------- fire & smoke ----------
const flameT = tex(128, 256, (c, W, H) => { const g = c.createRadialGradient(64, 190, 6, 64, 170, 110); g.addColorStop(0, 'rgba(255,250,210,1)'); g.addColorStop(.3, 'rgba(255,190,60,.95)'); g.addColorStop(.65, 'rgba(240,80,20,.6)'); g.addColorStop(1, 'rgba(120,20,0,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(64, 10); c.bezierCurveTo(110, 90, 120, 160, 110, 200); c.bezierCurveTo(100, 250, 28, 250, 18, 200); c.bezierCurveTo(8, 160, 18, 90, 64, 10); c.fill(); });
const smokeT = tex(128, 128, (c) => { for (let i = 0; i < 6; i++) { const g = c.createRadialGradient(40 + hash(i) * 48, 40 + hash(i + 3) * 48, 0, 64, 64, 60); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); } });
export function fire(scene, x, y, z, size = 1, n = 9) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const fl = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); s.center.set(.5, .05); g.add(s); fl.push(s); }
  const sm = []; for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: '#2a2a2e', opacity: .5 })); g.add(s); sm.push(s); }
  const light = new THREE.PointLight('#ff8a30', 6 * size, 7 * size, 1.4); light.position.set(0, .8 * size, 0); g.add(light);
  const glow = floorGlow('#ff7a20', 4 * size, 4 * size, .45); glow.position.y = .02 - y; g.add(glow);
  return { g, light, update(t, k = 1) { g.visible = k > 0.01;
    fl.forEach((s, i) => { const ph = t * (3 + hash(i) * 3) + i * 1.7; const f = .6 + .4 * Math.sin(ph) * Math.sin(ph * 1.7); s.position.set((hash(i) - .5) * .9 * size, 0, (hash(i + 5) - .5) * .5 * size); s.scale.set(.55 * size * f * k, 1.25 * size * (.7 + .5 * f) * k, 1); s.material.opacity = .9; });
    sm.forEach((s, i) => { const life = ((t * .35 + i / sm.length) % 1); s.position.set((hash(i) - .5) * .8 * size + Math.sin(t + i) * .2 * life, (1.0 + life * 4.5) * size, (hash(i + 2) - .5) * .5); const sc = (.8 + life * 3.5) * size; s.scale.set(sc, sc, 1); s.material.opacity = .55 * Math.sin(life * Math.PI) * k; });
    light.intensity = (6 + Math.sin(t * 17) * 1.5 + Math.sin(t * 29) * 1) * size * k; } };
}
export function gas(scene, x, z, n = 8, col = '#cfd4dc') {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const sm = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: col, opacity: .5 })); g.add(s); sm.push(s); }
  return { g, update(t, k = 1) { g.visible = k > .01; sm.forEach((s, i) => { const life = ((t * .2 + i / n) % 1); s.position.set((hash(i) - .5) * 5 + Math.sin(t * .5 + i) * .6, .5 + life * 1.8, (hash(i + 4) - .5) * 3); const sc = 1.5 + life * 3; s.scale.set(sc, sc, 1); s.material.opacity = .32 * Math.sin(life * Math.PI) * k; }); } };
}

// ---------- Haussmann facade ----------
function haussmann(night, seed, floors = 6, cols = 6) {
  return face('#e4d9bf', (c, W, H) => {
    const fh = H / floors;
    for (let f = 0; f < floors; f++) {
      const y0 = H - (f + 1) * fh;
      if (f === 0) { for (let k = 0; k < cols; k++) { const x = k * W / cols + 8; const lit = night ? hash(seed + k) > .3 : false; c.fillStyle = lit ? '#ffcf8a' : (night ? '#2a2630' : '#3d4a5a'); c.fillRect(x, y0 + 20, W / cols - 16, fh - 24); c.lineWidth = 4; c.strokeStyle = OUT; c.strokeRect(x, y0 + 20, W / cols - 16, fh - 24); c.fillStyle = ['#7a1f2a', '#1f4a3a', '#2a3a6a'][(seed + k) % 3]; c.beginPath(); c.moveTo(x - 4, y0 + 20); c.lineTo(x + W / cols - 12, y0 + 20); c.lineTo(x + W / cols - 4, y0 + 46); c.lineTo(x - 12, y0 + 46); c.closePath(); c.fill(); c.stroke(); } continue; }
      for (let k = 0; k < cols; k++) {
        const x = k * W / cols + W / cols * .25, w = W / cols * .5; const lit = night && hash(seed * 7 + f * 13 + k) > .55;
        c.fillStyle = lit ? '#ffcf8a' : (night ? '#222838' : '#53657a'); c.fillRect(x, y0 + fh * .18, w, fh * .62); c.lineWidth = 3.5; c.strokeStyle = OUT; c.strokeRect(x, y0 + fh * .18, w, fh * .62);
        sline(c, x + w / 2, y0 + fh * .18, x + w / 2, y0 + fh * .8, 2.5);
        if (f === 2 || f === 5 || k % 2 === 0) { c.strokeStyle = '#1a1a1a'; c.lineWidth = 3; c.strokeRect(x - 6, y0 + fh * .66, w + 12, fh * .16); for (let b = 0; b < 6; b++) sline(c, x - 6 + b * (w + 12) / 5, y0 + fh * .66, x - 6 + b * (w + 12) / 5, y0 + fh * .82, 2, '#1a1a1a'); }
      }
      sline(c, 0, y0 + fh, W, y0 + fh, 3, 'rgba(90,70,50,.5)');
    }
    grain(c, W, H, .05);
  }, { w: 512, h: 768 });
}
function building(scene, x, z, w, h, rotY, night, seed) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  const front = haussmann(night, seed);
  const b = ibox(w, h, 8, { color: '#e4d9bf', front }, { frontEmis: night ? .5 : 0 }); b.position.y = h / 2; g.add(b);
  const roofT = face('#5f6f80', (c, W, H) => { for (let k = 0; k < 5; k++) { rr(c, 30 + k * 95, 40, 50, 70, 8); c.fillStyle = night && hash(seed + k) > .6 ? '#ffcf8a' : '#2a3442'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke(); } }, { w: 512, h: 160 });
  const roof = ibox(w, 2.2, 1.6, { color: '#5f6f80', front: roofT }); roof.position.set(0, h + 1.1, 3.2); roof.rotation.x = -.35; g.add(roof);
  const roofTop = ibox(w, .3, 6, { color: '#4f5e6e' }); roofTop.position.set(0, h + 2.05, -.6); g.add(roofTop);
  for (let k = 0; k < 3; k++) { const ch = ibox(.5, 1, .5, { color: '#c7a07a' }); ch.position.set(-w / 2 + 1 + k * w / 3, h + 2.6, -1); g.add(ch); }
  return g;
}
function eiffel(scene, x, z, s, night) {
  const t = tex(512, 1024, (c, W, H) => {
    const col = night ? '#e8a84a' : '#5a4a3a'; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 10;
    const L = (y) => W / 2 - (W * .46) * Math.pow(1 - y / H, 2.3) - 8, R_ = (y) => W - L(y);
    c.beginPath(); c.moveTo(W / 2, 0); for (let y = 0; y <= H; y += 8) c.lineTo(L(y), y); c.lineTo(R_(H), H); for (let y = H; y >= 0; y -= 8) c.lineTo(R_(y), y); c.closePath(); c.save(); c.clip();
    c.lineWidth = 4; for (let y = 60; y < H; y += 26) { c.beginPath(); c.moveTo(L(y), y); c.lineTo(R_(y + 26), y + 26); c.moveTo(R_(y), y); c.lineTo(L(y + 26), y + 26); c.stroke(); } c.restore();
    c.lineWidth = 12; c.beginPath(); for (let y = 0; y <= H; y += 8) c.lineTo(L(y), y); c.stroke(); c.beginPath(); for (let y = 0; y <= H; y += 8) c.lineTo(R_(y), y); c.stroke();
    c.fillStyle = night ? '#0a0a14' : '#9fb4cf'; c.beginPath(); c.ellipse(W / 2, H, W * .28, H * .16, 0, Math.PI, 0); c.fill();
    c.fillStyle = col; c.fillRect(L(H * .42) - 6, H * .42, R_(H * .42) - L(H * .42) + 12, 18); c.fillRect(L(H * .7) - 8, H * .7, R_(H * .7) - L(H * .7) + 16, 22);
  });
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .3, side: THREE.DoubleSide, toneMapped: !night, fog: true });
  for (const r of [0, Math.PI / 2]) { const p = plane(s * .5, s, m); p.position.set(x, s / 2, z); p.rotation.y = r + .4; scene.add(p); }
  if (night) { const b = glowSprite('#ffd27a', s * .5, .25); b.position.set(x, s * .55, z); scene.add(b); const beacon = glowSprite('#ffffff', s * .12, .9); beacon.position.set(x, s, z); scene.add(beacon); }
}
function car(scene, x, z, rot, burnt) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  const col = burnt ? '#2a2420' : '#c8402f';
  const body = ibox(3.6, .8, 1.7, { color: col }); body.position.y = .65; g.add(body);
  const cab = ibox(2.0, .7, 1.5, { color: burnt ? '#1a1614' : '#b8392a', front: face(burnt ? '#141210' : '#9ec0de', null) }); cab.position.set(-.2, 1.35, 0); g.add(cab);
  for (const [wx, wz] of [[-1.2, .85], [1.2, .85], [-1.2, -.85], [1.2, -.85]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .25, 16), new THREE.MeshStandardMaterial({ color: '#111' })); w.rotation.x = Math.PI / 2; w.position.set(wx, .36, wz); g.add(w); }
  return g;
}

// ================= PARIS STREET (night riot / day aftermath) =================
export function buildStreet() {
  const S = new THREE.Scene();
  const skyN = tex(256, 512, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05060f'); g.addColorStop(.7, '#2a1a30'); g.addColorStop(1, '#6a2a1a'); c.fillStyle = g; c.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${.3 + .5 * hash(i)})`; c.fillRect(hash(i + 1) * W, hash(i + 2) * H * .5, 1.5, 1.5); } });
  const skyD = tex(256, 512, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fb0d8'); g.addColorStop(1, '#e8ecf0'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
  const sky = plane(300, 160, basic(skyN)); sky.position.set(0, 60, -120); S.add(sky);
  const roadT = tex(512, 512, (c, W) => { c.fillStyle = '#26252c'; c.fillRect(0, 0, W, W); grain(c, W, W, .12, 9000); sline(c, W / 2, 0, W / 2, W, 6, 'rgba(230,230,230,.5)'); }, [1, 20]);
  const road = plane(9, 200, mat(roadT, { rough: .45 })); road.rotation.x = -Math.PI / 2; road.position.z = -60; S.add(road);
  const swT = tex(256, 256, (c, W) => { c.fillStyle = '#7a7368'; c.fillRect(0, 0, W, W); for (let i = 0; i < 4; i++) { sline(c, 0, i * 64, W, i * 64, 3, 'rgba(30,25,20,.5)'); sline(c, i * 64, 0, i * 64, W, 3, 'rgba(30,25,20,.5)'); } }, [2, 60]);
  for (const s of [-1, 1]) { const sw = ibox(4, .15, 200, { color: '#7a7368', top: swT }); sw.position.set(s * 6.5, .075, -60); S.add(sw); }
  const bN = [], bD = [];
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) {
    const z = 2 - i * 13, h = 18 + hash(i * 2 + s) * 2;
    const bn = building(S, s * 12.5, z, 12.6, h, -s * Math.PI / 2, true, i * 10 + (s > 0 ? 5 : 0)); bN.push(bn);
    const bd = building(S, s * 12.5, z, 12.6, h, -s * Math.PI / 2, false, i * 10 + (s > 0 ? 5 : 0)); bd.visible = false; bD.push(bd);
  }
  eiffel(S, 0, -110, 60, true);
  // street lamps
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { const z = -i * 12; const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 5), new THREE.MeshStandardMaterial({ color: '#1f2a24' })); p.position.set(s * 5, 2.5, z); S.add(p); const gl = glowSprite('#ffe3a8', 1.1, .8); gl.position.set(s * 5, 5.1, z); S.add(gl); }
  const lampLights = []; for (let i = 0; i < 4; i++) { const pl = new THREE.PointLight('#ffd9a0', 6, 12, 1.3); pl.position.set(i % 2 ? 5 : -5, 5, -i * 12); S.add(pl); lampLights.push(pl); }
  // props
  const car1 = car(S, 1.0, -2.2, .4, true); const fire1 = fire(S, 1.0, 1.1, -2.2, 1.7, 14);
  const bin = ibox(.7, 1, .7, { color: '#2a4a2a' }); bin.position.set(-3.4, .5, -9); S.add(bin); const fire2 = fire(S, -3.4, 1.0, -9, .7, 8);
  const fire3 = fire(S, 4.2, 0, -16, .9, 9);
  const kiosk = ibox(1.6, 2.4, 1.6, { color: '#2f5a3a' }); kiosk.position.set(-4.6, 1.2, -14); S.add(kiosk); const fire4 = fire(S, -4.6, 2.4, -14, .9, 9);
  // broken shop window (right side ground floor at z=-3)
  const shopT = tex(512, 320, (c, W, H) => { c.fillStyle = '#1a1414'; c.fillRect(0, 0, W, H); c.fillStyle = '#3a2a24'; for (let i = 0; i < 6; i++) c.fillRect(40 + i * 75, 140, 50, 140); c.strokeStyle = 'rgba(220,235,255,.85)'; c.lineWidth = 3; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; c.beginPath(); c.moveTo(W * .45, H * .45); c.lineTo(W * .45 + Math.cos(a) * 400, H * .45 + Math.sin(a) * 300); c.stroke(); } for (let r = 1; r < 5; r++) { c.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2; const rr_ = r * 40 * (1 + hash(i + r) * .4); c.lineTo(W * .45 + Math.cos(a) * rr_, H * .45 + Math.sin(a) * rr_ * .8); } c.stroke(); } c.lineWidth = 10; c.strokeStyle = OUT; c.strokeRect(0, 0, W, H); });
  const shop = plane(4.2, 2.6, mat(shopT, { emis: .25 })); shop.rotation.y = -Math.PI / 2; shop.position.set(8.48, 1.5, -3); S.add(shop);
  const shards = new THREE.Group(); for (let i = 0; i < 30; i++) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(.15 + hash(i) * .2, .1 + hash(i + 1) * .15), new THREE.MeshStandardMaterial({ color: '#cfe2ff', roughness: .1, metalness: .5, transparent: true, opacity: .8, side: THREE.DoubleSide })); sh.rotation.set(-Math.PI / 2, 0, hash(i) * 6); sh.position.set(7.4 - hash(i + 3) * 2.2, .16, -3 + (hash(i + 7) - .5) * 4); shards.add(sh); } S.add(shards);
  const gas1 = gas(S, 0, -13.5, 10, '#5d616b');
  const hemi = new THREE.HemisphereLight('#6a70b0', '#3a2018', .5); S.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0dc', 0); sun.position.set(10, 20, 10); S.add(sun);
  const flashes = []; for (let i = 0; i < 3; i++) { const f = new THREE.PointLight('#fff2c0', 0, 20, 1.2); S.add(f); flashes.push(f); }
  const chars = {}; for (let i = 0; i < 6; i++) chars['p' + i] = new Char(S, POLICE(i)); for (let i = 0; i < 4; i++) chars['h' + i] = new Char(S, HOOD(i)); for (let i = 0; i < 6; i++) chars['c' + i] = new Char(S, person(i + 1)); chars.student = new Char(S, person(0, { body: '#d9483b', hair: 'curly' })); chars.sweeper = new Char(S, { body: '#2fae5a', hair: 'helmet', hairCol: '#2a1a10', zip: true, seed: 99, cap: '#2fae5a' });
  const crowdN = crowd(S, 40, [-5, 5, -11, -5.5], i => person(i + 20, i % 4 === 0 ? { arms: 'sign', sign: signsFR[i % signsFR.length], back: false } : (i % 5 === 1 ? HOOD(i) : { back: true })));
  return { scene: S, chars, sky, skyN, skyD, bN, bD, fires: [fire1, fire2, fire3, fire4], car1, gas1, hemi, sun, flashes, lampLights, crowdN, shards, shop,
    setMode(night) { this.sky.material.map = night ? this.skyN : this.skyD; this.sky.material.needsUpdate = true; this.bN.forEach(b => b.visible = night); this.bD.forEach(b => b.visible = !night); this.hemi.intensity = night ? .5 : 1.3; this.hemi.color.set(night ? '#6a70b0' : '#e6eeff'); this.sun.intensity = night ? 0 : 1.6; this.lampLights.forEach(l => l.intensity = night ? 6 : 0); this.scene.fog = night ? new THREE.Fog('#140c14', 18, 90) : new THREE.Fog('#d6dde6', 40, 130); },
    update(t) { } };
}

// ================= PLACE DE LA RÉPUBLIQUE (huge crowd, day) =================
export function buildRepublique() {
  const S = new THREE.Scene();
  const skyD = tex(256, 512, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7da2d0'); g.addColorStop(1, '#e8ecf0'); c.fillStyle = g; c.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.ellipse(hash(i) * W, 60 + hash(i + 2) * 180, 50, 14, 0, 0, 7); c.fill(); } });
  const sky = plane(300, 160, basic(skyD)); sky.position.set(0, 60, -120); S.add(sky); S.fog = new THREE.Fog('#d6dde6', 40, 140);
  const pT = tex(512, 512, (c, W) => { c.fillStyle = '#a49a8a'; c.fillRect(0, 0, W, W); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.lineWidth = 2; c.strokeStyle = 'rgba(60,50,40,.35)'; c.strokeRect(i * 64, j * 64, 64, 64); } }, [20, 20]);
  const pl = plane(200, 200, mat(pT)); pl.rotation.x = -Math.PI / 2; pl.position.z = -40; S.add(pl);
  for (let i = 0; i < 7; i++) { const a = Math.PI * (.15 + i * .12); building(S, Math.cos(a) * -40, -30 - Math.sin(a) * 30, 16, 20, a - Math.PI / 2 + .1, false, 300 + i); }
  // Marianne monument
  const bronze = new THREE.MeshStandardMaterial({ color: '#5a6a4a', roughness: .5, metalness: .4 }), stone = new THREE.MeshStandardMaterial({ color: '#cfc6b4', roughness: .8 });
  const mon = new THREE.Group(); mon.position.set(0, 0, -26); S.add(mon);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5, 1.2, 32), stone); base.position.y = .6; mon.add(base);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 8, 24), stone); ped.position.y = 5.2; mon.add(ped);
  const dress = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4.5, 24), bronze); dress.position.y = 11.4; mon.add(dress);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.55, 16, 12), bronze); head.position.y = 14.1; mon.add(head);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 2.6), bronze); arm.position.set(.9, 14.4, 0); arm.rotation.z = -.6; mon.add(arm);
  const branch = new THREE.Mesh(new THREE.SphereGeometry(.4, 10, 8), bronze); branch.position.set(1.7, 15.6, 0); branch.scale.set(1, .5, .5); mon.add(branch);
  for (let i = 0; i < 3; i++) { const fig = new THREE.Mesh(new THREE.ConeGeometry(.6, 2.4, 12), bronze); const a = i * 2.1; fig.position.set(Math.cos(a) * 2.6, 2.4, Math.sin(a) * 2.6); mon.add(fig); }
  const lion = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 3), bronze); lion.position.set(0, 1.8, 4.2); mon.add(lion);
  // giant crowd (static sprites) + flags
  const crowdBig = crowd(S, 260, [-26, 26, -48, 8], i => i % 7 === 0 ? person(i, { arms: 'sign', sign: signsFR[i % signsFR.length] }) : (i % 3 === 0 ? person(i, { back: true }) : person(i, { face: (hash(i) - .5) * .6, expr: i % 2 ? 'angry' : 'neutral' })));
  const flags = []; for (let i = 0; i < 10; i++) { const x = -20 + hash(i * 5) * 40, z = -40 + hash(i * 9) * 44; pole(S, x, 0, z, 4.2, (hash(i) - .5) * .2); const f = new Flag(S, i % 3 ? 'fr' : 'fr', 1.6, 1.05); f.mesh.position.set(x + .03, 4.2, z); flags.push(f); }
  const bannerT = tex(1024, 200, (c, W, H) => { c.fillStyle = '#e8e2d2'; c.fillRect(0, 0, W, H); c.font = 'bold 110px "DejaVu Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c8102e'; c.fillText('ON BLOQUE TOUT', W / 2, H / 2 + 6); c.lineWidth = 8; c.strokeStyle = OUT; c.strokeRect(0, 0, W, H); });
  const banner = plane(8, 1.6, mat(bannerT)); banner.position.set(-3, 2.6, -6); S.add(banner); pole(S, -7, 0, -6, 3.4); pole(S, 1, 0, -6, 3.4);
  S.add(new THREE.HemisphereLight('#e6eeff', '#6a5a50', 1.25)); const sun = new THREE.DirectionalLight('#fff0dc', 1.5); sun.position.set(-10, 25, 10); S.add(sun);
  return { scene: S, chars: {}, crowdBig, flags, update(t) { this.flags.forEach(f => f.wave(t)); this.crowdBig.update(t, .6); } };
}

// ================= SCHOOL exterior + CLASSROOM =================
export function buildSchool() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#9fb8d8');
  const sky = plane(200, 100, basic(tex(64, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#86a8d6'); g.addColorStop(1, '#e6ecf2'); c.fillStyle = g; c.fillRect(0, 0, W, H); }))); sky.position.set(0, 40, -80); S.add(sky);
  const gT = tex(256, 256, (c, W) => { c.fillStyle = '#8a8478'; c.fillRect(0, 0, W, W); grain(c, W, W, .1, 3000); }, [30, 30]);
  const gr = plane(120, 120, mat(gT)); gr.rotation.x = -Math.PI / 2; gr.position.z = -20; S.add(gr);
  const facT = face('#d8c8a8', (c, W, H) => { for (let r = 0; r < 3; r++) for (let k = 0; k < 10; k++) { c.fillStyle = '#5a7088'; c.fillRect(20 + k * 49, 50 + r * 64, 30, 40); c.lineWidth = 3; c.strokeStyle = OUT; c.strokeRect(20 + k * 49, 50 + r * 64, 30, 40); } c.fillStyle = '#1f3a6a'; c.fillRect(W / 2 - 120, 4, 240, 38); c.fillStyle = '#fff'; c.font = 'bold 30px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText('LYCÉE', W / 2, 33); c.fillStyle = '#c9a24a'; c.font = 'bold 14px "DejaVu Sans"'; c.fillText('LIBERTÉ · ÉGALITÉ · FRATERNITÉ', W / 2, H - 6); for (let i = 0; i < 6; i++) { c.strokeStyle = 'rgba(60,40,30,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(hash(i) * W, hash(i + 1) * H); c.lineTo(hash(i) * W + 20, hash(i + 1) * H + 30); c.lineTo(hash(i) * W + 10, hash(i + 1) * H + 60); c.stroke(); } }, { w: 512, h: 256 });
  const fac = ibox(26, 10, 6, { color: '#d8c8a8', front: facT }); fac.position.set(0, 5, -14); S.add(fac);
  const gate = new THREE.Group(); for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.2), new THREE.MeshStandardMaterial({ color: '#1f2a3a' })); b.position.set(-6 + i * .3 + (i > 6 ? 5.2 : 0), 1.1, -8); gate.add(b); } S.add(gate);
  for (const s of [-1, 1]) { const f = new Flag(S, 'fr', 1.4, .9); f.mesh.position.set(s * 3 + .03, 8.6, -10.95); pole(S, s * 3, 6.8, -10.95, 2, s * .5); }
  // classroom (separate area at x=60)
  const R = new THREE.Group(); R.position.set(60, 0, 0); S.add(R);
  const wallT = tex(512, 512, (c, W, H) => { c.fillStyle = '#d9cfa8'; c.fillRect(0, 0, W, H); c.fillStyle = '#8aa08a'; c.fillRect(0, H * .62, W, H * .38); sline(c, 0, H * .62, W, H * .62, 5); for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(120,90,60,.25)'; c.beginPath(); c.ellipse(hash(i) * W, hash(i + 3) * H * .5, 30 + hash(i) * 50, 20, 0, 0, 7); c.fill(); } grain(c, W, H, .06); }, [3, 1]);
  const back = plane(10, 3.2, mat(wallT)); back.position.set(0, 1.6, -3.5); R.add(back);
  for (const s of [-1, 1]) { const w = plane(10, 3.2, mat(wallT)); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 4.5, 1.6, 1); R.add(w); }
  const ceilT = tex(512, 512, (c, W) => { c.fillStyle = '#e2ddcc'; c.fillRect(0, 0, W, W); c.strokeStyle = '#3a2a1a'; c.lineWidth = 4; c.beginPath(); c.moveTo(80, 120); c.lineTo(160, 170); c.lineTo(150, 240); c.lineTo(260, 300); c.lineTo(250, 380); c.stroke(); c.fillStyle = 'rgba(120,90,50,.35)'; c.beginPath(); c.ellipse(220, 260, 120, 80, .4, 0, 7); c.fill(); }, [1, 1]);
  const ceil = plane(9, 9, mat(ceilT)); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.2, 0); R.add(ceil);
  const flT = tex(256, 256, (c, W) => { c.fillStyle = '#8a6a4a'; c.fillRect(0, 0, W, W); for (let i = 0; i < 8; i++) sline(c, 0, i * 32, W, i * 32, 3, 'rgba(40,20,8,.45)'); }, [6, 6]);
  const fl = plane(9, 9, mat(flT)); fl.rotation.x = -Math.PI / 2; R.add(fl);
  const board = plane(3.4, 1.3, mat(face('#2f4a3b', (c, W, H) => { c.font = 'bold 30px "DejaVu Sans"'; c.fillStyle = '#eef2ea'; c.fillText('Classe : 38 élèves', 30, 60); c.fillText('Profs absents : 3', 30, 110); c.fillText('Chauffage : en panne', 30, 160); }, { w: 512, h: 196 }), { emis: .2 })); board.position.set(-.5, 1.7, -3.48); R.add(board);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const d = ibox(.9, .72, .55, { color: '#a07a4a' }); d.position.set(-2.4 + k * 1.3, .36, -1.8 + r * 1.1); d.rotation.y = (hash(r * 4 + k) - .5) * .15; R.add(d); }
  const brokenDesk = ibox(.9, .3, .55, { color: '#8a6a3a' }); brokenDesk.position.set(2.8, .15, -2.6); brokenDesk.rotation.z = .5; R.add(brokenDesk);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(.18, .14, .3, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#4a7ab8', side: THREE.DoubleSide, roughness: .4 })); bucket.position.set(.9, .15, 2.3); R.add(bucket);
  const drip = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), new THREE.MeshStandardMaterial({ color: '#9fd0ff', roughness: .1, transparent: true, opacity: .85 })); R.add(drip);
  const win = plane(1.8, 1.5, basic(tex(256, 256, (c, W, H) => { c.fillStyle = '#bcd4ee'; c.fillRect(0, 0, W, H); c.lineWidth = 12; c.strokeStyle = '#eeeae0'; c.strokeRect(0, 0, W, H); sline(c, W / 2, 0, W / 2, H, 10, '#eeeae0'); c.lineWidth = 4; c.strokeStyle = '#3a2a1a'; c.beginPath(); c.moveTo(40, 40); c.lineTo(90, 100); c.lineTo(70, 150); c.stroke(); }))); win.rotation.y = Math.PI / 2; win.position.set(-4.48, 1.8, -.5); R.add(win);
  const roomL = new THREE.PointLight('#fff2dc', 5, 9, 1.2); roomL.position.set(60, 2.9, 0); S.add(roomL);
  S.add(new THREE.HemisphereLight('#e6eeff', '#6a5a50', 1.15)); const sun = new THREE.DirectionalLight('#fff0dc', 1.3); sun.position.set(-10, 20, 10); S.add(sun);
  const chars = { teacher: new Char(S, TEACHER) }; for (let i = 0; i < 9; i++) chars['s' + i] = new Char(S, person(i + 30, { arms: i < 5 ? 'sign' : 'down', sign: signsFR[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 5] }));
  return { scene: S, chars, drip, update(t) { const k = (t * 1.3) % 1; this.drip.position.set(60.9, 3.15 - k * k * 3.0, 2.3); } };
}

// ================= SUPERMARKET (prices) =================
export function buildMarket() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#1a1a1a');
  const wallT = tex(256, 256, (c, W) => { c.fillStyle = '#e8e4da'; c.fillRect(0, 0, W, W); }, [4, 1]);
  const back = plane(14, 4, mat(wallT)); back.position.set(0, 2, -3); S.add(back);
  const fl = plane(14, 14, mat(tex(256, 256, (c, W) => { c.fillStyle = '#cfcac0'; c.fillRect(0, 0, W, W); sline(c, 0, 0, W, 0, 3, 'rgba(0,0,0,.2)'); sline(c, 0, 0, 0, W, 3, 'rgba(0,0,0,.2)'); }, [10, 10]), { rough: .3 })); fl.rotation.x = -Math.PI / 2; S.add(fl);
  const prods = ['#d9483b', '#f2c230', '#3d6fb6', '#2f9b8f', '#e8a33a', '#7b4fa8'];
  const tags = [];
  for (let r = 0; r < 4; r++) {
    const sh = ibox(7, .06, .6, { color: '#9aa4ae' }); sh.position.set(0, .4 + r * .6, -2.6); S.add(sh);
    for (let k = 0; k < 14; k++) { const b = ibox(.32, .42, .3, { color: prods[(r * 3 + k) % 6], front: face(prods[(r * 3 + k) % 6], (c, W, H) => { c.fillStyle = '#fff'; c.fillRect(20, 90, W - 40, 60); c.fillStyle = OUT; c.font = 'bold 34px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText(['LAIT', 'PAIN', 'RIZ', 'PÂTES', 'HUILE', 'CAFÉ'][(r + k) % 6], W / 2, 132); }) }); b.position.set(-3.2 + k * .48, .64 + r * .6, -2.6); S.add(b); }
    for (let k = 0; k < 4; k++) { const tT = tex(256, 128, () => { }); const tg = plane(.42, .21, mat(tT, { emis: .4 })); tg.position.set(-2.6 + k * 1.7, .33 + r * .6, -2.29); S.add(tg); tags.push({ tT, base: 1.2 + hash(r * 4 + k) * 3, seed: r * 4 + k }); }
  }
  S.add(new THREE.HemisphereLight('#ffffff', '#555', 1.2)); const pl = new THREE.PointLight('#fff', 6, 10, 1.2); pl.position.set(0, 3.5, 0); S.add(pl);
  const chars = { shopper: new Char(S, person(4, { hair: 'bun', body: '#c2507a' })) };
  return { scene: S, chars, tags, drawTags(k) { this.tags.forEach(g => { const c = g.tT.userData.canvas.getContext('2d'); const v = g.base * (1 + k * (.4 + hash(g.seed) * .5)); c.fillStyle = k > .05 ? '#ffe14a' : '#ffffff'; c.fillRect(0, 0, 256, 128); c.fillStyle = k > .05 ? '#c8102e' : OUT; c.font = 'bold 72px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText(v.toFixed(2).replace('.', ',') + ' €', 128, 90); if (k > .05) { c.font = 'bold 40px "DejaVu Sans"'; c.fillText('▲', 230, 50); } c.lineWidth = 8; c.strokeStyle = OUT; c.strokeRect(0, 0, 256, 128); g.tT.needsUpdate = true; }); }, update() { } };
}

// ================= GOVERNMENT / CITY HALL (day + night fire) =================
export function buildHall() {
  const S = new THREE.Scene();
  const skyN = tex(64, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05060f'); g.addColorStop(1, '#4a2018'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
  const skyD = tex(64, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6a7f9a'); g.addColorStop(1, '#c8ccd2'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
  const sky = plane(200, 100, basic(skyD)); sky.position.set(0, 40, -60); S.add(sky);
  const gT = tex(256, 256, (c, W) => { c.fillStyle = '#9a9286'; c.fillRect(0, 0, W, W); for (let i = 0; i < 4; i++) { sline(c, 0, i * 64, W, i * 64, 2, 'rgba(40,35,30,.4)'); sline(c, i * 64, 0, i * 64, W, 2, 'rgba(40,35,30,.4)'); } }, [30, 30]);
  const gr = plane(120, 120, mat(gT, { rough: .5 })); gr.rotation.x = -Math.PI / 2; gr.position.z = -20; S.add(gr);
  const facT = (night) => face('#e3d6b8', (c, W, H) => { for (let r = 0; r < 2; r++) for (let k = 0; k < 9; k++) { const lit = night && hash(r * 9 + k) > .5; c.fillStyle = lit ? '#ffb060' : '#3a4a5a'; rr(c, 22 + k * 54, 40 + r * 100, 30, 70, 14); c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke(); } c.fillStyle = '#2a2018'; rr(c, W / 2 - 34, H - 80, 68, 80, 30); c.fill(); c.fillStyle = '#1f3a6a'; c.font = 'bold 22px "DejaVu Sans"'; c.textAlign = 'center'; c.fillStyle = '#3a2a1a'; c.fillText('HÔTEL DE VILLE', W / 2, 26); }, { w: 512, h: 256 });
  const fD = facT(false), fN = facT(true);
  const hall = ibox(20, 9, 6, { color: '#e3d6b8', front: fD }); hall.position.set(0, 4.5, -14); S.add(hall);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 1, 1, 4, 1), new THREE.MeshStandardMaterial({ color: '#4f5e6e' })); roof.scale.set(14.5, 3, 4.2); roof.rotation.y = Math.PI / 4; roof.position.set(0, 10.5, -14); S.add(roof);
  const clockTower = ibox(3, 4, 3, { color: '#e3d6b8' }); clockTower.position.set(0, 11, -13.5); S.add(clockTower);
  const cf = plane(1.6, 1.6, mat(tex(128, 128, (c) => { c.beginPath(); c.arc(64, 64, 58, 0, 7); c.fillStyle = '#f2ecde'; c.fill(); c.lineWidth = 8; c.strokeStyle = OUT; c.stroke(); sline(c, 64, 64, 64, 24, 6); sline(c, 64, 64, 92, 70, 5); }))); cf.position.set(0, 11.4, -11.98); S.add(cf);
  const flags = []; for (const s of [-1, 1]) { pole(S, s * 1.6, 9, -10.9, 2.2, s * .4); const f = new Flag(S, s < 0 ? 'fr' : 'eu', 1.3, .85); f.mesh.position.set(s * 1.6 + s * .4, 11.0, -10.9); flags.push(f); }
  const fires = [fire(S, -3.5, 9.4, -11.6, 3.0, 14), fire(S, 3.5, 9.2, -11.8, 2.6, 12), fire(S, 0, 12.8, -12.2, 2.2, 10), fire(S, -7, 7.5, -11.2, 2.0, 10)];
  const doorBroken = plane(1.6, 2.2, mat(face('#2a1a12', (c, W, H) => { c.strokeStyle = '#d6a050'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * .3, 0); c.lineTo(W * .6, H * .4); c.lineTo(W * .4, H * .7); c.lineTo(W * .7, H); c.stroke(); }, { w: 128, h: 256 }))); doorBroken.position.set(0, 1.1, -10.98); S.add(doorBroken);
  const debris = new THREE.Group(); for (let i = 0; i < 16; i++) { const d = ibox(.3 + hash(i) * .5, .15, .3 + hash(i + 1) * .4, { color: ['#4a3a2a', '#8a8070', '#2a2a2a'][i % 3] }); d.position.set((hash(i + 2) - .5) * 8, .08, -9 + (hash(i + 3) - .5) * 4); d.rotation.y = hash(i) * 3; debris.add(d); } S.add(debris);
  const hemi = new THREE.HemisphereLight('#e6eeff', '#6a5a50', 1.1); S.add(hemi); const sun = new THREE.DirectionalLight('#fff0dc', 1.0); sun.position.set(-10, 20, 10); S.add(sun);
  const chars = {}; for (let i = 0; i < 3; i++) chars['h' + i] = new Char(S, HOOD(i + 10)); for (let i = 0; i < 2; i++) chars['g' + i] = new Char(S, { body: '#1f2a44', hair: 'helmet', hairCol: '#2a1a10', cap: '#1f2a44', seed: 200 + i });
  return { scene: S, chars, hall, fD, fN, sky, skyD, skyN, fires, flags, debris, doorBroken, hemi, sun,
    setMode(night) { this.sky.material.map = night ? this.skyN : this.skyD; this.sky.material.needsUpdate = true; this.hall.material[4].map = night ? this.fN : this.fD; this.hall.material[4].emissiveMap = night ? this.fN : null; this.hall.material[4].emissive.set(night ? '#ffffff' : '#000000'); this.hall.material[4].emissiveIntensity = night ? .35 : 0; this.hall.material[4].needsUpdate = true; this.hemi.intensity = night ? .35 : 1.1; this.sun.intensity = night ? 0 : 1.0; this.debris.visible = this.doorBroken.visible = night; this.scene.fog = night ? new THREE.Fog('#1a0c0a', 20, 70) : new THREE.Fog('#c8ccd2', 40, 120); },
    update(t) { this.flags.forEach(f => f.wave(t)); } };
}

// ================= PRESS ROOM =================
export function buildPress() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#0d1424');
  const bT = tex(1024, 512, (c, W, H) => { c.fillStyle = '#1f3a6a'; c.fillRect(0, 0, W, H); for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(i * 90, 0, 40, H); } c.fillStyle = '#fff'; c.font = 'bold 54px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText('MINISTÈRE DE L’INTÉRIEUR', W / 2, 90); c.fillStyle = '#c9a24a'; c.font = 'bold 30px "DejaVu Sans"'; c.fillText('LIBERTÉ · ÉGALITÉ · FRATERNITÉ', W / 2, 140); });
  const back = plane(10, 5, mat(bT, { emis: .25 })); back.position.set(0, 2.5, -3); S.add(back);
  const fl = plane(12, 12, mat(tex(64, 64, (c, W) => { c.fillStyle = '#2a2a34'; c.fillRect(0, 0, W, W); }))); fl.rotation.x = -Math.PI / 2; S.add(fl);
  const pod = ibox(1.2, 1.15, .6, { color: '#e8e4da', front: face('#e8e4da', (c, W, H) => { c.fillStyle = '#1f3a6a'; c.beginPath(); c.arc(W / 2, H * .42, 50, 0, 7); c.fill(); ['#002395', '#ffffff', '#ed2939'].forEach((col, i) => { c.fillStyle = col; c.fillRect(W / 2 - 45 + i * 30, H * .42 - 20, 30, 40); }); }) }); pod.position.set(0, .575, -1.3); S.add(pod);
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .45), new THREE.MeshStandardMaterial({ color: '#222' })); m.position.set(-.25 + i * .12, 1.35, -1.15); m.rotation.x = -.6; S.add(m); const head = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), new THREE.MeshStandardMaterial({ color: ['#c8102e', '#222', '#1f4fa0', '#222', '#e0b84a'][i] })); head.position.set(-.25 + i * .12, 1.53, -1.0); S.add(head); }
  const flags = []; for (const [x, k] of [[-1.6, 'fr'], [1.6, 'eu']]) { pole(S, x, 0, -2.4, 2.6); const f = new Flag(S, k, .9, .6); f.mesh.position.set(x + .03, 2.55, -2.4); flags.push(f); }
  const flashes = []; for (let i = 0; i < 4; i++) { const f = glowSprite('#ffffff', 1.2, 0); f.position.set(-2 + i * 1.3, 1.6, 1.5); S.add(f); flashes.push(f); }
  const flashL = new THREE.PointLight('#ffffff', 0, 10, 1.2); flashL.position.set(0, 1.8, 1.5); S.add(flashL);
  S.add(new THREE.HemisphereLight('#c8d4ff', '#202030', .8)); const key = new THREE.SpotLight('#fff0dc', 10, 12, .5, .5, 1.2); key.position.set(1.5, 4, 2.5); key.target.position.set(0, 1.4, -1.5); S.add(key, key.target);
  const chars = { min: new Char(S, MINISTER) };
  return { scene: S, chars, flags, flashes, flashL, update(t) { this.flags.forEach(f => f.wave(t, .05)); const k = Math.floor(t * 6); const on = hash(k * 7) > .78; this.flashes.forEach(f => f.material.opacity = 0); this.flashL.intensity = on ? 5 : 0; } };
}

// ================= FRANCE MAP =================
const FR = [[2.4, 51.0], [1.6, 50.9], [1.5, 50.2], [.2, 49.7], [-1.2, 49.4], [-1.9, 49.7], [-1.6, 48.6], [-3, 48.8], [-4.7, 48.4], [-4.2, 47.8], [-2.5, 47.3], [-2.2, 46.8], [-1.2, 46.2], [-1.2, 45.4], [-1.4, 44.5], [-1.8, 43.4], [-.5, 42.8], [1.5, 42.5], [3.2, 42.4], [3.1, 43.1], [4.6, 43.4], [5.4, 43.2], [6.6, 43.1], [7.5, 43.8], [7.0, 44.3], [6.9, 45.1], [7.0, 45.9], [6.1, 46.3], [6.9, 47.4], [7.6, 47.6], [8.2, 48.9], [6.4, 49.5], [4.8, 50.1], [4.2, 49.9], [2.6, 50.8]];
export const CITIES = [['Paris', 2.35, 48.86], ['Lyon', 4.84, 45.76], ['Marseille', 5.37, 43.3], ['Lille', 3.06, 50.63], ['Nantes', -1.55, 47.22], ['Bordeaux', -.58, 44.84], ['Toulouse', 1.44, 43.6], ['Strasbourg', 7.75, 48.58], ['Rennes', -1.68, 48.11], ['Limoges', 1.26, 45.83], ['Nice', 7.26, 43.7], ['Montpellier', 3.88, 43.61]];
export function buildMap() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#06070c'); S.fog = new THREE.Fog('#06070c', 8, 18);
  const tableT = tex(512, 512, (c, W) => { c.fillStyle = '#1a2a3a'; c.fillRect(0, 0, W, W); for (let i = 0; i <= 16; i++) { sline(c, i * 32, 0, i * 32, W, 2, 'rgba(120,170,220,.18)'); sline(c, 0, i * 32, W, i * 32, 2, 'rgba(120,170,220,.18)'); } }, [3, 3]);
  const table = plane(14, 14, mat(tableT, { emis: .3 })); table.rotation.x = -Math.PI / 2; S.add(table);
  const sc = .32, cx = 1.75, cy = 46.7; const P = (lon, lat) => new THREE.Vector2((lon - cx) * sc * .7, -(lat - cy) * sc);
  const shp = new THREE.Shape(FR.map(p => P(p[0], p[1])));
  const geo = new THREE.ExtrudeGeometry(shp, { depth: .12, bevelEnabled: false }); geo.rotateX(Math.PI / 2); geo.translate(0, .12, 0);
  const landT = tex(512, 512, (c, W) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, W, W); grain(c, W, W, .08, 6000); });
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: landT, roughness: .8 })); S.add(land);
  S.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: '#2a1a12' })));
  const pins = CITIES.map(([n, lon, lat], i) => { const p = P(lon, lat); const g = new THREE.Group(); g.position.set(p.x, .13, p.y); S.add(g);
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .03, 16), new THREE.MeshStandardMaterial({ color: '#c8102e', emissive: '#ff2a1a', emissiveIntensity: 0 })); g.add(dot);
    const glow = glowSprite('#ff3a1a', .9, 0); glow.position.y = .05; g.add(glow);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.08, .11, 32), new THREE.MeshBasicMaterial({ color: '#ff4a2a', transparent: true, opacity: 0, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; g.add(ring);
    const lt = tex(256, 64, (c, W, H) => { c.font = 'bold 34px Montserrat'; c.fillStyle = '#ffffff'; c.strokeStyle = '#000'; c.lineWidth = 6; c.strokeText(n, 10, 44); c.fillText(n, 10, 44); });
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthWrite: false })); lab.center.set(0, .5); lab.scale.set(.8, .2, 1); lab.position.set(.08, .12, 0); g.add(lab);
    return { g, dot, glow, ring, lab }; });
  const spot = new THREE.SpotLight('#ffe6c8', 40, 12, .55, .5, 1.2); spot.position.set(0, 6, 2); spot.target.position.set(0, 0, 0); S.add(spot, spot.target);
  S.add(new THREE.HemisphereLight('#6a7aa0', '#100808', .5));
  return { scene: S, chars: {}, pins, update() { } };
}

// ================= SMALL SETS: calendar wall, café newspaper =================
export function buildProps() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#0c0d14');
  const wall = plane(6, 4, mat(tex(256, 256, (c, W) => { c.fillStyle = '#5a6a7a'; c.fillRect(0, 0, W, W); grain(c, W, W, .06); }, [2, 2]))); wall.position.set(0, 1.8, -1); S.add(wall);
  const calT = tex(512, 700, () => { });
  calT.userData.draw = (day) => { const c = calT.userData.canvas.getContext('2d'), W = 512, H = 700; c.fillStyle = '#f3ecd8'; c.fillRect(0, 0, W, H); c.fillStyle = '#1f3a8a'; c.fillRect(0, 0, W, 170); c.fillStyle = '#fff'; c.font = 'bold 66px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText('OCTOBRE', W / 2, 100); c.font = 'bold 40px "DejaVu Sans"'; c.fillText('2026', W / 2, 150); c.fillStyle = '#1d1a1a'; c.font = 'bold 300px "DejaVu Sans"'; c.fillText(String(day), W / 2, 500); c.font = 'bold 44px "DejaVu Sans"'; c.fillStyle = '#c8102e'; c.fillText('SAMEDI', W / 2, 600); c.lineWidth = 8; c.strokeStyle = OUT; c.strokeRect(4, 4, W - 8, H - 8); calT.needsUpdate = true; };
  calT.userData.draw(17);
  const cal = plane(.5, .68, mat(calT, { emis: .15 })); cal.position.set(0, 1.75, -.99); S.add(cal);
  const pageT = tex(256, 350, (c, W, H) => { c.fillStyle = '#f3ecd8'; c.fillRect(0, 0, W, H); c.fillStyle = '#1d1a1a'; c.font = 'bold 150px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText('16', W / 2, 250); c.lineWidth = 5; c.strokeStyle = OUT; c.strokeRect(2, 2, W - 4, H - 4); });
  const pg = new THREE.PlaneGeometry(.5, .52); pg.translate(0, -.26, 0); const page = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ map: pageT, side: THREE.DoubleSide })); page.position.set(0, 1.75 + .34 - .125, -.985); S.add(page);
  // café table + newspaper (at x=20)
  const tbl = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .05, 32), new THREE.MeshStandardMaterial({ color: '#d8d0c0', roughness: .4 })); tbl.position.set(20, .75, 0); S.add(tbl);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .75), new THREE.MeshStandardMaterial({ color: '#222' })); leg.position.set(20, .375, 0); S.add(leg);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.05, .04, .08, 16), new THREE.MeshStandardMaterial({ color: '#f4f0e8' })); cup.position.set(20.32, .82, .18); S.add(cup);
  const npT = tex(700, 900, (c, W, H) => { c.fillStyle = '#efe9da'; c.fillRect(0, 0, W, H); c.fillStyle = OUT; c.font = 'bold 54px "DejaVu Serif"'; c.textAlign = 'center'; c.fillText('LE QUOTIDIEN', W / 2, 70); sline(c, 30, 90, W - 30, 90, 4); c.font = 'bold 96px "DejaVu Sans"'; c.fillStyle = '#c8102e'; c.fillText('LA CRISE', W / 2, 200); c.font = 'bold 40px "DejaVu Sans"'; c.fillStyle = OUT; c.fillText('Le gouvernement sous pression', W / 2, 260); c.fillStyle = '#6a6a6a'; c.fillRect(40, 290, W - 80, 300); c.fillStyle = '#ff8a30'; c.beginPath(); c.moveTo(200, 590); c.quadraticCurveTo(260, 400, 300, 590); c.fill(); c.beginPath(); c.moveTo(380, 590); c.quadraticCurveTo(440, 360, 500, 590); c.fill(); for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(40,40,40,.5)'; c.fillRect(40 + (i % 2) * 320, 620 + Math.floor(i / 2) * 50, 290, 10); } c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(3, 3, W - 6, H - 6); });
  const np = plane(.5, .64, mat(npT, { emis: .1 })); np.rotation.x = -Math.PI / 2; np.position.set(20, .78, .02); S.add(np);
  const street = plane(10, 5, basic(tex(512, 256, (c, W, H) => { c.fillStyle = '#c8d2dc'; c.fillRect(0, 0, W, H); for (let i = 0; i < 5; i++) { c.fillStyle = '#e4d9bf'; c.fillRect(i * 110, 30, 100, H); for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { c.fillStyle = '#53657a'; c.fillRect(i * 110 + 12 + k * 30, 50 + r * 50, 16, 30); } } }))); street.position.set(20, 2, -3); S.add(street);
  S.add(new THREE.HemisphereLight('#e6eeff', '#504030', 1.0)); const pl = new THREE.PointLight('#fff0dc', 4, 8, 1.3); pl.position.set(10, 2.5, 1); S.add(pl); const pl2 = new THREE.PointLight('#fff0dc', 4, 6, 1.3); pl2.position.set(20.4, 2, 1); S.add(pl2);
  return { scene: S, chars: {}, cal: calT, page, np, update() { } };
}
