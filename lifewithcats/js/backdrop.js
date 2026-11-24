// Life with Cats — what you see through the windows. Each room looks out on
// its own painted, layered set: cut-paper flats at several depths, softly
// lit, tinted by the hour and the season. The living room looks across Nine
// Lives Lane at the Cat Bakery.
import * as THREE from '../lib/three.module.min.js';
import * as T from './tex.js';
import { rng, mix, shade, rgba, lerp, clamp } from './util.js';

const W = 1024, H = 512;
function cv() { const c = T.canvas(W, H); return [c, c.getContext('2d')]; }
// paint with a little cut-paper roughness: edges wobble and the fill is mottled
function paperFill(x, col, path, r, o = {}) {
  x.save(); x.fillStyle = col; path(); x.fill();
  x.clip();
  x.globalCompositeOperation = 'source-atop';
  // mottle
  for (let i = 0; i < (o.mottle ?? 90); i++) { x.fillStyle = rgba(shade(col, (r() - 0.5) * 0.25), 0.18); x.beginPath(); x.ellipse(r() * W, r() * H, 10 + r() * 50, 6 + r() * 30, r() * 3, 0, 6.3); x.fill(); }
  // shading from the top light
  if (o.shadeDown !== false) { const g = x.createLinearGradient(0, o.top ?? 0, 0, o.bottom ?? H); g.addColorStop(0, rgba('#ffffff', 0.1)); g.addColorStop(1, rgba('#000000', 0.12)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  x.restore();
  // paper edge: a thin darker outline, as if cut and stuck down
  x.save(); x.strokeStyle = rgba(shade(col, -0.35), 0.35); x.lineWidth = 2; path(); x.stroke(); x.restore();
}
function hills(x, r, cols, baseY, amp) {
  cols.forEach((col, i) => {
    const y0 = baseY + i * 40, ph = r() * 6;
    paperFill(x, col, () => { x.beginPath(); x.moveTo(0, H); for (let t = 0; t <= W; t += 16) x.lineTo(t, y0 - Math.sin(t * 0.006 + ph) * amp - Math.sin(t * 0.017 + ph * 2) * amp * 0.35); x.lineTo(W, H); x.closePath(); }, r);
  });
}
function tree(x, r, cx, cy, s, foliage = true, kind = 'round') {
  if (!foliage) { // trunk and branches
    x.strokeStyle = '#5a4632'; x.lineCap = 'round';
    x.lineWidth = 10 * s; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx, cy - 90 * s); x.stroke();
    x.lineWidth = 5 * s; for (let i = 0; i < 5; i++) { const a = -1.2 + i * 0.6, L = (40 + r() * 30) * s; x.beginPath(); x.moveTo(cx, cy - (60 + i * 8) * s); x.lineTo(cx + Math.sin(a) * L, cy - (60 + i * 8) * s - Math.cos(a) * L); x.stroke(); }
    return;
  }
  // foliage in light neutral greens so a season tint can colour it
  const base = '#e6eedc';
  if (kind === 'pine') {
    for (let k = 0; k < 4; k++) paperFill(x, shade(base, -k * 0.04), () => { x.beginPath(); const yy = cy - 40 * s - k * 30 * s, w = (60 - k * 12) * s; x.moveTo(cx - w, yy); x.lineTo(cx, yy - 60 * s); x.lineTo(cx + w, yy); x.closePath(); }, r, { mottle: 10 });
  } else {
    const blobs = 7;
    for (let k = 0; k < blobs; k++) {
      const a = k / blobs * 6.283, rr = (34 + r() * 14) * s;
      paperFill(x, shade(base, (r() - 0.6) * 0.12), () => { x.beginPath(); x.arc(cx + Math.cos(a) * 30 * s, cy - 110 * s + Math.sin(a) * 26 * s, rr, 0, 6.3); }, r, { mottle: 8 });
    }
    paperFill(x, base, () => { x.beginPath(); x.arc(cx, cy - 112 * s, 44 * s, 0, 6.3); }, r, { mottle: 8 });
  }
}
function house(x, r, cx, by, w, h, col, roof, o = {}) {
  const top = by - h;
  paperFill(x, col, () => { x.beginPath(); x.rect(cx - w / 2, top, w, h); }, r, { mottle: 30, top, bottom: by });
  paperFill(x, roof, () => { x.beginPath(); x.moveTo(cx - w / 2 - 12, top + 2); x.lineTo(cx, top - w * 0.42); x.lineTo(cx + w / 2 + 12, top + 2); x.closePath(); }, r, { mottle: 20 });
  // roof tiles
  x.strokeStyle = rgba(shade(roof, -0.3), 0.4); x.lineWidth = 1.5;
  for (let k = 1; k < 6; k++) { const yy = top - w * 0.42 * (1 - k / 6); const hw = (w / 2 + 12) * k / 6; x.beginPath(); x.moveTo(cx - hw, yy); x.lineTo(cx + hw, yy); x.stroke(); }
  if (o.chimney) paperFill(x, shade(roof, -0.15), () => { x.beginPath(); x.rect(cx + w * 0.18, top - w * 0.36, 16, 40); }, r, { mottle: 4 });
  const wins = [];
  const win = (wx, wy, ww, wh) => { x.fillStyle = '#3c4650'; x.fillRect(wx, wy, ww, wh); x.strokeStyle = '#efe5cf'; x.lineWidth = 3; x.strokeRect(wx, wy, ww, wh); x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh); x.moveTo(wx, wy + wh / 2); x.lineTo(wx + ww, wy + wh / 2); x.stroke(); wins.push([wx, wy, ww, wh]); };
  if (!o.shop) { win(cx - w * 0.36, top + h * 0.18, w * 0.22, h * 0.28); win(cx + w * 0.14, top + h * 0.18, w * 0.22, h * 0.28); }
  if (o.shop) {
    win(cx - w * 0.42, top + h * 0.42, w * 0.46, h * 0.4);
    // striped awning and sign: The Cat Bakery, across the lane
    const aw = top + h * 0.3;
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#efe3c8' : '#c14b56'; x.beginPath(); x.moveTo(cx - w / 2 - 6 + i * (w + 12) / 8, aw); x.lineTo(cx - w / 2 - 6 + (i + 1) * (w + 12) / 8, aw); x.lineTo(cx - w / 2 - 6 + (i + 1) * (w + 12) / 8, aw + 22); x.arc(cx - w / 2 - 6 + (i + 0.5) * (w + 12) / 8, aw + 22, (w + 12) / 16, 0, Math.PI); x.closePath(); x.fill(); }
    x.fillStyle = '#f2c14e'; x.fillRect(cx - w * 0.38, top + h * 0.06, w * 0.76, h * 0.18); x.strokeStyle = '#5a3a1c'; x.lineWidth = 3; x.strokeRect(cx - w * 0.38, top + h * 0.06, w * 0.76, h * 0.18);
    x.fillStyle = '#5a3a1c'; x.font = `bold ${Math.round(h * 0.09)}px Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('THE CAT BAKERY', cx, top + h * 0.15);
    // a loaf in the window
    x.fillStyle = '#c98b4a'; x.beginPath(); x.ellipse(cx - w * 0.19, top + h * 0.72, w * 0.1, h * 0.05, 0, 0, 6.3); x.fill();
  }
  // door
  const dx = o.shop ? cx + w * 0.16 : cx - w * 0.08;
  paperFill(x, o.door || '#4f7a7a', () => { x.beginPath(); x.rect(dx, by - h * 0.42, w * 0.2, h * 0.42); }, r, { mottle: 3 });
  x.fillStyle = '#d9b35a'; x.beginPath(); x.arc(dx + w * 0.16, by - h * 0.2, 3, 0, 6.3); x.fill();
  return wins;
}
function fence(x, r, y, col = '#efe5cf') {
  for (let i = -10; i < W + 20; i += 26) paperFill(x, col, () => { x.beginPath(); x.moveTo(i, y + 70); x.lineTo(i, y + 8); x.lineTo(i + 8, y); x.lineTo(i + 16, y + 8); x.lineTo(i + 16, y + 70); x.closePath(); }, r, { mottle: 2 });
  paperFill(x, shade(col, -0.08), () => { x.beginPath(); x.rect(0, y + 22, W, 8); x.rect(0, y + 50, W, 8); }, r, { mottle: 6 });
}
function bushes(x, r, y, n = 10, col = '#e6eedc') {
  for (let i = 0; i < n; i++) { const cx = (i + r() * 0.6) * W / n, rr = 40 + r() * 30; paperFill(x, shade(col, (r() - 0.5) * 0.1), () => { x.beginPath(); x.arc(cx, y, rr, Math.PI, 0); x.lineTo(cx + rr, H); x.lineTo(cx - rr, H); x.closePath(); }, r, { mottle: 6 }); }
}
function flowers(x, r, y0, y1, n) {
  for (let i = 0; i < n; i++) { const fx = r() * W, fy = y0 + r() * (y1 - y0); x.strokeStyle = '#6f8150'; x.lineWidth = 2; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx, fy + 18); x.stroke(); x.fillStyle = ['#d9a441', '#e3a7a0', '#efe3c8', '#c8684a', '#b9a0c8'][Math.floor(r() * 5)]; x.beginPath(); x.arc(fx, fy, 4 + r() * 4, 0, 6.3); x.fill(); }
}
function clouds(x, r, n = 6) {
  for (let i = 0; i < n; i++) { const cx = r() * W, cy = 60 + r() * 160, s = 0.6 + r() * 0.8; for (let k = 0; k < 5; k++) paperFill(x, '#fbf6ea', () => { x.beginPath(); x.ellipse(cx + (k - 2) * 34 * s, cy - (k % 2) * 16 * s, 40 * s, 26 * s, 0, 0, 6.3); }, r, { mottle: 4, shadeDown: true, top: cy - 40 * s, bottom: cy + 30 * s }); }
}

// each scene returns canvases for its layers, nearest last
const SCENES = {
  lane(r) {
    const L = {};
    [L.far, L.farx] = cv(); hills(L.farx, r, ['#b7c3b8', '#9fb0a0'], 330, 40);
    L.farx.fillStyle = '#8c9a92'; L.farx.fillRect(700, 210, 18, 130); L.farx.beginPath(); L.farx.moveTo(694, 212); L.farx.lineTo(709, 150); L.farx.lineTo(724, 212); L.farx.fill();
    [L.mid, L.midx] = cv(); const x = L.midx; const lights = [];
    // the lane
    paperFill(x, '#b9ad98', () => { x.beginPath(); x.rect(0, 420, W, 92); }, r, { mottle: 40 });
    for (let i = 0; i < 40; i++) { x.strokeStyle = rgba('#8a7f6c', 0.4); x.lineWidth = 2; x.beginPath(); x.ellipse(r() * W, 430 + r() * 70, 14, 6, 0, 0, 6.3); x.stroke(); }
    const cols = ['#d8b48a', '#c99a8c', '#e3d6b4', '#a9b8a8', '#d6c08c'];
    const roofs = ['#8a4a3a', '#5b676d', '#7d5a44', '#6d4c5e', '#8a4a3a'];
    let cxp = 80; let k = 0;
    while (cxp < W + 60) { const w = 150 + r() * 50, h = 150 + r() * 40; const shop = k === 2; lights.push(...house(x, r, cxp, 424, shop ? 210 : w, shop ? 175 : h, cols[k % 5], roofs[k % 5], { chimney: r() < 0.6, shop, door: ['#4f7a7a', '#c8684a', '#6d4c5e', '#d4a737'][k % 4] })); cxp += (shop ? 210 : w) + 40 + r() * 20; k++; }
    // lamp post
    x.fillStyle = '#3a3431'; x.fillRect(560, 300, 6, 124); x.fillRect(550, 292, 26, 12);
    [L.trees, L.treesx] = cv(); tree(L.treesx, r, 40, 430, 1.1); tree(L.treesx, r, 990, 430, 1.2); tree(L.treesx, r, 470, 425, 0.8);
    [L.trunks, L.trunksx] = cv(); for (const [tx, s] of [[40, 1.1], [990, 1.2], [470, 0.8]]) tree(L.trunksx, r, tx, 430, s, false);
    [L.near, L.nearx] = cv(); bushes(L.nearx, r, 470, 12); flowers(L.nearx, r, 450, 500, 50);
    [L.lights, L.lightsx] = cv(); const lx = L.lightsx;
    for (const [wx, wy, ww, wh] of lights) { if (r() < 0.75) { lx.fillStyle = '#ffd890'; lx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4); } }
    const g = lx.createRadialGradient(563, 298, 2, 563, 298, 60); g.addColorStop(0, 'rgba(255,220,150,.95)'); g.addColorStop(1, 'rgba(255,200,120,0)'); lx.fillStyle = g; lx.fillRect(500, 240, 130, 120);
    for (let i = 0; i < 26; i++) { const t = i / 25, px = 120 + t * 760, py = 240 + Math.sin(t * Math.PI * 3) * 14; lx.fillStyle = ['#ffd27a', '#ffb08a', '#ffe9b0'][i % 3]; lx.beginPath(); lx.arc(px, py, 4, 0, 6.3); lx.fill(); }
    return L;
  },
  garden(r) {
    const L = {};
    [L.far, L.farx] = cv(); hills(L.farx, r, ['#bcc8b4', '#a6b79c', '#93a688'], 300, 46);
    [L.mid, L.midx] = cv(); const x = L.midx; const lights = [];
    paperFill(x, '#a9b98a', () => { x.beginPath(); x.rect(0, 400, W, 112); }, r, { mottle: 50 });
    // shed and a washing line
    lights.push(...house(x, r, 760, 410, 150, 110, '#8fa0a0', '#5b676d', {}));
    x.strokeStyle = '#5a4632'; x.lineWidth = 5; x.beginPath(); x.moveTo(150, 410); x.lineTo(150, 270); x.moveTo(520, 410); x.lineTo(520, 270); x.stroke();
    x.strokeStyle = '#efe3c8'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(150, 280); x.quadraticCurveTo(335, 300, 520, 280); x.stroke();
    const cl = ['#e3a7a0', '#efe3c8', '#7f98a5', '#d4a737', '#c8684a'];
    for (let i = 0; i < 6; i++) { const px = 180 + i * 55, py = 286 + Math.sin(i / 5 * Math.PI) * 8; paperFill(x, cl[i % 5], () => { x.beginPath(); x.rect(px, py, 34, 40 + (i % 2) * 14); }, r, { mottle: 3 }); }
    // birdbath
    paperFill(x, '#c9c0ad', () => { x.beginPath(); x.rect(615, 360, 14, 50); x.ellipse(622, 360, 34, 9, 0, 0, 6.3); }, r, { mottle: 4 });
    [L.trees, L.treesx] = cv(); tree(L.treesx, r, 330, 405, 1.3); tree(L.treesx, r, 930, 410, 1.0, true, 'pine');
    [L.trunks, L.trunksx] = cv(); tree(L.trunksx, r, 330, 405, 1.3, false); tree(L.trunksx, r, 930, 410, 1.0, false);
    [L.near, L.nearx] = cv(); fence(L.nearx, r, 400); flowers(L.nearx, r, 470, 505, 60);
    [L.lights, L.lightsx] = cv(); for (const [wx, wy, ww, wh] of lights) { L.lightsx.fillStyle = '#ffd890'; L.lightsx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4); }
    for (let i = 0; i < 24; i++) { L.lightsx.fillStyle = 'rgba(220,255,150,.9)'; L.lightsx.beginPath(); L.lightsx.arc(r() * W, 300 + r() * 180, 2.5, 0, 6.3); L.lightsx.fill(); }
    return L;
  },
  rooftops(r) {
    const L = {};
    [L.far, L.farx] = cv(); hills(L.farx, r, ['#b4bfc4', '#9eadb2'], 330, 30);
    // clock tower
    const f = L.farx; f.fillStyle = '#8c9a9c'; f.fillRect(420, 170, 50, 200); f.beginPath(); f.moveTo(410, 172); f.lineTo(445, 110); f.lineTo(480, 172); f.fill(); f.fillStyle = '#efe5cf'; f.beginPath(); f.arc(445, 210, 14, 0, 6.3); f.fill();
    [L.mid, L.midx] = cv(); const x = L.midx; const lights = [];
    for (let i = 0; i < 9; i++) { const cx = i * 125 + r() * 30, w = 110 + r() * 40; lights.push(...house(x, r, cx, 520, w, 120 + r() * 60, ['#c9b49a', '#b8a28e', '#d6c8ae'][i % 3], ['#7d5a44', '#5b676d', '#8a4a3a'][i % 3], { chimney: true })); }
    [L.trees, L.treesx] = cv(); const t = L.treesx; // a close branch across the top corner
    for (let k = 0; k < 14; k++) paperFill(t, shade('#e6eedc', (r() - 0.6) * 0.12), () => { t.beginPath(); t.ellipse(860 + (r() - 0.3) * 260, 40 + r() * 120, 40, 22, r() * 3, 0, 6.3); }, r, { mottle: 3 });
    [L.trunks, L.trunksx] = cv(); L.trunksx.strokeStyle = '#5a4632'; L.trunksx.lineWidth = 16; L.trunksx.lineCap = 'round'; L.trunksx.beginPath(); L.trunksx.moveTo(1030, 20); L.trunksx.quadraticCurveTo(880, 90, 740, 110); L.trunksx.stroke();
    [L.near, L.nearx] = cv();
    [L.lights, L.lightsx] = cv(); for (const [wx, wy, ww, wh] of lights) if (r() < 0.6) { L.lightsx.fillStyle = '#ffd890'; L.lightsx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4); }
    L.lightsx.fillStyle = '#fff3c8'; L.lightsx.beginPath(); L.lightsx.arc(445, 210, 14, 0, 6.3); L.lightsx.fill();
    return L;
  },
  meadow(r) {
    const L = {};
    [L.far, L.farx] = cv(); hills(L.farx, r, ['#c2cbb5', '#adbd9b', '#98ad86'], 260, 50);
    const f = L.farx; f.fillStyle = '#efe5cf'; f.fillRect(780, 230, 26, 70); f.strokeStyle = '#8a7f6c'; f.lineWidth = 4; for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4; f.beginPath(); f.moveTo(793, 232); f.lineTo(793 + Math.cos(a) * 50, 232 + Math.sin(a) * 50); f.stroke(); }
    [L.mid, L.midx] = cv(); const x = L.midx;
    paperFill(x, '#b5c28e', () => { x.beginPath(); x.moveTo(0, 360); for (let t = 0; t <= W; t += 32) x.lineTo(t, 360 - Math.sin(t * 0.004) * 20); x.lineTo(W, H); x.lineTo(0, H); x.closePath(); }, r, { mottle: 60 });
    paperFill(x, '#8fb0b8', () => { x.beginPath(); x.ellipse(620, 440, 180, 34, 0, 0, 6.3); }, r, { mottle: 10 });
    paperFill(x, '#d8cdb3', () => { x.beginPath(); x.moveTo(300, H); x.quadraticCurveTo(360, 420, 470, 370); x.lineTo(490, 372); x.quadraticCurveTo(400, 430, 380, H); x.closePath(); }, r, { mottle: 10 });
    [L.trees, L.treesx] = cv(); for (let i = 0; i < 6; i++) tree(L.treesx, r, 80 + i * 170 + r() * 40, 380 + r() * 10, 0.7 + r() * 0.3);
    [L.trunks, L.trunksx] = cv(); const r2 = rng(5); for (let i = 0; i < 6; i++) tree(L.trunksx, r2, 80 + i * 170 + r2() * 40, 380 + r2() * 10, 0.7 + r2() * 0.3, false);
    [L.near, L.nearx] = cv(); bushes(L.nearx, r, 480, 14); flowers(L.nearx, r, 440, 505, 120);
    [L.lights, L.lightsx] = cv(); for (let i = 0; i < 40; i++) { L.lightsx.fillStyle = 'rgba(220,255,150,.9)'; L.lightsx.beginPath(); L.lightsx.arc(r() * W, 330 + r() * 160, 2.5, 0, 6.3); L.lightsx.fill(); }
    return L;
  },
  treetop(r) {
    const L = {};
    [L.far, L.farx] = cv(); hills(L.farx, r, ['#c0c9c6', '#a9b8b4'], 380, 30);
    [L.mid, L.midx] = cv(); const lights = []; for (let i = 0; i < 8; i++) lights.push(...house(L.midx, r, i * 140 + 40, 540, 100, 90, '#c9b49a', ['#7d5a44', '#5b676d'][i % 2], { chimney: r() < 0.5 }));
    [L.trees, L.treesx] = cv(); const t = L.treesx;
    for (let k = 0; k < 40; k++) { const side = k % 2, cx = side ? 880 + r() * 160 : r() * 200, cy = 30 + r() * 420; paperFill(t, shade('#e6eedc', (r() - 0.6) * 0.14), () => { t.beginPath(); t.ellipse(cx, cy, 46, 26, r() * 3, 0, 6.3); }, r, { mottle: 2 }); }
    [L.trunks, L.trunksx] = cv(); const b = L.trunksx; b.strokeStyle = '#5a4632'; b.lineCap = 'round';
    b.lineWidth = 34; b.beginPath(); b.moveTo(-20, 512); b.quadraticCurveTo(80, 300, 60, 0); b.stroke();
    b.lineWidth = 16; b.beginPath(); b.moveTo(50, 260); b.quadraticCurveTo(300, 230, 420, 290); b.stroke();
    // a birdhouse on the branch
    paperFill(b, '#c8684a', () => { b.beginPath(); b.rect(330, 196, 54, 60); }, r, { mottle: 3 }); paperFill(b, '#4f7a7a', () => { b.beginPath(); b.moveTo(322, 198); b.lineTo(357, 168); b.lineTo(392, 198); b.closePath(); }, r, { mottle: 2 });
    b.fillStyle = '#2a201a'; b.beginPath(); b.arc(357, 222, 9, 0, 6.3); b.fill();
    [L.near, L.nearx] = cv();
    [L.lights, L.lightsx] = cv(); for (const [wx, wy, ww, wh] of lights) if (r() < 0.6) { L.lightsx.fillStyle = '#ffd890'; L.lightsx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4); }
    return L;
  },
};

// sky: a gradient with stars that come out at night
const SKY_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SKY_FS = `uniform vec3 top; uniform vec3 bot; uniform float stars; uniform float seed; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)) + seed) * 43758.5453); }
void main(){ vec3 c = mix(bot, top, smoothstep(0.0, 1.0, vUv.y));
  vec2 g = floor(vUv * vec2(160.0, 80.0)); float s = step(0.985, h(g)) * stars * smoothstep(0.2, 0.6, vUv.y);
  c += vec3(1.0, 0.95, 0.85) * s * (0.6 + 0.4 * h(g + 3.0));
  gl_FragColor = vec4(c, 1.0); }`;

export class Backdrop {
  constructor(kind, seed = 1) {
    this.kind = kind;
    this.group = new THREE.Group();
    const r = rng(seed);
    const L = SCENES[kind](r);
    const mk = (canvas, w, h, z, y, o = {}) => {
      if (!canvas) return null;
      const m = new THREE.MeshBasicMaterial({ map: T.toTex(canvas, { clamp: true }), transparent: !!o.add, alphaTest: o.add ? 0 : 0.5, depthWrite: !o.add, fog: false });
      if (o.add) { m.blending = THREE.AdditiveBlending; m.opacity = 0; }
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(0, y, z); p.castShadow = false; p.receiveShadow = false;
      this.group.add(p); return p;
    };
    // sky and clouds
    this.skyU = { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, stars: { value: 0 }, seed: { value: seed } };
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(90, 44), new THREE.ShaderMaterial({ uniforms: this.skyU, vertexShader: SKY_VS, fragmentShader: SKY_FS, fog: false, depthWrite: true }));
    sky.position.set(0, 14, -40); this.group.add(sky);
    const [cc, cx] = cv(); clouds(cx, r, 7);
    this.clouds = mk(cc, 70, 35, -36, 18);
    this.layers = {
      far: mk(L.far, 56, 28, -24, 6),
      trunks: mk(L.trunks, 34, 17, -13.9, 3.5),
      trees: mk(L.trees, 34, 17, -13.8, 3.5),
      mid: mk(L.mid, 34, 17, -14, 3.5),
      near: mk(L.near, 22, 11, -7.5, 1.6),
      lights: mk(L.lights, 34, 17, -13.7, 3.5, { add: true }),
    };
    // keep the lights layer right on top of the houses
    this.cloudOff = r() * 10;
    this.season = '';
  }
  // env: { sky:[top,bot], tint, night (0..1), season, weather }
  apply(env) {
    this.skyU.top.value.set(env.skyTop); this.skyU.bot.value.set(env.skyBot); this.skyU.stars.value = env.night;
    const tint = new THREE.Color(env.tint);
    const foliage = new THREE.Color({ spring: '#bcd49a', summer: '#93b26c', autumn: '#e0a04e', winter: '#d8e0e4' }[env.season] || '#93b26c').multiply(tint);
    const ground = env.season === 'winter' ? new THREE.Color('#eef3f6').multiply(tint) : tint;
    for (const k of ['far', 'mid', 'near', 'trunks']) { const l = this.layers[k]; if (l) l.material.color.copy(k === 'far' ? tint.clone().lerp(new THREE.Color(env.skyBot), 0.35) : (k === 'near' ? ground : tint)); }
    if (env.season === 'winter') { this.layers.mid.material.color.lerp(new THREE.Color('#e8eef2'), 0.25); if (this.layers.far) this.layers.far.material.color.lerp(new THREE.Color('#f2f6f8'), 0.4); }
    if (this.layers.trees) { this.layers.trees.material.color.copy(foliage); this.layers.trees.visible = env.season !== 'winter'; }
    if (this.layers.lights) this.layers.lights.material.opacity = env.night;
    if (this.clouds) { this.clouds.material.color.copy(tint).lerp(new THREE.Color(env.skyTop), 0.2); this.clouds.visible = env.night < 0.8 || env.weather !== 'clear'; this.clouds.material.color.multiplyScalar(env.weather === 'rain' ? 0.75 : 1); }
  }
  update(dt) { if (this.clouds) { this.cloudOff += dt * 0.15; this.clouds.position.x = ((this.cloudOff % 40) - 20) * 0.5; } }
}
export const BACKDROPS = Object.keys(SCENES);
