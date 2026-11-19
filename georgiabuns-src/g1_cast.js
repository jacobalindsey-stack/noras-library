/* ================= Georgia Buns — the wider cast =================
   Dexter, Pontoon, Seven, Elli, farm and marsh critters, the disco snails,
   quest items for every day, golden carrots, and the cameo stickers. */

function palShift(list) { const p = palette(list.slice(1).concat([list[0]])); p.OL = list.length; return p; }
function goldFrames() {
  return carrotFrames().map(c => { const o = mkC(c.width, c.height), x = o.getContext('2d'); x.drawImage(c, 0, 0); const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255; if (l < .18) continue; d[i] = 255; d[i + 1] = Math.round(150 + l * 105); d[i + 2] = Math.round(40 + l * 120); } x.putImageData(id, 0, 0); return o; });
}
const PAL_X = palette(['#2a140c', '#ffb347', '#e0782a', '#ffd9a0', '#3fb04a', '#237a2e', '#f0e6cc', '#c8b48c', '#ff8a1c', '#c85a10', '#ffe0b0', '#7ad050', '#4a8a2a', '#b8723a', '#8a4a20', '#ffffff', '#e8e0f8']);
function itemSprites() {
  const mk = (fn, glint) => { const s = new Spr(16, 14); fn(s); if (glint) { s.set(5, 1, 16); s.set(4, 2, 16); s.set(6, 2, 16); s.set(5, 3, 16); s.set(5, 2, 16); } return s.outline(1).canvas(PAL_X); };
  const peach = s => { s.ell(8, 8, 5.5, 5, [2, 3, 4]); s.line(8, 4, 8, 11, 3); s.ell(11, 3, 2.5, 1.2, 5, -.5); s.set(8, 2, 14); };
  const sand = s => { s.ell(8, 7, 6, 5.5, [7, 7, 7]); s.ell(8, 7, 5, 4.5, 7); for (let k = 0; k < 5; k++) { const a = k * 1.256 - 1.57; s.line(8, 7, 8 + Math.cos(a) * 3, 7 + Math.sin(a) * 3, 8); } s.ell(6, 5, 1.5, 1, 11); };
  const box = s => { s.rect(2, 4, 12, 9, 9); s.rect(2, 4, 12, 2, 10); s.rect(3, 6, 10, 6, 9); s.rect(4, 7, 8, 4, 9); s.rect(2, 4, 12, 1, 9); s.line(5, 4, 7, 1, 15); s.line(11, 4, 9, 1, 15); s.rect(7, 4, 2, 9, 15); };
  const veg = s => { s.ell(6, 9, 4, 4, [12, 13, 5]); s.ell(11, 10, 3.5, 3, [14, 15, 14]); s.ell(5, 4, 1, 3, 5, -.4); s.ell(8, 5, 1, 3, 12, .3); };
  const snow = s => { s.sphere(8, 8, 5.5, 5.5, [7, 7, 16, 16]); s.set(6, 6, 16); };
  return { snowball: [mk(snow), mk(snow, 1)], rock: [A.rock, A.rockG], peach: [mk(peach), mk(peach, 1)], sand: [mk(sand), mk(sand, 1)], box: [mk(box), mk(box, 1)], veg: [mk(veg), mk(veg, 1)] };
}
function sevenFrames() {
  const pal = palShift(['#1e0e06', '#8a4a24', '#5e3014', '#b06a3a', '#2a1a10', '#f4e2bd', '#1a0e0a', '#ffffff', '#d8b080']);
  const mk = (ph, stand) => {
    const s = new Spr(70, 54);
    const legs = stand ? [[22, 0], [28, 0], [46, 0], [52, 0]] : [[20, Math.sin(ph) * .7], [28, -Math.sin(ph) * .7], [45, Math.sin(ph + 1.6) * .7], [52, -Math.sin(ph + 1.6) * .7]];
    for (const [x, a] of legs.slice(0, 2)) s.ell(x + Math.sin(a) * 3, 41, 2.8, 9, [2, 2, 1], a);
    s.ell(8, 24, 4, 10, [4, 4, 4], stand ? .5 : 1.1); // tail
    s.ell(36, 28, 21, 10, [1, 2, 3]);
    for (const [x, a] of legs.slice(2)) s.ell(x + Math.sin(a) * 3, 41, 2.8, 9, [1, 2, 3], a);
    for (const [x, a] of legs) s.ell(x + Math.sin(a) * 6, 50, 3, 2, 4);
    s.ell(55, 17, 6, 11, [1, 2, 3], .6); s.ell(63, 9, 7, 4.5, [1, 2, 3], .35); s.ell(68, 11, 3, 3, 3);
    for (let i = 0; i < 6; i++) s.ell(50 + i * 2.2, 8 + i * 1.6, 2.4, 3.4, 4, .6);
    s.set(61, 7, 6); s.set(61, 6, 7); s.set(58, 2, 1); s.set(59, 1, 1); s.set(59, 2, 1);
    s.ell(60, 8, 1.4, 1.2, 8); // blaze
    return s.outline(pal.OL).canvas(pal);
  };
  return { run: [0, 1, 2, 3].map(i => mk(i * Math.PI / 2)), stand: [mk(0, 1)] };
}
function elliFrames() {
  const pal = palShift(['#2a140c', '#f0c8a0', '#d8a880', '#3a6aa8', '#2a4a80', '#f6e2a0', '#c8a050', '#ffffff', '#7a4a2a', '#e86a8a', '#1a0e0a']);
  return [0, 1].map(i => { const s = new Spr(28, 46);
    s.rect(10, 34, 3, 11, 4); s.rect(15, 34, 3, 11, 4); s.rect(9, 44, 5, 2, 8); s.rect(14, 44, 5, 2, 8);
    s.rect(8, 20, 12, 16, 3); s.rect(10, 22, 8, 6, 4); s.rect(9, 18, 10, 4, 9);
    s.ell(14, 12, 5, 5.5, [1, 2, 1]); s.rect(9, 12, 2, 8, 8); s.rect(17, 12, 2, 8, 8);
    s.ell(14, 7, 10, 2.4, [5, 6, 5]); s.ell(14, 5, 5.5, 3.5, [5, 6, 5]); s.rect(9, 6, 10, 1, 9);
    s.set(12, 12, 10); s.set(16, 12, 10); s.line(12, 15, 16, 15, 9);
    if (i) { s.ell(23, 13, 1.8, 5, [1, 2, 1], -.3); } else { s.ell(21, 24, 1.8, 5, [1, 2, 1], -.2); }
    s.ell(6, 26, 1.8, 5, [1, 2, 1], .2);
    return s.outline(pal.OL).canvas(pal); });
}
function cowFrames() {
  const pal = palShift(['#1e120a', '#f4f0e8', '#c8c0b4', '#1e1e22', '#e8a0a0', '#1a0e0a', '#d8b070']);
  return [0, 1].map(i => { const s = new Spr(60, 40), sq = i ? 3 : 0;
    for (const x of [12, 18, 40, 46]) s.rect(x, 26, 4, 12 - sq, 1);
    s.ell(30, 20 + sq, 20, 10 - sq / 2, [1, 2, 1]); srand(4); for (let k = 0; k < 5; k++) s.ell(18 + rnd() * 24, 16 + rnd() * 8 + sq, 3 + rnd() * 4, 2.5 + rnd() * 3, 3);
    s.ell(51, 15 + sq, 6, 6, [1, 2, 1]); s.ell(55, 19 + sq, 4, 3, 4); s.set(53, 12 + sq, 5); s.ell(46, 9 + sq, 2.5, 1.2, 6, -.4); s.ell(56, 9 + sq, 2.5, 1.2, 6, .4);
    s.ell(30, 29 + sq, 4, 2, 4); s.line(9, 16 + sq, 6, 24, 1); s.set(6, 25, 3);
    return s.outline(pal.OL).canvas(pal); });
}
function chickFrames() {
  const pal = palShift(['#2a140c', '#ffffff', '#e0d8c8', '#e03030', '#f6c645']);
  return [0, 1].map(i => { const s = new Spr(14, 14); s.ell(7, 8, 4.5, 3.5, [1, 2, 1]); s.ell(10, 5, 2.5, 2.5, 1); s.set(11, 2, 3); s.set(12, 3, 3); s.set(13, 5, 4); s.set(10, 4, 0); s.ell(4, i ? 4 : 7, 3, 2, 2, i ? -.8 : 0); s.line(6, 11, 6, 13, 4); s.line(8, 11, 8, 13, 4); return s.outline(pal.OL).canvas(pal); });
}
function crabFrames() {
  const pal = palShift(['#2a140c', '#e06030', '#a83a18', '#ff9a60', '#ffffff', '#1a0e0a']);
  return [0, 1].map(i => { const s = new Spr(18, 12); s.ell(9, 7, 5, 3, [1, 2, 3]); s.ell(i ? 2 : 3, 4, 2.6, 2, [1, 2, 3]); s.ell(15, 6, 1.5, 1.2, 1); for (const x of [6, 8, 10, 12]) s.line(x, 9, x + (i ? 1 : -1), 11, 2); s.set(8, 3, 4); s.set(10, 3, 4); s.set(8, 2, 5); s.set(10, 2, 5); return s.outline(pal.OL).canvas(pal); });
}
function snailFrames() {
  const pal = palShift(['#14101a', '#c8d0e0', '#8a94aa', '#ffffff', '#ff4fa0', '#4fe0ff', '#e8c8a0', '#b89870', '#1a1420']);
  return [0, 1].map(i => { const s = new Spr(30, 24);
    s.ell(15, 20, 12, 3, [6, 7, 6]); s.ell(13, 12, 8, 8, [1, 2, 3]); for (let a = 0; a < 9; a += .3) s.set(13 + Math.cos(a) * a * .8, 12 + Math.sin(a) * a * .8, 2);
    s.ell(24, 13, 3.5, 6, [6, 7, 6]); s.rect(21, 10, 7, 3, 8); s.rect(22, 11, 5, 1, i ? 4 : 5); s.line(24, 7, 23, 3, 6); s.line(26, 7, 28, 3, 6);
    return s.outline(pal.OL).canvas(pal); });
}
function hogFrames() {
  const pal = palShift(['#2a140c', '#f0a8a8', '#d07878', '#ffd0d0', '#6a4a2a']);
  return [0, 1].map(i => { const s = new Spr(36, 22); for (const x of [8, 13, 23, 28]) s.rect(x, 15, 3, 5 - (i && x % 2 ? 1 : 0), 2); s.ell(18, 11, 13, 7, [1, 2, 3]); s.ell(30, 10, 4, 4, [1, 2, 3]); s.ell(33, 11, 2, 2, 2); s.set(29, 8, 0); s.ell(26, 5, 2, 1.5, 2); s.ell(6, 8, 2, 1, 2); s.ell(14, 15, 6, 2, 4); return s.outline(pal.OL).canvas(pal); });
}

/* ---------- cameo stickers (found by touching them) ---------- */
function smallSpr(w, h, pal, fn) { const s = new Spr(w, h); fn(s); return s.outline(1).canvas(palette(pal)); }
const CAMEO_ART = {};
const CAMEOS = {
  wick: { name: 'WICK THE GHOST', line: 'BOO! ...SORRY. WRONG MANOR.', art: () => smallSpr(22, 26, ['#2a2040', '#f4f4ff', '#c8c8e8', '#ff9ab8', '#1a1420'], s => { s.ell(11, 11, 8, 9, [2, 3, 2]); s.rect(3, 11, 17, 12, 2); for (let x = 3; x < 20; x += 4) s.ell(x + 1.5, 23, 2, 2, 2); s.ell(8, 10, 1.3, 2, 5); s.ell(14, 10, 1.3, 2, 5); s.rect(5, 14, 2, 1, 4); s.rect(15, 14, 2, 1, 4); }) },
  luna: { name: 'LUNA THE CAT', line: 'MRRP.', art: () => smallSpr(24, 20, ['#2a140c', '#3a2a22', '#c87a3a', '#f0c890', '#f6c645'], s => { s.ell(12, 13, 9, 6, 2); s.ell(9, 12, 4, 3, 3); s.ell(15, 15, 3, 2, 4); s.ell(19, 8, 4.5, 4, 2); s.tri(16, 6, 17, 1, 19, 5, 2); s.tri(20, 5, 22, 1, 23, 6, 3); s.set(18, 8, 5); s.set(21, 8, 5); s.ell(3, 12, 2, 5, 3, .5); }) },
  biscuit: { name: 'BISCUIT THE BOYKIN', line: 'WOOF! (HE WANTS A BISCUIT.)', art: () => smallSpr(30, 24, ['#2a140c', '#6a3a1e', '#8a5230', '#4a2410', '#1a0e0a'], s => { for (const x of [8, 12, 20, 24]) s.rect(x, 16, 3, 7, 2); s.ell(16, 13, 10, 5.5, [2, 2, 3]); s.ell(26, 8, 5, 4.5, 2); s.ell(23, 10, 2.5, 5, 4); s.ell(29, 10, 2, 1.5, 2); s.set(27, 7, 5); s.ell(5, 9, 3, 1.5, 3, -.6); }) },
  volvo: { name: 'THE NAVY VOLVO', line: 'BALLET AT FOUR. NOT TODAY.', art: () => smallSpr(64, 28, ['#0a0a14', '#1f2f5a', '#2e4480', '#9ab8d8', '#c8ced8', '#1a1a1a', '#f6d77a'], s => { s.rect(2, 10, 60, 10, 2); s.rect(10, 3, 40, 9, 2); s.rect(12, 5, 16, 6, 4); s.rect(30, 5, 18, 6, 4); s.rect(2, 10, 60, 2, 3); s.rect(58, 12, 4, 3, 7); for (const x of [14, 48]) { s.ell(x, 21, 5.5, 5.5, 6); s.ell(x, 21, 2.5, 2.5, 5); } }) },
  pumpkin: { name: 'A SLASHABLE PUMPKIN', line: 'DON\'T CUT THE SKULLS.', art: () => smallSpr(22, 20, ['#2a140c', '#ff8a1c', '#c85a10', '#ffd040', '#3fb04a'], s => { s.ell(11, 12, 9, 7, [2, 3, 2]); s.line(11, 5, 11, 18, 3); s.line(6, 6, 6, 17, 3); s.line(16, 6, 16, 17, 3); s.rect(10, 2, 2, 4, 5); s.tri(6, 11, 8, 8, 10, 11, 4); s.tri(12, 11, 14, 8, 16, 11, 4); s.rect(7, 14, 8, 2, 4); }) },
  cinnamon: { name: 'THE CINNAMON ROLL CAT', line: 'SWEET.', art: () => smallSpr(24, 22, ['#2a140c', '#d89a5a', '#a8682a', '#fff0d0', '#1a0e0a'], s => { s.ell(12, 13, 9, 7, 2); for (let a = 0; a < 12; a += .25) s.set(12 + Math.cos(a) * a * .6, 13 + Math.sin(a) * a * .45, 3); s.tri(5, 8, 6, 2, 9, 7, 2); s.tri(15, 7, 18, 2, 19, 8, 2); s.set(9, 11, 5); s.set(15, 11, 5); s.ell(12, 6, 6, 1.5, 4); }) },
  clock: { name: 'A CLOCK STUCK AT 11:59', line: 'IT\'S ALWAYS 11:59 SOMEWHERE.', art: () => smallSpr(28, 28, ['#2a140c', '#f4ead0', '#b8a070', '#1a0e0a', '#d8a020'], s => { s.ell(14, 14, 12, 12, 5); s.ell(14, 14, 10, 10, 2); for (let k = 0; k < 12; k++) { const a = k * .5236; s.set(14 + Math.cos(a) * 8.5, 14 + Math.sin(a) * 8.5, 4); } s.line(14, 14, 14, 6, 4); s.line(14, 14, 13, 5, 4); s.line(14, 14, 13, 9, 4); }) },
  snails: { name: 'LES ESCARGOTS DISCO', line: 'ENCORE! ENCORE!', art: () => A.snail[0] },
  flamingo: { name: 'A PINK LAWN FLAMINGO', line: 'CLASSIC.', art: () => smallSpr(18, 30, ['#2a140c', '#ff7ab0', '#d84a88', '#ffb0d0', '#1a0e0a'], s => { s.ell(9, 14, 6, 4, [2, 3, 4]); s.line(13, 12, 14, 4, 2); s.line(14, 12, 15, 4, 2); s.ell(14, 4, 2.5, 2, 2); s.line(16, 4, 17, 6, 5); s.line(8, 18, 8, 29, 5); s.line(10, 18, 10, 29, 5); }) },
  moons: { name: 'TWO MOONS IN THE RAIN BARREL', line: 'ONE MOON, AND ITS REFLECTION...', art: () => smallSpr(26, 26, ['#2a140c', '#6a4a2a', '#4a321c', '#1a2a5a', '#f4e8a0', '#c8b8f8'], s => { s.rect(3, 6, 20, 19, 2); for (let y = 8; y < 25; y += 5) s.rect(3, y, 20, 1, 3); s.ell(13, 6, 10, 2.5, 4); s.ell(9, 6, 1.5, 1, 5); s.ell(17, 6, 1.5, 1, 6); }) },
  peachstand: { name: 'THE PEACH STAND', line: 'WASHINGTON, GA. BEST PEACHES GOING.', art: () => smallSpr(46, 40, ['#2a140c', '#c89a6a', '#8a5a3a', '#ffb347', '#e0782a', '#ffffff', '#3fb04a'], s => { s.rect(4, 22, 38, 14, 2); s.rect(4, 22, 38, 2, 3); s.rect(6, 36, 3, 4, 3); s.rect(37, 36, 3, 4, 3); s.rect(2, 4, 42, 12, 6); for (let x = 2; x < 44; x += 6) s.rect(x, 4, 3, 12, 5); for (let k = 0; k < 7; k++) s.ell(9 + k * 5, 20, 2.5, 2.5, [4, 5, 4]); s.rect(6, 16, 2, 6, 3); s.rect(38, 16, 2, 6, 3); }) },
  tractor: { name: 'THE OLD RED TRACTOR', line: 'STILL RUNS. SOMETIMES.', art: () => smallSpr(50, 36, ['#1a0e0a', '#c8302a', '#8a1a14', '#e85a4a', '#2a2a2a', '#5a5a5a', '#d8d0c0'], s => { s.rect(10, 12, 28, 10, 2); s.rect(10, 12, 28, 2, 4); s.rect(24, 2, 12, 12, 2); s.rect(26, 4, 8, 7, 7); s.rect(36, 6, 2, 8, 5); s.ell(32, 26, 10, 10, 5); s.ell(32, 26, 5, 5, 6); s.ell(10, 29, 6, 6, 5); s.ell(10, 29, 3, 3, 6); }) },
  spaghetti: { name: 'SPAGHETTI JUNCTION', line: 'EVERY ROAD IN GEORGIA AT ONCE.', art: () => smallSpr(30, 22, ['#2a140c', '#c8c0b0', '#8a8478', '#3a3a40'], s => { for (let k = 0; k < 3; k++) { for (let x = 0; x < 30; x++) s.set(x, 6 + k * 5 + Math.round(Math.sin(x * .2 + k) * 2), 2); } for (const x of [6, 15, 24]) s.rect(x, 8, 2, 14, 3); }) },
  stonemtn: { name: 'STONE MOUNTAIN', line: 'A BIG OL\' ROCK.', art: () => smallSpr(34, 18, ['#2a140c', '#9a9aa2', '#6e6e78', '#c8c8d0', '#3f8a32'], s => { s.ell(17, 18, 16, 14, [2, 3, 4]); s.rect(0, 15, 34, 3, 5); }) },
  peachdrop: { name: 'THE BIG PEACH', line: 'IT DROPS ON NEW YEAR\'S.', art: () => smallSpr(26, 30, ['#2a140c', '#ffb347', '#e0782a', '#ffd9a0', '#3fb04a', '#8a8a8a'], s => { s.rect(12, 0, 2, 8, 6); s.ell(13, 18, 10, 10, [2, 3, 4]); s.line(13, 9, 13, 27, 3); s.ell(18, 8, 4, 2, 5, -.5); }) },
  mailbox: { name: 'THE BUNS\' MAILBOX', line: 'MOSTLY CARROT CATALOGS.', art: () => smallSpr(22, 34, ['#2a140c', '#3a5aa8', '#2a3a80', '#6a8ad8', '#e03030', '#8a5a3a'], s => { s.rect(10, 14, 3, 20, 6); s.rect(2, 4, 18, 11, 2); s.ell(11, 4, 9, 3, 2); s.rect(2, 4, 18, 2, 4); s.rect(19, 2, 2, 6, 5); s.rect(18, 2, 3, 2, 5); }) },
  sphinx: { name: 'A SPHINX FRAGMENT', line: 'THIRTEEN OF THESE ARE SOMEWHERE.', art: () => smallSpr(22, 18, ['#2a140c', '#d8b67b', '#a8864b', '#f0d8a8'], s => { s.ell(9, 12, 8, 5, [2, 3, 4]); s.ell(16, 7, 4, 4.5, [2, 3, 4]); s.rect(13, 3, 7, 2, 3); s.tri(4, 8, 2, 16, 10, 16, 2); }) },
  bsquirrel: { name: 'A BOULDER SQUIRREL', line: 'SUNNY? NAH. I\'M FROM AROUND HERE. ...WE\'RE RELATED, PROBABLY.', art: () => smallSpr(26, 26, ['#20161a', '#8c8c94', '#5f5f69', '#c4c4cc', '#f2eee6', '#c8302a'], s => { for (let k = 0; k < 9; k++) { const t = k / 8, a = -0.3 - t * 2.9; s.ell(7 + Math.cos(a) * 6, 16 + Math.sin(a) * 8, 4 - t * .8, 4 - t * .8, [2, 3, 4]); } s.ell(15, 18, 5, 6, [2, 3, 4]); s.ell(16.5, 19, 2.6, 4, 5); s.ell(18, 11, 4.5, 4, [2, 3, 4]); s.ell(18, 8, 4.5, 2.2, 6); s.set(20, 10, 1); s.ell(14, 24, 3, 1.6, 2); s.ell(19, 24, 3, 1.6, 2); }) },
  skis: { name: 'TINY SKIS', line: 'SOMEBODY\'S HAVING A BETTER DAY THAN US.', art: () => smallSpr(20, 30, ['#1a1420', '#c8302a', '#2a6ab8', '#c8ced8'], s => { s.rect(5, 2, 3, 26, 2); s.rect(12, 2, 3, 26, 3); s.rect(5, 1, 3, 2, 4); s.rect(12, 1, 3, 2, 4); s.rect(3, 14, 14, 2, 4); }) },
  vinyl: { name: 'A GOLD RECORD', line: 'FRENCH TOUCH. VERY TOUCHY.', art: () => smallSpr(22, 22, ['#1a1420', '#2a2430', '#f6c645', '#ff4fa0'], s => { s.ell(11, 11, 10, 10, 1); for (let r = 4; r < 10; r += 2) for (let a = 0; a < 6.3; a += .08) s.set(11 + Math.cos(a) * r, 11 + Math.sin(a) * r, 2); s.ell(11, 11, 3, 3, 3); s.set(11, 11, 4); }) }
};
for (const k in CAMEOS) {
  CAMEOS[k].draw = (gg, cm, t) => { const c = CAMEO_ART[k] || (CAMEO_ART[k] = CAMEOS[k].art()); const bob = k === 'wick' ? Math.sin(t * .06) * 2 : 0; gg.drawImage(c, Math.round(cm.x - c.width / 2), Math.round(cm.y - c.height + bob)); if (!cm.seen && t % 40 < 20) { gg.fillStyle = '#ffffff'; gg.fillRect(Math.round(cm.x + c.width / 2 - 2), Math.round(cm.y - c.height - 2), 2, 2); } };
}
function cameoIcon(k, size) { const c = CAMEO_ART[k] || (CAMEO_ART[k] = CAMEOS[k].art()); const sc = Math.min(1, size / Math.max(c.width, c.height)); return [c, sc]; }

function buildAssets2() {
  A.gold = goldFrames(); A.items = itemSprites();
  A.dexter = buildBun('dexter', { fat: 1 }); A.pontoon = buildBun('marsh'); A.lone = buildBun('ginger', { pendant: 'rope' });
  A.seven = sevenFrames(); A.elli = elliFrames(); A.cow = cowFrames(); A.chick = chickFrames(); A.crab = crabFrames(); A.snail = snailFrames(); A.hog = hogFrames();
  A.suitcase = [0, 1].map(i => smallSpr(34, 22, ['#1a0e0a', '#c8302a', '#8a1a14', '#e85a4a', '#d8d0c0', '#2a2a2a'], s => { s.rect(2, 6 + i * 3, 30, 15 - i * 3, 2); s.rect(2, 6 + i * 3, 30, 2, 4); s.rect(12, 2 + i * 3, 10, 4, 6); s.rect(14, 3 + i * 3, 6, 2, 0); s.rect(6, 8 + i * 3, 2, 12 - i * 3, 3); s.rect(26, 8 + i * 3, 2, 12 - i * 3, 3); }));
  A.sprinkler = [0, 1].map(i => smallSpr(20, 18, ['#1a0e0a', '#3fb04a', '#237a2e', '#9ad0ff', '#d8d0c0'], s => { s.rect(6, 12 - i * 3, 8, 6 + i * 3, 2); s.rect(8, 6 - i * 3, 4, 7, 1); if (i) for (let k = 0; k < 7; k++) s.set(3 + k * 2.3, 2 + Math.abs(k - 3), 4); }));
  A.hero = buildBun('hero', { pendant: SAVE.drip || 1 });
  A.bb1 = buildBun('white', { beanie: '#c8302a' }); A.bb2 = buildBun('gray', { beanie: '#2f8a3a' }); A.bb3 = buildBun('honey', { beanie: '#2a6ab8' });
  A.snowbank = [0, 1].map(i => smallSpr(36, 16, ['#5a78a0', '#ffffff', '#dfeaf6', '#b8cce4'], s => { s.sphere(18, 16 - (i ? 3 : 6) + 6, 16, i ? 6 : 9, [4, 3, 2, 2]); }));
}
function setDrip(kind) { SAVE.drip = kind; if (MISSION && SAVE.saga) { const k = { rope: 'rope', carrot: 'pendant', ice: 'iced' }[kind]; if (k) { giveStash(k); MISSION.drip = k; } } writeSave(); A.hero = buildBun('hero', { pendant: kind }); }
