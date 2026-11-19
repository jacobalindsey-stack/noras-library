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
  if (!scr) { if (s.started) scr = 'hub'; else { s.started = true; s.today.news = ['creek']; writeSave(); scr = 'morning'; d = { news: ['creek'] }; } }
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
// the burrow is drawn in layers: a cached sky, drifting clouds, a cached scene, then everything that moves
let BUR_SKY = null, BUR_FG = null, BUR_K = '', BUR_OAK = null, BUR_OAKK = '';
function burrowOak(h) {
  const k = String(h); if (BUR_OAK && BUR_OAKK === k) return BUR_OAK; BUR_OAKK = k;
  const W = 80, s = new Spr(W, h);
  s.cyl(48, h * .3, 18, h * .7, [7, 8, 9, 8], true);
  for (let y = Math.floor(h * .34); y < h; y += 7) { s.set(52, y, 7); s.set(53, y + 1, 7); }
  s.cyl(14, h * .42, 36, 5, [7, 8, 9, 8]);
  s.canopy(46, h * .2, 40, h * .17, 26, [1, 2, 3, 4, 5], 61);
  s.canopy(30, h * .34, 22, h * .08, 9, [1, 2, 3, 4, 5], 62);
  return (BUR_OAK = s.outline(6).canvas(palette(['#1e4a1a', '#2f6e26', '#47922f', '#69b844', '#9ade6a', '#14260e', '#3a2416', '#5a3a26', '#7a5236'])));
}
function drawBurrowStatic(L, spent) {
  const s = SAVE.saga, { H, gy, wallTop, roofTop, cy, ry } = L, own = k => !!s.stash[k];
  const x0 = 4, x1 = 252;
  // far city and a tree line
  { const city = forestBase().find(l => l.city).c; g.globalAlpha = .85; g.drawImage(city, -60, gy - city.height + 8); g.globalAlpha = 1; }
  for (let x = -6; x < NW + 10; x += 13) { const r = 9 + ((x * 7) % 6); pixCircle(x, gy - 6 - ((x * 3) % 5), r, (x / 13) & 1 ? '#2c5a24' : '#33692a'); pixCircle(x - 3, gy - 9 - ((x * 3) % 5), Math.max(2, r - 6), '#3f7a2e'); }
  // clay, strata, stones and roots
  for (let y = gy; y < H; y++) { const q = Math.floor((y - gy + 2) / 9); g.fillStyle = css(CLAY[(q + 5) % 5]); g.fillRect(0, y, NW, 1); }
  for (let y = gy + 8; y < H; y += 9) for (let x = 0; x < NW; x += 2) if (hash(x, y) < .3) R_(x, y + Math.round(Math.sin(x * .05) * 1.5), 2, 1, '#8a3418');
  srand(83); for (let i = 0; i < 46; i++) { const sx = rnd() * NW, sy = gy + 8 + rnd() * (H - gy - 10), r = 1 + rnd() * 2.6; if (Math.hypot((sx - 104) / 96, (sy - cy) / (ry + 3)) < 1 || Math.hypot((sx - 318) / 98, (sy - cy) / (ry + 3)) < 1) continue; fillEll(sx, sy, r, Math.max(1, r * .7), '#8a8478'); R_(sx - r * .4, sy - r * .5, Math.max(1, r * .6), 1, '#c8c0b4'); R_(sx - r * .2, sy + r * .4, Math.max(1, r), 1, '#5a544c'); }
  for (let i = 0; i < 70; i++) R_((i * 67) % NW, gy + 6 + (i * 37) % (H - gy - 6), 2, 1, i % 3 ? '#7a2a14' : '#d07850');
  g.strokeStyle = '#4a1c0c'; g.lineWidth = 1; srand(87); for (let i = 0; i < 14; i++) { let rx = 8 + rnd() * (NW - 16), ry2 = gy + 2; if (rx > x0 && rx < x1) continue; g.beginPath(); g.moveTo(rx, ry2); const len = 6 + rnd() * 22; for (let k = 0; k < len; k += 2) { rx += (rnd() - .5) * 2.4; ry2 += 2; g.lineTo(rx + .5, ry2); } g.stroke(); }
  // grass with mowing stripes, blades and flowers
  for (let x = 0; x < NW; x++) { R_(x, gy - 2, 1, 5, ((x / 14) | 0) & 1 ? '#4ea232' : '#58ad38'); if (hash(x, 3) < .55) R_(x, gy - 3 - (hash(x, 4) < .3 ? 1 : 0), 1, 1 + (hash(x, 5) < .3), hash(x, 6) < .5 ? '#62b83a' : '#8ad860'); }
  R_(0, gy + 3, NW, 1, '#2f6a1e');
  for (let i = 0; i < 18; i++) { const fx = x1 + 8 + (i * 47) % (NW - x1 - 10); if (fx > 292 && fx < 346) continue; R_(fx, gy - 4, 1, 2, '#3f8a2a'); R_(fx - 1, gy - 5, 3, 1, i % 3 ? '#ffffff' : '#ffd040'); R_(fx, gy - 6, 1, 1, i % 3 ? '#ffffff' : '#ffd040'); }
  // the burrow chambers and tunnel
  // one connected burrow: a rabbit hole in the lawn, a tunnel curving down into the dorm, a passage between the two rooms
  const holeX = 274, tunnel = [], pass = [];
  for (let k = 0; k <= 1.001; k += .02) { const u = 1 - k, ax = holeX, ay = gy + 1, cx2 = holeX - 4, cy2 = gy + (cy - gy) * .78, bx = 250, by = cy - ry * .42; tunnel.push([u * u * ax + 2 * u * k * cx2 + k * k * bx, u * u * ay + 2 * u * k * cy2 + k * k * by, lerp(5.5, 7.5, k)]); }
  for (let x = 178; x <= 240; x += 2) pass.push([x, cy + ry * .28, 6.5]);
  const rooms = [[104, 94], [318, 96]];
  for (const [px, py, r] of tunnel.concat(pass)) fillEll(px, py, r + 2, r + 2, '#6a2a14');
  for (const [ccx, rx] of rooms) fillEll(ccx, cy, rx + 2, ry + 2, '#6a2a14');
  for (const [px, py, r] of tunnel.concat(pass)) fillEll(px, py, r, r, '#3b1d10');
  for (const [ccx, rx] of rooms) { fillEll(ccx, cy, rx, ry, '#3b1d10'); fillEll(ccx, cy + ry * .55, rx - 6, ry * .4, '#331709'); for (let k = 0; k < 40; k++) R_(ccx - rx + 8 + (k * 37) % (rx * 2 - 16), cy + ry - 4 - (k % 3), 2, 1, '#5a3418'); }
  // packed-dirt floors and a little lip of light along the tunnel's lower edge
  for (const [px, py, r] of pass) R_(px - 1, py + r - 2, 3, 1, '#4e2a16');
  // dug dirt either side of the hole
  fillEll(holeX - 9, gy - 1, 5, 2.2, '#8a4a2a'); fillEll(holeX + 9, gy - 1, 5, 2.2, '#8a4a2a'); R_(holeX - 12, gy - 3, 4, 1, '#b06a3a'); R_(holeX + 6, gy - 3, 4, 1, '#b06a3a');
  fillEll(holeX, gy, 7, 2.6, '#1e0e06');
  // stash shelves with brackets
  const sh = 21, shelves = Math.max(1, Math.min(3, Math.floor((ry * 2 - 12) / sh)));
  for (let r = 0; r < shelves; r++) { const y = cy - ry + 8 + (r + 1) * sh; R_(26, y, 156, 3, '#8a5a3a'); R_(26, y, 156, 1, '#b07a50'); R_(26, y + 3, 156, 1, '#4a2a16'); for (const bx of [34, 102, 170]) { R_(bx, y + 3, 2, 4, '#5a3a22'); R_(bx + 2, y + 4, 2, 2, '#5a3a22'); } }
  const owned = Object.keys(s.stash).filter(k => STASH[k]);
  owned.slice(-shelves * 9).forEach((k, i) => { const r = Math.floor(i / 9), c = i % 9, y = cy - ry + 8 + (r + 1) * sh; g.globalAlpha = .35; R_(32 + c * 16, y - 1, 12, 1, '#000000'); g.globalAlpha = 1; g.drawImage(icon(STASH[k].ic), 30 + c * 16, y - 16); });
  if (own('trunk')) g.drawImage(icon(STASH.trunk.ic), 0, 0, 16, 16, 150, cy + ry - 22, 22, 22);
  // dorm: pine straw beds
  for (let b = 0; b < 8; b++) { const bx = 236 + b * 20, by = cy + ry - 8; fillEll(bx + 1, by + 1, 10, 3, '#2a1208'); fillEll(bx + 1, by - 1, 9, 3, '#c8913a'); for (let k = 0; k < 9; k++) R_(bx - 7 + k * 2, by - 3 + (k * 7) % 3, 2, 1, k & 1 ? '#e8b85e' : '#a8742a'); }
  // the house: roof with shingle tabs, a gutter, a brick chimney
  for (let y = roofTop; y < wallTop; y++) { const k = (y - roofTop) / (wallTop - roofTop), a = lerp(x0 + 34, x0 - 6, k), b = lerp(x1 - 34, x1 + 6, k), row = Math.floor((y - roofTop) / 4), within = (y - roofTop) % 4;
    R_(a, y, b - a, 1, within === 0 ? '#3a2838' : row & 1 ? '#4a3648' : '#574258');
    for (let x = Math.ceil(a) + (row & 1) * 5; x < b; x += 10) if (within) R_(x, y, 1, 1, '#3a2838'); if (within === 1) R_(a, y, b - a, 1, row & 1 ? '#5a4658' : '#665268'); }
  R_(x0 + 34, roofTop - 1, x1 - x0 - 68, 2, '#2a1828'); R_(x0 - 7, wallTop - 1, x1 - x0 + 14, 2, '#8a8e98'); R_(x0 - 7, wallTop - 1, x1 - x0 + 14, 1, '#c8ccd4'); R_(x1 + 5, wallTop, 2, gy - wallTop, '#8a8e98');
  R_(196, roofTop - 12, 10, 12, '#7a3a2a'); for (let y = roofTop - 12; y < roofTop; y += 3) for (let x = 196 + ((y / 3) & 1) * 2; x < 206; x += 4) R_(x, y, 3, 2, '#9a4a32'); R_(194, roofTop - 14, 14, 3, '#5a2a1e'); R_(194, roofTop - 14, 14, 1, '#7a4a3a');
  // walls: wallpaper, crown molding, baseboard, plank floor
  R_(x0, wallTop, x1 - x0, gy - wallTop, '#e2b77a');
  for (let x = 126; x < x1; x += 8) { R_(x, wallTop + 4, 2, gy - wallTop - 18, '#d6a86c'); for (let y = wallTop + 8; y < gy - 16; y += 8) R_(x + 5, y, 1, 1, '#c8945c'); }
  R_(126, wallTop + 2, x1 - 126, 2, '#a07448'); R_(126, wallTop + 4, x1 - 126, 1, '#7a5236');
  R_(126, gy - 14, x1 - 126, 10, '#c08a50'); R_(126, gy - 14, x1 - 126, 1, '#e8c890'); R_(126, gy - 5, x1 - 126, 1, '#8a5a32');
  R_(x0, gy - 4, x1 - x0, 4, '#8a5a32'); for (let x = x0; x < x1; x += 12) R_(x, gy - 4, 1, 4, '#6a4224'); R_(x0, gy - 4, x1 - x0, 1, '#a87448');
  fillEll(160, gy - 2, 30, 2.5, '#b8302a'); fillEll(160, gy - 2, 24, 1.6, '#e8a050');
  // garage: block wall, rolled-up door, oil stain, a pegboard
  R_(x0, wallTop, 116, gy - wallTop, '#6a5a52'); for (let y = wallTop + 18; y < gy - 4; y += 6) { R_(x0, y, 116, 1, '#5a4c46'); for (let x = x0 + ((y / 6) & 1) * 6; x < 120; x += 12) R_(x, y, 1, 6, '#5a4c46'); }
  R_(x0 + 2, wallTop + 2, 116, 4, '#4a3e38'); for (let y = wallTop + 6; y < wallTop + 18; y += 3) { R_(x0 + 2, y, 116, 1, '#5a4e48'); R_(x0 + 2, y + 1, 116, 1, '#6e625a'); } R_(x0 + 56, wallTop + 17, 8, 2, '#2a2420');
  if (gy - wallTop > 70) { R_(x0 + 8, wallTop + 21, 30, 12, '#a07448'); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) R_(x0 + 10 + i * 5, wallTop + 23 + j * 4, 1, 1, '#5a3a22'); R_(x0 + 12, wallTop + 23, 2, 8, '#9aa3ad'); R_(x0 + 20, wallTop + 24, 6, 2, '#9aa3ad'); R_(x0 + 22, wallTop + 24, 2, 7, '#7a5236'); R_(x0 + 30, wallTop + 23, 3, 8, '#c8302a'); }
  fillEll(70, gy - 3, 18, 1.5, '#4a403a');
  if (own('skis')) { R_(110, gy - 34, 2, 30, '#c8302a'); R_(114, gy - 32, 2, 28, '#2a6ab8'); }
  R_(x0 - 2, wallTop, 3, gy - wallTop, '#a07448'); R_(120, wallTop, 6, gy - wallTop, '#a07448'); R_(121, wallTop, 1, gy - wallTop, '#c89a6a'); R_(x1 - 2, wallTop, 4, gy - wallTop, '#a07448'); R_(x0 - 2, wallTop - 2, x1 - x0 + 4, 3, '#7a5236');
  g.globalAlpha = .25; R_(x0, wallTop + 1, x1 - x0, 3, '#000000'); g.globalAlpha = 1;
  // postcards (the scrapbook), couch, record player, fridge with magnets
  for (let i = 0; i < 4; i++) { const px = 132 + i * 12, py = wallTop + 8 + (i & 1) * 3; R_(px, py, 10, 8, '#2a140c'); R_(px + 1, py + 1, 8, 6, ['#5aa8ff', '#ffd890', '#ffb070', '#8d9ccb'][i]); R_(px + 1, py + 5, 8, 2, ['#5cb83a', '#7ccf4a', '#f2dca8', '#9a9488'][i]); R_(px + 4, py, 2, 1, '#e03030'); }
  R_(127, gy - 26, 6, 22, '#6a2e4c'); R_(173, gy - 26, 6, 22, '#6a2e4c'); R_(127, gy - 26, 6, 2, '#8a3e64'); R_(173, gy - 26, 6, 2, '#8a3e64');
  R_(130, gy - 22, 46, 10, '#7a3a5a'); R_(130, gy - 22, 46, 2, '#9a4a72'); R_(152, gy - 22, 1, 10, '#5a2a44');
  R_(132, gy - 12, 42, 8, '#9a4a72'); R_(132, gy - 12, 42, 1, '#b8628c'); R_(153, gy - 12, 1, 8, '#7a3a5a'); R_(132, gy - 5, 42, 1, '#5a2a44');
  R_(136, gy - 20, 8, 7, '#f6c645'); R_(136, gy - 20, 8, 1, '#fff3b0'); R_(176, gy - 24, 2, 2, '#3b1d10'); R_(175, gy - 21, 2, 2, '#3b1d10'); R_(174, gy - 18, 2, 1, '#3b1d10');
  R_(188, gy - 18, 20, 14, '#5a3a22'); R_(188, gy - 18, 20, 2, '#8a5a3a'); for (let y = gy - 15; y < gy - 4; y += 3) R_(190, y, 16, 1, '#4a2a16'); R_(190, gy - 24, 16, 6, '#2a2430'); R_(190, gy - 24, 16, 1, '#4a4450');
  if (own('speaker')) { R_(208, gy - 30, 12, 26, '#1a1420'); fillEll(214, gy - 12, 4, 4, '#3a3440'); fillEll(214, gy - 24, 2.5, 2.5, '#3a3440'); R_(208, gy - 30, 12, 1, '#4a4450'); }
  R_(226, wallTop + 6, 22, gy - wallTop - 10, '#2a140c'); R_(227, wallTop + 7, 20, gy - wallTop - 12, '#e8ece8'); R_(227, wallTop + 7, 2, gy - wallTop - 12, '#ffffff'); R_(245, wallTop + 7, 2, gy - wallTop - 12, '#c8ccd0');
  R_(227, wallTop + 7 + Math.round((gy - wallTop) * .35), 20, 1, '#9aa3ad'); R_(243, wallTop + 12, 1, 8, '#9aa3ad'); R_(243, wallTop + 14 + Math.round((gy - wallTop) * .35), 1, 10, '#9aa3ad');
  R_(230, wallTop + 11, 12, 16, '#fff8e0'); for (let k = 0; k < 4; k++) R_(232, wallTop + 14 + k * 3, 8, 1, '#7a5236'); R_(234, wallTop + 9, 4, 3, '#e8dca0');
  for (const [mx, my, mc] of [[229, 32, '#e03030'], [240, 30, '#3a7ad8'], [233, 40, '#ff8a1c'], [241, 44, '#3fb04a']]) if (wallTop + my < gy - 8) R_(mx, wallTop + my, 3, 3, mc);
  // lawn: stepping stones, mailbox, garden with a picket fence, the grill
  for (let i = 0; i < 5; i++) fillEll(292 + i * 18, gy - 1, 5, 1.2, i & 1 ? '#a8a49c' : '#b8b4ac');
  R_(260, gy - 24, 2, 22, '#6a4224'); R_(261, gy - 24, 1, 22, '#8a5a32'); R_(255, gy - 30, 12, 8, '#3a5aa8'); R_(255, gy - 30, 12, 1, '#6a8ad8'); R_(255, gy - 23, 12, 1, '#243a78'); R_(254, gy - 28, 1, 5, '#2a3a80');
  for (let r = 0; r < 3; r++) { fillEll(320, gy - 3 - r * 3, 24 - r * 2, 1.3, '#5a3a24'); for (let x = 300 + r * 2; x < 342 - r * 2; x += 6) { if (r === 1) { fillEll(x + 1, gy - 7 - r * 3, 2.2, 1.8, '#4f9a34'); R_(x, gy - 8 - r * 3, 1, 1, '#9ade6a'); } else { R_(x + 1, gy - 8 - r * 3, 1, 4, '#3fb04a'); R_(x, gy - 9 - r * 3, 1, 2, '#62c044'); R_(x + 2, gy - 9 - r * 3, 1, 2, '#62c044'); } } }
  for (let x = 294; x < 348; x += 5) { R_(x, gy - 12, 2, 10, '#f4f0e8'); R_(x, gy - 13, 1, 1, '#f4f0e8'); R_(x + 1, gy - 12, 1, 10, '#c8c4bc'); } R_(294, gy - 9, 54, 1, '#e8e4dc');
  if (own('pool')) { fillEll(282, gy - 1, 12, 3, '#ff4fa0'); fillEll(282, gy - 2, 10, 2, '#5aa8ff'); R_(279, gy - 3, 3, 1, '#bfe8ff'); }
  if (own('smoker')) { fillEll(358, gy - 14, 6, 6, '#3a3a40'); R_(354, gy - 26, 3, 10, '#5a5a60'); R_(354, gy - 8, 2, 6, '#2a2a30'); R_(361, gy - 8, 2, 6, '#2a2a30'); }
  const gx = 366; fillEll(gx + 13, gy - 18, 13, 7, '#1a1a1e'); fillEll(gx + 13, gy - 20, 12, 6, '#2e2e34'); fillEll(gx + 10, gy - 23, 6, 2, '#4a4a52'); R_(gx, gy - 17, 26, 2, '#141418'); R_(gx + 12, gy - 27, 3, 2, '#5a5a62');
  R_(gx + 4, gy - 12, 2, 11, '#2a2a30'); R_(gx + 20, gy - 12, 2, 11, '#2a2a30'); R_(gx + 12, gy - 12, 2, 10, '#2a2a30'); fillEll(gx + 5, gy - 2, 2, 2, '#1a1a1e');
  if (own('grill')) { R_(gx - 4, gy - 24, 4, 1, '#9aa3ad'); R_(gx - 5, gy - 26, 1, 3, '#9aa3ad'); }
  // Sunny's oak, lit clumps and bark
  const oak = burrowOak(gy + 6); g.drawImage(oak, 372, -6);
  if (own('hammock')) { g.strokeStyle = '#5a3a22'; g.beginPath(); g.moveTo(405, gy - 34); g.quadraticCurveTo(388, gy - 14, 368, gy - 30); g.stroke(); for (let x = 372; x < 402; x += 2) R_(x, gy - 24 + Math.round(Math.sin((x - 368) / 37 * Math.PI) * 6), 1, 3, '#e8c870'); }
}
function drawBurrowScene(L, featured) {
  const s = SAVE.saga, t = S.t, { H, gy, wallTop, roofTop, cy, ry } = L, own = k => !!s.stash[k];
  const spent = clamp(1 - s.sun / sunsPerDay(), 0, 1);
  const key = [NW, NH, Math.round(spent * 8), Object.keys(s.stash).filter(k => STASH[k]).sort().join(',')].join('|');
  if (key !== BUR_K) { BUR_K = key; const gg = g;
    BUR_SKY = mkC(NW, gy + 4); g = BUR_SKY.getContext('2d'); const [top, bot] = skyAt(.08 + spent * .9);
    for (let i = 0; i < 24; i++) R_(0, Math.floor(gy * i / 24), NW, Math.ceil(gy / 24) + 1, css(mixRGB(top, bot, i / 23)));
    const sx = 300 + spent * 66, sy = 26 + spent * gy * .5, sc = mixRGB(rgb('#fff6c8'), rgb('#ff8a3a'), spent);
    g.globalAlpha = .18; pixCircle(sx, sy, 22, css(sc)); g.globalAlpha = .3; pixCircle(sx, sy, 15, css(sc)); g.globalAlpha = 1; pixCircle(sx, sy, 10, css(sc));
    BUR_FG = mkC(NW, NH); g = BUR_FG.getContext('2d'); drawBurrowStatic(L, spent); g = gg; }
  g.drawImage(BUR_SKY, 0, 0);
  { const F = forestBase(), far = F[0].c, near = F[1].c; let ox = -((t * .05) % far.width); g.globalAlpha = .7; g.drawImage(far, ox, 2); g.drawImage(far, ox + far.width, 2); g.globalAlpha = 1; ox = -((t * .12) % near.width); g.drawImage(near, ox, 8 - (NH < 230 ? 14 : 0)); g.drawImage(near, ox + near.width, 8 - (NH < 230 ? 14 : 0)); }
  g.drawImage(BUR_FG, 0, 0);
  // light: the living-room lamp, lanterns underground, the garage bulb
  const flick = .9 + .1 * Math.sin(t * .23) * Math.sin(t * .07);
  glow(200, wallTop + 22, 38, '#ffd68a', (.05 + spent * .05) * flick); glow(64, wallTop + 24, 28, '#fff0c0', .05 * flick);
  R_(200, wallTop + 4, 1, 8, '#2a140c'); fillEll(200.5, wallTop + 13, 4, 2.5, '#c8913a'); R_(198, wallTop + 15, 5, 1, '#fff3b0');
  R_(64, wallTop + 4, 1, 12, '#2a2420'); R_(62, wallTop + 16, 5, 4, (t & 64) || s.sun ? '#fff6d0' : '#ffe9a0');
  for (const lx of [104, 318]) { glow(lx, cy - ry * .3, Math.min(56, ry * 1.3), '#ffd68a', .055 * flick); R_(lx - 1, cy - ry + 2, 1, 6, '#2a140c'); R_(lx - 4, cy - ry + 8, 7, 5, '#5a3a22'); R_(lx - 3, cy - ry + 9, 5, 3, flick > .95 ? '#fff3b0' : '#ffe08a'); }
  // the record spins, the grill glows, the Escalade waits (with whatever you've bolted onto it)
  { const a = t * .3; R_(198 + Math.round(Math.cos(a) * 2), gy - 23 + Math.round(Math.sin(a) * .6), 1, 1, '#ffffff'); R_(198, gy - 22, 1, 1, ['#f6c645', '#ff4fa0', '#7ad050'][(t >> 4) % 3]); R_(203, gy - 26, 1, 4, '#9aa3ad'); }
  if (own('neon')) { g.globalAlpha = .45 + .15 * Math.sin(t * .1); R_(10, gy - 7, 104, 4, ['#ff4fa0', '#4fe0ff', '#a060ff'][(t >> 5) % 3]); g.globalAlpha = 1; }
  g.drawImage(A.escL, 6, gy - 52 + (own('subs') && (t % 30 < 3) ? 1 : 0));
  if (own('rims')) for (const wx of [25, 89]) { g.strokeStyle = '#f6c645'; g.beginPath(); g.arc(wx, gy - 12, 6, 0, 7); g.stroke(); R_(wx - 1, gy - 13, 2, 2, '#fff3b0'); }
  if (own('bumper')) { R_(110, gy - 20, 2, 2, '#3b1d10'); R_(112, gy - 18, 2, 2, '#3b1d10'); }
  const gx = 366; if (s.sun === 0 || (t & 8)) { R_(gx + 4, gy - 14, 18, 2, '#ff6a2a'); if (s.sun === 0) glow(gx + 13, gy - 14, 18, '#ff9a3a', .1 + .04 * Math.sin(t * .3)); }
  if (t % 9 === 0) part({ type: 'smoke', x: gx + 13, y: gy - 28, vx: .15, vy: -.45, life: 70 });
  if (t % 23 === 0) part({ type: 'smoke', x: 201, y: roofTop - 16, vx: .1, vy: -.35, life: 90 });
  // owned extras in the oak: lights strung to the roof, a disco ball for Sunny
  if (own('lights')) { const L0 = [x1edge(), wallTop - 2], L1 = [404, gy - 52]; for (let i = 0; i <= 18; i++) { const k = i / 18, x = lerp(L0[0], L1[0], k), y = lerp(L0[1], L1[1], k) + Math.sin(k * Math.PI) * 10; R_(x, y, 1, 1, '#2a140c'); if (i % 2 === 0) R_(x - 1, y + 1, 3, 3, ((i + (t >> 4)) % 3) ? '#ffd86a' : '#ff9a5a'); } }
  if (own('disco')) { const dx = 392, dy = Math.max(30, wallTop - 10); R_(dx, dy - 10, 1, 10, '#9aa3ad'); fillEll(dx, dy + 3, 4, 4, '#c8ced8'); for (let k = 0; k < 4; k++) R_(dx - 3 + ((k + (t >> 3)) % 4) * 2, dy + 1 + (k & 1) * 2, 1, 1, '#ffffff'); }
  g.drawImage(A.sq[(t % 90 < 10) ? 1 : 0], 398, Math.max(44, Math.round(gy * .36)));
  // sleepers in the dorm
  const sleepers = []; for (let i = 2; i < FAM.length && sleepers.length < 4; i++) if (!featured.includes(i) && !isAway(i)) sleepers.push(i);
  sleepers.forEach((i, k) => { const bx = 236 + (k * 2 + 1) * 20 - 10, by = cy + ry - 9; drawSpr(famSet(i).sleep[0], bx, by, 0, k & 1 ? 1 : -1, BAX, BAY); if ((t + k * 25) % 100 === 0) part({ type: 'z', x: bx + 6, y: by - 16, vx: .2, vy: -.4, life: 60 }); });
  // the Roof Bun up top with the pebble phone (only place it gets signal), the Nibbin' Bun on the couch
  { const ring = s.call && (t & 8); g.drawImage(A.phone[(t >> 4) & 1], 168 + (ring ? ((t >> 1) & 1) * 2 - 1 : 0), roofTop - 22); if (s.call && t % 40 < 20) tx('!', 176, roofTop - 34, '#fff3b0', { oc: '#2a140c' }); }
  drawSpr(A.roof.wave[(t >> 4) & 1], 150, roofTop + 1, 0, 1, BAX, BAY);
  drawSpr(A.nib.chomp[(t % 90 < 50) ? (t >> 2) & 1 : 0], 158, gy - 11, 0, 1, BAX, BAY);
  // dusk: the yard dims, the windows stay warm
  if (spent > .5) { g.globalAlpha = (spent - .5) * .35; R_(x1edge() + 6, 0, NW, gy, '#2a1850'); R_(0, 0, NW, roofTop - 2, '#2a1850'); g.globalAlpha = 1; }
  for (const q of S.parts) drawPart(q);
}
function x1edge() { return 252; }
// a soft glow in a few dithered-looking steps
function glow(x, y, r, col, a) { for (let k = 4; k >= 1; k--) { g.globalAlpha = a; pixCircle(x, y, Math.round(r * k / 4), col); } g.globalAlpha = 1; }
const SCREENS = {};
SCREENS.hub = function () {
  const s = SAVE.saga, L = burrowLayout(), { gy, wallTop, roofTop, cy, ry } = L, t = S.t;
  const open = openWants(), featured = [], fw = {};
  for (const id of open) { const w = wantDef(id).who; if (w > 1 && !featured.includes(w) && featured.length < 4) { featured.push(w); fw[w] = id; } else if (w <= 1 && !fw[w]) fw[w] = id; }
  drawBurrowScene(L, featured);
  const slots = [204, 290, 324, 352].slice(0, featured.length);
  // hot spots for the house
  hot(4, wallTop, 116, gy - wallTop, () => sagaGo('map'));
  hot(126, wallTop + 4, 52, 14, () => enterScrapbook());
  hot(164, roofTop - 26, 34, 26, () => s.call ? sagaGo('phone', { id: s.call, i: 0 }) : toast('THE PEBBLE PHONE. IT ONLY GETS SIGNAL ON THE ROOF. NOBODY\'S CALLING.'));
  hot(186, gy - 26, 24, 22, () => toast(Object.keys(s.stash).filter(k => STASH[k] && STASH[k].cat === 'records').length + ' RECORDS. PICK ANY SONG FROM THE PAUSE MENU.'));
  hot(224, wallTop + 4, 26, gy - wallTop - 6, () => sagaGo('wants'));
  hot(252, gy - 34, 18, 32, () => s.day >= 2 ? sagaGo('wants', { tab: 'errands' }) : toast('NO ERRANDS UNTIL TOMORROW. THE COUSINS ARE STILL WAKING UP.'));
  hot(366, gy - 40, 34, 40, () => s.sun > 0 ? confirmBox('CALL IT A DAY? YOU STILL HAVE ' + s.sun + (s.sun > 1 ? ' SUNS' : ' SUN') + ' LEFT.', 'COOKOUT', startSagaCook) : startSagaCook(), { snd: 'crew' });
  hot(10, cy - ry, 188, ry * 2, () => sagaGo('stash'));
  hot(222, cy - ry, 192, ry * 2, () => sagaGo('family'));
  hot(132, roofTop - 44, 32, 44, () => s.call ? sagaGo('phone', { id: s.call, i: 0 }) : toast(fw[0] ? 'THE ROOF BUN WANTS SOMETHING. CHECK THE WANT LIST.' : ['NICE DAY FOR IT. FROM UP HERE.', 'I CAN SEE THE CREEK. AND THE BOBCAT. HE CAN SEE ME.', 'NOT COMING DOWN. DON\'T ASK.'][Math.floor(t / 300) % 3]));
  hot(140, gy - 54, 36, 44, () => fw[1] ? sagaGo('brief', { id: fw[1] }) : toast(['THE COUCH TASTES LIKE TUESDAY.', 'I\'M NOT EATING IT. I\'M TESTING IT.', 'HAVE Y\'ALL TRIED THE MAILBOX?'][Math.floor(t / 300) % 3]));
  hot(392, 20, 32, wallTop, () => toast(['SUNNY: HMM.', 'SUNNY: I SEE YOU, BOYS.', 'SUNNY: SLOW DOWN.'][Math.floor(t / 300) % 3]));
  // cousins who want something
  featured.forEach((i, k) => { const x = slots[k], y = gy - 3, id = fw[i], sp = wantStep(id);
    { const st = famSet(i), ph = (t + k * 97) % 360, fr = ph < 150 ? st.idle[((t >> 3) + k * 7) % 40 === 0 ? 1 : 0] : ph < 160 ? st.q[0] : ph < 250 ? st.front[(ph % 90 > 84) ? 1 : 0] : st.tap[(t >> 3) & 1]; drawSpr(fr, x, y, 0, x > 300 ? -1 : 1, BAX, BAY); }
    bubbleIcon(x, y - 60, stepIcon(sp), true);
    hot(x - 14, y - 72, 28, 72, () => sagaGo('brief', { id }), { snd: 'wake' }); });
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
  menuBG();
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
  menuBG();
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
  menuBG();
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
  const drw = W.steps.find(q => q.drift), R = st.drift === 'go' && drw ? drw.drift.goReward : W.reward, rw = rewardList(R); let rx = x;
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
  menuBG();
  tx('LOSING THE PLOT', NW / 2, 12, '#f6c645', { al: 'c', sc: 2, oc: '#2a140c' });
  { const sc2 = H >= 260 ? 2 : 1, fy = H - 78; [[W.who, 70, 1], [0, NW - 70, -1]].forEach(([i, fx, f]) => { const fr = famSet(i).idle[(S.t % 120 > 112) ? 1 : 0]; fillEll(fx, fy + 1, 16 * sc2, 3, '#4e3220'); g.save(); g.translate(fx, fy); g.scale(f * sc2, sc2); g.drawImage(fr, -BAX, -BAY); g.restore(); }); }
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
  const id = x.createImageData(NW, NH), d = id.data, top = 22, put = (xx, yy, c) => { const o = (yy * NW + xx) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; };
  const sea = [rgb('#2a6aa8'), rgb('#3a7ab8'), rgb('#4a8ac8'), rgb('#6aa8d8')], land = [rgb('#7cb858'), rgb('#8cc860'), rgb('#9cd468'), rgb('#6aa84c')];
  const [bx, by] = mapXY('boulder'), [fx, fy] = mapXY('farm'), [mx, my] = mapXY('marsh');
  for (let yy = 0; yy < NH; yy++) for (let xx = 0; xx < NW; xx++) {
    const cxl = coastX(yy), dist = cxl - xx, th = (BAY4[(yy & 3) * 4 + (xx & 3)] + .5) / 16; let c;
    if (yy < top || dist < 0) { const depth = Math.min(1, -dist / 60); c = sea[Math.min(3, Math.max(0, 3 - Math.floor(depth * 3 + th)))]; if (yy < top) c = sea[1]; }
    else if (dist < 3) c = rgb('#e8d8a0');
    else { const n = Math.sin(xx * .05 + yy * .03) * .5 + Math.sin(xx * .013 - yy * .021 + 2) * .5 + (hash(xx >> 2, yy >> 2) - .5) * .4; c = land[n > .45 ? 2 : n > -.2 ? 1 : n > -.6 ? 0 : 3];
      { const e = Math.hypot((xx - bx) / 64, (yy - by) / 46); if (e < 1 && (1 - e) * 1.4 > th) c = mixRGB(c, [176, 160, 120], .32); }
      if (dist < 26 && Math.abs(yy - my) < 50) c = mixRGB(c, [150, 150, 90], .4 * (1 - dist / 26));
      if (Math.abs(xx - fx) < 34 && Math.abs(yy - fy) < 22 && Math.hypot(xx - fx, yy - fy) > 10) { const stripe = Math.floor((xx + yy * .5) / 5) & 3; c = [rgb('#c8b860'), rgb('#9cc460'), rgb('#b0d070'), rgb('#d8c070')][stripe]; } }
    put(xx, yy, c); }
  x.putImageData(id, 0, 0);
  // a river to the sea and the lake past the creek
  { x.strokeStyle = '#4a8ac8'; x.lineWidth = 3; x.beginPath(); const [ax, ay] = mapXY('atl'); x.moveTo(ax - 50, top + 2); x.bezierCurveTo(ax - 30, ay, ax + 40, ay + 40, mx - 30, my - 30); x.quadraticCurveTo(mx - 8, my - 10, coastX(my - 4) + 2, my - 4); x.stroke(); x.strokeStyle = '#8ac0e8'; x.lineWidth = 1; x.stroke(); }
  { const [ox, oy] = mapXY('forest'); fillEll(ox - 26, oy + 16, 14, 6, '#3a7ab8'); fillEll(ox - 26, oy + 15, 12, 4, '#4a8ac8'); R_(ox - 30, oy + 14, 5, 1, '#bfe8ff'); }
  // tree clumps: lit from the upper left
  srand(91); for (let i = 0; i < 70; i++) { const tx2 = 8 + rnd() * (NW - 16), ty = top + 8 + rnd() * (NH - top - 14); if (tx2 > coastX(ty) - 10) continue; const near = Object.keys(MAPPOS).some(k => { const [px, py] = mapXY(k); return Math.hypot(px - tx2, py - ty) < 22; }); if (near) continue;
    for (let k = 0; k < 3; k++) { const ex = tx2 + (k - 1) * 3, ey = ty + (k & 1) * 2; fillEll(ex + 1, ey + 1, 3, 2.6, '#3a6a2a'); fillEll(ex, ey, 3, 2.6, '#4f8f34'); R_(ex - 1, ey - 2, 2, 1, '#7ac050'); } }
  // mountains with snow, and the Flatirons
  for (let i = 0; i < 7; i++) { const px = bx - 46 + i * 15, py = by + 8 - (i % 2) * 7, hgt = 20 + (i % 3) * 4;
    for (let k = 0; k < hgt; k++) { const w = k * .9; R_(px - w, py - hgt + k, w, 1, k < 6 ? '#ffffff' : '#9a9aa8'); R_(px, py - hgt + k, w, 1, k < 6 ? '#dfe8f4' : '#74748a'); } }
  for (let i = 0; i < 4; i++) { const px = bx + 12 + i * 7; for (let k = 0; k < 12; k++) R_(px + k * .4, by + 4 - k, 4, 1, k < 2 ? '#e8b090' : '#c46e48'); }
  // roads: a little shoulder, a little shine
  const road = (a, b) => { const [ax, ay] = mapXY(a), [bx2, by2] = mapXY(b), n = Math.hypot(bx2 - ax, by2 - ay); for (let i = 0; i < n; i++) { const k = i / n, rx = lerp(ax, bx2, k) + Math.sin(k * Math.PI) * 6, ry2 = lerp(ay, by2, k); R_(rx - 1, ry2 - 1, 3, 3, '#7a4a2a'); } for (let i = 0; i < n; i++) { const k = i / n, rx = lerp(ax, bx2, k) + Math.sin(k * Math.PI) * 6, ry2 = lerp(ay, by2, k); R_(rx, ry2, 1, 1, i % 4 < 2 ? '#e8d8a0' : '#c4573a'); } };
  road('forest', 'atl'); road('atl', 'farm'); road('farm', 'marsh'); road('forest', 'marsh');
  // France, framed across the water
  const [px, py] = mapXY('paris'); R_(px - 42, py - 26, 84, 60, '#5a3a22'); R_(px - 41, py - 25, 82, 58, '#2a140c'); R_(px - 40, py - 24, 80, 56, '#a8c87a'); R_(px - 40, py + 20, 80, 12, '#3a7ab8');
  for (let x2 = px - 40; x2 < px + 40; x2++) R_(x2, py + 18 + Math.round(Math.sin(x2 * .3)), 1, 2, '#e8d8a0');
  x.strokeStyle = '#4a8ac8'; x.lineWidth = 2; x.beginPath(); x.moveTo(px - 40, py - 4); x.quadraticCurveTo(px - 10, py + 10, px + 40, py - 10); x.stroke();
  for (let i = 0; i < 14; i++) R_(px - 36 + (i * 37) % 72, py - 20 + (i * 23) % 32, 2, 2, '#7aa858');
  tx('FRANCE', px, py - 21, '#2a140c', { al: 'c' });
  // a compass rose out at sea
  { const cxp = NW - 26, cyp = NH - 30; fillEll(cxp, cyp, 11, 11, '#2a5a98'); for (let a = 0; a < 4; a++) { const ang = a * Math.PI / 2 - Math.PI / 2, ex = cxp + Math.cos(ang) * 11, ey = cyp + Math.sin(ang) * 11; x.fillStyle = a === 0 ? '#f6c645' : '#f4ead0'; x.beginPath(); x.moveTo(ex, ey); x.lineTo(cxp + Math.cos(ang + 1.57) * 3, cyp + Math.sin(ang + 1.57) * 3); x.lineTo(cxp + Math.cos(ang - 1.57) * 3, cyp + Math.sin(ang - 1.57) * 3); x.fill(); } tx('N', cxp - 2, cyp - 21, '#fff3b0', { oc: '#2a140c' }); }
  // a soft vignette at the edges
  for (let k = 0; k < 8; k++) { g.globalAlpha = (8 - k) * .022; R_(0, top + k, NW, 1, '#000000'); R_(0, NH - 1 - k, NW, 1, '#000000'); R_(k, top, 1, NH - top, '#000000'); R_(NW - 1 - k, top, 1, NH - top, '#000000'); }
  g.globalAlpha = 1; g = gg; return MAPC;
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
  for (let i = 0; i < 26; i++) { const wy = 30 + (i * 53) % (NH - 40), wx = coastX(wy) + 10 + ((i * 97 + t * .2) % (NW - coastX(wy) - 10)); if ((t + i * 13) % 90 < 60) R_(wx, wy, 4, 1, '#8ac0e8'); }
  { const path = [['atl', 'paris'], ['atl', 'boulder']].filter(([a2, b2]) => s.places[b2]); path.forEach(([a2, b2], k) => { const [ax, ay] = mapXY(a2), [bx2, by2] = mapXY(b2), ph = ((t * .004 + k * .5) % 1); const pxp = lerp(ax, bx2, ph), pyp = lerp(ay, by2, ph) - Math.sin(ph * Math.PI) * 26, dir = bx2 > ax ? 1 : -1; R_(pxp - 4, pyp, 9, 2, '#ffffff'); R_(pxp - dir * 1, pyp - 2, 2, 6, '#ffffff'); R_(pxp - dir * 4, pyp - 2, 1, 2, '#ffffff'); R_(pxp - 4, pyp + 2, 9, 1, '#9aa3ad'); }); }
  for (let i = 0; i < 3; i++) { const cx2 = ((t * .15 + i * 160) % (NW + 120)) - 60, cy2 = 50 + i * (NH * .25); g.globalAlpha = .12; fillEll(cx2, cy2, 30, 9, '#1a3a2a'); g.globalAlpha = 1; }
  topBar('THE MAP', () => sagaGo('hub'));
  const open = openWants();
  for (const id in PLACES) {
    const [x, y] = mapXY(id), lock = !s.places[id], here = open.filter(w => wantPlace(w) === id).length;
    if (here && !lock) { g.globalAlpha = .35 + .25 * Math.sin(t * .12); pixCircle(x, y, 14, '#fff3b0'); g.globalAlpha = 1; }
    const f = hot(x - 16, y - 16, 32, 34, () => { SG.d.sel = id; uiReset(); }, { snd: 'tap' });
    if (sel === id || f) pixCircle(x, y, 13, '#ffffff');
    mapIcon(id, x, y, lock);
    if (lock) tx('???', x, y + 11, '#c8b088', { al: 'c', oc: '#2a140c' }); else plaque(x, y + 10, PLACES[id].name);
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
  R_(0, 0, NW, H, SH.col[0]); for (let x = 0; x < NW; x += 12) { R_(x, 22, 4, H, shade(SH.col[0], -.08)); for (let y = 30 + ((x / 12) & 1) * 6; y < H; y += 12) R_(x + 8, y, 1, 1, shade(SH.col[0], .18)); }
  // the awning: stripes in the shop's colors with a scalloped edge
  for (let x = 0; x < NW; x++) { const st = Math.floor(x / 14) & 1, col = st ? SH.col[1] : '#f4ead0'; R_(x, 22, 1, 12, col); R_(x, 22, 1, 2, shade(col, .25)); const sc = 2 + Math.round(Math.sqrt(Math.max(0, 49 - Math.pow((x % 14) - 7, 2))) * .5); R_(x, 34, 1, sc, col); R_(x, 34 + sc, 1, 1, shade(col, -.45)); }
  g.globalAlpha = .25; R_(0, 38, NW, 4, '#000000'); g.globalAlpha = 1;
  topBar(SH.name, () => sagaGo('map', { sel: SG.d.back }));
  { const w = textW(SH.hello) + 14; R_(NW / 2 - w / 2, 23, w, 11, 'rgba(26,14,10,.7)'); tx(SH.hello, NW / 2, 25, '#ffffff', { al: 'c' }); }
  const cw = 76, ch = Math.min(60, Math.floor((H - 104) / 2)), cols = 5, x0 = Math.round(NW / 2 - cw * cols / 2), y0 = 44;
  for (let r = 0; r < 2; r++) { const sy = y0 + (r + 1) * ch - 3; tile(woodTex(), x0 - 6, sy, cw * cols + 12, 5); R_(x0 - 6, sy, cw * cols + 12, 1, 'rgba(255,220,170,.35)'); g.globalAlpha = .3; R_(x0 - 6, sy + 5, cw * cols + 12, 3, '#000000'); g.globalAlpha = 1; }
  const per = cols * 2, pages = Math.ceil(items.length / per), page = Math.min(SG.d.page || 0, pages - 1);
  items.slice(page * per, page * per + per).forEach(([kind, k], j) => {
    const i = page * per + j, D = kind === 's' ? STASH[k] : FOOD[k], x = x0 + (j % cols) * cw, y = y0 + Math.floor(j / cols) * ch, owned = kind === 's' && s.stash[k], sel = SG.d.sel === i;
    const f = hot(x + 2, y, cw - 4, ch - 4, () => { SG.d.sel = i; });
    g.globalAlpha = .3; R_(x + 4, y + 2, cw - 4, ch - 6, '#000000'); g.globalAlpha = 1; R_(x + 1, y - 1, cw - 2, ch - 3, sel ? '#ffffff' : '#5a3a22'); R_(x + 2, y, cw - 4, ch - 5, sel ? '#fff3b0' : f ? '#f4ead0' : '#e8dcc0'); R_(x + 2, y, cw - 4, 1, '#fffaf0'); R_(x + 2, y + ch - 7, cw - 4, 2, '#b8a080');
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
  menuBG();
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
  { const ph = S.t % 300, fr = ph < 140 ? set.idle[(ph % 160 > 150) ? 1 : 0] : ph < 150 ? set.q[0] : ph < 280 ? set.front[(ph % 70 > 64) ? 1 : 0] : set.q[0]; if (big) g.drawImage(fr, 0, 0, BW, BH, px + 4, py + 4, BW * 2, BH * 2); else drawSpr(fr, px + 26, py + 50, 0, 1, BAX, BAY); }
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
  menuBG();
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
  menuBG(); g.globalAlpha = .14; pixCircle(NW / 2, H * .3, 140, '#ffd68a'); g.globalAlpha = 1;
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
  menuBG();
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
  if (big && yy < y + h - 100) { const who = O.role ? O.role.fam : O.M && O.M.runner != null ? O.M.runner : O.want ? wantDef(O.want) && wantDef(O.want).who : 2, set = famSet(who || 2), fy = y + h - 30; fillEll(x + 60, fy + 1, 34, 4, '#5a3a22'); g.drawImage(set.fcheer[(t >> 3) & 1], 0, 0, BW, BH, x + 60 - BAX * 2, fy - BAY * 2, BW * 2, BH * 2); }
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
  menuBG(); g.globalAlpha = .16; pixCircle(NW / 2, H * .35, 110, '#ffd68a'); g.globalAlpha = 1;
  tx('HE EARNED A NAME.', NW / 2, 10, '#f6c645', { al: 'c', sc: 2, oc: '#2a140c' });
  const set = famSet(i), sy = Math.round(H * .5), sc2 = H >= 260 ? 2 : 1; g.drawImage(set.fcheer[(S.t >> 3) & 1], 0, 0, BW, BH, NW / 2 - BAX * sc2, sy - BAY * sc2, BW * sc2, BH * sc2);
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
  if (news.length) { tx(news.length > 1 ? 'THEY WOKE UP WANTING SOMETHING.' : 'HE WOKE UP WANTING SOMETHING.', NW / 2, y, '#2a140c', { al: 'c' }); y += 12; }
  else { tx('NOBODY NEW WANTS ANYTHING. YET.', NW / 2, y, '#2a140c', { al: 'c' }); y += 12; }
  news.forEach((id, k) => {
    const W = wantDef(id), x = Math.round(NW * (k + 1) / (news.length + 1)), set = famSet(W.who), sc2 = big ? 2 : 1;
    const fr = (t + k * 20) % 120 < 60 ? set.fcheer[(t >> 3) & 1] : set.front[(t + k * 13) % 90 > 84 ? 1 : 0];
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
