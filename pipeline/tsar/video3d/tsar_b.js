// TSAR BOMBA sets B: hangar (1u = 1 m), village (Finland windows), arctic map table
import * as THREE from 'three';
import { OUT, hash, tex, face, ibox, plane, glowSprite, grain } from './tex.js';
import { Char } from './chars.js';
import { sm, lerp, fbm, sky, clouds, lights, FlagK } from './kcommon.js';
import { smokeT } from './sets_osama.js';

const lin = x => Math.max(0, Math.min(1, x));
export const SOV = (i = 0, x = {}) => ({ body: ['#f4f1ea', '#f4f1ea', '#e9e4d6', '#f4f1ea'][i % 4], collar: true, glasses: i % 2 === 0, hair: ['gray', 'helmet', 'bald', 'bob'][i % 4], hairCol: ['#b9b2a6', '#2a1c10', '#2a1c10', '#4a2c1c'][i % 4], seed: 1100 + i * 1.9, ...x });
export const OFFICER = (x = {}) => ({ body: '#6a7a48', hair: 'bald', hat: 'milcap', hatCol: '#556b3a', stache: true, hairCol: '#2a1c10', vest: undefined, collar: true, seed: 1200, ...x });
export const BOSS = (x = {}) => ({ body: '#3d3a46', hair: 'bald', hat: 'ushanka', hatCol: '#6b4a32', hatLite: '#8a6446', collar: true, lapel: true, tie: '#9a1f2a', seed: 1300, ...x });
export const CROWD = (i, x = {}) => ({ body: ['#d8cfb8', '#b9d0a0', '#e0c27a', '#a8b8c0', '#c9a0a0', '#9ab0d0'][i % 6], hair: ['helmet', 'bob', 'curly', 'bun', 'helmet', 'gray'][i % 6], hairCol: ['#2a1c10', '#5b3a1e', '#1d1612', '#6b4428', '#3a2618', '#888'][i % 6], seed: 1400 + i * 1.7, ...x });
export const PARKA = (i = 0, x = {}) => ({ body: ['#e8503a', '#2f78c8', '#f0a020', '#4aa86a'][i % 4], hair: 'bald', hat: 'ushanka', hatCol: '#4a3a30', hatLite: '#6a5648', seed: 1500 + i * 1.7, ...x });

export function suFlagTex() { return tex(384, 256, (c, W, H) => { c.fillStyle = '#d8202a'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffd23f'; c.strokeStyle = '#ffd23f'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.arc(86, 84, 34, Math.PI * .1, Math.PI * 1.1); c.stroke(); c.beginPath(); c.moveTo(56, 118); c.lineTo(112, 56); c.stroke(); c.lineWidth = 7; c.beginPath(); c.moveTo(60, 56); c.lineTo(112, 118); c.stroke(); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 11 : 26; c.lineTo(58 + Math.cos(a) * rr, 40 + Math.sin(a) * rr); } c.closePath(); c.fill(); c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(0, 0, W, H); }); }
export function suFlag(S, w = 3, h = 2) { const f = new FlagK(S, 'cn', w, h, true); const t = suFlagTex(); f.mesh.material.map = t; f.mesh.material.emissiveMap = t; f.mesh.material.needsUpdate = true; return f; }
const concrete = () => tex(512, 512, (c, W) => { c.fillStyle = '#d9dbdc'; c.fillRect(0, 0, W, W); grain(c, W, W, .1, 5000); c.strokeStyle = 'rgba(90,90,90,.28)'; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * W / 4, 0); c.lineTo(i * W / 4, W); c.stroke(); c.beginPath(); c.moveTo(0, i * W / 4); c.lineTo(W, i * W / 4); c.stroke(); } c.fillStyle = '#ffd23f'; c.fillRect(0, W / 2 - 6, W, 12); }, [8, 6]);
const labS = (txt, col = '#fff', size = 72, w = 640, h = 128) => tex(w, h, (c, W, Hh) => { c.font = `900 ${size}px Montserrat`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = size / 4.5; c.strokeStyle = '#0a0a0a'; c.strokeText(txt, W / 2, Hh / 2 + 4); c.fillStyle = col; c.fillText(txt, W / 2, Hh / 2 + 4); });
export const trefoilT = (col = '#ffd23f') => tex(256, 256, (c) => { c.fillStyle = col; c.beginPath(); c.arc(128, 128, 118, 0, 7); c.fill(); c.lineWidth = 12; c.strokeStyle = '#111'; c.stroke(); c.fillStyle = '#111'; for (let k = 0; k < 3; k++) { const a0 = k * Math.PI * 2 / 3 - Math.PI / 2 - Math.PI / 6; c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 92, a0, a0 + Math.PI / 3); c.closePath(); c.fill(); } c.beginPath(); c.arc(128, 128, 16, 0, 7); c.fill(); });

// ================= HANGAR =================
export function buildHangar() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#dfe8f0'); S.fog = new THREE.Fog('#e6edf3', 60, 200);
  lights(S, '#fff4e0', 1.9, '#f2f6ff', '#9a9a9a', 1.25, [8, 30, 22]);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshStandardMaterial({ map: concrete(), roughness: .9 })); fl.rotation.x = -Math.PI / 2; S.add(fl);
  const wallM = new THREE.MeshStandardMaterial({ color: '#c9d4de', roughness: .95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(90, 18), wallM); back.position.set(0, 9, -16); S.add(back);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(70, 18), wallM); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 30, 9, 0); S.add(w); for (let k = 0; k < 5; k++) { const win = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({ color: '#f4fbff', toneMapped: false })); win.rotation.y = -s * Math.PI / 2; win.position.set(s * 29.9, 11, -22 + k * 11); S.add(win); } }
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshStandardMaterial({ color: '#aab6c2', side: THREE.DoubleSide })); roof.rotation.x = Math.PI / 2; roof.position.y = 16; S.add(roof);
  for (let i = -3; i <= 3; i++) { const b = ibox(.5, .6, 70, { color: '#5a6672' }); b.position.set(i * 9, 15.6, 0); S.add(b); }
  const ban = tex(1024, 420, (c, W, H) => { c.fillStyle = '#d8202a'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffd23f'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 62 : 150; c.lineTo(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr + 6); } c.closePath(); c.fill(); c.lineWidth = 14; c.strokeStyle = '#7a1010'; c.stroke(); c.strokeStyle = '#ffd23f'; c.lineWidth = 16; c.strokeRect(14, 14, W - 28, H - 28); });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(22, 9), new THREE.MeshBasicMaterial({ map: ban, toneMapped: true })); banner.position.set(0, 9, -15.9); S.add(banner);
  // bomb on a trolley, axis along X
  const bg = new THREE.Group(); bg.position.set(0, 1.9, 0); S.add(bg); S.bombG = bg;
  const M = new THREE.MeshStandardMaterial({ color: '#f7f7f3', roughness: .4, emissive: '#e8e8e0', emissiveIntensity: .25 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 6.2, 22), M); body.rotation.z = Math.PI / 2; bg.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.0, 22), M); nose.rotation.z = Math.PI / 2; nose.position.x = 4.1; bg.add(nose);
  const tl = new THREE.Mesh(new THREE.CylinderGeometry(1.05, .5, 2.4, 18), M); tl.rotation.z = Math.PI / 2; tl.position.x = -4.3; bg.add(tl);
  for (const x of [-1.3, 1.5]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.07, 1.07, .55, 22), new THREE.MeshStandardMaterial({ color: '#e8342a', emissive: '#a01010', emissiveIntensity: .3 })); b.rotation.z = Math.PI / 2; b.position.x = x; bg.add(b); }
  const stp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: tex(128, 128, (c) => { c.clearRect(0, 0, 128, 128); c.fillStyle = '#e8342a'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 24 : 58; c.lineTo(64 + Math.cos(a) * rr, 68 + Math.sin(a) * rr); } c.closePath(); c.fill(); c.lineWidth = 6; c.strokeStyle = '#6a1010'; c.stroke(); }), transparent: true })); stp.position.set(.2, .15, 1.06); bg.add(stp);
  for (let i = 0; i < 4; i++) { const f = ibox(1.8, .08, 1.2, { color: '#e8342a' }); f.position.set(-4.9, 0, 0); f.rotation.x = i * Math.PI / 4; bg.add(f); }
  const tr = ibox(8.6, .5, 2.6, { color: '#4a5560' }); tr.position.set(0, -1.45, 0); bg.add(tr);
  for (const [x, z] of [[-3.4, 1.4], [3.4, 1.4], [-3.4, -1.4], [3.4, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .4, 16), new THREE.MeshStandardMaterial({ color: '#1c1f24' })); w.rotation.x = Math.PI / 2; w.position.set(x, -1.45, z * 1.05); bg.add(w); }
  for (const x of [-2.2, 2.2]) { const sd = ibox(.6, 1.1, 2.0, { color: '#8a6a40' }); sd.position.set(x, -.85, 0); bg.add(sd); }
  const tarp = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 7.6, 8, 20), new THREE.MeshStandardMaterial({ color: '#6f7d5e', roughness: 1, transparent: true })); tarp.rotation.z = Math.PI / 2; bg.add(tarp); S.tarpM = tarp;
  S.tarp = (k) => { tarp.visible = k < 1; tarp.position.x = k * 6; tarp.scale.set(1, 1 - .3 * k, 1 - .3 * k); tarp.material.opacity = 1 - k * k; };
  // blueprint board
  const bc = document.createElement('canvas'); bc.width = 1024; bc.height = 576; const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace;
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.05), new THREE.MeshBasicMaterial({ map: bt })); bd.position.set(-9, 3.6, -5); S.add(bd); S.boardM = bd;
  const fr = ibox(7.5, 4.35, .2, { color: '#4a3a2a' }); fr.position.set(-9, 3.6, -5.15); S.add(fr); for (const x of [-12.4, -5.6]) { const l = ibox(.25, 2.6, .25, { color: '#4a3a2a' }); l.position.set(x, 1.3, -5.2); S.add(l); }
  S.boardDraw = (mode, k, t) => { const c = bc.getContext('2d'); c.fillStyle = '#1d4f9a'; c.fillRect(0, 0, 1024, 576); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; for (let i = 0; i < 1024; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 576); c.stroke(); } for (let i = 0; i < 576; i += 32) { c.beginPath(); c.moveTo(0, i); c.lineTo(1024, i); c.stroke(); }
    c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.roundRect(150, 360, 560, 120, 60); c.stroke(); c.beginPath(); c.moveTo(710, 380); c.lineTo(800, 420); c.lineTo(710, 460); c.stroke(); c.setLineDash([14, 10]); c.lineWidth = 3; c.beginPath(); c.moveTo(150, 520); c.lineTo(800, 520); c.stroke(); c.setLineDash([]);
    c.font = '900 200px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    const draw = (txt, x, y, col, sz = 200) => { c.font = `900 ${sz}px Montserrat`; c.lineWidth = 16; c.strokeStyle = '#0a2a5a'; c.strokeText(txt, x, y); c.fillStyle = col; c.fillText(txt, x, y); };
    if (mode === 'hundred') { draw('100 MT', 512, 170, '#ffffff', 190 * (.9 + .1 * Math.min(1, k * 4))); }
    else if (mode === 'cut') { const kk = Math.min(1, k * 3); draw('100', 330, 170, kk > .3 ? '#7a8fb8' : '#ffffff', 190); if (kk > .3) { c.strokeStyle = '#ff4a3a'; c.lineWidth = 22; c.beginPath(); c.moveTo(150, 250); c.lineTo(520, 80); c.stroke(); } if (k > .45) draw('50', 700, 170, '#ffd23f', 210 * (.8 + .2 * Math.min(1, (k - .45) * 5))); draw('MT', 880, 190, '#fff', 90); }
    else if (mode === 'eq') { c.fillStyle = '#fff'; c.font = '900 120px Montserrat'; c.fillText('E = mc²', 512, 160); }
    bt.needsUpdate = true; };
  // radiation badge
  S.rad = new THREE.Sprite(new THREE.SpriteMaterial({ map: trefoilT(), transparent: true, depthWrite: false })); S.rad.scale.set(3.4, 3.4, 1); S.rad.position.set(0, 6.2, 3); S.rad.visible = false; S.add(S.rad);
  S.flag = suFlag(S, 3.4, 2.2).at(13, 0, -8); S.flag2 = suFlag(S, 3.4, 2.2).at(-14, 0, -9);
  // lectern + mic for Sakharov
  const lec = ibox(1.6, 1.2, .9, { color: '#7a5a3a' }); lec.position.set(10, .6, 1.5); S.add(lec); S.lec = lec; const mic = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .5, 8), new THREE.MeshStandardMaterial({ color: '#222' })); mic.position.set(10, 1.45, 1.2); S.add(mic); const mh = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), new THREE.MeshStandardMaterial({ color: '#333' })); mh.position.set(10, 1.75, 1.2); S.add(mh);
  const sg = tex(256, 128, (c, W, H) => { c.fillStyle = '#fff8e0'; c.fillRect(0, 0, W, H); c.lineWidth = 8; c.strokeStyle = OUT; c.strokeRect(0, 0, W, H); c.fillStyle = '#d8202a'; c.font = '900 44px Montserrat'; c.textAlign = 'center'; c.fillText('STOP', 128, 52); c.fillText('TESTS', 128, 100); }); const banner2 = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.4), new THREE.MeshBasicMaterial({ map: sg })); banner2.position.set(10, 5.4, -10); S.add(banner2); S.stopSign = banner2; banner2.visible = false;
  S.chars = {
    e0: new Char(S, SOV(0, { arms: 'point', expr: 'smile' }), 2.9), e1: new Char(S, SOV(1, { arms: 'gesture', expr: 'happy' }), 2.9), e2: new Char(S, SOV(2, { arms: 'chin', expr: 'worried' }), 2.9), e3: new Char(S, SOV(3, { arms: 'down' }), 2.9),
    off: new Char(S, OFFICER({ arms: 'point', expr: 'smirk' }), 3.0), boss: new Char(S, BOSS({ arms: 'raise', expr: 'angry' }), 3.1), sci: new Char(S, SOV(0, { arms: 'lectern', glasses: true, hair: 'gray', hairCol: '#b9b2a6', expr: 'worried', seed: 1700 }), 3.1),
    c0: new Char(S, CROWD(0, { arms: 'cheer', expr: 'happy' }), 2.6), c1: new Char(S, CROWD(1, { arms: 'raise', expr: 'happy' }), 2.6), c2: new Char(S, CROWD(2, { arms: 'cheer', expr: 'happy' }), 2.6), c3: new Char(S, CROWD(3, { arms: 'raise', expr: 'happy' }), 2.6), c4: new Char(S, CROWD(4, { arms: 'cheer', expr: 'happy' }), 2.6), c5: new Char(S, CROWD(5, { arms: 'raise', expr: 'happy' }), 2.6),
  };
  S.reset = () => { S.rad.visible = false; S.stopSign.visible = false; S.tarp(1); S.boardDraw('none', 0, 0); };
  S.update = (t, cam) => { S.flag.wave(t, .2); S.flag2.wave(t + 1, .2); };
  return S;
}

// ================= VILLAGE (windows break when the wave front passes) =================
export function buildVillage() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#bfe0f8'); S.fog = new THREE.Fog('#e2eef8', 90, 420);
  sky(S, '#2f7fd8', '#8cc4f2', '#eaf5ff', '#e6f0fa'); lights(S, '#fff0d8', 2.4, '#cfe4fa', '#a8b8cc', 1.1, [-30, 60, 80]);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: '#f4f8fd', roughness: 1, emissive: '#dfeaf6', emissiveIntensity: .35 })); gr.rotation.x = -Math.PI / 2; S.add(gr);
  const pine = (x, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.2 * s, .28 * s, 1.4 * s, 6), new THREE.MeshStandardMaterial({ color: '#5a3d28' })); tr.position.y = .7 * s; g.add(tr); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.9 - i * .35) * s, 2.2 * s, 7), new THREE.MeshStandardMaterial({ color: '#2f7a4a', flatShading: true, roughness: .9 })); c.position.y = (1.7 + i * 1.25) * s; g.add(c); const sn = new THREE.Mesh(new THREE.ConeGeometry((1.9 - i * .35) * s * .7, 1.3 * s, 7), new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true })); sn.position.y = (2.2 + i * 1.25) * s; g.add(sn); } S.add(g); };
  for (let i = 0; i < 40; i++) { const x = -70 + hash(i * 3.1) * 140, z = -60 + hash(i * 5.7) * 40 - 14; if (Math.abs(x) < 22 && z > -30) continue; pine(x, z, .9 + hash(i) * .8); }
  const cols = ['#c0442c', '#e2a82e', '#3d78a8', '#c0442c', '#8a5a9a'];
  S.windows = []; S.shards = [];
  const houseW = [[-15, -12], [-5, -13], [6, -12], [16, -13]];
  houseW.forEach(([hx, hz], hi) => {
    const wall = cols[hi % cols.length]; const w = 8.4, h = 5.2, d = 6;
    const b = ibox(w, h, d, { color: wall }); b.position.set(hx, h / 2, hz); S.add(b);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * .78, 3.2, 4), new THREE.MeshStandardMaterial({ color: '#4a3a3a', flatShading: true })); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, d / w); roof.position.set(hx, h + 1.6, hz); S.add(roof);
    const rs = new THREE.Mesh(new THREE.ConeGeometry(w * .78 * .94, 1.6, 4), new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true })); rs.rotation.y = Math.PI / 4; rs.scale.set(1, 1, d / w); rs.position.set(hx, h + 2.6, hz); S.add(rs);
    const door = ibox(1.3, 2.4, .12, { color: '#5a3a24' }); door.position.set(hx, 1.2, hz + d / 2 + .02); S.add(door);
    for (let fl = 0; fl < 2; fl++) for (const dx of [-2.6, 2.6]) {
      const wx = hx + dx, wy = 1.7 + fl * 2.4, wz = hz + d / 2 + .06;
      const fr = ibox(1.9, 1.5, .1, { color: '#ffffff' }); fr.position.set(wx, wy, wz); S.add(fr);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshStandardMaterial({ color: '#bfe8ff', emissive: '#7ec8f0', emissiveIntensity: .6, roughness: .1, metalness: .3 })); gl.position.set(wx, wy, wz + .06); S.add(gl);
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ map: tex(128, 96, (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = '#ffffff'; c.lineWidth = 3; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28; c.beginPath(); c.moveTo(64, 48); c.lineTo(64 + Math.cos(a) * 80, 48 + Math.sin(a) * 60); c.stroke(); } c.beginPath(); c.arc(64, 48, 18, 0, 7); c.stroke(); c.beginPath(); c.arc(64, 48, 34, 0, 7); c.stroke(); }), transparent: true, depthWrite: false })); crack.position.set(wx, wy, wz + .08); crack.visible = false; S.add(crack);
      const sh = []; for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.3, .22), new THREE.MeshBasicMaterial({ color: '#d4f1ff', side: THREE.DoubleSide, transparent: true, toneMapped: false })); m.visible = false; S.add(m); sh.push(m); }
      S.windows.push({ x: wx, y: wy, z: wz, gl, crack, sh, seed: hi * 7 + fl * 3 + dx });
    }
  });
  // wave front: a soft vertical bar sweeping across the street
  const wv = new THREE.Mesh(new THREE.PlaneGeometry(9, 14), new THREE.MeshBasicMaterial({ map: tex(128, 8, (c, W, H) => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(255,255,255,.55)'); g.addColorStop(.85, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }), transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })); wv.position.z = -6; S.add(wv); S.wv = wv;
  // vx: front travels towards -x (sweeps right -> left on screen)
  S.shock = (t, t0, x0 = 30, v = 22) => { const xw = x0 - v * (t - t0); wv.position.set(xw + 3, 7, -4); wv.material.opacity = (t > t0 - .05 && xw > -34) ? .85 : 0;
    S.windows.forEach(w => { const tb = t0 + (x0 - w.x) / v; const tau = t - tb; const gone = tau > .1; w.gl.visible = tau < .1; w.crack.visible = tau > 0 && tau < .1; w.sh.forEach((m, i) => { m.visible = gone && tau < 2.4; if (!m.visible) return; const r = k => hash(w.seed * 13.7 + i * k); const vx = (r(1.3) - .5) * 5 - 1, vy = 1.5 + r(2.1) * 4, vz = 2 + r(3.7) * 5; const tt = tau - .1; const y = w.y + vy * tt - 4.905 * tt * tt; m.position.set(w.x + vx * tt, Math.max(.06, y), w.z + vz * tt); m.rotation.set(tt * (3 + r(4) * 6), tt * (2 + r(5) * 5), r(6) * 6); m.material.opacity = 1 - lin((tau - 1.7) / .7); }); }); };
  S.chars = { v0: new Char(S, PARKA(0, { arms: 'point', expr: 'surprised' }), 2.2), v1: new Char(S, PARKA(1, { arms: 'raise', expr: 'surprised' }), 2.0), v2: new Char(S, PARKA(2, { arms: 'down', expr: 'surprised' }), 2.2) };
  S.reset = () => { S.windows.forEach(w => { w.gl.visible = true; w.crack.visible = false; w.sh.forEach(m => m.visible = false); }); wv.material.opacity = 0; };
  S.update = (t, cam) => { if (cam) S.sky.position.copy(cam.position); };
  return S;
}

// ================= ARCTIC MAP TABLE =================
export const AMAP = {};
export async function loadArcticMap() { const meta = await (await fetch('assets/map_arctic.json')).json(); const img = new Image(); img.src = 'assets/map_arctic.png'; await img.decode(); const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; AMAP.meta = meta; AMAP.tex = t; }
export const haversine = (a, b) => { const R = 6371, r = Math.PI / 180; const dl = (b[1] - a[1]) * r, dp = (b[0] - a[0]) * r; const h = Math.sin(dp / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dl / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
export function buildMapT() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#e9d8b8'); S.fog = new THREE.Fog('#e9d8b8', 90, 300);
  lights(S, '#fff2d8', 2.2, '#fff4e0', '#b08a5a', 1.2, [-20, 60, 40]);
  const wood = tex(512, 512, (c, W) => { c.fillStyle = '#b07a46'; c.fillRect(0, 0, W, W); for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(${hash(i) > .5 ? '90,50,20' : '210,160,100'},.14)`; c.fillRect(0, i * W / 26, W, W / 52 + hash(i) * 8); } grain(c, W, W, .08, 4000); }, [4, 4]);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: wood, roughness: .9 })); table.rotation.x = -Math.PI / 2; table.position.y = -.4; S.add(table);
  const m = AMAP.meta, s = 1.0; const w = (m.lon1 - m.lon0) * m.cos * s, h = (m.lat1 - m.lat0) * s;
  const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: AMAP.tex, roughness: .95, emissive: '#ffffff', emissiveMap: AMAP.tex, emissiveIntensity: .3 })); g.rotation.x = -Math.PI / 2; S.add(g);
  const edge = ibox(w + .8, .4, h + .8, { color: '#f6efe0' }); edge.position.y = -.22; S.add(edge);
  const P = (lat, lon, y = 0) => new THREE.Vector3(((lon - m.lon0) * m.cos - w / 2) * s, y, -((lat - (m.lat0 + m.lat1) / 2)) * s);
  S.P = P; S.kmU = km => km / 111 * s;
  const pinMake = (lat, lon, col, sc = 1) => { const gr = new THREE.Group(); gr.position.copy(P(lat, lon)); gr.visible = false; S.add(gr); const cone = new THREE.Mesh(new THREE.ConeGeometry(.3 * sc, .9 * sc, 14), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .45 })); cone.rotation.x = Math.PI; cone.position.y = .45 * sc; gr.add(cone); const head = new THREE.Mesh(new THREE.SphereGeometry(.42 * sc, 18, 14), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .6 })); head.position.y = 1.15 * sc; gr.add(head); const gl = glowSprite(col, 3 * sc, .55); gl.position.y = 1.1 * sc; gr.add(gl); return { g: gr, set(t, t0, h0 = 4.5) { const tau = t - t0; gr.visible = tau >= 0 && t0 < 1e8; if (!gr.visible) return; const G = 30, tf = Math.sqrt(2 * h0 / G); let y; if (tau < tf) y = h0 - .5 * G * tau * tau; else { const v = G * tf * .35, u = tau - tf, tb = 2 * v / G; y = u < tb ? v * u - .5 * G * u * u : 0; } gr.position.y = Math.max(0, y); } }; };
  S.pins = { nz: pinMake(73.4, 54.7, '#ff3a3a', 1.3), mos: pinMake(55.75, 37.6, '#ffd23f', 1.1), fin: pinMake(68.9, 27.0, '#2f9bff', 1.1) };
  const rings = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 160), new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); r.rotation.x = -Math.PI / 2; r.position.copy(P(73.4, 54.7, .08)); r.visible = false; S.add(r); rings.push(r); } S.rings = rings;
  // k: ring radius in km (animated by caller)
  S.ring = (i, km, op) => { const r = rings[i]; r.visible = km > 0; r.scale.setScalar(Math.max(.01, S.kmU(km))); r.material.opacity = op; };
  const line = (a, b, col) => { const A = P(...a, .15), B = P(...b, .15); const pts = []; for (let k = 0; k <= 40; k++) { const u = k / 40; pts.push(A.clone().lerp(B, u).setY(.15 + Math.sin(u * Math.PI) * 1.2)); } const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: col, dashSize: .5, gapSize: .3, linewidth: 3 })); l.computeLineDistances(); l.visible = false; S.add(l); return l; };
  S.arcNF = line([73.4, 54.7], [68.9, 27.0], '#ff3a2a'); S.arcNM = line([73.4, 54.7], [55.75, 37.6], '#ffd23f');
  S.arcDraw = (l, k) => { l.geometry.setDrawRange(0, Math.floor(41 * lin(k))); l.visible = k > 0; };
  const lb = (txt, col = '#fff', sz = 66) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labS(txt, col, sz), transparent: true, depthWrite: false })); sp.scale.set(5.6, 1.12, 1); sp.visible = false; S.add(sp); return sp; };
  S.lab = { nz: lb('NOVAYA ZEMLYA', '#ff6a5a', 58), mos: lb('MOSCOW', '#ffd23f'), fin: lb('FINLAND', '#6ec2ff'), km: lb('1,000+ km', '#ffffff', 78) };
  S.lab.nz.position.copy(P(73.4, 54.7, 3.4)).add(new THREE.Vector3(-2.6, 0, 0)); S.lab.mos.position.copy(P(55.75, 37.6, 3.0)); S.lab.fin.position.copy(P(68.9, 27.0, 3.2)).add(new THREE.Vector3(0, 0, 1.4)); S.lab.km.position.copy(P(71.2, 41, 3.2));
  S.reset = () => { Object.values(S.pins).forEach(p => p.g.visible = false); rings.forEach(r => r.visible = false); S.arcNF.visible = S.arcNM.visible = false; Object.values(S.lab).forEach(l => l.visible = false); };
  S.update = (t, cam) => { };
  S.chars = {};
  return S;
}
