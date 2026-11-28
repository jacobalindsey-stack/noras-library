// Sounds (all synthesized, no files), buzzes, and keeping the screen awake.

const A = { ctx: null, on: true, buzz: true, el: null, stuckSince: 0 };

function init(fresh) {
  if (A.ctx && !fresh) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (A.ctx) { try { A.ctx.close(); } catch (e) {} A.ctx = null; }
  const c = new AC();
  A.ctx = c;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -12; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.12;
  A.out = c.createGain(); A.out.gain.value = 0.9;
  A.out.connect(comp); comp.connect(c.destination);
  const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  A.noise = nb;
}

// Runs at the start of every tap, click and key press. iPhone only lets
// sound start from one, and can leave it stuck after a call, a pop-up (like
// the motion question), the lock screen or a trip to another app.
export function unlockAudio(e) {
  if (e && e.isTrusted === false) return; // the hidden buzz switch's own click
  try {
    init();
    let c = A.ctx; if (!c) return;
    // tell iPhone this page plays sound, so the ring/silent switch doesn't mute it
    try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (er) {}
    if (c.state !== 'running') {
      // still stuck a moment after the last try: start over with a fresh one
      if (A.stuckSince && performance.now() - A.stuckSince > 1200) { init(true); c = A.ctx; A.stuckSince = performance.now(); }
      else if (!A.stuckSince) A.stuckSince = performance.now();
      try { const p = c.resume(); if (p && p.then) p.then(() => { if (c.state === 'running') A.stuckSince = 0; }, () => {}); } catch (er) {}
    } else A.stuckSince = 0;
    // the classic iPhone unlock: one silent sample played inside the tap
    try { const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0); } catch (er) {}
    silentLoop();
  } catch (er) {}
}

// Older iPhones (no audio session control): a quiet looping clip keeps the
// silent switch from muting the game. Newer ones don't need it, and mixing it
// with the game's sound can make iPhone cut the sound, so it is only for them.
function silentLoop() {
  if (A.el || navigator.audioSession || !/iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) || !('ontouchend' in document)) return;
  const sr = 8000, n = sr / 2, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  A.el = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })));
  A.el.loop = true; A.el.setAttribute('playsinline', ''); A.el.volume = 0.01;
  A.el.play().catch(() => { A.el = null; });
}

// main.js calls this after it has set up its own tap listeners, so that the
// motion question is asked first in a tap and the sound is woken second
export function startUnlocking() {
  ['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true, capture: true }));
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && A.ctx && A.ctx.state !== 'running') { try { A.ctx.resume(); } catch (e) {} }
});
export const audioState = () => (A.ctx ? A.ctx.state : 'none');
// for tests: freeze the sound the way iPhone sometimes leaves it
export const testStickAudio = () => { if (A.ctx) { A.ctx.suspend(); A.ctx.resume = () => Promise.resolve(); } };

export function setSound(on) { A.on = !!on; }
export function setBuzz(on) { A.buzz = !!on; }

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function tone(type, f0, f1, dur, gain, o = {}) {
  const c = A.ctx; if (!c || !A.on) return;
  const t = c.currentTime + (o.delay || 0);
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = type; osc.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  if (o.vib) {
    const l = c.createOscillator(), lg = c.createGain();
    l.frequency.value = o.vib; lg.gain.value = o.vibAmt || f0 * 0.04;
    l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.1);
  }
  env(g, t, o.att || 0.004, gain, dur);
  let node = osc;
  if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || 0.8; node.connect(f); node = f; }
  node.connect(g); g.connect(A.out);
  osc.start(t); osc.stop(t + dur + (o.att || 0.004) + 0.05);
}
function hiss(dur, f0, f1, gain, o = {}) {
  const c = A.ctx; if (!c || !A.on) return;
  const t = c.currentTime + (o.delay || 0);
  const s = c.createBufferSource(); s.buffer = A.noise;
  const f = c.createBiquadFilter(); f.type = o.type || 'bandpass';
  f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = o.q || 1.2;
  const g = c.createGain(); env(g, t, o.att || 0.003, gain, dur);
  s.connect(f); f.connect(g); g.connect(A.out);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}

export const sfx = {
  tap() { tone('triangle', 520, 640, 0.06, 0.18); },
  pop() { tone('sine', 300, 900, 0.09, 0.3); tone('triangle', 900, 1200, 0.05, 0.12, { delay: 0.03 }); },
  count() { tone('square', 660, 660, 0.12, 0.16, { lp: 2600 }); tone('sine', 1320, 1320, 0.1, 0.08); },
  go() {
    tone('square', 990, 990, 0.32, 0.2, { lp: 3200 }); tone('sine', 1980, 1980, 0.3, 0.1);
    hiss(0.25, 3000, 8000, 0.08, { type: 'highpass' });
  },
  // a bright little game-show chime, climbing
  correct() {
    [784, 988, 1319].forEach((f, i) => { tone('triangle', f, f, 0.16, 0.26, { delay: i * 0.055 }); tone('sine', f * 2, f * 2, 0.12, 0.08, { delay: i * 0.055 }); });
    hiss(0.18, 6000, 9000, 0.05, { type: 'highpass', delay: 0.12 });
  },
  bonus() {
    [784, 988, 1175, 1568, 1976].forEach((f, i) => tone('triangle', f, f, 0.2, 0.22, { delay: i * 0.05 }));
    [2637, 3136, 3951].forEach((f, i) => tone('sine', f, f, 0.25, 0.06, { delay: 0.25 + i * 0.07 }));
  },
  // a rubbery "bwomp" downward
  pass() { tone('sawtooth', 420, 150, 0.26, 0.2, { lp: 900, q: 6 }); tone('sine', 220, 90, 0.3, 0.22); },
  goldAppears() { [1568, 2093, 2637].forEach((f, i) => tone('sine', f, f * 1.01, 0.3, 0.07, { delay: i * 0.06, vib: 7 })); },
  tick(urgent) { tone('square', urgent ? 1400 : 1100, urgent ? 1400 : 1100, 0.035, urgent ? 0.14 : 0.09, { lp: 4000 }); hiss(0.02, 5000, 0, 0.05); },
  buzzer() {
    tone('sawtooth', 150, 140, 0.8, 0.22, { lp: 1200, vib: 18, vibAmt: 6 });
    tone('square', 300, 280, 0.8, 0.1, { lp: 1600, vib: 18, vibAmt: 10 });
  },
  fanfare() {
    const n = [523, 659, 784, 1047, 784, 1047, 1319];
    const d = [0, 0.11, 0.22, 0.33, 0.52, 0.63, 0.74];
    n.forEach((f, i) => { tone('square', f, f, i === n.length - 1 ? 0.6 : 0.12, 0.12, { delay: d[i], lp: 3000 }); tone('triangle', f / 2, f / 2, 0.14, 0.12, { delay: d[i] }); });
    for (let i = 0; i < 6; i++) hiss(0.08, 4000 + i * 600, 0, 0.04, { delay: 0.8 + i * 0.07, type: 'highpass' });
  },
  streak() { [1047, 1319, 1568, 2093].forEach((f, i) => tone('triangle', f, f, 0.09, 0.14, { delay: i * 0.04 })); },
};

// ------------------------------------------------------------- buzzes
// Android vibrates. iPhone Safari has no vibration call; on iOS 18 and
// later, flipping a hidden switch control gives one short system tap, so
// that is used (twice for "got it").
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
let sw = null;
function iosTap() {
  try {
    if (!sw) {
      const lab = document.createElement('label');
      lab.setAttribute('aria-hidden', 'true');
      lab.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
      const inp = document.createElement('input');
      inp.type = 'checkbox'; inp.setAttribute('switch', ''); inp.tabIndex = -1;
      lab.appendChild(inp); document.body.appendChild(lab); sw = lab;
    }
    sw.click();
  } catch (e) {}
}
export function buzz(kind) {
  if (!A.buzz) return;
  const pat = { ok: [35, 50, 35], pass: [70], end: [220, 90, 220], tick: [12], count: [20], go: [60], gold: [25, 30, 25, 30, 25] }[kind] || [30];
  if (navigator.vibrate) { try { navigator.vibrate(pat); } catch (e) {} return; }
  if (IOS) {
    iosTap();
    const pulses = Math.min(3, Math.ceil(pat.length / 2));
    for (let i = 1; i < pulses; i++) setTimeout(iosTap, i * 110);
  }
}

// ------------------------------------------------------------- awake
// Keeps the screen from dimming while the phone is on someone's forehead.
let lock = null, wantLock = false;
export async function stayAwake(on) {
  wantLock = on;
  try {
    if (on && !lock && navigator.wakeLock) {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } else if (!on && lock) { const l = lock; lock = null; await l.release(); }
  } catch (e) { lock = null; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && wantLock && !lock) stayAwake(true); });
