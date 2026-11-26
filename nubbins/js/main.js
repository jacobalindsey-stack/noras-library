// NUBBINS — boot, renderer, post effects, the game flow and saving.
import * as THREE from '../lib/three.module.min.js';
import { EffectComposer } from '../lib/EffectComposer.js';
import { RenderPass } from '../lib/RenderPass.js';
import { UnrealBloomPass } from '../lib/UnrealBloomPass.js';
import { ShaderPass } from '../lib/ShaderPass.js';
import { OutputPass } from '../lib/OutputPass.js';
import { ROSTER, BY_KEY, PLAYABLE } from './roster.js';
import { buildStage, STAGES, SECRET_STAGES, ARCADE_STAGES, STAGE_BY_KEY } from './stages.js';
import { FX } from './fx.js';
import { Match, getBear } from './match.js';
import { Input, pads } from './input.js';
import { UI } from './ui.js';
import { buildWord } from './letters.js';
import { Online } from './online.js';
import { P, resolve, POSES } from './anim.js';
import { audioUnlock, audioSuspend, setAudioOptions, playMusic, sfx, say } from './audio.js';

const SAVE_KEY = 'nubbins.save.v1';
const DEFAULT_SAVE = () => ({ v: 1, settings: { difficulty: 1, music: true, sfx: true, voice: true, quality: 'auto' }, unlocked: { gummoth: false }, cleared: {}, nubbed: {}, stats: { wins: 0, losses: 0, nubbinations: 0, arcadeClears: 0 } });
function loadSave() {
  const d = DEFAULT_SAVE();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return d;
    return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) }, unlocked: { ...d.unlocked, ...(s.unlocked || {}) }, cleared: { ...(s.cleared || {}) }, nubbed: { ...(s.nubbed || {}) }, stats: { ...d.stats, ...(s.stats || {}) }, v: 1 };
  } catch (e) { return d; }
}

const GRADE = {
  uniforms: { tDiffuse: { value: null }, uVig: { value: 0.32 }, uAb: { value: 0 }, uSat: { value: 1.08 }, uDark: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig, uAb, uSat, uDark; varying vec2 vUv;
    void main(){
      vec2 d = vUv - 0.5;
      vec3 c;
      if (uAb > 0.001) { c.r = texture2D(tDiffuse, vUv + d * uAb).r; c.g = texture2D(tDiffuse, vUv).g; c.b = texture2D(tDiffuse, vUv - d * uAb).b; }
      else c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, uSat);
      c *= 1.0 - uVig * smoothstep(0.25, 0.85, length(d * vec2(1.25, 1.0)));
      c *= 1.0 - uDark;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

class Game {
  constructor() {
    this.save = loadSave();
    this.view = document.getElementById('view');
    this.ui = new UI(this);
    this.input = new Input(document.getElementById('touch'));
    this.input.nav = (a, rep, code) => this.onNav(a, rep, code);
    this.portraits = {};
    this.time = 0; this.last = performance.now();
    this.match = null;
    this.touchShift = 0;
  }

  // ------------------------------------------------------------ saving
  persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) {} }
  setSetting(id, v) {
    this.save.settings[id] = v; this.persist();
    if (['music', 'sfx', 'voice'].includes(id)) setAudioOptions({ music: this.save.settings.music, sfx: this.save.settings.sfx, voice: this.save.settings.voice });
    if (id === 'quality') this.applyQuality(true);
  }
  eraseProgress() { const st = this.save.settings; this.save = DEFAULT_SAVE(); this.save.settings = st; this.persist(); }

  // ---------------------------------------------------------- renderer
  initRenderer() {
    const r = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = this.save.settings.quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap; r.shadowMap.autoUpdate = false;
    this.view.appendChild(r.domElement);
    this.renderer = r;
    r.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; });
    r.domElement.addEventListener('webglcontextrestored', () => { this.lost = false; this.rebuildAfterLoss(); });
    this.world = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.05, 220);
    this.camera.position.set(0, 1, 5);
    const hf = r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float');
    this.hdr = hf;
    this.maxSamples = r.capabilities.maxSamples || 0;
    this.makeComposer();
    this.fx = new FX(this.world, { camera: this.camera });
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
  }

  makeComposer() {
    const r = this.renderer;
    const q = this.quality();
    if (this.composer) { this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose(); }
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: this.hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: q.msaa ? Math.min(4, this.maxSamples) : 0 });
    const c = new EffectComposer(r, rt);
    c.addPass(new RenderPass(this.world, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.36, 0.42, 0.92);
    this.bloom.enabled = q.bloom;
    c.addPass(this.bloom);
    if (this.stage && this.stage.look) { this.bloom.threshold = this.stage.look.bloomT ?? 0.92; this.bloom.strength = this.stage.look.bloomS ?? 0.36; }
    this.grade = new ShaderPass(GRADE);
    c.addPass(this.grade);
    c.addPass(new OutputPass());
    this.composer = c;
  }

  quality() {
    const s = this.save.settings.quality;
    const dpr = window.devicePixelRatio || 1;
    if (s === 'low') return { pr: Math.min(dpr, 1), bloom: false, msaa: false };
    if (s === 'high') return { pr: Math.min(dpr, 2), bloom: true, msaa: true };
    return { pr: this.autoPR ?? Math.min(dpr, 1.5), bloom: this.autoBloom ?? true, msaa: true, auto: true };
  }
  applyQuality(rebuild) {
    if (rebuild) {
      this.autoPR = undefined; this.autoBloom = undefined; this.makeComposer();
      const want = this.save.settings.quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      if (this.renderer.shadowMap.type !== want) { this.renderer.shadowMap.type = want; this.world.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.needsUpdate = true; }); }); this.shadowFrames = 3; }
    }
    this.resize();
  }

  resize() {
    const portrait = innerHeight > innerWidth * 1.1;
    document.body.classList.toggle('portrait', portrait && this.input.usedTouch);
    const w = Math.max(1, this.view.clientWidth), h = Math.max(1, this.view.clientHeight);
    const q = this.quality();
    this.renderer.setPixelRatio(q.pr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(q.pr);
    this.composer.setSize(w, h);
    this.bloom.enabled = q.bloom;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.fx.setScale(h * q.pr / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)));
    this.touchShift = this.match && this.input.mode !== 'none' && !document.body.classList.contains('portrait') ? 0.24 : 0;
  }
  viewRect() { return this.view.getBoundingClientRect(); }

  // auto quality: watch the frame time and trade resolution for smoothness
  monitor(dt) {
    if (this.save.settings.quality !== 'auto' || document.hidden) return;
    this.mAcc = (this.mAcc || 0) + dt; this.mN = (this.mN || 0) + 1;
    if (this.mAcc < 2.5) return;
    const avg = this.mAcc / this.mN; this.mAcc = 0; this.mN = 0;
    const q = this.quality(); const dpr = window.devicePixelRatio || 1;
    if (avg > 1 / 40 && q.pr > 0.75) { this.autoPR = Math.max(0.75, q.pr - 0.25); this.resize(); }
    else if (avg > 1 / 30 && this.autoBloom !== false) { this.autoBloom = false; this.resize(); }
    else if (avg < 1 / 58 && q.pr < Math.min(dpr, 1.75)) { this.autoPR = Math.min(Math.min(dpr, 1.75), q.pr + 0.25); this.resize(); }
  }

  // ------------------------------------------------------------- stages
  loadStage(key, force) {
    if (this.stage && this.stage.key === key && !force) return;
    if (this.stage) { this.world.remove(this.stage.group); this.stage.dispose(); }
    this.stage = buildStage(key, this.renderer);
    this.stage.fx = this.fx;
    this.world.add(this.stage.group);
    this.shadowFrames = 3;
    this.world.environment = this.stage.envRT.texture;
    const look = this.stage.look || {};
    this.renderer.toneMappingExposure = look.exposure ?? 1;
    this.bloom.threshold = look.bloomT ?? 0.92; this.bloom.strength = look.bloomS ?? 0.36;
    const f = this.stage.fog; this.world.fog = f ? new THREE.Fog(f[0], f[1], f[2]) : null;
    this.fx.ambient = this.stage.ambient;
  }
  rebuildAfterLoss() { if (this.stage) this.loadStage(this.stage.key, true); this.makeComposer(); this.resize(); }

  // ---------------------------------------------------------------- boot
  async boot() {
    this.ui.loading(0.02, 'Warming up the jelly…');
    await new Promise(r => setTimeout(r, 30));
    this.initRenderer();
    setAudioOptions({ music: this.save.settings.music, sfx: this.save.settings.sfx, voice: this.save.settings.voice });
    const unlock = () => audioUnlock();
    for (const ev of ['pointerdown', 'pointerup', 'touchend', 'keydown']) addEventListener(ev, unlock, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { audioSuspend(true); if (this.match && !this.match.net && !this.match.paused && this.match.phase === 'fight') this.togglePause(); }
      else audioSuspend(false);
    });
    for (const ev of ['gesturestart', 'gesturechange', 'dblclick']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
    this.input.onTouchSeen = () => this.resize();
    this.resize();
    this.loadStage('cake');
    try { await Promise.race([document.fonts.load('150px "Lilita One"'), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
    // grow every bear and take its portrait
    const n = ROSTER.length;
    for (let i = 0; i < n; i++) {
      const def = ROSTER[i];
      this.ui.loading(0.1 + 0.75 * (i / n), 'Pouring ' + def.name.toLowerCase() + '…');
      await new Promise(r => setTimeout(r, 16));
      getBear(def, 0);
      this.portraits[def.key] = this.portrait(def);
    }
    this.ui.loading(0.9, 'Squishing the letters…');
    await new Promise(r => setTimeout(r, 16));
    const fontOk = document.fonts && document.fonts.check && document.fonts.check('150px "Lilita One"');
    this.word = buildWord('NUBBINS', fontOk ? '"Lilita One"' : '"Arial Rounded MT Bold", "Arial Black", sans-serif');
    this.world.add(this.word.group);
    this.ui.loading(1, 'Ready!');
    requestAnimationFrame(t => this.frame(t));
    window.__ready = true;
    window.NUBBINS = this;
    this.toTitle();
  }

  portrait(def) {
    const r = this.renderer, size = 256;
    const scene = new THREE.Scene();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShaderMaterial({
      uniforms: { a: { value: new THREE.Color(def.ui) }, b: { value: new THREE.Color('#1a0618') } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 a, b; varying vec2 vUv; void main(){ float d = length(vUv - vec2(0.5, 0.58)); vec3 c = mix(a * 1.1, b, smoothstep(0.0, 0.42, d)); c += vec3(1.0) * 0.18 * smoothstep(0.03, 0.0, abs(d - 0.2)) ; gl_FragColor = vec4(c, 1.0); }',
    }));
    bg.position.set(0, 0.6, -1.4); scene.add(bg);
    scene.environment = this.stage.envRT.texture;
    scene.add(new THREE.HemisphereLight(0xffe8f0, 0x402030, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(1.5, 3, 3); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 2.5); rim.position.set(-2, 2, -2); scene.add(rim);
    const b = getBear(def, 0);
    const prev = b.group.parent;
    scene.add(b.group);
    b.group.position.set(0, 0, 0); b.group.rotation.set(0, 0.45, 0);
    const p = P(Object.assign({}, def.stance || {}, { brow: 0.4, turn: 1 }));
    b.pose = resolve(p, 1, b.pose); b.setExpression('idle'); b.update(0.016);
    const s = def.scale || 1;
    const cam = new THREE.PerspectiveCamera(26, 1, 0.05, 50);
    cam.position.set(0.25 * s, 0.78 * s, 2.3 * s); cam.lookAt(0, 0.56 * s, 0);
    const pr = r.getPixelRatio(); const old = new THREE.Vector2(); r.getSize(old);
    r.setPixelRatio(1); r.setSize(size, size, false);
    r.render(scene, cam);
    const c = document.createElement('canvas'); c.width = c.height = size;
    c.getContext('2d').drawImage(r.domElement, 0, 0, size, size);
    r.setPixelRatio(pr); r.setSize(old.x, old.y, false);
    scene.remove(b.group); if (prev) prev.add(b.group);
    bg.geometry.dispose(); bg.material.dispose();
    return c.toDataURL('image/jpeg', 0.88);
  }

  // ---------------------------------------------------------- menu 3D
  showMenuScene(kind, keys) {
    this.menuKind = kind;
    this.word.group.visible = kind === 'title';
    for (const b of this.menuBears || []) b.group.removeFromParent();
    this.menuBears = [];
    this.menuKeys = keys || [];
    if (!keys) return;
    keys.forEach((k, i) => {
      if (!k) return;
      const b = getBear(BY_KEY[k], kind === 'select' ? i : 0);
      this.world.add(b.group);
      b._k = k; b._i = i; b._spin = 0;
      this.menuBears.push(b);
    });
  }
  menuUpdate(dt) {
    const t = this.time, cam = this.camera, aspect = cam.aspect;
    if (this.menuKind === 'title') {
      const n = this.menuBears.length, spacing = 0.78;
      const portrait = aspect < 1;
      const wordS = portrait ? 0.62 : 0.95;
      const rowW = n * spacing + 0.5, wordW = this.word.width * wordS + 0.5;
      const t15 = Math.tan(THREE.MathUtils.degToRad(15));
      // feet near 72% down the screen, letters near the top
      const hH = Math.max(2.0, Math.max(rowW, wordW) / 2 / aspect);
      const dist = hH / t15, ly = 0.44 * hH;
      cam.position.set(Math.sin(t * 0.2) * 0.25, ly + 0.05, dist); cam.lookAt(0, ly, 0);
      this.word.group.scale.setScalar(wordS);
      this.word.group.userData.y = ly + 0.86 * hH - 0.85 * wordS;
      this.menuBears.forEach((b, i) => {
        const x = (i - (n - 1) / 2) * spacing;
        b.group.position.set(x, 0, 0.3); b.group.rotation.y = Math.sin(t * 0.7 + i) * 0.25 - x * 0.08;
        const p = P(BY_KEY[b._k].stance || {}); const ph = t * 4 + i * 1.1;
        p.y = Math.abs(Math.sin(ph)) * 0.06; p.sq = 1 + Math.sin(ph * 2) * 0.05; p.turn = 1;
        const punch = ((t * 0.5 + i * 0.37) % 3) < 0.25;
        if (punch) { p.aN = [0.05, 0.1, 1]; p.aNs = 2.2; p.aNf = 1.6; p.brow = 0.5; }
        b.pose = resolve(p, 1, b.pose); b.setExpression('idle'); b.update(dt);
      });
      const W = this.word;
      W.group.position.set(0, W.group.userData.y, -0.2);
      W.letters.forEach((L, i) => {
        const ph = t * 2.2 - i * 0.55;
        const hop = Math.max(0, Math.sin(ph)); const land = Math.max(0, -Math.sin(ph)) ;
        L.piv.position.y = L.base.y + hop * 0.12;
        const sq = 1 + (hop > 0.05 ? hop * 0.06 : -Math.pow(land, 6) * 0.18);
        L.piv.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
        L.piv.rotation.z = Math.sin(t * 1.3 + i) * 0.04;
        L.mat.userData.u.uWobT.value = t; L.mat.userData.u.uWob.value = Math.pow(land, 6) * 1.2;
      });
    } else if (this.menuKind === 'select' || this.menuKind === 'ladder') {
      const bears = this.menuBears;
      const two = this.menuKeys.filter(Boolean).length > 1;
      const portrait = aspect < 1;
      const dist = portrait ? 4.6 : 3.4;
      cam.position.set(0, 0.95, dist); cam.lookAt(0, portrait ? 0.15 : 0.35, 0);
      bears.forEach(b => {
        const side = b._i === 1 ? 1 : -1;
        const x = two ? side * (portrait ? 0.55 : 0.62) : (this.menuKind === 'ladder' ? 0 : 0);
        b.group.position.set(x, 0, 0);
        b._spin = Math.max(0, b._spin - dt);
        const f = two ? -side : 1;
        b.group.rotation.y = (two ? f * 0.75 : 0.35) + b._spin * 12;
        const ph = t * 4.2 + b._i;
        const p = b._spin > 0 ? P(POSES.win) : P(BY_KEY[b._k].stance || {});
        p.sq = (p.sq || 1) + Math.sin(ph) * 0.035; p.turn = 1;
        if (b._spin > 0) p.y = Math.abs(Math.sin(t * 9)) * 0.15;
        b.pose = resolve(p, f > 0 ? 1 : -1, b.pose); b.setExpression(b._spin > 0 ? 'happy' : 'idle'); b.update(dt);
      });
    }
  }

  // ---------------------------------------------------------------- loop
  frame(now) {
    requestAnimationFrame(t => this.frame(t));
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000)); this.last = now;
    if (this.lost) return;
    this.time += dt;
    if (!this.match || this.match.paused) this.input.pollPadNav();
    else if (this.input.nav) this.pollPausePad();
    let fxdt = dt;
    if (this.testSteps && this.match && !this.match.paused && !this.match.net) for (let i = 0; i < this.testSteps && this.match; i++) this.match.step();
    if (this.online) this.online.tick(dt);
    const M = this.match;
    if (M) { M.update(dt); fxdt = M.paused ? 0 : dt * (M.slow > 0 ? M.slowK : 1); }
    else this.menuUpdate(dt);
    this.fx.update(fxdt);
    if (this.stage) {
      this.stage.update(this.time, dt, this.match && !this.match.paused ? this.match : null);
      if (this.stage.envDarkRT) { const want = this.stage.envBlend > 0.5 ? this.stage.envDarkRT.texture : this.stage.envRT.texture; if (this.world.environment !== want) this.world.environment = want; }
      if (this.stage.shadowDirty || this.shadowFrames > 0) { this.renderer.shadowMap.needsUpdate = true; this.stage.shadowDirty = false; if (this.shadowFrames > 0) this.shadowFrames--; }
    }
    // post: a little colour fringe on big hits
    const shake = this.match ? this.match.shakeAmt : 0;
    this.grade.uniforms.uAb.value = Math.min(0.02, shake * 0.06);
    this.grade.uniforms.uDark.value += (((this.match && (this.match.phase === 'nubem' || this.match.phase === 'finisher')) ? 0.12 : 0) - this.grade.uniforms.uDark.value) * Math.min(1, dt * 3);
    if (this.noRender) return;
    this.composer.render(dt);
    this.monitor(dt);
  }
  pollPausePad() {
    const gps = pads();
    gps.forEach((g, i) => { const s = !!(g.buttons[9] && g.buttons[9].pressed); const k = 'sp' + i; if (s && !this[k]) this.togglePause(); this[k] = s; });
  }

  onNav(a, rep, code) {
    if (this.match && this.match.net && this.netMenu) return this.ui.onNav(a, rep, code);
    if (this.match && !this.match.paused) {
      if (a === 'pause' || (a === 'back' && code === 'Escape')) { this.togglePause(); return true; }
      return false;
    }
    return this.ui.onNav(a, rep, code);
  }

  canFullscreen() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
  toggleFullscreen() {
    try {
      const d = document.documentElement;
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const r = d.requestFullscreen || d.webkitRequestFullscreen; if (r) { const p = r.call(d, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } }
    } catch (e) {}
  }

  // ---------------------------------------------------------------- flow
  endFight() {
    if (this.match) { this.match.dispose(); this.match = null; }
    this.ui.enterFight(false);
    document.body.classList.remove('fighting');
    this.input.setTouch('none');
    this.fx.clear();
    this.resize();
  }

  toTitle() {
    if (this.online) { this.online.close(); this.online = null; }
    this.endFight();
    this.loadStage('cake');
    const n = this.camera.aspect < 1 ? 3 : 6;
    const keys = ['cherry', 'razz', 'sour', 'tango', 'ghost', 'duke'];
    this.showMenuScene('title', n === 3 ? ['cherry', 'razz', 'duke'] : keys);
    this.ui.title();
    playMusic('title');
  }

  pickChar(o) {
    this.loadStage('sill');
    const keys = [null, null];
    this.showMenuScene('select', keys);
    const show = (k, i) => { keys[i] = k; this.showMenuScene('select', keys.slice()); };
    if (o.other) keys[1 - o.picker] = o.other;
    this.ui.select(Object.assign({}, o, {
      onHover: k => { const kk = BY_KEY[k].boss && !this.save.unlocked.gummoth ? null : k; if (keys[o.picker] !== kk) { show(kk, o.picker); sfx('select'); } },
      onPick: k => {
        const b = this.menuBears.find(x => x._k === k && x._i === o.picker); if (b) b._spin = 0.9;
        say(BY_KEY[k].name.toLowerCase(), { pitch: 0.4 });
        setTimeout(() => o.onPick(k), 650);
      },
    }));
    playMusic('select');
  }

  flowArcade() {
    this.pickChar({
      heading: 'CHOOSE YOUR GUMMY', picker: 0,
      onBack: () => this.toTitle(),
      onPick: k => {
        const others = PLAYABLE.filter(x => x !== k).sort(() => Math.random() - 0.5).slice(0, 5);
        this.arcade = { player: k, list: [...others, 'gummoth'], at: 0, stages: ARCADE_STAGES.slice() };
        this.showLadder();
      },
    });
  }
  showLadder() {
    const A = this.arcade;
    this.loadStage('sill');
    this.showMenuScene('ladder', [A.player]);
    this.ui.ladder(A.player, A.list, A.at, () => this.arcadeFight(), () => this.toTitle(), A.stages.map(k => STAGE_BY_KEY[k].name));
    playMusic('ladder');
  }
  async arcadeFight() {
    const A = this.arcade, opp = A.list[A.at];
    this.showMenuScene(null, null);
    await this.ui.versus(A.player, opp);
    const lvl = this.save.settings.difficulty;
    const boss = BY_KEY[opp].boss;
    this.startFight({
      p1: A.player, p2: opp, humans: [true, false], mode: 'arcade', stage: A.stages[A.at] || 'couch',
      level: boss ? lvl : Math.max(0, Math.min(2, lvl - (A.at < 2 ? 1 : 0))), bossHp: boss ? 1.12 : 1,
      onEnd: res => {
        this.recordResult(res, [true, false]);
        if (res.winner === 0) {
          A.at++;
          if (A.at >= A.list.length) {
            const first = !this.save.unlocked.gummoth;
            this.save.unlocked.gummoth = true; this.save.cleared[A.player] = true; this.save.stats.arcadeClears++; this.persist();
            this.endFight(); this.loadStage('fridgetop'); this.showMenuScene('ladder', [A.player]);
            this.ui.ending(A.player, first, () => this.toTitle());
            playMusic('title');
          } else { this.endFight(); this.showLadder(); }
        } else {
          this.endFight(); this.showMenuScene('ladder', [A.player]);
          this.ui.continueScreen(() => this.arcadeFight(), () => this.toTitle());
          playMusic('finish');
        }
      },
    });
  }

  flowOnline() {
    if (this.online) this.online.close();
    this.online = new Online(this);
    this.online.menu();
  }

  flowVersus() {
    this.loadStage('sill'); this.showMenuScene(null, null);
    this.ui.versusMode({ onDuel: () => this.flowDuel(), onParty: () => this.flowParty(), onBack: () => this.toTitle() });
    playMusic('select');
  }

  // a party: 3-4 bears, players on this device (touch, keys, controllers) and the computer
  flowParty() {
    const st = this.partySetup || (this.partySetup = { slots: [{ k: 'cherry', who: 'player' }, { k: 'razz', who: 'cpu' }, { k: 'sour', who: 'cpu' }, { k: 'tango', who: 'off' }] });
    for (const sl of st.slots) if (BY_KEY[sl.k].boss && !this.save.unlocked.gummoth) sl.k = 'duke';
    this.loadStage('sill'); this.showMenuScene(null, null);
    const setup = () => this.ui.partySetup(st, {
      onBack: () => this.flowVersus(),
      onStart: () => this.ui.stageSelect(this.save.unlocked.gummoth ? [...STAGES, ...SECRET_STAGES] : STAGES, s => { st.stage = s; go(); }, setup),
    });
    const go = () => {
      const act = st.slots.map((sl, i) => ({ k: sl.k, who: sl.who, i })).filter(sl => sl.who !== 'off');
      const humans = act.map(sl => sl.who === 'player');
      const touch = st.slots[0].who === 'player' && st.slots[1].who === 'player' ? '2p' : '1p';
      this.startFight({
        bears: act.map(sl => sl.k), p1: act[0].k, p2: act[1].k, humans, ctl: act.map(sl => sl.i), touch,
        mode: 'vs', stage: st.stage, level: this.save.settings.difficulty,
        onEnd: res => {
          this.recordResult(res, humans);
          this.endFight(); this.loadStage('sill'); this.showMenuScene(null, null);
          this.ui.results(res, () => go(), () => setup(), () => this.toTitle());
        },
      });
    };
    setup();
  }

  flowDuel() {
    const st = { p2human: true };
    const pick1 = () => this.pickChar({
      heading: 'PLAYER 1, PICK!', picker: 0, onBack: () => this.flowVersus(),
      onPick: a => { st.a = a; pick2(); },
    });
    const pick2 = () => this.pickChar({
      heading: st.p2human ? 'PLAYER 2, PICK!' : 'PICK THE COMPUTER', picker: 1, other: st.a, toggleP2: true, p2human: st.p2human,
      onToggleP2: () => { st.p2human = !st.p2human; pick2(); },
      onBack: pick1,
      onPick: b => { st.b = b; this.ui.stageSelect(this.save.unlocked.gummoth ? [...STAGES, ...SECRET_STAGES] : STAGES, s => { st.stage = s; go(); }, pick2); },
    });
    const go = async () => {
      this.showMenuScene(null, null);
      await this.ui.versus(st.a, st.b, 1800);
      this.startFight({
        p1: st.a, p2: st.b, humans: [true, st.p2human], mode: 'vs', stage: st.stage, level: this.save.settings.difficulty,
        onEnd: res => {
          this.recordResult(res, [true, st.p2human]);
          this.endFight(); this.showMenuScene('select', [st.a, st.b]);
          this.ui.results(res, () => go(), () => pick1(), () => this.toTitle());
        },
      });
    };
    pick1();
  }

  flowPractice() {
    const st = {};
    const pick1 = () => this.pickChar({ heading: 'PRACTICE AS…', picker: 0, onBack: () => this.toTitle(), onPick: a => { st.a = a; pick2(); } });
    const pick2 = () => this.pickChar({
      heading: 'PRACTICE PARTNER', picker: 1, other: st.a, onBack: pick1,
      onPick: b => { st.b = b; this.startFight({ p1: st.a, p2: b, humans: [true, false], mode: 'practice', stage: 'sill', level: this.save.settings.difficulty, dummy: 'none', onEnd: () => this.toTitle() }); },
    });
    pick1();
  }

  recordResult(res, humans) {
    const s = this.save.stats;
    const otherHuman = humans.some((h, i) => h && i !== res.winner);
    if (humans[res.winner] && !otherHuman) s.wins++; else if (!humans[res.winner] && humans.some(Boolean)) s.losses++;
    if (res.nubbed) { s.nubbinations++; if (humans[res.winner]) this.save.nubbed[res.winnerKey] = true; }
    this.persist();
  }

  startFight(cfg) {
    this.endFight();
    this.showMenuScene(null, null);
    this.ui.clear();
    this.loadStage(cfg.stage || 'couch');
    cfg.p1def = BY_KEY[cfg.p1]; cfg.p2def = BY_KEY[cfg.p2];
    if (cfg.bears) cfg.defs = cfg.bears.map(k => BY_KEY[k]); // a party of 3-4
    const nb = cfg.defs ? cfg.defs.length : 2;
    if (this.testAuto && !cfg.net) cfg.humans = [false, false];
    cfg.music = this.stage.music;
    document.body.classList.add('fighting');
    const duo = !!(cfg.humans[0] && cfg.humans[1]);
    const tmode = cfg.touch || (duo ? '2p' : '1p');
    this.input.setTouch(this.input.usedTouch ? tmode : 'none');
    this.input.onTouchSeen = () => { if (this.match && this.input.mode === 'none') this.input.setTouch(tmode); this.resize(); };
    this.ui.enterFight(true, nb);
    this.lastCfg = cfg;
    this.match = new Match(this, cfg);
    if (this.testBoost) this.match.fighters[this.testBoost > 0 ? 0 : 1].power = 6;
    this.resize();
  }

  togglePause() {
    const M = this.match; if (!M) return;
    if (M.net) { if (this.online) this.online.fightMenu(); return; }
    if (M.phase === 'matchEnd' || M.phase === 'finisher') return;
    M.paused = !M.paused;
    this.input.releaseTouch();
    if (M.paused) {
      sfx('select');
      const cfg = M.cfg;
      const self = this;
      const o = {
        practice: cfg.mode === 'practice', dummy: cfg.dummy, charKey: cfg.p1,
        onResume: () => { M.paused = false; this.ui.clear(); },
        onDummy: () => { const order = ['none', 'block', 'crouch', 'jump', 'cpu']; cfg.dummy = order[(order.indexOf(cfg.dummy) + 1) % order.length]; o.dummy = cfg.dummy; self.ui.pause(o); },
        onQuit: () => { this.ui.clear(); this.toTitle(); },
      };
      this.ui.pause(o);
    } else this.ui.clear();
  }
}

const game = new Game();
game.boot().catch(e => {
  console.error(e);
  const ui = document.getElementById('ui');
  ui.innerHTML = `<div class="screen"><div class="panel" style="max-width:480px;text-align:center"><h2 class="candy">Uh oh, a sticky jam</h2><p style="font-weight:800">This device couldn't start the 3D jelly. Try reloading, or a newer browser.</p></div></div>`;
});
