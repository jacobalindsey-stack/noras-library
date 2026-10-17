// audio.js — WebAudio synth sound engine (no asset files; works offline).
// window.WLAudio.play("name"); window.WLAudio.toggleMute(); window.WLAudio.startAmbient(biome, dayNight)
(function(){
  const KEY = "wilderlore:muted:v1";
  let ctx = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === "1"; } catch(e){}

  // Ambient nodes
  let ambient = null;

  function ensure(){
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(ctx.destination);
    } catch(e){ ctx = null; }
    return ctx;
  }

  // Resume on first user gesture (autoplay policy)
  function unlock(){
    ensure();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }
  ["pointerdown","keydown","touchstart"].forEach(ev =>
    window.addEventListener(ev, unlock, { once:false, passive:true }));

  // ---- low-level voice ----
  function tone({ type="sine", freq=440, to=null, t0=0, dur=0.2, gain=0.2, attack=0.005, release=0.08, detune=0, pan=0 }){
    if (!ensure() || muted) return;
    const now = ctx.currentTime + t0;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (to != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + dur);
    if (detune) osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur + release);
    let node = osc;
    if (pan && ctx.createStereoPanner){
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      osc.connect(g); g.connect(p); p.connect(master);
    } else {
      osc.connect(g); g.connect(master);
    }
    osc.start(now);
    osc.stop(now + dur + release + 0.02);
  }

  function noise({ t0=0, dur=0.2, gain=0.15, type="highpass", freq=1200, q=0.7 }){
    if (!ensure() || muted) return;
    const now = ctx.currentTime + t0;
    const len = Math.floor(ctx.sampleRate * (dur+0.05));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<len;i++) data[i] = (Math.random()*2-1);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = type; filt.frequency.value = freq; filt.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt); filt.connect(g); g.connect(master);
    src.start(now); src.stop(now + dur + 0.05);
  }

  function chord(freqs, opts){
    freqs.forEach((f,i) => tone({ ...opts, freq:f, t0:(opts.t0||0) + i*(opts.spread||0) }));
  }

  // ---- named SFX ----
  const SFX = {
    select(){ tone({ type:"triangle", freq:520, dur:0.05, gain:0.10, release:0.04 }); },
    move(){   tone({ type:"sine", freq:300, to:380, dur:0.07, gain:0.09, release:0.05 }); },
    march(){  // wagon roll: low thunk + step
      tone({ type:"sine", freq:150, to:110, dur:0.12, gain:0.16, release:0.1 });
      noise({ dur:0.12, gain:0.05, type:"lowpass", freq:500 });
    },
    open(){   chord([392,523], { type:"triangle", dur:0.16, gain:0.10, spread:0.04, release:0.12 }); },
    good(){   chord([523,659,784], { type:"triangle", dur:0.22, gain:0.11, spread:0.05, release:0.18 }); },
    bad(){    tone({ type:"sawtooth", freq:196, to:120, dur:0.28, gain:0.12, release:0.18 }); },
    coin(){   chord([784,1047], { type:"square", dur:0.08, gain:0.06, spread:0.05, release:0.06 }); },
    camp(){   chord([330,440], { type:"sine", dur:0.5, gain:0.10, spread:0.08, release:0.4 }); },
    ward(){   // shimmering ward against the hollowing
      tone({ type:"sine", freq:660, to:1320, dur:0.5, gain:0.10, release:0.3 });
      tone({ type:"sine", freq:990, to:1760, dur:0.5, gain:0.06, release:0.3, t0:0.05 });
    },
    daynight(){ tone({ type:"sine", freq:440, to:587, dur:0.4, gain:0.09, release:0.3 }); },
    bondbreak(){ // somber descending
      tone({ type:"sine", freq:330, to:140, dur:0.7, gain:0.16, release:0.4 });
      tone({ type:"triangle", freq:220, to:90, dur:0.8, gain:0.10, release:0.5, t0:0.06 });
    },
    legendary(){ // big mysterious swell
      chord([131,196,262,392], { type:"sawtooth", dur:1.1, gain:0.07, spread:0.10, release:0.7, attack:0.2 });
      tone({ type:"sine", freq:65, to:98, dur:1.3, gain:0.12, release:0.8 });
    },
    hit(){    tone({ type:"square", freq:330, to:180, dur:0.1, gain:0.13, release:0.06 }); noise({dur:0.08,gain:0.08,freq:2000}); },
    miss(){   tone({ type:"sawtooth", freq:160, to:90, dur:0.18, gain:0.10, release:0.12 }); },
    victory(){ chord([523,659,784,1047], { type:"triangle", dur:0.6, gain:0.10, spread:0.08, release:0.4 }); },
    hollowwarn(){ // unsettling low pulse
      tone({ type:"sine", freq:90, to:60, dur:0.9, gain:0.14, release:0.5 });
      tone({ type:"sawtooth", freq:138, to:131, dur:0.9, gain:0.05, release:0.5 });
    },
    arrive(){ chord([392,523,659,784,1047], { type:"triangle", dur:0.9, gain:0.10, spread:0.10, release:0.6 }); },
    title(){  chord([262,392,523], { type:"sine", dur:1.0, gain:0.08, spread:0.12, release:0.7, attack:0.2 }); },
  };

  function play(name){
    const fn = SFX[name];
    if (fn){ unlock(); try { fn(); } catch(e){} }
  }

  // ---- ambient pad: two slow detuned oscillators per day/night, biome-tinted ----
  function startAmbient(biome, dayNight){
    if (!ensure()) return;
    stopAmbient();
    if (muted) return;
    const base = {
      woods: 110, sea: 98, desert: 123, tundra: 130, jungle: 104, mountains: 87,
    }[biome] || 110;
    const root = dayNight === "night" ? base * 0.75 : base;
    const a = ctx.createOscillator(), b = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.value = dayNight === "night" ? 600 : 900;
    a.type = "sine"; b.type = "sine";
    a.frequency.value = root; b.frequency.value = root * 1.5; b.detune.value = 6;
    g.gain.value = 0.0001;
    a.connect(lp); b.connect(lp); lp.connect(g); g.connect(master);
    a.start(); b.start();
    g.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 2.5);
    // gentle LFO on filter
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.06; lfoG.gain.value = dayNight === "night" ? 120 : 200;
    lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
    ambient = { a, b, lfo, g };
  }
  function stopAmbient(){
    if (!ambient) return;
    const { a, b, lfo, g } = ambient;
    try {
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      a.stop(ctx.currentTime + 0.9); b.stop(ctx.currentTime + 0.9); lfo.stop(ctx.currentTime + 0.9);
    } catch(e){}
    ambient = null;
  }

  function setMuted(m){
    muted = m;
    try { localStorage.setItem(KEY, m ? "1" : "0"); } catch(e){}
    if (master) master.gain.value = m ? 0 : 0.9;
    if (m) stopAmbient();
  }
  function toggleMute(){ setMuted(!muted); return muted; }
  function isMuted(){ return muted; }

  window.WLAudio = { play, startAmbient, stopAmbient, setMuted, toggleMute, isMuted, unlock };
})();
