// NUBBINS — the arenas. Each one is built from simple shapes, painted
// canvases and a sky shader, and brings its own lights and reflections.
import * as THREE from '../lib/three.module.min.js';

const C = c => new THREE.Color(c);
const rand = (a, b) => a + Math.random() * (b - a);
let seed = 1;
const srand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

function tex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}

const SKY_VS = 'varying vec3 vP; void main(){ vP = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }';
const SKY_FS = `varying vec3 vP; uniform vec3 uTop, uMid, uBot, uSun, uSunDir; uniform float uSunSize, uStars, uT, uHz;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    float y = vP.y;
    vec3 c = mix(uBot, uMid, smoothstep(uHz - 0.08, uHz + 0.12, y));
    c = mix(c, uTop, smoothstep(uHz + 0.1, 0.75, y));
    float d = distance(vP, normalize(uSunDir));
    c += uSun * (smoothstep(uSunSize, uSunSize * 0.92, d) * 1.6 + exp(-d * 6.0 / max(uSunSize, 0.02)) * 0.5 + exp(-d * 2.2) * 0.25);
    if (uStars > 0.0) {
      vec2 g = vec2(atan(vP.z, vP.x) * 120.0, vP.y * 120.0);
      vec2 id = floor(g); float r = h21(id);
      float s = step(0.985, r) * smoothstep(0.5, 0.0, length(fract(g) - 0.5)) * (0.6 + 0.4 * sin(uT * 2.0 + r * 50.0));
      c += vec3(s) * uStars * smoothstep(0.05, 0.4, y);
    }
    gl_FragColor = vec4(c, 1.0);
  }`;

function sky(o) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      uTop: { value: C(o.top) }, uMid: { value: C(o.mid) }, uBot: { value: C(o.bot) }, uSun: { value: C(o.sun || '#000') },
      uSunDir: { value: new THREE.Vector3(...(o.sunDir || [0, 0.1, -1])) }, uSunSize: { value: o.sunSize || 0.08 }, uStars: { value: o.stars || 0 }, uT: { value: 0 }, uHz: { value: o.hz ?? 0.05 },
    },
    vertexShader: SKY_VS, fragmentShader: SKY_FS,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(90, 48, 24), mat);
  m.renderOrder = -10; m.frustumCulled = false;
  return m;
}

function ridge(width, height, rough, color, z, y = 0, seedv = 3) {
  seed = seedv;
  const s = new THREE.Shape(); const n = 60;
  s.moveTo(-width / 2, -2);
  for (let i = 0; i <= n; i++) {
    const x = -width / 2 + (i / n) * width;
    const h = height * (0.55 + 0.45 * Math.sin(i * 0.35 + seedv) * Math.sin(i * 0.13 + seedv * 2)) + srand() * rough;
    s.lineTo(x, h);
  }
  s.lineTo(width / 2, -2);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: C(color), fog: true }));
  m.position.set(0, y, z);
  return m;
}

function floorMesh(map, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ map, roughness: o.rough ?? 0.4, metalness: 0, color: C(o.color || '#ffffff'), envMapIntensity: o.env ?? 0.8 }));
  m.rotation.x = -Math.PI / 2; m.position.z = -6;
  return m;
}

function glowSprite(color, size, opacity = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,0.4)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: C(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity }));
  s.scale.set(size, size, 1);
  return s;
}

function candy(color, o = {}) {
  return new THREE.MeshPhysicalMaterial(Object.assign({ color: C(color), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }, o));
}

// a bright little room used only to make reflections on the jelly
function makeEnv(renderer, o) {
  const s = new THREE.Scene();
  const sk = sky({ top: o.top, mid: o.mid, bot: o.bot, sun: o.sun, sunDir: o.sunDir, sunSize: o.sunSize, hz: o.hz });
  sk.material.depthWrite = true; s.add(sk);
  const panel = (pos, w, h, col, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: C(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel([1, 9, 4], 7, 3, '#ffffff', o.keyK ?? 5);
  panel([-8, 3, 5], 3, 5, o.fill || '#ffe8f4', o.fillK ?? 3);
  panel([8, 2.5, 4], 3, 4, o.fill2 || '#d8f0ff', o.fillK ?? 3);
  panel([0, 3, -9], 9, 3, o.back || '#ffc890', o.backK ?? 2.5);
  panel([0, -6, 3], 12, 4, o.floor || '#402030', 0.6);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.035);
  pm.dispose();
  s.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); });
  return rt;
}

function lights(g, o) {
  const hemi = new THREE.HemisphereLight(C(o.sky || '#ffe0f0'), C(o.ground || '#402030'), o.hemi ?? 0.5); g.add(hemi);
  const key = new THREE.DirectionalLight(C(o.key || '#ffffff'), o.keyI ?? 2.6); key.position.set(...(o.keyPos || [2, 5, 4])); g.add(key);
  const rim = new THREE.DirectionalLight(C(o.rim || '#ff9fd0'), o.rimI ?? 3); rim.position.set(...(o.rimPos || [-3, 4.5, -4])); g.add(rim);
  const rim2 = new THREE.DirectionalLight(C(o.rim2 || '#a0d8ff'), o.rim2I ?? 2); rim2.position.set(4, 4.5, -4); g.add(rim2);
}

// ======================================================= SUGAR TEMPLE
function sugarTemple(g, R) {
  const skyO = { top: '#2a0d4a', mid: '#d8406e', bot: '#ffb25c', sun: '#ffd890', sunDir: [0.0, 0.07, -1], sunSize: 0.11, hz: 0.02 };
  g.add(sky(skyO));
  g.add(ridge(160, 7, 1.2, '#7a2a6a', -55, -1, 2));
  g.add(ridge(130, 4.5, 0.8, '#521c56', -40, -1, 7));
  g.add(ridge(110, 2.6, 0.5, '#36123e', -28, -0.6, 11));
  const floorT = tex(512, 512, (x, w, h) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = 30 + ((i + j) % 2) * 10 + Math.random() * 6;
      const grd = x.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
      grd.addColorStop(0, `rgb(${v + 70},${v + 32},${v + 10})`); grd.addColorStop(1, `rgb(${v + 38},${v + 14},${v})`);
      x.fillStyle = grd; x.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
      x.fillStyle = 'rgba(255,220,180,0.12)'; x.fillRect(i * s + 8, j * s + 8, s - 16, 6);
    }
  }, [30, 15]);
  g.add(floorMesh(floorT, { rough: 0.32 }));
  // gumdrop pillars along the back
  const cols = ['#ff4f7a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff'];
  for (let i = -5; i <= 5; i++) {
    const x = i * 2.6, z = -4.2 - (i % 2 === 0 ? 0 : 0.6);
    const col = cols[(i + 5) % cols.length];
    const mat = candy(col, { roughness: 0.35, sheen: 1, sheenColor: C('#ffffff'), emissive: C(col).multiplyScalar(0.08) });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 3.2, 20), mat); shaft.position.set(x, 1.6, z);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat); cap.scale.set(1, 0.9, 1); cap.position.set(x, 3.2, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.25, 20), candy('#ffe9c8', { roughness: 0.5 })); base.position.set(x, 0.12, z);
    g.add(shaft, cap, base);
    if (i < 5) { // lanterns between pillars
      const lx = x + 1.3, ly = 2.55;
      const lan = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: C('#ffcf7a') })); lan.scale.set(1, 1.25, 1); lan.position.set(lx, ly, z + 0.3);
      const gl = glowSprite('#ffb050', 1.6, 0.8); gl.position.copy(lan.position);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.65), new THREE.MeshBasicMaterial({ color: '#40202a' })); rope.position.set(lx, ly + 0.55, z + 0.3);
      g.add(lan, gl, rope);
      R.swing.push({ o: lan, gl, base: lan.position.clone(), ph: i });
    }
  }
  // the gong
  const gong = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.08, 40), new THREE.MeshPhysicalMaterial({ color: C('#ffb830'), metalness: 1, roughness: 0.28, clearcoat: 0.5 }));
  gong.rotation.x = Math.PI / 2; gong.position.set(0, 2.1, -6.2); g.add(gong);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.09, 8, 4, Math.PI), candy('#6a1a3a')); frame.position.set(0, 1.9, -6.25); frame.rotation.z = 0; g.add(frame);
  // gumdrop bushes at the edges
  for (let i = 0; i < 14; i++) {
    const x = (i % 2 ? 1 : -1) * rand(4.5, 12), z = rand(-3.4, -1.6);
    const col = cols[i % cols.length];
    const m = new THREE.Mesh(new THREE.SphereGeometry(rand(0.25, 0.45), 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), candy(col, { roughness: 0.45, sheen: 1, emissive: C(col).multiplyScalar(0.1) }));
    m.position.set(x, 0, z); g.add(m);
  }
  R.env = { ...skyO, back: '#ffb070', fill: '#ffd0e0', keyK: 4.5 };
  R.lights = { sky: '#ffd8e8', ground: '#3a1830', hemi: 0.55, key: '#fff0e0', keyI: 2.4, rim: '#ff8ac0', rimI: 3.2, rim2: '#ffc070', rim2I: 2.2 };
  R.fog = ['#c04a6e', 22, 70];
  R.ambient = (dt, fx) => { if (Math.random() < dt * 14) fx.sparks.emit(rand(-7, 7), rand(0.2, 3), rand(-3, 1), rand(-0.1, 0.1), rand(0.05, 0.25), 0, C('#ffd8a0'), rand(0.03, 0.07), rand(2, 4), -0.02, 0.2); };
  R.dust = '#c89a80'; R.music = 'fight1';
}

// ===================================================== LICORICE BRIDGE
function licoriceBridge(g, R) {
  const skyO = { top: '#060a24', mid: '#16345c', bot: '#3a7a8a', sun: '#e8f4ff', sunDir: [0.35, 0.32, -1], sunSize: 0.075, stars: 1.2, hz: 0.0 };
  g.add(sky(skyO));
  g.add(ridge(170, 9, 1.5, '#0c1a34', -60, -3, 5));
  g.add(ridge(130, 5, 1, '#0a1428', -42, -3, 9));
  // caramel river glow far below
  const river = new THREE.Mesh(new THREE.PlaneGeometry(200, 40), new THREE.MeshBasicMaterial({ color: C('#6a2a10') }));
  river.rotation.x = -Math.PI / 2; river.position.set(0, -6, -30); g.add(river);
  
  const plankT = tex(512, 256, (x, w, h) => {
    const n = 8, s = w / n;
    for (let i = 0; i < n; i++) {
      const red = i % 2 === 0;
      const grd = x.createLinearGradient(i * s, 0, i * s + s, 0);
      grd.addColorStop(0, red ? '#a3102a' : '#1a0c12'); grd.addColorStop(0.5, red ? '#e0304a' : '#3a1a24'); grd.addColorStop(1, red ? '#8a0a20' : '#120810');
      x.fillStyle = grd; x.fillRect(i * s + 2, 0, s - 4, h);
      x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 3;
      for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(i * s + 6 + k * 7, 0); x.lineTo(i * s + 6 + k * 7 + 20, h); x.stroke(); }
    }
  }, [24, 3]);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(60, 0.3, 4.4), [null, null, new THREE.MeshStandardMaterial({ map: plankT, roughness: 0.55, envMapIntensity: 0.6 }), null, null, null].map(m => m || new THREE.MeshStandardMaterial({ color: '#2a0a14', roughness: 0.5 })));
  deck.position.set(0, -0.15, -0.6); g.add(deck);
  // twisted licorice rope railings + posts
  const ropeMat = candy('#d0203a', { roughness: 0.3 });
  for (const z of [-2.6]) {
    const pts = []; for (let i = 0; i <= 60; i++) { const x = -30 + i; pts.push(new THREE.Vector3(x, 1.25 - 0.25 * Math.sin((i % 4) / 4 * Math.PI), z)); }
    const r = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.07, 8), ropeMat); g.add(r);
    for (let i = -14; i <= 14; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.4, 12), candy('#1a0a10', { roughness: 0.35 })); p.position.set(i * 2, 0.6, z); g.add(p); }
  }
  // floating sky lanterns
  for (let i = 0; i < 14; i++) {
    const lan = glowSprite(i % 3 ? '#ffb060' : '#ff7090', rand(0.6, 1.4), 0.9); lan.position.set(rand(-25, 25), rand(2, 12), rand(-30, -10)); g.add(lan);
    R.float.push({ o: lan, base: lan.position.clone(), ph: rand(0, 6), sp: rand(0.2, 0.5) });
  }
  R.env = { ...skyO, back: '#ff9a40', backK: 1.4, fill: '#a0c8ff', fill2: '#ffc080', fillK: 2.2, keyK: 3, floor: '#401018' };
  R.lights = { sky: '#8090c8', ground: '#401020', hemi: 0.4, key: '#e8f0ff', keyI: 2.1, keyPos: [3, 5, 3], rim: '#ff9a40', rimI: 3.2, rimPos: [-2, 4.5, -5], rim2: '#80c0ff', rim2I: 2.4 };
  R.fog = ['#16345c', 25, 90];
  R.ambient = (dt, fx) => { if (Math.random() < dt * 10) fx.glows.emit(rand(-8, 8), -1, rand(-6, -2), rand(-0.1, 0.1), rand(0.3, 0.7), 0, C('#ff9a40'), rand(0.05, 0.1), rand(3, 5), 0, 0); };
  R.dust = '#806070'; R.music = 'fight2';
}

// ============================================================== THE JAR
function theJar(g, R) {
  const skyO = { top: '#2a1a40', mid: '#7a4a5a', bot: '#c88a6a', sun: '#ffd890', sunDir: [-0.5, 0.25, -1], sunSize: 0.1, hz: 0.1 };
  g.add(sky(skyO));
  // the bedroom outside the glass, blurry blobs of colour
  const room = tex(1024, 512, (x, w, h) => {
    const grd = x.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#6a4a7a'); grd.addColorStop(0.6, '#c89a8a'); grd.addColorStop(1, '#8a5a4a'); x.fillStyle = grd; x.fillRect(0, 0, w, h);
    x.filter = 'blur(18px)';
    x.fillStyle = '#fff4d0'; x.fillRect(90, 60, 230, 200); // window
    x.fillStyle = '#ff8ab0'; x.fillRect(620, 280, 380, 160); // bed
    x.fillStyle = '#5ad1ff'; x.fillRect(420, 80, 120, 160); // poster
    x.fillStyle = '#ffd34f'; x.beginPath(); x.arc(830, 120, 60, 0, 7); x.fill(); // lamp
    x.fillStyle = '#4a2a20'; x.fillRect(0, 420, w, 92);
    x.filter = 'none';
  });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), new THREE.MeshBasicMaterial({ map: room, fog: false, color: C('#b89aa8') })); back.position.set(0, 8, -30); g.add(back);
  const lamp = glowSprite('#ffe8a0', 14, 0.45); lamp.position.set(22, 18, -29); g.add(lamp);
  // the glass wall: a big curved, glossy, see-through sheet
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 14, 64, 1, true, Math.PI * 0.78, Math.PI * 0.44), new THREE.MeshPhysicalMaterial({ color: '#e8f8ff', roughness: 0.06, metalness: 0, transparent: true, opacity: 0.07, clearcoat: 0.6, side: THREE.BackSide, depthWrite: false, envMapIntensity: 0.5 }));
  glass.position.set(0, 6, 9); g.add(glass);
  // glass rim highlights
  // the giant eye that peeks in
  const eye = new THREE.Group();
  const white = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 20), new THREE.MeshStandardMaterial({ color: '#fff6f0', roughness: 0.2 }));
  const iris = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 20), new THREE.MeshStandardMaterial({ color: '#4a8a3a', roughness: 0.3 })); iris.position.z = 2.0; iris.scale.z = 0.5;
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 16), new THREE.MeshStandardMaterial({ color: '#000', roughness: 0.1 })); pupil.position.z = 2.5; pupil.scale.z = 0.4;
  const lid = new THREE.Mesh(new THREE.SphereGeometry(3.08, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e8b8a0', roughness: 0.6 }));
  eye.add(white, iris, pupil, lid); eye.position.set(-30, 6, -22); g.add(eye);
  R.eye = { g: eye, lid, t: 0, next: 6 };
  // candy floor: sprinkles everywhere
  const floorT = tex(512, 512, (x, w, h) => {
    x.fillStyle = '#c87898'; x.fillRect(0, 0, w, h);
    const cols = ['#ff4f7a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff', '#ffffff', '#ff9a3a'];
    for (let i = 0; i < 900; i++) {
      x.save(); x.translate(Math.random() * w, Math.random() * h); x.rotate(Math.random() * 6);
      x.fillStyle = cols[i % cols.length]; x.beginPath(); x.roundRect ? x.roundRect(-9, -2.5, 18, 5, 2.5) : x.rect(-9, -2.5, 18, 5); x.fill(); x.restore();
    }
  }, [16, 8]);
  g.add(floorMesh(floorT, { rough: 0.6, env: 0.15 }));
  // piles of other candies at the back
  const cols = ['#ff4f7a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff', '#ff9a3a'];
  const bean = new THREE.CapsuleGeometry(0.16, 0.2, 6, 12);
  const disc = new THREE.SphereGeometry(0.28, 20, 12); disc.scale(1, 0.45, 1);
  seed = 21;
  for (let i = 0; i < 70; i++) {
    const x = (srand() * 2 - 1) * 14, z = -2.6 - srand() * 5, y = srand() * Math.max(0, (-z - 2.2)) * 0.45;
    const col = cols[i % cols.length];
    const m = new THREE.Mesh(i % 2 ? bean : disc, candy(col, { roughness: 0.2, emissive: C(col).multiplyScalar(0.06) }));
    m.position.set(x, y + 0.12, z); m.rotation.set(srand() * 3, srand() * 3, srand() * 3); g.add(m);
  }
  R.env = { ...skyO, back: '#ffe0b0', backK: 2, fill: '#ffd8f0', fill2: '#fff0c8', fillK: 2.4, keyK: 4.2, floor: '#a07080' };
  R.lights = { sky: '#fff0e0', ground: '#806070', hemi: 0.45, key: '#fff4e0', keyI: 2.3, keyPos: [-3, 6, 4], rim: '#ffd0a0', rimI: 2.6, rim2: '#ffb0d0', rim2I: 2 };
  R.fog = ['#4a3040', 26, 90];
  R.ambient = null;
  R.dust = '#ffd0e0'; R.music = 'fight1';
}

// =========================================================== SOUR SWAMP
function sourSwamp(g, R) {
  const skyO = { top: '#040c08', mid: '#123a26', bot: '#6ac83a', sun: '#d8ff9a', sunDir: [-0.3, 0.05, -1], sunSize: 0.05, hz: -0.02, stars: 0.5 };
  g.add(sky(skyO));
  g.add(ridge(160, 6, 2, '#0e3a24', -50, -1, 4));
  g.add(ridge(120, 3.5, 1.5, '#0a2a1a', -34, -0.8, 8));
  const floorT = tex(512, 512, (x, w, h) => {
    x.fillStyle = '#1a2e1c'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = Math.random(); x.fillStyle = v < 0.5 ? 'rgba(160,255,90,0.08)' : v < 0.8 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, Math.random() * 7, 0, 7); x.fill(); }
  }, [14, 7]);
  g.add(floorMesh(floorT, { rough: 0.75, env: 0.1, color: '#9ab89a' }));
  // glowing sour pools
  for (const [x, z, s] of [[-7, -3, 2], [6, -3.5, 2.6], [12, -2.5, 1.4], [-13, -2.8, 2.2]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(s, 32), new THREE.MeshBasicMaterial({ color: '#7aff2a' })); p.rotation.x = -Math.PI / 2; p.scale.set(1.5, 0.7, 1); p.position.set(x, 0.01, z); g.add(p);
    const gl = glowSprite('#6aff20', s * 3, 0.5); gl.position.set(x, 0.4, z); g.add(gl);
    R.bubbles.push({ x, z, s });
  }
  // giant sour worms swaying in the back
  const wormCols = [['#ff4f7a', '#5ad1ff'], ['#ffd34f', '#ff4f7a'], ['#9cff6a', '#c890ff'], ['#5ad1ff', '#ffd34f']];
  for (let i = 0; i < 6; i++) {
    const x = -15 + i * 6 + rand(-1, 1), z = -6 - (i % 2) * 3;
    const pts = []; for (let k = 0; k <= 10; k++) pts.push(new THREE.Vector3(Math.sin(k * 0.6) * 0.6, k * 0.55, Math.cos(k * 0.5) * 0.3));
    const curve = new THREE.CatmullRomCurve3(pts);
    const [c1, c2] = wormCols[i % wormCols.length];
    const geo = new THREE.TubeGeometry(curve, 60, 0.34, 14);
    // two-tone: colour by height
    const col = new Float32Array(geo.attributes.position.count * 3); const a = C(c1), b = C(c2);
    for (let v = 0; v < geo.attributes.position.count; v++) { const y = geo.attributes.position.getY(v); const t = y < 2.7 ? 0 : 1; const c = t ? b : a; col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.4, envMapIntensity: 0.5, emissive: C('#081008') }));
    const w = new THREE.Group(); w.add(m); w.position.set(x, -0.3, z); w.scale.setScalar(rand(0.9, 1.3)); g.add(w);
    R.sway.push({ o: w, ph: rand(0, 6), amp: rand(0.08, 0.15) });
  }
  // dead candy-cane trees
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.09, 8, 16, Math.PI), candy('#e8f0e0', { roughness: 0.4 }));
    t.position.set(rand(-16, 16), 2.4, rand(-9, -4)); g.add(t);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 10), t.material); s.position.set(t.position.x + 0.5, 1.2, t.position.z); g.add(s);
  }
  R.env = { ...skyO, back: '#a8ff5a', backK: 1.8, fill: '#d8ffa0', fill2: '#80ffd0', fillK: 2.4, keyK: 3.6, floor: '#102010' };
  R.lights = { sky: '#a0d890', ground: '#081008', hemi: 0.3, key: '#f0ffe0', keyI: 2.2, rim: '#8aff3a', rimI: 1.3, rim2: '#40ffd0', rim2I: 1.1 };
  R.fog = ['#10301e', 16, 70];
  R.ambient = (dt, fx) => {
    if (Math.random() < dt * 12) fx.glows.emit(rand(-8, 8), rand(0.3, 2.6), rand(-3, 1), rand(-0.3, 0.3), rand(-0.1, 0.2), rand(-0.1, 0.1), C('#d8ff60'), rand(0.05, 0.09), rand(1.5, 3), 0, 0.5);
    for (const b of R.bubbles) if (Math.random() < dt * 2) fx.glows.emit(b.x + rand(-b.s, b.s), 0.05, b.z + rand(-0.4, 0.4), 0, rand(0.3, 0.6), 0, C('#a0ff50'), rand(0.12, 0.25), 0.8, 0, 0, 1);
  };
  R.dust = '#90b080'; R.music = 'fight2';
}

// ======================================================== GUMMOTH'S HALL
function gummothHall(g, R) {
  const skyO = { top: '#12020e', mid: '#3a0a2a', bot: '#7a1a40', sun: '#000000', hz: 0.1 };
  g.add(sky(skyO));
  // back wall with the big candy-glass rose window
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), new THREE.MeshStandardMaterial({ color: '#3a1028', roughness: 0.7 })); wall.position.set(0, 12, -12); g.add(wall);
  const rose = tex(512, 512, (x, w, h) => {
    const cx = w / 2, cy = h / 2; const cols = ['#ff3a7a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff', '#ff9a3a'];
    x.fillStyle = '#1a0610'; x.fillRect(0, 0, w, h);
    for (let ring = 3; ring >= 0; ring--) {
      const n = 6 + ring * 6;
      for (let i = 0; i < n; i++) {
        x.beginPath(); x.moveTo(cx, cy);
        x.arc(cx, cy, 60 + ring * 60, (i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2); x.closePath();
        x.fillStyle = cols[(i + ring) % cols.length]; x.fill(); x.lineWidth = 6; x.strokeStyle = '#1a0610'; x.stroke();
      }
    }
    x.fillStyle = '#fff3c0'; x.beginPath(); x.arc(cx, cy, 40, 0, 7); x.fill();
  });
  const rw = new THREE.Mesh(new THREE.CircleGeometry(5, 64), new THREE.MeshBasicMaterial({ map: rose, color: C('#ffffff').multiplyScalar(1.15) })); rw.position.set(0, 7.5, -11.9); g.add(rw);
  const rrim = new THREE.Mesh(new THREE.TorusGeometry(5.05, 0.25, 12, 64), new THREE.MeshPhysicalMaterial({ color: '#ffc040', metalness: 1, roughness: 0.3 })); rrim.position.copy(rw.position); g.add(rrim);
  const rglow = glowSprite('#ff70c0', 18, 0.35); rglow.position.set(0, 7.5, -11.5); g.add(rglow);
  // twisted licorice columns
  for (const x of [-9, -5.2, 5.2, 9]) {
    const pts = []; for (let k = 0; k <= 30; k++) pts.push(new THREE.Vector3(Math.cos(k * 0.9) * 0.12, k * 0.3, Math.sin(k * 0.9) * 0.12));
    const col = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.42, 12), candy('#c0102a', { roughness: 0.3 }));
    col.position.set(x, 0, -5); g.add(col);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.4, 16), new THREE.MeshPhysicalMaterial({ color: '#ffc040', metalness: 1, roughness: 0.3 })); cap.position.set(x, 9, -5); g.add(cap);
    // braziers
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.2, 0.5, 16), new THREE.MeshPhysicalMaterial({ color: '#ffc040', metalness: 1, roughness: 0.35 })); br.position.set(x, 1.8, -4.3); g.add(br);
    const fl = glowSprite('#ff5ab0', 2.2, 0.9); fl.position.set(x, 2.3, -4.3); g.add(fl);
    R.flames.push({ x, y: 2.1, z: -4.3, o: fl });
  }
  // the jelly throne
  const throneMat = new THREE.MeshPhysicalMaterial({ color: '#c04a90', roughness: 0.2, clearcoat: 1, emissive: C('#3a0628'), envMapIntensity: 0.6 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 2, 4, 2, 2), throneMat); seat.position.set(0, 0.6, -8); g.add(seat);
  const backr = new THREE.Mesh(new THREE.CapsuleGeometry(1.3, 2.5, 8, 16), throneMat); backr.scale.set(1.2, 1, 0.4); backr.position.set(0, 2.8, -9); g.add(backr);
  // checkered floor and red carpet
  const floorT = tex(512, 512, (x, w, h) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = (i + j) % 2 ? '#1a0614' : '#7a3a62'; x.fillRect(i * s, j * s, s, s); }
    x.fillStyle = 'rgba(255,255,255,0.08)'; for (let k = 0; k < 40; k++) { x.beginPath(); x.moveTo(Math.random() * w, Math.random() * h); x.lineTo(Math.random() * w, Math.random() * h); x.lineWidth = 1; x.strokeStyle = 'rgba(255,255,255,0.1)'; x.stroke(); }
  }, [30, 15]);
  g.add(floorMesh(floorT, { rough: 0.2, env: 0.55 }));
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4, 14), new THREE.MeshStandardMaterial({ color: '#6a0618', roughness: 0.9, envMapIntensity: 0.3 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.006, -6); g.add(carpet);
  for (const x of [-2.05, 2.05]) { const t = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 14), new THREE.MeshStandardMaterial({ color: '#ffc040', metalness: 1, roughness: 0.3 })); t.rotation.x = -Math.PI / 2; t.position.set(x, 0.008, -6); g.add(t); }
  R.env = { ...skyO, back: '#ff70c0', backK: 2, fill: '#ffc0e0', fill2: '#ffd890', fillK: 2.4, keyK: 4, floor: '#200818' };
  R.lights = { sky: '#e0a0c8', ground: '#200818', hemi: 0.35, key: '#ffe8f0', keyI: 2.3, rim: '#ff5ab0', rimI: 3.6, rim2: '#ffc040', rim2I: 2.4 };
  R.fog = ['#2a0820', 20, 60];
  R.ambient = (dt, fx) => { for (const f of R.flames) if (Math.random() < dt * 20) fx.glows.emit(f.x + rand(-0.15, 0.15), f.y, f.z, rand(-0.1, 0.1), rand(0.6, 1.2), 0, C(Math.random() < 0.5 ? '#ff5ab0' : '#ffb0e0'), rand(0.15, 0.3), rand(0.5, 0.9), -0.5, 0.5, -0.5); };
  R.dust = '#e0a0c0'; R.music = 'boss';
}

export const STAGES = [
  { key: 'temple', name: 'SUGAR TEMPLE', build: sugarTemple, thumb: ['#2a0d4a', '#d8406e', '#ffb25c'] },
  { key: 'bridge', name: 'LICORICE BRIDGE', build: licoriceBridge, thumb: ['#060a24', '#16345c', '#ff9a3a'] },
  { key: 'jar', name: 'THE JAR', build: theJar, thumb: ['#3a2a50', '#c89a8a', '#ffe8f0'] },
  { key: 'swamp', name: 'SOUR SWAMP', build: sourSwamp, thumb: ['#06140e', '#1c5a3a', '#a8ff5a'] },
  { key: 'hall', name: "GUMMOTH'S HALL", build: gummothHall, thumb: ['#12020e', '#7a1a40', '#ff70c0'] },
];
export const STAGE_BY_KEY = Object.fromEntries(STAGES.map(s => [s.key, s]));

export function buildStage(key, renderer) {
  const def = STAGE_BY_KEY[key] || STAGES[0];
  const g = new THREE.Group();
  const R = { key: def.key, name: def.name, swing: [], float: [], sway: [], bubbles: [], flames: [], group: g };
  def.build(g, R);
  lights(g, R.lights);
  R.envRT = makeEnv(renderer, R.env);
  R.update = (t, dt) => {
    g.traverse(o => { if (o.material && o.material.uniforms && o.material.uniforms.uT) o.material.uniforms.uT.value = t; });
    for (const s of R.swing) { const a = Math.sin(t * 1.3 + s.ph) * 0.06; s.o.position.set(s.base.x + a, s.base.y - Math.abs(a) * 0.3, s.base.z); s.gl.position.copy(s.o.position); }
    for (const f of R.float) { f.o.position.y = f.base.y + ((t * f.sp + f.ph) % 6) - 1; f.o.position.x = f.base.x + Math.sin(t * 0.4 + f.ph); }
    for (const s of R.sway) { s.o.rotation.z = Math.sin(t * 0.8 + s.ph) * s.amp; s.o.rotation.x = Math.cos(t * 0.6 + s.ph) * s.amp * 0.5; }
    for (const f of R.flames) { const k = 2 + Math.sin(t * 13 + f.x) * 0.25 + Math.sin(t * 7.3 + f.x * 2) * 0.2; f.o.scale.set(k, k * 1.3, 1); }
    if (R.eye) {
      const e = R.eye; e.t += dt;
      const cyc = (e.t % 14);
      const peek = cyc < 5 ? Math.min(1, cyc / 1.2) * Math.min(1, (5 - cyc) / 1.2) : 0;
      e.g.position.x = -32 + peek * 26; e.g.position.y = 6 + Math.sin(e.t * 0.7) * 0.5;
      e.g.lookAt(0, 1, 6);
      const blink = (cyc > 2.2 && cyc < 2.4) ? 1 : 0;
      e.lid.rotation.x = -Math.PI / 2 + (blink ? Math.PI / 2 : 0.25);
    }
  };
  R.dispose = () => { g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { if (m.map) m.map.dispose(); m.dispose(); } } }); R.envRT.dispose(); };
  return R;
}
