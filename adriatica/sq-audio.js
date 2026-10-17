// ============================================================================
//  SPHINXES QUEST — AUDIO (all synthesized WebAudio; no sample files)
//  Buses: master → { sfx, amb, music }. Mute persisted in localStorage.
// ============================================================================

export class SQAudio {
  constructor(){
    this.ctx = null;
    this.muted = false;
    try{ this.muted = localStorage.getItem('sq_mute')==='1'; }catch(e){}
    this._ambNodes = [];
    this._ambScene = null;
    this._musicTimer = null;
    this._stepFlip = false;
    this._purr = null;
  }

  // ── lifecycle ──────────────────────────────────────────────────────────
  ensure(){
    if(this.ctx) { if(this.ctx.state==='suspended') this.ctx.resume(); return true; }
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(c.destination);
      this.sfx   = c.createGain(); this.sfx.gain.value = 0.9;  this.sfx.connect(this.master);
      this.amb   = c.createGain(); this.amb.gain.value = 0.55; this.amb.connect(this.master);
      this.music = c.createGain(); this.music.gain.value = 0.5; this.music.connect(this.master);
      // gentle shared echo for chimes (stone-hall feel)
      this.echo = c.createDelay(0.6); this.echo.delayTime.value = 0.23;
      this.echoGain = c.createGain(); this.echoGain.gain.value = 0.28;
      this.echo.connect(this.echoGain); this.echoGain.connect(this.echo);
      this.echoGain.connect(this.master);
      // noise buffer (reused)
      const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
      this.noiseBuf = buf;
      return true;
    }catch(e){ this.ctx = null; return false; }
  }
  setMuted(m){
    this.muted = m;
    try{ localStorage.setItem('sq_mute', m?'1':'0'); }catch(e){}
    if(this.ctx) this.master.gain.setTargetAtTime(m?0:0.55, this.ctx.currentTime, 0.05);
  }

  // ── primitives ─────────────────────────────────────────────────────────
  tone(fq, t0, dur, {type='sine', vol=0.2, dest=null, glide=null, pan=0}={}){
    const c=this.ctx; if(!c) return null;
    const o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(fq, t0);
    if(glide!==null) o.frequency.exponentialRampToValueAtTime(Math.max(20,glide), t0+dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    let out=g;
    if(pan && c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=pan; g.connect(p); out=p; }
    o.connect(g); out.connect(dest||this.sfx);
    o.start(t0); o.stop(t0+dur+0.05);
    return g;
  }
  noise(t0, dur, {vol=0.2, fq=1200, q=1, type='bandpass', dest=null, slide=null}={}){
    const c=this.ctx; if(!c) return null;
    const s=c.createBufferSource(); s.buffer=this.noiseBuf; s.loop=true;
    const f=c.createBiquadFilter(); f.type=type; f.frequency.setValueAtTime(fq,t0); f.Q.value=q;
    if(slide!==null) f.frequency.exponentialRampToValueAtTime(Math.max(40,slide), t0+dur);
    const g=c.createGain();
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(vol,t0+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    s.connect(f); f.connect(g); g.connect(dest||this.sfx);
    s.start(t0); s.stop(t0+dur+0.05);
  }

  // ── SFX ────────────────────────────────────────────────────────────────
  play(name, a){ if(!this.ctx || this.muted) return; const t=this.ctx.currentTime; const fn=this['_'+name]; if(fn) fn.call(this,t,a); }

  _step(t){ // stone footstep, alternating feet
    this._stepFlip=!this._stepFlip;
    this.noise(t, 0.07, {vol:0.10, fq:this._stepFlip?480:390, q:2.5});
    this.noise(t, 0.04, {vol:0.05, fq:2400, q:1});
  }
  _blip(t){ this.tone(1245, t, 0.03, {type:'sine', vol:0.006}); }
  _pencil(t){ // scribble: three quick noise strokes
    for(let i=0;i<3;i++) this.noise(t+i*0.09, 0.07, {vol:0.07, fq:3200-i*500, q:1.6, slide:1800});
  }
  _confirm(t){ this.tone(660, t, 0.09, {type:'triangle', vol:0.12}); this.tone(880, t+0.07, 0.12, {type:'triangle', vol:0.10}); }
  _tick(t){ this.noise(t, 0.05, {vol:0.12, fq:900, q:5}); this.tone(320, t, 0.05, {type:'triangle', vol:0.07}); }
  _thud(t){ this.tone(140, t, 0.22, {type:'sine', vol:0.16, glide:70}); this.noise(t, 0.1, {vol:0.06, fq:250, q:1}); }
  _page(t){ this.noise(t, 0.28, {vol:0.11, fq:2600, q:0.8, slide:900}); }
  _paper(t){ this.noise(t, 0.18, {vol:0.09, fq:1800, q:0.9, slide:3200}); }
  _door(t){ this.noise(t, 0.5, {vol:0.10, fq:300, q:1.2, slide:120}); this.tone(95, t, 0.5, {type:'sine', vol:0.08, glide:60}); }
  _meow(t){ // small synth meow: two-formant slide
    this.tone(620, t, 0.28, {type:'sawtooth', vol:0.05, glide:430});
    this.tone(1240, t, 0.28, {type:'triangle', vol:0.05, glide:860});
  }
  _chirp(t){ this.tone(880, t, 0.09, {type:'triangle', vol:0.07, glide:1320}); }
  _collect(t){ // golden rising arpeggio + shimmer — the big reward
    const notes=[523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f,i)=>{ const g=this.tone(f, t+i*0.10, 0.55, {type:'triangle', vol:0.14}); if(g) g.connect(this.echo); });
    this.tone(2093, t+0.5, 1.1, {type:'sine', vol:0.05});
    this.noise(t+0.45, 0.9, {vol:0.03, fq:5200, q:0.7});
  }
  _solve(t){ // warm chord — "the stone answers"
    [392, 493.88, 587.33].forEach((f,i)=>{ const g=this.tone(f, t+i*0.03, 0.9, {type:'triangle', vol:0.10}); if(g) g.connect(this.echo); });
  }
  _visionIn(t){ // reverse swell into the old world
    const c=this.ctx, g=c.createGain(), o=c.createOscillator();
    o.type='sine'; o.frequency.setValueAtTime(65,t); o.frequency.exponentialRampToValueAtTime(130,t+1.4);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.16,t+1.3); g.gain.exponentialRampToValueAtTime(0.0001,t+1.9);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t+2);
    this.noise(t, 1.6, {vol:0.05, fq:600, q:0.6, slide:4800});
    const s=this.tone(523.25, t+0.9, 1.2, {type:'sine', vol:0.05}); if(s) s.connect(this.echo);
  }
  _visionOut(t){ this.noise(t, 0.9, {vol:0.05, fq:3800, q:0.6, slide:400}); this.tone(196, t, 0.9, {type:'sine', vol:0.08, glide:98}); }
  _bell(t){ // bronze bell: inharmonic partials
    [520, 693, 1041, 1560].forEach((f,i)=>{ const g=this.tone(f, t, 2.2-i*0.35, {type:'sine', vol:0.10/(i*0.6+1)}); if(g) g.connect(this.echo); });
    this.noise(t, 0.05, {vol:0.10, fq:2200, q:2});
  }
  _hum(t){ // sphinx-stone hum (near a waking stone)
    this.tone(98, t, 1.6, {type:'sine', vol:0.07}); this.tone(147, t, 1.6, {type:'sine', vol:0.04});
  }
  _riddle(t){ // the sphinx speaks: deep + airy fifth
    const g1=this.tone(110, t, 2.4, {type:'sine', vol:0.13});
    const g2=this.tone(165, t+0.15, 2.2, {type:'sine', vol:0.07});
    if(g1) g1.connect(this.echo); if(g2) g2.connect(this.echo);
    this.noise(t, 2.0, {vol:0.025, fq:900, q:0.5});
  }
  _finale(t){ // guardian circle: slow stacked chord + long shimmer
    const notes=[130.8, 196, 261.6, 329.6, 392, 523.25];
    notes.forEach((f,i)=>{ const g=this.tone(f, t+i*0.35, 3.6, {type:'triangle', vol:0.09}); if(g) g.connect(this.echo); });
    this.noise(t+1.2, 4.0, {vol:0.03, fq:6000, q:0.5});
  }
  _purrStart(){ // looping purr (call purrStop to end)
    if(!this.ctx || this.muted || this._purr) return;
    const c=this.ctx, t=c.currentTime;
    const o=c.createOscillator(), g=c.createGain(), lfo=c.createOscillator(), lg=c.createGain();
    o.type='sawtooth'; o.frequency.value=48;
    lfo.frequency.value=11; lg.gain.value=0.035;
    g.gain.value=0.0001; g.gain.setTargetAtTime(0.04, t, 0.4);
    lfo.connect(lg); lg.connect(g.gain);
    const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=220;
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); lfo.start(t);
    this._purr={o,lfo,g};
  }
  _purrStop(){ const p=this._purr; if(!p) return; this._purr=null;
    const t=this.ctx.currentTime; p.g.gain.setTargetAtTime(0.0001, t, 0.3);
    setTimeout(()=>{ try{p.o.stop();p.lfo.stop();}catch(e){} }, 900);
  }
  purr(on){ if(on) this._purrStart(); else this._purrStop(); }

  // ── AMBIENCE (looping beds per scene family) ───────────────────────────
  setScene(sceneId, opts={}){
    if(!this.ctx) return;
    if(this._ambScene===sceneId) return;
    this._ambScene=sceneId;
    this._stopAmb();
    const FAMILY = {
      apartment:'home', alley:'street', peristyle:'square', temple:'stone',
      museum:'stone', citymuseum:'stone', fishmarket:'street', garden:'garden',
      cellar:'under', tunnels:'under', cathedral:'stone', vestibule:'stone',
      belltower:'wind',
    };
    this._startAmb(FAMILY[sceneId]||'square', opts);
  }
  _stopAmb(){
    for(const n of this._ambNodes){ try{ n.gain&&n.gain.gain.setTargetAtTime(0.0001,this.ctx.currentTime,0.4); }catch(e){}
      setTimeout(()=>{ try{ n.src&&n.src.stop(); n.osc&&n.osc.stop(); }catch(e){} }, 1400); }
    this._ambNodes=[];
    if(this._ambTimer){ clearInterval(this._ambTimer); this._ambTimer=null; }
  }
  _bed(fq, q, vol, type='bandpass'){ // filtered-noise bed
    const c=this.ctx, s=c.createBufferSource(); s.buffer=this.noiseBuf; s.loop=true;
    const f=c.createBiquadFilter(); f.type=type; f.frequency.value=fq; f.Q.value=q;
    const g=c.createGain(); g.gain.value=0.0001; g.gain.setTargetAtTime(vol, c.currentTime, 1.2);
    s.connect(f); f.connect(g); g.connect(this.amb); s.start();
    this._ambNodes.push({src:s, gain:g});
    return g;
  }
  _drone(fq, vol, type='sine'){
    const c=this.ctx, o=c.createOscillator(); o.type=type; o.frequency.value=fq;
    const g=c.createGain(); g.gain.value=0.0001; g.gain.setTargetAtTime(vol, c.currentTime, 1.5);
    o.connect(g); g.connect(this.amb); o.start();
    this._ambNodes.push({osc:o, gain:g});
  }
  _startAmb(family, opts){
    const night = !!opts.night;
    // (noise beds removed — ambience is now just soft drones + occasional one-shots)
    switch(family){
      case 'home':   this._drone(120, 0.008); break;
      case 'street': this._sprinkle(['gull','swallow'], 5, 11); break;
      case 'square': this._sprinkle(night?['cricket','owl']:['gull','swallow','bell-far'], 4, 9); break;
      case 'garden': this._sprinkle(['swallow','cricket','leaves'], 3, 7); break;
      case 'stone':  this._drone(65, 0.014); this._sprinkle(['drip-soft'], 7, 15); break;
      case 'under':  this._drone(49, 0.02); this._sprinkle(['drip','drip-soft','skitter'], 3, 7); break;
      case 'wind':   this._sprinkle(['gust'], 4, 8); break;
    }
  }
  _sprinkle(kinds, minS, maxS){ // occasional one-shot ambience events
    const fire=()=>{
      if(this.muted || !this.ctx) return;
      const t=this.ctx.currentTime, k=kinds[Math.floor(Math.random()*kinds.length)];
      const pan=(Math.random()*1.6-0.8);
      if(k==='gull'){ for(let i=0;i<2+Math.random()*2;i++) this.tone(1150+Math.random()*250, t+i*0.28, 0.22, {type:'triangle', vol:0.018, glide:820, dest:this.amb, pan}); }
      else if(k==='swallow'){ this.tone(2600, t, 0.08, {type:'sine', vol:0.015, glide:3600, dest:this.amb, pan}); this.tone(3100, t+0.11, 0.07, {type:'sine', vol:0.012, glide:2300, dest:this.amb, pan}); }
      else if(k==='cricket'){ for(let i=0;i<5;i++) this.tone(4200, t+i*0.07, 0.03, {type:'sine', vol:0.010, dest:this.amb, pan}); }
      else if(k==='owl'){ this.tone(340, t, 0.3, {type:'sine', vol:0.02, glide:290, dest:this.amb, pan}); this.tone(310, t+0.45, 0.45, {type:'sine', vol:0.02, glide:250, dest:this.amb, pan}); }
      else if(k==='bell-far'){ this.tone(660, t, 1.8, {type:'sine', vol:0.012, dest:this.amb, pan}); this.tone(880, t, 1.2, {type:'sine', vol:0.006, dest:this.amb, pan}); }
      else if(k==='drip'){ this.tone(900+Math.random()*500, t, 0.09, {type:'sine', vol:0.04, glide:300, dest:this.amb, pan}); }
      else if(k==='drip-soft'){ this.tone(700+Math.random()*300, t, 0.07, {type:'sine', vol:0.02, glide:250, dest:this.amb, pan}); }
      else if(k==='skitter'){ for(let i=0;i<4;i++) this.noise(t+i*0.05, 0.03, {vol:0.012, fq:3000, q:3, dest:this.amb}); }
      else if(k==='leaves'){ this.noise(t, 1.2, {vol:0.012, fq:3400, q:0.5, slide:2200, dest:this.amb}); }
      else if(k==='gust'){ this.noise(t, 2.2, {vol:0.05, fq:500, q:0.4, slide:1400, dest:this.amb}); }
    };
    const loop=()=>{ fire(); this._ambTimer=setTimeout(loop, (minS+Math.random()*(maxS-minS))*1000); };
    this._ambTimer=setTimeout(loop, 1500+Math.random()*2500);
  }

  // ── MUSIC (sparse generative lyre over the ambience; explore only) ─────
  musicOn(mode){ // mode: 'day' | 'night' | null(off)
    this._musicMode=mode;
    if(this._musicTimer){ clearTimeout(this._musicTimer); this._musicTimer=null; }
    if(!mode || !this.ctx) return;
    const DAY  =[261.6, 293.7, 329.6, 392, 440, 523.25];          // C maj pent
    const NIGHT=[220, 261.6, 293.7, 329.6, 392, 440];             // A min pent
    let idx=Math.floor(Math.random()*4);
    const pluck=()=>{
      if(this._musicMode!==mode) return;
      if(!this.muted){
        const sc=(mode==='night')?NIGHT:DAY, t=this.ctx.currentTime;
        idx=Math.max(0, Math.min(sc.length-1, idx+(Math.floor(Math.random()*3)-1)));
        const f=sc[idx];
        const g=this.tone(f, t, 1.4, {type:'triangle', vol:0.045, dest:this.music});
        if(g) g.connect(this.echo);
        if(Math.random()<0.3) this.tone(f*0.5, t+0.05, 1.8, {type:'sine', vol:0.03, dest:this.music});
      }
      this._musicTimer=setTimeout(pluck, 2200+Math.random()*3800);
    };
    this._musicTimer=setTimeout(pluck, 800);
  }
}
