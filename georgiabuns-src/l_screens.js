/* ================= Georgia Buns — the saga: rules and screens =================
   Rules first (wants, errands, the cookout, a new day), then one draw
   function per screen. Screens are plain canvas; buttons register with hot(). */

const SG = { scr: 'hub', t: 0, d: {}, modal: null };

/* ===================== rules ===================== */
function wantDef(id) { return WANTS[id] || (SAVE.saga.daily || {})[id] || null; }
function wantState(id) { const s = SAVE.saga; return s.wants[id] || (s.wants[id] = { st: 'open', step: 0 }); }
function wantSteps(id) { const W = wantDef(id), st = wantState(id), out = []; for (const sp of W.steps) { out.push(sp); if (sp.drift && st.drift === 'go') out.push(...sp.drift.goSteps); } return out; }
function wantStep(id) { return wantSteps(id)[wantState(id).step] || null; }
function wantRunner(id) { const W = wantDef(id); return W.runner != null ? W.runner : W.who; }
function wantPlace(id) { const sp = wantStep(id); return sp && sp.run ? LVPLACE[sp.run] : null; }
function wantGivesName(id) { const W = wantDef(id); return !W.side && !W.daily && (W.roles || (W.steps.some(s => s.drift))) && !famRole(W.who); }
function isAway(i) { return SAVE.saga.errands.some(e => e.who.includes(i)); }
function openWants() { const s = SAVE.saga; return s.open.filter(id => wantDef(id) && (s.wants[id] || {}).st !== 'done'); }
function knownCount() { let n = 0; for (let i = 0; i < FAM.length; i++) if (famRole(i)) n++; return n; }

// story wants whose time has come join the list
function refreshWants() {
  const s = SAVE.saga, news = [];
  for (const id of STORY_ORDER) { if ((s.wants[id] || {}).st === 'done' || s.open.includes(id)) continue; let ok = false; try { ok = WANTS[id].gate(); } catch (e) {} if (ok) { s.open.push(id); news.push(id); } }
  return news;
}
let DN = 0;
function addDaily(who, force) {
  const s = SAVE.saga, places = Object.keys(s.places).filter(k => s.places[k]);
  const pool = DAILY.filter(d => d.lv.some(l => places.includes(LVPLACE[l])));
  if (!pool.length) return null;
  const T = pool[(Math.random() * pool.length) | 0], lvs = T.lv.filter(l => places.includes(LVPLACE[l])), lv = lvs[(Math.random() * lvs.length) | 0];
  s.dn = (s.dn || 0) + 1; const id = 'd' + s.day + '_' + s.dn;
  const step = { run: lv, mode: T.mode, p: { obj: T.obj, n: T.n }, title: T.mode === 'drive' ? 'CRUISE PEACHTREE' : ({ haul: 'HAUL', toll: 'CARROT RUN', sprint: 'BEAT THE SUN', roundup: 'ROUNDUP', hunt: 'LOST AND FOUND', fetch: 'THREE OF EVERYTHING' })[T.mode] + ': ' + LVNAME[lv],
    tip: ({ haul: 'CARRY IT TO ' + LVEND[lv] + '. BUMPS KNOCK IT LOOSE.', toll: 'COLLECT ' + T.n + ' CARROTS BEFORE ' + LVEND[lv] + '.', sprint: 'GET TO ' + LVEND[lv] + ' BEFORE THE SKY GOES DARK.', roundup: 'WAKE THE COUSINS. THEY FOLLOW YOU.', hunt: 'THE PEBBLE PINGS WHEN YOU\'RE CLOSE.', fetch: 'ALL THREE, THEN ' + LVEND[lv] + '.', drive: 'GRAB ICE. HOP TRAFFIC.' })[T.mode] };
  if (T.mode === 'drive') { step.drive = 1; step.run = 'icebox'; }
  s.daily[id] = { daily: 1, who, text: T.text, sub: 'A SMALL ONE. HE JUST WOKE UP WANTING IT.', steps: [step], reward: { carrots: 25 + (T.bonus || 0), food: T.food, record: T.record } };
  s.open.push(id); return id;
}
function addDailies() {
  const s = SAVE.saga, open = openWants(); let n = open.filter(id => s.daily[id]).length;
  const busy = new Set(open.map(id => wantDef(id).who));
  const cands = []; for (let i = 1; i < FAM.length; i++) if (!busy.has(i) && (famRole(i) || i === 1 || s.day > 4)) cands.push(i);
  const news = [];
  for (const i of (s.dream || [])) if (!busy.has(i)) { const id = addDaily(i); if (id) { news.push(id); busy.add(i); n++; } }
  s.dream = [];
  while (n < 2 && cands.length && s.day >= 2) { const k = (Math.random() * cands.length) | 0, i = cands.splice(k, 1)[0]; if (busy.has(i)) continue; const id = addDaily(i); if (!id) break; news.push(id); busy.add(i); n++; }
  // old dailies fade after three days
  s.open = s.open.filter(id => { if (!s.daily[id]) return true; const d = +id.slice(1).split('_')[0]; if (s.day - d > 3) { delete s.daily[id]; return false; } return true; });
  return news;
}
function postErrands() {
  const s = SAVE.saga, ids = Object.keys(ERRANDS).filter(k => s.places[ERRANDS[k].place]); const out = [];
  if (s.day === 2) out.push('ice');
  while (out.length < 3 && ids.length) { const k = ids.splice((Math.random() * ids.length) | 0, 1)[0]; if (!out.includes(k)) out.push(k); }
  s.errands = out.map(id => ({ id, who: [] }));
}
function newDay() {
  const s = SAVE.saga; s.day++; s.sun = sunsPerDay(); s.today = { stars: 0, place: 'forest', news: [] }; s.errands = [];
  const news = refreshWants().concat(addDailies());
  if (s.day >= 2) postErrands();
  if (!s.call) for (const k in CALLS) if (!s.calls[k]) { let ok = false; try { ok = CALLS[k].when(s); } catch (e) {} if (ok) { s.call = k; break; } }
  s.today.news = news; writeSave(); return news;
}
function rewardList(R, who) {
  const out = []; if (!R) return out;
  if (R.carrots) out.push({ ic: A.carrot[0], label: '+' + R.carrots });
  for (const k of R.stash || []) out.push({ ic: icon(STASH[k].ic), label: STASH[k].name });
  for (const k in R.food || {}) if (R.food[k]) out.push({ ic: icon(FOOD[k].ic), label: R.food[k] + ' ' + FOOD[k].name });
  if (R.guest) out.push({ ic: null, label: GUESTS[R.guest].name + ' COMES TO COOKOUTS' });
  if (R.record) out.push({ ic: icon(['record', '#ff4fa0']), label: 'A RECORD' });
  return out;
}
function applyReward(R, gains) {
  const s = SAVE.saga; if (!R) return;
  if (R.carrots) bankAdd(R.carrots);
  for (const k of R.stash || []) { if (giveStash(k)) gains.push({ ic: icon(STASH[k].ic), label: 'NEW: ' + STASH[k].name }); }
  for (const k in R.food || {}) if (R.food[k]) { giveFood(k, R.food[k]); gains.push({ ic: icon(FOOD[k].ic), label: '+' + R.food[k] + ' ' + FOOD[k].name }); }
  if (R.guest && !s.guests[R.guest]) { s.guests[R.guest] = 1; gains.push({ ic: null, label: GUESTS[R.guest].name + ' WILL COME TO COOKOUTS' }); }
  if (R.record) { const r = unownedRecord(); if (r) { giveStash(r); gains.push({ ic: icon(STASH[r].ic), label: 'RECORD: ' + STASH[r].name }); } else { bankAdd(40); gains.push({ ic: A.carrot[0], label: '+40 (SOLD A DUPLICATE RECORD)' }); } }
  for (const p of R.opens || []) s.places[p] = 1;
}
function completeWant(id, stars, out) {
  const s = SAVE.saga, W = wantDef(id), st = wantState(id), go = st.drift === 'go', dr = W.steps.find(x => x.drift);
  st.st = 'done'; st.stars = Math.max(st.stars || 0, stars); s.open = s.open.filter(x => x !== id);
  let R = go ? dr.drift.goReward : W.reward, land = go ? dr.drift.goLand : W.land;
  if (W.lowReward && stars < 3) { R = W.lowReward; land = W.lowLand; }
  out.gains = out.gains || []; applyReward(Object.assign({}, R, { carrots: (R.carrots || 0) + stars * 10 }), out.gains);
  if (W.opens) for (const p of W.opens) if (!s.places[p]) { s.places[p] = 1; out.gains.push({ ic: null, label: 'NEW ON THE MAP: ' + PLACES[p].name }); }
  if (W.who > 1) { s.fam[W.who].qk = true; }
  const roles = go ? dr.drift.goRoles : W.roles;
  if (roles && !famRole(W.who) && !W.side && !W.daily) out.role = { fam: W.who, opts: roles };
  out.land = land; out.title = W.finale ? 'THE BIGGEST COOKOUT' : 'WANT DONE!'; out.want = id; out.done = true;
  if (W.daily) { delete s.daily[id]; }
  if (W.finale) { s.finale = true; out.finale = true; }
  const news = refreshWants(); out.news = news;
}
// a run came back
function sagaRunDone(M, res) {
  const s = SAVE.saga; s.log.runs++; s.today.stars += res.stars; s.log.stars += res.stars;
  bankAdd(res.carrots);
  const out = { M, res, gains: [], title: M.want ? 'STEP DONE' : 'RUN DONE' };
  if (M.drip) out.gains.push({ ic: icon(STASH[M.drip].ic), label: 'NEW: ' + STASH[M.drip].name });
  if (M.want && wantDef(M.want)) {
    const st = wantState(M.want); st.step = M.stepIdx + 1; st.last = res.stars; st.stars = Math.max(st.stars || 0, res.stars);
    if (st.step >= wantSteps(M.want).length) completeWant(M.want, res.stars, out);
    else { out.next = true; out.want = M.want; }
  }
  writeSave(); enterSaga('result', out);
}

/* ---------- errands: what actually comes back ---------- */
function runErrand(eid, i) {
  const E = ERRANDS[eid], q = FAM[i].quirk, s = SAVE.saga, base = E.ok, lit = E.lit, fan = E.fancy;
  const plus = (o, extra) => Object.assign({}, o, extra);
  const scale = (o, k, say) => { const f = {}; for (const x in o.food || {}) f[x] = Math.max(1, Math.round(o.food[x] * k)); return plus(o, { food: o.food ? f : undefined, record: o.record ? Math.max(1, Math.round(o.record * k)) : undefined, say }); };
  let r;
  switch (q) {
    case 'fancy': if (s.bank >= (fan.cost || 0)) { r = plus(fan, { say: fan.say + ' (-' + (fan.cost || 0) + ' CARROTS)' }); bankAdd(-(fan.cost || 0)); } else r = plus(base, { say: base.say + ' WANTED THE FANCY ONE. COULDN\'T AFFORD IT.' }); break;
    case 'literal': r = lit; break;
    case 'lost': { const sv = SOUVENIRS[(Math.random() * SOUVENIRS.length) | 0]; r = plus(sv[1], { say: 'ENDED UP IN ' + sv[0] + '. NOBODY KNOWS HOW. BROUGHT BACK ' + sv[2] + '.' }); break; }
    case 'country': r = { food: { peach: 1, corn: 1 }, say: 'DROVE TO THE FARM INSTEAD. CAME BACK WITH A PEACH, SOME CORNBREAD, AND A LONG STORY ABOUT SEVEN.' }; break;
    case 'sleepy': r = Math.random() < .5 ? { say: 'NAPPED UNDER A PINE TREE ALL DAY. SAYS IT WAS A VERY PRODUCTIVE NAP.' } : plus(base, { say: base.say + ' TOOK A NAP FIRST.' }); break;
    case 'hungry': r = base.food ? scale(base, .5, base.say + ' ATE HALF OF IT IN THE ESCALADE.') : { food: { ribs: 1 }, say: 'FORGOT WHAT YOU ASKED FOR. GOT RIBS INSTEAD. ATE ONE.' }; break;
    case 'haggler': r = scale(base, 2, base.say + ' HE KNOWS A GUY. GOT DOUBLE.'); break;
    case 'speedy': r = scale(base, 2, base.say + ' WENT TWICE BEFORE LUNCH.'); break;
    case 'musical': r = plus(base, { record: (base.record || 0) + 1, say: base.say + ' ALSO A RECORD. "IT WAS CALLING TO ME."' }); break;
    case 'social': r = plus(base, { vibes: 6, say: base.say + ' AND HE BROUGHT A FRIEND HE MET IN LINE. THE FRIEND IS STAYING FOR DINNER.' }); break;
    case 'lucky': r = plus(base, { carrots: (base.carrots || 0) + 40, say: base.say + ' ALSO FOUND FORTY CARROTS IN THE PARKING LOT.' }); break;
    case 'handy': r = plus(base, { carrots: (base.carrots || 0) + 25, say: base.say + ' FIXED THE CASHIER\'S STOOL ON THE WAY OUT. GOT TIPPED.' }); break;
    case 'nervous': r = Math.random() < .4 ? { say: 'SAW SOMETHING THAT MIGHT HAVE BEEN A BOBCAT. CAME STRAIGHT HOME. IT WAS A REGULAR CAT.' } : plus(base, { say: base.say + ' DIDN\'T SEE ONE BOBCAT. CHECKED THE WHOLE TIME.' }); break;
    case 'showoff': r = plus(base, { vibes: 4, say: base.say + ' CARRIED IT HOME OVER HIS HEAD SO EVERYBODY COULD SEE.' }); break;
    case 'dreamer': r = plus(base, { dream: 1, say: base.say + ' ALSO HE WANTS SOMETHING BRAND NEW NOW. YOU\'LL HEAR ABOUT IT IN THE MORNING.' }); break;
    case 'nibbler': r = base.food ? scale(base, .5, base.say + ' WITH BITE MARKS. ABOUT HALF A BITE MARK\'S WORTH.') : plus(base, { say: base.say + ' NIBBLED A LITTLE. STILL WORKS.' }); break;
    default: r = base;
  }
  const gains = [];
  for (const k in r.food || {}) if (r.food[k]) { giveFood(k, r.food[k]); gains.push({ ic: icon(FOOD[k].ic), label: r.food[k] + ' ' + FOOD[k].name }); }
  if (r.stash) { if (giveStash(r.stash)) gains.push({ ic: icon(STASH[r.stash].ic), label: STASH[r.stash].name }); else { bankAdd(30); gains.push({ ic: A.carrot[0], label: 'ALREADY HAD ONE. SOLD IT: +30' }); } }
  for (let k = 0; k < (r.record || 0); k++) { const rec = unownedRecord(); if (rec) { giveStash(rec); gains.push({ ic: icon(STASH[rec].ic), label: STASH[rec].name }); } else { bankAdd(20); gains.push({ ic: A.carrot[0], label: '+20' }); } }
  if (r.carrots) { bankAdd(r.carrots); gains.push({ ic: A.carrot[0], label: '+' + r.carrots }); }
  if (r.dream) (s.dream = s.dream || []).push(i);
  const first = !s.fam[i].qk; s.fam[i].qk = true;
  return { who: i, eid, line: r.say, gains, vibes: r.vibes || 0, reveal: first ? QUIRKS[q].name : null };
}

/* ---------- the cookout ---------- */
const TIERS = [[0, 'QUIET NIGHT'], [25, 'DECENT'], [50, 'THAT\'S A COOKOUT'], [80, 'TALK OF THE FOREST'], [120, 'LEGENDARY'], [160, 'BIGGEST IN GEORGIA']];
function startSagaCook() {
  const s = SAVE.saga, reports = [];
  for (const e of s.errands) for (const i of e.who) reports.push(runErrand(e.id, i));
  // the spread: up to six dishes, best first
  const ks = Object.keys(s.pantry).filter(k => s.pantry[k] > 0 && FOOD[k]).sort((a, b) => FOOD[b].vibes - FOOD[a].vibes).slice(0, 6), spread = [];
  for (const k of ks) { s.pantry[k]--; spread.push(k); }
  const food = spread.reduce((n, k) => n + FOOD[k].vibes, 0) + spread.length * 2;
  const family = FAM.length + knownCount() + reports.reduce((n, r) => n + r.vibes, 0);
  const friends = Object.keys(s.guests).reduce((n, k) => n + (GUESTS[k] ? GUESTS[k].vibes : 0), 0);
  const stuff = Math.min(40, Object.keys(s.stash).reduce((n, k) => n + (STASH[k] ? STASH[k].vibes || 0 : 0), 0));
  const today = s.today.stars * 2;
  const total = food + family + friends + stuff + today, tier = TIERS.filter(t => total >= t[0]).pop()[1], tip = Math.round(total / 2);
  bankAdd(tip); s.log.best = Math.max(s.log.best, total); s.log.vibes += total; s.log.days++;
  s.errands.forEach(e => e.who = []);
  const scene = { forest: 'home', atl: 'icebox', farm: 'farm', marsh: 'marsh', paris: 'riviera', boulder: 'snow' }[s.today.place] || 'home';
  const roster = []; for (let i = 1; i < FAM.length; i++) roster.push(i);
  if (s.guests.dexter) roster.splice(4, 0, 'dexter'); if (s.guests.pontoon) roster.splice(9, 0, 'pontoon'); if (s.guests.boulder) roster.push('bb1', 'bb2', 'bb3');
  writeSave();
  sagaGo('cook', { phase: reports.length ? 'reports' : 'spread', ri: 0, reports, spread, rows: [['FOOD', food], ['FAMILY', family], ['FRIENDS', friends], ['STUFF', stuff], ['TODAY', today]], total, tier, tip,
    C: { t: 0, scene, roster, wide: 360, extra: cookGuests }, finale: !!SG.d.finale });
}
function cookGuests(t, gy) {
  const s = SAVE.saga;
  if (s.guests.snails) { R_(150, gy - 16, 40, 4, '#2a2430'); R_(154, gy - 12, 3, 12, '#2a2430'); R_(183, gy - 12, 3, 12, '#2a2430'); g.drawImage(A.snail[(t >> 3) & 1], 146, gy - 46); g.drawImage(A.snail[((t >> 3) + 1) & 1], 168, gy - 46); }
  if (s.guests.elli) { g.drawImage(A.elli[(t >> 4) & 1], 330, gy - 46); }
  if (s.guests.elli && SG.d.C && SG.d.C.scene !== 'farm') drawSpr(A.seven.stand[0], 392, gy + 2, 0, -1, 34, 52);
}
function finishCook() {
  const news = newDay();
  sagaGo('morning', { news });
}

/* ===================== screens ===================== */
function enterSaga(scr, d) {
  fixSaga(); if (MISSION) { restoreLV(); MISSION = null; }
  const s = SAVE.saga;
  S = { mode: 'saga', t: 0, parts: [], bubbles: [], sayQ: [], card: null, fade: 0, fadeTo: null, pl: { x: 0, y: 0, face: 1 }, day: 'creek', scat: [], hist: [], rocks: [], golds: 0, found: [] };
  if (!scr) scr = s.started ? 'hub' : 'intro';
  sagaGo(scr, d); $('again').hidden = true;
}
function sagaGo(scr, d) {
  SG.scr = scr; SG.t = 0; SG.d = d || {}; SG.modal = null; uiReset(); if (S) S.parts = [];
  const song = { cook: 'cookout', morning: 'lawn', intro: 'lawn', shop: SG.d.id && SHOPS[SG.d.id] ? SHOPS[SG.d.id].song : 'title', name: 'crew', result: 'crew' }[scr] || 'title';
  auMode(song);
}
function confirmBox(text, yes, fnYes, no) { SG.modal = { text, yes, fnYes, no: no || 'NOT YET' }; uiReset(); }
function stepSaga() {
  SG.t++;
  uiInput();
  const s = SAVE.saga;
  if (SG.scr === 'cook') { const C = SG.d.C; C.t++; if (C.t % 6 === 0) part({ type: 'smoke', x: 296 + Math.random() * 4, y: NH - 86, vx: .2 + Math.random() * .2, vy: -.5, life: 90 }); if (SG.d.phase === 'credits') SG.d.ct = (SG.d.ct || 0) + 1; }
  if (SG.scr === 'hub' && s.call && SG.t % 90 === 1) sfx('tap');
  // build the family's sprites a few at a time so a big roundup doesn't stall
  for (let i = 2; i < FAM.length; i++) if (!FAMSET[i] && !(i === 2 && SAVE.drip)) { famSet(i); break; }
}
function drawSaga() {
  g.imageSmoothingEnabled = false;
  UIH.mute = !!SG.modal;
  const fn = SCREENS[SG.scr] || SCREENS.hub; fn();
  UIH.mute = false;
  if (SG.modal) drawModal();
  { const h = UIH.list[UIH.focus]; if (UIH.kb && h && !h.o.label && (S.t & 16)) { g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.strokeRect(Math.round(h.x) + .5, Math.round(h.y) + .5, Math.round(h.w) - 1, Math.round(h.h) - 1); } }
  drawToast();
  uiFlush();
}
function drawModal() {
  const M = SG.modal; g.globalAlpha = .6; R_(0, 0, NW, NH, '#140a06'); g.globalAlpha = 1;
  const w = 260, lines = txWrap(M.text, 38), h = lines.length * 10 + 46, x = Math.round(NW / 2 - w / 2), y = Math.round(NH / 2 - h / 2);
  woodPanel(x, y, w, h); lines.forEach((l, i) => tx(l, NW / 2, y + 10 + i * 10, '#fff3b0', { al: 'c', oc: '#2a140c' }));
  btn(x + 14, y + h - 24, 110, 16, M.yes, () => { const f = M.fnYes; SG.modal = null; uiReset(); f(); }, { gold: 1 });
  btn(x + w - 124, y + h - 24, 110, 16, M.no, () => { SG.modal = null; uiReset(); });
}
function topBar(title, back) {
  g.globalAlpha = .85; R_(0, 0, NW, 21, '#1a0e0a'); g.globalAlpha = 1; R_(0, 21, NW, 1, '#4e3220');
  if (back) backBtn(back);
  if (title) tx(title, NW / 2, 7, '#f6c645', { al: 'c', oc: '#2a140c' });
  bankSuns(NW - (UI.pauseV || 24) - 2, 7);
}
function bankSuns(xr, y) {
  const s = SAVE.saga, str = String(s.bank), w = textW(str) + 13; carrots(s.bank, xr - w, y);
  const n = sunsPerDay(); for (let i = 0; i < n; i++) g.drawImage(sunIcon(i < s.sun), xr - w - 8 - (n - i) * 12, y - 2);
}
function plaque(x, y, label, o) {
  o = o || {}; const w = textW(label) + 8; x = Math.round(x - w / 2); y = Math.round(y);
  R_(x - 1, y - 1, w + 2, 12, '#2a140c'); R_(x, y, w, 10, o.hot ? ((S.t & 32) ? '#ffd860' : '#f6c645') : '#a07448'); R_(x, y, w, 1, o.hot ? '#fff3b0' : '#c89a6a');
  tx(label, x + 4, y + 2, o.hot ? '#2a140c' : '#fff3e0');
}
function fillEll(cx, cy, rx, ry, col) { g.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); } }
function silhouette(c) { if (c.sil) return c.sil; const o = mkC(c.width, c.height), x = o.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#2a140c'; x.fillRect(0, 0, c.width, c.height); c.sil = o; return o; }
function bounceArrow(x, y) { const b = Math.round(Math.sin(S.t * .15) * 3); g.fillStyle = '#2a140c'; for (let i = 0; i < 7; i++) g.fillRect(x - i - 1, y + b - i - 1, i * 2 + 3, 1); g.fillStyle = '#f6c645'; for (let i = 0; i < 6; i++) g.fillRect(x - i, y + b - i - 1, i * 2 + 1, 1); }
function bubbleIcon(x, y, ic, pulse) {
  x = Math.round(x); y = Math.round(y) + (pulse ? Math.round(Math.sin(S.t * .12) * 1.5) : 0);
  R_(x - 11, y - 10, 22, 19, '#2a140c'); R_(x - 10, y - 11, 20, 21, '#2a140c'); R_(x - 10, y - 9, 20, 17, '#ffffff'); R_(x - 9, y - 10, 18, 19, '#ffffff');
  R_(x - 2, y + 9, 4, 2, '#2a140c'); R_(x - 1, y + 9, 2, 1, '#ffffff'); R_(x - 1, y + 11, 2, 2, '#2a140c');
  if (ic) g.drawImage(ic, x - 8, y - 8);
}
function stepIcon(sp) {
  if (!sp) return null; if (sp.drift) return icon(['note', '#f4ead0', '#ff8a9a']);
  if (sp.mode === 'haul') return icon(HAUL[(sp.p || {}).obj || 'melon'].ic); if (sp.mode === 'hunt') return icon(HUNT[(sp.p || {}).obj || 'chain'].ic);
  if (sp.mode === 'roundup') return icon(['clip', '#a07448']); if (sp.mode === 'sprint') return sunIcon(true); if (sp.mode === 'toll') return A.carrot[0];
  if (sp.mode === 'drive') return icon(['ice', '#e8f6ff', '#9ae8ff']);
  const it = A.items[LEVELS[sp.run] && LEVELS[sp.run].item]; return it ? it[0] : null;
}
const MODEWORD = { fetch: 'FIND THREE', haul: 'HAUL IT', roundup: 'ROUND THEM UP', sprint: 'BEAT THE SUN', toll: 'CARROT RUN', hunt: 'LOST AND FOUND', drive: 'DRIVE', free: 'FREE RUN' };

/* ---------- the burrow ---------- */
function burrowLayout() {
  const H = NH, gy = Math.round(H * .56), houseH = clamp(Math.round(H * .27), 52, 84), wallTop = gy - houseH, roofH = clamp(Math.round(H * .08), 14, 24);
  return { H, gy, wallTop, roofTop: wallTop - roofH, cy: Math.round(gy + (H - gy) * .56), ry: Math.round((H - gy) * .36) };
}
function drawBurrowScene(L, featured) {
  const s = SAVE.saga, t = S.t, { H, gy, wallTop, roofTop, cy, ry } = L;
  const spent = clamp(1 - s.sun / sunsPerDay(), 0, 1), [top, bot] = skyAt(.08 + spent * .9);
  for (let i = 0; i < 20; i++) R_(0, Math.floor(gy * i / 20), NW, Math.ceil(gy / 20) + 1, css(mixRGB(top, bot, i / 19)));
  const sx = 40 + spent * 300, sy = gy - 24 - Math.sin((.1 + spent * .8) * Math.PI) * (gy * .5); const sc = mixRGB(rgb('#fff6c8'), rgb('#ff8a3a'), spent);
  g.globalAlpha = .25; pixCircle(sx, sy, 15, css(sc)); g.globalAlpha = 1; pixCircle(sx, sy, 10, css(sc));
  { const city = forestBase().find(l => l.city).c; g.globalAlpha = .85; g.drawImage(city, -60, gy - city.height + 8); g.globalAlpha = 1; }
  for (let x = -6; x < NW + 10; x += 13) { const r = 9 + ((x * 7) % 6); pixCircle(x, gy - 6 - ((x * 3) % 5), r, (x / 13) & 1 ? '#2c5a24' : '#33692a'); }
  // ground and clay
  for (let y = gy; y < H; y += 3) R_(0, y, NW, 3, css(CLAY[(Math.floor((y - gy) / 9) + 5) % 5]));
  for (let i = 0; i < 60; i++) R_((i * 67) % NW, gy + 6 + (i * 37) % (H - gy - 6), 2, 1, i % 3 ? '#7a2a14' : '#d07850');
  R_(0, gy - 2, NW, 5, '#4ea232'); R_(0, gy - 3, NW, 1, '#8ad860'); for (let x = 0; x < NW; x += 3) if (hash(x, 3) < .5) R_(x, gy - 4, 1, 2, '#62b83a');
  // underground: the stash vault and the pine straw dorm
  const tun = (x0, y0, x1, y1) => { for (let k = 0; k <= 1; k += .02) fillEll(lerp(x0, x1, k), lerp(y0, y1, k), 7, 6, '#3b1d10'); };
  tun(240, gy + 2, 212, cy - 6);
  fillEll(104, cy, 94, ry, '#3b1d10'); fillEll(318, cy, 96, ry, '#3b1d10');
  g.globalAlpha = .16; pixCircle(104, cy - ry * .3, 40, '#ffd68a'); pixCircle(318, cy - ry * .3, 40, '#ffd68a'); g.globalAlpha = 1;
  R_(100, cy - ry + 2, 1, 6, '#2a140c'); R_(97, cy - ry + 8, 7, 4, '#ffe9a0'); R_(314, cy - ry + 2, 1, 6, '#2a140c'); R_(311, cy - ry + 8, 7, 4, '#ffe9a0');
  // shelves
  const owned = Object.keys(s.stash).filter(k => STASH[k]), rows = 3, per = 9, sh = Math.max(14, Math.floor((ry * 2 - 14) / rows));
  for (let r = 0; r < rows; r++) { const y = cy - ry + 12 + (r + 1) * sh; R_(28, y, 152, 3, '#8a5a3a'); R_(28, y + 3, 152, 1, '#5a3a22'); }
  owned.slice(-rows * per).forEach((k, i) => { const r = Math.floor(i / per), c = i % per, y = cy - ry + 12 + (r + 1) * sh; g.drawImage(icon(STASH[k].ic), 30 + c * 16, y - 16); });
  // beds
  const sleepers = [];
  for (let i = 2; i < FAM.length && sleepers.length < 4; i++) if (!featured.includes(i) && !isAway(i)) sleepers.push(i);
  for (let b = 0; b < 8; b++) { const bx = 236 + b * 20, by = cy + ry - 8; R_(bx - 8, by - 2, 18, 4, '#c8913a'); R_(bx - 7, by - 4, 16, 2, '#e8b85e'); for (let k = 0; k < 5; k++) R_(bx - 8 + k * 4, by - 5 + (k & 1), 3, 1, '#d8a04a'); }
  sleepers.forEach((i, k) => { const bx = 236 + (k * 2 + 1) * 20 - 10, by = cy + ry - 8; drawSpr(famSet(i).sleep[0], bx, by, 0, k & 1 ? 1 : -1, BAX, BAY); if ((t + k * 25) % 100 === 0) part({ type: 'z', x: bx + 6, y: by - 16, vx: .2, vy: -.4, life: 60 }); });
  // the house, cut away
  const x0 = 4, x1 = 252;
  for (let y = roofTop; y < wallTop; y++) { const k = (y - roofTop) / (wallTop - roofTop), a = lerp(x0 + 34, x0 - 6, k), b = lerp(x1 - 34, x1 + 6, k); R_(a, y, b - a, 1, (Math.floor((y - roofTop) / 4) & 1) ? '#4a3648' : '#574258'); }
  R_(x0 + 34, roofTop - 1, x1 - x0 - 68, 2, '#2a140c'); R_(196, roofTop - 12, 10, 12, '#7a3a2a'); R_(194, roofTop - 14, 14, 3, '#5a2a1e');
  R_(x0, wallTop, x1 - x0, gy - wallTop, '#e2b77a'); R_(x0, wallTop, 118, gy - wallTop, '#6a5a52');
  for (let y = wallTop + 4; y < gy - 14; y += 6) R_(126, y, x1 - 126, 1, '#d6a86c');
  R_(126, gy - 14, x1 - 126, 10, '#c08a50'); R_(126, gy - 14, x1 - 126, 1, '#e8c890');
  R_(x0, gy - 4, x1 - x0, 4, '#8a5a32'); for (let x = x0; x < x1; x += 12) R_(x, gy - 4, 1, 4, '#6a4224');
  R_(x0 - 2, wallTop, 3, gy - wallTop, '#a07448'); R_(120, wallTop, 6, gy - wallTop, '#a07448'); R_(x1 - 2, wallTop, 4, gy - wallTop, '#a07448'); R_(x0 - 2, wallTop - 2, x1 - x0 + 4, 3, '#7a5236');
  R_(x0 + 2, wallTop + 2, 116, 4, '#4a3e38'); for (let y = wallTop + 6; y < wallTop + 18; y += 3) R_(x0 + 2, y, 116, 1, '#5a4e48');
  // Escalade in the garage
  if (has('neon')) { g.globalAlpha = .45 + .15 * Math.sin(t * .1); R_(10, gy - 7, 104, 4, '#ff4fa0'); g.globalAlpha = 1; }
  g.drawImage(A.escL, 6, gy - 52);
  // living room: postcards, couch, record player, phone, fridge
  const ph = Math.min(26, gy - wallTop - 34);
  for (let i = 0; i < 4; i++) { const px = 132 + i * 12, py = wallTop + 8 + (i & 1) * 3; R_(px, py, 10, 8, '#2a140c'); R_(px + 1, py + 1, 8, 6, ['#5aa8ff', '#ffd890', '#ffb070', '#8d9ccb'][i]); R_(px + 1, py + 5, 8, 2, ['#5cb83a', '#7ccf4a', '#f2dca8', '#9a9488'][i]); }
  R_(130, gy - 22, 46, 10, '#7a3a5a'); R_(130, gy - 22, 46, 2, '#9a4a72'); R_(127, gy - 26, 6, 22, '#6a2e4c'); R_(173, gy - 26, 6, 22, '#6a2e4c'); R_(132, gy - 12, 42, 8, '#9a4a72'); R_(132, gy - 12, 42, 1, '#b8628c');
  R_(176, gy - 24, 2, 2, '#3b1d10'); R_(175, gy - 21, 2, 2, '#3b1d10');
  R_(188, gy - 18, 20, 14, '#5a3a22'); R_(188, gy - 18, 20, 2, '#7a5236'); R_(190, gy - 24, 16, 6, '#2a2430'); g.fillStyle = '#1a1420'; pixCircle(198, gy - 22, 3, '#1a1420'); R_(197, gy - 23, 2, 1, ['#f6c645', '#ff4fa0', '#7ad050'][(t >> 4) % 3]);
  const ring = s.call && (t & 8); g.drawImage(A.phone[(t >> 4) & 1], 168 + (ring ? ((t >> 1) & 1) * 2 - 1 : 0), roofTop - 22);
  if (s.call && t % 40 < 20) { tx('!', 176, roofTop - 34, '#fff3b0', { oc: '#2a140c' }); }
  R_(226, wallTop + 6, 22, gy - wallTop - 10, '#2a140c'); R_(227, wallTop + 7, 20, gy - wallTop - 12, '#e8ece8'); R_(227, wallTop + 7 + Math.round((gy - wallTop) * .35), 20, 1, '#9aa3ad'); R_(244, wallTop + 12, 1, 8, '#9aa3ad');
  R_(230, wallTop + 11, 13, 16, '#fff8e0'); for (let k = 0; k < 4; k++) R_(232, wallTop + 14 + k * 3, 9, 1, '#7a5236');
  // lawn: mailbox, garden, grill, Sunny's oak
  R_(260, gy - 24, 2, 22, '#6a4224'); R_(255, gy - 30, 12, 8, '#3a5aa8'); R_(255, gy - 30, 12, 1, '#6a8ad8'); if (s.errands.length && s.errands.some(e => !e.who.length) && (t & 32)) R_(266, gy - 34, 2, 6, '#e03030');
  for (let r = 0; r < 3; r++) for (let x = 296; x < 344; x += 6) { R_(x, gy - 3 - r * 2, 4, 1, '#5a3a24'); if (hash(x, r) < .7) R_(x + 1, gy - 6 - r * 2, 1, 3, '#3fb04a'); }
  const gx = 366; R_(gx, gy - 22, 26, 12, '#1a1a1e'); R_(gx, gy - 22, 26, 3, '#34343a'); R_(gx + 3, gy - 10, 2, 9, '#2a2a30'); R_(gx + 21, gy - 10, 2, 9, '#2a2a30'); R_(gx + 11, gy - 32, 4, 10, '#2a2a30');
  if (s.sun === 0 || (t & 8)) R_(gx + 4, gy - 24, 18, 2, '#ff6a2a');
  if (t % 9 === 0) part({ type: 'smoke', x: gx + 13, y: gy - 30, vx: .15, vy: -.45, life: 70 });
  R_(402, wallTop - 30, 16, gy - wallTop + 30, '#4a2e1e'); R_(402, wallTop - 30, 4, gy - wallTop + 30, '#5e3c28');
  for (let i = 0; i < 12; i++) pixCircle(396 + (i % 4) * 9, 24 + Math.floor(i / 4) * 9 + (i & 1) * 3, 13, i % 3 ? '#2c5a24' : '#3f7a2a');
  for (let i = 0; i < 6; i++) pixCircle(392 + (i % 3) * 13, 30 + Math.floor(i / 3) * 12, 6, '#4f8f34');
  g.drawImage(A.sq[(t % 90 < 10) ? 1 : 0], 398, Math.max(46, wallTop - 32));
  // the Roof Bun up top, the Nibbin' Bun on the couch
  drawSpr(A.roof.wave[(t >> 4) & 1], 150, roofTop + 1, 0, 1, BAX, BAY);
  drawSpr(A.nib.chomp[(t % 90 < 50) ? (t >> 2) & 1 : 0], 158, gy - 11, 0, 1, BAX, BAY);
  for (const q of S.parts) drawPart(q);
}
const SCREENS = {};
SCREENS.hub = function () {
  const s = SAVE.saga, L = burrowLayout(), { gy, wallTop, roofTop, cy, ry } = L, t = S.t;
  const open = openWants(), featured = [], fw = {};
  for (const id of open) { const w = wantDef(id).who; if (w > 1 && !featured.includes(w) && featured.length < 4) { featured.push(w); fw[w] = id; } else if (w <= 1 && !fw[w]) fw[w] = id; }
  drawBurrowScene(L, featured);
  const slots = [204, 288, 328, 350].slice(0, featured.length); if (featured.length === 4) slots.splice(0, 4, 204, 282, 318, 352);
  // hot spots for the house
  hot(4, wallTop, 116, gy - wallTop, () => sagaGo('map'));
  hot(126, wallTop + 4, 52, 14, () => enterScrapbook());
  hot(164, roofTop - 26, 34, 26, () => s.call ? sagaGo('phone', { id: s.call, i: 0 }) : toast('THE PEBBLE PHONE. IT ONLY GETS SIGNAL ON THE ROOF. NOBODY\'S CALLING.'));
  hot(186, gy - 26, 24, 22, () => toast(Object.keys(s.stash).filter(k => STASH[k] && STASH[k].cat === 'records').length + ' RECORDS. PICK ANY SONG FROM THE PAUSE MENU.'));
  hot(224, wallTop + 4, 26, gy - wallTop - 6, () => sagaGo('wants'));
  hot(252, gy - 34, 18, 32, () => s.day >= 2 ? sagaGo('wants', { tab: 'errands' }) : toast('NO ERRANDS UNTIL TOMORROW. THE COUSINS ARE STILL WAKING UP.'));
  hot(360, gy - 40, 38, 40, () => s.sun > 0 ? confirmBox('CALL IT A DAY? YOU STILL HAVE ' + s.sun + (s.sun > 1 ? ' SUNS' : ' SUN') + ' LEFT.', 'COOKOUT', startSagaCook) : startSagaCook(), { snd: 'crew' });
  hot(10, cy - ry, 188, ry * 2, () => sagaGo('stash'));
  hot(222, cy - ry, 192, ry * 2, () => sagaGo('family'));
  hot(132, roofTop - 44, 32, 44, () => s.call ? sagaGo('phone', { id: s.call, i: 0 }) : toast(fw[0] ? 'THE ROOF BUN WANTS SOMETHING. CHECK THE WANT LIST.' : ['NICE DAY FOR IT. FROM UP HERE.', 'I CAN SEE THE CREEK. AND THE BOBCAT. HE CAN SEE ME.', 'NOT COMING DOWN. DON\'T ASK.'][Math.floor(t / 300) % 3]));
  hot(140, gy - 54, 36, 44, () => fw[1] ? sagaGo('brief', { id: fw[1] }) : toast(['THE COUCH TASTES LIKE TUESDAY.', 'I\'M NOT EATING IT. I\'M TESTING IT.', 'HAVE Y\'ALL TRIED THE MAILBOX?'][Math.floor(t / 300) % 3]));
  hot(392, 20, 32, wallTop, () => toast(['SUNNY: HMM.', 'SUNNY: I SEE YOU, BOYS.', 'SUNNY: SLOW DOWN.'][Math.floor(t / 300) % 3]));
  // cousins who want something
  featured.forEach((i, k) => { const x = slots[k], y = gy - 3, id = fw[i], sp = wantStep(id);
    drawSpr(famSet(i).idle[((t >> 3) + k * 7) % 40 === 0 ? 1 : 0], x, y, 0, x > 300 ? -1 : 1, BAX, BAY);
    bubbleIcon(x, y - 60, stepIcon(sp), true);
    hot(x - 18, y - 72, 36, 72, () => sagaGo('brief', { id }), { snd: 'wake' }); });
  if (fw[0]) bubbleIcon(150, roofTop - 58, stepIcon(wantStep(fw[0])), true), hot(136, roofTop - 70, 30, 24, () => sagaGo('brief', { id: fw[0] }));
  if (fw[1]) bubbleIcon(158, gy - 70, stepIcon(wantStep(fw[1])), true);
  // signs
  plaque(62, wallTop + 8, 'MAP');
  plaque(240, wallTop + 2, 'WANTS ' + open.length, { hot: open.length && s.sun > 0 && s.log.runs < 3 });
  plaque(104, cy - ry - 5, 'STASH ' + Object.keys(s.stash).filter(k => STASH[k]).length);
  plaque(318, cy - ry - 5, 'FAMILY ' + knownCount() + '/17');
  if (s.day >= 2) plaque(270, gy - 36, 'ERRANDS', { hot: s.errands.some(e => !e.who.length) && s.log.days < 3 });
  plaque(379, gy - 46, 'COOKOUT', { hot: s.sun === 0 });
  if (s.call) { plaque(206, roofTop - 30, 'PHONE!', { hot: 1 }); }
  // top bar
  tx('DAY ' + s.day, 8, 6, '#f6c645', { oc: '#2a140c' }); for (let i = 0; i < sunsPerDay(); i++) g.drawImage(sunIcon(i < s.sun), 50 + i * 12, 4);
  carrots(s.bank, NW - (UI.pauseV || 24) - 6 - textW(String(s.bank)) - 13, 6);
  // a nudge for new players
  const hint = s2 => { R_(0, NH - 15, NW, 15, 'rgba(20,10,6,.75)'); tx(s2, NW / 2, NH - 11, '#fff3b0', { al: 'c' }); };
  if (s.log.runs === 0 && featured.length) { bounceArrow(slots[0], gy - 74); hint('TAP THE COUSIN WITH THE BUBBLE. HE WANTS SOMETHING.'); }
  else if (s.sun === 0) { bounceArrow(379, gy - 52); hint('OUT OF SUN. TAP THE GRILL: COOKOUT TIME.'); }
  else if (s.day === 2 && s.errands.some(e => !e.who.length) && !s.seen.errands) { bounceArrow(261, gy - 50); hint('NEW: ERRANDS. TAP THE MAILBOX AND SEND SOMEBODY FOR ICE.'); }
  else if (s.call) { bounceArrow(181, roofTop - 30); hint('THE PEBBLE PHONE IS RINGING ON THE ROOF. TAP IT.'); }
};

/* ---------- the want list and errands ---------- */
SCREENS.wants = function () {
  const s = SAVE.saga, tab = SG.d.tab || 'wants', H = NH;
  R_(0, 0, NW, H, '#3b1d10'); for (let i = 0; i < 40; i++) R_((i * 61) % NW, (i * 37) % H, 2, 1, '#5a2c18');
  topBar(null, () => sagaGo('hub'));
  btn(NW / 2 - 104, 4, 96, 13, 'WANT LIST', () => { SG.d.tab = 'wants'; SG.d.page = 0; }, { gold: tab === 'wants' });
  btn(NW / 2 + 8, 4, 96, 13, 'ERRANDS', () => { SG.d.tab = 'errands'; }, { gold: tab === 'errands' });
  const px = 14, pw = NW - 28, py = 30, ph = H - 38; paper(px, py, pw, ph);
  if (tab === 'errands') { s.seen.errands = 1; return drawErrands(px, py, pw, ph); }
  const list = openWants().sort((a, b) => (wantDef(a).daily ? 2 : wantDef(a).side ? 1 : 0) - (wantDef(b).daily ? 2 : wantDef(b).side ? 1 : 0));
  const rh = 34, per = Math.max(1, Math.floor((ph - 24) / rh)), pages = Math.max(1, Math.ceil(list.length / per)), page = Math.min(SG.d.page || 0, pages - 1);
  if (!list.length) txBlock('NOBODY WANTS ANYTHING RIGHT NOW. THAT\'S NEVER TRUE FOR LONG. TRY A FREE RUN FROM THE MAP, OR CALL IT A DAY.', px + 20, py + 30, pw - 40, '#5a3a22', { al: 'c' });
  list.slice(page * per, page * per + per).forEach((id, k) => {
    const W = wantDef(id), y = py + 6 + k * rh, sp = wantStep(id), pl = wantPlace(id), x = px + 6, w = pw - 12;
    const f = hot(x, y, w, rh - 3, () => sagaGo('brief', { id }), { snd: 'wake' });
    R_(x, y, w, rh - 3, f ? '#fff3b0' : (k & 1 ? '#efe2c2' : '#f4ead0')); R_(x, y + rh - 4, w, 1, '#d8c8a0');
    face(W.who, x + 2, y);
    const name = (famRole(W.who) || FAM[W.who].color + ' COUSIN') + (W.daily ? '' : W.side ? '  (SIDE)' : '');
    tx(name, x + 38, y + 3, '#a07448');
    tx(W.text.length > 46 ? W.text.slice(0, 44) + '...' : W.text, x + 38, y + 13, '#2a140c');
    let rx = x + 38; tx((pl ? PLACES[pl].name : '') + (sp && sp.drift ? 'A DECISION' : ''), rx, y + 22, '#5a3a22');
    const ic = stepIcon(sp); if (ic) g.drawImage(ic, x + w - 20, y + 7);
    if (wantGivesName(id)) tx('EARNS A NAME', x + w - 26, y + 22, '#3f8a3a', { al: 'r' });
    else if (W.reward && W.reward.guest) tx('NEW FRIEND', x + w - 26, y + 22, '#3f8a3a', { al: 'r' });
  });
  if (pages > 1) { btn(px + 6, py + ph - 20, 30, 14, '<', () => SG.d.page = Math.max(0, page - 1), { off: page === 0 }); btn(px + pw - 36, py + ph - 20, 30, 14, '>', () => SG.d.page = Math.min(pages - 1, page + 1), { off: page >= pages - 1 }); tx((page + 1) + '/' + pages, NW / 2, py + ph - 16, '#5a3a22', { al: 'c' }); }
};
function drawErrands(px, py, pw, ph) {
  const s = SAVE.saga;
  if (!s.errands.length) { txBlock(s.day < 2 ? 'NO ERRANDS UNTIL TOMORROW. THE COUSINS ARE STILL WAKING UP.' : 'NO ERRANDS TODAY.', px + 20, py + 30, pw - 40, '#5a3a22', { al: 'c' }); return; }
  txBlock('SEND COUSINS OUT. THEY\'RE BACK AT SUNDOWN WITH WHATEVER THEY THINK YOU ASKED FOR.', px + 10, py + 6, pw - 20, '#7a4a2a', { al: 'c' });
  const rh = Math.min(36, Math.floor((ph - 30) / s.errands.length));
  s.errands.forEach((e, k) => {
    const E = ERRANDS[e.id], y = py + 26 + k * rh, x = px + 6, w = pw - 12;
    R_(x, y, w, rh - 3, k & 1 ? '#efe2c2' : '#f4ead0');
    const ok = E.ok, ic = ok.food ? icon(FOOD[Object.keys(ok.food)[0]].ic) : ok.record ? icon(['record', '#ff4fa0']) : A.carrot[0];
    g.drawImage(ic, x + 4, y + (rh - 3) / 2 - 8);
    tx(E.name, x + 26, y + 5, '#2a140c'); tx('AT ' + PLACES[E.place].name, x + 26, y + 15, '#a07448');
    e.who.forEach((i, j) => face(i, x + 168 + j * 32, y + (rh - 33) / 2));
    if (!e.who.length) tx('NOBODY YET', x + 170, y + (rh - 3) / 2 - 3, '#b8a080');
    btn(x + w - 62, y + (rh - 3) / 2 - 7, 56, 14, e.who.length ? 'CHANGE' : 'SEND', () => sagaGo('pick', { i: k, sel: e.who.slice() }), { gold: !e.who.length });
  });
}
SCREENS.pick = function () {
  const s = SAVE.saga, e = s.errands[SG.d.i], E = ERRANDS[e.id], sel = SG.d.sel, H = NH;
  R_(0, 0, NW, H, '#3b1d10');
  topBar('WHO\'S GOING FOR ' + E.ask + '?', () => sagaGo('wants', { tab: 'errands' }));
  const taken = new Set(); s.errands.forEach((o, k) => { if (k !== SG.d.i) o.who.forEach(i => taken.add(i)); });
  const wantsOf = new Set(openWants().map(id => wantRunner(id)));
  const cw = 50, ch = Math.min(60, Math.floor((H - 72) / 2)), x0 = Math.round(NW / 2 - cw * 4);
  for (let i = 1; i < FAM.length; i++) {
    const k = i - 1, x = x0 + (k % 8) * cw, y = 30 + Math.floor(k / 8) * ch, on = sel.includes(i), off = taken.has(i);
    const f = hot(x + 2, y, cw - 4, ch - 4, () => { if (off) { toast('ALREADY OUT ON ANOTHER ERRAND.'); return; } const j = sel.indexOf(i); if (j >= 0) sel.splice(j, 1); else { sel.push(i); if (sel.length > 2) sel.shift(); } });
    R_(x + 2, y, cw - 4, ch - 4, on ? '#f6c645' : f ? '#7a5236' : '#4e3220'); if (off) g.globalAlpha = .35;
    face(i, x + 10, y + 2); g.globalAlpha = 1;
    tx(quirkKnown(i) ? QUIRKS[FAM[i].quirk].name : '???', x + cw / 2, y + 34, on ? '#2a140c' : '#f4e2bd', { al: 'c' });
    if (ch > 52) tx(FAM[i].color, x + cw / 2, y + 44, on ? '#5a3a22' : '#a07448', { al: 'c' });
    if (wantsOf.has(i)) tx('!', x + cw - 10, y + 2, '#ff8a5a', { oc: '#2a140c' });
  }
  const sy = 30 + ch * 2 + 4, info = sel.length ? sel.map(i => quirkKnown(i) ? QUIRKS[FAM[i].quirk].tip : 'NOBODY KNOWS WHAT HE\'LL DO YET.').join(' ') : 'PICK ONE OR TWO. EVERY COUSIN HEARS IT A LITTLE DIFFERENT.';
  txBlock(info, 20, sy, NW - 170, '#f4e2bd', { lh: 9 });
  if (sel.some(i => wantsOf.has(i))) tx('! HAS A WANT TODAY. HE CAN\'T RUN IT WHILE HE\'S OUT.', 20, H - 12, '#ff8a5a');
  btn(NW - 140, sy, 122, 16, sel.length ? 'SEND THEM' : 'NOBODY GOES', () => { e.who = sel.slice(); writeSave(); sagaGo('wants', { tab: 'errands' }); if (sel.length) toast('BACK AT SUNDOWN. PROBABLY WITH ' + E.ask + '.'); }, { gold: sel.length > 0 });
};

/* ---------- the brief: one want up close ---------- */
SCREENS.brief = function () {
  const s = SAVE.saga, id = SG.d.id, W = wantDef(id), H = NH; if (!W) { sagaGo('hub'); return; }
  const st = wantState(id), sp = wantStep(id), steps = wantSteps(id), runner = wantRunner(id), big = H >= 250;
  R_(0, 0, NW, H, '#2a1810'); for (let i = 0; i < 30; i++) R_((i * 71) % NW, (i * 43) % H, 2, 1, '#4a2818');
  topBar(null, () => sagaGo(SG.d.from || 'wants'));
  // the cousin
  const lx = 64, ly = big ? 132 : 92; R_(lx - 44, ly - 2, 88, 6, '#4e3220'); fillEll(lx, ly + 1, 40, 4, '#5a3a22');
  const set = famSet(W.who), fr = set.idle[(S.t % 160 > 150) ? 1 : 0];
  if (big) g.drawImage(fr, 0, 0, BW, BH, lx - BAX * 2, ly - BAY * 2, BW * 2, BH * 2); else drawSpr(fr, lx, ly, 0, 1, BAX, BAY);
  let ny = ly + 10; ny += txBlock(famName(W.who), 10, ny, 110, '#f6c645', { al: 'c', oc: '#2a140c' });
  if (quirkKnown(W.who) && W.who > 1) tx(QUIRKS[FAM[W.who].quirk].name, lx, ny + 1, '#a07448', { al: 'c' });
  if (runner !== W.who) { tx('RUNNING IT:', lx, H - 34, '#a07448', { al: 'c' }); face(runner, lx - 15, H - 26); }
  // the want
  const x = 132, w = NW - x - 12; let y = 28;
  const ql = txWrap('"' + W.text + '"', Math.floor((w - 12) / 6)), qh = ql.length * 9 + 8;
  R_(x - 1, y - 1, w + 2, qh + 2, '#2a140c'); R_(x, y, w, qh, '#ffffff'); R_(x - 6, y + 6, 6, 4, '#ffffff'); R_(x - 7, y + 5, 1, 6, '#2a140c');
  ql.forEach((l, i) => tx(l, x + 6, y + 5 + i * 9, '#2a140c')); y += qh + 6;
  y += txBlock(W.sub, x, y, w, '#e8d8b8', { lh: 9 }) + 4;
  // steps
  steps.forEach((p, k) => { if (y > H - 60) return; const cur = k === st.step, did = k < st.step, ic = stepIcon(p);
    if (ic) { if (!cur && !did) g.globalAlpha = .5; g.drawImage(ic, x, y - 4); g.globalAlpha = 1; }
    const label = p.drift ? 'A DECISION' : (p.title || MODEWORD[p.mode]) + (p.run ? '  ' + PLACES[LVPLACE[p.run]].name : '');
    tx((did ? 'DONE: ' : '') + label, x + 20, y, did ? '#7ad050' : cur ? '#ffffff' : '#a08060', { oc: cur ? '#2a140c' : null });
    if (cur && p.tip) { y += 10; y += txBlock(p.tip, x + 20, y, w - 20, '#c8b088', { lh: 9 }) - 9; }
    y += 13; });
  // reward
  const R = W.reward, rw = rewardList(R); let rx = x;
  if (wantGivesName(id)) { tx('HE EARNS A NAME.', rx, y, '#7ad050', { oc: '#2a140c' }); y += 12; }
  rw.slice(0, 4).forEach(r => { if (rx > NW - 80) return; if (r.ic) { g.drawImage(r.ic, 0, 0, r.ic.width, r.ic.height, rx, y - 4, 14, Math.round(r.ic.height * 14 / r.ic.width)); rx += 16; } rx += tx(r.label.length > 18 ? r.label.slice(0, 17) + '.' : r.label, rx, y, '#f4e2bd') + 10; });
  // go
  const away = isAway(runner), canRun = sp && (sp.run || sp.drive);
  if (sp && sp.drift) btn(NW - 150, H - 26, 134, 18, 'DECIDE', () => sagaGo('drift', { id }), { gold: 1, pulse: 1 });
  else if (canRun) {
    const off = s.sun <= 0 || away, why = away ? 'HE\'S OUT ON AN ERRAND TILL SUNDOWN. CHANGE IT ON THE ERRANDS LIST.' : 'NO SUN LEFT TODAY. TIME FOR THE COOKOUT.';
    btn(NW - 150, H - 26, 134, 18, 'GO', () => goWant(id), { gold: 1, off, why, icon: sunIcon(true), pulse: 1, snd: 'crew' });
  }
  btn(x, H - 26, 90, 18, 'NOT TODAY', () => sagaGo(SG.d.from || 'wants'));
};
function goWant(id) {
  const W = wantDef(id), st = wantState(id), sp = wantStep(id);
  startRun({ want: id, stepIdx: st.step, run: sp.run, mode: sp.mode, p: sp.p, rev: sp.rev, title: sp.title, tip: sp.tip, say: W.text, runner: wantRunner(id), shop: id === 'ice' });
}
SCREENS.drift = function () {
  const id = SG.d.id, W = wantDef(id), sp = wantStep(id), D = sp.drift, H = NH;
  R_(0, 0, NW, H, '#2a1810');
  tx('LOSING THE PLOT', NW / 2, 12, '#f6c645', { al: 'c', sc: 2, oc: '#2a140c' });
  face(W.who, 20, 40); face(0, NW - 50, 40);
  let y = 40; y += txBlock(D.text, 60, y, NW - 120, '#fff3e0', { al: 'c', lh: 10 }) + 10;
  const bw = 180, by = Math.max(y, H - 70);
  const pick = (go) => { const st = wantState(id), s = SAVE.saga; st.drift = go ? 'go' : 'stick'; st.step++; if (go) s.log.drift++; else s.log.stuck++; writeSave();
    if (!go) { const out = { title: 'WANT DONE!', gains: [], res: { stars: st.last || 2, note: 'STUCK TO IT', carrots: 0 } }; completeWant(id, st.last || 2, out); writeSave(); sagaGo('result', out); }
    else { toast(D.goSay); sagaGo('brief', { id }); } };
  btn(NW / 2 - bw - 6, by, bw, 20, D.stick, () => pick(false), { gold: 1 });
  btn(NW / 2 + 6, by, bw, 20, D.go, () => pick(true), { col: '#8a3a22' });
  tx('FINISH WHAT HE STARTED', NW / 2 - bw / 2 - 6, by + 26, '#c8b088', { al: 'c' });
  tx('NEW PLAN. SEE WHERE IT GOES.', NW / 2 + bw / 2 + 6, by + 26, '#c8b088', { al: 'c' });
};

/* ---------- the map ---------- */
const MAPPOS = { boulder: [.11, .3], atl: [.4, .36], forest: [.4, .62], farm: [.57, .42], marsh: [.71, .78], paris: [.88, .2] };
function mapXY(id) { const p = MAPPOS[id], top = 26, h = NH - top - 8; return [Math.round(p[0] * NW), Math.round(top + p[1] * h)]; }
function coastX(y) { return NW * .76 - (y - 22) * .12 + Math.sin(y * .07) * 6 + Math.sin(y * .19) * 3; }
let MAPC = null, MAPK = '';
function mapArt() {
  const key = NW + 'x' + NH; if (MAPC && MAPK === key) return MAPC; MAPK = key; MAPC = mkC(NW, NH); const x = MAPC.getContext('2d'), gg = g; g = x;
  R_(0, 0, NW, NH, '#3a7ab8'); for (let i = 0; i < 90; i++) { const wx = (i * 97) % NW, wy = (i * 53) % NH; R_(wx, wy, 5, 1, '#5a9ad0'); }
  for (let y = 22; y < NH; y++) { const cx = coastX(y); R_(0, y, cx, 1, '#8cc860'); R_(cx - 3, y, 3, 1, '#e8d8a0'); R_(cx, y, 2, 1, '#bfe8ff'); }
  for (let y = 22; y < 26; y++) R_(0, y, NW, 1, '#3a7ab8');
  for (let i = 0; i < 160; i++) { const tx2 = (i * 53) % NW, ty = 26 + (i * 71) % (NH - 30); if (tx2 < coastX(ty) - 6) { pixCircle(tx2, ty, 2 + (i % 3), i % 4 ? '#5aa040' : '#4a8a34'); } }
  for (let i = 0; i < 6; i++) { const mx = 8 + i * 16, my = mapXY('boulder')[1] + 10 - (i % 2) * 6; for (let k = 0; k < 18; k++) R_(mx + 9 - k / 2, my - 18 + k, k, 1, k < 6 ? '#ffffff' : '#8a8a96'); }
  // roads and flights
  const road = (a, b, col) => { const [ax, ay] = mapXY(a), [bx, by] = mapXY(b), n = Math.hypot(bx - ax, by - ay) / 4; for (let i = 0; i < n; i++) if (i % 2 === 0) R_(lerp(ax, bx, i / n), lerp(ay, by, i / n), 2, 2, col); };
  road('forest', 'atl', '#c4573a'); road('atl', 'farm', '#c4573a'); road('farm', 'marsh', '#c4573a'); road('forest', 'marsh', '#c4573a');
  const fly = (a, b) => { const [ax, ay] = mapXY(a), [bx, by] = mapXY(b); for (let i = 0; i < 40; i++) if (i % 2 === 0) { const k = i / 40; R_(lerp(ax, bx, k), lerp(ay, by, k) - Math.sin(k * Math.PI) * 26, 2, 1, '#ffffff'); } };
  fly('atl', 'boulder'); fly('atl', 'paris');
  // France across the water
  const [px, py] = mapXY('paris'); R_(px - 40, py - 24, 80, 56, '#2a140c'); R_(px - 39, py - 23, 78, 54, '#a8c87a'); R_(px - 39, py + 20, 78, 10, '#3a7ab8'); for (let x2 = px - 39; x2 < px + 39; x2++) R_(x2, py + 18 + Math.round(Math.sin(x2 * .3)), 1, 2, '#e8d8a0');
  g = gg; return MAPC;
}
function mapIcon(id, x, y, lock) {
  const R = R_;
  if (lock) { R(x - 7, y - 8, 14, 14, '#4a3e34'); tx('?', x - 2, y - 4, '#c8b088'); return; }
  if (id === 'forest') { R(x - 9, y - 4, 14, 9, '#e2b77a'); for (let k = 0; k < 6; k++) R(x - 10 + k, y - 5 - k, 16 - k * 2, 1, '#4a3648'); R(x - 4, y, 4, 5, '#2a6a3a'); pixCircle(x + 9, y - 2, 6, '#2c5a24'); }
  if (id === 'atl') { for (const [bx, bh] of [[-9, 10], [-4, 16], [1, 12], [6, 18]]) { R(x + bx, y + 6 - bh, 5, bh, '#5a5a78'); for (let k = 2; k < bh; k += 3) R(x + bx + 1, y + 6 - bh + k, 3, 1, '#ffd86a'); } }
  if (id === 'farm') { R(x - 8, y - 4, 16, 10, '#b8302a'); for (let k = 0; k < 6; k++) R(x - 9 + k, y - 5 - k, 18 - k * 2, 1, '#8a1a14'); R(x - 3, y, 6, 6, '#e8dcc0'); }
  if (id === 'marsh') { R(x - 1, y - 10, 2, 16, '#8a6a3a'); for (let k = 0; k < 5; k++) { const a = -2.6 + k * .5; for (let r = 0; r < 8; r++) R(x + Math.cos(a) * r, y - 10 + Math.sin(a) * r * .6 + r * r * .05, 1, 1, '#3f8a32'); } R(x - 10, y + 4, 20, 3, '#f2dca8'); }
  if (id === 'paris') { for (let k = 0; k < 20; k++) { const hw = 1 + Math.pow(k / 20, 2) * 7; R(x - hw, y - 12 + k, 1, 1, '#5a5a6a'); R(x + hw, y - 12 + k, 1, 1, '#5a5a6a'); } R(x - 4, y + 1, 9, 1, '#5a5a6a'); R(x, y - 15, 1, 4, '#5a5a6a'); }
  if (id === 'boulder') { for (let k = 0; k < 10; k++) R(x - k, y - 8 + k, k * 2 + 1, 1, k < 3 ? '#ffffff' : '#c47a56'); }
}
SCREENS.map = function () {
  const s = SAVE.saga, sel = SG.d.sel, t = S.t;
  g.drawImage(mapArt(), 0, 0);
  topBar('THE MAP', () => sagaGo('hub'));
  const open = openWants();
  for (const id in PLACES) {
    const [x, y] = mapXY(id), lock = !s.places[id], here = open.filter(w => wantPlace(w) === id).length;
    if (here && !lock) { g.globalAlpha = .35 + .25 * Math.sin(t * .12); pixCircle(x, y, 14, '#fff3b0'); g.globalAlpha = 1; }
    const f = hot(x - 16, y - 16, 32, 34, () => { SG.d.sel = id; uiReset(); }, { snd: 'tap' });
    if (sel === id || f) pixCircle(x, y, 13, '#ffffff');
    mapIcon(id, x, y, lock);
    tx(lock ? '???' : PLACES[id].name, x, y + 10, lock ? '#c8b088' : '#ffffff', { al: 'c', oc: '#2a140c' });
    if (here && !lock) { R_(x + 8, y - 16, 9, 10, '#2a140c'); R_(x + 9, y - 15, 7, 8, '#e03030'); tx(String(here), x + 10, y - 14, '#ffffff'); }
  }
  // the Escalade where you are
  { const [x, y] = mapXY(s.today.place || 'forest'); if (s.today.place !== 'paris' && s.today.place !== 'boulder') g.drawImage(A.escL, 0, 0, 112, 50, x - 30, y + 18, 28, 13); }
  if (!sel) { tx('TAP A PLACE', 10, NH - 14, '#fff3b0', { oc: '#2a140c' }); return; }
  // place panel
  const P = PLACES[sel], pw = 168, px = NW - pw - 6, py = 26, ph = NH - py - 6; woodPanel(px, py, pw, ph);
  btn(px + pw - 18, py + 3, 13, 12, 'X', () => { SG.d.sel = null; uiReset(); });
  tx(P.name, px + 8, py + 5, '#f6c645', { oc: '#2a140c' }); tx(P.sub, px + 8, py + 15, '#d8b080');
  let y = py + 28;
  if (!s.places[sel]) { txBlock('NOBODY\'S INVITED YOU YET. KEEP AN EAR ON THE PEBBLE PHONE.', px + 8, y, pw - 16, '#f4e2bd'); return; }
  for (const id of open.filter(w => wantPlace(w) === sel).slice(0, NH > 240 ? 3 : 2)) {
    const W = wantDef(id); if (y > py + ph - 40) break;
    btn(px + 6, y, pw - 12, 22, '', () => sagaGo('brief', { id, from: 'map' }), { col: '#5a3a22' }); face(W.who, px + 6, y - 6);
    tx(W.text.length > 20 ? W.text.slice(0, 19) + '.' : W.text, px + 36, y + 4, '#ffffff', { oc: '#2a140c' }); tx(wantGivesName(id) ? 'EARNS A NAME' : 'WANT', px + 36, y + 13, '#d8b080');
    y += 26;
  }
  const runner = s.runner != null && !isAway(s.runner) ? s.runner : 2;
  for (const lv of P.runs) { if (y > py + ph - 20) break; btn(px + 6, y, pw - 12, 16, 'FREE RUN: ' + LVNAME[lv], () => startRun({ run: lv, mode: lv === 'icebox' ? 'drive' : 'fetch', free: 1, runner, title: LVNAME[lv], say: ['JUST RUNNING. FOR CARROTS.', 'NOBODY ASKED. I\'M GOING ANYWAY.', 'FEELS LIKE A GOOD DAY TO BE FAST.'][s.day % 3] }), { off: s.sun <= 0, why: 'NO SUN LEFT TODAY.', icon: sunIcon(true), sc: 1 }); y += 20; }
  for (const sh of P.shops) { if (y > py + ph - 20) break; btn(px + 6, y, pw - 12, 16, SHOPS[sh].name, () => sagaGo('shop', { id: sh, sel: 0, back: sel }), { col: '#34307a' }); y += 20; }
  if (y < py + ph - 34) { tx('FREE RUNS:', px + 8, y + 4, '#d8b080'); face(runner, px + 70, y - 6); btn(px + 104, y, 22, 14, '<', () => cycleRunner(-1)); btn(px + 132, y, 22, 14, '>', () => cycleRunner(1)); }
};
function cycleRunner(d) { const s = SAVE.saga; let r = s.runner != null ? s.runner : 2; for (let k = 0; k < FAM.length; k++) { r = (r + d + FAM.length) % FAM.length; if (r !== 0 && !isAway(r)) break; } s.runner = r; writeSave(); }

/* ---------- shops ---------- */
SCREENS.shop = function () {
  const s = SAVE.saga, id = SG.d.id, SH = SHOPS[id], items = shopItems(id), H = NH;
  R_(0, 0, NW, H, SH.col[0]); for (let y = 24; y < H; y += 8) R_(0, y, NW, 1, shade(SH.col[0], -.15));
  topBar(SH.name, () => sagaGo('map', { sel: SG.d.back }));
  tx(SH.hello, NW / 2, 27, SH.col[1], { al: 'c', oc: '#2a140c' });
  const cw = 76, ch = Math.min(60, Math.floor((H - 100) / 2)), cols = 5, x0 = Math.round(NW / 2 - cw * cols / 2), y0 = 40;
  const per = cols * 2, pages = Math.ceil(items.length / per), page = Math.min(SG.d.page || 0, pages - 1);
  items.slice(page * per, page * per + per).forEach(([kind, k], j) => {
    const i = page * per + j, D = kind === 's' ? STASH[k] : FOOD[k], x = x0 + (j % cols) * cw, y = y0 + Math.floor(j / cols) * ch, owned = kind === 's' && s.stash[k], sel = SG.d.sel === i;
    const f = hot(x + 2, y, cw - 4, ch - 4, () => { SG.d.sel = i; });
    R_(x + 2, y, cw - 4, ch - 4, sel ? '#fff3b0' : f ? '#f4ead0' : '#e8dcc0'); R_(x + 2, y + ch - 6, cw - 4, 2, '#b8a080');
    const ic = icon(D.ic), isz = ch >= 56 ? 32 : 16; g.drawImage(ic, 0, 0, 16, 16, x + cw / 2 - isz / 2, y + 3 + (32 - isz) / 4, isz, isz);
    const nm = D.name.length > 12 ? D.name.slice(0, 11) + '.' : D.name; tx(nm, x + cw / 2, y + ch - 25, '#2a140c', { al: 'c' });
    if (owned) tx('GOT IT', x + cw / 2, y + ch - 15, '#3f8a3a', { al: 'c' }); else carrots(D.price, x + cw / 2 - (textW(String(D.price)) + 13) / 2, y + ch - 15, { col: s.bank >= D.price ? '#2a140c' : '#b8302a', oc: null });
    if (kind === 'f' && s.pantry[k]) tx('x' + s.pantry[k], x + cw - 8, y + 3, '#7a4a2a', { al: 'r' });
  });
  if (pages > 1) { btn(8, y0 + ch - 12, 18, 18, '<', () => SG.d.page = Math.max(0, page - 1), { off: page === 0 }); btn(NW - 26, y0 + ch - 12, 18, 18, '>', () => SG.d.page = Math.min(pages - 1, page + 1), { off: page >= pages - 1 }); }
  // the selected thing
  const it = items[SG.d.sel || 0]; if (!it) return; const [kind, k] = it, D = kind === 's' ? STASH[k] : FOOD[k], by = y0 + ch * 2 + 4, bh = H - by - 6;
  woodPanel(10, by, NW - 20, bh);
  tx(D.name, 18, by + 5, '#f6c645', { oc: '#2a140c' });
  const info = kind === 'f' ? 'FOR THE COOKOUT. +' + D.vibes + ' VIBES WHEN IT\'S SERVED. YOU HAVE ' + (s.pantry[k] || 0) + '.' : (D.perk ? 'PERK: ' + D.perk : D.desc || '');
  txBlock(info, 18, by + 16, NW - 170, '#f4e2bd');
  const owned = kind === 's' && s.stash[k], poor = s.bank < D.price;
  btn(NW - 132, by + Math.max(4, bh / 2 - 9), 110, 18, owned ? 'GOT IT' : 'BUY', () => {
    bankAdd(-D.price); if (kind === 's') { giveStash(k); toast('NEW IN THE STASH: ' + D.name + (D.perk ? '. ' + D.perk : '')); } else { giveFood(k, 1); toast('+1 ' + D.name + ' FOR THE COOKOUT.'); }
    sfx('pay'); writeSave(); }, { gold: 1, off: owned || poor, why: owned ? 'YOU\'VE ALREADY GOT ONE.' : 'NOT ENOUGH CARROTS. RUNS AND ERRANDS PAY.', icon: owned ? null : A.carrot[0], snd: 'carrot' });
};

/* ---------- the family ---------- */
SCREENS.family = function () {
  const s = SAVE.saga, H = NH, sel = SG.d.sel != null ? SG.d.sel : 2;
  R_(0, 0, NW, H, '#3b1d10'); for (let i = 0; i < 40; i++) R_((i * 61) % NW, (i * 37) % H, 2, 1, '#5a2c18');
  topBar('THE FAMILY  ' + knownCount() + ' OF 17 KNOWN', () => sagaGo('hub'));
  const cw = 34, chh = 38, x0 = 10, y0 = 28, wantsOf = new Set(openWants().map(id => wantDef(id).who));
  for (let i = 0; i < FAM.length; i++) {
    const x = x0 + (i % 6) * cw, y = y0 + Math.floor(i / 6) * chh, f = hot(x, y, cw - 2, chh - 2, () => { SG.d.sel = i; });
    R_(x, y, cw - 2, chh - 2, sel === i ? '#f6c645' : f ? '#7a5236' : '#4e3220');
    if (isAway(i)) g.globalAlpha = .4; face(i, x + 1, y + 2); g.globalAlpha = 1;
    if (famRole(i)) g.drawImage(starIcon(true), x + cw - 13, y + chh - 13);
    if (wantsOf.has(i)) tx('!', x + 2, y + 2, '#ff8a5a', { oc: '#2a140c' });
    if (isAway(i)) tx('OUT', x + 2, y + chh - 11, '#fff3b0', { oc: '#2a140c' });
  }
  const sy = y0 + chh * 3 + 4;
  if (sy < H - 20) { tx('STUCK TO IT: ' + s.log.stuck, x0, sy, '#d8b080'); tx('LOST THE PLOT: ' + s.log.drift, x0, sy + 10, '#d8b080'); if (sy < H - 30) tx('BEST COOKOUT: ' + s.log.best + ' VIBES', x0, sy + 20, '#d8b080'); }
  // detail
  const px = 222, pw = NW - px - 8, py = 28, ph = H - py - 8; woodPanel(px, py, pw, ph);
  const set = famSet(sel), big = H >= 270;
  if (big) g.drawImage(set.idle[(S.t % 160 > 150) ? 1 : 0], 0, 0, BW, BH, px + 4, py + 4, BW * 2, BH * 2); else drawSpr(set.idle[0], px + 26, py + 50, 0, 1, BAX, BAY);
  const tx0 = big ? px + 88 : px + 50; let y = py + 8;
  y += txBlock(famName(sel), tx0, y, px + pw - tx0 - 6, '#f6c645', { oc: '#2a140c', lh: 10 });
  if (famRole(sel)) { tx(FAM[sel].tag, tx0, y, '#d8b080'); y += 10; }
  y = Math.max(y + 4, big ? py + 100 : py + 56);
  const q = QUIRKS[FAM[sel].quirk];
  tx(quirkKnown(sel) ? q.name : 'QUIRK: ???', px + 8, y, '#ffffff', { oc: '#2a140c' }); y += 11;
  y += txBlock(quirkKnown(sel) ? q.tip : 'SEND HIM ON AN ERRAND AND FIND OUT WHAT HE\'S LIKE.', px + 8, y, pw - 16, '#f4e2bd') + 4;
  const own = FAM[sel].want, ow = own && wantDef(own), ost = own && (s.wants[own] || {}).st;
  let status = sel === 0 ? 'ON THE ROOF. ALWAYS.' : isAway(sel) ? 'OUT ON AN ERRAND. BACK AT SUNDOWN.' : wantsOf.has(sel) ? 'WANTS SOMETHING TODAY.' : 'HOME.';
  if (own && !famRole(sel)) status += ost === 'done' ? '' : ' HAS A BIG WANT COMING. HE\'LL EARN HIS NAME WHEN HE GETS IT.';
  if (y < py + ph - 10) txBlock(status, px + 8, y, pw - 16, '#c8b088');
};

/* ---------- the stash ---------- */
SCREENS.stash = function () {
  const s = SAVE.saga, H = NH, cat = SG.d.cat || 'drip';
  R_(0, 0, NW, H, '#2a1810'); for (let i = 0; i < 30; i++) R_((i * 71) % NW, (i * 43) % H, 2, 1, '#4a2818');
  const nOwn = Object.keys(s.stash).filter(k => STASH[k]).length; topBar('THE STASH  ' + nOwn + ' OF ' + Object.keys(STASH).length, () => sagaGo('hub'));
  let tx0 = 8; STASH_CATS.forEach(([k, label]) => { const w = textW(label) + 10; btn(tx0, 26, w, 13, label, () => { SG.d.cat = k; SG.d.sel = 0; }, { gold: cat === k }); tx0 += w + 6; });
  const list = cat === 'pantry' ? Object.keys(FOOD) : Object.keys(STASH).filter(k => STASH[k].cat === cat);
  const cs = 40, cols = 10, x0 = Math.round(NW / 2 - cs * cols / 2), y0 = 46, rows = Math.max(1, Math.floor((H - y0 - 46) / cs));
  list.slice(0, cols * rows).forEach((k, j) => {
    const D = cat === 'pantry' ? FOOD[k] : STASH[k], x = x0 + (j % cols) * cs, y = y0 + Math.floor(j / cols) * cs, own = cat === 'pantry' ? s.pantry[k] > 0 : s.stash[k], sel = (SG.d.sel || 0) === j;
    const f = hot(x + 2, y + 2, cs - 4, cs - 4, () => { SG.d.sel = j; });
    R_(x + 2, y + 2, cs - 4, cs - 4, sel ? '#f6c645' : f ? '#7a5236' : '#4e3220');
    const ic = icon(D.ic); g.drawImage(own ? ic : silhouette(ic), 0, 0, 16, 16, x + 4, y + 4, 32, 32);
    if (cat === 'pantry' && s.pantry[k]) tx('x' + s.pantry[k], x + cs - 4, y + cs - 11, '#ffffff', { oc: '#2a140c', al: 'r' });
  });
  const k = list[SG.d.sel || 0]; if (!k) return; const D = cat === 'pantry' ? FOOD[k] : STASH[k], own = cat === 'pantry' ? s.pantry[k] > 0 : s.stash[k], by = H - 42;
  woodPanel(10, by, NW - 20, 36);
  tx(own || cat === 'pantry' ? D.name : '???', 18, by + 5, '#f6c645', { oc: '#2a140c' });
  let info;
  if (cat === 'pantry') info = (s.pantry[k] || 0) + ' IN THE PANTRY. +' + D.vibes + ' VIBES AT THE COOKOUT.' + (D.shop ? ' SOLD AT ' + SHOPS[D.shop].name + '.' : ' FROM WANTS AND ERRANDS.');
  else if (own) info = (D.perk ? 'PERK: ' + D.perk : D.desc || '') + (D.song ? ' PLAYS ' + SONG[D.song].name + '.' : '');
  else info = D.shop ? 'SOLD AT ' + SHOPS[D.shop].name + ' FOR ' + D.price + ' CARROTS.' + (D.perk ? ' PERK: ' + D.perk : '') : D.cat === 'records' ? 'TURNS UP ON ERRANDS AND LOST-AND-FOUND RUNS.' : 'COMES FROM A WANT. SOMEBODY HAS TO WANT IT FIRST.';
  txBlock(info, 18, by + 16, NW - 36, '#f4e2bd');
};

/* ---------- the pebble phone ---------- */
SCREENS.phone = function () {
  const s = SAVE.saga, C = CALLS[SG.d.id], H = NH, i = SG.d.i || 0;
  R_(0, 0, NW, H, '#3b1d10'); g.globalAlpha = .14; pixCircle(NW / 2, H * .3, 140, '#ffd68a'); g.globalAlpha = 1;
  tx('THE PEBBLE PHONE', NW / 2, 10, '#f6c645', { al: 'c', oc: '#2a140c' });
  const ph = A.phone[(S.t >> 3) & 1]; g.drawImage(ph, 0, 0, ph.width, ph.height, 40, 40, ph.width * 3, ph.height * 3);
  const cx = NW - 90, cy = Math.round(H * .58);
  if (C.who === 'dexter' || C.who === 'pontoon' || C.who === 'bb1') g.drawImage((C.who === 'bb1' ? A.bb1 : A[C.who]).idle[0], 0, 0, BW, BH, cx - BAX * 2, cy - BAY * 2, BW * 2, BH * 2);
  else if (C.who === 'elli') g.drawImage(A.elli[(S.t >> 4) & 1], 0, 0, 28, 46, cx - 28, cy - 92, 56, 92);
  else if (C.who === 'snail') g.drawImage(A.snail[(S.t >> 3) & 1], cx - 30, cy - 50);
  else { const pi = icon(['pebble', '#9aa3ad']); g.drawImage(pi, 0, 0, 16, 16, cx - 24, cy - 60, 48, 48); }
  tx(C.from, cx, cy + 6, '#f6c645', { al: 'c', oc: '#2a140c' });
  const by = H - 60; paper(16, by, NW - 32, 50);
  const line = C.lines[i], shown = Math.floor(SG.t * 1.2); txBlock(line.slice(0, shown), 24, by + 6, NW - 48, '#2a140c', { lh: 10 });
  const last = i >= C.lines.length - 1;
  btn(NW - 110, by + 30, 84, 16, last ? 'BYE' : 'NEXT', () => {
    if (!last) { SG.d.i = i + 1; SG.t = 0; return; }
    s.calls[SG.d.id] = 1; s.call = null; const news = refreshWants();
    if (C.opens && !s.places[C.opens]) { s.places[C.opens] = 1; refreshWants().forEach(x => news.push(x)); }
    writeSave(); sagaGo('hub'); if (C.opens) toast('NEW ON THE MAP: ' + PLACES[C.opens].name + '.'); else if (news.length) toast('SOMEBODY JUST STARTED WANTING SOMETHING.');
  }, { gold: 1 });
};

/* ---------- after a run ---------- */
SCREENS.result = function () {
  const s = SAVE.saga, O = SG.d, H = NH, t = SG.t, r = O.res || { stars: 0 };
  const big = H >= 240;
  R_(0, 0, NW, H, '#2a1810');
  if (t % 4 === 0 && t < 200) part({ type: 'chip', x: Math.random() * NW, y: -4, vx: (Math.random() - .5), vy: 1 + Math.random(), g: .02, life: 260, col: ['#f6c645', '#ff8a1c', '#7ad050', '#ff4fa0'][(t >> 2) & 3] }); for (let i = 0; i < 30; i++) R_((i * 71) % NW, (i * 43) % H, 2, 1, '#4a2818');
  const w = Math.min(NW - 20, 360), x = Math.round(NW / 2 - w / 2), y = 6, h = H - 12; woodPanel(x, y, w, h);
  tx(O.title, NW / 2, y + 7, '#f6c645', { al: 'c', sc: 2, oc: '#2a140c' });
  let yy = y + 28;
  if (r.stars) { const n = Math.min(r.stars, Math.floor(t / 14)); stars(NW / 2 - 19, yy, n); if (t === 14 || t === 28 || t === 42) { if (Math.floor(t / 14) <= r.stars) sfx('ding'); } yy += 16; }
  if (r.note) { tx(r.note, NW / 2, yy, '#ffffff', { al: 'c', oc: '#2a140c' }); yy += 11; }
  if (r.carrots) { const str = '+' + r.carrots + ' CARROTS IN THE BANK  (' + s.bank + ')'; tx(str, NW / 2, yy, '#7ad050', { al: 'c', oc: '#2a140c' }); yy += 11; }
  const gs = O.gains || []; let gx = x + 12; const col = Math.floor((w - 24) / 2);
  gs.slice(0, big ? 6 : 4).forEach((G, k) => { const cx = x + 12 + (k % 2) * col, cy = yy + Math.floor(k / 2) * 15; if (G.ic) g.drawImage(G.ic, 0, 0, G.ic.width, G.ic.height, cx, cy - 4, 14, Math.round(G.ic.height * 14 / G.ic.width)); tx(G.label.length > 26 ? G.label.slice(0, 25) + '.' : G.label, cx + (G.ic ? 17 : 0), cy, '#fff3b0'); });
  yy += Math.ceil(Math.min(gs.length, big ? 6 : 4) / 2) * 15 + 2;
  if (O.land) { const lines = txWrap(O.land, Math.floor((w - 28) / 6)), lh = lines.length * 9 + 8; paper(x + 10, yy, w - 20, lh); let left = Math.floor(t * 1.4); lines.forEach((l, i) => { if (left > 0) tx(l.slice(0, left), x + 16, yy + 5 + i * 9, '#2a140c'); left -= l.length + 1; }); yy += lh + 6; }
  if (O.next && !O.land && wantStep(O.want)) { tx('NEXT: ' + (wantStep(O.want).drift ? 'A DECISION' : (wantStep(O.want).title || '')), NW / 2, yy, '#d8b080', { al: 'c' }); }
  if (big && yy < y + h - 100) { const who = O.role ? O.role.fam : O.M && O.M.runner != null ? O.M.runner : O.want ? wantDef(O.want) && wantDef(O.want).who : 2, set = famSet(who || 2), fy = y + h - 30; fillEll(x + 60, fy + 1, 34, 4, '#5a3a22'); g.drawImage(set.cheer[(t >> 3) & 1], 0, 0, BW, BH, x + 60 - BAX * 2, fy - BAY * 2, BW * 2, BH * 2); }
  for (const q of S.parts) drawPart(q);
  const by = y + h - 24;
  if (O.role && !O.named) btn(NW / 2 - 70, by, 140, 18, 'NAME HIM', () => sagaGo('name', { O }), { gold: 1, pulse: 1, snd: 'crew' });
  else btn(NW / 2 - 70, by, 140, 18, O.finale ? 'TO THE COOKOUT' : 'CONTINUE', () => resultNext(O), { gold: 1 });
};
function resultNext(O) {
  const s = SAVE.saga;
  if (O.finale) { sagaGo('hub'); startSagaCook(); SG.d.finale = true; SG.d.phase = SG.d.reports.length ? 'reports' : 'spread'; return; }
  if (O.next) { const sp = wantStep(O.want); if (sp && sp.drift) { sagaGo('drift', { id: O.want }); return; } sagaGo('brief', { id: O.want }); return; }
  sagaGo('hub');
  if (O.news && O.news.length) { const W = wantDef(O.news[0]); toast((famRole(W.who) || 'THE ' + FAM[W.who].color + ' COUSIN') + ' JUST STARTED WANTING SOMETHING. CHECK THE WANT LIST.'); }
}
SCREENS.name = function () {
  const s = SAVE.saga, O = SG.d.O, i = O.role.fam, H = NH;
  R_(0, 0, NW, H, '#2a1810'); g.globalAlpha = .16; pixCircle(NW / 2, H * .35, 110, '#ffd68a'); g.globalAlpha = 1;
  tx('HE EARNED A NAME.', NW / 2, 10, '#f6c645', { al: 'c', sc: 2, oc: '#2a140c' });
  const set = famSet(i), sy = Math.round(H * .5), sc2 = H >= 260 ? 2 : 1; g.drawImage(set.cheer[(S.t >> 3) & 1], 0, 0, BW, BH, NW / 2 - BAX * sc2, sy - BAY * sc2, BW * sc2, BH * sc2);
  tx('WHAT DO WE CALL HIM NOW?', NW / 2, sy + 6, '#ffffff', { al: 'c', oc: '#2a140c' });
  const bw = 128, by = Math.min(H - 26, sy + 22);
  O.role.opts.forEach((n, k) => btn(NW / 2 - bw * 1.5 - 8 + k * (bw + 8), by, bw, 18, n, () => {
    s.fam[i].role = n; s.fam[i].qk = true; s.fam[i].named = s.day; O.named = true; writeSave(); sfx('crew'); sfx('rock');
    sagaGo('result', O); toast('FROM NOW ON, HE\'S ' + n + '.');
  }, { gold: k === 0 }));
};

/* ---------- sundown ---------- */
SCREENS.cook = function () {
  const D = SG.d, C = D.C, H = NH, t = C.t;
  drawCookScene(C);
  if (D.phase === 'credits') return drawSagaCredits(D);
  const w = Math.min(NW - 40, 320), x = Math.round(NW / 2 - w / 2), y = 8; let h;
  if (D.phase === 'reports') {
    const r = D.reports[D.ri]; h = Math.min(H - 60, 84 + txWrap(r.line, Math.floor((w - 20) / 6)).length * 9 + (r.reveal ? 12 : 0)); woodPanel(x, y, w, h);
    tx('ERRAND REPORT ' + (D.ri + 1) + ' OF ' + D.reports.length, NW / 2, y + 5, '#f6c645', { al: 'c', oc: '#2a140c' });
    face(r.who, x + 8, y + 16); tx(famName(r.who).length > 30 ? FAM[r.who].color + ' COUSIN' : famName(r.who), x + 42, y + 20, '#ffffff', { oc: '#2a140c' }); tx('ASKED FOR ' + ERRANDS[r.eid].ask + '.', x + 42, y + 31, '#d8b080');
    let yy = y + 50; yy += txBlock(r.line, x + 10, yy, w - 20, '#fff3e0', { lh: 9 }) + 4;
    let gx = x + 10; r.gains.forEach(G => { if (G.ic) { g.drawImage(G.ic, gx, yy - 4); gx += 18; } gx += tx(G.label, gx, yy, '#7ad050', { oc: '#2a140c' }) + 10; });
    if (r.reveal) tx('TURNS OUT HE\'S ' + r.reveal + '.', NW / 2, y + h - 34, '#f6c645', { al: 'c', oc: '#2a140c' });
    btn(x + w - 92, y + h - 22, 84, 16, 'NEXT', () => { if (++D.ri >= D.reports.length) D.phase = 'spread'; }, { gold: 1 });
  } else if (D.phase === 'spread') {
    h = Math.min(H - 60, 50 + Math.max(2, Math.ceil(D.spread.length / 2)) * 18); woodPanel(x, y, w, h); tx('THE SPREAD', NW / 2, y + 5, '#f6c645', { al: 'c', oc: '#2a140c' });
    if (!D.spread.length) txBlock('NOTHING IN THE PANTRY. SOMEBODY GRILLED CARROTS. EVERYBODY ACTED LIKE IT WAS ENOUGH.', x + 12, y + 22, w - 24, '#fff3e0', { al: 'c' });
    D.spread.forEach((k, j) => { const cx = x + 12 + (j % 2) * (w / 2 - 6), cy = y + 22 + Math.floor(j / 2) * 18; g.drawImage(icon(FOOD[k].ic), cx, cy - 5); tx(FOOD[k].name, cx + 20, cy, '#fff3e0'); tx('+' + FOOD[k].vibes, cx + w / 2 - 34, cy, '#7ad050', { al: 'r' }); });
    btn(x + w - 92, y + h - 22, 84, 16, 'NEXT', () => { D.phase = 'vibes'; D.vt = t; }, { gold: 1 });
  } else if (D.phase === 'vibes') {
    h = Math.min(H - 56, 20 + D.rows.length * 11 + 4 + 34 + 24); woodPanel(x, y, w, h); tx('THE VIBES', NW / 2, y + 5, '#f6c645', { al: 'c', oc: '#2a140c' });
    const k = Math.min(1, (t - D.vt) / 90); let sum = 0;
    D.rows.forEach(([lab, v], j) => { const yy = y + 20 + j * 11; const show = Math.round(v * clamp(k * 5 - j, 0, 1)); sum += show; tx(lab, x + 16, yy, '#f4e2bd'); tx(String(show), x + w - 16, yy, '#ffffff', { al: 'r' }); });
    if ((t - D.vt) % 8 === 0 && k < 1) sfx('tick');
    const ty = y + 20 + D.rows.length * 11 + 4; R_(x + 12, ty, w - 24, 1, '#a07450');
    tx('TOTAL ' + sum, x + 16, ty + 5, '#ffffff', { oc: '#2a140c' });
    if (k >= 1) { tx(D.tier, x + w - 16, ty + 5, '#f6c645', { al: 'r', oc: '#2a140c' }); if (ty + 18 < y + h - 18) tx('TIP JAR: +' + D.tip + ' CARROTS', NW / 2, ty + 18, '#7ad050', { al: 'c', oc: '#2a140c' }); if (!D.dinged) { D.dinged = 1; sfx('ding'); } }
    btn(x + w - 120, y + h - 22, 112, 16, D.finale ? 'ROLL CREDITS' : 'GOOD NIGHT', () => { if (D.finale) { D.phase = 'credits'; D.ct = 0; } else finishCook(); }, { gold: 1, off: k < 1 });
  }
};
function drawSagaCredits(D) {
  const list = ['GEORGIA BUNS', '', 'THE BIGGEST COOKOUT', 'IN GEORGIA', '', 'THE FAMILY'];
  for (let i = 0; i < FAM.length; i++) list.push(famName(i));
  list.push('', 'FRIENDS'); for (const k in SAVE.saga.guests) list.push(GUESTS[k].name);
  list.push('', 'AND THE BOBCAT', 'WHO SANG', '', 'MUSIC', 'THE GEORGIA BUNS ALBUM', 'IN 16-BIT', '', 'MADE IN GEORGIA', 'IN SPIRIT', '', 'THE WANTS NEVER STOP.', 'NEITHER DO THE COOKOUTS.');
  const y0 = NH - D.ct * .4; g.globalAlpha = .7; R_(NW / 2 - 110, 0, 220, NH, '#0a0612'); g.globalAlpha = 1;
  list.forEach((l, i) => { const y = Math.round(y0 + i * 13); if (y < -10 || y > NH) return; tx(l, NW / 2, y, i === 0 ? '#f6c645' : (list[i - 1] === '' ? '#7ad050' : '#ffffff'), { al: 'c', oc: '#2a140c' }); });
  if (y0 + list.length * 13 < NH * .4 || D.ct > 60) btn(NW - 110, NH - 24, 96, 16, D.ct > 60 && y0 + list.length * 13 > NH * .4 ? 'SKIP' : 'GOOD NIGHT', () => finishCook(), { gold: 1 });
}

/* ---------- mornings and the very first one ---------- */
SCREENS.morning = function () {
  const s = SAVE.saga, H = NH, t = SG.t, news = (SG.d.news || []).filter(id => wantDef(id)).slice(0, 3), gy = Math.round(H * .78), big = H >= 270;
  const [top, bot] = skyAt(.02); for (let i = 0; i < 20; i++) R_(0, Math.floor(gy * i / 20), NW, Math.ceil(gy / 20) + 1, css(mixRGB(top, bot, i / 19)));
  const sy = gy - 6 - Math.min(34, t * .4); g.globalAlpha = .3; pixCircle(NW * .78, sy, 24, '#fff6c8'); g.globalAlpha = 1; pixCircle(NW * .78, sy, 16, '#fff6c8');
  { const city = forestBase().find(l => l.city).c; g.globalAlpha = .7; g.drawImage(city, -30, gy - city.height + 10); g.globalAlpha = 1; }
  for (let x = -6; x < NW + 10; x += 13) pixCircle(x, gy - 5 - ((x * 3) % 5), 8 + ((x * 7) % 5), (x / 13) & 1 ? '#2c5a24' : '#33692a');
  R_(0, gy, NW, H - gy, '#4ea232'); R_(0, gy, NW, 2, '#8ad860'); for (let x = 0; x < NW; x += 3) if (hash(x, 9) < .5) R_(x, gy - 2, 1, 2, '#62b83a');
  tx('DAY ' + s.day, NW / 2, 10, '#ffffff', { al: 'c', sc: 3, oc: '#2a140c' });
  let y = 38;
  if (s.welcome) { y += txBlock('WELCOME BACK. YOUR GOLDEN CARROTS ARE WORTH ' + s.welcome + ' CARROTS IN THE BANK NOW. THE OLD DAYS ARE IN THE SCRAPBOOK ON THE BURROW WALL.', 40, y, NW - 80, '#2a140c', { al: 'c' }) + 4; }
  if (news.length) { tx(news.length > 1 ? 'THEY WOKE UP WANTING SOMETHING.' : 'HE WOKE UP WANTING SOMETHING.', NW / 2, y, '#2a140c', { al: 'c' }); y += 12; }
  else { tx('NOBODY NEW WANTS ANYTHING. YET.', NW / 2, y, '#2a140c', { al: 'c' }); y += 12; }
  news.forEach((id, k) => {
    const W = wantDef(id), x = Math.round(NW * (k + 1) / (news.length + 1)), set = famSet(W.who), sc2 = big ? 2 : 1;
    const fr = (t + k * 20) % 120 < 60 ? set.cheer[(t >> 3) & 1] : set.idle[0];
    fillEll(x, gy + 2, 14 * sc2, 3, '#3f8a2a');
    g.drawImage(fr, 0, 0, BW, BH, x - BAX * sc2, gy + 1 - BAY * sc2, BW * sc2, BH * sc2);
    const lines = txWrap(W.text, news.length > 2 ? 18 : 24).slice(0, 4), bw = Math.max(...lines.map(l => textW(l))) + 10, bh = lines.length * 9 + 6;
    const bx = Math.round(clamp(x - bw / 2, 4, NW - bw - 4)), by = Math.max(y, gy - BAY * sc2 - bh - 8);
    R_(bx - 1, by - 1, bw + 2, bh + 2, '#2a140c'); R_(bx, by, bw, bh, '#ffffff'); R_(x - 2, by + bh + 1, 4, 2, '#2a140c'); R_(x - 1, by + bh, 2, 2, '#ffffff');
    let left = Math.floor(Math.max(0, t - k * 25) * 1.4); lines.forEach((l, i) => { if (left > 0) tx(l.slice(0, left), bx + 5, by + 4 + i * 9, '#2a140c'); left -= l.length + 1; });
  });
  if (s.call) tx('...AND THE PEBBLE PHONE IS RINGING.', NW / 2, H - 38, (t & 16) ? '#fff3b0' : '#ffffff', { al: 'c', oc: '#2a140c' });
  btn(NW / 2 - 60, H - 24, 120, 18, 'LET\'S GO', () => { s.welcome = 0; writeSave(); sagaGo('hub'); }, { gold: 1, pulse: 1 });
};
const INTRO = [
  'SEVENTEEN COUSINS LIVE IN ONE BURROW IN THE FOREST, IN A PART OF ATLANTA THAT IS MOSTLY TREES.',
  'EVERY MORNING, ONE OF THEM WAKES UP WANTING SOMETHING. IT IS RARELY LOGICAL. IT IS ALWAYS URGENT.',
  'ONLY TWO OF THEM HAVE NAMES: THE ROOF BUN AND THE NIBBIN\' BUN. GET THE OTHERS WHAT THEY WANT, AND THEY EARN ONE TOO.',
  'YOU GET THREE SUNS A DAY. EVERY DAY ENDS WITH A COOKOUT.'
];
SCREENS.intro = function () {
  const s = SAVE.saga, i = SG.d.i || 0, H = NH;
  drawBurrowScene(burrowLayout(), []); g.globalAlpha = .55; R_(0, 0, NW, H, '#140a06'); g.globalAlpha = 1;
  const w = Math.min(NW - 40, 330), x = Math.round(NW / 2 - w / 2), lines = txWrap(INTRO[i], Math.floor((w - 24) / 6)), h = lines.length * 11 + 42, y = Math.round(H / 2 - h / 2);
  paper(x, y, w, h); let left = Math.floor(SG.t * 1.5); lines.forEach((l, k) => { if (left > 0) tx(l.slice(0, left), NW / 2, y + 10 + k * 11, '#2a140c', { al: 'c' }); left -= l.length + 1; });
  btn(x + w - 90, y + h - 22, 80, 16, i < INTRO.length - 1 ? 'NEXT' : 'START', () => {
    if (i < INTRO.length - 1) { SG.d.i = i + 1; SG.t = 0; return; }
    s.started = true; s.today.news = ['creek']; writeSave(); sagaGo('morning', { news: ['creek'] });
  }, { gold: 1 });
};
