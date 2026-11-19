/* ================= Georgia Buns — screen, touch, keys, menu ================= */
const $ = id => document.getElementById(id);
const disp = $('screen'), dctx = disp.getContext('2d');
const UI = { portrait: false, playW: 0, playH: 0, W: 0, H: 0, k: 1 };
const PTR = new Map(); const KEY = {};
let paused = false;

function pixImg(cv, scale) { const im = new Image(); im.src = cv.toDataURL(); im.style.width = cv.width * scale + 'px'; im.style.height = cv.height * scale + 'px'; im.className = 'px'; im.draggable = false; return im; }
function setLabel(el, text, scale, col) { el.textContent = ''; el.appendChild(pixImg(textCanvas(text, col || '#ffffff', 1, '#2a140c'), scale)); }
function jumpArt(pressed) {
  const s = new Spr(44, 44); s.ell(22, 23, 20, 20, 1); s.ell(22, pressed ? 23 : 21, 18, 18, [2, 3, 4]); s.ell(16, pressed ? 15 : 13, 7, 4, 4);
  const c = s.outline(5).canvas(palette(['#5a2a0a', '#ff8a1c', '#c85a10', '#ffc070', '#2a140c'])), g2 = c.getContext('2d'), o = pressed ? 2 : 0;
  g2.fillStyle = '#2a140c'; for (let i = 0; i < 7; i++) g2.fillRect(22 - i, 11 + i + o, i * 2 + 1, 1);
  g2.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) g2.fillRect(22 - i, 11 + i + o, i * 2 + 1, 1);
  drawText(g2, 'JUMP', 11, 22 + o, '#ffffff', 1, '#2a140c'); return c;
}
function stickArt(knob) {
  const s = new Spr(48, 48);
  if (knob) { s.ell(24, 24, 13, 13, [2, 3, 4]); s.ell(20, 19, 4, 3, 4); }
  else { s.ell(24, 24, 22, 22, 6); s.ell(24, 24, 19, 19, 0); for (const a of [0, 1.571, 3.142, 4.712]) { const x = 24 + Math.cos(a) * 15, y = 24 + Math.sin(a) * 15; s.tri(x + Math.cos(a) * 4, y + Math.sin(a) * 4, x + Math.cos(a + 2.1) * 3, y + Math.sin(a + 2.1) * 3, x + Math.cos(a - 2.1) * 3, y + Math.sin(a - 2.1) * 3, 7); } }
  return s.outline(5).canvas(palette(['#000', '#f4e2bd', '#c9a87a', '#ffffff', '#2a140c', '#f4e2bd', '#ffffff']));
}
function easyArt(on) {
  const c = mkC(58, 15), g2 = c.getContext('2d');
  g2.fillStyle = '#2a140c'; g2.fillRect(0, 0, 58, 15); g2.fillStyle = on ? '#f6c645' : '#4e3220'; g2.fillRect(1, 1, 56, 13); g2.fillStyle = on ? '#fff3b0' : '#7a5236'; g2.fillRect(1, 1, 56, 2);
  // finger icon
  g2.fillStyle = on ? '#2a140c' : '#f4e2bd'; g2.fillRect(5, 3, 2, 6); g2.fillRect(4, 8, 5, 4); g2.fillRect(7, 6, 1, 3); g2.fillRect(8, 7, 1, 2);
  drawText(g2, 'EASY', 12, 4, on ? '#2a140c' : '#ffffff');
  // on/off switch
  g2.fillStyle = '#2a140c'; g2.fillRect(38, 3, 16, 9); g2.fillStyle = on ? '#3fb04a' : '#7a7a7a'; g2.fillRect(39, 4, 14, 7);
  g2.fillStyle = '#ffffff'; g2.fillRect(on ? 46 : 40, 5, 6, 5); g2.fillStyle = '#2a140c'; g2.fillRect(on ? 45 : 46, 4, 1, 7);
  return c;
}
function pauseArt() { const c = mkC(15, 15), g2 = c.getContext('2d'); g2.fillStyle = '#2a140c'; g2.fillRect(0, 0, 15, 15); g2.fillStyle = '#4e3220'; g2.fillRect(1, 1, 13, 13); g2.fillStyle = '#ffffff'; g2.fillRect(4, 4, 2, 7); g2.fillRect(9, 4, 2, 7); return c; }

const ART = {};
function buildUI() {
  ART.jump = jumpArt(0).toDataURL(); ART.jumpD = jumpArt(1).toDataURL(); ART.base = stickArt(0).toDataURL(); ART.knob = stickArt(1).toDataURL();
  $('jump').style.backgroundImage = 'url(' + ART.jump + ')';
  $('stickBase').style.backgroundImage = 'url(' + ART.base + ')'; $('stickKnob').style.backgroundImage = 'url(' + ART.knob + ')';
  $('pause').appendChild(pixImg(pauseArt(), 3));
  refreshEasy();
  const stop = e => { e.stopPropagation(); };
  for (const id of ['easy', 'pause']) { $(id).addEventListener('pointerdown', stop); }
  $('easy').addEventListener('click', () => { auUnlock(); SAVE.easy = !SAVE.easy; SAVE.easySeen = true; writeSave(); refreshEasy(); layout(); sfx('tap'); easyExplain(); });
  $('pause').addEventListener('click', () => { auUnlock(); openMenu(); });
  $('again').addEventListener('pointerdown', stop);
  $('again').addEventListener('click', () => { auUnlock(); $('again').hidden = true; enterHub(); });
  setLabel($('again'), 'BACK TO THE BURROW', 3);
  setLabel($('menuTitle'), 'PAUSED', 4, '#f6c645');
  window.onCookout = () => setTimeout(() => { if (S && S.mode === 'cook') $('again').hidden = false; }, 1400);
  buildMenu();
}
function easyExplain() {
  if (!S || S.mode === 'title' || S.mode === 'cook') return;
  if (SAVE.easy) { S.easyHint = 300; say('hero', 'EASY MODE: HOLD YOUR FINGER WHERE YOU WANT ME TO GO. TAP TO JUMP.', 300); }
  else { S.easyHint = 0; say('hero', 'STICK MODE: LEFT THUMB RUNS. JUMP BUTTON JUMPS.', 220); }
}
function refreshEasy() { const e = $('easy'); e.textContent = ''; e.appendChild(pixImg(easyArt(SAVE.easy), 3)); e.classList.toggle('on', SAVE.easy); e.classList.toggle('invite', !SAVE.easySeen); }

/* ---------- menu ---------- */
function buildMenu() {
  const m = $('menuItems'); m.textContent = '';
  const row = (label, fn, note) => { const b = document.createElement('button'); b.className = 'mbtn'; setLabel(b, label, 3); b.addEventListener('click', e => { e.stopPropagation(); sfx('tap'); fn(); }); m.appendChild(b); if (note) { const n = document.createElement('div'); n.className = 'note'; n.textContent = note; m.appendChild(n); } };
  row('RESUME', closeMenu);
  row('EASY MODE: ' + (SAVE.easy ? 'ON' : 'OFF'), () => { SAVE.easy = !SAVE.easy; SAVE.easySeen = true; writeSave(); refreshEasy(); layout(); buildMenu(); if (SAVE.easy && S) S.easyHint = 300; }, 'Hold where you want to go. Tap to jump. Big rocks get hopped for you.');
  row('BUTTONS: ' + ({ S: 'SMALL', M: 'MEDIUM', L: 'LARGE' })[SAVE.size], () => { SAVE.size = SAVE.size === 'S' ? 'M' : SAVE.size === 'M' ? 'L' : 'S'; writeSave(); layout(); buildMenu(); }, 'Size of the jump button and stick.');
  const ids = [null].concat(Object.keys(SONG));
  row('MUSIC: ' + (AU.juke ? SONG[AU.juke].name : 'AUTO'), () => { const i = ids.indexOf(AU.juke); auJuke(ids[(i + 1) % ids.length]); buildMenu(); }, 'Auto plays each song in its place. Tap to pick any song on the album.');
  row('SOUND: ' + (SAVE.sound ? 'ON' : 'OFF'), () => { SAVE.sound = !SAVE.sound; auSetOn(SAVE.sound); writeSave(); buildMenu(); });
  row('START THE DAY OVER', () => { closeMenu(); $('again').hidden = true; startDay(S.day); });
  row('BACK TO THE BURROW', () => { closeMenu(); $('again').hidden = true; enterHub(); });
  row('TITLE SCREEN', () => { closeMenu(); $('again').hidden = true; newGame('title'); auMode('title'); });
}
function openMenu() { if (!S || S.mode === 'title' || S.mode === 'hub') return; paused = true; PTR.clear(); buildMenu(); $('menu').hidden = false; }
function closeMenu() { paused = false; $('menu').hidden = true; PTR.clear(); }

/* ---------- layout ---------- */
function layout() {
  const vv = window.visualViewport, W = Math.round(vv ? vv.width : innerWidth), H = Math.round(vv ? vv.height : innerHeight);
  UI.W = W; UI.H = H; UI.portrait = H > W * 1.08;
  let playH = H, deckH = 0;
  if (UI.portrait) { const want = Math.round(W * .7); deckH = Math.max(H - want, Math.min(260, H * .4)); playH = H - deckH; }
  UI.playW = W; UI.playH = playH;
  const newNH = clamp(Math.round(NW * playH / W), 200, 320);
  if (newNH !== NH) { NH = newNH; scr.height = NH; g = scr.getContext('2d'); g.imageSmoothingEnabled = false; }
  const dpr = window.devicePixelRatio || 1, k = clamp(Math.ceil(W * dpr / NW), 1, 6);
  disp.width = NW * k; disp.height = NH * k; UI.k = k;
  const ctlMode = S && (S.mode === 'play' || S.mode === 'throw' || S.mode === 'intro' || S.mode === 'drive' || S.mode === 'goal');
  const play = $('play'); play.style.width = W + 'px'; play.style.height = playH + 'px'; play.style.top = (UI.portrait && !ctlMode ? Math.round((H - playH) / 2) : 0) + 'px';
  const deck = $('deck'); deck.hidden = !UI.portrait || !ctlMode; deck.style.height = deckH + 'px';
  const sz = { S: .8, M: 1, L: 1.22 }[SAVE.size] || 1, short = Math.min(W, H);
  const jd = Math.round(clamp(short * (UI.portrait ? .26 : .19), 96, 190) * sz);
  const jb = $('jump'); jb.style.width = jb.style.height = jd + 'px';
  if (UI.portrait) { jb.style.left = Math.round(W * .75 - jd / 2) + 'px'; jb.style.top = Math.round(playH + deckH / 2 - jd / 2) + 'px'; }
  else { jb.style.left = (W - jd - Math.round(W * .03)) + 'px'; jb.style.top = (H - jd - Math.round(H * .05)) + 'px'; }
  UI.jd = jd; UI.stickR = Math.round(jd * .48);
  const sb = $('stickBase'), kn = $('stickKnob'); sb.style.width = sb.style.height = UI.stickR * 2 + 'px'; kn.style.width = kn.style.height = Math.round(UI.stickR * 1.1) + 'px';
  UI.ghost = UI.portrait ? [W * .25, playH + deckH / 2] : [Math.round(W * .03) + UI.stickR + 10, H - Math.round(H * .05) - UI.stickR - 10];
  placeStick(null);
  const showCtl = S && (S.mode === 'play' || S.mode === 'throw' || S.mode === 'intro' || S.mode === 'drive' || S.mode === 'goal');
  jb.hidden = !showCtl; sb.hidden = !showCtl || SAVE.easy; kn.hidden = sb.hidden;
  $('easy').hidden = !S || S.mode === 'title' || S.mode === 'cook' || S.mode === 'hub'; $('pause').hidden = !S || S.mode === 'title' || S.mode === 'hub';
  $('hint').hidden = !(UI.portrait && SAVE.easy && showCtl);
  UI.lastMode = S && S.mode;
}
function placeStick(pt) {
  const sb = $('stickBase'), kn = $('stickKnob'), R = UI.stickR;
  const [ox, oy] = pt ? [pt.ox, pt.oy] : UI.ghost, [kx, ky] = pt ? [pt.kx, pt.ky] : [ox, oy];
  sb.style.left = (ox - R) + 'px'; sb.style.top = (oy - R) + 'px'; sb.classList.toggle('active', !!pt);
  const kr = R * .55; kn.style.left = (kx - kr) + 'px'; kn.style.top = (ky - kr) + 'px';
}

/* ---------- pointers ---------- */
function zoneFor(x, y) {
  if (!S) return 'tap';
  if (S.mode === 'title' || S.mode === 'cook' || S.mode === 'intro' || S.mode === 'hub' || S.mode === 'goal' || (S.mode === 'drive' && S.drv && S.drv.phase === 'shop')) return 'tap';
  if (S.mode === 'throw') return 'jump';
  const jd = UI.jd, jb = $('jump').getBoundingClientRect(), jcx = jb.left + jb.width / 2, jcy = jb.top + jb.height / 2;
  const nearJump = Math.hypot(x - jcx, y - jcy) < jd * .75;
  if (UI.portrait) {
    if (y >= UI.playH) return SAVE.easy ? (nearJump || x > UI.W / 2 ? 'jump' : 'follow') : (x < UI.W / 2 ? 'stick' : 'jump');
    return SAVE.easy ? 'follow' : 'none';
  }
  if (nearJump) return 'jump';
  if (SAVE.easy) return 'follow';
  if (x > UI.W * .5 && y > UI.H * .2) return 'jump';
  if (x <= UI.W * .5 && y > UI.H * .14) return 'stick';
  return 'none';
}
function onDown(e) {
  if (paused) return;
  auUnlock();
  const z = zoneFor(e.clientX, e.clientY);
  if (z === 'tap') { IN.press = true; const r = disp.getBoundingClientRect(); IN.tapX = (e.clientX - r.left) / r.width * NW; IN.tapY = (e.clientY - r.top) / r.height * NH; return; }
  if (z === 'none') return;
  const pt = { kind: z, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY, kx: e.clientX, ky: e.clientY, t0: performance.now(), moved: 0 };
  if (z === 'stick') { const R = UI.stickR; pt.ox = clamp(pt.ox, R + 4, UI.W - R - 4); }
  PTR.set(e.pointerId, pt);
  if (z === 'jump') { IN.jumpP = true; $('jump').style.backgroundImage = 'url(' + ART.jumpD + ')'; }
  if (z === 'stick') placeStick(pt);
}
function onMove(e) {
  const pt = PTR.get(e.pointerId); if (!pt) return;
  pt.moved = Math.max(pt.moved, Math.hypot(e.clientX - pt.ox, e.clientY - pt.oy)); pt.x = e.clientX; pt.y = e.clientY;
  if (pt.kind === 'stick') {
    const R = UI.stickR; let dx = pt.x - pt.ox, dy = pt.y - pt.oy, d = Math.hypot(dx, dy);
    if (d > R * 1.6) { const pull = (d - R * 1.6) / d; pt.ox += dx * pull; pt.oy += dy * pull; dx = pt.x - pt.ox; dy = pt.y - pt.oy; d = Math.hypot(dx, dy); }
    const kd = Math.min(d, R); pt.kx = pt.ox + (d ? dx / d * kd : 0); pt.ky = pt.oy + (d ? dy / d * kd : 0); placeStick(pt);
  }
}
function onUp(e) {
  const pt = PTR.get(e.pointerId); if (!pt) return; PTR.delete(e.pointerId);
  if (pt.kind === 'follow' && performance.now() - pt.t0 < 240 && pt.moved < 14) IN.jumpP = true;
  if (pt.kind === 'stick') placeStick(null);
  if (pt.kind === 'jump' && ![...PTR.values()].some(p => p.kind === 'jump')) $('jump').style.backgroundImage = 'url(' + ART.jump + ')';
  auUnlock();
}
function releaseAll() { PTR.clear(); placeStick(null); $('jump').style.backgroundImage = 'url(' + ART.jump + ')'; for (const k in KEY) KEY[k] = false; }

function readInput() {
  let ix = 0, iy = 0, jump = false;
  if (KEY.ArrowLeft || KEY.KeyA) ix -= 1; if (KEY.ArrowRight || KEY.KeyD) ix += 1;
  if (KEY.ArrowUp || KEY.KeyW) iy -= 1; if (KEY.ArrowDown || KEY.KeyS) iy += 1;
  if (KEY.Space || KEY.KeyZ || KEY.KeyJ || KEY.KeyK) jump = true;
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of gps) { if (!gp) continue; const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; if (Math.abs(ax) > .2) ix = ax; if (Math.abs(ay) > .3) iy = ay;
    if (gp.buttons[14] && gp.buttons[14].pressed) ix = -1; if (gp.buttons[15] && gp.buttons[15].pressed) ix = 1; if (gp.buttons[13] && gp.buttons[13].pressed) iy = 1; if (gp.buttons[12] && gp.buttons[12].pressed) iy = -1;
    if ((gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[1] && gp.buttons[1].pressed)) jump = true; }
  const rect = disp.getBoundingClientRect();
  for (const pt of PTR.values()) {
    if (pt.kind === 'jump') jump = true;
    else if (pt.kind === 'stick') { const R = UI.stickR; let dx = (pt.x - pt.ox) / R, dy = (pt.y - pt.oy) / R; const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } if (Math.abs(dx) > .12) ix = dx; if (Math.abs(dy) > .3) iy = dy; }
    else if (pt.kind === 'follow' && S && S.mode === 'drive') { ix = clamp((pt.x - (rect.left + rect.width / 2)) / (rect.width * .22), -1, 1); }
    else if (pt.kind === 'follow' && S && S.mode === 'play') {
      const nx = (pt.x - rect.left) / rect.width * NW + S.cam.x, ny = (Math.min(pt.y, rect.bottom) - rect.top) / rect.height * NH + S.cam.y;
      if (pt.y < rect.bottom) {
        const dx = nx - S.pl.x; ix = Math.abs(dx) < 6 ? 0 : clamp(dx / 34, -1, 1);
        if (S.pl.y - 20 - ny > 48) jump = true;
      } else ix = pt.x < UI.W / 2 ? -1 : 1;
    }
  }
  IN.ix = clamp(ix, -1, 1); IN.iy = clamp(iy, -1, 1);
  if (jump && !IN.jumpHeld) IN.jumpP = true;
  IN.jump = jump; IN.jumpHeld = jump;
}

/* ---------- loop ---------- */
let acc = 0, last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now; if (dt > .25) dt = .25;
  if (!paused && S) { acc += dt; let n = 0; while (acc >= 1 / 60 && n < 5) { readInput(); update(); acc -= 1 / 60; n++; } if (n >= 5) acc = 0; }
  if (S && UI.lastMode !== S.mode) layout();
  render();
  dctx.imageSmoothingEnabled = false; dctx.drawImage(scr, 0, 0, disp.width, disp.height);
}

function boot() {
  loadSave();
  buildAssets(); buildUI();
  newGame('title');
  auMode('title');
  layout();
  addEventListener('resize', () => { releaseAll(); layout(); });
  if (window.visualViewport) visualViewport.addEventListener('resize', () => { layout(); });
  addEventListener('orientationchange', () => { releaseAll(); setTimeout(layout, 120); });
  addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { releaseAll(); if (document.hidden) { if (AU.ctx) AU.ctx.suspend(); if (S && S.mode !== 'title' && S.mode !== 'cook') openMenu(); } else if (AU.ctx && SAVE.sound) AU.ctx.resume(); });
  addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
  document.addEventListener('touchend', e => { if (e.touches.length === 0) { releaseAll(); auUnlock(); } }, { passive: true });
  for (const ev of ['touchstart', 'touchmove']) document.addEventListener(ev, e => { if (e.target.closest && e.target.closest('#menu')) return; e.preventDefault(); }, { passive: false });
  for (const ev of ['gesturestart', 'gesturechange', 'dblclick']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
  addEventListener('keydown', e => {
    auUnlock();
    if (e.code === 'Escape' || e.code === 'KeyP') { paused ? closeMenu() : openMenu(); e.preventDefault(); return; }
    if (!KEY[e.code] && (e.code === 'Enter' || e.code === 'Space')) { IN.press = true; IN.tapX = null; if (S && S.mode === 'cook' && !$('again').hidden) $('again').click(); }
    KEY[e.code] = true; if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  });
  addEventListener('keyup', e => { KEY[e.code] = false; });
  auSetOn(SAVE.sound);
  requestAnimationFrame(frame);
  window.GB = { get S() { return S; }, IN, SAVE, UI };
}
boot();
