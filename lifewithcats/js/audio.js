// Life with Cats — every sound is made on the spot: meows shaped like real
// meows (a voice through two moving formants), a purr you can feel, the tink
// of a water glass on the floorboards, and a soft kalimba tune.
let ctx = null, master, sfxG, musG, noiseBuf;
const opts = { sfx: true, music: true };
export function audioUnlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.gain.value = opts.sfx ? 1 : 0; sfxG.connect(master);
    musG = ctx.createGain(); musG.gain.value = opts.music ? 0.32 : 0; musG.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}
export function audioSuspend(on) { if (!ctx) return; if (on) ctx.suspend(); else ctx.resume(); }
export function setAudio(o) { Object.assign(opts, o); if (!ctx) return; sfxG.gain.setTargetAtTime(opts.sfx ? 1 : 0, ctx.currentTime, 0.05); musG.gain.setTargetAtTime(opts.music ? 0.32 : 0, ctx.currentTime, 0.2); }
const ok = () => ctx && ctx.state === 'running';
function env(g, t, a, peak, dec, end = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + dec); }
function noise(t, dur, f, q, gain, type = 'bandpass', out = sfxG) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const bf = ctx.createBiquadFilter(); bf.type = type; bf.frequency.value = f; bf.Q.value = q;
  const g = ctx.createGain(); s.connect(bf); bf.connect(g); g.connect(out);
  env(g, t, 0.005, gain, dur);
  s.start(t, Math.random()); s.stop(t + dur + 0.05);
  return { s, bf, g };
}
function tone(t, f, dur, type = 'sine', gain = 0.2, out = sfxG, a = 0.005) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  const g = ctx.createGain(); o.connect(g); g.connect(out); env(g, t, a, gain, dur);
  o.start(t); o.stop(t + a + dur + 0.05); return o;
}
// a cat's meow: glottal saw through two moving formants, "mi-aaa-ow"
export function meow(agent, k = 1) {
  if (!ok()) return;
  const t = ctx.currentTime + 0.01, seed = agent ? agent.d.seed : 1, kit = agent && agent.d.age === 'kitten';
  const base = (kit ? 700 : 430) + (seed % 200) - (agent && agent.d.breed === 'mainecoon' ? 120 : 0);
  const dur = (0.42 + (seed % 7) * 0.04) * (k > 1 ? 1.35 : 1);
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(base * 0.85, t); o.frequency.linearRampToValueAtTime(base * 1.18 * (k > 1 ? 1.15 : 1), t + dur * 0.35); o.frequency.linearRampToValueAtTime(base * 0.72, t + dur);
  const vib = ctx.createOscillator(); vib.frequency.value = 6; const vg = ctx.createGain(); vg.gain.value = base * 0.015; vib.connect(vg); vg.connect(o.frequency);
  const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 6;
  f1.frequency.setValueAtTime(500, t); f1.frequency.linearRampToValueAtTime(950, t + dur * 0.4); f1.frequency.linearRampToValueAtTime(560, t + dur);
  const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 9;
  f2.frequency.setValueAtTime(2300, t); f2.frequency.linearRampToValueAtTime(1450, t + dur * 0.5); f2.frequency.linearRampToValueAtTime(900, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * Math.min(1.3, k), t + 0.06); g.gain.setValueAtTime(0.3 * Math.min(1.3, k), t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const mix = ctx.createGain(); mix.gain.value = 1;
  o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(sfxG);
  o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
}
export function trill(agent) {
  if (!ok()) return;
  const t = ctx.currentTime + 0.01, base = 520 + (agent ? agent.d.seed % 150 : 0);
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(base, t); o.frequency.linearRampToValueAtTime(base * 1.5, t + 0.18);
  const am = ctx.createOscillator(); am.frequency.value = 28; const ag = ctx.createGain(); ag.gain.value = 0.5; am.connect(ag);
  const g = ctx.createGain(); g.gain.value = 0; ag.connect(g.gain);
  const g2 = ctx.createGain(); env(g2, t, 0.02, 0.22, 0.24);
  o.connect(g); g.connect(g2); g2.connect(sfxG); o.start(t); am.start(t); o.stop(t + 0.3); am.stop(t + 0.3);
}
let purrNode = null;
export function purr(on, strength = 1) {
  if (!ok()) return;
  if (on && !purrNode) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 27;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; lp.Q.value = 2;
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 400; const ng = ctx.createGain(); ng.gain.value = 0.25;
    const breath = ctx.createOscillator(); breath.frequency.value = 0.55; const bg = ctx.createGain(); bg.gain.value = 0.25;
    const g = ctx.createGain(); g.gain.value = 0;
    const amp = ctx.createGain(); amp.gain.value = 0.75; breath.connect(bg); bg.connect(amp.gain);
    o.connect(lp); n.connect(nf); nf.connect(ng); ng.connect(lp); lp.connect(amp); amp.connect(g); g.connect(sfxG);
    o.start(t); n.start(t); breath.start(t);
    g.gain.setTargetAtTime(0.5 * strength, t, 0.2);
    purrNode = { o, n, breath, g };
  } else if (!on && purrNode) {
    const p = purrNode; purrNode = null; const t = ctx.currentTime;
    p.g.gain.setTargetAtTime(0, t, 0.15); setTimeout(() => { try { p.o.stop(); p.n.stop(); p.breath.stop(); } catch (e) {} }, 800);
  } else if (on && purrNode) purrNode.g.gain.setTargetAtTime(0.5 * strength, ctx.currentTime, 0.2);
}
export function hiss() { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.7, 4200, 0.8, 0.25, 'highpass'); }
export function crash(kind = 'glass') {
  if (!ok()) return; const t = ctx.currentTime;
  tone(t, 90, 0.18, 'sine', 0.35);
  noise(t, 0.35, kind === 'glass' ? 5000 : 1800, 0.7, 0.35);
  if (kind === 'glass') for (let i = 0; i < 7; i++) tone(t + 0.02 + Math.random() * 0.25, 2600 + Math.random() * 3200, 0.25 + Math.random() * 0.3, 'sine', 0.06);
  else for (let i = 0; i < 4; i++) tone(t + 0.02 + Math.random() * 0.15, 700 + Math.random() * 900, 0.12, 'triangle', 0.08);
}
export function thud() { if (!ok()) return; const t = ctx.currentTime; const o = tone(t, 140, 0.25, 'sine', 0.35); o.frequency.exponentialRampToValueAtTime(45, t + 0.2); noise(t, 0.12, 400, 0.8, 0.15, 'lowpass'); }
export function tap() { if (!ok()) return; const t = ctx.currentTime; tone(t, 880, 0.06, 'sine', 0.12); tone(t, 1320, 0.04, 'triangle', 0.04); }
export function soft() { if (!ok()) return; const t = ctx.currentTime; tone(t, 520, 0.12, 'sine', 0.1); }
export function coin() { if (!ok()) return; const t = ctx.currentTime; tone(t, 1318, 0.18, 'triangle', 0.12); tone(t + 0.08, 1760, 0.3, 'triangle', 0.12); }
export function sparkle() { if (!ok()) return; const t = ctx.currentTime; [1568, 2093, 2637].forEach((f, i) => tone(t + i * 0.05, f, 0.25, 'sine', 0.06)); }
export function shutter() { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.05, 3000, 1, 0.4); noise(t + 0.09, 0.06, 2200, 1, 0.3); tone(t, 180, 0.05, 'square', 0.04); }
export function kibble() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 22; i++) noise(t + i * 0.025 + Math.random() * 0.02, 0.03, 2500 + Math.random() * 2500, 4, 0.12); }
export function tin() { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.25, 3500, 6, 0.15); tone(t + 0.28, 600, 0.08, 'square', 0.06); noise(t + 0.3, 0.1, 900, 2, 0.2); }
export function scoop() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 3; i++) noise(t + i * 0.18, 0.15, 1500, 0.8, 0.12); }
export function snip() { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.03, 6000, 2, 0.3); tone(t, 3000, 0.03, 'square', 0.03); }
export function brush() { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.22, 2600, 0.6, 0.08); }
export function hop() { if (!ok()) return; const t = ctx.currentTime; tone(t + 0.35, 110, 0.06, 'sine', 0.06); }
export function pop() { if (!ok()) return; const t = ctx.currentTime; const o = tone(t, 400, 0.12, 'sine', 0.15); o.frequency.exponentialRampToValueAtTime(900, t + 0.1); }
export function scratchy() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 6; i++) noise(t + i * 0.1, 0.07, 1800 + i * 100, 1.5, 0.1); }
export function chime() { if (!ok()) return; const t = ctx.currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone(t + i * 0.09, f, 0.6, 'triangle', 0.09)); }
export function fanfare() { if (!ok()) return; const t = ctx.currentTime; [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(t + i * 0.1, f, 0.5, 'triangle', 0.1); tone(t + i * 0.1, f * 2, 0.3, 'sine', 0.03); }); }
export function oops() { if (!ok()) return; const t = ctx.currentTime; const o = tone(t, 500, 0.3, 'triangle', 0.1); o.frequency.exponentialRampToValueAtTime(250, t + 0.28); }
export function knock() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 2; i++) { tone(t + i * 0.16, 180, 0.08, 'sine', 0.3); noise(t + i * 0.16, 0.05, 700, 1, 0.15); } }

// a slow, warm tune on a kalimba, different through the day
let music = null;
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
export function musicTick(envIn) {
  if (!ok() || !opts.music) return;
  const t = ctx.currentTime;
  if (!music) music = { next: t + 0.5, bar: 0, step: 0, root: 57 };
  const night = envIn ? envIn.night : 0;
  const beat = 0.62 + night * 0.25;
  while (music.next < t + 0.3) {
    const s = music.step++;
    const chordRoots = [0, 5, -3, 2];
    const root = music.root + chordRoots[Math.floor(s / 8) % 4] - (night > 0.6 ? 2 : 0);
    if (s % 8 === 0) { // soft pad
      for (const iv of [0, 7, 16]) { const f = 440 * Math.pow(2, (root - 12 + iv - 69) / 12); const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, music.next); g.gain.exponentialRampToValueAtTime(0.05, music.next + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, music.next + beat * 8); o.connect(g); g.connect(musG); o.start(music.next); o.stop(music.next + beat * 8 + 0.1); }
    }
    if (Math.random() < (s % 2 ? 0.35 : 0.75)) {
      const n = root + SCALE[Math.floor(Math.random() * (night > 0.6 ? 6 : 9))];
      const f = 440 * Math.pow(2, (n - 69) / 12);
      // kalimba: a sine with a quick bright attack
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 4.02;
      const g = ctx.createGain(); env(g, music.next, 0.004, 0.16, 1.6);
      const g2 = ctx.createGain(); env(g2, music.next, 0.002, 0.04, 0.12);
      o.connect(g); o2.connect(g2); g.connect(musG); g2.connect(musG);
      o.start(music.next); o2.start(music.next); o.stop(music.next + 1.8); o2.stop(music.next + 0.3);
    }
    music.next += beat / 2;
  }
}
