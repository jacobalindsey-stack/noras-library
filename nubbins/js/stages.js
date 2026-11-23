// NUBBINS — the arenas: a kid's world seen from one inch tall.
// Arcade climbs it: under the couch, the movie theater floor, the
// windowsill, the birthday cake, inside the fridge, then the top of the
// fridge where Gummoth keeps the candy jar. 1 unit = a gummy bear (~2 cm).
import * as THREE from '../lib/three.module.min.js';
import {
  C, V3, TAU, clamp, seed, rr, pick, canvas, ctex, soften, noiseDots, blob, rrect,
  roundedBox, lumpy, lathe, tube, std, phys, basic, glass, floorMat, selfLit, mesh, castAll, instanced, setInstance,
  contact, glow, backdrop, flame, beam, caustic, makeEnv, rig,
} from './stagekit.js';
import { sfx, say, sing, duck } from './audio.js';

const rand = (a, b) => a + Math.random() * (b - a);

// =====================================================================
// UNDER THE COUCH
// =====================================================================
function underCouch(g, R) {
  seed(11);
  const CEIL = 4.6, FRONT = -13;
  R.ceiling = CEIL; // finishers that fling a bear upward stop short of the couch, and so does the camera
  // hardwood planks running out toward the TV, dusty under here
  const planks = canvas(1024, 2048, (x, w, h) => {
    const pw = w / 4;
    const tones = [[104, 62, 36], [118, 72, 42], [92, 54, 31], [110, 66, 38]];
    for (let i = 0; i < 4; i++) {
      const [r, gg, b] = tones[i];
      const grd = x.createLinearGradient(i * pw, 0, i * pw + pw, 0);
      grd.addColorStop(0, `rgb(${r - 10},${gg - 8},${b - 5})`); grd.addColorStop(0.5, `rgb(${r + 6},${gg + 4},${b + 2})`); grd.addColorStop(1, `rgb(${r - 12},${gg - 9},${b - 6})`);
      x.fillStyle = grd; x.fillRect(i * pw, 0, pw, h);
      for (let k = 0; k < 120; k++) {
        const gx = i * pw + rr(6, pw - 6); x.strokeStyle = rr() < 0.55 ? `rgba(50,24,10,${rr(0.06, 0.2)})` : `rgba(190,130,80,${rr(0.05, 0.14)})`;
        x.lineWidth = rr(0.6, 2.4); x.beginPath(); x.moveTo(gx, 0);
        const ph = rr(0, 6), amp = rr(1, 7);
        for (let y = 0; y <= h; y += 24) x.lineTo(gx + Math.sin(y * 0.006 + ph) * amp + Math.sin(y * 0.03 + ph) * 1.2, y);
        x.stroke();
      }
      for (let k = 0; k < 2; k++) { // knots
        const kx = i * pw + rr(30, pw - 30), ky = rr(100, h - 100);
        for (let q = 0; q < 6; q++) { x.strokeStyle = `rgba(40,18,8,${0.25 - q * 0.03})`; x.lineWidth = 2; x.beginPath(); x.ellipse(kx, ky, 6 + q * 5, 14 + q * 11, 0, 0, TAU); x.stroke(); }
      }
      x.fillStyle = 'rgba(18,8,4,0.95)'; x.fillRect(i * pw, 0, 4, h);
      const jy = rr(0.15, 0.85) * h; x.fillRect(i * pw, jy, pw, 4);
      x.fillStyle = 'rgba(255,220,180,0.06)'; x.fillRect(i * pw + 5, 0, 3, h);
    }
    for (let k = 0; k < 60; k++) { x.strokeStyle = `rgba(230,210,190,${rr(0.04, 0.1)})`; x.lineWidth = rr(0.5, 1.5); x.beginPath(); const sx = rr(0, w), sy = rr(0, h); x.moveTo(sx, sy); x.lineTo(sx + rr(-60, 60), sy + rr(-20, 20)); x.stroke(); }
    noiseDots(x, w, h, 26000, '#d8d4cc', 0.05, 0.3, 0.6, 2.2);
    for (let k = 0; k < 40; k++) { x.fillStyle = 'rgba(200,196,188,0.08)'; blob(x, rr(0, w), rr(0, h), rr(30, 120), 0.4); x.fill(); }
  });
  const floorM = floorMat(ctex(planks, [90 / 14, 90 / 28]), 0.62, 0.3, { env: 0.45 });
  const floor = mesh(new THREE.PlaneGeometry(90, 90), floorM, { r: [-Math.PI / 2, 0, 0], p: [0, 0, -33], recv: true });
  g.add(floor);

  // the rug out in the living room
  const rug = canvas(1024, 1024, (x, w, h) => {
    x.fillStyle = '#1c2a4a'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#b8483a'; x.lineWidth = 26; x.strokeRect(60, 60, w - 120, h - 120);
    x.strokeStyle = '#e8d6a8'; x.lineWidth = 8; x.strokeRect(100, 100, w - 200, h - 200);
    for (let i = 0; i < 18; i++) { x.fillStyle = i % 2 ? '#b8483a' : '#e8d6a8'; x.save(); x.translate(w / 2, h / 2); x.rotate(i / 18 * TAU); x.beginPath(); x.ellipse(0, 150, 40, 110, 0, 0, TAU); x.fill(); x.restore(); }
    x.fillStyle = '#e8d6a8'; x.beginPath(); x.arc(w / 2, h / 2, 90, 0, TAU); x.fill();
    x.fillStyle = '#2a4a6a'; x.beginPath(); x.arc(w / 2, h / 2, 60, 0, TAU); x.fill();
    for (let i = 0; i < 40; i++) { x.fillStyle = i % 2 ? '#b8483a' : '#3a6a8a'; x.fillRect(140 + i * 19, 130, 9, 9); x.fillRect(140 + i * 19, h - 140, 9, 9); }
    for (let i = 0; i < w; i += 6) { x.strokeStyle = 'rgba(232,214,168,0.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(i, h); x.lineTo(i + rr(-2, 2), h - 40); x.stroke(); }
    noiseDots(x, w, h, 30000, '#000', 0.04, 0.12, 1, 2);
  });
  const rugM = mesh(new THREE.PlaneGeometry(80, 60), std('#ffffff', 1, { map: ctex(rug) }), { r: [-Math.PI / 2, 0, 0], p: [0, 0.03, -47], recv: true });
  g.add(rugM);

  // the room beyond, glimpsed through the gap: lit by the television
  const room = soften(canvas(2048, 512, (x, w, h) => {
    const yRow = y => (32 - y) / 40 * h;
    const grd = x.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#9cc4ff'); grd.addColorStop(0.35, '#4a6ab0'); grd.addColorStop(0.62, '#1a2448'); grd.addColorStop(1, '#0a0e1c');
    x.fillStyle = grd; x.fillRect(0, 0, w, h);
    // a low TV stand, and the television glowing on top of it
    const halo = x.createRadialGradient(w * 0.5, yRow(8), 20, w * 0.5, yRow(8), 700); halo.addColorStop(0, 'rgba(190,220,255,0.85)'); halo.addColorStop(1, 'rgba(190,220,255,0)');
    x.fillStyle = halo; x.fillRect(0, 0, w, h);
    x.fillStyle = '#141a2c'; x.fillRect(w * 0.3, yRow(15), w * 0.4, yRow(4.2) - yRow(15));
    const scr = x.createLinearGradient(0, yRow(14.4), 0, yRow(4.8)); scr.addColorStop(0, '#dff0ff'); scr.addColorStop(1, '#8ab8ff');
    x.fillStyle = scr; x.fillRect(w * 0.31, yRow(14.4), w * 0.38, yRow(4.8) - yRow(14.4));
    x.fillStyle = '#ffd34f'; x.beginPath(); x.arc(w * 0.42, yRow(9.5), 60, 0, TAU); x.fill();
    x.fillStyle = '#7ae05a'; x.beginPath(); x.moveTo(w * 0.31, yRow(4.8)); x.quadraticCurveTo(w * 0.45, yRow(9), w * 0.69, yRow(4.8)); x.fill();
    x.fillStyle = '#2a3048'; x.fillRect(w * 0.22, yRow(4.2), w * 0.56, yRow(0) - yRow(4.2));
    x.fillStyle = '#c8dcff'; x.fillRect(w * 0.22, yRow(4.2) - 5, w * 0.56, 8);
    for (let i = 0; i < 3; i++) { x.strokeStyle = '#0c1020'; x.lineWidth = 6; x.strokeRect(w * (0.24 + i * 0.18), yRow(3.6), w * 0.16, yRow(0.6) - yRow(3.6)); }
    // toys
    const blocks = ['#ff5a5a', '#ffd34f', '#5ad1ff', '#7ae05a'];
    for (let i = 0; i < 4; i++) { x.fillStyle = blocks[i]; x.fillRect(w * 0.06, yRow(3 + i * 3), 90, 90); }
    x.fillStyle = '#e8d8e8'; x.beginPath(); x.ellipse(w * 0.9, yRow(3), 120, 70, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(w * 0.88, yRow(8), 22, 70, -0.3, 0, TAU); x.fill(); x.beginPath(); x.ellipse(w * 0.92, yRow(8), 22, 70, 0.3, 0, TAU); x.fill();
    x.fillStyle = '#b07a40'; rrect(x, w * 0.66, yRow(5), 160, yRow(0) - yRow(5), 20); x.fill();
  }), 5);
  g.add(backdrop(room, 170, 40, [0, 12, -64], { tint: '#ffffff' }));

  // the couch: dust-cover underside with webbing and staples, sagging a little
  const under = canvas(1024, 1024, (x, w, h) => {
    x.fillStyle = '#1e1d24'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${rr() < 0.5 ? '0,0,0' : '80,80,96'},${rr(0.1, 0.3)})`; x.fillRect(rr(0, w), rr(0, h), rr(1, 3), 1); }
    for (const y of [140, 520, 900]) {
      x.fillStyle = '#a89a7c'; x.fillRect(0, y, w, 110);
      for (let k = 0; k < w; k += 7) { x.fillStyle = 'rgba(60,50,30,0.25)'; x.fillRect(k, y, 2, 110); }
      for (let k = 30; k < w; k += 64) { x.fillStyle = '#c8ccd4'; x.fillRect(k, y + 8, 22, 5); x.fillRect(k + 10, y + 94, 22, 5); }
    }
    for (const xx of [250, 760]) { x.fillStyle = 'rgba(168,154,124,0.85)'; x.fillRect(xx, 0, 90, h); }
    x.fillStyle = '#f2f0ea'; x.fillRect(420, 300, 150, 100); x.fillStyle = '#3a3a48'; x.font = 'bold 15px sans-serif';
    x.fillText('DO NOT REMOVE', 432, 336); x.fillText('THIS TAG', 452, 360); x.fillText('UNDER PENALTY', 432, 384);
  });
  const ug = new THREE.PlaneGeometry(64, 28, 48, 20);
  { const p = ug.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.35 * Math.sin(Math.PI * (y + 14) / 28) + 0.12 * Math.abs(Math.sin(x * 0.5))); } ug.computeVertexNormals(); }
  const ceil = mesh(ug, std('#ffffff', 0.95, { map: ctex(under, [4, 1.75]), side: THREE.DoubleSide }), { r: [Math.PI / 2, 0, 0], p: [0, CEIL, FRONT + 14] });
  g.add(ceil);
  const walnut = canvas(256, 1024, (x, w, h) => { x.fillStyle = '#3a1e10'; x.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(${rr() < 0.5 ? '20,8,2' : '110,60,30'},${rr(0.1, 0.3)})`; x.lineWidth = rr(1, 3); x.beginPath(); const gx = rr(0, w); x.moveTo(gx, 0); for (let y = 0; y < h; y += 30) x.lineTo(gx + Math.sin(y * 0.01 + i) * 4, y); x.stroke(); } });
  const walnutM = phys('#ffffff', 0.35, { map: ctex(walnut), clearcoat: 0.6, clearcoatRoughness: 0.3 });
  g.add(mesh(new THREE.BoxGeometry(70, 0.9, 1.1), walnutM, { p: [0, CEIL - 0.45, FRONT - 0.1], cast: true }));
  // velvet skirt with a golden fringe, backlit by the TV
  const fold = x => 0.2 * Math.sin(x * 1.9) + 0.07 * Math.sin(x * 5.3);
  const sk = new THREE.PlaneGeometry(70, 1.0, 180, 2);
  { const p = sk.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, fold(p.getX(i))); sk.computeVertexNormals(); }
  const velvet = phys('#2a5c62', 0.75, { sheen: 1, sheenColor: C('#8fe0d8'), sheenRoughness: 0.35, side: THREE.DoubleSide });
  g.add(mesh(sk, velvet, { p: [0, CEIL - 0.6, FRONT - 0.75], cast: true }));
  const fringeItems = [];
  for (let x = -34; x <= 34; x += 0.2) fringeItems.push({ p: [x, CEIL - 1.1, FRONT - 0.75 + fold(x)], s: 1 });
  const tassel = new THREE.CylinderGeometry(0.035, 0.05, 0.45, 5); tassel.translate(0, -0.225, 0);
  const fringe = instanced(tassel, phys('#d8b062', 0.5, { sheen: 1, sheenColor: C('#fff0b0') }), fringeItems, { cast: true });
  g.add(fringe);
  R.tick.push((t) => { fringeItems.forEach((it, i) => setInstance(fringe, i, it.p, [Math.sin(t * 1.6 + it.p[0] * 0.7) * 0.12, 0, Math.sin(t * 1.1 + it.p[0]) * 0.08], 1)); fringe.instanceMatrix.needsUpdate = true; });
  // the couch's two ends: velvet arms dropping to the floor, so a camera that
  // turns sideways (some finishers do) sees upholstery instead of darkness
  const armG = new THREE.PlaneGeometry(30, CEIL + 0.4, 40, 4);
  { const p = armG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.25 * Math.sin(x * 0.9) * (1 - y / (CEIL + 0.4)) + 0.08 * Math.sin(x * 3.1)); } armG.computeVertexNormals(); }
  const armM = phys('#24545a', 0.8, { sheen: 1, sheenColor: C('#8fe0d8'), sheenRoughness: 0.4, side: THREE.DoubleSide, emissive: C('#0e2426') });
  for (const side of [-1, 1]) g.add(mesh(armG, armM, { p: [side * 31, (CEIL + 0.4) / 2 - 0.2, FRONT + 15], r: [0, side * Math.PI / 2, 0] }));
  // turned walnut legs with brass feet
  const legG = lathe([[0, 0], [0.55, 0], [0.6, 0.3], [0.52, 0.55], [0.46, 1.0], [0.62, 1.35], [0.7, 1.6], [0.52, 1.85], [0.58, 2.6], [0.76, 3.3], [0.86, 3.8], [0.92, CEIL - 0.9], [0, CEIL - 0.9]], 32);
  for (const x of [-11, 11]) {
    g.add(mesh(legG, walnutM, { p: [x, 0, -11.6], cast: true }));
    g.add(mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.32, 32), phys('#d8a84a', 0.25, { metalness: 1 }), { p: [x, 0.16, -11.6], cast: true }));
    g.add(contact(x, -11.4, 3, 3, 0.7));
  }

  // dust bunnies: soft gray cores with a halo of fluff
  const bunnies = [];
  const coreM = std('#8d8880', 1);
  for (const [x, z, r] of [[-8, -6.5, 0.95], [8.6, -4.5, 0.7], [-3.4, -11, 0.6], [5.2, -11.4, 1.15], [-10.4, -3.2, 0.55], [1.8, -9.2, 0.45], [10.6, -9.4, 0.85]]) {
    const grp = new THREE.Group(); grp.position.set(x, r * 0.55, z);
    grp.add(mesh(lumpy(r * 0.62, 0.28, 5), coreM));
    const pos = [], col = [];
    for (let i = 0; i < 1400; i++) {
      const d = V3(rr(-1, 1), rr(-0.5, 1), rr(-1, 1)).normalize();
      const a = d.clone().multiplyScalar(r * rr(0.35, 0.62)), b = a.clone().add(V3(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize().add(d.clone().multiplyScalar(0.4)).multiplyScalar(r * rr(0.08, 0.3)));
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const back = clamp(-d.z * 0.6 + d.y * 0.4, 0, 1);
      const c1 = C('#6a665f'), c2 = C('#5c5650').lerp(C('#b8c8ee'), back);
      col.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    grp.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 })));
    g.add(grp); g.add(contact(x, z, r * 2.4, r * 2.4, 0.5));
    bunnies.push({ grp, base: grp.position.clone(), r });
  }
  // a lost building brick standing like a monolith, with a coin leaning on it
  const brick = new THREE.Group();
  const red = phys('#d8222c', 0.22, { clearcoat: 0.7, clearcoatRoughness: 0.15 });
  brick.add(mesh(roundedBox(1.6, 3.2, 1.15, 0.07), red, { cast: true }));
  const stud = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 24); stud.rotateX(Math.PI / 2);
  for (const sx of [-0.4, 0.4]) for (const sy of [-1.2, -0.4, 0.4, 1.2]) brick.add(mesh(stud, red, { p: [sx, sy, 0.665], cast: true }));
  brick.position.set(6.4, 1.6, -8.2); brick.rotation.y = -0.35; g.add(brick); g.add(contact(6.4, -8, 2.6, 2, 0.6));
  const coinFace = canvas(256, 256, (x, w) => {
    const gr = x.createRadialGradient(w * 0.4, w * 0.35, 10, w / 2, w / 2, w / 2); gr.addColorStop(0, '#f0a878'); gr.addColorStop(1, '#8a4a28');
    x.fillStyle = gr; x.beginPath(); x.arc(w / 2, w / 2, w / 2, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(70,30,10,0.6)'; x.lineWidth = 6; x.beginPath(); x.arc(w / 2, w / 2, w / 2 - 14, 0, TAU); x.stroke();
    for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(70,30,10,0.5)'; x.beginPath(); x.arc(w / 2 + Math.cos(i / 40 * TAU) * (w / 2 - 26), w / 2 + Math.sin(i / 40 * TAU) * (w / 2 - 26), 3, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(255,210,170,0.7)'; x.font = 'bold 110px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('1', w / 2 + 3, w / 2 + 4); x.fillStyle = 'rgba(80,36,14,0.8)'; x.fillText('1', w / 2, w / 2);
  });
  const copper = phys('#c27546', 0.32, { metalness: 1 });
  const coinT = ctex(coinFace);
  const coin = mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.09, 48), [copper, phys('#ffffff', 0.3, { metalness: 0.6, map: coinT, emissiveMap: coinT, emissive: C('#ffffff'), emissiveIntensity: 0.35 }), copper], { cast: true });
  coin.position.set(5.2, 0.9, -7.2); coin.rotation.set(Math.PI / 2 - 0.3, 0, -0.35); g.add(coin);
  // a blue crayon, a pink hair tie, a button
  const wrap = canvas(512, 128, (x, w, h) => { x.fillStyle = '#2a62d0'; x.fillRect(0, 0, w, h); x.fillStyle = '#163c88'; for (let i = 0; i < w; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 32, h / 2); x.lineTo(i, h); x.lineTo(i + 10, h); x.lineTo(i + 42, h / 2); x.lineTo(i + 10, 0); x.fill(); } x.fillStyle = '#0a1a40'; x.fillRect(0, 10, w, 6); x.fillRect(0, h - 16, w, 6); });
  const crayon = new THREE.Group();
  crayon.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 3.6, 28), [selfLit(std('#ffffff', 0.85, { map: ctex(wrap) }), 0.3), std('#3a78f0', 0.5), std('#3a78f0', 0.5)], { cast: true }));
  crayon.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.5, 28), std('#3a78f0', 0.45), { p: [0, 2.05, 0], cast: true }));
  crayon.add(mesh(new THREE.CylinderGeometry(0.06, 0.21, 0.6, 28), std('#3a78f0', 0.45), { p: [0, 2.6, 0], cast: true }));
  crayon.position.set(-4.6, 0.21, -9.4); crayon.rotation.set(0, 0.55, Math.PI / 2); g.add(crayon); g.add(contact(-4.6, -9.4, 4.8, 1.2, 0.5, 0.006, 0.55));
  g.add(mesh(new THREE.TorusGeometry(0.55, 0.11, 14, 48), std('#ff5aa0', 0.6), { p: [2.6, 0.1, -10.6], r: [-Math.PI / 2 + 0.1, 0, 0.3], cast: true }));
  const btn = new THREE.Group();
  btn.add(mesh(new THREE.CylinderGeometry(0.62, 0.6, 0.16, 36), std('#24b0a0', 0.55), { cast: true }));
  for (const [hx, hz] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) btn.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.17, 10), basic('#0a2a26'), { p: [hx, 0.005, hz] }));
  btn.position.set(-1.6, 0.08, -11.4); g.add(btn);
  // a lost striped sock, crumpled at the back
  const stripes = canvas(512, 64, (x, w, h) => { const cs = ['#ff5a6a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff', '#ffffff']; for (let i = 0; i < 16; i++) { x.fillStyle = cs[i % cs.length]; x.fillRect(i * 32, 0, 32, h); } noiseDots(x, w, h, 3000, '#000', 0.05, 0.15, 1, 2); });
  const sock = mesh(tube([[-17.5, 1.1, -9.5], [-15.2, 1.4, -11], [-12.6, 1.2, -11.6], [-10.6, 1.0, -10.2], [-9.8, 1.0, -8.2]], 1.15, 64, 18), std('#ffffff', 1, { map: ctex(stripes, [4, 1]) }), { s: [1, 0.55, 1], cast: true });
  g.add(sock);
  g.add(mesh(new THREE.SphereGeometry(1.15, 24, 16), std('#ff5a6a', 1), { p: [-9.8, 0.55, -8.2], s: [1, 0.55, 1.1], cast: true }));
  g.add(contact(-13.6, -10, 10, 5, 0.6));
  // a dusty cobweb catching the TV light
  { const cx = -10, cy = 3.7, cz = -11.2, pos = [];
    const anchors = []; for (let i = 0; i < 11; i++) { const a = i / 11 * TAU; anchors.push(V3(cx + Math.cos(a) * rr(1.3, 2.2), cy + Math.sin(a) * rr(1.0, 1.6), cz + rr(-0.2, 0.2))); }
    for (const a of anchors) pos.push(cx, cy, cz, a.x, a.y, a.z);
    for (let ring = 1; ring < 9; ring++) for (let i = 0; i < 11; i++) {
      const a = anchors[i], b = anchors[(i + 1) % 11], k = ring / 9;
      pos.push(cx + (a.x - cx) * k, cy + (a.y - cy) * k - 0.04 * ring, cz + (a.z - cz) * k, cx + (b.x - cx) * k, cy + (b.y - cy) * k - 0.04 * ring, cz + (b.z - cz) * k);
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })));
  }

  // the family dog, asleep on the rug, chin on its paws
  const dog = new THREE.Group();
  const fur = phys('#e4ac5c', 0.85, { sheen: 1, sheenColor: C('#ffe8b8'), sheenRoughness: 0.45, emissive: C('#3a2008'), emissiveIntensity: 0.6 });
  const furDark = phys('#a87030', 0.9, { sheen: 1, sheenColor: C('#ffd090') });
  for (const s of [-1, 1]) {
    dog.add(mesh(new THREE.CapsuleGeometry(1.25, 5, 8, 16), fur, { p: [s * 2.3, 1.25, -2.6], r: [Math.PI / 2, 0, 0] }));
    dog.add(mesh(new THREE.SphereGeometry(1.55, 24, 16), fur, { p: [s * 2.3, 1.0, 0.6], s: [1, 0.65, 1.15] }));
    for (const t of [-0.6, 0, 0.6]) dog.add(mesh(new THREE.SphereGeometry(0.32, 12, 8), furDark, { p: [s * 2.3 + t, 0.62, 1.95], s: [1, 0.7, 1] }));
  }
  const head = new THREE.Group(); head.position.set(0, 0, -3.5); dog.add(head);
  head.add(mesh(new THREE.SphereGeometry(3.5, 32, 22), fur, { p: [0, 3.9, -1.6], s: [1.05, 0.92, 1] }));
  const muzzle = phys('#f4d8a8', 0.85, { sheen: 1, sheenColor: C('#fff4d8'), emissive: C('#4a3418'), emissiveIntensity: 0.5 });
  head.add(mesh(new THREE.SphereGeometry(1, 28, 18), muzzle, { p: [0, 2.7, 1.2], s: [1.9, 1.35, 2.5] }));
  head.add(mesh(new THREE.CapsuleGeometry(0.06, 1.1, 4, 8), basic('#3a2010'), { p: [0, 2.05, 3.42], r: [0, 0, Math.PI / 2] }));
  for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), basic('#000000'), { p: [s * 0.22, 3.15, 4.0] }));
  head.add(mesh(new THREE.SphereGeometry(0.52, 24, 16), phys('#16100c', 0.15, { clearcoat: 1 }), { p: [0, 3.25, 3.55], s: [1.35, 0.85, 0.9] }));
  head.add(mesh(new THREE.SphereGeometry(1, 20, 14), fur, { p: [0, 1.85, 1.3], s: [1.4, 0.55, 1.9] }));
  const ears = [];
  for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(1, 20, 14), furDark, { p: [s * 3.5, 3.4, -1.4], s: [0.9, 2.5, 1.8], r: [0, 0, s * 0.25] }); head.add(e); ears.push(e); }
  const shut = [], open = [];
  for (const s of [-1, 1]) {
    const lid = mesh(new THREE.CapsuleGeometry(0.16, 0.95, 4, 8), basic('#2a1a10'), { p: [s * 1.45, 4.3, 1.7], r: [0, 0, Math.PI / 2 + s * 0.15] }); head.add(lid); shut.push(lid);
    const ey = new THREE.Group(); ey.position.set(s * 1.45, 4.4, 1.5);
    ey.add(mesh(new THREE.SphereGeometry(0.45, 18, 12), phys('#2a1608', 0.1, { clearcoat: 1 })));
    ey.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), basic('#ffffff'), { p: [-0.12, 0.15, 0.38] }));
    ey.visible = false; head.add(ey); open.push(ey);
  }
  dog.position.set(-4, 0, -33); dog.scale.setScalar(0.85); g.add(dog);
  R.dog = { head, ears, shut, open, awake: 0 };
  // a toy ball on the rug
  const ballT = canvas(512, 256, (x, w, h) => { x.fillStyle = '#e8302a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd23a'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(i * 90 + 40, h / 2, 26, h, 0, 0, TAU); x.fill(); } });
  g.add(mesh(new THREE.SphereGeometry(2.2, 32, 20), phys('#ffffff', 0.25, { map: ctex(ballT), clearcoat: 1 }), { p: [13, 2.2, -27], r: [0.4, 0.8, 0.2] }));

  // the robot vacuum that patrols the rug
  const vac = new THREE.Group();
  const shell = phys('#26282e', 0.2, { clearcoat: 1, clearcoatRoughness: 0.1 });
  vac.add(mesh(new THREE.CylinderGeometry(8.4, 8.6, 3.0, 64), shell, { p: [0, 1.6, 0] }));
  vac.add(mesh(new THREE.CylinderGeometry(8.7, 8.7, 1.3, 64, 1, true, -1.2, 2.4), std('#6a6e78', 0.4), { p: [0, 1.0, 0] }));
  vac.add(mesh(new THREE.CylinderGeometry(1.8, 1.9, 1.1, 32), std('#15161a', 0.3), { p: [0, 3.6, -1.5] }));
  const ring = mesh(new THREE.TorusGeometry(2.6, 0.12, 8, 64), basic('#5ae8ff', { toneMapped: false }), { p: [0, 3.15, 2.2], r: [-Math.PI / 2, 0, 0] }); vac.add(ring);
  const lamp = mesh(roundedBox(2.2, 0.5, 0.3, 0.1), basic('#ffffff', { toneMapped: false }), { p: [0, 1.6, 8.55] }); vac.add(lamp);
  const brush = new THREE.Group(); brush.position.set(-5.5, 0.15, 5.8); vac.add(brush);
  for (let i = 0; i < 3; i++) brush.add(mesh(new THREE.BoxGeometry(0.12, 0.08, 2.4), std('#9a9aa8', 0.6), { p: [0, 0, 1.2], r: [0, i * TAU / 3, 0] }));
  const vacLight = new THREE.SpotLight(C('#eef6ff'), 0, 48, 0.45, 0.6, 1); vacLight.position.set(0, 1.8, 8.6); vacLight.target.position.set(0, 0.5, 30); vac.add(vacLight, vacLight.target);
  const vacGlow = glow('#dfefff', 5, 0.0, { p: [0, 1.7, 9.2] }); vac.add(vacGlow);
  vac.position.set(60, 0, -20.6); vac.rotation.y = -Math.PI / 2; vac.scale.setScalar(0.74); g.add(vac);
  R.vac = { g: vac, light: vacLight, glow: vacGlow, brush, ring, t: -8, period: 30 };

  R.rig = {
    hemi: ['#2c3858', '#5a3c26', 0.5], // warm bounce off the floorboards lights the couch's underside
    sun: { c: '#a8c8ff', i: 2.5, p: [4, 4.8, -46], t: [0, 0, -2], box: [26, 10, 90] },
    fill: { c: '#ffa060', i: 0.55, p: [-10, 4, 14] },
    rims: [['#7a6cff', 1.2, [-14, 3, -26]], ['#60e0ff', 0.55, [16, 2, -20]]],
  };
  R.env = { top: '#0a0c14', mid: '#141a2c', bot: '#0c0a08', panels: [[[0, 1.5, -14], 12, 2.4, '#bcd4ff', 5], [[-10, 4, 8], 3, 3, '#ffb070', 1.4], [[0, 8, 0], 14, 8, '#1a1a22', 1]] };
  R.fog = ['#0a0d16', 18, 95];
  R.ambient = (dt, fx) => { if (Math.random() < dt * 22) fx.sparks.emit(rand(-9, 9), rand(0.3, 3.8), rand(-12, 1), rand(-0.05, 0.05), rand(-0.02, 0.06), rand(0.02, 0.1), C('#c8d8ff'), rand(0.022, 0.045), rand(3, 5.5), 0, 0); };
  R.dust = '#a09a90'; R.music = 'fight2'; R.look = { exposure: 1.1, bloomT: 0.9, bloomS: 0.42 };
  R.tick.push((t, dt) => {
    // the TV flickers between scenes
    const L = R.L; const k = 0.88 + 0.08 * Math.sin(t * 3.1) * Math.sin(t * 7.7) + 0.04 * Math.sin(t * 23);
    const scene = Math.floor(t / 7) % 4;
    L.sun.color.lerp(C(['#a8c8ff', '#c8e4ff', '#ffd2a8', '#b8b0ff'][scene]), Math.min(1, dt * 2));
    L.sun.intensity = L.sun.userData.i0 * k;
    // the robot vacuum makes its rounds
    const V = R.vac; V.t += dt;
    const ph = ((V.t % V.period) + V.period) % V.period, dur = 15;
    if (ph < dur) {
      const u = ph / dur, x = 46 - u * 92;
      const look = clamp(1 - Math.abs(u - 0.5) / 0.12, 0, 1);
      V.g.position.set(x, 0, -20.6);
      V.g.rotation.y = -Math.PI / 2 + look * (Math.PI / 2) * 0.85;
      V.light.intensity = 5 + look * 9; V.glow.material.opacity = 0.75;
      V.brush.rotation.y += dt * 18; V.ring.material.color.setHSL(0.52 + Math.sin(t * 3) * 0.03, 1, 0.6);
      if (Math.abs(ph - 0.5) < dt) sfx('vacuum', dur);
      R.vacNear = Math.max(0, 1 - Math.abs(x) / 22);
    } else { V.g.position.x = 70; V.light.intensity = 0; V.glow.material.opacity = 0; R.vacNear = 0; }
    // the dust bunnies tremble when it goes by
    for (const b of bunnies) { const j = R.vacNear * 0.05; b.grp.position.set(b.base.x + Math.sin(t * 31 + b.base.x) * j, b.base.y, b.base.z - R.vacNear * 0.25 * (1 / b.r)); b.grp.rotation.y = Math.sin(t * 0.3 + b.base.z) * 0.3; }
    // the dog breathes, and peeks when the vacuum passes
    const D = R.dog; D.awake += ((R.vacNear > 0.15 ? 1 : 0) - D.awake) * Math.min(1, dt * 2);
    D.head.scale.set(1, 1 + Math.sin(t * 1.3) * 0.015, 1);
    for (const s of D.shut) s.visible = D.awake < 0.5; for (const o of D.open) o.visible = D.awake >= 0.5;
    D.ears.forEach((e, i) => { e.rotation.x = Math.sin(t * 2 + i) * 0.03 + (Math.sin(t * 0.37) > 0.97 ? Math.sin(t * 30) * 0.15 : 0); });
    D.head.rotation.y = D.awake * (V.g.position.x > -4 ? -0.18 : 0.18);
  });
}

// =====================================================================
// THE MOVIE THEATER FLOOR
// =====================================================================
const MOVIE_FS = `uniform float uT; varying vec2 vUv;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
  float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
  float sdTri(vec2 p, vec2 p0, vec2 p1, vec2 p2){
    vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2; vec2 v0 = p - p0, v1 = p - p1, v2 = p - p2;
    vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
    vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
    vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
    float s = sign(e0.x * e2.y - e0.y * e2.x);
    vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)), vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))), vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
    return -sqrt(d.x) * sign(d.y);
  }
  vec3 seaSunset(vec2 uv, float t){
    vec2 p = vec2(uv.x * 2.3, uv.y);
    vec3 col = mix(vec3(1.0, 0.56, 0.3), vec3(0.42, 0.16, 0.5), smoothstep(0.22, 0.6, uv.y));
    vec2 sc = vec2(1.45, 0.29); float sd = length(p - sc);
    col += vec3(1.0, 0.85, 0.5) * smoothstep(0.075, 0.07, sd) + vec3(1.0, 0.6, 0.3) * 0.4 * exp(-sd * 7.0);
    if (uv.y < 0.21) {
      float w = sin(uv.y * 300.0 - t * 2.0 + sin(p.x * 20.0) * 2.0) * 0.5 + 0.5;
      col = mix(vec3(0.14, 0.1, 0.3), vec3(0.4, 0.18, 0.35), uv.y / 0.21);
      col += vec3(1.0, 0.7, 0.4) * smoothstep(0.12, 0.0, abs(p.x - 1.45)) * w * 0.9;
    }
    float bx = fract(t * 0.012 + 0.1) * 2.8 - 0.2;
    vec2 bp = p - vec2(bx, 0.21);
    float boat = min(sdBox(bp - vec2(0.0, 0.006), vec2(0.06, 0.012)), min(sdTri(bp, vec2(-0.005, 0.02), vec2(-0.005, 0.15), vec2(0.07, 0.02)), sdTri(bp, vec2(-0.012, 0.02), vec2(-0.012, 0.12), vec2(-0.06, 0.02))));
    if (boat < 0.0) col = vec3(0.12, 0.04, 0.12);
    for (int i = 0; i < 3; i++) { float fi = float(i); vec2 gp = p - vec2(fract(t * 0.02 + fi * 0.33) * 2.6 - 0.1, 0.36 + fi * 0.04); float gull = sdSeg(gp, vec2(-0.02, 0.006), vec2(0.0, 0.0)); gull = min(gull, sdSeg(gp, vec2(0.0, 0.0), vec2(0.02, 0.006))); if (gull < 0.0025) col = vec3(0.15, 0.06, 0.14); }
    return col;
  }
  vec3 space(vec2 uv, float t){
    vec2 p = vec2(uv.x * 2.3, uv.y);
    vec3 col = mix(vec3(0.02, 0.02, 0.08), vec3(0.14, 0.06, 0.3), uv.y * 1.6);
    vec2 gid = floor(p * 160.0); float s = step(0.993, h21(gid)); col += vec3(s) * (0.6 + 0.4 * sin(t * 3.0 + h21(gid) * 40.0));
    vec2 pc = vec2(1.6, 0.24); vec2 rp = p - pc; float d = length(rp);
    vec3 pl = mix(vec3(1.0, 0.6, 0.42), vec3(0.55, 0.2, 0.55), smoothstep(-0.12, 0.12, rp.y + rp.x * 0.5));
    pl *= 0.85 + 0.15 * sin(rp.y * 90.0);
    vec2 rr2 = vec2(rp.x, rp.y * 3.6 + rp.x * 0.7); float rd = length(rr2);
    bool front = rr2.y < 0.0;
    if (rd > 0.17 && rd < 0.25 && !front) col = mix(col, vec3(1.0, 0.82, 0.6), 0.7);
    if (d < 0.13) col = pl * (1.0 - smoothstep(0.06, 0.13, d) * 0.55);
    if (rd > 0.17 && rd < 0.25 && front) col = mix(col, vec3(1.0, 0.82, 0.6), 0.8);
    float rt = fract(t * 0.045);
    vec2 q = p - vec2(-0.2 + rt * 2.9, 0.05 + rt * 0.3); q = mat2(0.94, -0.34, 0.34, 0.94) * q;
    if (sdBox(q, vec2(0.05, 0.013)) < 0.0) col = vec3(0.92, 0.92, 1.0);
    if (sdTri(q, vec2(0.05, 0.013), vec2(0.05, -0.013), vec2(0.08, 0.0)) < 0.0) col = vec3(1.0, 0.3, 0.3);
    float fl = length((q + vec2(0.07, 0.0)) * vec2(0.8, 2.6)) - 0.022 * (1.0 + 0.3 * sin(t * 40.0));
    if (fl < 0.0) col = vec3(1.0, 0.65, 0.2);
    return col;
  }
  vec3 jungle(vec2 uv, float t){
    vec2 p = vec2(uv.x * 2.3, uv.y);
    vec3 col = mix(vec3(1.0, 0.94, 0.68), vec3(0.5, 0.84, 0.95), smoothstep(0.1, 0.55, uv.y));
    col += vec3(1.0, 0.9, 0.55) * 0.55 * exp(-length(p - vec2(1.7, 0.33)) * 6.0);
    float h1 = 0.2 + 0.04 * sin(p.x * 4.0 + 1.0) + 0.015 * sin(p.x * 13.0);
    float h2 = 0.14 + 0.03 * sin(p.x * 6.0 + 2.5);
    float h3 = 0.07 + 0.02 * sin(p.x * 11.0);
    if (uv.y < h1) col = vec3(0.4, 0.66, 0.45);
    if (uv.y < h2) col = vec3(0.25, 0.52, 0.28);
    float dx = mod(t * 0.035, 2.9) - 0.3;
    vec2 q = p - vec2(dx, 0.11);
    float body = length(q * vec2(1.0, 1.9)) - 0.085;
    float neck = sdSeg(q, vec2(0.05, 0.03), vec2(0.12, 0.2)) - 0.017;
    float hd = length((q - vec2(0.14, 0.21)) * vec2(1.0, 1.7)) - 0.024;
    float tl = sdSeg(q, vec2(-0.06, 0.0), vec2(-0.2, -0.04)) - 0.012;
    float legs = 1.0;
    for (int i = 0; i < 4; i++) { float fi = float(i); float sw = sin(t * 4.0 + fi * 1.6) * 0.012; legs = min(legs, sdBox(q - vec2(-0.045 + fi * 0.032 + sw, -0.055), vec2(0.009, 0.045))); }
    if (min(min(body, neck), min(min(hd, tl), legs)) < 0.0) col = vec3(0.12, 0.24, 0.14);
    if (uv.y < h3) col = vec3(0.12, 0.32, 0.14);
    return col;
  }
  void main(){
    float T = mod(uT, 36.0); float idx = floor(T / 12.0); float lt = T - idx * 12.0;
    float fade = smoothstep(0.0, 0.7, lt) * smoothstep(12.0, 11.3, lt);
    vec3 col = idx < 0.5 ? seaSunset(vUv, uT) : idx < 1.5 ? space(vUv, uT) : jungle(vUv, uT);
    col *= fade * (0.94 + 0.06 * h21(vec2(floor(uT * 24.0), 3.0)));
    col *= 1.0 - 0.35 * smoothstep(0.35, 0.75, length((vUv - vec2(0.5, 0.3)) * vec2(1.0, 1.3)));
    col += (h21(vUv * 400.0 + floor(uT * 24.0)) - 0.5) * 0.04;
    gl_FragColor = vec4(col * 1.35, 1.0);
  }`;
export function movieColor(t) {
  const T = ((t % 36) + 36) % 36, idx = Math.floor(T / 12), lt = T - idx * 12;
  const fade = clamp(lt / 0.7, 0, 1) * clamp((12 - lt) / 0.7, 0, 1);
  return C(['#ff9a6a', '#7a6cff', '#a8e07a'][idx]).multiplyScalar(0.25 + 0.75 * fade);
}

function theater(g, R) {
  seed(23);
  // velvet-red theater carpet with gold stars, well loved
  const carpet = canvas(1024, 1024, (x, w, h) => {
    x.fillStyle = '#4a0f1e'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) { x.fillStyle = `rgba(${rr() < 0.5 ? '20,0,6' : '120,30,50'},${rr(0.15, 0.35)})`; x.fillRect(rr(0, w), rr(0, h), 2, 2); }
    const star = (cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, k = i % 2 ? r * 0.42 : r; x.lineTo(cx + Math.cos(a) * k, cy + Math.sin(a) * k); } x.fill(); };
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const cx = i * 256 + 128, cy = j * 256 + 128;
      x.strokeStyle = 'rgba(214,170,80,0.7)'; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, 70, 0, TAU); x.stroke();
      star(cx, cy, 44, '#d8aa50');
      x.strokeStyle = 'rgba(40,140,150,0.75)'; x.lineWidth = 5;
      for (let q = 0; q < 4; q++) { x.beginPath(); x.arc(cx + (q < 2 ? -128 : 128), cy + (q % 2 ? -128 : 128), 40, 0, TAU); x.stroke(); }
      star(cx + 128, cy + 128, 14, '#2a9aa0');
    }
    for (let k = 0; k < 30; k++) { x.fillStyle = `rgba(20,4,8,${rr(0.15, 0.35)})`; blob(x, rr(0, w), rr(0, h), rr(15, 70), 0.5); x.fill(); }
  });
  g.add(mesh(new THREE.PlaneGeometry(90, 40), std('#ffffff', 0.92, { map: ctex(carpet, [90 / 8, 40 / 8]) }), { r: [-Math.PI / 2, 0, 0], p: [0, 0, -6], recv: true }));
  // sticky soda puddles (they slow you down)
  const puddleM = phys('#2a0e04', 0.05, { clearcoat: 0.6, clearcoatRoughness: 0.05, transparent: true, opacity: 0.92, envMapIntensity: 0.5, specularIntensity: 0.5 });
  const puddle = (x, z, r, sx = 1.3) => { const s = new THREE.Shape(); const ph = rr(0, 6); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, k = r * (1 + 0.22 * Math.sin(a * 3 + ph) + 0.1 * Math.sin(a * 7)); i ? s.lineTo(Math.cos(a) * k * sx, Math.sin(a) * k) : s.moveTo(Math.cos(a) * k * sx, Math.sin(a) * k); } const m = mesh(new THREE.ShapeGeometry(s, 24), puddleM, { r: [-Math.PI / 2, 0, 0], p: [x, 0.012, z] }); m.renderOrder = 1; g.add(m); };
  puddle(-3.6, 0.2, 0.85); puddle(3.3, -0.3, 0.75, 1.4); puddle(-2.4, -2.4, 0.35); puddle(12.5, -9.2, 2.4, 1.2);
  R.slowZones = [[-4.75, -2.45], [2.25, 4.35]];

  // the stage riser with its row of little aisle lights
  const riserM = std('#2a0a12', 0.95);
  g.add(mesh(new THREE.BoxGeometry(110, 1.2, 6), riserM, { p: [0, 0.6, -21], recv: true }));
  g.add(mesh(new THREE.BoxGeometry(110, 0.14, 0.25), phys('#d8aa50', 0.3, { metalness: 1 }), { p: [0, 1.2, -18], cast: true }));
  const dots = [];
  for (let x = -54; x <= 54; x += 2.4) dots.push({ p: [x, 0.32, -17.95] });
  g.add(instanced(new THREE.SphereGeometry(0.13, 10, 8), basic('#ffb04a', { toneMapped: false }), dots));
  for (let x = -24; x <= 24; x += 4.8) g.add(glow('#ff9a3a', 1.2, 0.55, { p: [x, 0.32, -17.7] }));
  // the screen, its black frame, and red curtains
  const movie = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: MOVIE_FS, fog: false });
  const screen = mesh(new THREE.PlaneGeometry(66, 29), movie, { p: [0, 2.2 + 14.5, -40] }); g.add(screen);
  R.movie = movie;
  g.add(mesh(new THREE.PlaneGeometry(74, 34), basic('#050304'), { p: [0, 16.7, -40.2] }));
  const drape = new THREE.PlaneGeometry(16, 56, 80, 1);
  { const p = drape.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.9 * Math.sin(p.getX(i) * 1.7) + 0.3 * Math.sin(p.getX(i) * 4.1)); drape.computeVertexNormals(); }
  const curtainM = phys('#8a0e22', 0.55, { sheen: 1, sheenColor: C('#ff7088'), sheenRoughness: 0.3, side: THREE.DoubleSide });
  for (const s of [-1, 1]) g.add(mesh(drape, curtainM, { p: [s * 39, 25, -38.5] }));
  g.add(mesh(new THREE.BoxGeometry(110, 6, 2), curtainM, { p: [0, 34, -38.5] }));
  for (const s of [-1, 1]) { g.add(glow('#ffb070', 9, 0.4, { p: [s * 34.5, 7, -37] })); g.add(mesh(lathe([[0, 0], [0.9, 0.2], [1.3, 1.6], [0, 1.7]], 24), basic('#ffd8a0'), { p: [s * 34.5, 6.2, -37] })); }

  // the projector beam overhead, full of dust
  R.beam = beam(V3(0, 14, 46), V3(0, 16.7, -40), 0.6, 30, '#ffffff', 0.05);
  g.add(R.beam);

  // a tipped-over bucket of popcorn spilling across the floor
  const stripesC = canvas(1024, 256, (x, w, h) => {
    for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#f6f0e4' : '#d81e2a'; x.fillRect(i * 64, 0, 64, h); }
    x.fillStyle = '#ffcf40'; x.fillRect(0, 96, w, 70); x.fillStyle = '#b81020'; x.font = '900 52px sans-serif'; x.textAlign = 'center';
    for (let i = 0; i < 2; i++) x.fillText('POPCORN', 256 + i * 512, 150);
  });
  const bucketM = std('#ffffff', 0.7, { map: ctex(stripesC), side: THREE.DoubleSide });
  const bucket = mesh(lathe([[2.8, 0], [3.0, 0.3], [3.9, 9.2], [4.15, 9.3], [4.0, 9.45]], 48), bucketM, { cast: true });
  const base = mesh(new THREE.CircleGeometry(2.85, 48), std('#c8bca8', 0.8), { r: [Math.PI / 2, 0, 0], p: [0, 0.02, 0] });
  const bk = new THREE.Group(); bk.add(bucket, base); bk.rotation.set(0, 0.5, -Math.PI / 2 + 0.06); bk.position.set(-16, 3.7, -10); g.add(bk);
  g.add(contact(-12, -9.6, 12, 7, 0.55));
  const pop = [lumpy(0.62, 0.3, 3.4, 18, 12), lumpy(0.58, 0.34, 3.9, 18, 12), lumpy(0.66, 0.26, 3.0, 18, 12)];
  const popM = selfLit(phys('#fff4d8', 0.75, { sheen: 0.6, sheenColor: C('#ffffff') }), 0.32);
  const popItems = [[], [], []];
  const addPop = (x, z, y = 0.45) => popItems[Math.floor(rr(0, 3)) % 3].push({ p: [x, y, z], r: [rr(0, 6), rr(0, 6), rr(0, 6)], s: rr(0.8, 1.25), c: pick(['#fffaf0', '#fff4dc', '#ffffff', '#ffeec8']) });
  for (let i = 0; i < 46; i++) { const u = rr(0, 1); addPop(-11.5 + u * 8 + rr(-1.2, 1.2), -9 + u * 3 + rr(-1.5, 1.5), rr(0.4, 0.5)); }
  for (let i = 0; i < 12; i++) addPop(-13 + rr(-2, 2), -9.5 + rr(-2, 2), rr(0.9, 1.6));
  for (const [x, z] of [[-1.5, -6.5], [1.8, -8], [5.5, -5.8], [-6.5, -12], [8.4, -7]]) addPop(x, z);
  pop.forEach((geo, i) => g.add(instanced(geo, popM, popItems[i], { cast: true })));
  const kern = []; for (let i = 0; i < 14; i++) kern.push({ p: [rr(-10, 8), 0.12, rr(-12, -4)], r: [rr(0, 6), rr(0, 6), 0], s: [0.22, 0.14, 0.18], c: pick(['#d8a040', '#c88a30', '#e8b860']) });
  g.add(instanced(new THREE.SphereGeometry(1, 12, 8), std('#ffffff', 0.4), kern));
  // a giant cup of soda with a striped straw, sweating
  const cupC = canvas(1024, 512, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a62e0'); gr.addColorStop(1, '#1a3ab0'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(255,255,255,0.9)'; const cx = rr(0, w), cy = rr(0, h), r = rr(6, 16); x.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, q = k % 2 ? r * 0.4 : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.fill(); }
    x.fillStyle = '#ff3a4a'; x.fillRect(0, 200, w, 120); x.fillStyle = '#fff'; x.font = '900 96px sans-serif'; x.textAlign = 'center'; x.fillText('FIZZ', w * 0.25, 296); x.fillText('FIZZ', w * 0.75, 296);
  });
  const cup = new THREE.Group();
  cup.add(mesh(lathe([[0, 0], [2.0, 0], [2.65, 9.4], [2.7, 9.5]], 48), phys('#ffffff', 0.4, { map: ctex(cupC), clearcoat: 0.6 }), { cast: true }));
  cup.add(mesh(lathe([[2.75, 9.4], [2.8, 9.6], [2.5, 9.9], [1.0, 10.3], [0, 10.35]], 48), phys('#f8faff', 0.2, { transparent: true, opacity: 0.85, clearcoat: 1 }), { cast: true }));
  const strawC = canvas(64, 512, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#ff3a4a'; x.save(); x.translate(0, i * 32); x.transform(1, 0.5, 0, 1, 0, 0); x.fillRect(-64, 0, 200, 16); x.restore(); } });
  cup.add(mesh(tube([[0.5, 9.5, 0], [0.7, 12.5, 0.1], [1.4, 14.2, 0.2], [2.6, 14.9, 0.3]], 0.34, 40, 14), std('#ffffff', 0.35, { map: ctex(strawC, [1, 2]) }), { cast: true }));
  const drops = []; for (let i = 0; i < 90; i++) { const a = rr(0, TAU), y = rr(0.5, 8.8), r = 2.0 + (y / 9.4) * 0.65; drops.push({ p: [Math.cos(a) * r, y, Math.sin(a) * r], s: [rr(0.06, 0.14), rr(0.08, 0.2), rr(0.06, 0.14)] }); }
  cup.add(instanced(new THREE.SphereGeometry(1, 10, 8), phys('#ffffff', 0.02, { transparent: true, opacity: 0.55, clearcoat: 1 }), drops));
  cup.position.set(12.5, 0, -10.5); g.add(cup); g.add(contact(12.5, -10.3, 7, 7, 0.55));
  // an open box of chocolate drops
  const boxC = canvas(512, 256, (x, w, h) => { x.fillStyle = '#5a2a14'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffcf40'; x.fillRect(0, 70, w, 110); x.fillStyle = '#5a2a14'; x.font = '900 64px sans-serif'; x.textAlign = 'center'; x.fillText('CHOCO DROPS', w / 2, 148); for (let i = 0; i < 9; i++) { x.fillStyle = '#3a1a0a'; x.beginPath(); x.arc(40 + i * 54, 40, 16, 0, TAU); x.fill(); } });
  g.add(mesh(roundedBox(4.4, 0.9, 3, 0.08), [std('#5a2a14', 0.6), std('#5a2a14', 0.6), phys('#ffffff', 0.5, { map: ctex(boxC) }), std('#5a2a14', 0.6), std('#5a2a14', 0.6), std('#5a2a14', 0.6)], { p: [6.5, 0.45, -13.2], r: [0, -0.4, 0], cast: true }));
  const choc = []; for (let i = 0; i < 14; i++) choc.push({ p: [6.5 + rr(-3.5, 2.5), 0.28, -11.2 + rr(-1.5, 1.8)], s: [0.34, 0.27, 0.34], c: pick(['#5a2a14', '#3a1808', '#6a3418']) });
  g.add(instanced(new THREE.SphereGeometry(1, 16, 12), selfLit(phys('#ffffff', 0.18, { clearcoat: 1 }), 0.15), choc, { cast: true }));
  // a pair of cardboard 3D glasses
  const fr = new THREE.Shape(); rrect2(fr, -3.4, -1, 6.8, 2, 0.4);
  for (const s of [-1, 1]) { const hole = new THREE.Path(); rrect2(hole, s * 1.65 - 1.15, -0.72, 2.3, 1.44, 0.3); fr.holes.push(hole); }
  const glasses = new THREE.Group();
  glasses.add(mesh(new THREE.ExtrudeGeometry(fr, { depth: 0.05, bevelEnabled: false }), std('#f4f0e8', 0.85), { cast: true }));
  glasses.add(mesh(new THREE.PlaneGeometry(2.3, 1.44), phys('#ff2a3a', 0.1, { transparent: true, opacity: 0.6, side: THREE.DoubleSide }), { p: [-1.65, 0, 0.03] }));
  glasses.add(mesh(new THREE.PlaneGeometry(2.3, 1.44), phys('#2ad8ff', 0.1, { transparent: true, opacity: 0.6, side: THREE.DoubleSide }), { p: [1.65, 0, 0.03] }));
  for (const s of [-1, 1]) glasses.add(mesh(new THREE.BoxGeometry(0.05, 0.5, 4.6), std('#f4f0e8', 0.85), { p: [s * 3.35, 0.0, -2.3], r: [0, s * 0.25, 0], cast: true }));
  glasses.rotation.set(-Math.PI / 2 + 0.35, 0, 0.5); glasses.position.set(-7, 0.4, -5.6); g.add(glasses);
  // a ticket stub and a lump of gum
  const tk = canvas(512, 224, (x, w, h) => { x.fillStyle = '#f2dcb0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c0283a'; x.lineWidth = 10; x.strokeRect(14, 14, w - 28, h - 28); x.fillStyle = '#c0283a'; x.font = '900 64px sans-serif'; x.textAlign = 'center'; x.fillText('ADMIT ONE', w / 2, 132); for (let i = 0; i < h; i += 16) { x.fillStyle = '#4a0f1e'; x.beginPath(); x.arc(w - 4, i, 5, 0, TAU); x.fill(); } });
  const tg = new THREE.PlaneGeometry(3, 1.3, 12, 6); { const p = tg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 2.1) * 0.12 + Math.abs(p.getY(i)) * 0.1); tg.computeVertexNormals(); }
  g.add(mesh(tg, std('#ffffff', 0.85, { map: ctex(tk), side: THREE.DoubleSide }), { r: [-Math.PI / 2, 0, 0.3], p: [2.4, 0.12, -7.4], cast: true }));
  g.add(mesh(lumpy(0.5, 0.3, 4), phys('#ff7ab8', 0.35, { clearcoat: 0.6 }), { p: [-1.2, 0.05, -3.6], s: [1.2, 0.22, 1] }));

  R.rig = {
    hemi: ['#3a2a4a', '#120608', 0.32],
    sun: { c: '#ffb08a', i: 2.4, p: [0, 9, -40], t: [0, 0, -3], box: [26, 12, 80] },
    fill: { c: '#ffc890', i: 0.85, p: [-6, 7, 12] },
    rims: [['#ff4030', 0.55, [14, 2, -16]], ['#c8a0ff', 0.6, [-12, 5, -20]]],
  };
  R.env = { top: '#0a0508', mid: '#1a0c12', bot: '#2a0a10', panels: [[[0, 3, -14], 14, 5, '#fff0e0', 4], [[-12, 4, 2], 2, 3, '#ffb070', 1.6], [[12, 4, 2], 2, 3, '#ffb070', 1.6]] };
  R.fog = ['#0e070c', 32, 150];
  R.ambient = (dt, fx) => { if (Math.random() < dt * 26) { const c = movieColor(R.time || 0).lerp(C('#ffffff'), 0.6); fx.sparks.emit(rand(-14, 14), rand(3, 9), rand(-30, -6), rand(-0.05, 0.05), rand(-0.05, 0.05), 0, c, rand(0.03, 0.07), rand(3, 5), 0, 0); } };
  R.dust = '#6a3a44'; R.music = 'fight1'; R.look = { exposure: 1.05, bloomT: 0.95, bloomS: 0.4 };
  R.tick.push((t, dt, M) => {
    R.time = t; R.movie.uniforms.uT.value = t;
    const mc = movieColor(t); R.L.sun.color.copy(mc).lerp(C('#ffffff'), 0.25); R.L.sun.intensity = R.L.sun.userData.i0 * (0.4 + 0.6 * Math.min(1, mc.r + mc.g + mc.b));
    R.beam.material.uniforms.uC.value.copy(mc).lerp(C('#ffffff'), 0.5); R.beam.material.uniforms.uT.value = t;
    if (M && M.phase === 'fight') for (const F of M.fighters) {
      if (F.state === 'walk' && R.slowAt(F.x) < 1 && M.frame % 9 === 0) { M.G.fx.beadsAt(V3(F.x, 0.05, 0.1), '#7a3208', 2, 0, 0.35); sfx('squelch'); }
    }
  });
}
function rrect2(s, x, y, w, h, r) { s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); }

// =====================================================================
// THE WINDOWSILL
// =====================================================================
function windowsill(g, R) {
  seed(37);
  const WIN = -15;
  const paint = canvas(1024, 1024, (x, w, h) => {
    x.fillStyle = '#f3f0ea'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(${rr() < 0.5 ? '200,190,175' : '255,255,255'},${rr(0.08, 0.25)})`; x.lineWidth = rr(1, 3); x.beginPath(); const y0 = rr(0, h); x.moveTo(0, y0); for (let k = 0; k <= w; k += 32) x.lineTo(k, y0 + Math.sin(k * 0.004 + i) * 6); x.stroke(); }
    for (let i = 0; i < 9; i++) { x.fillStyle = '#b88a5a'; blob(x, rr(0, w), rr(0, h), rr(3, 9), 0.5); x.fill(); }
    x.strokeStyle = 'rgba(150,110,80,0.18)'; x.lineWidth = 7; x.beginPath(); x.arc(310, 640, 70, 0, TAU); x.stroke();
    noiseDots(x, w, h, 5000, '#8a7a6a', 0.04, 0.12, 0.6, 1.6);
  });
  g.add(mesh(new THREE.PlaneGeometry(110, 26), floorMat(ctex(paint, [110 / 20, 26 / 20]), 0.55, 0.45, { env: 0.45, color: C('#ece2d2') }), { r: [-Math.PI / 2, 0, 0], p: [0, 0, -2], recv: true }));
  // the window: rail, glass with dew, white muntins
  const white = std('#f6f4ef', 0.45);
  g.add(mesh(roundedBox(120, 2.0, 1.8, 0.15), white, { p: [0, 1.0, WIN - 0.9], cast: true, recv: true }));
  for (const x of [-9, 9]) g.add(mesh(roundedBox(1.1, 42, 1.4, 0.12), white, { p: [x, 21, WIN - 1.1], cast: true }));
  g.add(mesh(roundedBox(120, 1.0, 1.4, 0.12), white, { p: [0, 17, WIN - 1.1], cast: true }));
  for (const x of [-27, 27]) g.add(mesh(roundedBox(3, 42, 3, 0.2), white, { p: [x, 21, WIN - 1.2], cast: true }));
  const pane = mesh(new THREE.PlaneGeometry(120, 40), glass({ opacity: 0.05, side: THREE.FrontSide }), { p: [0, 22, WIN - 1.2] }); pane.renderOrder = 5; g.add(pane);
  const dew = []; for (let i = 0; i < 90; i++) { const s = rr(0.08, 0.26); dew.push({ p: [rr(-26, 26), 2.1 + Math.pow(rr(), 2) * 4, WIN - 1.15], s: [s, s * rr(0.9, 1.3), s * 0.4] }); }
  g.add(instanced(new THREE.SphereGeometry(1, 10, 8), phys('#ffffff', 0.0, { transparent: true, opacity: 0.55, clearcoat: 1, envMapIntensity: 2.2 }), dew));
  // the garden outside, soft focus
  const garden = soften(canvas(2048, 640, (x, w, h) => {
    const yRow = y => (32 - y) / 32 * h;
    const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#5ab8ff'); sky.addColorStop(0.55, '#bfe6ff'); sky.addColorStop(0.8, '#fff6e0'); sky.addColorStop(1, '#fff6e0');
    x.fillStyle = sky; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(255,255,255,0.85)'; const cx = rr(0, w), cy = rr(40, 220); for (let k = 0; k < 6; k++) { x.beginPath(); x.ellipse(cx + k * 40 - 100, cy + rr(-15, 15), rr(50, 90), rr(28, 45), 0, 0, TAU); x.fill(); } }
    x.fillStyle = '#8a9ab0'; x.beginPath(); x.moveTo(120, yRow(13)); x.lineTo(330, yRow(19)); x.lineTo(540, yRow(13)); x.fill(); x.fillStyle = '#e8d8c8'; x.fillRect(160, yRow(13), 340, yRow(8) - yRow(13));
    for (let i = 0; i < 26; i++) { x.fillStyle = pick(['#5aa04a', '#4a8a3a', '#6ab85a', '#3a7a3a']); x.beginPath(); x.ellipse(rr(0, w), yRow(rr(9, 15)), rr(80, 180), rr(60, 120), 0, 0, TAU); x.fill(); }
    x.fillStyle = '#7ac05a'; x.fillRect(0, yRow(7), w, h);
    for (let i = 0; i < w; i += 46) { x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(i, yRow(5)); x.lineTo(i + 14, yRow(9.4)); x.lineTo(i + 28, yRow(5)); x.lineTo(i + 28, yRow(1.5)); x.lineTo(i, yRow(1.5)); x.fill(); }
    x.fillStyle = '#ffffff'; x.fillRect(0, yRow(8.2), w, 14); x.fillRect(0, yRow(3.6), w, 14);
    for (let i = 0; i < 260; i++) { x.fillStyle = pick(['#ff6a9a', '#ffd34f', '#ffffff', '#c890ff', '#ff8a4a']); x.beginPath(); x.arc(rr(0, w), yRow(rr(0.5, 3.5)), rr(5, 11), 0, TAU); x.fill(); }
    x.fillStyle = '#d83a3a'; x.fillRect(1500, yRow(14), 70, 60); x.fillStyle = '#7a4a2a'; x.fillRect(1528, yRow(12), 14, yRow(2) - yRow(12));
  }), 5);
  g.add(backdrop(garden, 110, 32, [0, 16, -72]));
  g.add(glow('#fff2c8', 44, 0.75, { p: [-30, 17, -66] }));
  // a branch outside, leaves glowing in the sun
  const branch = new THREE.Group();
  branch.add(mesh(tube([[34, 13, -26], [26, 14.5, -25], [18, 15.2, -24], [12, 16.6, -24]], 0.45, 40, 10), std('#5a3a22', 0.9), { cast: true }));
  const leafS = new THREE.Shape(); leafS.moveTo(0, 0); leafS.quadraticCurveTo(0.55, 0.6, 0, 1.6); leafS.quadraticCurveTo(-0.55, 0.6, 0, 0);
  const leafG = new THREE.ShapeGeometry(leafS, 8);
  const leaves = []; for (let i = 0; i < 110; i++) { const u = rr(0, 1); leaves.push({ p: [34 - u * 22 + rr(-1.5, 1.5), 13 + u * 3.6 + rr(-1.8, 1.8), -25 + rr(-1.5, 1.5)], r: [rr(-1, 1), rr(0, 6), rr(-1.5, 1.5)], s: rr(0.8, 1.4), c: pick(['#6ac04a', '#8ad85a', '#4aa03a', '#a8e070']) }); }
  const leafMesh = instanced(leafG, std('#ffffff', 0.6, { side: THREE.DoubleSide, emissive: C('#2a5a10'), emissiveIntensity: 0.5 }), leaves, { cast: true });
  branch.add(leafMesh); g.add(branch);
  R.tick.push(t => { branch.rotation.z = Math.sin(t * 0.7) * 0.012; branch.position.y = Math.sin(t * 0.9) * 0.15; });
  // a bird feeder, and a chickadee who visits
  const feeder = new THREE.Group(); feeder.position.set(-11, 9.5, -27);
  const wood = std('#b88a5a', 0.8);
  feeder.add(mesh(new THREE.BoxGeometry(5, 0.4, 3), wood, { cast: true }));
  for (const s of [-1, 1]) feeder.add(mesh(new THREE.BoxGeometry(5.6, 0.25, 2.3), std('#c84a3a', 0.7), { p: [0, 3.2, s * 0.85], r: [s * 0.6, 0, 0], cast: true }));
  for (const [sx, sz] of [[-2.3, -1.3], [2.3, -1.3], [-2.3, 1.3], [2.3, 1.3]]) feeder.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8), wood, { p: [sx, 1.4, sz] }));
  feeder.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 20), basic('#4a3a2a'), { p: [0, 13.5, 0] }));
  const bird = new THREE.Group();
  bird.add(mesh(new THREE.SphereGeometry(1, 20, 14), std('#e8e4dc', 0.8), { s: [1.15, 0.85, 0.8] }));
  bird.add(mesh(new THREE.SphereGeometry(0.62, 18, 12), std('#1a1a1e', 0.6), { p: [0.75, 0.65, 0] }));
  bird.add(mesh(new THREE.SphereGeometry(0.5, 16, 10), std('#f4f2ee', 0.7), { p: [0.95, 0.45, 0], s: [0.8, 0.7, 1.05] }));
  bird.add(mesh(new THREE.ConeGeometry(0.12, 0.4, 8), std('#2a2a2a', 0.4), { p: [1.38, 0.62, 0], r: [0, 0, -Math.PI / 2] }));
  bird.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), basic('#000000'), { p: [1.2, 0.8, 0.28] }));
  bird.add(mesh(new THREE.ConeGeometry(0.35, 1.4, 10), std('#7a7a82', 0.7), { p: [-1.2, 0.1, 0], r: [0, 0, Math.PI / 2 + 0.25] }));
  bird.add(mesh(new THREE.SphereGeometry(0.7, 14, 10), std('#8a8a92', 0.7), { p: [-0.1, 0.25, 0.55], s: [1.2, 0.6, 0.3] }));
  bird.position.set(1.2, 1.2, 0.8); feeder.add(bird); g.add(feeder);
  R.bird = { b: bird, t: 0 };

  // the fishbowl, with gravel, a plant and a goldfish
  const bowl = new THREE.Group(); bowl.position.set(5.6, 0, -9.6); g.add(bowl);
  const outer = [[0, 0], [2.4, 0], [2.9, 0.15], [3.6, 0.6], [4.3, 1.6], [4.65, 3.0], [4.7, 4.0], [4.55, 5.2], [4.1, 6.4], [3.4, 7.4], [3.0, 7.9], [3.1, 8.15], [3.25, 8.25]];
  const glassBowl = mesh(lathe(outer, 72), glass({ opacity: 0.12, envMapIntensity: 1.8 })); glassBowl.renderOrder = 4; bowl.add(glassBowl);
  const water = mesh(lathe([[0, 0.12], [2.3, 0.12], [3.5, 0.7], [4.15, 1.7], [4.5, 3.0], [4.55, 4.0], [4.4, 5.2], [4.0, 6.5], [0, 6.5]], 72), phys('#4ccbe0', 0.04, { transparent: true, opacity: 0.3, depthWrite: false, envMapIntensity: 0.6 }));
  water.renderOrder = 3; bowl.add(water);
  const surf = mesh(new THREE.CircleGeometry(3.98, 64), phys('#bff4ff', 0.02, { transparent: true, opacity: 0.25, depthWrite: false, clearcoat: 1 }), { r: [-Math.PI / 2, 0, 0], p: [0, 6.49, 0] }); surf.renderOrder = 3; bowl.add(surf);
  const pebbles = []; for (let i = 0; i < 190; i++) { const a = rr(0, TAU), r = Math.sqrt(rr()) * 2.9; pebbles.push({ p: [Math.cos(a) * r, 0.22 + rr(0, 0.35) + (r > 2.2 ? (r - 2.2) * 0.5 : 0), Math.sin(a) * r], r: [rr(0, 6), rr(0, 6), 0], s: rr(0.7, 1.2), c: pick(['#7fe0ff', '#ff9ad8', '#ffffff', '#b48cff', '#7affc0', '#ffd36a']) }); }
  bowl.add(instanced(lumpy(0.2, 0.25, 3, 10, 8), phys('#ffffff', 0.3, { clearcoat: 0.6 }), pebbles));
  const fronds = [];
  for (let i = 0; i < 7; i++) {
    const hgt = rr(3.2, 5.2), lean = rr(-0.35, 0.35), side = rr(-0.3, 0.3);
    const fg = new THREE.PlaneGeometry(0.42, hgt, 1, 12); fg.translate(0, hgt / 2, 0);
    const p = fg.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setX(k, p.getX(k) * (1 - y / hgt * 0.6) + Math.sin(y * 1.2) * 0.25); }
    const f = mesh(fg, std('#3ab060', 0.6, { side: THREE.DoubleSide, emissive: C('#0a3a1a'), emissiveIntensity: 0.6 }), { p: [-1.2 + rr(-0.5, 0.5), 0.4, -1.3 + rr(-0.5, 0.5)], r: [lean, rr(0, 3), side] });
    bowl.add(f); fronds.push({ f, ph: rr(0, 6), lean });
  }
  const fish = new THREE.Group();
  const gold = phys('#ff7414', 0.3, { clearcoat: 0.8, sheen: 1, sheenColor: C('#ffd070') });
  fish.add(mesh(new THREE.SphereGeometry(1, 32, 20), gold, { s: [1.3, 0.82, 0.55] }));
  fish.add(mesh(new THREE.SphereGeometry(0.75, 24, 16), phys('#ffa040', 0.3, { clearcoat: 0.8 }), { p: [0.55, -0.15, 0], s: [1, 0.75, 0.62] }));
  for (const s of [-1, 1]) { fish.add(mesh(new THREE.SphereGeometry(0.23, 14, 10), basic('#ffffff'), { p: [0.92, 0.22, s * 0.36] })); fish.add(mesh(new THREE.SphereGeometry(0.14, 10, 8), basic('#000000'), { p: [1.02, 0.24, s * 0.46] })); }
  const finM = phys('#ff8a30', 0.4, { transparent: true, opacity: 0.82, side: THREE.DoubleSide, sheen: 1, sheenColor: C('#ffe0a0') });
  const tailS = new THREE.Shape(); tailS.moveTo(0, 0); tailS.bezierCurveTo(-0.8, 0.4, -1.4, 1.3, -1.7, 1.0); tailS.bezierCurveTo(-1.2, 0.3, -1.2, -0.3, -1.7, -1.0); tailS.bezierCurveTo(-1.4, -1.3, -0.8, -0.4, 0, 0);
  const tail = new THREE.Group(); tail.position.set(-1.1, 0, 0); tail.add(mesh(new THREE.ShapeGeometry(tailS, 16), finM)); fish.add(tail);
  const dorsS = new THREE.Shape(); dorsS.moveTo(-0.6, 0); dorsS.quadraticCurveTo(-0.2, 0.9, 0.5, 0); dorsS.lineTo(-0.6, 0);
  fish.add(mesh(new THREE.ShapeGeometry(dorsS, 10), finM, { p: [0, 0.7, 0] }));
  const fins = []; for (const s of [-1, 1]) { const pf = mesh(new THREE.ShapeGeometry(dorsS, 8), finM, { p: [0.3, -0.35, s * 0.4], r: [s * 1.2, 0, 0.6], s: 0.55 }); fish.add(pf); fins.push(pf); }
  fish.scale.setScalar(1.15); bowl.add(fish);
  R.fish = { f: fish, tail, fins, a: 0, dash: 0, next: 9 };
  g.add(caustic(8.6, -3.6, 11, 8, '#fff0c8', 0.75));
  g.add(contact(5.6, -9.4, 8, 8, 0.25));

  // a potted succulent, a scallop shell, a marble and a pencil
  const terra = canvas(512, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d0784a'); gr.addColorStop(1, '#a85a34'); x.fillStyle = gr; x.fillRect(0, 0, w, h); noiseDots(x, w, h, 9000, '#6a3018', 0.08, 0.25, 1, 3); noiseDots(x, w, h, 2500, '#f0d8c0', 0.05, 0.2, 1, 3); x.fillStyle = 'rgba(240,230,215,0.35)'; for (let i = 0; i < 12; i++) { blob(x, rr(0, w), rr(0, 50), rr(10, 30), 0.6); x.fill(); } });
  const pot = new THREE.Group(); pot.position.set(-6.5, 0, -10.5); g.add(pot);
  pot.add(mesh(lathe([[0, 0], [2.2, 0], [2.3, 0.2], [2.7, 3.8], [2.95, 3.85], [3.05, 4.6], [2.9, 4.75], [2.75, 4.6], [2.6, 3.9]], 48), std('#ffffff', 0.9, { map: ctex(terra, [3, 1]), side: THREE.DoubleSide }), { cast: true }));
  pot.add(mesh(new THREE.CircleGeometry(2.62, 40), std('#3a2414', 1), { r: [-Math.PI / 2, 0, 0], p: [0, 4.1, 0] }));
  const leafG2 = new THREE.SphereGeometry(1, 16, 12); leafG2.translate(0, 1, 0);
  { const p = leafG2.attributes.position, col = []; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 2; const c = C('#7fb8a6').lerp(C('#e88aa0'), Math.pow(clamp(y, 0, 1), 4)); col.push(c.r, c.g, c.b); } leafG2.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); }
  const rosette = []; for (let i = 0; i < 30; i++) { const a = i * 2.39996, k = i / 30; rosette.push({ p: [Math.cos(a) * k * 0.6, 4.1, Math.sin(a) * k * 0.6], r: [0, -a, 0.25 + k * 1.05], s: [0.42 + k * 0.1, 0.7 + k * 0.75, 0.22] }); }
  const ros = instanced(leafG2, phys('#ffffff', 0.4, { vertexColors: true, clearcoat: 0.3 }), rosette, { cast: true });
  pot.add(ros);
  g.add(contact(-6.5, -10.2, 7, 6, 0.4));
  const shell = new THREE.BufferGeometry(); { const pos = [], idx = []; const nu = 14, nv = 28; for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const u = i / nu, v = j / nv, th = (v - 0.5) * 1.9, r = u * 1.7; pos.push(Math.sin(th) * r, 0.45 * (1 - u * u) * Math.cos(th * 0.6) + 0.05 * Math.abs(Math.sin(th * 9)) * u, Math.cos(th) * r - 0.6); } for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } shell.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); shell.setIndex(idx); shell.computeVertexNormals(); }
  g.add(mesh(shell, phys('#f6d4c0', 0.55, { sheen: 1, sheenColor: C('#ffe8f0'), side: THREE.DoubleSide }), { p: [-2.4, 0.02, -7.6], r: [0, 0.8, 0], cast: true }));
  const marble = new THREE.Group(); marble.position.set(1.2, 0.62, -6.2);
  const mg = glass({ opacity: 0.22, side: THREE.FrontSide, depthWrite: true }); const mball = mesh(new THREE.SphereGeometry(0.62, 32, 20), mg); mball.renderOrder = 4; marble.add(mball);
  const sw = new THREE.PlaneGeometry(0.95, 0.2, 24, 1); { const p = sw.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), a = x * 4; p.setXYZ(i, x, y * Math.cos(a), y * Math.sin(a)); } sw.computeVertexNormals(); }
  marble.add(mesh(sw, std('#2a8aff', 0.3, { side: THREE.DoubleSide, emissive: C('#ff7a2a'), emissiveIntensity: 0.25 }), { cast: true }));
  g.add(marble); g.add(contact(1.2, -6.2, 1.6, 1.6, 0.4));
  const pencil = new THREE.Group();
  pencil.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 6.4, 6), phys('#ffc21a', 0.35, { clearcoat: 0.6 }), { cast: true }));
  pencil.add(mesh(new THREE.CylinderGeometry(0.06, 0.3, 1.1, 6), std('#e8c89a', 0.8), { p: [0, 3.75, 0], cast: true }));
  pencil.add(mesh(new THREE.CylinderGeometry(0.02, 0.07, 0.3, 6), std('#2a2a2a', 0.4), { p: [0, 4.35, 0] }));
  pencil.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.6, 16), phys('#c8c8d0', 0.3, { metalness: 1 }), { p: [0, -3.5, 0], cast: true }));
  pencil.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.55, 16), std('#ff8aa8', 0.8), { p: [0, -4.05, 0], cast: true }));
  pencil.rotation.set(0, 0.25, Math.PI / 2); pencil.position.set(-1, 0.3, -12.6); g.add(pencil);

  R.rig = {
    hemi: ['#cfe4ff', '#f5dcc0', 0.36],
    sun: { c: '#ffe2b0', i: 3.1, p: [-14, 18, -44], t: [0, 0, -4], box: [26, 18, 110] },
    fill: { c: '#dbe8ff', i: 0.4, p: [6, 6, 12] },
    rims: [['#ffe0b0', 0.9, [10, 8, -20]]],
  };
  R.env = { top: '#7ab8e8', mid: '#c8dcec', bot: '#cfc6b8', panels: [[[0, 4, -14], 16, 8, '#ffffff', 1.8], [[-8, 9, -10], 5, 5, '#fff2d0', 3.2], [[0, -6, 3], 14, 5, '#c8c0b4', 0.8]] };
  R.look = { exposure: 0.82, bloomT: 1.35, bloomS: 0.28 };
  R.fog = ['#e6f2ff', 45, 170];
  R.ambient = (dt, fx) => {
    if (Math.random() < dt * 18) fx.sparks.emit(rand(-8, 8), rand(0.3, 5), rand(-13, 1), rand(-0.04, 0.04), rand(-0.02, 0.05), 0, C('#fff0c0'), rand(0.022, 0.045), rand(3, 5), 0, 0);
    if (Math.random() < dt * 5) fx.glows.emit(4.4 + rand(-0.5, 0.5), 0.6, -10.9 + rand(-0.4, 0.4), 0, rand(0.8, 1.4), 0, C('#eaffff'), rand(0.05, 0.1), rand(3.5, 4.5), 0, 0, 0);
  };
  R.dust = '#ece6dc'; R.music = 'fight1';
  R.tick.push((t, dt) => {
    // the goldfish loops, sometimes rushes the glass to look at the fight
    const F = R.fish; F.a += dt * 0.42; F.next -= dt;
    if (F.next < 0) { F.dash = 1; F.next = rand(9, 16); }
    let x = Math.cos(F.a) * 2.2, y = 3.3 + Math.sin(F.a * 1.7) * 1.1, z = 1.0 + Math.sin(F.a) * 1.5;
    if (F.dash > 0) { F.dash -= dt * 0.33; const k = Math.sin(clamp(1 - F.dash, 0, 1) * Math.PI); x = x * (1 - k) + 0.4 * k; z = z * (1 - k) + 3.2 * k; y = y * (1 - k) + 3.6 * k; if (Math.abs(F.dash - 0.5) < dt * 0.33) sfx('tick'); }
    const p = F.f.position, nx = x - p.x, nz = z - p.z;
    if (Math.abs(nx) + Math.abs(nz) > 1e-4) F.f.rotation.y = Math.atan2(-nz, nx);
    F.f.rotation.z = (y - p.y) * 2; p.set(x, y, z);
    const speed = 1 + F.dash * 2; F.tail.rotation.y = Math.sin(t * 9 * speed) * 0.45; F.fins.forEach((f, i) => { f.rotation.y = Math.sin(t * 6 + i * 3) * 0.4; });
    if (Math.random() < dt * 0.6) { const w = F.f.localToWorld(V3(1.2, 0.1, 0)); R.fx && R.fx.glows.emit(w.x, w.y, w.z, 0, 0.9, 0, C('#ffffff'), 0.07, 1.6, 0, 0, 0); if (Math.random() < 0.3) sfx('bubble'); }
    for (const f of fronds) f.f.rotation.x = f.lean + Math.sin(t * 1.2 + f.ph) * 0.08;
    // the chickadee hops and tilts its head
    const B = R.bird; B.t += dt; const hop = (B.t % 3.4) < 0.25 ? Math.sin(((B.t % 3.4) / 0.25) * Math.PI) * 0.6 : 0;
    B.b.position.y = 1.2 + hop; B.b.rotation.y = Math.sin(B.t * 0.7) > 0 ? 0.4 : -0.6; B.b.rotation.z = Math.sin(B.t * 2.3) * 0.15;
    if (hop > 0 && Math.random() < dt * 3) sfx('chirp');
  });
}

// =====================================================================
// THE BIRTHDAY CAKE
// =====================================================================
function birthdayCake(g, R) {
  seed(51);
  const CX = 0, CZ = -3, RAD = 16;
  const frost = canvas(1024, 1024, (x, w, h) => {
    x.fillStyle = '#f6b4ca'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { x.strokeStyle = rr() < 0.5 ? `rgba(255,220,232,${rr(0.15, 0.4)})` : `rgba(214,130,160,${rr(0.1, 0.3)})`; x.lineWidth = rr(6, 18); x.beginPath(); const cx = rr(0, w), cy = rr(0, h), r = rr(30, 120), a0 = rr(0, 6); x.arc(cx, cy, r, a0, a0 + rr(0.6, 2)); x.stroke(); }
    noiseDots(x, w, h, 6000, '#ffffff', 0.05, 0.2, 1, 2.5);
  });
  const top = mesh(new THREE.CircleGeometry(RAD, 120), floorMat(ctex(frost, [3, 3]), 0.6, 0.4, { env: 0.4, color: C('#e8a0b8'), sheen: 0.3, sheenColor: C('#ffe0ea') }), { r: [-Math.PI / 2, 0, 0], p: [CX, 0, CZ], recv: true });
  g.add(top);
  g.add(mesh(new THREE.CylinderGeometry(RAD, RAD, 14, 120, 1, true), phys('#f6b4ca', 0.6, { sheen: 0.6 }), { p: [CX, -7, CZ] }));
  // piped rosettes round the rim, with sugar pearls
  const ros = lathe([[0, 0], [0.78, 0], [0.92, 0.18], [0.86, 0.42], [0.66, 0.66], [0.42, 0.88], [0.2, 1.08], [0.05, 1.22], [0, 1.25]], 24);
  { const p = ros.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x); const r = Math.hypot(x, z) * (1 + 0.16 * Math.sin(a * 8 + y * 5)); p.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r); } ros.computeVertexNormals(); }
  const rosItems = [], pearls = [];
  for (let i = 0; i < 92; i++) { const a = i / 92 * TAU; rosItems.push({ p: [CX + Math.cos(a) * (RAD - 0.8), 0, CZ + Math.sin(a) * (RAD - 0.8)], r: [0, a, 0], s: 1, c: ['#ffffff', '#ff8ab4', '#a8f0d8'][i % 3] }); pearls.push({ p: [CX + Math.cos(a + 0.03) * (RAD - 2.2), 0.16, CZ + Math.sin(a + 0.03) * (RAD - 2.2)], s: 0.2, c: i % 2 ? '#ffffff' : '#ffe2a0' }); }
  g.add(instanced(ros, phys('#ffffff', 0.5, { sheen: 0.6, sheenColor: C('#ffffff') }), rosItems, { cast: true }));
  g.add(instanced(new THREE.SphereGeometry(1, 14, 10), phys('#ffffff', 0.12, { clearcoat: 1, metalness: 0.3 }), pearls));
  // sprinkles everywhere
  const sprinkles = []; const cols = ['#ff4f7a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff', '#ffffff', '#ff9a3a'];
  for (let i = 0; i < 460; i++) { const a = rr(0, TAU), r = Math.sqrt(rr()) * (RAD - 2.5); sprinkles.push({ p: [CX + Math.cos(a) * r, 0.04, CZ + Math.sin(a) * r], r: [Math.PI / 2, 0, rr(0, 6)], s: rr(0.6, 0.9), c: pick(cols) }); }
  g.add(instanced(new THREE.CapsuleGeometry(0.045, 0.24, 3, 6), selfLit(phys('#ffffff', 0.3, { clearcoat: 0.8 }), 0.2), sprinkles));
  // tall striped candles round the back, each with its own flame
  const candleCols = [['#ff8ab4', '#ffffff'], ['#7ad8ff', '#ffffff'], ['#ffd34f', '#ff8a4a'], ['#9cff6a', '#ffffff'], ['#c890ff', '#ffe2ff'], ['#ff9a6a', '#fff0d0'], ['#5ad1ff', '#d8f6ff'], ['#ff6a8a', '#ffd34f']];
  R.flames = [];
  const angles = [200, 222, 244, 262, 278, 296, 318, 340];
  angles.forEach((deg, i) => {
    const a = deg * Math.PI / 180, x = CX + Math.cos(a) * 12.4, z = CZ + Math.sin(a) * 12.4;
    const [c1, c2] = candleCols[i];
    const st = canvas(128, 512, (q, w, h) => { q.fillStyle = c1; q.fillRect(0, 0, w, h); q.fillStyle = c2; for (let k = -4; k < 20; k++) { q.save(); q.translate(0, k * 40); q.transform(1, 0.55, 0, 1, 0, 0); q.fillRect(-40, 0, 240, 18); q.restore(); } });
    const hgt = 2.8 + (i % 3) * 0.35;
    const cg = new THREE.Group(); cg.position.set(x, 0, z); g.add(cg);
    cg.add(mesh(new THREE.CylinderGeometry(0.34, 0.36, hgt, 28), phys('#ffffff', 0.4, { map: ctex(st), clearcoat: 0.3 }), { p: [0, hgt / 2, 0], cast: true }));
    cg.add(mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 28), phys(c1, 0.3), { p: [0, hgt + 0.02, 0] }));
    for (let d = 0; d < 2; d++) { const da = rr(0, TAU); cg.add(mesh(new THREE.CapsuleGeometry(0.08, rr(0.3, 0.9), 4, 8), phys(c1, 0.3, { clearcoat: 0.6 }), { p: [Math.cos(da) * 0.34, hgt - 0.35, Math.sin(da) * 0.34] })); }
    cg.add(mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.42, 6), basic('#201810'), { p: [0, hgt + 0.25, 0], r: [0.1, 0, 0.15] }));
    const f = flame(i * 1.7); f.scale.set(0.95, 1.7, 1); f.position.set(0, hgt + 0.3, 0); cg.add(f);
    const gl = glow('#ffa040', 3.2, 0.55, { p: [0, hgt + 0.8, 0] }); cg.add(gl);
    R.flames.push({ f, gl, x, y: hgt + 0.9, z, on: 1 });
    g.add(contact(x, z, 1.4, 1.4, 0.45));
  });
  // cherries on frosting swirls
  for (const [x, z, s] of [[-7.2, -9.4, 1.0], [7.6, -10.2, 0.95], [-12.2, -3.5, 0.9]]) {
    const cg = new THREE.Group(); cg.position.set(x, 0, z); cg.scale.setScalar(s); g.add(cg);
    cg.add(mesh(ros, phys('#ffffff', 0.5, { sheen: 0.6 }), { s: 1.3, cast: true }));
    cg.add(mesh(new THREE.SphereGeometry(0.62, 28, 20), phys('#c8102a', 0.08, { clearcoat: 1, clearcoatRoughness: 0.03 }), { p: [0, 1.75, 0], cast: true }));
    cg.add(mesh(tube([[0, 2.25, 0], [0.1, 2.8, 0], [0.45, 3.2, 0.05]], 0.05, 16, 6), std('#4a7a2a', 0.6)));
  }
  // bunting across the room: HAPPY BIRTHDAY
  const word = 'HAPPY★BIRTHDAY';
  const pc = ['#ff8ab4', '#7ad8ff', '#ffd34f', '#9cff6a', '#c890ff'];
  const n = word.length; const sag = x => 6.4 - 1.3 * (1 - (x / 20) * (x / 20));
  const pts = []; for (let i = 0; i <= 40; i++) { const x = -21 + i * 1.05; pts.push([x, sag(x) + 0.5, -27]); }
  g.add(mesh(tube(pts, 0.05, 80, 5), std('#fff6e0', 0.8)));
  R.pennants = [];
  for (let i = 0; i < n; i++) {
    const x = -19.5 + i * (39 / (n - 1));
    const ch = word[i];
    const pt = canvas(128, 160, (q, w, h) => { q.fillStyle = pc[i % pc.length]; q.beginPath(); q.moveTo(0, 0); q.lineTo(w, 0); q.lineTo(w / 2, h); q.closePath(); q.fill(); q.fillStyle = '#ffffff'; q.font = '900 64px "Lilita One", sans-serif'; q.textAlign = 'center'; q.fillText(ch, w / 2, 76); });
    const pg = new THREE.PlaneGeometry(2.2, 2.75); pg.translate(0, -1.375, 0);
    const pm = mesh(pg, std('#ffffff', 0.85, { map: ctex(pt), side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 }), { p: [x, sag(x) + 0.5, -27] });
    g.add(pm); R.pennants.push({ m: pm, ph: i * 0.6 });
  }
  // balloons bobbing at the back
  const balloons = [];
  for (const [x, y, z, c] of [[-17, 7, -30, '#ff4f7a'], [-11, 9.5, -36, '#5ad1ff'], [14, 8, -31, '#ffd34f'], [19, 10.5, -38, '#c890ff'], [6, 11, -42, '#9cff6a'], [-4, 12, -46, '#ff9a3a']]) {
    const b = new THREE.Group(); b.position.set(x, y, z);
    b.add(mesh(new THREE.SphereGeometry(2.4, 36, 24), phys(c, 0.3, { clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.4, sheenColor: C('#ffffff') }), { s: [1, 1.15, 1] }));
    b.add(mesh(new THREE.ConeGeometry(0.35, 0.55, 12), phys(c, 0.35), { p: [0, -2.85, 0], r: [Math.PI, 0, 0] }));
    b.add(mesh(tube([[0, -3.1, 0], [0.4, -5, 0.2], [-0.3, -7, 0], [0.2, -9, -0.2]], 0.03, 30, 4), basic('#f6f0e8')));
    g.add(b); balloons.push({ b, base: b.position.clone(), ph: rr(0, 6) });
  }
  // the party, soft and far away
  const party = soften(canvas(2048, 640, (x, w, h) => {
    const yRow = y => (40 - y) / 44 * h;
    const wall = x.createLinearGradient(0, 0, 0, h); wall.addColorStop(0, '#ffd8c4'); wall.addColorStop(1, '#f0b0a8'); x.fillStyle = wall; x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff8e8'; x.fillRect(120, yRow(38), 420, yRow(14) - yRow(38));
    x.fillStyle = 'rgba(255,240,200,0.6)'; x.fillRect(90, yRow(40), 480, yRow(12) - yRow(40));
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,230,150,0.9)`; x.beginPath(); x.arc(i * 30, yRow(30) + Math.sin(i * 0.4) * 30, 9, 0, TAU); x.fill(); }
    for (let i = 0; i < 12; i++) { x.strokeStyle = pick(['#ff8ab4', '#7ad8ff', '#ffd34f']); x.lineWidth = 18; x.beginPath(); for (let k = 0; k < 12; k++) x.lineTo(i * 180 + k * 15 + (k % 2) * 20, yRow(40) + k * 22); x.stroke(); }
    const skins = ['#f2c6a0', '#d8a07a', '#a8704a', '#ffd8b8', '#c88a60', '#7a4a2a', '#f8d0b0'];
    const shirts = ['#ff5a7a', '#5ab8ff', '#ffd34f', '#7ae05a', '#c890ff', '#ff9a4a', '#4ae0c0'];
    for (let i = 0; i < 7; i++) {
      const cx = 160 + i * 280 + rr(-30, 30), headY = yRow(rr(9, 12)), r = rr(62, 80);
      x.fillStyle = shirts[i]; rrect(x, cx - r * 1.3, headY + r * 0.8, r * 2.6, h, 60); x.fill();
      if (i % 3 === 0) { x.fillStyle = skins[i]; x.save(); x.translate(cx + r * 1.1, headY + r); x.rotate(-0.6); rrect(x, -20, -150, 40, 160, 20); x.fill(); x.restore(); }
      x.fillStyle = skins[i]; x.beginPath(); x.arc(cx, headY, r, 0, TAU); x.fill();
      x.fillStyle = pick(['#3a2414', '#6a3a1a', '#1a1010', '#c88a3a', '#8a4a20']); x.beginPath(); x.arc(cx, headY - r * 0.25, r * 1.02, Math.PI, TAU); x.fill();
      x.fillStyle = '#2a1a1a'; x.beginPath(); x.arc(cx - r * 0.35, headY + 4, 7, 0, TAU); x.arc(cx + r * 0.35, headY + 4, 7, 0, TAU); x.fill();
      x.strokeStyle = '#8a2a2a'; x.lineWidth = 6; x.beginPath(); x.arc(cx, headY + r * 0.25, r * 0.35, 0.2, Math.PI - 0.2); x.stroke();
      x.fillStyle = shirts[(i + 3) % 7]; x.beginPath(); x.moveTo(cx - r * 0.55, headY - r * 0.75); x.lineTo(cx + r * 0.55, headY - r * 0.75); x.lineTo(cx + rr(-10, 10), headY - r * 2.3); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx, headY - r * 2.3, 14, 0, TAU); x.fill();
    }
    for (let i = 0; i < 5; i++) { x.fillStyle = pick(['#ff5a7a', '#5ab8ff', '#ffd34f', '#c890ff']); x.fillRect(1500 + i * 70, yRow(4) - i * 25, 120, 110); x.fillStyle = '#ffffff'; x.fillRect(1550 + i * 70, yRow(4) - i * 25, 18, 110); }
    x.fillStyle = '#fff0f4'; x.fillRect(0, yRow(1), w, h);
  }), 6);
  g.add(backdrop(party, 150, 44, [0, 18, -72], { tint: '#d8c8c8' }));
  // the big face that leans in to blow the candles out
  const faceC = soften(canvas(512, 600, (x, w, h) => {
    x.fillStyle = '#f2c4a0'; x.beginPath(); x.ellipse(w / 2, 330, 210, 230, 0, 0, TAU); x.fill();
    x.fillStyle = '#5a3418'; x.beginPath(); x.ellipse(w / 2, 220, 220, 150, 0, Math.PI, TAU); x.fill();
    x.fillStyle = '#ff9ab0'; x.beginPath(); x.arc(w / 2 - 125, 390, 60, 0, TAU); x.arc(w / 2 + 125, 390, 60, 0, TAU); x.fill();
    x.strokeStyle = '#3a2010'; x.lineWidth = 12; x.beginPath(); x.arc(w / 2 - 80, 300, 30, 0.2, Math.PI - 0.2); x.stroke(); x.beginPath(); x.arc(w / 2 + 80, 300, 30, 0.2, Math.PI - 0.2); x.stroke();
    x.fillStyle = '#c84a5a'; x.beginPath(); x.ellipse(w / 2, 440, 40, 34, 0, 0, TAU); x.fill(); x.fillStyle = '#5a1420'; x.beginPath(); x.ellipse(w / 2, 444, 22, 18, 0, 0, TAU); x.fill();
    x.fillStyle = '#ffd34f'; x.beginPath(); x.moveTo(w / 2 - 110, 120); x.lineTo(w / 2 + 110, 120); x.lineTo(w / 2 + 20, -40); x.fill();
    x.fillStyle = '#ff5a7a'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(w / 2 - 50 + i * 35, 80 - i * 25, 12, 0, TAU); x.fill(); }
  }), 3);
  const face = backdrop(faceC, 8.4, 9.8, [0, -9, -29], { transparent: true });
  g.add(face); R.face = face;

  R.rig = {
    hemi: ['#ffe6f0', '#a06070', 0.38],
    sun: { c: '#ffe0b8', i: 1.9, p: [14, 16, -38], t: [0, 0, -4], box: [26, 14, 110] },
    fill: { c: '#ffd8e6', i: 0.4, p: [0, 5, 12] },
    rims: [['#ffb0d0', 0.6, [-14, 6, -18]]],
    points: [['#ffa850', 11, 22, [-6, 4, -14]], ['#ffa850', 11, 22, [6, 4, -14]]],
  };
  R.env = { top: '#c89090', mid: '#e0b0a8', bot: '#c87890', panels: [[[0, 4, -14], 14, 5, '#fff0d8', 2], [[-12, 6, -6], 4, 4, '#ffd8a0', 1.6], [[10, 8, -8], 4, 4, '#fff8f0', 1.8], [[0, -5, 3], 12, 5, '#c87890', 0.7]] };
  R.look = { exposure: 0.86, bloomT: 1.25, bloomS: 0.3 };
  R.fog = ['#f2c8cc', 45, 160];
  R.ambient = (dt, fx) => {
    for (const f of R.flames) if (f.on > 0.5 && Math.random() < dt * 4) fx.glows.emit(f.x, f.y + 0.3, f.z, rand(-0.1, 0.1), rand(0.4, 0.8), 0, C('#ffb060'), rand(0.06, 0.1), 0.6, 0, 0, -0.5);
    if (Math.random() < dt * 10) fx.sparks.emit(rand(-10, 10), rand(0.5, 6), rand(-14, 0), rand(-0.05, 0.05), rand(-0.03, 0.05), 0, C(pick(['#ffd8f0', '#fff0c0', '#c8f0ff'])), rand(0.025, 0.05), rand(3, 5), 0, 0);
  };
  R.dust = '#ffd6e2'; R.music = 'party';
  R.song = { state: 'idle', t: 0 };
  // The wish itself runs on the fight's own clock (60 steps a second), so two
  // players online feel the same gust on the same step. The song is 26 beats
  // of 0.34 s plus a breath: 536 steps. Then the gust lasts 90 steps.
  const SONG = 536, GUST = 90;
  R.wish = { round: -1, start: -1, dir: 1 };
  R.simStep = M => {
    const W = R.wish;
    if (M.mode === 'practice') { R.wind = 0; return; }
    if (W.round !== M.round) { W.round = M.round; W.start = -1; R.wind = 0; }
    if (W.start < 0 && M.phase === 'fight' && M.timer <= 21 && M.timer > 12) { W.start = M.frame; W.dir = (M.frame & 1) ? 1 : -1; }
    if (W.start < 0) { R.wind = 0; return; }
    const bt = M.frame - (W.start + SONG + 12);
    if (bt < 0 || bt >= GUST) { R.wind = 0; return; }
    const u = bt / GUST;
    R.wind = W.dir * 3.0 * 4 * u * (1 - u);
  };
  R.tick.push((t, dt, M) => {
    for (const f of R.flames) {
      f.f.material.uniforms.uT.value = t; f.f.material.uniforms.uOn.value = f.on;
      f.gl.material.opacity = 0.55 * f.on * (0.85 + 0.15 * Math.sin(t * 17 + f.x));
    }
    const lit = R.flames.reduce((s, f) => s + f.on, 0) / R.flames.length;
    for (const p of R.L.points) p.intensity = p.userData.i0 * lit * (0.85 + 0.15 * Math.sin(t * 13 + p.position.x));
    for (const b of balloons) { b.b.position.y = b.base.y + Math.sin(t * 0.8 + b.ph) * 0.35 + R.wind * 0.05; b.b.rotation.z = Math.sin(t * 0.6 + b.ph) * 0.08 - R.wind * 0.03; b.b.position.x = b.base.x + R.wind * 0.12; }
    for (const p of R.pennants) p.m.rotation.x = Math.sin(t * 1.7 + p.ph) * 0.12 - R.wind * 0.06;
    // the birthday song, then the big wish (sound and pictures; the push itself is in R.simStep)
    const S = R.song, W = R.wish;
    if (M && M.mode !== 'practice') {
      if (W.start < 0 && S.state !== 'idle') { S.state = 'idle'; R.face.position.y = -9; for (const f of R.flames) f.on = 1; }
      if (S.state === 'idle' && W.start >= 0 && M.frame - W.start < SONG) { S.state = 'sing'; S.dur = SONG / 60; sing(); duck(S.dur + 2.5); M.G.ui.announce('MAKE A WISH!', 'small', 1.8); }
    }
    if ((S.state === 'sing' || S.state === 'blow') && M && W.start >= 0) {
      S.t = (M.frame - W.start) / 60;
      const rise = clamp((S.t - (S.dur - 2.2)) / 1.4, 0, 1), sink = S.state === 'blow' ? clamp((S.t - S.dur - 1.6) / 1.4, 0, 1) : 0;
      R.face.position.y = -9 + (rise - sink) * 12.6;
      if (S.state === 'sing' && S.t >= S.dur + 0.2) { S.state = 'blow'; S.dir = W.dir; S.poofed = false; sfx('blow'); M.shake(0.15); M.G.ui.announce('WHOOOSH!', 'small', 1.2); }
      if (S.state === 'blow') {
        const bt = S.t - S.dur - 0.2;
        for (const f of R.flames) if (f.on > 0 && bt > 0.15) { f.on = Math.max(0, f.on - dt * 5); if (f.on === 0 && R.fx) { R.fx.puff(V3(f.x, f.y, f.z), '#d8d0d8', 5, 0.3, 1.4, 0.5); } }
        if (R.fx && bt < 1.5) for (let i = 0; i < 3; i++) R.fx.sparks.emit(S.dir > 0 ? -12 : 12, rand(0.2, 5), rand(-12, 2), S.dir * rand(14, 20), rand(-0.5, 0.5), 0, C('#ffffff'), rand(0.03, 0.06), 0.9, 0, 0);
        if (bt > 0.2 && !S.poofed) { S.poofed = true; sfx('poof'); }
        if (bt > 3.2) { S.state = 'done'; R.face.position.y = -9; }
      }
    }
  });
}

// =====================================================================
// INSIDE THE FRIDGE
// =====================================================================
function insideFridge(g, R) {
  seed(67);
  const BACK = -14;
  const frost = canvas(1024, 512, (x, w, h) => {
    x.fillStyle = '#eef6fb'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) { x.strokeStyle = `rgba(255,255,255,${rr(0.2, 0.6)})`; x.lineWidth = rr(0.5, 2); x.beginPath(); const cx = rr(0, w), cy = rr(0, h * 0.4); for (let k = 0; k < 6; k++) { x.moveTo(cx, cy); const a = k * Math.PI / 3; x.lineTo(cx + Math.cos(a) * rr(4, 16), cy + Math.sin(a) * rr(4, 16)); } x.stroke(); }
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.7)'); gr.addColorStop(0.35, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    noiseDots(x, w, h, 4000, '#a8c8dc', 0.05, 0.15, 1, 2);
  });
  g.add(mesh(new THREE.PlaneGeometry(60, 26), floorMat(ctex(frost), 0.55, 0.3, { env: 0.4, color: C('#a9bccb') }), { r: [-Math.PI / 2, 0, 0], p: [0, 0, -1], recv: true }));
  const drops = []; for (let i = 0; i < 260; i++) { const s = rr(0.04, 0.13); drops.push({ p: [rr(-20, 20), 0.0, BACK + Math.pow(rr(), 1.6) * 20], s: [s, s * 0.55, s * rr(0.9, 1.4)] }); }
  g.add(instanced(new THREE.SphereGeometry(1, 10, 6), phys('#ffffff', 0.0, { transparent: true, opacity: 0.6, clearcoat: 1, envMapIntensity: 2.2 }), drops));
  // the ribbed back wall, crusted with frost, and the cold light
  const liner = canvas(256, 1024, (x, w, h) => { x.fillStyle = '#f2f6f8'; x.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 64) { const gr = x.createLinearGradient(0, y, 0, y + 64); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#eaf0f4'); gr.addColorStop(0.9, '#c8d4dc'); gr.addColorStop(1, '#ffffff'); x.fillStyle = gr; x.fillRect(0, y, w, 64); } });
  g.add(mesh(new THREE.PlaneGeometry(60, 24), std('#bccad4', 0.4, { map: ctex(liner, [6, 1]) }), { p: [0, 12, BACK], recv: true }));
  const ice = []; for (let i = 0; i < 170; i++) ice.push({ p: [rr(-24, 24), rr(0, 1.3) * rr(0.3, 1), BACK + rr(0.05, 0.7)], r: [rr(0, 6), rr(0, 6), rr(0, 6)], s: rr(0.12, 0.42) });
  g.add(instanced(new THREE.OctahedronGeometry(1, 0), phys('#f4fbff', 0.1, { transparent: true, opacity: 0.85, clearcoat: 1 }), ice));
  const ledM = basic('#f2fbff', { toneMapped: false });
  const led = mesh(roundedBox(20, 0.7, 0.3, 0.15), ledM, { p: [0, 3.3, BACK + 0.2] }); g.add(led);
  const ledGlow = glow('#dff4ff', 26, 0.6, { p: [0, 3.3, BACK + 0.6], aspect: 0.3 }); g.add(ledGlow);
  for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(1.2, 24, 30), std('#eef4f8', 0.4), { p: [s * 22, 12, BACK + 15] }));
  // the grocery city: milk, ketchup, pickles, eggs, lemon, grapes, cheese, butter
  const milkC = canvas(1024, 512, (x, w, h) => {
    x.fillStyle = '#f8fbff'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1a62d8'; x.fillRect(0, 40, w, 340);
    x.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { blob(x, rr(0, w), rr(60, 360), rr(20, 50), 0.4); x.fill(); }
    x.fillStyle = '#ffffff'; x.font = '900 170px "Lilita One", sans-serif'; x.textAlign = 'center'; x.fillText('MILK', w / 2, 270);
    x.fillStyle = '#ffd34f'; x.font = '900 46px sans-serif'; x.fillText('1 GALLON · WHOLE', w / 2, 340);
  });
  const milk = new THREE.Group(); milk.position.set(-7.2, 0, -9.2);
  const hdpe = phys('#e8ecf0', 0.42, { sheen: 0.5, sheenColor: C('#ffffff'), emissive: C('#cfd8e0'), emissiveIntensity: 0.06 });
  milk.add(mesh(roundedBox(6.6, 12.4, 6.6, 1.1, 3), hdpe, { p: [0, 6.2, 0], cast: true }));
  milk.add(mesh(new THREE.PlaneGeometry(5.6, 2.8), phys('#ffffff', 0.4, { map: ctex(milkC), transparent: true }), { p: [0, 4.6, 3.32] }));
  milk.add(mesh(new THREE.TorusGeometry(1.6, 0.45, 12, 28, Math.PI), hdpe, { p: [2.2, 12.4, 0], r: [0, Math.PI / 2, 0], cast: true }));
  milk.add(mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.0, 24), phys('#1a62d8', 0.3), { p: [-1.3, 13.1, 0], cast: true }));
  g.add(milk); g.add(contact(-7.2, -8.8, 9, 8, 0.4));
  const kC = canvas(512, 512, (x, w, h) => { x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, w, h); x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(w / 2, 40); x.lineTo(w - 40, h / 2); x.lineTo(w / 2, h - 40); x.lineTo(40, h / 2); x.closePath(); x.fill(); x.fillStyle = '#d81e1e'; x.beginPath(); x.arc(w / 2, h / 2 - 50, 70, 0, TAU); x.fill(); x.fillStyle = '#3a8a2a'; x.beginPath(); x.ellipse(w / 2, h / 2 - 118, 40, 14, 0, 0, TAU); x.fill(); x.fillStyle = '#d81e1e'; x.font = '900 60px "Lilita One", sans-serif'; x.textAlign = 'center'; x.fillText('KETCHUP', w / 2, h / 2 + 90); });
  const ketchup = new THREE.Group(); ketchup.position.set(6.8, 0, -10.6);
  ketchup.add(mesh(new THREE.CylinderGeometry(1.45, 1.6, 1.6, 32), phys('#ffffff', 0.3), { p: [0, 0.8, 0], cast: true }));
  ketchup.add(mesh(lathe([[1.45, 1.5], [2.3, 2.6], [2.5, 5], [2.4, 8.4], [1.8, 9.6], [0, 9.9]], 48), phys('#c8141c', 0.12, { clearcoat: 1, clearcoatRoughness: 0.05 }), { cast: true }));
  ketchup.add(mesh(new THREE.PlaneGeometry(3.4, 3.4), phys('#ffffff', 0.4, { map: ctex(kC), transparent: true }), { p: [0, 5.4, 2.52] }));
  g.add(ketchup); g.add(contact(6.8, -10.2, 6, 6, 0.4));
  const jar = new THREE.Group(); jar.position.set(-3.0, 0, -12);
  const jarGlass = mesh(lathe([[0, 0], [2.6, 0], [2.75, 0.3], [2.75, 6.8], [2.2, 7.3], [2.2, 7.6]], 48), glass({ opacity: 0.2 })); jarGlass.renderOrder = 4; jar.add(jarGlass);
  const brine = mesh(new THREE.CylinderGeometry(2.6, 2.6, 6.2, 40), phys('#c8d860', 0.05, { transparent: true, opacity: 0.32, depthWrite: false })); brine.position.y = 3.3; brine.renderOrder = 3; jar.add(brine);
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; const pk = mesh(lumpy(1, 0.12, 9, 20, 14), phys('#5a8a2a', 0.45, { clearcoat: 0.5 }), { p: [Math.cos(a) * 1.5, 3.2 + rr(-0.4, 0.4), Math.sin(a) * 1.5], s: [0.6, 2.4, 0.6], r: [rr(-0.2, 0.2), 0, rr(-0.2, 0.2)] }); jar.add(pk); }
  jar.add(mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.9, 40), phys('#d8b040', 0.3, { metalness: 1 }), { p: [0, 8.0, 0], cast: true }));
  g.add(jar); g.add(contact(-3.0, -11.6, 6, 6, 0.35));
  const carton = new THREE.Group(); carton.position.set(11.4, 0, -6.8); carton.rotation.y = -0.4;
  const pulp = std('#b8b4aa', 0.95);
  carton.add(mesh(roundedBox(4.8, 2.2, 9.6, 0.25), pulp, { p: [0, 1.1, 0], cast: true }));
  carton.add(mesh(roundedBox(4.8, 0.3, 9.6, 0.15), pulp, { p: [-0.2, 3.4, -1.6], r: [0, 0, -1.1], cast: true }));
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) carton.add(mesh(new THREE.SphereGeometry(1, 24, 16), phys(i % 3 ? '#f6efe4' : '#e0b088', 0.55), { p: [s * 1.15, 2.6, -3.9 + i * 1.56], s: [0.95, 1.3, 0.95], cast: true }));
  g.add(carton); g.add(contact(11.4, -6.6, 7, 11, 0.4, 0.006, 0.4));
  const lemonC = canvas(256, 256, (x, w) => { x.fillStyle = '#fff2a0'; x.beginPath(); x.arc(w / 2, w / 2, w / 2, 0, TAU); x.fill(); x.fillStyle = '#ffe050'; for (let i = 0; i < 10; i++) { x.beginPath(); x.moveTo(w / 2, w / 2); x.arc(w / 2, w / 2, w / 2 - 16, i / 10 * TAU + 0.06, (i + 1) / 10 * TAU - 0.06); x.fill(); } x.fillStyle = '#fffbe0'; x.beginPath(); x.arc(w / 2, w / 2, 14, 0, TAU); x.fill(); });
  const lemon = new THREE.Group(); lemon.position.set(2.6, 0, -6.4);
  lemon.add(mesh(new THREE.SphereGeometry(1.9, 32, 16, 0, TAU, 0, Math.PI / 2), phys('#ffd21a', 0.55, { clearcoat: 0.3 }), { r: [Math.PI, 0, 0], p: [0, 1.9, 0], cast: true }));
  lemon.add(mesh(new THREE.CircleGeometry(1.9, 40), phys('#ffffff', 0.15, { map: ctex(lemonC), clearcoat: 1, clearcoatRoughness: 0.05 }), { r: [-Math.PI / 2, 0, 0], p: [0, 1.9, 0] }));
  lemon.rotation.set(0.7, -0.2, 0); lemon.position.y = 0.6; g.add(lemon); g.add(contact(2.6, -6.2, 4.5, 4.5, 0.4));
  const grapes = new THREE.Group(); grapes.position.set(-11.4, 0, -6);
  for (let i = 0; i < 16; i++) grapes.add(mesh(new THREE.SphereGeometry(0.58, 20, 14), phys('#5a1a7a', 0.18, { clearcoat: 1, sheen: 0.6, sheenColor: C('#c8a0ff') }), { p: [rr(-1.6, 1.6), 0.58 + (i > 10 ? 1.0 : 0), rr(-1.2, 1.2)], s: [1, 1.12, 1], cast: true }));
  grapes.add(mesh(tube([[0, 1.6, 0], [0.4, 2.2, 0], [0.9, 2.5, 0.2]], 0.09, 12, 6), std('#6a5a2a', 0.7)));
  g.add(grapes); g.add(contact(-11.4, -5.8, 5, 4, 0.45));
  const cheeseC = canvas(256, 256, (x, w, h) => { x.fillStyle = '#ffd84a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { x.fillStyle = '#e0b020'; x.beginPath(); x.arc(rr(0, w), rr(0, h), rr(6, 20), 0, TAU); x.fill(); } });
  const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.lineTo(5, 0); ws.lineTo(0, 3.2); ws.closePath();
  g.add(mesh(new THREE.ExtrudeGeometry(ws, { depth: 3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }), phys('#ffffff', 0.5, { map: ctex(cheeseC, [0.3, 0.3]) }), { p: [-15, 0.08, -10], r: [0, 0.3, 0], cast: true }));
  const butterC = canvas(256, 128, (x, w, h) => { x.fillStyle = '#fbf2d0'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a7ad8'; x.font = '900 40px sans-serif'; x.textAlign = 'center'; x.fillText('BUTTER', w / 2, 80); x.strokeStyle = '#d8c890'; x.lineWidth = 3; for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 10); x.stroke(); } });
  g.add(mesh(roundedBox(6.4, 1.6, 1.8, 0.15), phys('#ffffff', 0.6, { map: ctex(butterC) }), { p: [10.4, 0.8, -12.3], r: [0, -0.2, 0], cast: true }));
  // the hand that reaches in for a snack
  const skin = phys('#f2c4a4', 0.55, { sheen: 0.5, sheenColor: C('#ffd8c8') });
  const hand = new THREE.Group();
  const pj = canvas(256, 256, (x, w, h) => { x.fillStyle = '#7ab8ff'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff'; for (let i = 0; i < 8; i++) x.fillRect(i * 32, 0, 12, h); });
  hand.add(mesh(new THREE.CylinderGeometry(2.3, 2.5, 14, 32), std('#ffffff', 0.9, { map: ctex(pj, [3, 1]) }), { p: [0, 0, 9.5], r: [Math.PI / 2, 0, 0] }));
  hand.add(mesh(new THREE.CylinderGeometry(2.0, 2.1, 1.2, 32), skin, { p: [0, 0, 2.6], r: [Math.PI / 2, 0, 0] }));
  hand.add(mesh(roundedBox(4.4, 1.6, 4.6, 0.7, 3), skin, { p: [0, 0, 0] }));
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const k1 = new THREE.Group(); k1.position.set(-1.65 + i * 1.1, 0, -2.2); hand.add(k1);
    const len = [1.7, 2.0, 1.9, 1.5][i];
    k1.add(mesh(new THREE.CapsuleGeometry(0.5, len, 6, 12), skin, { p: [0, 0, -len / 2 - 0.2], r: [Math.PI / 2, 0, 0] }));
    const k2 = new THREE.Group(); k2.position.set(0, 0, -len - 0.5); k1.add(k2);
    k2.add(mesh(new THREE.CapsuleGeometry(0.46, len * 0.8, 6, 12), skin, { p: [0, 0, -len * 0.4 - 0.15], r: [Math.PI / 2, 0, 0] }));
    k2.add(mesh(new THREE.SphereGeometry(0.34, 12, 8), phys('#ffe6dc', 0.3), { p: [0, -0.28, -len * 0.75], s: [1, 0.4, 1.2] }));
    fingers.push([k1, k2]);
  }
  const thumb = new THREE.Group(); thumb.position.set(2.2, -0.2, -0.4); thumb.rotation.y = -0.9; hand.add(thumb);
  thumb.add(mesh(new THREE.CapsuleGeometry(0.58, 2.0, 6, 12), skin, { p: [0, 0, -1.3], r: [Math.PI / 2, 0, 0] }));
  hand.visible = false; g.add(hand);
  R.hand = { g: hand, fingers, thumb, targets: [lemon, grapes, milk], next: 0, t: -1 };
  R.door = { t: 0, period: 26, dark: 0 };

  R.rig = {
    hemi: ['#d4e6f4', '#7a90a0', 0.34],
    sun: { c: '#eef8ff', i: 2.0, p: [0, 4.6, BACK + 0.5], t: [0, 0, 4], box: [26, 14, 40], nb: 0.05 },
    fill: { c: '#ffd6a0', i: 0.55, p: [6, 8, 16] },
    rims: [['#9ad0ff', 0.7, [-12, 6, -8]], ['#d8f0ff', 0.5, [14, 4, -6]]],
  };
  R.env = { top: '#a8bccc', mid: '#c4d4e0', bot: '#9aacba', panels: [[[0, 3, -14], 16, 4, '#ffffff', 3], [[-12, 6, 0], 3, 10, '#eaf6ff', 1.4], [[12, 6, 0], 3, 10, '#eaf6ff', 1.4], [[0, 4, 14], 10, 6, '#ffe0b0', 1]] };
  R.look = { exposure: 0.7, bloomT: 1.4, bloomS: 0.26 };
  R.envDark = { top: '#04060a', mid: '#06080e', bot: '#05070a', panels: [[[0, 3, -14], 16, 4, '#1a2a3a', 0.6]] };
  R.fog = ['#a8bccc', 28, 110];
  R.ambient = (dt, fx) => {
    const lit = 1 - R.door.dark;
    if (Math.random() < dt * 9) fx.puffs.emit(rand(-14, 14), rand(0.1, 0.5), rand(-12, 1), rand(0.1, 0.3), rand(0.0, 0.05), rand(-0.05, 0.05), C('#ffffff').multiplyScalar(0.3 + 0.7 * lit), rand(0.9, 1.6), rand(4, 6), 0, 0.2, 0.6);
    if (lit > 0.5 && Math.random() < dt * 8) fx.sparks.emit(rand(-10, 10), rand(0.2, 4), rand(-12, 0), 0, rand(-0.03, 0.02), 0, C('#e8f8ff'), rand(0.02, 0.04), rand(2, 4), 0, 0);
  };
  R.dust = '#eef6ff'; R.music = 'fight2';
  R.tick.push((t, dt, M) => {
    // the door swings shut now and then: lights out, the bears glow
    const D = R.door; D.t += dt;
    const ph = D.t % D.period;
    const target = ph > 14 && ph < 20 ? 1 : 0;
    if (target && D.dark === 0) { sfx('doorShut'); M && M.shake(0.06); }
    if (!target && D.dark === 1) sfx('doorOpen');
    D.dark = target ? Math.min(1, D.dark + dt * 4) : Math.max(0, D.dark - dt * (ph < 20.6 ? 6 : 3));
    const flick = !target && ph > 20 && ph < 20.5 ? (Math.sin(t * 60) > 0 ? 0.35 : 1) : 1;
    const lit = (1 - D.dark) * flick;
    const L = R.L;
    L.sun.intensity = L.sun.userData.i0 * lit; L.fill.intensity = L.fill.userData.i0 * (0.05 + 0.95 * lit);
    L.hemi.intensity = L.hemi.userData.i0 * (0.08 + 0.92 * lit); for (const r of L.rims) r.intensity = r.userData.i0 * (0.15 + 0.85 * lit);
    ledM.color.setScalar(0.1 + 0.9 * lit); ledGlow.material.opacity = 0.55 * lit;
    R.bearGlow = D.dark;
    R.envBlend = D.dark;
    // the hand: after the door opens, someone reaches in for a snack
    const H = R.hand;
    if (ph > 21 && ph < 21 + dt * 1.5 && H.t < 0) { H.t = 0; H.target = H.targets[H.next++ % H.targets.length]; H.home = H.target.position.clone(); H.rot = H.target.rotation.clone(); }
    if (H.t >= 0) {
      H.t += dt; const T = H.t, tg = H.home;
      const isMilk = H.target === milk;
      const grabP = V3(tg.x, isMilk ? 7 : 2.6, tg.z + (isMilk ? 4.4 : 1.4));
      const start = V3(tg.x + 6, 16, 26), out = V3(tg.x + 3, 20, 28);
      let pos, curl = 0, carry = 0;
      if (T < 1.4) { const u = easeIO(T / 1.4); pos = start.clone().lerp(grabP, u); }
      else if (T < 1.9) { pos = grabP.clone(); curl = (T - 1.4) / 0.5; }
      else if (T < 3.4) { const u = easeIO((T - 1.9) / 1.5); pos = grabP.clone().lerp(out, u); curl = 1; carry = 1; }
      else if (T < 6.5) { pos = out; curl = 1; carry = 1; H.g.visible = false; }
      else if (T < 8.0) { const u = easeIO((T - 6.5) / 1.5); pos = out.clone().lerp(grabP, u); curl = 1; carry = 1; H.g.visible = true; }
      else if (T < 8.5) { pos = grabP; curl = 1 - (T - 8.0) / 0.5; }
      else if (T < 9.9) { const u = easeIO((T - 8.5) / 1.4); pos = grabP.clone().lerp(start, u); }
      else { H.t = -1; H.g.visible = false; H.target.position.copy(H.home); H.target.rotation.copy(H.rot); pos = start; }
      if (H.t >= 0) {
        if (T < 3.4 || T >= 6.5) H.g.visible = true;
        H.g.position.copy(pos); H.g.rotation.set(-0.55, 0, 0);
        for (const [a, b] of H.fingers) { a.rotation.x = -curl * 0.9; b.rotation.x = -curl * 1.1; }
        H.thumb.rotation.x = -curl * 0.6;
        if (carry) { H.target.position.set(pos.x, pos.y - (isMilk ? 7 : 2.6) + 0.3, pos.z - (isMilk ? 4.4 : 1.4)); H.target.rotation.x = H.rot.x + Math.sin(T * 3) * 0.1; }
        if (Math.abs(T - 1.5) < dt) sfx('squeeze');
        R.shadowDirty = true;
      }
    }
  });
}
function easeIO(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }

// =====================================================================
// TOP OF THE FRIDGE (Gummoth's lair)
// =====================================================================
function fridgeTop(g, R) {
  seed(83);
  const EDGE = -14;
  const top = canvas(1024, 1024, (x, w, h) => {
    x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h);
    noiseDots(x, w, h, 50000, '#b8b0a4', 0.05, 0.3, 0.8, 2.4);
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(170,160,148,${rr(0.04, 0.12)})`; blob(x, rr(0, w), rr(0, h), rr(30, 110), 0.5); x.fill(); }
    x.strokeStyle = 'rgba(250,248,244,0.95)'; x.lineWidth = 14; x.lineCap = 'round';
    x.beginPath(); x.moveTo(620, 420); x.bezierCurveTo(560, 330, 470, 400, 620, 520); x.bezierCurveTo(770, 400, 680, 330, 620, 420); x.stroke();
    x.beginPath(); x.moveTo(300, 700); x.lineTo(300, 800); x.moveTo(300, 750); x.lineTo(360, 750); x.moveTo(360, 700); x.lineTo(360, 800); x.moveTo(410, 700); x.lineTo(410, 800); x.stroke();
    x.strokeStyle = 'rgba(160,120,90,0.25)'; x.lineWidth = 8; x.beginPath(); x.arc(820, 760, 60, 0, TAU); x.stroke();
  });
  g.add(mesh(new THREE.PlaneGeometry(40, 26), floorMat(ctex(top), 0.62, 0.3, { env: 0.4 }), { r: [-Math.PI / 2, 0, 0], p: [0, 0, EDGE + 13], recv: true }));
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 40, 16), std('#f2efe8', 0.35), { r: [0, 0, Math.PI / 2], p: [0, -0.5, EDGE], recv: true }));
  g.add(mesh(new THREE.PlaneGeometry(40, 60), std('#e8e4dc', 0.4), { p: [0, -30.5, EDGE - 0.5] }));
  // the cabinets on either side of the fridge
  const oak = canvas(512, 1024, (x, w, h) => { x.fillStyle = '#6a4226'; x.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(${rr() < 0.5 ? '40,20,8' : '150,100,60'},${rr(0.08, 0.22)})`; x.lineWidth = rr(1, 3); x.beginPath(); const gx = rr(0, w); x.moveTo(gx, 0); for (let y = 0; y < h; y += 40) x.lineTo(gx + Math.sin(y * 0.008 + i) * 6, y); x.stroke(); } x.strokeStyle = '#3a2210'; x.lineWidth = 18; x.strokeRect(40, 40, w - 80, h - 80); });
  for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(1.2, 40, 30), std('#ffffff', 0.6, { map: ctex(oak) }), { p: [s * 20.6, 12, EDGE + 15] }));
  // the kitchen far below and beyond, at night
  const kitchen = soften(canvas(2048, 760, (x, w, h) => {
    const yRow = y => (40 - y) / 72 * h;
    x.fillStyle = '#2a2230'; x.fillRect(0, 0, w, h);
    const wall = x.createLinearGradient(0, yRow(40), 0, yRow(-32)); wall.addColorStop(0, '#1a141e'); wall.addColorStop(0.6, '#3a2a30'); wall.addColorStop(1, '#4a3428'); x.fillStyle = wall; x.fillRect(0, 0, w, h);
    const cabTop = yRow(8.5), cabBot = yRow(-10);
    for (let i = 0; i < 9; i++) {
      if (i === 5 || i === 6) continue;
      const cx = i * 230 + 10; x.fillStyle = '#7a4e2e'; x.fillRect(cx, cabTop, 220, cabBot - cabTop);
      x.strokeStyle = '#5a361e'; x.lineWidth = 10; x.strokeRect(cx + 22, cabTop + 22, 176, cabBot - cabTop - 44);
      x.fillStyle = '#d8b060'; x.beginPath(); x.arc(cx + (i % 2 ? 36 : 184), cabBot - 40, 8, 0, TAU); x.fill();
    }
    x.fillStyle = '#5a361e'; x.fillRect(0, cabTop - 26, w, 26);
    // window over the sink: night sky, moon, a tree
    const wx = 5 * 230 + 20, ww = 440, wy = yRow(9), wb = yRow(-13);
    const sky = x.createLinearGradient(0, wy, 0, wb); sky.addColorStop(0, '#0a1430'); sky.addColorStop(1, '#2a3a6a'); x.fillStyle = sky; x.fillRect(wx, wy, ww, wb - wy);
    for (let i = 0; i < 40; i++) { x.fillStyle = '#ffffff'; x.globalAlpha = rr(0.3, 1); x.fillRect(wx + rr(0, ww), wy + rr(0, (wb - wy) * 0.6), 2, 2); } x.globalAlpha = 1;
    x.fillStyle = '#f4f0d8'; x.beginPath(); x.arc(wx + ww * 0.7, wy + 70, 34, 0, TAU); x.fill();
    x.fillStyle = '#0a0a14'; for (let i = 0; i < 14; i++) { x.beginPath(); x.arc(wx + rr(0, ww * 0.45), wb - rr(20, 120), rr(30, 60), 0, TAU); x.fill(); }
    x.strokeStyle = '#e8e0d4'; x.lineWidth = 14; x.strokeRect(wx, wy, ww, wb - wy); x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wb); x.stroke();
    // the clock that always says 11:59
    const ccx = 3 * 230 + 120, ccy = yRow(15);
    x.fillStyle = '#f4efe6'; x.beginPath(); x.arc(ccx, ccy, 46, 0, TAU); x.fill(); x.strokeStyle = '#2a2018'; x.lineWidth = 6; x.stroke();
    x.lineWidth = 5; x.beginPath(); x.moveTo(ccx, ccy); x.lineTo(ccx - 3, ccy - 30); x.stroke(); x.lineWidth = 3; x.beginPath(); x.moveTo(ccx, ccy); x.lineTo(ccx - 4, ccy - 40); x.stroke();
    // backsplash glowing under the cabinets
    for (let i = 0; i < 40; i++) for (let j = 0; j < 6; j++) { x.fillStyle = (i + j) % 2 ? '#c8b8a0' : '#d8cab4'; x.fillRect(i * 52, cabBot + j * 26, 50, 24); }
    const ul = x.createLinearGradient(0, cabBot, 0, cabBot + 160); ul.addColorStop(0, 'rgba(255,200,120,0.8)'); ul.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = ul; x.fillRect(0, cabBot, w, 160);
    x.fillStyle = 'rgba(255,190,110,0.18)'; for (const px of [0.28, 0.5, 0.72]) { x.beginPath(); x.ellipse(w * px, yRow(-2), 180, 260, 0, 0, TAU); x.fill(); }
  }), 4);
  g.add(backdrop(kitchen, 210, 72, [0, 4, -96]));
  // three glass pendant lamps hanging over the island
  R.pendants = [];
  for (const [x, y, z] of [[-15, 9, -42], [0, 7.2, -38], [15, 9, -42]]) {
    const p = new THREE.Group(); p.position.set(x, y, z); g.add(p);
    p.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 40), basic('#1a1410'), { p: [0, 22, 0] }));
    p.add(mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.8, 16), phys('#c89a4a', 0.3, { metalness: 1 }), { p: [0, 2.2, 0] }));
    const shade = mesh(lathe([[0.5, 2.0], [1.6, 1.6], [3.0, 0.5], [3.6, -0.6], [3.7, -0.8]], 48), phys('#ffb860', 0.2, { transparent: true, opacity: 0.55, side: THREE.DoubleSide, emissive: C('#ff9a3a'), emissiveIntensity: 0.6, depthWrite: false }));
    shade.renderOrder = 4; p.add(shade);
    p.add(mesh(new THREE.SphereGeometry(0.75, 20, 14), basic('#fff2d0', { toneMapped: false }), { p: [0, 0.2, 0] }));
    p.add(glow('#ffcc80', 16, 0.65, { p: [0, -0.3, 0.5] }));
    p.add(glow('#ffe8c0', 5, 0.9, { p: [0, 0.1, 0.6] }));
    R.pendants.push(p);
  }
  // a monstera reaching up from far below
  const leafS = new THREE.Shape(); leafS.moveTo(0, 0); leafS.bezierCurveTo(2.6, 0.6, 3.4, 3.4, 0, 5.6); leafS.bezierCurveTo(-3.4, 3.4, -2.6, 0.6, 0, 0);
  for (let i = 0; i < 5; i++) { const hole = new THREE.Path(); const y = 1.4 + i * 0.75, s = i % 2 ? 1 : -1; hole.moveTo(s * 0.6, y); hole.lineTo(s * 2.1, y + 0.35); hole.lineTo(s * 2.0, y + 0.6); hole.lineTo(s * 0.6, y + 0.3); leafS.holes.push(hole); }
  const mleaf = new THREE.ShapeGeometry(leafS, 16);
  const mon = new THREE.Group(); mon.position.set(-19, -5, -24); mon.scale.setScalar(0.8); g.add(mon);
  for (const [rx, ry, rz, s, yy] of [[-0.6, 0.3, 0.4, 1.4, 0], [-0.3, -0.6, -0.3, 1.2, 1.5], [-0.8, 0.9, 0.2, 1.1, -1]]) {
    const lf = new THREE.Group(); lf.position.set(rr(-2, 2), yy, rr(-1, 1)); lf.rotation.set(rx, ry, rz); lf.scale.setScalar(s);
    lf.add(mesh(mleaf, phys('#2e7a3a', 0.35, { side: THREE.DoubleSide, clearcoat: 0.6, emissive: C('#0a2a10'), emissiveIntensity: 0.6 })));
    lf.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 12), std('#2a5a2a', 0.6), { p: [0, -6, 0] }));
    mon.add(lf);
  }
  R.tick.push(t => { mon.rotation.z = Math.sin(t * 0.5) * 0.03; });
  // the family cat asleep on top of the cabinets
  const cat = new THREE.Group(); cat.position.set(20, 7.4, -92); g.add(cat);
  const tabby = canvas(512, 256, (x, w, h) => { x.fillStyle = '#e8963a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { x.fillStyle = '#b8601a'; x.beginPath(); x.ellipse(i * 38 + 10, h / 2, 9, h, 0.2, 0, TAU); x.fill(); } });
  const catM = phys('#ffffff', 0.85, { map: ctex(tabby), sheen: 1, sheenColor: C('#ffd8a0') });
  const catBody = mesh(new THREE.SphereGeometry(5, 32, 20), catM, { s: [1.6, 0.85, 1], p: [0, 4.2, 0] }); cat.add(catBody);
  const catHead = new THREE.Group(); catHead.position.set(-6.5, 5.2, 1.5); cat.add(catHead);
  catHead.add(mesh(new THREE.SphereGeometry(3.2, 28, 18), catM, { s: [1.05, 0.92, 1] }));
  for (const s of [-1, 1]) catHead.add(mesh(new THREE.ConeGeometry(1.2, 2.2, 4), catM, { p: [s * 1.7, 2.7, -0.3], r: [0, 0, -s * 0.3] }));
  const catShut = [], catOpen = [];
  for (const s of [-1, 1]) {
    const lid = mesh(new THREE.CapsuleGeometry(0.12, 0.9, 4, 8), basic('#3a2010'), { p: [s * 1.2, 0.4, 2.95], r: [0, 0, Math.PI / 2 + s * 0.2] }); catHead.add(lid); catShut.push(lid);
    const ey = new THREE.Group(); ey.position.set(s * 1.2, 0.45, 2.85);
    ey.add(mesh(new THREE.SphereGeometry(0.62, 18, 12), basic('#b8ff4a', { toneMapped: false }), { s: [1, 1, 0.5] }));
    ey.add(mesh(new THREE.SphereGeometry(0.62, 14, 10), basic('#000000'), { s: [0.22, 0.95, 0.55], p: [0, 0, 0.05] }));
    ey.add(glow('#c8ff6a', 2.4, 0.6)); ey.visible = false; catHead.add(ey); catOpen.push(ey);
  }
  catHead.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), phys('#d8706a', 0.3), { p: [0, -0.4, 3.15] }));
  cat.add(mesh(tube([[5, 2, 2], [6, 1.6, 5], [2, 1.4, 6.5], [-3, 1.5, 5.8]], 1.0, 30, 10), catM));
  R.cat = { head: catHead, body: catBody, shut: catShut, open: catOpen, t: 0, awake: 0 };

  // the tipped-over candy jar spilling its treasure
  const jar = new THREE.Group(); jar.position.set(-13.4, 4.3, -8.8); jar.rotation.set(0, 0.2, -Math.PI / 2); g.add(jar);
  const jarG = mesh(lathe([[0, 0], [3.8, 0], [4.2, 0.4], [4.3, 8.6], [3.6, 9.5], [3.2, 10.0], [3.3, 10.4]], 64), glass({ opacity: 0.24, emissive: C('#3a2a20'), emissiveIntensity: 0.4 })); jarG.renderOrder = 4; jar.add(jarG);
  const rimM = phys('#e8f4ff', 0.05, { transparent: true, opacity: 0.6, clearcoat: 1, emissive: C('#ffd8a0'), emissiveIntensity: 0.35 });
  jar.add(mesh(new THREE.TorusGeometry(3.3, 0.18, 12, 64), rimM, { p: [0, 10.35, 0], r: [Math.PI / 2, 0, 0] }));
  jar.add(mesh(new THREE.TorusGeometry(4.25, 0.12, 10, 64), rimM, { p: [0, 0.3, 0], r: [Math.PI / 2, 0, 0] }));
  // the label runs along the jar, so its words read left to right while it lies on its side
  const labelC = canvas(320, 1024, (x, w, h) => { x.fillStyle = '#fff4e0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c81e3a'; x.lineWidth = 14; x.strokeRect(10, 10, w - 20, h - 20); x.save(); x.translate(w / 2, h / 2); x.rotate(-Math.PI / 2); x.fillStyle = '#c81e3a'; x.font = '900 150px "Lilita One", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('CANDY', 0, 8); x.restore(); for (let i = 0; i < 2; i++) { x.fillStyle = '#ffb0c0'; x.beginPath(); x.arc(w / 2, i ? h - 90 : 90, 44, 0, TAU); x.fill(); } });
  const labelT = ctex(labelC);
  jar.add(mesh(new THREE.CylinderGeometry(4.36, 4.36, 6.2, 64, 1, true, -0.55, 1.1), std('#ffffff', 0.7, { map: labelT, emissiveMap: labelT, emissive: C('#ffffff'), emissiveIntensity: 0.2, side: THREE.DoubleSide }), { p: [0, 4.6, 0] }));
  const inside = []; const candyCols = ['#ff4f7a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff', '#ff9a3a', '#ffffff'];
  for (let i = 0; i < 70; i++) { const a = rr(-Math.PI * 0.45, Math.PI * 0.45), r = rr(1.2, 3.6); inside.push({ p: [Math.cos(a) * r, rr(0.6, 9), Math.sin(a) * r * 0.9], r: [rr(0, 6), rr(0, 6), 0], s: rr(0.42, 0.6), c: pick(candyCols) }); }
  jar.add(instanced(new THREE.SphereGeometry(1, 12, 8), selfLit(phys('#ffffff', 0.15, { clearcoat: 1 }), 0.35), inside));
  g.add(mesh(lathe([[0, 0.5], [2.5, 0.45], [3.6, 0.1], [3.7, 0], [0, 0]], 48), glass({ opacity: 0.2 }), { p: [-5.4, 0.02, -13.6], r: [0.2, 0, 0.1] }));
  g.add(contact(-8.6, -8.8, 13, 9, 0.45));
  const spill = []; const beans = []; const wraps = [];
  for (let i = 0; i < 46; i++) { const u = Math.pow(rr(), 0.7); const x = -2.6 + u * 7.2 + rr(-1, 1), z = -8.8 + rr(-2.2, 2.2) + u * 1.8; const k = rr(); if (k < 0.45) spill.push({ p: [x, 0.5, z], s: rr(0.42, 0.55), c: pick(candyCols) }); else if (k < 0.8) beans.push({ p: [x, 0.24, z], r: [Math.PI / 2, 0, rr(0, 6)], s: [1, 1, 1], c: pick(candyCols) }); else wraps.push({ p: [x, 0.35, z], r: [0, rr(0, 6), 0], c: pick(['#ffd34f', '#ff4f7a', '#5ad1ff', '#c890ff']) }); }
  g.add(instanced(new THREE.SphereGeometry(1, 20, 14), selfLit(phys('#ffffff', 0.12, { clearcoat: 1 }), 0.3), spill, { cast: true }));
  g.add(instanced(new THREE.CapsuleGeometry(0.24, 0.32, 6, 12), selfLit(phys('#ffffff', 0.2, { clearcoat: 1 }), 0.3), beans, { cast: true }));
  const wrapG = new THREE.SphereGeometry(0.42, 16, 10); wrapG.scale(1.3, 0.75, 0.75);
  g.add(instanced(wrapG, phys('#ffffff', 0.2, { metalness: 0.6, iridescence: 0.5 }), wraps, { cast: true }));
  const bowG = new THREE.ConeGeometry(0.38, 0.55, 8); bowG.rotateZ(Math.PI / 2);
  const bows = []; for (const w of wraps) for (const s of [-1, 1]) bows.push({ p: [w.p[0] + Math.cos(w.r[1]) * s * 0.75, 0.35, w.p[2] - Math.sin(w.r[1]) * s * 0.75], r: [0, w.r[1] + (s > 0 ? Math.PI : 0), 0], c: w.c });
  g.add(instanced(bowG, phys('#ffffff', 0.2, { metalness: 0.6 }), bows));
  // sour gummy worms, two colours each, flopped over the edge of the spill
  const wormCols = [['#ff4f7a', '#5ad1ff'], ['#9cff6a', '#ffd34f'], ['#ffd34f', '#ff4f7a'], ['#c890ff', '#9cff6a']];
  for (let i = 0; i < 4; i++) {
    const x0 = -2.6 + i * 2.3, z0 = -6.4 - (i % 2) * 2.2, pts = [];
    for (let k = 0; k <= 8; k++) pts.push([x0 + k * 0.42, 0.2 + 0.04 * Math.sin(k), z0 + Math.sin(k * 0.9 + i) * 0.45]);
    const geo = tube(pts, 0.17, 60, 10);
    const col = []; const pp = geo.attributes.position; const [c1, c2] = wormCols[i].map(C);
    for (let k = 0; k < pp.count; k++) { const u = (pp.getX(k) - x0) / 3.4; const c = u < 0.5 ? c1 : c2; col.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const wm = selfLit(phys('#ffffff', 0.55, { vertexColors: true, sheen: 1, sheenColor: C('#ffffff') }), 0.25);
    g.add(mesh(geo, wm, { cast: true }));
    g.add(mesh(new THREE.SphereGeometry(0.17, 12, 8), phys(wormCols[i][0], 0.5), { p: pts[0] }));
    g.add(mesh(new THREE.SphereGeometry(0.17, 12, 8), phys(wormCols[i][1], 0.5), { p: pts[8] }));
  }
  const lolly = new THREE.Group(); lolly.position.set(-1.6, 0.15, -11.8); lolly.rotation.set(-Math.PI / 2, 0, 0.6); g.add(lolly);
  const lc = canvas(256, 256, (x, w) => { for (let i = 0; i < 24; i++) { x.fillStyle = i % 2 ? '#ff4f7a' : '#ffffff'; x.beginPath(); x.moveTo(w / 2, w / 2); x.arc(w / 2, w / 2, w / 2, i / 24 * TAU + i * 0.08, (i + 1) / 24 * TAU + i * 0.08); x.fill(); } });
  lolly.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.4, 40), [phys('#ff4f7a', 0.2, { clearcoat: 1 }), phys('#ffffff', 0.1, { map: ctex(lc), clearcoat: 1 }), phys('#ffffff', 0.1, { map: ctex(lc), clearcoat: 1 })], { r: [Math.PI / 2, 0, 0], cast: true }));
  lolly.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 10), std('#f8f4ec', 0.6), { p: [0, -4, 0], cast: true }));
  // a cereal box tower
  const cer = canvas(1024, 1024, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd23a'); gr.addColorStop(1, '#ff9a1a'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(w * 0.55, h * 0.72, 260, 0, TAU); x.fill();
    x.fillStyle = '#ffeec8'; x.beginPath(); x.ellipse(w * 0.55, h * 0.72, 240, 120, 0, 0, TAU); x.fill();
    const lc2 = ['#ff4f7a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff', '#ff9a3a'];
    for (let i = 0; i < 30; i++) { x.strokeStyle = pick(lc2); x.lineWidth = 16; x.beginPath(); x.arc(w * 0.55 + rr(-190, 190), h * 0.7 + rr(-70, 50), 22, 0, TAU); x.stroke(); }
    x.fillStyle = '#ffd23a'; x.beginPath(); x.ellipse(w * 0.25, h * 0.55, 90, 70, 0, 0, TAU); x.fill(); x.fillStyle = '#2a1a10'; for (let i = 0; i < 3; i++) x.fillRect(w * 0.25 - 80 + i * 55, h * 0.55 - 40, 22, 80);
    x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.ellipse(w * 0.22, h * 0.47, 50, 26, -0.4, 0, TAU); x.ellipse(w * 0.3, h * 0.46, 50, 26, 0.4, 0, TAU); x.fill();
    x.fillStyle = '#d81e3a'; x.font = '900 190px "Lilita One", sans-serif'; x.textAlign = 'center'; x.fillText('HONEY', w / 2, 230); x.fillText('NUBS', w / 2, 410);
    x.strokeStyle = '#ffffff'; x.lineWidth = 10; x.strokeText('HONEY', w / 2, 230); x.strokeText('NUBS', w / 2, 410);
  });
  const cerT = ctex(cer);
  const cereal = mesh(new THREE.BoxGeometry(10, 15, 3.6), [std('#ff9a1a', 0.7), std('#ff9a1a', 0.7), std('#ffd23a', 0.7), std('#ffd23a', 0.7), std('#ffffff', 0.6, { map: cerT, emissiveMap: cerT, emissive: C('#ffffff'), emissiveIntensity: 0.22 }), std('#ffb21a', 0.7)], { p: [11, 7.5, -10.4], r: [0, -0.18, 0], cast: true });
  g.add(cereal); g.add(contact(11, -10.2, 12, 6, 0.5));
  const loops = []; for (let i = 0; i < 18; i++) loops.push({ p: [rr(4, 15), 0.16, rr(-8, -4)], r: [Math.PI / 2 + rr(-0.3, 0.3), 0, rr(0, 6)], c: pick(['#ff4f7a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff', '#ff9a3a']) });
  g.add(instanced(new THREE.TorusGeometry(0.32, 0.15, 10, 20), std('#ffffff', 0.7), loops, { cast: true }));
  // a flashlight somebody left on, shining across the candy
  const fl = new THREE.Group(); fl.position.set(6.2, 0.47, -7); fl.rotation.y = 2.95; fl.scale.setScalar(0.75); g.add(fl);
  fl.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 4.2, 24), selfLit(phys('#ffd23a', 0.35), 0.25), { r: [0, 0, Math.PI / 2], cast: true }));
  fl.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.8, 24), phys('#1a1a1e', 0.5), { r: [0, 0, Math.PI / 2], p: [-0.6, 0, 0] }));
  fl.add(mesh(new THREE.CylinderGeometry(0.85, 0.58, 1.3, 24), phys('#2a2a30', 0.3, { metalness: 0.5 }), { r: [0, 0, Math.PI / 2], p: [2.6, 0, 0], cast: true }));
  fl.add(mesh(new THREE.CircleGeometry(0.75, 24), basic('#fff8e0', { toneMapped: false }), { r: [0, Math.PI / 2, 0], p: [3.26, 0, 0] }));
  fl.add(glow('#fff2c8', 3.5, 0.9, { p: [3.5, 0, 0] }));
  const flBeam = beam(V3(3.3, 0, 0), V3(16, -0.4, 0), 0.6, 4.5, '#fff0c8', 0.1); fl.add(flBeam);
  const flSpot = new THREE.SpotLight(C('#fff0d0'), 9, 26, 0.36, 0.5, 1); flSpot.position.set(3.4, 0.1, 0); flSpot.target.position.set(14, -0.6, 0); fl.add(flSpot, flSpot.target);
  g.add(contact(6.2, -7, 4.5, 1.6, 0.5, 0.006, 0.2));
  // keys on a ring, and a rubber duck
  const keyS = new THREE.Shape(); keyS.absarc(0, 0, 0.7, 0, TAU, false); const kh = new THREE.Path(); kh.absarc(0, 0.25, 0.22, 0, TAU, true); keyS.holes.push(kh);
  const blade = new THREE.Shape(); blade.moveTo(0.5, -0.22); blade.lineTo(3.2, -0.22); blade.lineTo(3.2, 0.05); blade.lineTo(2.9, 0.05); blade.lineTo(2.8, 0.25); blade.lineTo(2.5, 0.05); blade.lineTo(2.3, 0.25); blade.lineTo(2.0, 0.05); blade.lineTo(0.5, 0.22); blade.closePath();
  const keys = new THREE.Group(); keys.position.set(-3, 0.06, -10.6); g.add(keys);
  keys.add(mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 32), phys('#c8c8d0', 0.2, { metalness: 1 }), { r: [-Math.PI / 2, 0, 0] }));
  [[0.3, '#c8c8d0'], [1.6, '#d8b060'], [3.0, '#c8c8d0']].forEach(([a, c]) => { const k = new THREE.Group(); k.rotation.y = a; const km = phys(c, 0.25, { metalness: 1 }); k.add(mesh(new THREE.ExtrudeGeometry(keyS, { depth: 0.08, bevelEnabled: false }), km, { r: [-Math.PI / 2, 0, 0], p: [1.5, 0, 0], cast: true })); k.add(mesh(new THREE.ExtrudeGeometry(blade, { depth: 0.08, bevelEnabled: false }), km, { r: [-Math.PI / 2, 0, 0], p: [1.5, 0, 0], cast: true })); keys.add(k); });
  const duck = new THREE.Group(); duck.position.set(3.2, 0, -13); duck.rotation.y = 0.9; duck.scale.setScalar(0.85); g.add(duck);
  const duckM = selfLit(phys('#ffd21a', 0.3, { clearcoat: 0.8 }), 0.35);
  duck.add(mesh(new THREE.SphereGeometry(1.6, 28, 18), duckM, { p: [0, 1.3, 0], s: [1.35, 0.85, 1], cast: true }));
  duck.add(mesh(new THREE.SphereGeometry(1.05, 24, 16), duckM, { p: [1.2, 2.7, 0], cast: true }));
  duck.add(mesh(new THREE.SphereGeometry(0.5, 16, 10), phys('#ff8a1a', 0.3), { p: [2.2, 2.55, 0], s: [1.4, 0.45, 0.9] }));
  for (const s of [-1, 1]) duck.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), basic('#000000'), { p: [1.75, 3.0, s * 0.55] }));
  duck.add(mesh(new THREE.ConeGeometry(0.7, 1.2, 12), duckM, { p: [-2.1, 1.9, 0], r: [0, 0, 0.9] }));
  g.add(contact(3.2, -13, 4.5, 3, 0.45));

  R.rig = {
    hemi: ['#4a4060', '#14100e', 0.38],
    sun: { c: '#ffc890', i: 2.5, p: [0, 7, -38], t: [0, 0, -4], box: [24, 14, 70] },
    fill: { c: '#8a94c4', i: 1.0, p: [0, 10, 14] },
    rims: [['#8aa8ff', 1.1, [-30, 14, -50]], ['#ffb070', 0.8, [16, 8, -40]]],
  };
  R.env = { top: '#120e16', mid: '#2a1e24', bot: '#1a1210', panels: [[[0, 3, -14], 5, 5, '#ffd8a0', 5], [[-9, 4, -12], 4, 4, '#ffd8a0', 3], [[9, 4, -12], 4, 4, '#ffd8a0', 3], [[-14, 8, -6], 3, 3, '#8aa8ff', 1.5], [[0, 8, 10], 10, 4, '#3a4058', 1]] };
  R.fog = ['#120c12', 45, 180];
  R.ambient = (dt, fx) => { if (Math.random() < dt * 16) fx.sparks.emit(rand(-10, 10), rand(0.4, 6), rand(-14, 0), rand(-0.04, 0.04), rand(-0.03, 0.04), 0, C('#ffd8a0'), rand(0.022, 0.045), rand(3, 5), 0, 0); };
  R.dust = '#d6cec4'; R.music = 'boss'; R.look = { exposure: 1.0, bloomT: 1.0, bloomS: 0.38 };
  R.tick.push((t, dt, M) => {
    R.pendants.forEach((p, i) => { p.rotation.z = Math.sin(t * 0.4 + i) * 0.015; });
    flBeam.material.uniforms.uT.value = t;
    // the cat wakes up for a look now and then (and after a knockout)
    const K = R.cat; K.t -= dt;
    if (K.t < 0) { K.awake = K.awake ? 0 : 1; K.t = K.awake ? rand(3, 5) : rand(14, 24); if (K.awake && Math.random() < 0.6) sfx('meow'); }
    if (M && (M.phase === 'ko' || M.phase === 'nubem') && !K.awake) { K.awake = 1; K.t = 4; }
    const blink = K.awake && (t % 3.1) < 0.12;
    for (const s of K.shut) s.visible = !K.awake || blink; for (const o of K.open) o.visible = K.awake && !blink;
    K.body.scale.y = 0.85 * (1 + Math.sin(t * 1.4) * 0.02);
    K.head.rotation.y = K.awake ? Math.sin(t * 0.8) * 0.25 : 0; K.head.rotation.z = K.awake ? 0.12 : 0;
  });
}

// =====================================================================
// LICORICE BRIDGE (the secret one, from the first build)
// =====================================================================
function licoriceBridge(g, R) {
  seed(97);
  const skyC = canvas(16, 512, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#060a24'); gr.addColorStop(0.55, '#16345c'); gr.addColorStop(1, '#3a7a8a'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
  g.add(mesh(new THREE.SphereGeometry(95, 32, 16), new THREE.MeshBasicMaterial({ map: ctex(skyC), side: THREE.BackSide, fog: false }), {}));
  const starsC = canvas(2048, 512, (x, w, h) => { for (let i = 0; i < 900; i++) { x.fillStyle = '#ffffff'; x.globalAlpha = rr(0.3, 1); const s = rr(1, 3); x.fillRect(rr(0, w), rr(0, h * 0.8), s, s); } x.globalAlpha = 1; x.fillStyle = '#eef4ff'; x.beginPath(); x.arc(w * 0.68, h * 0.32, 46, 0, TAU); x.fill(); });
  g.add(backdrop(starsC, 220, 55, [0, 30, -88], { transparent: true }));
  g.add(glow('#cfe0ff', 26, 0.4, { p: [27, 32, -86] }));
  for (const [z, hgt, col] of [[-60, 9, '#0c1a34'], [-42, 5, '#0a1428']]) {
    const s = new THREE.Shape(); s.moveTo(-90, -4); for (let i = 0; i <= 60; i++) { const x = -90 + i * 3; s.lineTo(x, hgt * (0.55 + 0.45 * Math.sin(i * 0.35 + z) * Math.sin(i * 0.13 + z * 2)) + rr(0, 1.2)); } s.lineTo(90, -4);
    g.add(mesh(new THREE.ShapeGeometry(s), basic(col, { fog: true }), { p: [0, -3, z] }));
  }
  g.add(mesh(new THREE.PlaneGeometry(200, 40), basic('#6a2a10'), { r: [-Math.PI / 2, 0, 0], p: [0, -6, -30] }));
  const plankT = canvas(512, 256, (x, w, h) => { const n = 8, s = w / n; for (let i = 0; i < n; i++) { const red = i % 2 === 0; const grd = x.createLinearGradient(i * s, 0, i * s + s, 0); grd.addColorStop(0, red ? '#a3102a' : '#1a0c12'); grd.addColorStop(0.5, red ? '#e0304a' : '#3a1a24'); grd.addColorStop(1, red ? '#8a0a20' : '#120810'); x.fillStyle = grd; x.fillRect(i * s + 2, 0, s - 4, h); } });
  const deckTop = std('#ffffff', 0.55, { map: ctex(plankT, [24, 3]), envMapIntensity: 0.6 });
  g.add(mesh(new THREE.BoxGeometry(60, 0.3, 4.4), [std('#2a0a14', 0.5), std('#2a0a14', 0.5), deckTop, std('#2a0a14', 0.5), std('#2a0a14', 0.5), std('#2a0a14', 0.5)], { p: [0, -0.15, -0.6], recv: true }));
  const pts = []; for (let i = 0; i <= 60; i++) { const x = -30 + i; pts.push([x, 1.25 - 0.25 * Math.sin((i % 4) / 4 * Math.PI), -2.6]); }
  g.add(mesh(tube(pts, 0.07, 400, 8), phys('#d0203a', 0.3, { clearcoat: 1 }), { cast: true }));
  for (let i = -14; i <= 14; i++) g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.4, 12), phys('#1a0a10', 0.35, { clearcoat: 1 }), { p: [i * 2, 0.6, -2.6], cast: true }));
  const lanterns = []; for (let i = 0; i < 14; i++) { const l = glow(i % 3 ? '#ffb060' : '#ff7090', rr(0.6, 1.4), 0.9, { p: [rr(-25, 25), rr(2, 12), rr(-30, -10)] }); g.add(l); lanterns.push({ l, base: l.position.clone(), ph: rr(0, 6), sp: rr(0.2, 0.5) }); }
  R.tick.push(t => { for (const f of lanterns) { f.l.position.y = f.base.y + ((t * f.sp + f.ph) % 6) - 1; f.l.position.x = f.base.x + Math.sin(t * 0.4 + f.ph); } });
  R.rig = {
    hemi: ['#8090c8', '#401020', 0.4],
    sun: { c: '#e8f0ff', i: 2.2, p: [8, 14, -30], t: [0, 0, -1], box: [30, 8, 70] },
    fill: { c: '#e8f0ff', i: 1.4, p: [3, 5, 6] },
    rims: [['#ff9a40', 2.8, [-2, 4.5, -5]], ['#80c0ff', 2.2, [4, 4.5, -4]]],
  };
  R.env = { top: '#060a24', mid: '#16345c', bot: '#3a7a8a', panels: [[[1, 9, 4], 7, 3, '#ffffff', 3], [[0, 3, -9], 9, 3, '#ff9a40', 1.4], [[-8, 3, 5], 3, 5, '#a0c8ff', 2.2]] };
  R.fog = ['#16345c', 25, 90];
  R.ambient = (dt, fx) => { if (Math.random() < dt * 10) fx.glows.emit(rand(-8, 8), -1, rand(-6, -2), rand(-0.1, 0.1), rand(0.3, 0.7), 0, C('#ff9a40'), rand(0.05, 0.1), rand(3, 5), 0, 0); };
  R.dust = '#806070'; R.music = 'fight2';
}

// =====================================================================
export const STAGES = [
  { key: 'couch', name: 'UNDER THE COUCH', blurb: 'Dust bunnies, a lost sock, and something patrolling the rug.', build: underCouch, thumb: ['#0a0d16', '#2a3a6a', '#a8c8ff'] },
  { key: 'theater', name: 'THE MOVIE THEATER', blurb: 'Sticky floors. Giant popcorn. The movie is still playing.', build: theater, thumb: ['#0e070c', '#4a0f1e', '#ff9a6a'] },
  { key: 'sill', name: 'THE WINDOWSILL', blurb: 'Morning sun, a goldfish with opinions, and a very nosy bird.', build: windowsill, thumb: ['#9ad4ff', '#f3f0ea', '#ff7414'] },
  { key: 'cake', name: 'THE BIRTHDAY CAKE', blurb: 'Candles, sprinkles, and a wish that comes with a hurricane.', build: birthdayCake, thumb: ['#f6b4ca', '#ffd8c4', '#ffa040'] },
  { key: 'fridge', name: 'INSIDE THE FRIDGE', blurb: 'Freezing, bright, and the door keeps closing.', build: insideFridge, thumb: ['#d4e4ee', '#ffffff', '#1a62d8'] },
  { key: 'fridgetop', name: 'TOP OF THE FRIDGE', blurb: "Gummoth's lair, way up where the candy jar hides.", build: fridgeTop, thumb: ['#120c12', '#3a2a30', '#ffc890'] },
];
export const SECRET_STAGES = [
  { key: 'bridge', name: 'LICORICE BRIDGE', blurb: 'The secret stage. Lanterns over a caramel river.', build: licoriceBridge, thumb: ['#060a24', '#16345c', '#ff9a3a'], secret: true },
];
export const STAGE_BY_KEY = Object.fromEntries([...STAGES, ...SECRET_STAGES].map(s => [s.key, s]));
export const ARCADE_STAGES = ['couch', 'theater', 'sill', 'cake', 'fridge', 'fridgetop'];

export function buildStage(key, renderer) {
  const def = STAGE_BY_KEY[key] || STAGES[0];
  const g = new THREE.Group();
  const R = { key: def.key, name: def.name, group: g, tick: [], wind: 0, bearGlow: 0, envBlend: 0, shadowDirty: false };
  def.build(g, R);
  if (R.dome !== false) g.add(mesh(new THREE.SphereGeometry(160, 32, 16), new THREE.MeshBasicMaterial({ color: C(R.dome || (R.fog && R.fog[0]) || '#101010'), side: THREE.BackSide, fog: false })));
  R.L = rig(g, R.rig);
  R.envRT = makeEnv(renderer, R.env);
  if (R.envDark) R.envDarkRT = makeEnv(renderer, R.envDark);
  R.slowAt = x => { if (!R.slowZones) return 1; for (const [a, b] of R.slowZones) if (x > a && x < b) return 0.55; return 1; };
  R.update = (t, dt, M) => { for (const f of R.tick) f(t, dt, M); };
  R.dispose = () => {
    g.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { if (m.map) m.map.dispose(); m.dispose(); } }
      if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose();
    });
    R.envRT.dispose(); if (R.envDarkRT) R.envDarkRT.dispose();
  };
  return R;
}
