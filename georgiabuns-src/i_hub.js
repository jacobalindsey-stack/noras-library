/* ================= Georgia Buns — the burrow (hub) =================
   Pine straw bed, kitchen island, the pebble phone, and a shelf of every
   sticker found. Six postcards: tap one to start that day. */

const DAYS = ['creek', 'farm', 'icebox', 'marsh', 'paris', 'garden'];
const DAYLOOK = { creek: ['#5aa8ff', '#5cb83a', 'rock'], farm: ['#ffd890', '#7ccf4a', 'peach'], icebox: ['#2a2058', '#3a3a44', 'gem'], marsh: ['#ffb070', '#f2dca8', 'sand'], paris: ['#8d9ccb', '#9a9488', 'box'], garden: ['#ff9a50', '#5a3a24', 'veg'] };
function enterHub() {
  const keep = S && S.day; newGame('hub', 'creek'); S.mode = 'hub'; S.hub = { sel: Math.max(0, DAYS.indexOf(keep || 'creek')), lk: 0 }; auMode('title'); S.musicLock = false;
  if (window.$ && $('again')) $('again').hidden = true;
}
function startDay(id) {
  newGame('intro', id);
  if (LV.drive) initDrive(); else startIntro();
}
function hubCard(i) { const cols = 3, gx = 8, top = 50, w = Math.floor((NW - 24 - gx * (cols - 1)) / cols), h = Math.floor((NH - top - 10 - 8) / 2); return [12 + (i % cols) * (w + gx), top + Math.floor(i / cols) * (h + 8), w, h]; }
function stepHub() {
  const H = S.hub;
  if (Math.abs(IN.ix) > .5 || Math.abs(IN.iy) > .5) { if (!H.lk) { H.lk = 1; if (Math.abs(IN.ix) > .5) H.sel = (H.sel + sgn(IN.ix) + 6) % 6; else H.sel = (H.sel + 3) % 6; sfx('tap'); } } else H.lk = 0;
  let pick = -1;
  if (IN.press && IN.tapX != null) for (let i = 0; i < 6; i++) { const [x, y, w, h] = hubCard(i); if (IN.tapX >= x && IN.tapX <= x + w && IN.tapY >= y && IN.tapY <= y + h) pick = i; }
  if (IN.jumpP) pick = H.sel;
  IN.tapX = null;
  if (pick >= 0) { H.sel = pick; sfx('crew'); startDay(DAYS[pick]); }
}
function drawHub() {
  const t = S.t, R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // burrow walls: red clay with strata, warm lamp glow
  for (let y = 0; y < NH; y += 2) R(0, y, NW, 2, css(mixRGB(rgb('#5a2414'), rgb('#3b1d10'), y / NH)));
  for (let i = 0; i < 70; i++) R((i * 61) % NW, (i * 37) % NH, 2, 1, i % 3 ? '#6e2814' : '#7a3a1e');
  g.globalAlpha = .14; pixCircle(NW * .5, NH * .1, 120, '#ffd68a'); g.globalAlpha = 1;
  // round window to the lawn
  pixCircle(NW - 40, 30, 22, '#2a140c'); pixCircle(NW - 40, 30, 19, '#7ac0f0'); R(NW - 59, 34, 38, 15, '#5cb83a'); R(NW - 41, 11, 2, 38, '#2a140c'); R(NW - 59, 29, 38, 2, '#2a140c');
  // shelf of stickers
  R(8, 28, NW - 70, 4, '#8a5a3a'); R(8, 32, NW - 70, 2, '#5a3a22');
  const keys = Object.keys(CAMEOS), slot = Math.min(22, (NW - 80) / keys.length);
  keys.forEach((k, i) => { const [c, sc] = cameoIcon(k, 20), w = c.width * sc, h = c.height * sc, x = 12 + i * slot + (slot - w) / 2, y = 28 - h;
    if (SAVE.stickers[k]) g.drawImage(c, Math.round(x), Math.round(y), Math.round(w), Math.round(h)); else { g.globalAlpha = .28; g.filter = 'brightness(0)'; g.drawImage(c, Math.round(x), Math.round(y), Math.round(w), Math.round(h)); g.filter = 'none'; g.globalAlpha = 1; } });
  const nSt = keys.filter(k => SAVE.stickers[k]).length, nG = DAYS.reduce((n, d) => n + ((SAVE.days[d] || {}).gold || []).filter(Boolean).length, 0);
  drawTextO(g, 'STICKERS ' + nSt + '/' + keys.length + '   GOLDEN CARROTS ' + nG + '/18', 10, 36, '#f6c645', 1, '#2a140c');
  // postcards
  for (let i = 0; i < 6; i++) {
    const id = DAYS[i], L = LEVELS[id], [x, y, w, h] = hubCard(i), rec = SAVE.days[id] || {}, sel = S.hub.sel === i, look = DAYLOOK[id];
    const lift = sel ? Math.round(Math.sin(t * .15) * 1.5) - 1 : 0;
    R(x - 2, y - 2 + lift, w + 4, h + 4, sel ? '#f6c645' : '#2a140c'); R(x, y + lift, w, h, '#f4ead0');
    const ih = h - 22; R(x + 3, y + 3 + lift, w - 6, ih, look[0]); R(x + 3, y + 3 + ih * .62 + lift, w - 6, ih * .38, look[1]);
    const art = look[2] === 'gem' ? (driveArt(), A.drive.gem[(t >> 3) & 3]) : A.items[look[2]][((t >> 3) + i) % 12 === 0 ? 1 : 0];
    g.drawImage(art, Math.round(x + w - 22), Math.round(y + 6 + lift));
    const who = id === 'farm' ? A.dexter.idle[0] : id === 'marsh' ? A.pontoon.catsit[0] : id === 'paris' ? A.lone.idle[0] : id === 'icebox' ? null : A.hero.idle[0];
    if (who) drawSpr(who, x + 22, y + 3 + ih + lift, 0, 1, BAX, BAY); else g.drawImage(A.escL, 0, 0, 112, 50, x + 6, y + ih - 22 + lift, 56, 25);
    drawText(g, 'DAY ' + L.day, x + 5, y + ih + 6 + lift, '#7a4a2a');
    const tl = L.title.length > 16 ? L.title.replace('THE ', '') : L.title; drawText(g, tl, x + 5, y + ih + 14 + lift, '#2a140c');
    for (let k = 0; k < 3; k++) { if ((rec.gold || [])[k]) g.drawImage(A.gold[0], 0, 0, 14, 20, x + w - 28 + k * 8, y + ih + 4 + lift, 7, 10); else { g.globalAlpha = .25; g.drawImage(A.gold[0], 0, 0, 14, 20, x + w - 28 + k * 8, y + ih + 4 + lift, 7, 10); g.globalAlpha = 1; } }
    if (rec.done) { R(x + w - 16, y + 6 + lift + 18, 12, 10, '#3fb04a'); g.fillStyle = '#ffffff'; g.fillRect(x + w - 13, y + lift + 29, 2, 2); g.fillRect(x + w - 11, y + lift + 31, 2, 2); g.fillRect(x + w - 9, y + lift + 27, 2, 4); g.fillRect(x + w - 7, y + lift + 25, 2, 3); }
  }
  // pebble phone on the wall
  g.drawImage(A.phone[(t >> 4) & 1], NW - 74, 18);
  drawTextO(g, 'PICK A DAY', NW - 120, 40, (t & 32) ? '#ffffff' : '#fff3b0', 1, '#2a140c');
}
