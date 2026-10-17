/* ============================================================
   sound.jsx — procedural chiptune SFX (Web Audio, no asset files)
   Exposes window.SFX with named one-shot sounds + mute control.
   Everything is synthesized live so the build stays self-contained.
   ============================================================ */
const SFX = (() => {
  let ctx = null, master = null;
  let muted = false;
  try { muted = localStorage.getItem('catbakery.muted') === '1'; } catch (e) {}

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.26;            // global headroom
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // a single enveloped oscillator note
  function note(freq, when, dur, opt = {}) {
    const c = ac(); if (!c) return;
    const { type='square', gain=1, attack=0.006, release=0.07, slideTo=null } = opt;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    const peak = Math.max(0.0001, gain);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.setValueAtTime(peak, t0 + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  // short filtered-noise burst (poofs, whooshes, shimmer tails)
  function noise(when, dur, opt = {}) {
    const c = ac(); if (!c) return;
    const { gain=0.5, hp=600, lp=6000 } = opt;
    const t0 = c.currentTime + when;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const hpf = c.createBiquadFilter(); hpf.type='highpass'; hpf.frequency.value=hp;
    const lpf = c.createBiquadFilter(); lpf.type='lowpass';  lpf.frequency.value=lp;
    const g = c.createGain();
    g.gain.setValueAtTime(Math.max(0.0001, gain), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(hpf); hpf.connect(lpf); lpf.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  // play a melody: [freqHz, startBeat, durBeats] @ bpm
  function seq(notes, bpm = 240, opt = {}) {
    const spb = 60 / bpm;
    notes.forEach(([f, s, d]) => note(f, s * spb, d * spb, opt));
  }

  // note table
  const N = { C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.0, A4:440, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880, B5:987.77,
    C6:1046.5, D6:1174.66, E6:1318.51, G6:1567.98, C7:2093 };

  // guard: each sound returns early when muted
  const def = (fn) => (...a) => { if (muted) return; fn(...a); };

  const api = {
    /* neutral UI tick — kept short + quiet so rapid presses never fatigue */
    click:  def(() => note(660, 0, 0.045, { type:'square', gain:0.35, release:0.04 })),
    back:   def(() => note(420, 0, 0.06,  { type:'square', gain:0.32, release:0.05 })),

    /* coin / sale — classic two-step up */
    coin:   def(() => seq([[N.B5,0,1],[N.E6,1,3]], 360, { type:'square', gain:0.45 })),
    sell:   def(() => { seq([[N.B5,0,1],[N.E6,1,3]], 360, { type:'square', gain:0.45 });
                        note(N.E5, 0, 0.06, { type:'triangle', gain:0.2 }); }),

    /* purchase — little cash-register two-blip */
    buy:    def(() => seq([[N.G4,0,1],[N.C5,1,2]], 420, { type:'triangle', gain:0.4 })),

    /* bake lifecycle */
    bakeStart: def(() => { noise(0, 0.22, { gain:0.35, hp:400, lp:3000 });
                           note(N.C4, 0, 0.18, { type:'sine', gain:0.3, slideTo:N.G4 }); }),
    bakeDone:  def(() => seq([[N.C5,0,1],[N.E5,1,1],[N.G5,2,2]], 320, { type:'triangle', gain:0.42 })),

    /* a real legend deserves a shimmer */
    sparkle: def(() => seq([[N.G6,0,1],[N.C7,1,1],[N.E6,2,2]], 600, { type:'sine', gain:0.3 })),

    /* adopt — warm rising arpeggio + a little synth "mrrp" */
    adopt:  def(() => {
      seq([[N.C5,0,1],[N.E5,1,1],[N.G5,2,1],[N.C6,3,3]], 460, { type:'triangle', gain:0.4 });
      note(560, 0.18, 0.28, { type:'sine', gain:0.22, slideTo:880, attack:0.02 });
      note(880, 0.40, 0.18, { type:'sine', gain:0.18, slideTo:660, attack:0.02 });
    }),
    meow:   def(() => { note(540, 0, 0.16, { type:'sine', gain:0.25, slideTo:900 });
                        note(900, 0.14, 0.18, { type:'sine', gain:0.22, slideTo:620 }); }),

    /* quests */
    questAccept: def(() => seq([[N.G4,0,1],[N.C5,1,2]], 320, { type:'square', gain:0.4 })),
    questDone:   def(() => seq([[N.C5,0,1],[N.E5,1,1],[N.G5,2,1],[N.C6,3,2]], 360, { type:'square', gain:0.4 })),

    /* level up / new venue — triumphant fanfare */
    levelUp: def(() => {
      seq([[N.C5,0,1],[N.E5,1,1],[N.G5,2,1],[N.C6,3,1],[N.E6,4,1],[N.G6,5,3]], 300, { type:'square', gain:0.4 });
      seq([[N.C4,4,1],[N.C5,5,3]], 300, { type:'triangle', gain:0.3 });
    }),

    /* grand finale */
    win: def(() => {
      seq([[N.C5,0,2],[N.G5,2,2],[N.E5,4,2],[N.C6,6,2],[N.E6,8,2],[N.G6,10,4]], 260, { type:'square', gain:0.42 });
      seq([[N.C4,0,4],[N.G4,4,4],[N.C5,8,6]], 260, { type:'triangle', gain:0.28 });
    }),

    /* gentle negative — can't afford / blocked */
    denied: def(() => note(180, 0, 0.16, { type:'square', gain:0.3, slideTo:120 })),

    /* page / screen flip */
    page: def(() => noise(0, 0.12, { gain:0.25, hp:1200, lp:7000 })),
  };

  // mute control (toggle sound itself bypasses the mute guard so you hear it unmute)
  api.isMuted    = () => muted;
  api.setMuted   = (v) => { muted = !!v; try { localStorage.setItem('catbakery.muted', muted ? '1' : '0'); } catch (e) {}
                            if (!muted) note(660, 0, 0.05, { type:'square', gain:0.35 }); };
  api.toggleMute = () => { api.setMuted(!muted); return muted; };

  // satisfy autoplay policy: wake/resume the context on the first user gesture
  const wake = () => ac();
  ['pointerdown','keydown','touchstart'].forEach(ev =>
    window.addEventListener(ev, wake, { passive:true }));

  return api;
})();

window.SFX = SFX;
