// NUBBINS — every sound is synthesized: squelchy hits, boings, music loops,
// and a big announcer voice from the device's own speech.
const A = { ctx: null, on: { sfx: true, music: true, voice: true }, song: null, nextStep: 0, step: 0, timer: null };
export const AUDIO = A;

export function audioInit() {
  if (A.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const c = new AC();
  A.ctx = c;
  A.master = c.createGain(); A.master.gain.value = 0.9;
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
  A.master.connect(comp); comp.connect(c.destination);
  A.sfx = c.createGain(); A.sfx.gain.value = A.on.sfx ? 0.8 : 0; A.sfx.connect(A.master);
  A.mus = c.createGain(); A.mus.gain.value = A.on.music ? 0.34 : 0; A.mus.connect(A.master);
  const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  A.noise = nb;
  // a short room for the music
  const len = Math.floor(c.sampleRate * 1.4), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  A.verb = c.createConvolver(); A.verb.buffer = ir; const vg = c.createGain(); vg.gain.value = 0.22; A.verb.connect(vg); vg.connect(A.mus);
}

export function audioUnlock() {
  try {
    audioInit(); const c = A.ctx; if (!c) return;
    if (c.state !== 'running') { const p = c.resume(); if (p && p.catch) p.catch(() => {}); }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    if (!A.el && /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) {
      const a = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAA'); a.loop = true; a.volume = 0.01; A.el = a;
    }
    if (A.el && A.el.paused) A.el.play().catch(() => {});
    if (!A.timer) A.timer = setInterval(schedule, 25);
  } catch (e) {}
}
export function audioSuspend(yes) { if (!A.ctx) return; try { yes ? A.ctx.suspend() : A.ctx.resume(); } catch (e) {} }
export function setAudioOptions(o) {
  Object.assign(A.on, o);
  if (A.sfx) A.sfx.gain.value = A.on.sfx ? 0.8 : 0;
  if (A.mus) A.mus.gain.value = A.on.music ? 0.34 : 0;
  if (!A.on.voice && window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {}
}

// ---------------------------------------------------------------- voices
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function tone(type, f0, f1, dur, gain, o = {}) {
  const c = A.ctx; if (!c) return; const t = (o.at || c.currentTime) + (o.delay || 0);
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = type; osc.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur * (o.bend || 1));
  if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibAmt || f0 * 0.05; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.1); }
  if (o.detune) osc.detune.value = o.detune;
  env(g, t, o.att || 0.004, gain, dur);
  let node = osc;
  if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t); if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1, t + dur); f.Q.value = o.q || 1; node.connect(f); node = f; }
  node.connect(g); g.connect(o.dest || A.sfx);
  osc.start(t); osc.stop(t + dur + (o.att || 0.004) + 0.05);
}
function noise(dur, ftype, f0, f1, gain, o = {}) {
  const c = A.ctx; if (!c) return; const t = (o.at || c.currentTime) + (o.delay || 0);
  const s = c.createBufferSource(); s.buffer = A.noise;
  const f = c.createBiquadFilter(); f.type = ftype; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = o.q || 1;
  const g = c.createGain(); env(g, t, o.att || 0.003, gain, dur);
  s.connect(f); f.connect(g); g.connect(o.dest || A.sfx);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}

const R = (a, b) => a + Math.random() * (b - a);
const SFX = {
  hit(p = 1) {
    tone('sine', 170 * R(0.9, 1.1), 42, 0.16 + p * 0.06, 0.75);
    noise(0.14 + p * 0.05, 'bandpass', 1400 * R(0.8, 1.2), 260, 0.5 + p * 0.25, { q: 2.5 });
    tone('triangle', 420 * R(0.9, 1.2), 150, 0.12, 0.25 * p, { vib: 30, vibAmt: 60 });
    if (p > 1.2) { tone('sine', 90, 30, 0.35, 0.6, { delay: 0.01 }); noise(0.25, 'lowpass', 600, 80, 0.4); }
  },
  block() { tone('triangle', 900, 520, 0.07, 0.35); noise(0.06, 'highpass', 3000, 2000, 0.25); tone('sine', 260, 200, 0.08, 0.3); },
  swish() { noise(0.13, 'bandpass', 500, 2600, 0.2, { q: 1.4 }); },
  swish2() { noise(0.2, 'bandpass', 380, 3000, 0.28, { q: 1.2 }); },
  jump() { tone('sine', 260, 640, 0.13, 0.28, { vib: 18, vibAmt: 40 }); },
  land() { tone('sine', 120, 55, 0.1, 0.45); noise(0.08, 'lowpass', 900, 200, 0.25); },
  thud() { tone('sine', 95, 35, 0.22, 0.8); noise(0.18, 'lowpass', 700, 90, 0.5); tone('triangle', 300, 120, 0.2, 0.2, { vib: 20, vibAmt: 50 }); },
  squeeze() { tone('triangle', 330, 520, 0.16, 0.25, { vib: 28, vibAmt: 50 }); noise(0.12, 'bandpass', 900, 400, 0.25, { q: 4 }); },
  boing() { tone('triangle', 180, 520, 0.35, 0.35, { vib: 14, vibAmt: 90, bend: 0.4 }); },
  pop() { tone('sine', 1100, 240, 0.07, 0.4); noise(0.03, 'highpass', 2500, 0, 0.35); },
  splat() { noise(0.2, 'bandpass', 900, 200, 0.5, { q: 3 }); tone('sine', 200, 60, 0.15, 0.4); },
  sparkle() { [2093, 2637, 3136, 4186].forEach((f, i) => tone('sine', f, f, 0.25, 0.12, { delay: i * 0.045 })); },
  icecast() { noise(0.25, 'highpass', 4000, 9000, 0.25); [1568, 2349, 3136].forEach((f, i) => tone('sine', f, f * 1.01, 0.3, 0.08, { delay: i * 0.03 })); },
  freeze() { noise(0.5, 'highpass', 3000, 9000, 0.3); for (let i = 0; i < 8; i++) tone('square', R(2000, 5000), R(1500, 4000), 0.02, 0.05, { delay: i * 0.04 }); tone('sine', 1760, 1760, 0.6, 0.1); },
  shatter() { for (let i = 0; i < 14; i++) tone('triangle', R(1800, 5200), R(900, 3000), R(0.05, 0.18), 0.1, { delay: i * 0.018 }); noise(0.4, 'highpass', 2500, 6000, 0.35); },
  rocket() { noise(0.45, 'bandpass', 300, 1800, 0.35, { q: 1 }); tone('sawtooth', 120, 260, 0.4, 0.12, { lp: 900 }); },
  whirl() { for (let i = 0; i < 5; i++) noise(0.08, 'bandpass', 700, 2400, 0.18, { delay: i * 0.08, q: 2 }); },
  slide() { noise(0.4, 'highpass', 1800, 5000, 0.22); tone('sine', 900, 1300, 0.35, 0.05); },
  puff() { noise(0.35, 'lowpass', 1600, 300, 0.35); tone('triangle', 400, 250, 0.3, 0.08, { vib: 9, vibAmt: 40 }); },
  roll() { for (let i = 0; i < 6; i++) tone('sine', 140, 110, 0.07, 0.2, { delay: i * 0.07 }); },
  stomp() { tone('sine', 70, 28, 0.5, 0.95); noise(0.45, 'lowpass', 400, 60, 0.6); },
  dash() { noise(0.18, 'bandpass', 1200, 4000, 0.3, { q: 1.5 }); },
  vanish() { tone('sine', 1500, 300, 0.25, 0.18); tone('sine', 300, 1600, 0.25, 0.14, { delay: 0.25 }); },
  glob() { tone('sine', 220, 80, 0.3, 0.5, { vib: 12, vibAmt: 40 }); noise(0.25, 'bandpass', 700, 200, 0.3, { q: 3 }); },
  roar() { tone('sawtooth', 110, 70, 0.6, 0.18, { lp: 700, vib: 7, vibAmt: 8 }); noise(0.5, 'bandpass', 400, 200, 0.25, { q: 2 }); },
  rush() { tone('sawtooth', 220, 880, 0.5, 0.12, { lp: 3000 }); [523, 659, 784, 1047].forEach((f, i) => tone('square', f, f, 0.12, 0.06, { delay: i * 0.05, lp: 3000 })); },
  ko() { tone('triangle', 520, 90, 0.9, 0.4, { vib: 8, vibAmt: 40 }); noise(0.6, 'lowpass', 1200, 100, 0.3); },
  inflate() { tone('triangle', 180, 900, 1.2, 0.25, { vib: 10, vibAmt: 30, bend: 1 }); },
  squeak() { tone('sine', R(1700, 2300), R(2400, 3200), 0.08, 0.15, { vib: 40, vibAmt: 200 }); },
  slap() { noise(0.08, 'bandpass', 2000, 600, 0.6, { q: 1 }); tone('sine', 300, 90, 0.1, 0.5); },
  wrap() { for (let i = 0; i < 10; i++) noise(0.05, 'highpass', 3000, 6000, 0.2, { delay: i * 0.05 }); },
  thunk() { tone('sine', 160, 60, 0.15, 0.7); noise(0.06, 'bandpass', 1500, 500, 0.4); },
  whistle() { tone('sine', 1200, 1900, 0.8, 0.12, { vib: 6, vibAmt: 20, bend: 1 }); },
  ding() { tone('sine', 1568, 1568, 0.8, 0.2); tone('sine', 2093, 2093, 0.8, 0.12, { delay: 0.12 }); },
  cheer() { for (let i = 0; i < 16; i++) tone('sine', R(600, 1400), R(800, 1800), R(0.2, 0.5), 0.03, { delay: R(0, 0.6), vib: R(4, 9), vibAmt: 30 }); noise(1.2, 'bandpass', 1200, 900, 0.12, { q: 0.6, att: 0.2 }); },
  select() { tone('square', 880, 880, 0.05, 0.07, { lp: 3000 }); },
  move() { tone('triangle', 660, 700, 0.04, 0.12); },
  confirm() { tone('square', 660, 660, 0.07, 0.08, { lp: 3500 }); tone('square', 990, 990, 0.12, 0.08, { lp: 3500, delay: 0.07 }); },
  back() { tone('square', 500, 330, 0.1, 0.07, { lp: 2500 }); },
  gong() { [110, 166, 220, 331, 441].forEach((f, i) => tone('sine', f * 1.01, f, 2.2, 0.2 / (i + 1), { att: 0.005 })); noise(0.3, 'bandpass', 800, 300, 0.2); },
  drumroll() { for (let i = 0; i < 24; i++) noise(0.05, 'bandpass', 1500, 900, 0.08 + i * 0.008, { delay: i * 0.045, q: 1.2 }); },
};
export function sfx(name, arg) { if (!A.ctx || !A.on.sfx) return; const f = SFX[name]; if (f) try { f(arg); } catch (e) {} }

// ------------------------------------------------------------- announcer
let voice = null;
function pickVoice() {
  if (!window.speechSynthesis) return null;
  const vs = speechSynthesis.getVoices();
  if (!vs.length) return null;
  const pref = ['Daniel', 'Google UK English Male', 'Arthur', 'Fred', 'Aaron', 'Alex', 'Microsoft Guy', 'Microsoft David', 'Rishi', 'Oliver'];
  for (const p of pref) { const v = vs.find(v => v.name.includes(p) && /^en/i.test(v.lang)); if (v) return v; }
  return vs.find(v => /^en/i.test(v.lang)) || vs[0];
}
if (window.speechSynthesis) try { speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); }; } catch (e) {}
export function say(text, o = {}) {
  if (!A.on.voice || !window.speechSynthesis) return;
  try {
    if (!voice) voice = pickVoice();
    if (o.cancel !== false) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.pitch = o.pitch ?? 0.35; u.rate = o.rate ?? 0.88; u.volume = 1;
    speechSynthesis.speak(u);
  } catch (e) {}
}

// ------------------------------------------------------------------ music
const n = s => { const m = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 }; const r = s.match(/^([A-G][#b]?)(-?\d)$/); return 12 * (+r[2] + 1) + m[r[1]]; };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const chord = (root, q) => { const r = n(root); return q === 'm' ? [r, r + 3, r + 7] : [r, r + 4, r + 7]; };
const mel = s => s.trim().split(/\s+/).map(tok => { if (tok === '.' || tok === '-') return tok; return n(tok); });

const SONGS = {
  title: { bpm: 102, chords: [['D3', 'm'], ['Bb2', ''], ['F3', ''], ['C3', '']], kick: 'x.........x.....', snare: '....x.......x...', hat: '..x...x...x...x.', tom: '..............xx', bass: 'half', pad: true,
    lead: mel('D5 - - - F5 - A5 - G5 - - - F5 - E5 - D5 - - - Bb4 - D5 - F5 - - - E5 - D5 - C5 - - - E5 - G5 - A5 - - - G5 - F5 - E5 - - - - - - - G5 - - - - - - -'), leadEvery: 1 },
  select: { bpm: 120, chords: [['C4', ''], ['G3', ''], ['A3', 'm'], ['F3', '']], kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xx', bass: 'bounce', arp: true, bell: true },
  fight1: { bpm: 132, chords: [['A2', 'm'], ['F2', ''], ['C3', ''], ['G2', '']], kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'pump', arp: true,
    lead: mel('A5 - G5 - E5 - - - C5 - D5 - E5 - - - F5 - E5 - C5 - - - A4 - - - C5 - - - G5 - E5 - C5 - E5 - G5 - - - A5 - - - B5 - - - A5 - G5 - D5 - - - - - B4 -'), leadEvery: 2 },
  fight2: { bpm: 140, chords: [['E3', 'm'], ['C3', ''], ['D3', ''], ['B2', '']], kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', bass: 'synco', arp: true,
    lead: mel('B4 - E5 - G5 - F#5 - E5 - D5 - B4 - - - C5 - E5 - G5 - - - A5 - G5 - E5 - - - F#5 - - - A5 - F#5 - D5 - - - - - D#5 - F#5 - B5 - - - A5 - F#5 - D#5 - - -'), leadEvery: 2 },
  boss: { bpm: 96, chords: [['C3', 'm'], ['Ab2', ''], ['F2', 'm'], ['G2', '']], kick: 'x.........x.....', snare: '........x.......', hat: 'x...x...x...x...', tom: '............x.xx', bass: 'half', pad: true, organ: true,
    lead: mel('C5 - - - - - Eb5 - - - D5 - C5 - - - Ab4 - - - C5 - - - Eb5 - - - F5 - Eb5 - F5 - - - - - Ab5 - - - G5 - F5 - - - G5 - - - B4 - - - D5 - - - G5 - - - - - - -'), leadEvery: 1 },
  finish: { bpm: 80, chords: [['A2', 'm'], ['A2', 'm'], ['Bb2', ''], ['A2', 'm']], kick: 'x...x...........', snare: '................', hat: '................', bass: 'drone', pad: true },
  ladder: { bpm: 110, chords: [['D3', 'm'], ['A2', 'm'], ['Bb2', ''], ['C3', '']], kick: 'x.......x.......', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'half', pad: true, arp: true },
};

export function playMusic(name) {
  if (!A.ctx) { A.pending = name; return; }
  if (A.song && A.song.name === name) return;
  A.song = name ? Object.assign({ name }, SONGS[name]) : null;
  A.step = 0; A.loop = 0; A.nextStep = A.ctx.currentTime + 0.08;
}
export function stopMusic() { A.song = null; }

function schedule() {
  const c = A.ctx; if (!c) return;
  if (A.pending !== undefined) { const p = A.pending; A.pending = undefined; playMusic(p); }
  const s = A.song; if (!s || !A.on.music) return;
  const stepDur = 60 / s.bpm / 4;
  if (A.nextStep < c.currentTime - 0.5) A.nextStep = c.currentTime + 0.05;
  while (A.nextStep < c.currentTime + 0.15) { playStep(s, A.step, A.nextStep, stepDur); A.nextStep += stepDur; A.step++; if (A.step % 64 === 0) A.loop++; }
}

function playStep(s, step, t, sd) {
  const i = step % 16, bar = Math.floor(step / 16) % 4;
  const [root, q] = s.chords[bar]; const ch = chord(root, q);
  const D = A.mus;
  if (s.kick[i] === 'x') { tone('sine', 150, 42, 0.22, 0.85, { at: t, dest: D }); }
  if (s.snare[i] === 'x') { noise(0.16, 'bandpass', 1800, 900, 0.45, { at: t, dest: D, q: 0.8 }); tone('triangle', 220, 160, 0.08, 0.25, { at: t, dest: D }); }
  if (s.hat[i] === 'x') noise(0.035, 'highpass', 8000, 0, 0.12 + (i % 4 === 2 ? 0.06 : 0), { at: t, dest: D });
  if (s.tom && s.tom[i] === 'x') tone('sine', 180 - (i % 2) * 40, 70, 0.25, 0.5, { at: t, dest: D });
  const bassNote = ch[0] - 12;
  const bass = (m, len, g = 0.32) => { const f = mtof(m); tone('sawtooth', f, f, len, g * 0.5, { at: t, dest: D, lp: 1600, lp1: 220, q: 6 }); tone('sawtooth', f, f, len, g * 0.5, { at: t, dest: D, lp: 1400, lp1: 200, q: 4, detune: 9 }); };
  if (s.bass === 'pump' && i % 2 === 0) bass(bassNote + (i % 4 === 2 ? 12 : 0), sd * 1.6);
  if (s.bass === 'synco' && [0, 3, 6, 8, 11, 14].includes(i)) bass(bassNote + (i === 14 ? 12 : 0), sd * 2.2);
  if (s.bass === 'bounce' && i % 4 === 0) bass(bassNote + (i === 8 ? 7 : 0), sd * 3, 0.26);
  if (s.bass === 'half' && (i === 0 || i === 10)) bass(bassNote, sd * 7, 0.36);
  if (s.bass === 'drone' && i === 0) bass(bassNote, sd * 15, 0.3);
  if (s.arp && i % 1 === 0) { const m = ch[i % 3] + 12 + (Math.floor(i / 3) % 2) * 12; const f = mtof(m); tone('square', f, f, sd * 0.8, 0.045, { at: t, dest: D, lp: 2600, lp1: 900 }); }
  if (s.bell && i % 4 === 2) { const m = ch[(i / 4 | 0) % 3] + 24; tone('sine', mtof(m), mtof(m), 0.4, 0.08, { at: t, dest: A.verb }); }
  if ((s.pad || s.organ) && i === 0) {
    for (const m of ch) { const f = mtof(m + 12); tone(s.organ ? 'square' : 'sawtooth', f, f, sd * 15, 0.035, { at: t, dest: D, lp: s.organ ? 1200 : 900, att: 0.25 }); tone('sawtooth', f, f, sd * 15, 0.025, { at: t, dest: A.verb, lp: 800, att: 0.3, detune: 12 }); }
  }
  if (s.lead && (A.loop % (s.leadEvery || 1)) === (s.leadEvery ? s.leadEvery - 1 : 0)) {
    const k = step % 64; const m = s.lead[k];
    if (typeof m === 'number') {
      let len = 1; while (k + len < 64 && s.lead[k + len] === '-') len++;
      const f = mtof(m), dur = sd * len * 0.95;
      tone('sawtooth', f, f, dur, 0.07, { at: t, dest: D, lp: 2800, lp1: 1200, vib: 5.5, vibAmt: f * 0.008, att: 0.02 });
      tone('square', f * 1.003, f * 1.003, dur, 0.04, { at: t, dest: A.verb, lp: 2200, att: 0.02 });
    }
  }
}

export function jingle(kind) {
  if (!A.ctx || !A.on.music) return;
  const t = A.ctx.currentTime + 0.05, D = A.mus;
  const seq = kind === 'win' ? [[n('C5'), 0], [n('E5'), 0.12], [n('G5'), 0.24], [n('C6'), 0.36], [n('G5'), 0.6], [n('C6'), 0.72]]
    : kind === 'lose' ? [[n('E5'), 0], [n('D#5'), 0.25], [n('D5'), 0.5], [n('C#5'), 0.75]]
      : [[n('G4'), 0], [n('C5'), 0.1], [n('E5'), 0.2], [n('G5'), 0.3]];
  for (const [m, d] of seq) { const f = mtof(m); tone('square', f, f, kind === 'lose' ? 0.3 : 0.22, 0.1, { at: t + d, dest: D, lp: 3000 }); tone('sawtooth', f / 2, f / 2, 0.25, 0.05, { at: t + d, dest: D, lp: 1500 }); }
}
