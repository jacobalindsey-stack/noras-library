(function() {
if (window.AudioEngine) return;

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.baseVolume = 0.7;
    this._targetVolume = 0.7;   // what the level should return to after a dip
    this.underwaterFilter = null;
    this.reverbNode = null;
    this.reverbDry = null;
    this.reverbWet = null;
    this.isUnderwater = false;
    this.activeVoices = {};
    this.ambientNodes = {};
    this.sampleCache = {};
    this.initialized = false;
    this.stillnessGain = null; // for stillness audio feedback
  }

  async init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.baseVolume = this.baseVolume != null ? this.baseVolume : 0.7;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.baseVolume;

    // Convolution reverb (synthetic impulse response)
    this.reverbNode = this._createReverb(3.5, 2.5);
    this.reverbDry = this.ctx.createGain();
    this.reverbDry.gain.value = 0.85;
    this.reverbWet = this.ctx.createGain();
    this.reverbWet.gain.value = 0.15;

    // Underwater low-pass — THE most important audio effect
    this.underwaterFilter = this.ctx.createBiquadFilter();
    this.underwaterFilter.type = 'lowpass';
    this.underwaterFilter.frequency.value = 20000;
    this.underwaterFilter.Q.value = 0.7;

    // Stillness resonance gain (crossfades in as player waits)
    this.stillnessGain = this.ctx.createGain();
    this.stillnessGain.gain.value = 0;
    this.stillnessGain.connect(this.master);

    // Routing: master → dry → filter → dest
    //                   → wet → reverb → filter → dest
    this.master.connect(this.reverbDry);
    this.master.connect(this.reverbWet);
    this.reverbWet.connect(this.reverbNode);
    this.reverbDry.connect(this.underwaterFilter);
    this.reverbNode.connect(this.underwaterFilter);
    this.underwaterFilter.connect(this.ctx.destination);

    this.initialized = true;
  }

  async resume() {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  // --- Synthetic reverb impulse response ---
  _createReverb(duration, decay) {
    const rate = this.ctx.sampleRate;
    const len = rate * duration;
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    const conv = this.ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  // --- Underwater filter sweep ---
  setUnderwater(on, duration = 0.8) {
    if (!this.ctx) return;
    this.isUnderwater = on;
    const now = this.ctx.currentTime;
    this.underwaterFilter.frequency.cancelScheduledValues(now);
    this.underwaterFilter.frequency.setValueAtTime(this.underwaterFilter.frequency.value, now);
    this.underwaterFilter.frequency.linearRampToValueAtTime(on ? 300 : 20000, now + duration);
    // Increase reverb when underwater
    this.reverbWet.gain.cancelScheduledValues(now);
    this.reverbWet.gain.setValueAtTime(this.reverbWet.gain.value, now);
    this.reverbWet.gain.linearRampToValueAtTime(on ? 0.45 : 0.15, now + duration);
  }

  // --- Scene transition audio dip ---
  transitionDip(duration = 0.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.05, now + duration * 0.4);
    this.master.gain.linearRampToValueAtTime(this._targetVolume ?? this.baseVolume, now + duration);
  }

  // ========================================================
  // SAMPLE LOADING SYSTEM
  // ========================================================
  // Load audio file → AudioBuffer, cached by URL
  async loadSample(url) {
    if (this.sampleCache[url]) return this.sampleCache[url];
    try {
      const resp = await fetch(url);
      const arrayBuf = await resp.arrayBuffer();
      const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
      this.sampleCache[url] = audioBuf;
      return audioBuf;
    } catch (e) {
      console.warn('AudioEngine: failed to load sample', url, e);
      return null;
    }
  }

  // Play a loaded sample with gain envelope, returns control object
  playSample(buffer, { loop = false, volume = 0.5, fadeIn = 0.5, dest } = {}) {
    if (!buffer || !this.ctx) return null;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(dest || this.master);
    source.start();
    const now = this.ctx.currentTime;
    gain.gain.linearRampToValueAtTime(volume, now + fadeIn);
    return {
      source, gain,
      fadeOut: (dur = 2) => {
        const t = this.ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + dur);
      },
      stop: () => { try { source.stop(); } catch(e) {} }
    };
  }

  // ========================================================
  // FOUR VOICES — rich layered synthesis
  // ========================================================
  voiceDefs = {
    // FOREST BASS — Silvanus's pipe. Deep, warm, enormous.
    // Fundamental E2 (82Hz) + subharmonic + 5th + octave, all with slow drift
    forest: {
      build: (ctx, dest) => {
        const now = ctx.currentTime;
        const nodes = [];
        const mixer = ctx.createGain();
        mixer.gain.value = 0;

        // Sub-bass fundamental
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = 41; // E1 — felt more than heard
        const subG = ctx.createGain();
        subG.gain.value = 0.18;
        sub.connect(subG); subG.connect(mixer);

        // Main fundamental with slow drift
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 82;
        const drift1 = ctx.createOscillator();
        drift1.type = 'sine';
        drift1.frequency.value = 0.15;
        const driftG1 = ctx.createGain();
        driftG1.gain.value = 1.5;
        drift1.connect(driftG1); driftG1.connect(osc1.frequency);
        const osc1G = ctx.createGain();
        osc1G.gain.value = 0.3;
        osc1.connect(osc1G); osc1G.connect(mixer);

        // Detuned unison (warmth)
        const osc1b = ctx.createOscillator();
        osc1b.type = 'sine';
        osc1b.frequency.value = 82.4;
        const osc1bG = ctx.createGain();
        osc1bG.gain.value = 0.2;
        osc1b.connect(osc1bG); osc1bG.connect(mixer);

        // Fifth (B2)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 123;
        const drift2 = ctx.createOscillator();
        drift2.type = 'sine';
        drift2.frequency.value = 0.08;
        const driftG2 = ctx.createGain();
        driftG2.gain.value = 0.8;
        drift2.connect(driftG2); driftG2.connect(osc2.frequency);
        const osc2G = ctx.createGain();
        osc2G.gain.value = 0.12;
        osc2.connect(osc2G); osc2G.connect(mixer);

        // Breath noise — very subtle filtered noise for texture
        const breathBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
        const bData = breathBuf.getChannelData(0);
        for (let i = 0; i < bData.length; i++) bData[i] = Math.random() * 2 - 1;
        const breath = ctx.createBufferSource();
        breath.buffer = breathBuf;
        breath.loop = true;
        const breathLP = ctx.createBiquadFilter();
        breathLP.type = 'lowpass';
        breathLP.frequency.value = 120;
        const breathG = ctx.createGain();
        breathG.gain.value = 0.04;
        breath.connect(breathLP); breathLP.connect(breathG); breathG.connect(mixer);

        // Low-pass the whole voice
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 250;
        lp.Q.value = 0.5;
        mixer.connect(lp);
        lp.connect(dest);

        [sub, osc1, osc1b, osc2, drift1, drift2, breath].forEach(n => n.start());
        nodes.push(sub, osc1, osc1b, osc2, drift1, drift2, breath);

        return {
          nodes, gain: mixer,
          fadeIn: (dur = 6) => {
            mixer.gain.setValueAtTime(0, now);
            mixer.gain.linearRampToValueAtTime(1, now + dur);
          },
          fadeOut: (dur = 4) => {
            const t = ctx.currentTime;
            mixer.gain.setValueAtTime(mixer.gain.value, t);
            mixer.gain.linearRampToValueAtTime(0, t + dur);
          },
          stop: () => nodes.forEach(n => { try { n.stop(); } catch(e) {} })
        };
      }
    },

    // RIVER ALTO — The held note that refuses to come down.
    // Sits in A3 (220Hz), triangle+sine layers, long reverb tail, canyon echo
    river: {
      build: (ctx, dest) => {
        const now = ctx.currentTime;
        const nodes = [];
        const mixer = ctx.createGain();
        mixer.gain.value = 0;

        // Core triangle — the held note
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.value = 220;
        const drift = ctx.createOscillator();
        drift.type = 'sine';
        drift.frequency.value = 0.1;
        const driftG = ctx.createGain();
        driftG.gain.value = 1.2;
        drift.connect(driftG); driftG.connect(osc1.frequency);
        const osc1G = ctx.createGain();
        osc1G.gain.value = 0.25;
        osc1.connect(osc1G); osc1G.connect(mixer);

        // Sine octave below for body
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 110;
        const osc2G = ctx.createGain();
        osc2G.gain.value = 0.12;
        osc2.connect(osc2G); osc2G.connect(mixer);

        // Detuned shimmer
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = 221.2;
        const osc3G = ctx.createGain();
        osc3G.gain.value = 0.08;
        osc3.connect(osc3G); osc3G.connect(mixer);

        // Fifth above (E4) — very quiet, for width
        const osc4 = ctx.createOscillator();
        osc4.type = 'sine';
        osc4.frequency.value = 330;
        const osc4G = ctx.createGain();
        osc4G.gain.value = 0.04;
        osc4.connect(osc4G); osc4G.connect(mixer);

        // Slow amplitude breathing, on its own stage. Modulating mixer.gain
        // directly meant the envelope could never reach true zero.
        const body = ctx.createGain();
        body.gain.value = 1;
        const tremolo = ctx.createOscillator();
        tremolo.type = 'sine';
        tremolo.frequency.value = 0.06;
        const tremG = ctx.createGain();
        tremG.gain.value = 0.08;
        tremolo.connect(tremG); tremG.connect(body.gain);

        mixer.connect(body);
        body.connect(dest);
        [osc1, osc2, osc3, osc4, drift, tremolo].forEach(n => n.start());
        nodes.push(osc1, osc2, osc3, osc4, drift, tremolo);

        return {
          nodes, gain: mixer,
          fadeIn: (dur = 4) => {
            mixer.gain.setValueAtTime(0, now);
            mixer.gain.linearRampToValueAtTime(1, now + dur);
          },
          fadeOut: (dur = 8) => {
            const t = ctx.currentTime;
            mixer.gain.setValueAtTime(mixer.gain.value, t);
            mixer.gain.linearRampToValueAtTime(0, t + dur);
          },
          stop: () => nodes.forEach(n => { try { n.stop(); } catch(e) {} })
        };
      }
    },

    // STONE SOPRANO — The bell that will not stop.
    // FM synthesis: bell strike at E5 (659Hz), long metallic decay, harmonics
    stone: {
      build: (ctx, dest) => {
        const now = ctx.currentTime;
        const nodes = [];
        const mixer = ctx.createGain();
        mixer.gain.value = 0;

        // FM bell — carrier at 659, modulator at 659*1.4 (inharmonic = bell)
        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.value = 659;
        const mod = ctx.createOscillator();
        mod.type = 'sine';
        mod.frequency.value = 659 * 1.4;
        const modG = ctx.createGain();
        modG.gain.value = 400;
        mod.connect(modG); modG.connect(carrier.frequency);
        const carrierG = ctx.createGain();
        carrierG.gain.value = 0.15;
        carrier.connect(carrierG); carrierG.connect(mixer);

        // Second partial — slightly flat octave (bell character)
        const p2 = ctx.createOscillator();
        p2.type = 'sine';
        p2.frequency.value = 659 * 2.02;
        const p2G = ctx.createGain();
        p2G.gain.value = 0.06;
        p2.connect(p2G); p2G.connect(mixer);

        // Sub-tone for warmth
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = 329.5;
        const subG = ctx.createGain();
        subG.gain.value = 0.08;
        sub.connect(subG); subG.connect(mixer);

        // Slow modulation index decay (bell fading to pure tone)
        modG.gain.setValueAtTime(400, now);
        modG.gain.exponentialRampToValueAtTime(8, now + 15);

        // High shimmer partial
        const shimmer = ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.value = 659 * 3.01;
        const shimG = ctx.createGain();
        shimG.gain.value = 0.02;
        shimmer.connect(shimG); shimG.connect(mixer);

        mixer.connect(dest);
        [carrier, mod, p2, sub, shimmer].forEach(n => n.start());
        nodes.push(carrier, mod, p2, sub, shimmer);

        return {
          nodes, gain: mixer,
          fadeIn: (dur = 0.01) => {
            mixer.gain.setValueAtTime(0, now);
            mixer.gain.linearRampToValueAtTime(1, now + dur);
          },
          fadeOut: (dur = 12) => {
            const t = ctx.currentTime;
            mixer.gain.setValueAtTime(mixer.gain.value, t);
            mixer.gain.exponentialRampToValueAtTime(0.001, t + dur);
          },
          stop: () => nodes.forEach(n => { try { n.stop(); } catch(e) {} })
        };
      }
    },

    // SEA MEZZO — Wind through Korčula's streets becoming voice.
    // Bandpassed noise → crossfade to sine at A4 (440Hz), with breath modulation
    sea: {
      build: (ctx, dest) => {
        const now = ctx.currentTime;
        const nodes = [];
        const mixer = ctx.createGain();
        mixer.gain.value = 0;

        // Wind noise layer
        const bufSize = ctx.sampleRate * 3;
        const buf = ctx.createBuffer(2, bufSize, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const data = buf.getChannelData(ch);
          for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        noise.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 440;
        bp.Q.value = 15;
        noise.connect(bp);
        // Slow Q sweep — wind narrowing to pitch
        bp.Q.setValueAtTime(5, now);
        bp.Q.linearRampToValueAtTime(40, now + 8);
        const noiseG = ctx.createGain();
        noiseG.gain.value = 0.2;
        bp.connect(noiseG); noiseG.connect(mixer);

        // Pure tone emerges
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 440;
        const oscDrift = ctx.createOscillator();
        oscDrift.type = 'sine';
        oscDrift.frequency.value = 0.07;
        const oscDriftG = ctx.createGain();
        oscDriftG.gain.value = 1.5;
        oscDrift.connect(oscDriftG); oscDriftG.connect(osc.frequency);
        const oscG = ctx.createGain();
        oscG.gain.value = 0;
        osc.connect(oscG); oscG.connect(mixer);

        // Crossfade: noise down, sine up over 6 seconds
        noiseG.gain.setValueAtTime(0.2, now);
        noiseG.gain.linearRampToValueAtTime(0.04, now + 8);
        oscG.gain.setValueAtTime(0, now);
        oscG.gain.linearRampToValueAtTime(0.2, now + 8);

        // Third above for width (C#5)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 554;
        const osc2G = ctx.createGain();
        osc2G.gain.value = 0.03;
        osc2.connect(osc2G); osc2G.connect(mixer);

        // Breath modulation on its own stage, for the same reason as river:
        // an LFO on mixer.gain prevents the envelope ever reaching silence.
        const body = ctx.createGain();
        body.gain.value = 1;
        const breath = ctx.createOscillator();
        breath.type = 'sine';
        breath.frequency.value = 0.12;
        const breathG = ctx.createGain();
        breathG.gain.value = 0.06;
        breath.connect(breathG); breathG.connect(body.gain);

        mixer.connect(body);
        body.connect(dest);
        [noise, osc, osc2, oscDrift, breath].forEach(n => n.start());
        nodes.push(noise, osc, osc2, oscDrift, breath);

        return {
          nodes, gain: mixer,
          fadeIn: (dur = 6) => {
            mixer.gain.setValueAtTime(0, now);
            mixer.gain.linearRampToValueAtTime(1, now + dur);
          },
          fadeOut: (dur = 4) => {
            const t = ctx.currentTime;
            mixer.gain.setValueAtTime(mixer.gain.value, t);
            mixer.gain.linearRampToValueAtTime(0, t + dur);
          },
          stop: () => nodes.forEach(n => { try { n.stop(); } catch(e) {} })
        };
      }
    }
  };

  // ========================================================
  // AMBIENT BEDS — richer, layered environmental sound
  // ========================================================
  _ambientBuilders = {
    // Waves: layered filtered noise with slow rhythmic volume modulation
    waves: (vol) => {
      const ctx = this.ctx;
      const mixer = ctx.createGain();
      mixer.gain.value = 0;
      const nodes = [];

      // Deep surge
      const surge = this._noiseBed(30, 200, 0.6);
      const surgeLFO = ctx.createOscillator();
      surgeLFO.type = 'sine';
      surgeLFO.frequency.value = 0.08; // ~12 second wave cycle
      const surgeAmp = ctx.createGain();
      surgeAmp.gain.value = 0.3;
      surgeLFO.connect(surgeAmp);
      surgeAmp.connect(surge.gain.gain);
      surge.gain.connect(mixer);
      surgeLFO.start();
      nodes.push(surge.source, surgeLFO);

      // Mid wash
      const wash = this._noiseBed(150, 600, 0.3);
      const washLFO = ctx.createOscillator();
      washLFO.type = 'sine';
      washLFO.frequency.value = 0.12;
      const washAmp = ctx.createGain();
      washAmp.gain.value = 0.15;
      washLFO.connect(washAmp);
      washAmp.connect(wash.gain.gain);
      wash.gain.connect(mixer);
      washLFO.start();
      nodes.push(wash.source, washLFO);

      // High foam / fizz
      const foam = this._noiseBed(2000, 6000, 0.08);
      const foamLFO = ctx.createOscillator();
      foamLFO.type = 'sine';
      foamLFO.frequency.value = 0.15;
      const foamAmp = ctx.createGain();
      foamAmp.gain.value = 0.04;
      foamLFO.connect(foamAmp);
      foamAmp.connect(foam.gain.gain);
      foam.gain.connect(mixer);
      foamLFO.start();
      nodes.push(foam.source, foamLFO);

      mixer.connect(this.master);
      return { gain: mixer, nodes, stop: () => nodes.forEach(n => { try { n.stop(); } catch(e) {} }) };
    },

    // Wind: slow-swept bandpass with gusts
    wind: (vol) => {
      const ctx = this.ctx;
      const mixer = ctx.createGain();
      mixer.gain.value = 0;
      const nodes = [];

      // Base wind
      const base = this._noiseBed(100, 1200, 0.4);
      base.gain.connect(mixer);
      nodes.push(base.source);

      // Gusts — bandpass with sweeping frequency
      const gustBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const gd = gustBuf.getChannelData(0);
      for (let i = 0; i < gd.length; i++) gd[i] = Math.random() * 2 - 1;
      const gust = ctx.createBufferSource();
      gust.buffer = gustBuf; gust.loop = true;
      const gustBP = ctx.createBiquadFilter();
      gustBP.type = 'bandpass';
      gustBP.frequency.value = 800;
      gustBP.Q.value = 2;
      // Sweep the center frequency
      const sweep = ctx.createOscillator();
      sweep.type = 'sine';
      sweep.frequency.value = 0.05;
      const sweepG = ctx.createGain();
      sweepG.gain.value = 400;
      sweep.connect(sweepG); sweepG.connect(gustBP.frequency);
      gust.connect(gustBP);
      const gustG = ctx.createGain();
      gustG.gain.value = 0.15;
      gustBP.connect(gustG); gustG.connect(mixer);
      gust.start(); sweep.start();
      nodes.push(gust, sweep);

      mixer.connect(this.master);
      return { gain: mixer, nodes, stop: () => nodes.forEach(n => { try { n.stop(); } catch(e) {} }) };
    },

    // River: loud roar — white noise filtered, rhythmic pulses
    river: (vol) => {
      const ctx = this.ctx;
      const mixer = ctx.createGain();
      mixer.gain.value = 0;
      const nodes = [];

      // Heavy low roar
      const roar = this._noiseBed(60, 500, 0.7);
      roar.gain.connect(mixer);
      nodes.push(roar.source);

      // Mid turbulence
      const turb = this._noiseBed(300, 2000, 0.3);
      const turbLFO = ctx.createOscillator();
      turbLFO.type = 'sine';
      turbLFO.frequency.value = 0.3;
      const turbAmp = ctx.createGain();
      turbAmp.gain.value = 0.12;
      turbLFO.connect(turbAmp);
      turbAmp.connect(turb.gain.gain);
      turb.gain.connect(mixer);
      turbLFO.start();
      nodes.push(turb.source, turbLFO);

      // High splash
      const splash = this._noiseBed(3000, 8000, 0.06);
      splash.gain.connect(mixer);
      nodes.push(splash.source);

      mixer.connect(this.master);
      return { gain: mixer, nodes, stop: () => nodes.forEach(n => { try { n.stop(); } catch(e) {} }) };
    },

    // Cave: drips (pitched impulses on a timer) + deep resonance
    cave: (vol) => {
      const ctx = this.ctx;
      const mixer = ctx.createGain();
      mixer.gain.value = 0;
      const nodes = [];

      // Deep cave resonance — very low filtered noise
      const res = this._noiseBed(30, 100, 0.15);
      res.gain.connect(mixer);
      nodes.push(res.source);

      // Drip system — three drips at different intervals
      const dripIntervals = [3.2, 5.7, 8.9]; // seconds
      const dripFreqs = [2800, 3400, 2200]; // resonant frequencies
      const dripTimers = [];
      dripIntervals.forEach((interval, i) => {
        const makeDrip = () => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = dripFreqs[i] + (Math.random() * 100 - 50);
          const env = ctx.createGain();
          env.gain.value = 0;
          osc.connect(env);
          // Resonant filter for "plop" quality
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = dripFreqs[i];
          bp.Q.value = 20;
          env.connect(bp);
          const dripG = ctx.createGain();
          dripG.gain.value = 0.06 + Math.random() * 0.03;
          bp.connect(dripG);
          dripG.connect(mixer);
          osc.start();
          const t = ctx.currentTime;
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(1, t + 0.003);
          env.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
          setTimeout(() => { try { osc.stop(); } catch(e) {} }, 1200);
        };
        // Stagger start, then repeat
        const jitter = () => interval * 1000 + (Math.random() * 1500 - 750);
        const loop = () => {
          makeDrip();
          const timer = setTimeout(loop, jitter());
          dripTimers.push(timer);
        };
        const initTimer = setTimeout(loop, i * 1100 + Math.random() * 2000);
        dripTimers.push(initTimer);
      });

      mixer.connect(this.master);
      return {
        gain: mixer, nodes,
        stop: () => {
          nodes.forEach(n => { try { n.stop(); } catch(e) {} });
          dripTimers.forEach(t => clearTimeout(t));
        }
      };
    },

    // Workshop: rhythmic impacts + compressor hum
    workshop: (vol) => {
      const ctx = this.ctx;
      const mixer = ctx.createGain();
      mixer.gain.value = 0;
      const nodes = [];

      // Compressor hum
      const hum = ctx.createOscillator();
      hum.type = 'sawtooth';
      hum.frequency.value = 60;
      const humLP = ctx.createBiquadFilter();
      humLP.type = 'lowpass';
      humLP.frequency.value = 120;
      const humG = ctx.createGain();
      humG.gain.value = 0.08;
      hum.connect(humLP); humLP.connect(humG); humG.connect(mixer);
      hum.start();
      nodes.push(hum);

      // Chisel impacts — noise bursts at varied intervals
      const impactTimers = [];
      const makeImpact = () => {
        const impBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const id = impBuf.getChannelData(0);
        for (let i = 0; i < id.length; i++) id[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / id.length, 3);
        const imp = ctx.createBufferSource();
        imp.buffer = impBuf;
        const impBP = ctx.createBiquadFilter();
        impBP.type = 'bandpass';
        impBP.frequency.value = 1500 + Math.random() * 2000;
        impBP.Q.value = 5;
        const impG = ctx.createGain();
        impG.gain.value = 0.04 + Math.random() * 0.04;
        imp.connect(impBP); impBP.connect(impG); impG.connect(mixer);
        imp.start();
      };
      // Two "workers" at different rates
      [0.4, 0.55].forEach(rate => {
        const loop = () => {
          makeImpact();
          const timer = setTimeout(loop, rate * 1000 + Math.random() * 200);
          impactTimers.push(timer);
        };
        const init = setTimeout(loop, Math.random() * 1000);
        impactTimers.push(init);
      });

      // Stone dust — very high filtered noise
      const dust = this._noiseBed(4000, 10000, 0.03);
      dust.gain.connect(mixer);
      nodes.push(dust.source);

      mixer.connect(this.master);
      return {
        gain: mixer, nodes,
        stop: () => {
          nodes.forEach(n => { try { n.stop(); } catch(e) {} });
          impactTimers.forEach(t => clearTimeout(t));
        }
      };
    },

    // Title theme. Not a drone and not a song with a beat: a slow melody in the
    // same pitch world the four voices resolve into (A major pentatonic, the
    // Aadd9 they form when they finally sing together), so the title screen is
    // already quietly promising the ending. Bell-struck, widely spaced, with
    // real rests — the silence between phrases is part of the tune.
    theme: (vol) => {
      const ctx = this.ctx;
      const mixer = ctx.createGain();
      mixer.gain.value = 0;
      const nodes = [];
      const timers = [];

      // A soft sea underneath, much quieter than the beach itself.
      const wash = this._noiseBed(120, 900, 0.16);
      const washLFO = ctx.createOscillator();
      washLFO.type = 'sine';
      washLFO.frequency.value = 0.07;
      const washAmp = ctx.createGain();
      washAmp.gain.value = 0.09;
      washLFO.connect(washAmp); washAmp.connect(wash.gain.gain);
      wash.gain.connect(mixer);
      washLFO.start();
      nodes.push(wash.source, washLFO);

      // Sustained open fifth (A2–E3) so the melody always has a floor.
      [110, 164.8].forEach((f, i) => {
        const d = ctx.createOscillator();
        d.type = 'sine';
        d.frequency.value = f;
        const dg = ctx.createGain();
        dg.gain.value = i ? 0.035 : 0.05;
        d.connect(dg); dg.connect(mixer);
        d.start();
        nodes.push(d);
      });

      // One struck note: FM bell with a long, soft decay.
      const strike = (freq, vel = 1) => {
        const t = ctx.currentTime;
        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.value = freq;
        const mod = ctx.createOscillator();
        mod.type = 'sine';
        mod.frequency.value = freq * 1.41;   // inharmonic: bell, not organ
        const modG = ctx.createGain();
        modG.gain.value = freq * 0.9;
        modG.gain.setValueAtTime(freq * 0.9, t);
        modG.gain.exponentialRampToValueAtTime(1, t + 2.2);
        mod.connect(modG); modG.connect(carrier.frequency);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.14 * vel, t + 0.04);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
        carrier.connect(env); env.connect(mixer);
        carrier.start(t); mod.start(t);
        carrier.stop(t + 5); mod.stop(t + 5);
      };

      // A major pentatonic. Two phrases: the second answers the first lower,
      // the way a second voice would.
      const A3 = 220, B3 = 246.9, Cs4 = 277.2, E4 = 329.6, Fs4 = 370, A4 = 440, Cs5 = 554.4, E5 = 659.3;
      const phraseA = [[E4,1],[Fs4,0.8],[A4,1],[null,0.6],[Cs5,0.95],[B3*2,0.7],[A4,0.85],[null,1.1],[E5,0.75],[Cs5,0.6],[A4,0.9]];
      const phraseB = [[A3,0.9],[Cs4,0.7],[E4,0.95],[null,0.7],[Fs4,0.8],[E4,0.6],[Cs4,0.85],[null,1.3],[A3,0.7]];

      let phrase = 0;
      const playPhrase = () => {
        const notes = phrase % 2 === 0 ? phraseA : phraseB;
        let at = 0;
        notes.forEach(([f, vel]) => {
          if (f) {
            const t = timers.length;
            timers.push(setTimeout(() => strike(f, vel), at));
          }
          // Unhurried, slightly uneven — played, not sequenced.
          at += 1250 + Math.random() * 500;
        });
        phrase++;
        // Let it breathe before answering.
        timers.push(setTimeout(playPhrase, at + 5200 + Math.random() * 2600));
      };
      timers.push(setTimeout(playPhrase, 1200));

      mixer.connect(this.master);
      return {
        gain: mixer, nodes,
        stop: () => {
          nodes.forEach(n => { try { n.stop(); } catch (e) {} });
          timers.forEach(t => clearTimeout(t));
        }
      };
    },

    // Silence: the settled silence of a room. Barely-there room tone
    silence: (vol) => {
      const ctx = this.ctx;
      const mixer = ctx.createGain();
      mixer.gain.value = 0;
      const nodes = [];
      const roomTone = this._noiseBed(40, 150, 0.02);
      roomTone.gain.connect(mixer);
      nodes.push(roomTone.source);
      mixer.connect(this.master);
      return { gain: mixer, nodes, stop: () => nodes.forEach(n => { try { n.stop(); } catch(e) {} }) };
    }
  };

  // Helper: create a bandpassed noise source
  _noiseBed(lowFreq, highFreq, volume) {
    const ctx = this.ctx;
    const bufSize = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = lowFreq;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = highFreq;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(hp); hp.connect(lp); lp.connect(gain);
    source.start();
    return { source, gain };
  }

  // ========================================================
  // STILLNESS AUDIO FEEDBACK
  // ========================================================
  // Call with progress 0-1 as the stillness timer advances
  setStillnessLevel(progress) {
    if (!this.ctx || !this.stillnessGain) return;
    const now = this.ctx.currentTime;
    // Fade in a subtle resonance as player waits
    this.stillnessGain.gain.cancelScheduledValues(now);
    this.stillnessGain.gain.setValueAtTime(this.stillnessGain.gain.value, now);
    this.stillnessGain.gain.linearRampToValueAtTime(progress * 0.15, now + 1);

    // Start/stop the stillness resonance
    if (progress > 0.1 && !this._stillnessOsc) {
      this._startStillnessResonance();
    } else if (progress <= 0 && this._stillnessOsc) {
      this._stopStillnessResonance();
    }
  }

  _startStillnessResonance() {
    if (this._stillnessOsc) return;
    const ctx = this.ctx;
    // A very quiet, slowly rising tone — the world leaning in
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 110;
    // Slow upward drift
    const drift = ctx.createOscillator();
    drift.type = 'sine';
    drift.frequency.value = 0.02;
    const dG = ctx.createGain();
    dG.gain.value = 3;
    drift.connect(dG); dG.connect(osc.frequency);
    // Detuned partner
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 110.8;
    const o2G = ctx.createGain();
    o2G.gain.value = 0.4;
    osc2.connect(o2G);
    const mix = ctx.createGain();
    mix.gain.value = 0.7;
    osc.connect(mix);
    o2G.connect(mix);
    mix.connect(this.stillnessGain);
    [osc, osc2, drift].forEach(n => n.start());
    this._stillnessOsc = { nodes: [osc, osc2, drift], gain: mix };
  }

  _stopStillnessResonance() {
    if (!this._stillnessOsc) return;
    this._stillnessOsc.nodes.forEach(n => { try { n.stop(); } catch(e) {} });
    this._stillnessOsc = null;
    if (this.stillnessGain) {
      const now = this.ctx.currentTime;
      this.stillnessGain.gain.cancelScheduledValues(now);
      this.stillnessGain.gain.setValueAtTime(this.stillnessGain.gain.value, now);
      this.stillnessGain.gain.linearRampToValueAtTime(0, now + 2);
    }
  }

  // ========================================================
  // PLAY / STOP
  // ========================================================
  playVoice(voiceName, fadeInDur) {
    if (!this.ctx || !this.voiceDefs[voiceName]) return;
    this.stopVoice(voiceName);
    const voice = this.voiceDefs[voiceName].build(this.ctx, this.master);
    voice.fadeIn(fadeInDur);
    this.activeVoices[voiceName] = voice;
  }

  stopVoice(voiceName, fadeOutDur) {
    const voice = this.activeVoices[voiceName];
    if (!voice) return;
    voice.fadeOut(fadeOutDur);
    const dur = fadeOutDur || 3;
    setTimeout(() => {
      voice.stop();
      // Belt and braces: cut the voice out of the graph entirely so nothing
      // still being modulated can keep sounding after it has been stopped.
      try { voice.gain.disconnect(); } catch (e) {}
      // Only retire the key if it still points at the voice we just faded.
      if (this.activeVoices[voiceName] === voice) delete this.activeVoices[voiceName];
    }, dur * 1000 + 200);
  }

  // Pull everything down without stopping it — for reading sequences,
  // where the scene should still be there underneath.
  duckTo(level = 0.25, dur = 2) {
    if (!this.ctx || !this.master) return;
    this._targetVolume = Math.max(0.0001, level);
    const now = this.ctx.currentTime;
    const g = this.master.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(Math.max(0.0001, level), now + dur);
  }

  unduck(dur = 3) {
    this.duckTo(this.baseVolume, dur);
  }

  stopAllVoices(fadeOutDur = 2) {
    Object.keys(this.activeVoices).forEach(k => this.stopVoice(k, fadeOutDur));
  }

  // The coast is not haunted by the four — the coast IS them. Marjan is what
  // Silvanus sounds like; the canyon is what the river nymph sounds like. So a
  // scene's bed is not decoration laid over a place, it is that place's voice
  // with its recognisable part filtered off: the fundamental is really there,
  // buried under the surface texture, which is why going quiet in the right
  // place feels like the bed RESOLVING rather than a new sound starting.
  //
  // Silvanus sits under everything at a whisper, because he is the ground the
  // other three stand on.
  _presenceFreqs = {
    forest: [41, 82, 123],
    river: [110, 220, 330],
    stone: [329.5, 659],
    sea: [220, 440],
  };

  _buildPresence(voice, vol) {
    const ctx = this.ctx;
    const freqs = this._presenceFreqs[voice];
    if (!freqs) return null;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    // Cut the identifying top off. She can feel it; she cannot name it until
    // she is quiet enough for the voice proper to come in over the top.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = voice === 'forest' ? 210 : 430;
    lp.Q.value = 0.4;
    const oscs = [];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      // Only the fundamental carries; the harmonics are almost subliminal.
      g.gain.value = (i === 0 ? 0.95 : 0.30 / i) * vol;
      // Slow drift, so it never sounds like a held test tone.
      const drift = ctx.createOscillator();
      drift.type = 'sine';
      drift.frequency.value = 0.03 + i * 0.017;
      const dg = ctx.createGain();
      dg.gain.value = f * 0.0016;
      drift.connect(dg); dg.connect(o.frequency);
      o.connect(g); g.connect(lp);
      o.start(); drift.start();
      oscs.push(o, drift);
    });
    lp.connect(gain);
    gain.connect(this.master);
    return {
      gain,
      stop: () => oscs.forEach(o => { try { o.stop(); } catch (e) {} }),
    };
  }

  playAmbient(name, config = {}) {
    if (!this.ctx) return;
    this.stopAmbient(name);
    const builder = this._ambientBuilders[config.type || 'waves'];
    if (!builder) return;
    const vol = config.volume || 0.08;
    const nodes = builder(vol);
    const now = this.ctx.currentTime;
    nodes.gain.gain.setValueAtTime(0, now);
    nodes.gain.gain.linearRampToValueAtTime(vol, now + 2);

    // Whose ground is this. Silvanus underneath everywhere on the coast; the
    // local one on top of him, louder, because that is the place she is in.
    const layers = [];
    const under = config.under !== false ? this._buildPresence('forest', vol * 1.0) : null;
    if (under) {
      under.gain.gain.setValueAtTime(0, now);
      under.gain.gain.linearRampToValueAtTime(vol * 1.0, now + 5);
      layers.push(under);
    }
    if (config.presence && config.presence !== 'forest') {
      const p = this._buildPresence(config.presence, vol * 1.6);
      if (p) {
        p.gain.gain.setValueAtTime(0, now);
        p.gain.gain.linearRampToValueAtTime(vol * 1.6, now + 5);
        layers.push(p);
      }
    }
    const combined = {
      gain: nodes.gain,
      _layers: layers,
      stop: () => { nodes.stop(); layers.forEach(l => l.stop()); },
    };
    this.ambientNodes[name] = combined;
  }

  // Interface sound. Not a beep — a soft wooden tick, the sound of a fingernail
  // on a table, so the game acknowledges a tap without ever sounding like a
  // machine. Safari in particular gives no other feedback that a tap landed.
  playClick(kind = 'tap') {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.6;
    let f, peak, dur;
    if (kind === 'arm') { f = 520; peak = 0.022; dur = 0.10; }
    else if (kind === 'page') { f = 300; peak = 0.020; dur = 0.14; }
    else { f = 400; peak = 0.016; dur = 0.08; }
    bp.frequency.value = f;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * 1.5, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.7, t + dur);
    // A little noise on the attack, or it reads as a musical note.
    const nb = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.02), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    nb.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.value = peak * 0.5;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp); nb.connect(ng); ng.connect(bp);
    bp.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
    nb.start(t);
  }

  stopAmbient(name, dur = 2) {
    const nodes = this.ambientNodes[name];
    if (!nodes) return;
    const now = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
    nodes.gain.gain.linearRampToValueAtTime(0, now + dur);
    // The buried presences have their own gains and would otherwise keep
    // sounding after the surface texture faded out.
    (nodes._layers || []).forEach(l => {
      l.gain.gain.cancelScheduledValues(now);
      l.gain.gain.setValueAtTime(l.gain.gain.value, now);
      l.gain.gain.linearRampToValueAtTime(0, now + dur);
    });
    setTimeout(() => {
      nodes.stop();
      // Same guard: a scene change installs the next bed under this key before
      // this timer fires, and deleting it there orphaned a bed that then played
      // forever, stacking one per scene change.
      if (this.ambientNodes[name] === nodes) delete this.ambientNodes[name];
    }, dur * 1000 + 200);
  }

  stopAllAmbient(dur = 2) {
    Object.keys(this.ambientNodes).forEach(k => this.stopAmbient(k, dur));
  }

  setVolume(v) {
    this.baseVolume = v;
    if (this.master) this.master.gain.value = v;
  }
}

window.AudioEngine = AudioEngine;
})();
