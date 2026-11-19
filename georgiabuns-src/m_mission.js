/* ================= Georgia Buns — missions inside the side-scroller =================
   The six days are now places you go back to. A mission rides on top of a
   level and changes what the run is about:
     fetch    the level's own three things (the original days)
     haul     carry something to the end; bumps knock it loose
     roundup  wake the cousins and they follow you; bumps shake some loose
     sprint   beat the sundown (the sky darkens with the clock)
     toll     bring enough carrots
     hunt     find one lost thing; the pebble pings when you're close
     drive    Peachtree in the Escalade
   No run can be lost. How well it went is one to three stars. */

let MISSION = null;
const HAUL = {
  grill: { name: 'THE GRILL', ic: ['grill', '#2a2430', '#ff6a2a'] }, shingles: { name: 'THE SHINGLES', ic: ['shingles', '#9a4a32'] },
  basket: { name: 'THE CARROT BASKET', ic: ['basket', '#a07448'] }, speaker: { name: 'THE SPEAKER', ic: ['speaker', '#1a1420', '#ff4fa0'] },
  melon: { name: 'THE WATERMELON', ic: ['wmelon', '#3fb04a'] }, cooler: { name: 'THE COOLER', ic: ['cooler', '#3a7ad8'] },
  cobbler: { name: 'THE COBBLER', ic: ['cobbler', '#d8a050'] }, obox: { name: 'THE ORANGE BOX', ic: ['box', '#ff8a1c', '#5a2a0a'] }
};
const HUNT = {
  realeyes: { name: 'THE REAL EYES', ic: ['specs', '#1a1420', '#ffffff'] }, acorn: { name: 'THE GOLDEN ACORN', ic: ['acorn', '#f6c645'] },
  chain: { name: 'THE CHAIN', ic: ['chain', '#f6c645'] }, pebble: { name: 'THE PEBBLE PHONE', ic: ['pebble', '#9aa3ad'] }, record: { name: 'THE RECORD', ic: ['record', '#ff4fa0'] }
};
// tucked-away spots for lost things (all reachable; most need a jump or a detour)
const HUNTSPOTS = {
  creek: [[1660, 216], [3040, 236], [3668, 208], [6330, 298], [352, 196]],
  farm: [[2650, 250], [2955, 360], [5690, 214], [2600, 170]], marsh: [[2560, 300], [4150, 222], [5400, 198], [1200, 334]],
  paris: [[1200, 236], [4500, 144], [6040, 222]], garden: [[1660, 222], [2950, -8], [3905, 222]], boulder: [[3060, -8], [3700, -34], [4620, -8]]
};
function perk(k) { return !!MISSION && has(k); }

/* ---------- start, restart, leave ---------- */
function startRun(spec, again) {
  const s = SAVE.saga;
  if (!again) { s.sun = Math.max(0, s.sun - 1); s.today.place = LVPLACE[spec.run] || s.today.place; writeSave(); }
  if (MISSION) restoreLV();
  MISSION = Object.assign({ t: 0, drops: 0, found: false, pt: 0, fol: [], said: 0 }, spec);
  const M = MISSION; M.base = Object.assign({}, spec); delete M.base.base; $('again').hidden = true;
  if (spec.run === 'icebox') { newGame('intro', 'icebox'); initDrive(); if (perk('rims')) S.drv.max = 295; if (M.say) { S.bubbles = []; say('hero', M.say, 200); } return; }
  // a reverse run starts by the creek and ends at the house
  LV = LEVELS[spec.run];
  if (M.rev) { M.restore = { start: LV.start, goal: LV.goal, burrow: LV.burrow }; LV.start = 7600; LV.goal = 440; LV.burrow = false; }
  newGame('intro', spec.run); missionInit(); startIntro();
}
function restoreLV() { const M = MISSION; if (M && M.restore) { const L = LEVELS[M.run]; L.start = M.restore.start; L.goal = M.restore.goal; L.burrow = M.restore.burrow; M.restore = null; } }
function restartRun() { startRun(Object.assign({}, MISSION.base), true); }
function abortRun() { restoreLV(); MISSION = null; SAVE.saga.sun = Math.min(sunsPerDay(), SAVE.saga.sun + 1); writeSave(); enterSaga('hub'); }

function missionInit() {
  const M = MISSION, L = S.L, p = S.pl, creek = LV.id === 'creek';
  // the family shows up in the level instead of generic cousins
  const pool = []; for (let i = 1; i < FAM.length; i++) if (i !== M.runner) pool.push(i);
  srand((SAVE.saga.day * 7 + M.run.length) | 0); for (let i = pool.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  L.cousins.forEach((c, i) => { c.fam = pool[i % pool.length]; });
  if (M.mode !== 'fetch') { for (const rk of L.rocks) { rk.got = true; rk.shown = false; } S.otter.gave = true; }
  if (creek && M.mode !== 'fetch') { M.goalX = M.rev ? 470 : 7880; M.noThrow = true; }
  if (M.rev) { for (const b of L.boulders) if (b.r > 16) { b.r = 14; b.y = groundY(b.x) - 10; } S.jam.open = true; const b = S.bob; b.state = 'done'; b.x = b.tx; b.y = groundY(b.tx); b.sit = true; }
  if (M.mode === 'haul') M.haul = { st: 'held', x: p.x, y: p.y - 40, vx: 0, vy: 0, t: 0, k: (M.p && M.p.obj) || 'melon' };
  if (M.mode === 'toll') M.need = (M.p && M.p.n) || 60;
  if (M.mode === 'sprint') { const d = Math.abs((M.goalX != null ? M.goalX : LV.goal) - LV.start); M.time = M.time0 = Math.round((d / 3.6 + 420) * (perk('watch') ? 1.15 : 1)); }
  if (M.mode === 'hunt') { const sp = HUNTSPOTS[LV.id] || [[LV.goal * .5, -8]], k = M.spot != null ? M.spot : (Math.random() * sp.length) | 0, [x, y] = sp[k % sp.length]; M.find = { x, y: y < 0 ? groundY(x) + y - 6 : y, k: (M.p && M.p.obj) || 'chain' }; }
  if (M.mode === 'roundup') {
    let want = M.p && M.p.all ? pool.filter(i => i !== 0) : null, n = want ? want.length : ((M.p && M.p.n) || 4);
    const x0 = Math.min(LV.start, LV.goal) + 260, x1 = (M.goalX || Math.max(LV.start, LV.goal)) - 260;
    while (L.cousins.length > n) L.cousins.pop();
    const extra = n - L.cousins.length;
    for (let i = 0; i < extra; i++) { let x = lerp(x0, x1, (i + .5) / extra) + 37; if (x > WATER.x0 - 40 && x < WATER.x1 + 40) x = WATER.x0 - 60; L.cousins.push({ x, y: groundY(x), fur: 'white', woke: false, t: 0 }); }
    L.cousins.forEach((c, i) => { c.fam = want ? want[i] : pool[i % pool.length]; });
    M.need = n;
  }
}

/* ---------- every frame of a mission run ---------- */
function missionStep() {
  const M = MISSION; if (!M || M.run === 'icebox') return; const p = S.pl, play = S.mode === 'play'; M.t++;
  // the gold rope pulls carrots in
  if (perk('rope') && play) { const [cx, cy] = bodyC(p); for (const c of S.L.carrots) if (!c.got) { const dx = cx - c.x, dy = cy - c.y, d = Math.hypot(dx, dy); if (d < 60 && d > 1) { c.x += dx / d * 3.2; c.y += dy / d * 3.2; } } }
  if (play && M.goalX != null && (M.rev ? p.x <= M.goalX : p.x >= M.goalX)) startGoal();
  const hit = p.tumble > M.pt; M.pt = p.tumble;
  if (M.mode === 'haul') stepHaul(M, p, hit && play);
  if (M.mode === 'roundup') stepRoundup(M, p, hit && play);
  if (M.mode === 'sprint' && play && M.time > 0) { M.time--; if (M.time === 0) { say('hero', 'SUN\'S DOWN! KEEP GOING ANYWAY.', 140); sfx('bonk'); } else if (M.time === 600) say('hero', 'SUN\'S GETTING LOW!', 100); }
  if (M.mode === 'toll' && play && !M.met && S.carrots >= M.need) { M.met = 1; sfx('pay'); popText(p.x, p.y - 50, M.need + ' CARROTS! THAT\'S ENOUGH.', '#7ad050'); }
  if (M.mode === 'hunt' && !M.found) {
    const f = M.find, [cx, cy] = bodyC(p);
    if (S.t % 18 === 0) sparkle(f.x + (Math.random() - .5) * 14, f.y - 6 + (Math.random() - .5) * 10);
    if (Math.abs(cx - f.x) < 18 && Math.abs(cy - f.y) < 22) { M.found = true; M.foundT = M.t; sfx('rock'); sfx('crew'); for (let i = 0; i < 8; i++) sparkle(f.x + (Math.random() - .5) * 24, f.y + (Math.random() - .5) * 20); popText(f.x, f.y - 24, 'FOUND ' + HUNT[f.k].name + '!', '#f6c645'); say('hero', 'GOT IT! NOW TO ' + (LVEND[LV.id] || 'THE END') + '.', 130); }
  }
}
function stepHaul(M, p, hit) {
  const H = M.haul; H.t++;
  if (H.st === 'held') {
    if (hit) {
      if (perk('duffel') && !M.freeDrop) { M.freeDrop = 1; popText(p.x, p.y - 56, 'THE DUFFEL CAUGHT IT!', '#f6c645'); return; }
      const [vx] = curVel(p); H.st = 'loose'; H.t = 0; H.x = p.x; H.y = p.y - 40; H.vx = -sgn(vx || p.face) * 2.2 + (Math.random() - .5); H.vy = -5.5; M.drops++;
      sfx('hurt'); popText(p.x, p.y - 56, 'DROPPED ' + HAUL[H.k].name + '!', '#ff8a5a'); if (M.drops === 1) say('hero', 'GO BACK FOR IT!', 90);
    }
    return;
  }
  H.vy += .25; H.x += H.vx; H.y += H.vy; H.vx *= .985;
  let gy = groundY(H.x) - 8; if (H.x > WATER.x0 && H.x < WATER.x1 && WATER.y - 8 < gy) { gy = WATER.y - 6; if (H.vy > 0) H.vx *= .9; }
  if (H.y > gy) { H.y = gy; H.vy = Math.abs(H.vy) > 1.5 ? -H.vy * .35 : 0; H.vx *= .7; }
  H.x = clamp(H.x, 40, WW - 160);
  const [cx, cy] = bodyC(p);
  if (H.t > 36 && Math.abs(cx - H.x) < 20 && Math.abs(cy - H.y) < 26) { H.st = 'held'; sfx('carrot', 1); popText(p.x, p.y - 56, 'GOT IT BACK!', '#7ad050'); }
}
function stepRoundup(M, p, hit) {
  // newly woken cousins fall in line
  for (const c of S.L.cousins) if (c.woke && !c.joined) { c.joined = true; c.t = 1e9; M.fol.push({ fam: c.fam, x: c.x, y: c.y }); popText(c.x, c.y - 50, M.fol.length + ' OF ' + M.need, '#7ad050'); sfx('crew'); }
  if (hit && M.fol.length) {
    const n = Math.min(M.fol.length, perk('clip') ? 1 : 2);
    for (let i = 0; i < n; i++) { const f = M.fol.pop(); const c = { x: f.x, y: groundY(f.x), fur: 'white', fam: f.fam, woke: false, t: 0, dazed: true }; S.L.cousins.push(c); }
    popText(p.x, p.y - 60, n === 1 ? 'LOST ONE!' : 'LOST ' + n + '!', '#ff8a5a'); if (!M.lostSaid) { M.lostSaid = 1; say('hero', 'GO BACK FOR THEM. THEY\'RE CONFUSED.', 120); }
  }
  const moving = Math.abs(p.ground ? p.gsp : p.vx) > 1.2 || !p.ground;
  M.fol.forEach((f, i) => {
    let tx, ty; const h = S.hist[S.hist.length - 1 - Math.min(S.hist.length - 1, (i + 1) * 6)];
    if (moving && h) { tx = h[0]; ty = h[1]; } else { tx = p.x - (M.rev ? -1 : p.face) * (16 + i * 12); ty = groundY(tx); for (const pl of PLATS) { const py = platY(pl, tx); if (py != null && Math.abs(py - p.y) < 6) ty = py; } }
    f.vx = tx - f.x; f.x += (tx - f.x) * .35; f.y += (ty - f.y) * .35; f.mv = Math.abs(f.vx) > .8;
  });
}
function missionMayFinish() {
  const M = MISSION, p = S.pl; if (!M) return true;
  let why = null;
  if (M.mode === 'hunt' && !M.found) why = 'NOT WITHOUT ' + HUNT[M.find.k].name + '. LISTEN FOR THE PING.';
  if (M.mode === 'haul' && M.haul.st !== 'held') why = 'GO BACK FOR ' + HAUL[M.haul.k].name + '!';
  if (!why) return true;
  const back = M.rev ? 1 : -1; if (p.ground) p.gsp = back * 3.5; else p.vx = back * 3.5; p.x += back * 6;
  if (M.t - (M.whyT || -999) > 150) { M.whyT = M.t; say('hero', why, 130); sfx('bonk'); }
  return false;
}
function missionGoalLine() {
  const M = MISSION, w = M.want ? WANTS[M.want] || SAVE.saga.daily[M.want] : null;
  const lines = { haul: HAUL[(M.haul || {}).k] ? HAUL[M.haul.k].name + ', DELIVERED.' : 'DELIVERED.', roundup: M.fol.length + ' OF ' + M.need + '. GOOD ENOUGH FOR FAMILY.', sprint: M.time > 0 ? 'BEAT THE SUN!' : 'THE SUN WON. I\'M CALLING IT A TIE.', toll: S.carrots >= M.need ? 'THAT\'S ' + M.need + ' CARROTS. PAY THE LADY.' : 'NOT QUITE ENOUGH CARROTS. CLOSE THOUGH.', hunt: 'FOUND IT AND MADE IT.', free: 'NOW THAT\'S A RUN.' };
  if (M.mode === 'roundup' && M.fol.length >= M.need) lines.roundup = 'EVERYBODY\'S HERE. ' + M.need + ' FOR ' + M.need + '.';
  say('hero', lines[M.mode] || 'NOW THAT\'S A RUN.', 150);
}

/* ---------- when the run ends ---------- */
function missionResult() {
  const M = MISSION; let stars = 1, carrots = S.carrots, note = '';
  const items = S.rocks.filter(Boolean).length;
  switch (M.mode) {
    case 'fetch': case 'free': stars = Math.max(1, items); note = items + ' OF 3 ' + itemWord(); if (S.thr) note += ', ' + S.thr.total + ' SKIPS'; break;
    case 'haul': stars = M.drops === 0 ? 3 : M.drops <= 2 ? 2 : 1; note = M.drops === 0 ? 'NOT ONE DROP' : M.drops === 1 ? 'DROPPED IT ONCE' : 'DROPPED IT ' + M.drops + ' TIMES'; break;
    case 'roundup': { const k = M.fol.length / M.need; stars = k >= 1 ? 3 : k >= .6 ? 2 : 1; note = M.fol.length + ' OF ' + M.need + ' COUSINS MADE IT'; break; }
    case 'sprint': stars = M.time >= M.time0 * .2 ? 3 : M.time > 0 ? 2 : 1; note = M.time > 0 ? 'BEAT THE SUN BY ' + Math.ceil(M.time / 60) + ' SECONDS' : 'THE SUN GOT THERE FIRST'; break;
    case 'toll': stars = carrots >= M.need ? 3 : carrots >= M.need * .66 ? 2 : 1; note = Math.min(carrots, M.need) + ' OF ' + M.need + ' CARROTS'; carrots = Math.max(0, carrots - M.need); break;
    case 'hunt': stars = M.foundT < 60 * 75 ? 3 : 2; note = 'FOUND ' + HUNT[M.find.k].name; break;
    case 'drive': { const D = S.drv, tot = D.items.filter(i => i.k === 'gem').length; stars = D.ice >= tot * .3 ? 3 : D.ice >= tot * .12 ? 2 : 1; note = D.ice + ' ICE ON PEACHTREE'; carrots = Math.round(D.ice / 6); break; }
  }
  if (perk('pendant')) carrots = Math.round(carrots * 1.1);
  return { stars, carrots, note, golds: S.golds, found: (S.found || []).slice(), mode: M.mode };
}
function itemWord() { return ({ rock: 'ROCKS', peach: 'PEACHES', sand: 'SAND DOLLARS', box: 'ORANGE BOXES', veg: 'VEGETABLES', snowball: 'SNOWBALLS' })[LV.item] || 'THINGS'; }
function endRun() { const M = MISSION, res = missionResult(); restoreLV(); MISSION = null; sagaRunDone(M, res); }

/* ---------- drawing ---------- */
function missionDrawBack(vis) {
  const M = MISSION; if (!M || M.run === 'icebox') return;
  if (M.goalX != null && vis(M.goalX, 60)) { const x = M.goalX, y = groundY(x); R_(x, y - 44, 2, 44, '#5a3a22'); g.fillStyle = (S.t & 16) ? '#f6c645' : '#ff8a1c'; g.beginPath(); g.moveTo(x + 2, y - 44); g.lineTo(x + (M.rev ? -16 : 18), y - 38); g.lineTo(x + 2, y - 32); g.fill(); }
  if (M.mode === 'hunt' && !M.found && vis(M.find.x)) { const ic = icon(HUNT[M.find.k].ic); g.drawImage(ic, Math.round(M.find.x - 8), Math.round(M.find.y - 10 + Math.sin(S.t * .1) * 2)); }
  if (M.mode === 'roundup') for (let i = M.fol.length - 1; i >= 0; i--) { const f = M.fol[i]; if (!vis(f.x)) continue; const set = famSet(f.fam); drawSpr(f.mv ? set.run[((S.t >> 2) + i) & 3] : set.idle[((S.t >> 5) + i) % 7 === 0 ? 1 : 0], f.x, f.y, 0, f.vx < -.5 ? -1 : f.vx > .5 ? 1 : (M.rev ? -1 : S.pl.face), BAX, BAY); }
  if (M.mode === 'haul' && M.haul.st === 'loose' && vis(M.haul.x)) { const H = M.haul, ic = icon(HAUL[H.k].ic); if (H.t > 36 || (S.t & 4)) g.drawImage(ic, Math.round(H.x - 8), Math.round(H.y - 8)); if (H.t > 36 && S.t % 30 < 15) tx('!', H.x, H.y - 20, '#fff3b0', { oc: '#2a140c', al: 'c' }); }
}
function missionDrawFront() {
  const M = MISSION; if (!M || M.mode !== 'haul' || M.haul.st !== 'held') return; const p = S.pl;
  if (p.inv > 0 && p.inv < 100 && (S.t & 2)) return;
  const onG = p.ground || p.surf === 'loop', a = onG && !p.roll ? p.ang : 0, ball = p.roll || p.ball, up = ball ? 30 : 46;
  const ic = icon(HAUL[M.haul.k].ic), bob = ball ? 0 : ((S.t >> 3) & 1);
  g.drawImage(ic, Math.round(p.x + Math.sin(a) * up - 8), Math.round(p.y - Math.cos(a) * up - 8 - bob));
}
function missionHUD(mid) {
  const M = MISSION; if (!M || M.mode === 'fetch' || M.mode === 'free' || M.run === 'icebox') return false;
  const x = mid + 64, y = 3;
  if (M.mode === 'haul') { g.drawImage(icon(HAUL[M.haul.k].ic), x, y); tx(M.haul.st === 'held' ? (M.drops ? 'DROPS ' + M.drops : 'CARRYING') : 'DROPPED!', x + 19, y + 5, M.haul.st === 'held' ? '#ffffff' : ((S.t & 8) ? '#ff8a5a' : '#ffffff'), { oc: '#2a140c' }); }
  if (M.mode === 'roundup') { face(M.fol.length ? M.fol[M.fol.length - 1].fam : 2, x - 6, y - 5); tx(M.fol.length + '/' + M.need, x + 22, y + 5, M.fol.length >= M.need ? '#7ad050' : '#ffffff', { oc: '#2a140c' }); }
  if (M.mode === 'sprint') { const k = M.time / M.time0, w = 60; g.drawImage(sunIcon(M.time > 0), x, y + 1); R_(x + 14, y + 5, w + 2, 5, '#2a140c'); R_(x + 15, y + 6, Math.round(w * k), 3, k > .3 ? '#ffc020' : k > 0 ? '#ff6a2a' : '#5a4a3e'); }
  if (M.mode === 'toll') { const k = Math.min(1, S.carrots / M.need), w = 60; tx(Math.min(S.carrots, M.need) + '/' + M.need, x, y + 5, k >= 1 ? '#7ad050' : '#ffffff', { oc: '#2a140c' }); R_(x, y + 15, w + 2, 4, '#2a140c'); R_(x + 1, y + 16, Math.round(w * k), 2, k >= 1 ? '#7ad050' : '#ff8a1c'); }
  if (M.mode === 'hunt') {
    g.drawImage(icon(HUNT[M.find.k].ic), x, y);
    if (M.found) tx('FOUND!', x + 19, y + 5, '#7ad050', { oc: '#2a140c' });
    else { const d = M.find.x - S.pl.x, ad = Math.abs(d) + Math.abs(M.find.y - S.pl.y) * .5, bars = ad < 250 ? 3 : ad < 700 ? 2 : 1;
      tx(d < 0 ? '<' : '>', x + 20, y + 5, '#fff3b0', { oc: '#2a140c' }); for (let i = 0; i < 3; i++) R_(x + 30 + i * 5, y + 11 - i * 3, 3, 3 + i * 3, i < bars ? ((S.t % (bars === 3 ? 16 : 40) < 8) ? '#7ad050' : '#3fb04a') : '#4e3220'); }
  }
  return true;
}
// iced-out perk: golden carrots marked on the trip meter
function missionMeterMarks(x0, x1, y) { if (!perk('iced')) return; for (const gc of S.L.golds) if (!gc.got) { const k = clamp((gc.x - LV.start) / (LV.goal - LV.start), 0, 1); R_(Math.round(x0 + (x1 - x0) * k), y - 3, 2, 2, (S.t & 16) ? '#f6c645' : '#fff3b0'); } }
function missionProgress() { const M = MISSION; if (M && M.mode === 'sprint' && M.time0) return clamp(1 - M.time / M.time0, 0, 1) * .97; return null; }
