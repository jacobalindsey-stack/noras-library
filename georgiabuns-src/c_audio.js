/* ================= Georgia Buns — soundtrack =================
   Four songs, written out note by note, played live by a small
   16-bit-style synth: FM lead and bass (the Sega sound), 808 sub,
   pad, banjo picking, horns, claps, hat rolls, and a reverb send.
   theme  : "Georgia Buns"   Eb major, trap bounce (title, lawn, forest)
   chase  : "The Bobcat"     C minor, dooo-ba-dee hook
   cookout: "Garden Party"   Bb major, swung horns (cookout, Cousin Crew)
   creek  : "Down at the Creek" F major, banjo and bells (creek, rock skipping) */
const AU = { ctx: null, on: true, mode: 'theme', song: null, bar: 0, step: 0, next: 0, noise: null, el: null, pending: null };
function auInit() {
  if (AU.ctx) return;
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  try { AU.ctx = new C(); } catch (e) { return; }
  auGraph(AU.ctx);
  setInterval(auTick, 25);
}
function auGraph(c) {
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = .004; comp.release.value = .2; comp.connect(c.destination);
  const m = c.createGain(); m.gain.value = AU.on ? 1 : 0; m.connect(comp); AU.master = m;
  AU.mus = c.createGain(); AU.mus.gain.value = .42; AU.mus.connect(m);
  AU.sfx = c.createGain(); AU.sfx.gain.value = .55; AU.sfx.connect(m);
  // reverb send
  const len = Math.floor(c.sampleRate * 1.7), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  const cv = c.createConvolver(); cv.buffer = ir; const rg = c.createGain(); rg.gain.value = .32; cv.connect(rg); rg.connect(AU.mus); AU.verb = cv;
  const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AU.noise = nb;
  const sh = c.createWaveShaper(), cu = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cu[i] = Math.tanh(x * 2.4); } sh.curve = cu; const sg = c.createGain(); sg.gain.value = .9; sh.connect(sg); sg.connect(AU.mus); AU.shaper = sh;
}
function auUnlock() { try { auUnlock2(); } catch (e) {} }
function auUnlock2() {
  auInit(); const c = AU.ctx; if (!c) return;
  if (c.state !== 'running') { const pr = c.resume(); if (pr && pr.catch) pr.catch(() => {}); }
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  if (!AU.el && /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) {
    const a = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAA'); a.loop = true; a.volume = 0.01; AU.el = a;
  }
  if (AU.el && AU.el.paused) AU.el.play().catch(() => {});
}
function auJuke(id) { AU.juke = id; AU.pending = id || MODE_SONG[AU.mode] || 'buns'; }
function auSetOn(on) { AU.on = on; if (AU.master) AU.master.gain.value = on ? 1 : 0; }
const MODE_SONG = { title: 'buns', lawn: 'sunny', theme: 'nibbin', chase: 'bobcat', cookout: 'garden', crew: 'icebox', creek: 'marsh', marsh: 'marsh', dexter: 'dexter', french: 'french', icebox: 'icebox' };
AU.juke = null;
function auMode(m) { if (AU.mode === m) return; AU.mode = m; if (AU.juke) return; const s = MODE_SONG[m] || 'buns'; if (!AU.song || AU.song.id !== s) AU.pending = s; }
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function env(g, t, a, peak, d, end = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d); }
function noiseSrc(t, dur) { const s = AU.ctx.createBufferSource(); s.buffer = AU.noise; s.start(t, Math.random() * .5); s.stop(t + dur); return s; }
function out(node, wet) { node.connect(AU.mus); if (wet) { const s = AU.ctx.createGain(); s.gain.value = wet; node.connect(s); s.connect(AU.verb); } }

/* --- voices --- */
function v808(t, m, len) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; const f = mtof(m); o.frequency.setValueAtTime(f * 2.6, t); o.frequency.exponentialRampToValueAtTime(f, t + .05); env(g, t, .004, .75, len); o.connect(g); g.connect(AU.shaper); o.start(t); o.stop(t + len + .05); }
// two-operator FM: the Genesis voice
function vFM(t, m, dur, o) {
  const c = AU.ctx, f = mtof(m), car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
  car.frequency.value = f; mod.frequency.value = f * (o.ratio || 1);
  const I = f * (o.index || 2);
  mg.gain.setValueAtTime(I, t); mg.gain.exponentialRampToValueAtTime(Math.max(1, I * (o.sustainI || .25)), t + (o.idecay || .25));
  mod.connect(mg); mg.connect(car.frequency);
  if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .011, t + Math.min(.25, dur * .6)); l.connect(lg); lg.connect(car.frequency); l.start(t); l.stop(t + dur + .3); }
  const v = o.vol || .1, rel = o.rel || .08;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.att || .01));
  if (o.pluck) g.gain.exponentialRampToValueAtTime(.0001, t + (o.pluck));
  else { g.gain.setValueAtTime(v * .8, t + Math.max(.02, dur - rel)); g.gain.exponentialRampToValueAtTime(.0001, t + dur + rel); }
  car.connect(g); out(g, o.wet);
  const end = t + (o.pluck || dur + rel) + .05; car.start(t); mod.start(t); car.stop(end); mod.stop(end);
}
function vStab(t, ms, dur, cut) { const c = AU.ctx; ms.forEach(m => [-8, 8].forEach(dt => { const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = 4; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.03, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(f); f.connect(g); out(g, .3); o.start(t); o.stop(t + dur + .05); })); }
function vPad(t, ms, dur, v = .022) { const c = AU.ctx; ms.forEach(m => [-6, 6].forEach(dt => { const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; f.type = 'lowpass'; f.frequency.value = 1300; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .25); g.gain.setValueAtTime(v, t + dur - .2); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .3); o.connect(f); f.connect(g); out(g, .5); o.start(t); o.stop(t + dur + .35); })); }
function vBanjo(t, m, v = .075) { const c = AU.ctx, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m) * 2.003; f.type = 'bandpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(1100, t + .12); f.Q.value = 1.2; env(g, t, .002, v, .22); o.connect(f); o2.connect(f); f.connect(g); out(g, .15); o.start(t); o2.start(t); o.stop(t + .3); o2.stop(t + .3); }
function vHorn(t, ms, dur, v = .045) { const c = AU.ctx; ms.forEach(m => [0, 9].forEach(dt => { const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2900, t + .04); f.frequency.exponentialRampToValueAtTime(1100, t + dur); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .025); g.gain.setValueAtTime(v * .85, t + Math.max(.03, dur - .05)); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .06); o.connect(f); f.connect(g); out(g, .22); o.start(t); o.stop(t + dur + .1); })); }
function vGrowl(t, m, dur, v = .12) { const c = AU.ctx, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), l = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m) * .5; f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 7; l.frequency.value = 6; lg.gain.value = 380; l.connect(lg); lg.connect(f.frequency); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .04); g.gain.setValueAtTime(v, t + dur * .85); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .05); o.connect(f); o2.connect(f); f.connect(g); out(g, .2); [o, o2, l].forEach(x => { x.start(t); x.stop(t + dur + .1); }); }
function dKick(t) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .09); env(g, t, .002, .55, .16); o.connect(g); g.connect(AU.mus); o.start(t); o.stop(t + .2); }
function dClap(t, v = .45) { const c = AU.ctx, f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = .9; g.gain.setValueAtTime(0, t); [0, .011, .022].forEach(k => { g.gain.setValueAtTime(v, t + k); g.gain.exponentialRampToValueAtTime(v * .25, t + k + .009); }); g.gain.exponentialRampToValueAtTime(.0001, t + .2); const n = noiseSrc(t, .22); n.connect(f); f.connect(g); out(g, .25); }
function dSnare(t, v = .3) { const c = AU.ctx, f = c.createBiquadFilter(), g = c.createGain(); f.type = 'highpass'; f.frequency.value = 1800; env(g, t, .002, v, .1); const n = noiseSrc(t, .14); n.connect(f); f.connect(g); out(g, .2); }
function dRim(t, v = .18) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = 1700; env(g, t, .001, v, .035); o.connect(g); out(g, .3); o.start(t); o.stop(t + .06); }
function dHat(t, v = .1, open) { const c = AU.ctx, f = c.createBiquadFilter(), g = c.createGain(); f.type = 'highpass'; f.frequency.value = 7600; env(g, t, .002, v, open ? .16 : .028); const n = noiseSrc(t, .2); n.connect(f); f.connect(g); g.connect(AU.mus); }
function dShaker(t, v = .05) { const c = AU.ctx, f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.frequency.value = 6000; env(g, t, .01, v, .05); const n = noiseSrc(t, .08); n.connect(f); f.connect(g); g.connect(AU.mus); }

/* --- harmony --- */
const CH = {
  A: [33, [64, 69, 73]], 'F#m': [30, [61, 66, 69]], D: [38, [62, 66, 69]], E: [28, [64, 68, 71]], G: [31, [62, 67, 71]], Am: [33, [64, 69, 72]],
  Bb: [34, [62, 65, 70]], Eb: [27, [63, 67, 70]], F: [29, [60, 65, 69]], Gm: [31, [62, 67, 70]], Dm: [38, [62, 65, 69]],
  Fm: [29, [60, 65, 68]], Db: [37, [61, 65, 68]], C: [36, [60, 64, 67]], Bm: [35, [62, 66, 71]], 'F#': [30, [61, 66, 70]], Gb: [30, [61, 66, 70]],
  Am7: [33, [60, 64, 67, 69]], Dm7: [38, [60, 62, 65, 69]], Cmaj7: [36, [60, 64, 67, 71]], Bbm: [34, [61, 65, 70]], Ab: [32, [60, 63, 68]], Ebm: [27, [63, 66, 70]]
};
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function parseBar(s) { // 16 tokens: note like Eb5, '-' hold, '.' rest  ->  [[step, midi, lenSteps]]
  const tk = s.trim().split(/\s+/), out = []; let cur = null;
  tk.forEach((x, i) => {
    if (x === '-') { if (cur) cur[2]++; return; }
    if (cur) { out.push(cur); cur = null; }
    if (x === '.') return;
    const m = x.match(/^([A-G])(b|#)?(\d)$/); if (!m) return;
    cur = [i, (+m[3] + 1) * 12 + NOTE[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0), 1];
  });
  if (cur) out.push(cur); return out;
}
const DR = {
  A: { k: 'x......x..x.....', c: '........x.......', h: 'x.x.x.x.x.x.x.x.' },
  A2: { k: 'x......x..x...x.', c: '........x.......', h: 'x.x.x.x.x.x.rrrr' },
  B: { k: 'x..x...x..x.....', c: '........x.......', h: 'xxxxxxxxxxxxxxxx' },
  fill: { k: 'x.....x.x.x.x...', s: '....x...x.x.xxxx', c: '........x.......', h: 'x.x.x.x.rrrrrrrr' },
  intro: { h: '....x.......x...' },
  chase: { k: 'x..x..x...x..x..', c: '........x.......', h: 'xxxxxxxxxxxxxxxx' },
  chase2: { k: 'x..x..x...x..x.x', c: '........x.......', h: 'xxxxxxxxrrrrxxxx', s: '............xxxx' },
  funk: { k: 'x.....x...x..x..', c: '....x.......x...', h: 'x.xxx.xxx.xxx.xo' },
  funkfill: { k: 'x.....x...x.....', c: '....x.......x...', s: '..........xx.xxx', h: 'x.xxx.xxx.xxx.xo' },
  creek: { k: 'x.........x.....', r: '........x.......', z: 'x.x.x.x.x.x.x.x.' },
  ballad: { k: 'x.........x.....', c: '........x.......', h: 'x.x.x.x.x.x.x.x.' },
  ballad2: { k: 'x.........x..x..', c: '........x.......', h: 'x.x.x.x.x.x.rrrr' },
  marsh: { k: 'x......x..x.....', c: '........x.......', h: 'x.x.x.x.x.x.x.x.', z: '..x...x...x...x.' },
  marsh2: { k: 'x......x..x...x.', c: '........x.......', h: 'x.x.x.x.x.rrx.x.', z: 'x.x.x.x.x.x.x.x.' },
  bounce: { k: 'x..x..x...x..x..', c: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  house: { k: 'x...x...x...x...', c: '....x.......x...', h: '..o...o...o...o.', z: 'xxxxxxxxxxxxxxxx' },
  house2: { k: 'x...x...x...x...', c: '....x.......x.x.', h: 'x.o.x.o.x.o.x.oo', z: 'xxxxxxxxxxxxxxxx', s: '............xxxx' },
  hintro: { k: 'x...x...x...x...', h: '..o...o...o...o.' },
  creek2: { k: 'x.........x..x..', r: '....x.......x...', z: 'xxxxxxxxxxxxxxxx' }
};
const SONG = {
  // "Georgia Buns" (A major, 152): title screen
  buns: { name: 'GEORGIA BUNS', bpm: 152, arp: '0.1.2.1.0.1.2.1.', lead: 'sega', loopTo: 2, bars: [
    ['A', 'intro', ''],
    ['E', 'intro', '. . . . . . . . E5 - F#5 - G#5 - B5 -'],
    ['A', 'A', 'E5 - E5 - E5 - E5 - F#5 - - - C#5 - - -'],
    ['A', 'A', 'C#5 - - - - - - - - - - - A5 - - -'],
    ['F#m', 'A', '. . E5 - E5 - E5 - . . C#5 - C#5 - C#5 -'],
    ['F#m', 'A2', '. . . . . . . . A4 - B4 - C#5 - E5 -'],
    ['D', 'A', 'E5 - E5 - E5 - . . F#5 - C#5 - C#5 - . .'],
    ['D', 'A', 'D5 - - - E5 - F#5 - A5 - - - F#5 - - -'],
    ['E', 'A', '. . . . C#5 - . . A4 - . . C#5 - E5 -'],
    ['E', 'fill', 'B4 - B4 - B4 - B4 - B4 - A4 - C#5 - - -'],
    ['A', 'B', 'F#5 - F#5 - F#5 - C#5 - C#5 - A5 - A5 - A5 -'],
    ['A', 'B', '. . . . . . . . E5 - F#5 - A5 - C#6 -'],
    ['F#m', 'B', 'F#5 - F#5 - F#5 - C#5 - C#5 - . . A5 - . .'],
    ['F#m', 'B', '. . . . . . C#5 - C#5 - . . A5 - B5 -'],
    ['D', 'B', 'A5 - - - - - - - F#5 - C#5 - C#5 - C#5 -'],
    ['D', 'B', 'F#5 - F#5 - F#5 - C#5 - C#5 - C#5 - E5 - E5 -'],
    ['E', 'B', 'E5 - E5 - B4 - B4 - B4 - A4 - C#5 - - -'],
    ['E', 'fill', '. . . . . . . . E5 - F#5 - G#5 - B5 -']] },
  // "Sunny the Squirrel" (Bb / G minor, 74): the burrow and the lawn
  sunny: { name: 'SUNNY THE SQUIRREL', bpm: 74, gain: 1.35, arp: '0..1..2.0..1..2.', lead: 'whistle', loopTo: 1, bars: [
    ['Bb', 'intro', ''],
    ['Bb', 'ballad', '. . F5 - D5 - D5 - D5 - A5 - A5 - G5 -'],
    ['Eb', 'ballad', 'G5 - G5 - F5 - F5 - . . . . . . Bb4 -'],
    ['F', 'ballad', 'C5 - F5 - F5 - Bb4 - C5 - F5 - . . A4 -'],
    ['Gm', 'ballad2', 'A4 - Bb4 - . . Eb5 - D5 - C5 - F4 - Bb4 -'],
    ['F', 'ballad', 'A5 - A5 - A5 - A5 - G5 - G5 - D5 - D5 -'],
    ['Gm', 'ballad', 'D5 - C6 - Bb5 - Bb4 - Bb5 - G5 - F5 - . .'],
    ['Bb', 'ballad', 'D5 - D5 - Bb5 - G5 - C5 - C5 - C5 - Bb4 -'],
    ['Eb', 'ballad2', 'D5 - G4 - C5 - D5 - F5 - . . . . C5 -'],
    ['Dm', 'ballad', 'D5 - C5 - D5 - A5 - A5 - A5 - Bb5 - G5 -'],
    ['Gm', 'ballad', 'D5 - Bb4 - D5 - D5 - Eb5 - F5 - F5 - F5 -'],
    ['Bb', 'ballad', 'D5 - D5 - Bb5 - D5 - D5 - D5 - Bb5 - C6 -'],
    ['Gm', 'ballad2', 'C6 - D6 - Bb5 - G5 - D5 - C5 - C5 - Bb4 -']] },
  // "Nibbin' Bun" (F minor, 160): the forest
  nibbin: { name: "NIBBIN' BUN", bpm: 160, arp: '0.0.1.0.2.0.1.0.', arpVoice: 'fm', lead: 'pluck', bars: [
    ['Fm', 'A', 'F5 - F5 - F4 - . . . . . . Ab5 - Ab5 -'],
    ['Fm', 'A', 'Ab4 - G4 - G4 - G4 - . . F4 - . . . .'],
    ['Db', 'A', '. . . . Bb4 - Db5 - Db5 - Db5 - C5 - C5 -'],
    ['C', 'A2', '. . Bb4 - Bb4 - Bb4 - Db5 - Db5 - C5 - C5 -'],
    ['Fm', 'A', '. . . . C5 - C5 - Db5 - D5 - Bb4 - A4 -'],
    ['Fm', 'A', '. . . . Db5 - Db5 - Db5 - Db5 - . . . .'],
    ['Db', 'A', 'Db5 - Db5 - Bb4 - Ab5 - Ab5 - Ab5 - C5 - B4 -'],
    ['C', 'fill', '. . . . C5 - C5 - C5 - B4 - . . . .'],
    ['Fm', 'B', 'F5 - F5 - F5 - F5 - G5 - Gb5 - Ab5 - Ab5 -'],
    ['Fm', 'B', 'C6 - - - Bb5 - Ab5 - F5 - - - . . F5 -'],
    ['Db', 'B', 'Db6 - Db6 - C6 - - - C6 - B5 - Bb5 - Bb5 -'],
    ['C', 'fill', 'B5 - - - C6 - - - . . E5 - G5 - Bb5 -']] },
  // "The Bobcat" (B minor, 152): the chase
  bobcat: { name: 'THE BOBCAT', bpm: 152, arp: '0123012301230123', arpVoice: 'fm', arpOct: 12, lead: 'growl', bars: [
    ['Bm', 'chase', 'B3 - B3 - B3 - B3 - C#4 - B3 - C#4 - B3 -'],
    ['Bm', 'chase', 'C#4 - B3 - F#4 - F#4 - F#4 - E4 - . . . .'],
    ['F#', 'chase', 'C#4 - C#4 - C#4 - . . C#4 - C#4 - C#4 - B3 -'],
    ['Bm', 'chase2', 'D4 - C#4 - B3 - B3 - F#3 - F#3 - F#3 - . .'],
    ['Bm', 'chase', 'B3 - B3 - B3 - B3 - C#4 - B3 - C#4 - B3 -'],
    ['Bm', 'chase', 'C#4 - B3 - F#4 - F#4 - F#4 - E4 - . . . .'],
    ['G', 'chase', 'D4 - D4 - C#4 - . . C4 - B3 - C4 - B3 -'],
    ['F#', 'chase2', 'C#4 - C4 - C4 - B3 - F#4 - F#4 - E#4 - E4 -'],
    ['Bm', 'chase', 'B4 - B4 - B4 - B4 - C#5 - B4 - C#5 - B4 -', 'pluck'],
    ['Bm', 'chase', 'C#5 - B4 - F#5 - F#5 - F#5 - E5 - . . . .', 'pluck'],
    ['G', 'chase', 'D5 - D5 - C#5 - . . C#5 - B4 - C#5 - B4 -', 'pluck'],
    ['F#', 'chase2', 'F#4 - - - F#4 - F#4 - F#4 - - - A#4 - C#5 -', 'pluck']] },
  // "Garden Party" (Bb Dorian, 99, swung): the cookout
  garden: { name: 'GARDEN PARTY', bpm: 99, swing: .17, horns: 'x.....x...x.....', lead: 'brass', bars: [
    ['Bbm', 'funk', 'Bb5 - Bb5 - Bb5 - Bb5 - Db6 - Db6 - Bb5 - . .'],
    ['Eb', 'funk', 'Db6 - Db6 - Ab5 - Ab5 - Bb5 - Bb5 - Ab5 - Eb6 -'],
    ['Gb', 'funk', 'Db6 - Db6 - Db6 - . . Bb5 - Bb5 - D6 - F6 -'],
    ['F', 'funkfill', 'Db6 - Db6 - Ab5 - Bb5 - Bb5 - Bb5 - Bb5 - Bb5 -'],
    ['Bbm', 'funk', 'Eb6 - Eb6 - Eb6 - Db6 - Db6 - Bb5 - Bb5 - Ab5 -'],
    ['Ab', 'funk', '. . Db6 - Db6 - Db6 - G5 - Ab5 - Bb5 - Bb5 -'],
    ['Gb', 'funk', 'Db6 - C6 - C6 - Db6 - Db6 - Bb5 - Bb5 - Bb5 -'],
    ['F', 'funkfill', 'Bb5 - . . Bb5 - Bb5 - Bb5 - Bb5 - Eb6 - F6 -']] },
  // "Marsh Buns" (D minor, 160): the creek
  marsh: { name: 'MARSH BUNS', bpm: 160, arp: '0.2.1.2.0.2.1.2.', lead: 'steel', gain: 1.1, bars: [
    ['Dm', 'marsh', '. . . . . . . . G5 - G5 - G5 - G5 -'],
    ['Dm', 'marsh', 'A5 - A5 - . . . . G5 - G5 - G5 - G5 -'],
    ['F', 'marsh', 'A5 - . . . . . . . . G5 - F5 - F5 -'],
    ['A', 'marsh2', 'A5 - . . . . . . F5 - F5 - C6 - . .'],
    ['Dm', 'marsh', '. . . . . . . . C6 - A5 - A5 - A5 -'],
    ['Dm', 'marsh', 'A5 - A5 - A5 - . . G5 - . . . . . .'],
    ['Am', 'marsh', 'A5 - A5 - A5 - A5 - . . . . E5 - G5 -'],
    ['Dm', 'marsh2', 'G5 - G5 - . . . . . . A5 - A5 - A5 -'],
    ['Am', 'marsh', 'A5 - A5 - A5 - A5 - . . . . . . . .'],
    ['Am', 'marsh', 'Bb5 - . . . . A5 - A5 - A5 - A5 - A5 -'],
    ['Gm', 'marsh', 'A5 - A5 - A5 - A5 - . . . . E5 - . .'],
    ['A', 'fill', '. . . . . . . . C6 - A5 - A5 - G#5 -']] },
  // "Ice Box" (Eb minor, 172): the Cousin Crew power-up
  icebox: { name: 'ICE BOX', bpm: 172, arp: '0..2..1.0..2..1.', arpVoice: 'fm', arpOct: 12, lead: 'bell', bars: [
    ['Ebm', 'bounce', '. . . . Bb5 - Bb5 - Bb5 - Gb5 - Ab5 - Ab5 -'],
    ['Bbm', 'bounce', '. . . . Bb5 - Bb5 - Bb5 - Ab5 - Ab5 - Gb5 -'],
    ['Ebm', 'bounce', '. . . . Db5 - Bb5 - Bb5 - Ab5 - Ab5 - Gb5 -'],
    ['Gb', 'fill', '. . . . . . . . Ab5 - Gb5 - Bb5 - . .']] },
  // "La French Connexion" (A minor, 124): original French-touch filter house for Paris
  french: { name: 'LA FRENCH CONNEXION', bpm: 124, house: 1, lead: 'robo', loopTo: 2, gain: 1.05, bars: [
    ['Am7', 'hintro', ''], ['Dm7', 'hintro', ''],
    ['Am7', 'house', 'A4 - . C5 - . E5 - D5 - C5 - . . A4 -'],
    ['Dm7', 'house', 'F5 - - - E5 - D5 - . . C5 - D5 - - -'],
    ['G', 'house', 'B4 - . D5 - . G5 - F5 - E5 - . . D5 -'],
    ['Cmaj7', 'house2', 'E5 - - - - - - - G5 - E5 - C5 - B4 -'],
    ['Am7', 'house', 'A5 - . A5 - . G5 - E5 - G5 - . . A5 -'],
    ['Dm7', 'house', 'C6 - - - A5 - - - G5 - F5 - E5 - D5 -'],
    ['G', 'house', 'D5 - . D5 - . G5 - . . B5 - A5 - G5 -'],
    ['Cmaj7', 'house2', 'E5 - - - - - - - . . . . . . . .']] },
  // "Dexter" (E country, 160): saved for Dexter's day on the farm; in the jukebox now
  dexter: { name: 'DEXTER', bpm: 160, arp: '0213021302130213', lead: 'fiddle', bars: [
    ['E', 'A', 'E5 - E5 - D5 - E5 - E5 - E5 - E5 - E5 -'],
    ['E', 'A', 'E5 - E5 - . . . . G5 - G5 - E5 - E5 -'],
    ['E', 'A', 'E5 - E5 - D5 - E5 - E5 - E5 - E5 - E5 -'],
    ['E', 'A2', 'E5 - E5 - B4 - . . D5 - D5 - . . . .'],
    ['E', 'A', 'E5 - E5 - A5 - B5 - B5 - B5 - . . . .'],
    ['A', 'A', '. . . . A5 - A5 - G5 - G5 - . . . .'],
    ['G', 'A', '. . G5 - B5 - B5 - B5 - B5 - D6 - D6 -'],
    ['A', 'fill', 'D6 - . . A5 - A5 - E6 - D6 - . . . .']] }
};
for (const k in SONG) { SONG[k].id = k; SONG[k].bars.forEach(b => { b.notes = parseBar(b[2]); }); }
const LEADS = {
  sega: (t, m, d) => { vFM(t, m, d, { ratio: 1, index: 2.4, sustainI: .45, idecay: .12, vib: 1, vol: .085, att: .008, rel: .06, wet: .3 }); vFM(t, m + 12, d, { ratio: 2, index: 1, sustainI: .3, vol: .022, att: .01, rel: .05 }); },
  steel: (t, m, d) => vFM(t, m, d, { ratio: 2, index: 1.6, sustainI: .1, idecay: .2, pluck: Math.min(.9, d + .25), vol: .085, wet: .4 }),
  fiddle: (t, m, d) => { vFM(t, m, d, { ratio: 1, index: 2.8, sustainI: .6, idecay: .1, vib: 1, vol: .07, att: .03, rel: .07, wet: .25 }); vFM(t, m, d, { ratio: 3, index: .7, vol: .02, att: .03, rel: .05 }); },
  robo: (t, m, d) => { vFM(t, m, d, { ratio: 1, index: 4.5, sustainI: .7, idecay: .06, vol: .06, att: .006, rel: .04, wet: .3 }); vFM(t, m - 12, d, { ratio: 3, index: 1.2, sustainI: .6, vol: .025, att: .006, rel: .04 }); },
  whistle: (t, m, d) => vFM(t, m, d, { ratio: 1, index: 1.1, sustainI: .35, idecay: .2, vib: 1, vol: .085, att: .03, rel: .12, wet: .35 }),
  growl: (t, m, d) => vGrowl(t, m, d),
  pluck: (t, m, d) => vFM(t, m, d, { ratio: 2, index: 3, sustainI: .1, idecay: .15, pluck: .32, vol: .07, wet: .25 }),
  brass: (t, m, d) => { vHorn(t, [m], d, .05); vFM(t, m - 12, d, { ratio: 1, index: 2, sustainI: .5, vol: .03, rel: .05 }); },
  bell: (t, m, d) => vFM(t, m, d, { ratio: 3.5, index: 2.2, sustainI: .05, idecay: .6, pluck: 1.6, vol: .07, wet: .55 })
};
function auTick() {
  const c = AU.ctx; if (!c || c.state !== 'running') return;
  if (!AU.song) { AU.song = SONG[AU.juke || MODE_SONG[AU.mode] || 'buns']; AU.bar = 0; AU.step = 0; }
  if (AU.next < c.currentTime - .2) AU.next = c.currentTime + .06;
  while (AU.next < c.currentTime + .12) {
    if (AU.pending && (AU.step === 0 || AU.step === 8)) { AU.song = SONG[AU.pending]; AU.pending = null; AU.bar = 0; AU.step = 0; }
    if (AU.mus && AU.gainFor !== AU.song) { AU.gainFor = AU.song; AU.mus.gain.setTargetAtTime(.42 * (AU.song.gain || 1), c.currentTime, .05); }
    const s = AU.song, sd = 60 / s.bpm / 4;
    const t = AU.next + ((AU.step & 1) && s.swing ? sd * s.swing : 0);
    playStep(s, s.bars[AU.bar], AU.step, t, sd);
    AU.next += sd; AU.step++;
    if (AU.step >= 16) { AU.step = 0; AU.bar++; if (AU.bar >= s.bars.length) AU.bar = s.loopTo || 0; }
  }
}
function playStep(s, bar, st, t, sd) {
  const [root, tones] = CH[bar[0]], dr = DR[bar[1]] || DR.A, intro = bar[1] === 'intro' || bar[1] === 'hintro';
  // drums
  if (dr.k && dr.k[st] === 'x') { dKick(t); }
  if (dr.c && dr.c[st] === 'x') dClap(t, .42);
  if (dr.s && dr.s[st] === 'x') dSnare(t, .22 + st * .008);
  if (dr.r && dr.r[st] === 'x') dRim(t, .14);
  if (dr.z && dr.z[st] === 'x') dShaker(t, st % 4 === 0 ? .06 : .035);
  if (dr.h) { const h = dr.h[st]; if (h === 'x') dHat(t, st % 4 === 0 ? .11 : .07); else if (h === 'r') { dHat(t, .07); dHat(t + sd / 2, .05); } else if (h === 'o') dHat(t, .09, true); }
  // 808 bass on the kicks, walking to the fifth
  const kick = dr.k && dr.k[st] === 'x';
  if (kick && s.house) { if (st === 0) v808(t, root + 12, .2); }
  else if (kick) { const m = root + 12 + (st === 10 && s.walk !== false ? 7 : 0); v808(t, m, s.bpm > 150 ? .34 : .5); vFM(t, m + 12, .14, { ratio: 1, index: 1.6, sustainI: .2, idecay: .1, pluck: .22, vol: .045 }); }
  if (s.id === 'garden' && [0, 3, 6, 10, 12].includes(st)) vFM(t, root + 12 + (st === 6 ? 7 : st === 12 ? 12 : 0), sd * 1.6, { ratio: 1, index: 3, sustainI: .3, idecay: .08, pluck: .25, vol: .08 });
  if (s.house && !intro) { // filtered disco stabs that breathe with the kick, and an octave-jumping bass
    const cut = 500 + 2600 * (.5 - .5 * Math.cos((AU.bar + st / 16) / s.bars.length * Math.PI * 4));
    if (st % 4 === 2) vStab(t, tones, sd * 1.6, cut);
    if (st % 2 === 0) vFM(t, root + 24 + ((st >> 1) % 2 ? 12 : 0), sd * .9, { ratio: 1, index: 2.4, sustainI: .2, idecay: .06, pluck: .16, vol: .07 });
  }
  if (s.house && intro && st % 4 === 2) vStab(t, tones, sd * 1.6, 380 + AU.bar * 300 + st * 20);
  // pad
  if (st === 0 && !intro && !s.house) vPad(t, tones, sd * 16, s.id === 'sunny' ? .022 : .015);
  if (st === 0 && intro) vPad(t, tones, sd * 16, .024);
  // banjo / arps
  if (s.arp && !intro) { const a = s.arp[st]; if (a && a !== '.') { const i = +a % tones.length; s.arpVoice === 'fm' ? vFM(t, tones[i] + (s.arpOct || 0), sd, { ratio: 2, index: 2, sustainI: .1, pluck: .12, vol: .03 }) : vBanjo(t, tones[i] + (s.arpOct || 0) + (st > 7 && s.bpm > 140 ? 12 : 0), s.id === 'dexter' ? .07 : .05); } }
  // horn stabs
  if (s.horns && s.horns[st] === 'x') vHorn(t, tones.slice(0, 3), st === 0 ? sd * 3 : sd * 1.5, .028);
  // lead
  const lead = LEADS[bar[3] || s.lead];
  for (const n of bar.notes) if (n[0] === st) lead(t, n[1], n[2] * sd);
  // the bobcat's lead gets a growly double an octave up in the B section
}
/* --- sound effects --- */
function sfx(name, p) {
  const c = AU.ctx; if (!c || c.state !== 'running') return; const t = c.currentTime;
  const tone = (type, f0, f1, dur, v, delay = 0) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t + delay); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + delay + dur); env(g, t + delay, .004, v, dur); o.connect(g); g.connect(AU.sfx); o.start(t + delay); o.stop(t + delay + dur + .05); };
  const nz = (fType, freq, dur, v, delay = 0) => { const f = c.createBiquadFilter(), g = c.createGain(); f.type = fType; f.frequency.value = freq; env(g, t + delay, .004, v, dur); const n = noiseSrc(t + delay, dur + .05); n.connect(f); f.connect(g); g.connect(AU.sfx); };
  switch (name) {
    case 'jump': tone('square', 300, 720, .13, .12); break;
    case 'tick': tone('square', 1760, 0, .03, .05); break;
    case 'ding': tone('sine', 1568, 0, .3, .2); tone('sine', 2093, 0, .4, .14, .08); tone('triangle', 3136, 0, .25, .05, .12); break;
    case 'card': nz('highpass', 1800, .22, .12); tone('square', 220, 880, .16, .06, .02); break;
    case 'carrot': { const hi = p ? 1568 : 1319; tone('sine', hi, 0, .16, .22); tone('triangle', hi * 1.5, 0, .1, .08, .03); break; }
    case 'spring': tone('sine', 180, 900, .22, .3); tone('triangle', 900, 300, .2, .1, .12); break;
    case 'hurt': for (let i = 0; i < 5; i++) tone('square', 900 - i * 120, 0, .06, .08, i * .04); nz('bandpass', 2000, .25, .2); break;
    case 'roll': nz('bandpass', 900, .18, .22); break;
    case 'rev': tone('sawtooth', 200 + (p || 0) * 60, 700 + (p || 0) * 120, .15, .1); break;
    case 'launch': nz('lowpass', 1800, .35, .3); tone('sawtooth', 300, 1200, .25, .08); break;
    case 'pay': tone('sine', 1760, 0, .12, .2); tone('sine', 2637, 0, .3, .18, .09); tone('triangle', 880, 0, .2, .1, .0); break;
    case 'bonk': tone('triangle', 900, 300, .08, .3); nz('bandpass', 1200, .05, .2); break;
    case 'splash': nz('lowpass', 1600, .35, .35); nz('highpass', 4000, .2, .12); break;
    case 'plip': tone('sine', 1200, 500, .07, .18); nz('highpass', 3000, .05, .08); break;
    case 'plop': tone('sine', 400, 120, .2, .3); nz('lowpass', 700, .2, .2); break;
    case 'throw': nz('bandpass', 1500, .2, .2); break;
    case 'crew': [0, 4, 7, 12].forEach((k, i) => tone('square', mtof(72 + k), 0, .12, .1, i * .07)); break;
    case 'wake': tone('triangle', 660, 880, .12, .15); tone('triangle', 990, 0, .15, .12, .1); break;
    case 'rock': [0, 7, 12, 19].forEach((k, i) => tone('triangle', mtof(76 + k), 0, .18, .14, i * .06)); break;
    case 'growl': { const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.linearRampToValueAtTime(70, t + .5); f.type = 'lowpass'; f.frequency.value = 600; env(g, t, .03, .25, .55); o.connect(f); f.connect(g); g.connect(AU.sfx); o.start(t); o.stop(t + .65); break; }
    case 'crunch': for (let i = 0; i < 3; i++) nz('bandpass', 1800 + i * 400, .05, .22, i * .06); break;
    case 'smash': nz('lowpass', 900, .3, .4); tone('square', 160, 60, .2, .12); break;
    case 'bounce': tone('sine', 260, 520, .1, .2); break;
    case 'land': nz('lowpass', 500, .08, .15); break;
    case 'tap': tone('square', 880, 0, .05, .08); break;
  }
}
