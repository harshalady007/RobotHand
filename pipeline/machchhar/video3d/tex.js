import * as THREE from 'three';
export const OUT = '#2a1a12';
export function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

export function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function tex(w, h, draw, rep) {
  const c = cv(w, h); draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  t.userData.canvas = c; return t;
}
export function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
export function sline(c, x1, y1, x2, y2, w = 4, col = OUT) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.stroke(); }
export function grain(c, w, h, a = .05, n = 4000) { for (let i = 0; i < n; i++) { c.fillStyle = `rgba(${hash(i) > .5 ? 255 : 0},${hash(i) > .5 ? 255 : 0},${hash(i) > .5 ? 255 : 0},${a * hash(i + 7)})`; c.fillRect(hash(i + 1) * w, hash(i + 2) * h, 2, 2); } }
// a flat illustrated face: fill + soft gradient + outline border + optional detail
export function face(color, detail, opt = {}) {
  const W = opt.w || 256, H = opt.h || 256;
  return tex(W, H, (c) => {
    c.fillStyle = color; c.fillRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(0,0,0,.14)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (detail) detail(c, W, H);
    if (opt.border !== false) { c.lineWidth = opt.bw || 7; c.strokeStyle = OUT; c.strokeRect(0, 0, W, H); }
  }, opt.rep);
}
export function mat(t, o = {}) {
  return new THREE.MeshStandardMaterial({ map: t, roughness: o.rough ?? .85, metalness: 0, emissive: o.emis ? 0xffffff : 0x000000, emissiveMap: o.emis ? t : null, emissiveIntensity: o.emis || 0, transparent: !!o.transparent, side: o.side || THREE.FrontSide });
}
export function basic(t, o = {}) { return new THREE.MeshBasicMaterial({ map: t, transparent: !!o.transparent, side: o.side || THREE.FrontSide, toneMapped: o.toneMapped ?? true }); }
// box with illustrated faces. faces: {front, back, top, side, bottom} textures or colors; emis per face optional
export function ibox(w, h, d, f, o = {}) {
  const col = f.color || '#888';
  const side = f.side || face(col, null, { bw: o.bw }); const top = f.top || face(col, null, { bw: o.bw });
  const fr = f.front || side, bk = f.back || side, bt = f.bottom || face('#222', null, { border: false });
  const mats = [side, side, top, bt, fr, bk].map((t, i) => mat(t, { emis: (i === 4 && o.frontEmis) ? o.frontEmis : (o.emis || 0), rough: o.rough }));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); return m;
}
export function plane(w, h, m) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); }
export function glowSprite(color, size, opacity = 1) {
  const t = tex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); return s;
}
// floor decal glow (additive)
export function floorGlow(color, w, h, opacity = .5) {
  const t = tex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; return m;
}
export function mono(c, txt, x, y, size, col) { c.font = `${size}px "Courier 10 Pitch", Courier, monospace`; c.fillStyle = col; c.fillText(txt, x, y); }
