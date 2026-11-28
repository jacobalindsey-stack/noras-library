// Slap Happy sounds. Everything is synthesized with Web Audio: the ten team
// buzzers, the game-show stings, applause, a sad trombone and two music loops.

let ctx = null, master, sfxBus, musBus, comp, noiseBuf = null;
export const prefs = { sound: true, music: true };

function init() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC({ latencyHint: 'interactive' });
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
  master = ctx.createGain(); master.gain.value = prefs.sound ? 0.9 : 0;
  sfxBus = ctx.createGain(); sfxBus.gain.value = 1;
  musBus = ctx.createGain(); musBus.gain.value = prefs.music ? 0.32 : 0;
  sfxBus.connect(master); musBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return true;
}

// iPhone: audio only starts from a finger lift or click, and the ring/silent
// switch would mute it unless the page says it is playing media.
export function unlock() {
  if (!init()) return;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) {} }
  try { const b = ctx.createBuffer(1, 1, 22050); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) {}
  silentLoop();
}
let silentEl = null;
function silentLoop() {
  if (silentEl || navigator.audioSession || !/iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) || !('ontouchend' in document)) return;
  // older iOS: a silent looping clip keeps the silent switch from muting the game
  const sr = 8000, n = sr / 2, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  silentEl = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })));
  silentEl.loop = true; silentEl.setAttribute('playsinline', ''); silentEl.volume = 0.01;
  silentEl.play().catch(() => { silentEl = null; });
}
['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { passive: true, capture: true }));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') { try { ctx.resume(); } catch (e) {} } });

export function setSound(on) { prefs.sound = on; if (ctx) master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.02); }
export function setMusic(on) { prefs.music = on; if (ctx) musBus.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.05); if (!on) stopMusic(); }

// ---------- building blocks ----------
const now = () => ctx.currentTime;
function gainEnv(t, { a = 0.005, peak = 0.3, hold = 0, d = 0.2, to = sfxBus } = {}) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  if (hold) g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + d);
  g.connect(to);
  return g;
}
function osc(type, f, t, dur, out, { f2, glide = 'exp', detune = 0 } = {}) {
  const o = ctx.createOscillator();
  o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
  if (f2) glide === 'exp' ? o.frequency.exponentialRampToValueAtTime(f2, t + dur) : o.frequency.linearRampToValueAtTime(f2, t + dur);
  o.connect(out); o.start(t); o.stop(t + dur + 0.05);
  return o;
}
function filt(type, f, q, out) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(out); return b; }
function noise(t, dur, out, rate = 1) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = rate;
  s.connect(out); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return s;
}
function vibrato(o, t, dur, rate, depth) {
  const l = ctx.createOscillator(), g = ctx.createGain();
  l.frequency.value = rate; g.gain.value = depth; l.connect(g); g.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
}
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);

// ---------- the team buzzers ----------
export const BUZZERS = [
  { id: 'boing', name: 'Boing', e: '\u{1F300}' },
  { id: 'honk', name: 'Honk', e: '\u{1F4EF}' },
  { id: 'laser', name: 'Laser', e: '\u{1F6F8}' },
  { id: 'cowbell', name: 'Cowbell', e: '\u{1F404}' },
  { id: 'meow', name: 'Meow', e: '\u{1F431}' },
  { id: 'airhorn', name: 'Air horn', e: '\u{1F4E3}' },
  { id: 'quack', name: 'Quack', e: '\u{1F986}' },
  { id: 'whistle', name: 'Whistle', e: '\u{1F3BA}' },
  { id: 'badum', name: 'Ba-dum', e: '\u{1F941}' },
  { id: 'weewoo', name: 'Wee-woo', e: '\u{1F6A8}' },
];

const buzz = {
  boing(t) {
    const g = gainEnv(t, { a: 0.004, peak: 0.55, d: 0.75 });
    const o = osc('sine', 160, t, 0.75, g, { f2: 420 });
    const l = ctx.createOscillator(), lg = ctx.createGain();
    l.frequency.setValueAtTime(22, t); l.frequency.exponentialRampToValueAtTime(7, t + 0.7);
    lg.gain.setValueAtTime(140, t); lg.gain.exponentialRampToValueAtTime(4, t + 0.7);
    l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + 0.8);
    const g2 = gainEnv(t, { a: 0.004, peak: 0.12, d: 0.4 });
    osc('triangle', 320, t, 0.4, g2, { f2: 840 });
  },
  honk(t) {
    for (const [dt, f] of [[0, 370], [0.24, 350]]) {
      const g = gainEnv(t + dt, { a: 0.012, peak: 0.42, hold: 0.13, d: 0.06 });
      const bp = filt('bandpass', 1150, 1.4, g);
      osc('sawtooth', f, t + dt, 0.2, bp, { f2: f * 0.93 });
      osc('sawtooth', f * 1.12, t + dt, 0.2, bp, { f2: f * 1.04 });
    }
  },
  laser(t) {
    for (const dt of [0, 0.19]) {
      const g = gainEnv(t + dt, { a: 0.003, peak: 0.3, d: 0.17 });
      const lp = filt('lowpass', 5000, 0.7, g);
      osc('square', 1900, t + dt, 0.17, lp, { f2: 170 });
    }
  },
  cowbell(t) {
    for (const dt of [0, 0.2]) {
      const g = ctx.createGain(); g.connect(sfxBus);
      const tt = t + dt;
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.6, tt + 0.002);
      g.gain.exponentialRampToValueAtTime(0.18, tt + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.55);
      const bp = filt('bandpass', 830, 1.1, g);
      osc('square', 540, tt, 0.55, bp); osc('square', 800, tt, 0.55, bp);
    }
  },
  meow(t) {
    const g = gainEnv(t, { a: 0.05, peak: 0.42, hold: 0.42, d: 0.18 });
    const lp = filt('lowpass', 4200, 0.7, g);
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 4; f1.connect(lp);
    f1.frequency.setValueAtTime(800, t); f1.frequency.linearRampToValueAtTime(1900, t + 0.2); f1.frequency.linearRampToValueAtTime(700, t + 0.62);
    const f2 = filt('bandpass', 2700, 6, lp);
    const o = osc('sawtooth', 430, t, 0.66, f1);
    o.frequency.linearRampToValueAtTime(760, t + 0.18); o.frequency.linearRampToValueAtTime(560, t + 0.45); o.frequency.linearRampToValueAtTime(380, t + 0.66);
    o.connect(f2);
    vibrato(o, t, 0.66, 6.5, 14);
  },
  airhorn(t) {
    const g = gainEnv(t, { a: 0.02, peak: 0.34, hold: 0.62, d: 0.12 });
    const hp = filt('highpass', 220, 0.7, g);
    const lp = filt('lowpass', 3200, 0.9, hp);
    for (const [f, dt] of [[392, -8], [392, 9], [466, -5], [494, 6], [587, 0]]) {
      const o = osc('sawtooth', f * 0.96, t, 0.78, lp, { detune: dt });
      o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    }
  },
  quack(t) {
    for (const [dt, f] of [[0, 300], [0.18, 270]]) {
      const g = gainEnv(t + dt, { a: 0.006, peak: 0.5, hold: 0.06, d: 0.07 });
      const bp = filt('bandpass', 1250, 5, g);
      const lp = filt('lowpass', 2600, 0.7, bp);
      osc('sawtooth', f, t + dt, 0.14, lp, { f2: f * 0.7 });
    }
  },
  whistle(t) {
    const g = gainEnv(t, { a: 0.03, peak: 0.36, hold: 0.44, d: 0.08 });
    const o = osc('sine', 480, t, 0.56, g, { f2: 1800 });
    vibrato(o, t, 0.56, 7, 16);
    const ng = gainEnv(t, { a: 0.03, peak: 0.03, hold: 0.4, d: 0.1 });
    noise(t, 0.56, filt('highpass', 3500, 0.7, ng));
  },
  badum(t) {
    for (const [dt, f] of [[0, 190], [0.16, 140]]) {
      const g = gainEnv(t + dt, { a: 0.003, peak: 0.7, d: 0.26 });
      osc('sine', f, t + dt, 0.26, g, { f2: f * 0.5 });
      const ng = gainEnv(t + dt, { a: 0.002, peak: 0.12, d: 0.06 });
      noise(t + dt, 0.08, filt('bandpass', 1500, 0.8, ng));
    }
    const cg = gainEnv(t + 0.34, { a: 0.002, peak: 0.28, d: 0.7 });
    noise(t + 0.34, 0.75, filt('highpass', 6500, 0.7, cg));
  },
  weewoo(t) {
    const g = gainEnv(t, { a: 0.01, peak: 0.28, hold: 0.7, d: 0.05 });
    const lp = filt('lowpass', 2600, 0.7, g);
    const o = ctx.createOscillator(); o.type = 'square'; o.connect(lp);
    for (let i = 0; i < 4; i++) o.frequency.setValueAtTime(i % 2 ? 760 : 960, t + i * 0.19);
    o.start(t); o.stop(t + 0.8);
  },
};

export function buzzer(id, delay = 0) { if (!init() || !prefs.sound) return; (buzz[id] || buzz.boing)(now() + 0.01 + delay); }

// ---------- game sounds ----------
const fx = {
  pop(t) { const g = gainEnv(t, { a: 0.003, peak: 0.25, d: 0.08 }); osc('sine', 600, t, 0.08, g, { f2: 1300 }); },
  join(t) {
    const g = gainEnv(t, { a: 0.004, peak: 0.35, d: 0.12 }); osc('sine', 500, t, 0.12, g, { f2: 1100 });
    for (const [dt, n] of [[0.09, 84], [0.15, 88], [0.21, 91]]) { const gg = gainEnv(t + dt, { a: 0.004, peak: 0.16, d: 0.5 }); osc('triangle', NOTE(n), t + dt, 0.5, gg); }
  },
  whoosh(t) {
    const g = gainEnv(t, { a: 0.18, peak: 0.32, d: 0.25 });
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; bp.connect(g);
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.42);
    noise(t, 0.45, bp);
  },
  ding(t) {
    for (const [dt, f] of [[0, 1318.5], [0.15, 1760]]) {
      for (const [m, p, d] of [[1, 0.3, 0.9], [2.76, 0.08, 0.4], [5.4, 0.04, 0.2]]) { const g = gainEnv(t + dt, { a: 0.002, peak: p, d }); osc('sine', f * m, t + dt, d, g); }
    }
  },
  tick(t) { const g = gainEnv(t, { a: 0.001, peak: 0.3, d: 0.05 }); osc('sine', 1250, t, 0.05, filt('bandpass', 1300, 3, g)); },
  tock(t) { const g = gainEnv(t, { a: 0.001, peak: 0.35, d: 0.07 }); osc('sine', 820, t, 0.07, filt('bandpass', 850, 3, g)); },
  timeup(t) {
    const g = gainEnv(t, { a: 0.01, peak: 0.38, hold: 0.62, d: 0.1 });
    const lp = filt('lowpass', 1100, 0.8, g);
    osc('sawtooth', 98, t, 0.75, lp); osc('square', 103.5, t, 0.75, lp);
  },
  thunk(t) {
    const g = gainEnv(t, { a: 0.002, peak: 0.5, d: 0.18 }); osc('sine', 150, t, 0.18, g, { f2: 60 });
    const ng = gainEnv(t, { a: 0.001, peak: 0.1, d: 0.04 }); noise(t, 0.05, filt('lowpass', 1200, 0.7, ng));
  },
  early(t) { for (const dt of [0, 0.12]) { const g = gainEnv(t + dt, { a: 0.003, peak: 0.25, hold: 0.05, d: 0.03 }); osc('square', 200, t + dt, 0.09, filt('lowpass', 1200, 0.7, g)); } },
  beep(t) { const g = gainEnv(t, { a: 0.003, peak: 0.3, hold: 0.08, d: 0.06 }); osc('square', 880, t, 0.15, filt('lowpass', 2500, 0.7, g)); },
  go(t) { const g = gainEnv(t, { a: 0.003, peak: 0.34, hold: 0.25, d: 0.15 }); osc('square', 1760, t, 0.42, filt('lowpass', 3500, 0.7, g)); fx.ding(t); },
  coin(t) { const g = gainEnv(t, { a: 0.002, peak: 0.16, hold: 0.04, d: 0.18 }); const o = osc('square', 988, t, 0.24, filt('lowpass', 4000, 0.7, g)); o.frequency.setValueAtTime(1319, t + 0.05); },
  tada(t) { brassChord(t, [67], 0.11, 0.3); brassChord(t + 0.13, [72, 76, 79, 84], 0.9, 0.28); sparkle(t + 0.15); },
  correct(t) {
    [72, 76, 79, 84, 88, 91].forEach((n, i) => { const g = gainEnv(t + i * 0.065, { a: 0.003, peak: 0.16, d: 0.3 }); osc('square', NOTE(n), t + i * 0.065, 0.3, filt('lowpass', 5000, 0.7, g)); osc('triangle', NOTE(n), t + i * 0.065, 0.3, g); });
    brassChord(t + 0.42, [72, 76, 79, 84], 0.7, 0.22);
    sparkle(t + 0.5);
  },
  wrong(t) {
    // the sad trombone
    const notes = [[55, 0.34], [54, 0.34], [53, 0.34], [52, 1.1]];
    let tt = t;
    for (const [n, d] of notes) {
      const g = gainEnv(tt, { a: 0.03, peak: 0.36, hold: d - 0.1, d: 0.1 });
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 5; lp.connect(g);
      lp.frequency.setValueAtTime(500, tt); lp.frequency.linearRampToValueAtTime(1500, tt + 0.12); lp.frequency.linearRampToValueAtTime(700, tt + d);
      const o = osc('sawtooth', NOTE(n) * 1.03, tt, d, lp); o.frequency.exponentialRampToValueAtTime(NOTE(n), tt + 0.07);
      if (d > 1) vibrato(o, tt + 0.25, d - 0.25, 5.5, 5);
      tt += d;
    }
  },
  bonus(t) {
    [67, 72, 76, 79].forEach((n, i) => brassChord(t + i * 0.12, [n], 0.12, 0.26));
    brassChord(t + 0.5, [72, 76, 79, 84], 0.8, 0.26);
    sparkle(t + 0.55); sparkle(t + 0.8);
  },
  fanfare(t) {
    const mel = [[72, 0.16], [72, 0.16], [72, 0.16], [76, 0.48], [74, 0.16], [76, 0.16], [79, 1.1]];
    let tt = t;
    for (const [n, d] of mel) { brassChord(tt, [n, n - 12], d * 0.95, 0.24); tt += d; }
    brassChord(t + 1.28, [60, 64, 67, 72], 1.2, 0.14);
    drumHit(t, 'kick'); drumHit(t + 0.48, 'snare'); drumHit(t + 0.96, 'kick'); drumHit(t + 1.28, 'crash');
    sparkle(t + 1.3); sparkle(t + 1.6);
  },
};
function brassChord(t, notes, dur, peak) {
  for (const n of notes) {
    const g = gainEnv(t, { a: 0.03, peak: peak / Math.sqrt(notes.length), hold: Math.max(0, dur - 0.12), d: 0.12 });
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.5; lp.connect(g);
    lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(4200, t + 0.07); lp.frequency.exponentialRampToValueAtTime(1800, t + dur);
    osc('sawtooth', NOTE(n), t, dur, lp, { detune: -6 }); osc('sawtooth', NOTE(n), t, dur, lp, { detune: 7 });
  }
}
function sparkle(t) {
  for (let i = 0; i < 7; i++) { const tt = t + i * 0.045; const g = gainEnv(tt, { a: 0.002, peak: 0.07, d: 0.25 }); osc('sine', NOTE(96 + [0, 4, 7, 12, 7, 16, 19][i]), tt, 0.25, g); }
}
function drumHit(t, kind, vol = 1, to = sfxBus) {
  if (kind === 'kick') { const g = gainEnv(t, { a: 0.002, peak: 0.8 * vol, d: 0.28, to }); osc('sine', 150, t, 0.28, g, { f2: 45 }); }
  if (kind === 'snare') { const g = gainEnv(t, { a: 0.001, peak: 0.32 * vol, d: 0.16, to }); noise(t, 0.18, filt('bandpass', 1900, 0.7, g)); const g2 = gainEnv(t, { a: 0.001, peak: 0.25 * vol, d: 0.08, to }); osc('triangle', 220, t, 0.08, g2, { f2: 150 }); }
  if (kind === 'hat') { const g = gainEnv(t, { a: 0.001, peak: 0.12 * vol, d: 0.04, to }); noise(t, 0.05, filt('highpass', 7500, 0.7, g)); }
  if (kind === 'ohat') { const g = gainEnv(t, { a: 0.001, peak: 0.1 * vol, d: 0.22, to }); noise(t, 0.24, filt('highpass', 7000, 0.7, g)); }
  if (kind === 'crash') { const g = gainEnv(t, { a: 0.002, peak: 0.3 * vol, d: 1.3, to }); noise(t, 1.35, filt('highpass', 4500, 0.6, g)); }
}

export function play(name, delay = 0) { if (!init() || !prefs.sound) return; const f = fx[name]; if (f) f(now() + 0.01 + delay); }

export function drumroll(dur = 1.2, delay = 0) {
  if (!init() || !prefs.sound) return;
  const t0 = now() + 0.01 + delay;
  const n = Math.floor(dur / 0.042);
  for (let i = 0; i < n; i++) { const t = t0 + i * 0.042; const v = 0.12 + 0.38 * (i / n); const g = gainEnv(t, { a: 0.001, peak: v, d: 0.05 }); noise(t, 0.06, filt('bandpass', 1700 + Math.random() * 400, 0.8, g)); }
  drumHit(t0 + dur, 'crash'); drumHit(t0 + dur, 'kick');
}

export function applause(dur = 1.8, delay = 0) {
  if (!init() || !prefs.sound) return;
  const t0 = now() + 0.01 + delay;
  const n = Math.floor(dur * 55);
  for (let i = 0; i < n; i++) {
    const t = t0 + Math.random() * dur * (0.4 + 0.6 * Math.random());
    const g = gainEnv(t, { a: 0.001, peak: 0.05 + Math.random() * 0.08, d: 0.025 + Math.random() * 0.02 });
    noise(t, 0.05, filt('bandpass', 900 + Math.random() * 1800, 1.2, g), 0.9 + Math.random() * 0.3);
  }
  const g = ctx.createGain(); g.connect(sfxBus);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.4);
  noise(t0, dur + 0.45, filt('bandpass', 1800, 0.5, g));
}

// ---------- music: a lobby groove and the thinking clock ----------
let mus = null;
const SONGS = {
  lobby: { bpm: 112, bars: 8, chords: [[53, 57, 60], [50, 53, 57], [55, 58, 62], [48, 52, 55, 58]],
    mel: [[69, , 72, , 77, , , , 76, , 74, , 72, , , ,], [74, , 77, , 81, , , , 79, , 77, , 74, , , ,], [70, , 74, , 79, , , , 77, , 76, , 74, , , ,], [72, , 76, , 79, , 82, , 81, , 79, , 76, , 72, ,]] },
  think: { bpm: 120, bars: 2, chords: [[45, 48, 52], [45, 48, 52]] },
};
export function music(name) {
  if (!init()) return;
  if (mus && mus.name === name) return;
  stopMusic();
  if (!name || !prefs.music) return;
  const S = SONGS[name]; if (!S) return;
  const out = ctx.createGain(); out.gain.value = 1; out.connect(musBus);
  mus = { name, S, step: 0, next: now() + 0.08, out, dur: 60 / S.bpm / 4 };
  mus.timer = setInterval(schedule, 30);
}
export function stopMusic() {
  if (!mus) return;
  clearInterval(mus.timer);
  const o = mus.out; try { o.gain.setTargetAtTime(0.0001, now(), 0.06); setTimeout(() => o.disconnect(), 600); } catch (e) {}
  mus = null;
}
function schedule() {
  if (!mus || !ctx) return;
  while (mus.next < now() + 0.16) { playStep(mus, mus.step, mus.next); mus.next += mus.dur; mus.step++; }
}
function playStep(m, step, t) {
  const S = m.S, s16 = step % 16, bar = Math.floor(step / 16) % S.bars, out = m.out;
  if (m.name === 'lobby') {
    const ch = S.chords[bar % 4], root = ch[0] - 12;
    if (s16 === 0 || s16 === 8 || s16 === 11) drumHit(t, 'kick', 0.7, out);
    if (s16 === 4 || s16 === 12) drumHit(t, 'snare', 0.6, out);
    if (s16 % 2 === 0) drumHit(t, s16 === 14 ? 'ohat' : 'hat', 0.7, out);
    const bassMap = { 0: 0, 3: 0, 6: 7, 8: 12, 11: 0, 14: 7 };
    if (s16 in bassMap) { const g = gainEnv(t, { a: 0.005, peak: 0.42, hold: 0.06, d: 0.12, to: out }); osc('triangle', NOTE(root + bassMap[s16]), t, 0.2, g); osc('square', NOTE(root + bassMap[s16]), t, 0.2, filt('lowpass', 500, 0.7, g)); }
    if (s16 === 2 || s16 === 6 || s16 === 10 || s16 === 14) for (const n of ch) { const g = gainEnv(t, { a: 0.004, peak: 0.07, d: 0.2, to: out }); osc('triangle', NOTE(n + 12), t, 0.2, g); osc('sine', NOTE(n + 24), t, 0.12, g); }
    if (bar >= 4) {
      const n = S.mel[bar % 4][s16];
      if (n) { const g = gainEnv(t, { a: 0.01, peak: 0.1, hold: m.dur * 1.4, d: 0.1, to: out }); const o = osc('square', NOTE(n), t, m.dur * 1.6, filt('lowpass', 2200, 0.7, g)); vibrato(o, t, m.dur * 1.6, 5.5, 4); }
    }
  } else if (m.name === 'think') {
    const bass = [45, 45, 48, 45, 52, 45, 50, 48];
    if (s16 % 2 === 0) { const g = gainEnv(t, { a: 0.005, peak: 0.34, hold: 0.04, d: 0.1, to: out }); osc('triangle', NOTE(bass[(s16 / 2) % 8] - 12), t, 0.16, g); }
    if (s16 % 4 === 0) { const g = gainEnv(t, { a: 0.001, peak: s16 === 0 ? 0.22 : 0.14, d: 0.05, to: out }); osc('sine', s16 === 0 ? 1250 : 950, t, 0.05, filt('bandpass', 1100, 3, g)); }
    if (s16 === 0 && bar === 0) for (const n of S.chords[0]) { const g = gainEnv(t, { a: 0.4, peak: 0.035, hold: 1.6, d: 1.2, to: out }); osc('sawtooth', NOTE(n), t, 3.2, filt('lowpass', 700, 0.7, g)); }
  }
}

// ---------- the host's voice (reads the question when switched on) ----------
let voice = null;
// onDone(ok) runs once when the voice finishes (ok = true) or can't speak (ok = false).
export function speak(text, onDone) {
  let done = false;
  const finish = ok => { if (done) return; done = true; if (onDone) onDone(ok); };
  if (!('speechSynthesis' in window) || !prefs.sound) { finish(false); return; }
  try {
    speechSynthesis.cancel();
    if (!voice) {
      const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
      voice = vs.find(v => /Samantha|Karen|Daniel|Moira|Google US English|Aria|Jenny/i.test(v.name)) || vs[0] || null;
    }
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 1.0; u.pitch = 1.05; u.volume = 1;
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    speechSynthesis.speak(u);
  } catch (e) { finish(false); }
}
// iPhone and iPad only let a page talk after it has talked during a tap.
export function primeSpeech(text = '') {
  if (!('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text || ' ');
    u.volume = text ? 1 : 0; u.rate = 1.0; u.pitch = 1.05;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  } catch (e) {}
}
if ('speechSynthesis' in window) { try { speechSynthesis.onvoiceschanged = () => { voice = null; }; } catch (e) {} }
export function hush() { try { speechSynthesis.cancel(); } catch (e) {} }
