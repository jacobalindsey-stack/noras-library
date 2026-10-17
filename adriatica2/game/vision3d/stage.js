// ADRIATICA — vision level render stage.
//
// Deliberately mid-90s: orthographic, flat-shaded, untextured, no antialiasing,
// dense fog, one directional light plus ambient, and a low internal resolution
// upscaled with nearest-neighbour filtering.
//
// The low-res raster is done by sizing the WebGL backing store to 960x540 and
// letting CSS scale the canvas up with image-rendering:pixelated. That is one
// moving part instead of three (no render target, no blit scene, no colour
// space round trip). If a later pass needs to read the low-res buffer —
// dithering, vertex jitter — this becomes a WebGLRenderTarget and the blit
// comes back. Noted as a deviation from the brief, easily reversed.
//
// Colour management is OFF and output is linear, so palette hex values land on
// screen literally, the way a renderer of the era would treat them.

import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';
import { PALETTES } from './palette.js';
import { buildLevel } from './builder.js';
import { Figure } from './figure.js';
import { findPath, reachableSet } from './pathing.js';

THREE.ColorManagement.enabled = false;

export class VisionStage {
  constructor(container, opts = {}) {
    this.container = container;
    this.internalW = opts.internalWidth || 960;
    this.internalH = opts.internalHeight || 540;
    this.pixelSnap = opts.pixelSnap !== false;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText =
      'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);' +
      'image-rendering:pixelated;image-rendering:crisp-edges;display:block;';
    container.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.shadowMap.enabled = false;

    this.scene = new THREE.Scene();

    this.ambient = new THREE.AmbientLight(0xffffff, opts.ambient ?? 1.3);
    this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight(0xffffff, opts.sun ?? 2.75);
    this.sun.position.set(6, 10, 3.5);
    this.scene.add(this.sun);

    this.viewSize = opts.viewSize || 28;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    // Ninety-degree steps. The camera is the only thing that turns; the world
    // never moves. Connection is a fact about the projected image, so it is
    // recomputed whenever the orbit changes.
    this.orbit = 0;
    // Two nodes this close on screen (in units of canvas height) but NOT
    // already joined in world space read as touching, and she may step between
    // them. This is the whole Monument Valley trick and it lives here.
    this.joinRadius = opts.joinRadius ?? 0.03;
    // World-space join tolerance; see rebuildConnections(). 0.51 reproduces the
    // wiring the levels were authored and solver-verified against (0.03 NDC at
    // the authoring viewSize of 34).
    this.joinWorld = opts.joinWorld ?? 0.51;
    // Vertical camera follow for tall levels (see followFigure).
    this.follow = opts.follow ?? false;
    this.followLift = opts.followLift ?? 2.5;
    this.followLag = opts.followLag ?? 2.2;
    this.screenEdges = [];
    this.screenEdgeSet = new Set();
    this.effectiveAdjacency = null;
    this.elevation = opts.elevation ?? 0.82;
    this.camDistance = opts.camDistance ?? 60;
    this.target = new THREE.Vector3(0, 0, 0);

    this.debugGroup = new THREE.Group();
    this.debugGroup.visible = false;
    this.scene.add(this.debugGroup);

    this.level = null;
    this.figure = null;
    this.currentNode = -1;
    this.path = null;
    this.pathIndex = 0;
    this.speed = opts.speed ?? 3.6;
    // Generous by design: a click within this fraction of the canvas height
    // of a node's projected position counts as aimed at it.
    this.pickRadius = opts.pickRadius ?? 0.075;
    this.onArrive = null;
    this._clock = null;
    this.fogNear = opts.fogNear ?? 40;
    this.fogFar = opts.fogFar ?? 92;

    this._onResize = () => this.resize();
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(this._onResize);
      this._ro.observe(container);
    }
    window.addEventListener('resize', this._onResize);

    this._running = false;
    this._frame = null;
  }

  setLayout(layout) {
    const paletteName = layout.palette || 'gap';
    const palette = PALETTES[paletteName];
    if (!palette) throw new Error('[vision3d] unknown palette: ' + paletteName);
    this.palette = palette;
    this.paletteName = paletteName;

    this.disposeLevel();
    this.currentNode = -1;
    this.path = null;
    this.level = buildLevel(layout, palette, paletteName);
    this.scene.add(this.level.group);

    this.scene.background = new THREE.Color(palette.void);
    // A layout may carry its own atmosphere and camera behaviour, so the
    // harness and the mounted game frame it identically.
    if (layout.fogNear != null) this.fogNear = layout.fogNear;
    if (layout.fogFar != null) this.fogFar = layout.fogFar;
    if (layout.follow != null) this.follow = layout.follow;
    if (layout.followLift != null) this.followLift = layout.followLift;
    this.scene.fog = new THREE.Fog(palette.void, this.fogNear, this.fogFar);

    if (layout.viewSize) this.viewSize = layout.viewSize;
    if (layout.target) this.target.fromArray(layout.target);
    else this.level.bounds.getCenter(this.target);

    this.buildDebugNodes();
    this.updateCamera();
    this.rebuildConnections();
    this.resize();
    return this.level;
  }

  buildDebugNodes() {
    while (this.debugGroup.children.length) {
      const c = this.debugGroup.children.pop();
      c.geometry.dispose();
      c.material.dispose();
    }
    if (!this.level) return;
    const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff5aa0, fog: false });
    this.level.nodes.forEach((n) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(n.pos).setY(n.pos.y + 0.2);
      this.debugGroup.add(m);
    });
  }

  set showNodes(v) { this.debugGroup.visible = !!v; }
  get showNodes() { return this.debugGroup.visible; }

  updateCamera() {
    // orbitAngle is the CONTINUOUS camera angle in quarter-turns; orbit is the
    // discrete resting position the puzzle is wired against. They differ only
    // mid-sweep.
    const q = this.orbitAngle != null ? this.orbitAngle : this.orbit;
    const a = (Math.PI / 4) + q * (Math.PI / 2);
    const d = this.camDistance;
    this.camera.position.set(
      this.target.x + Math.cos(a) * d,
      this.target.y + this.elevation * d,
      this.target.z + Math.sin(a) * d
    );
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
    // project() reads matrixWorldInverse; keep it current outside the render loop.
    this.camera.updateMatrixWorld(true);
  }

  // Snap to the next/previous 90 degrees. The world holds still; what changes
  // is which pieces line up, and therefore where she can go.
  //
  // The turn is SWEPT, not cut. A hard 90° jump gave the player no way to see
  // which terrace had moved past which, and that reading is the entire puzzle.
  // Connections are rebuilt only once the sweep lands, so the walkable graph is
  // always the one the solver verified at a resting orbit — never a half-turn.
  rotate(dir) {
    if (this._sweep) return this.orbit;
    const from = this.orbit;
    const to = ((from + (dir < 0 ? 3 : 1)) % 4 + 4) % 4;
    // Go the short way round the circle rather than unwinding 3 quarters.
    const delta = dir < 0 ? -1 : 1;
    this._sweep = { from, to, at: from, delta, t: 0, dur: this.sweepDur ?? 0.55 };
    this.orbit = to;
    return this.orbit;
  }

  // Called from the render loop. Returns true while a turn is in flight.
  updateSweep(dt) {
    const s = this._sweep;
    if (!s) return false;
    s.t = Math.min(1, s.t + dt / s.dur);
    // Ease in-out so the start and the landing are both readable.
    const e = s.t < 0.5 ? 2 * s.t * s.t : 1 - Math.pow(-2 * s.t + 2, 2) / 2;
    this.orbitAngle = s.from + s.delta * e;
    this.updateCamera();
    if (s.t >= 1) {
      this._sweep = null;
      this.orbitAngle = null;
      this.setOrbit(s.to);
      if (this.onSweepEnd) this.onSweepEnd(s.to);
      return false;
    }
    return true;
  }

  get sweeping() { return !!this._sweep; }

  rotateNow(dir) {
    this._sweep = null;
    this.orbitAngle = null;
    this.orbit = ((this.orbit + (dir < 0 ? 3 : 1)) % 4 + 4) % 4;
    this.updateCamera();
    this.rebuildConnections();
    return this.orbit;
  }

  setOrbit(o) {
    this._sweep = null;
    this.orbitAngle = null;
    this.orbit = ((o % 4) + 4) % 4;
    this.updateCamera();
    this.rebuildConnections();
    return this.orbit;
  }

  // World edges are permanent; screen edges depend on the orbit. The effective
  // graph the figure walks is their union, recomputed on every turn.
  rebuildConnections() {
    if (!this.level) return;
    const nodes = this.level.nodes;
    const worldAdj = this.level.adjacency;
    const proj = nodes.map((_, i) => this.projectNode(i));
    const aspect = this.internalW / this.internalH;
    // The join tolerance is authored in WORLD units (a fraction of a tile) and
    // converted to NDC here. Keeping it in NDC coupled the puzzle's wiring to
    // viewSize, so zooming out to make a level legible silently invented new
    // connections. viewSize is the ortho frustum height, so NDC y spans it.
    const r = this.joinWorld != null
      ? this.joinWorld / (this.viewSize / 2)
      : this.joinRadius;

    // Existing world edges, as a set, so we never duplicate one as illusory.
    const worldKey = new Set();
    for (let a = 0; a < worldAdj.length; a++) {
      for (const b of worldAdj[a]) worldKey.add(a < b ? a + '|' + b : b + '|' + a);
    }

    const screenEdges = [];
    const screenSet = new Set();
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const key = a + '|' + b;
        if (worldKey.has(key)) continue;
        const dx = (proj[a].x - proj[b].x) * aspect;
        const dy = proj[a].y - proj[b].y;
        if (Math.hypot(dx, dy) <= r) {
          screenEdges.push([a, b]);
          screenSet.add(key);
        }
      }
    }
    this.screenEdges = screenEdges;
    this.screenEdgeSet = screenSet;

    // Union graph.
    const eff = worldAdj.map((a) => a.slice());
    screenEdges.forEach(([a, b]) => { eff[a].push(b); eff[b].push(a); });
    this.effectiveAdjacency = eff;
  }

  // The graph the figure actually walks right now.
  adjacency() {
    return this.effectiveAdjacency || (this.level ? this.level.adjacency : []);
  }

  isScreenEdge(a, b) {
    return this.screenEdgeSet.has(a < b ? a + '|' + b : b + '|' + a);
  }

  // Nearest node to a world position — resolves a layout's start/goal hints.
  resolveNode(pos) {
    if (!this.level) return -1;
    let best = -1, bestD = Infinity;
    this.level.nodes.forEach((n, i) => {
      const d = Math.hypot(n.pos.x - pos[0], n.pos.y - pos[1], n.pos.z - pos[2]);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  // Effective graph at a given orbit, without disturbing the current view.
  // Used by the solver to reason across all four orientations.
  adjacencyForOrbit(o) {
    const saved = this.orbit;
    this.setOrbit(o);
    const adj = this.effectiveAdjacency.map((a) => a.slice());
    this.setOrbit(saved);
    return adj;
  }

  // Screen edges present at each orbit — for reporting / debugging.
  screenEdgesForOrbit(o) {
    const saved = this.orbit;
    this.setOrbit(o);
    const edges = this.screenEdges.map((e) => e.slice());
    this.setOrbit(saved);
    return edges;
  }

  setFog(near, far) {
    this.fogNear = near;
    this.fogFar = far;
    if (this.scene.fog) {
      this.scene.fog.near = near;
      this.scene.fog.far = far;
    }
  }

  setInternalResolution(w, h) {
    this.internalW = w;
    this.internalH = h;
    this.resize();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const cw = Math.max(1, rect.width);
    const ch = Math.max(1, rect.height);

    this.renderer.setSize(this.internalW, this.internalH, false);

    let scale = Math.min(cw / this.internalW, ch / this.internalH);
    // Integer scale keeps every pixel the same size, which is most of the era.
    if (this.pixelSnap && scale >= 1) scale = Math.floor(scale);
    this.canvas.style.width = Math.round(this.internalW * scale) + 'px';
    this.canvas.style.height = Math.round(this.internalH * scale) + 'px';

    const aspect = this.internalW / this.internalH;
    const h = this.viewSize / 2;
    this.camera.left = -h * aspect;
    this.camera.right = h * aspect;
    this.camera.top = h;
    this.camera.bottom = -h;
    this.camera.updateProjectionMatrix();
  }

  // --- the figure ---

  spawnFigure(nodeId = 0) {
    if (!this.level) throw new Error('[vision3d] setLayout before spawnFigure');
    // She is the brightest thing in either palette — on gold terraces a gold
    // figure simply disappeared.
    const slot = this.palette.mira ? 'mira' : (this.paletteName === 'light' ? 'bone' : 'goldLight');
    if (!this.figure) {
      this.figure = new Figure(this.palette[slot]);
      this.figure.group.scale.setScalar(1.25);
      this.scene.add(this.figure.group);
    }
    this.currentNode = nodeId;
    this.path = null;
    this.figure.group.position.copy(this.level.nodes[nodeId].pos);
    return this.figure;
  }

  removeFigure() {
    if (!this.figure) return;
    this.scene.remove(this.figure.group);
    this.figure.dispose();
    this.figure = null;
    this.currentNode = -1;
    this.path = null;
  }

  // Whether a node may be stepped on at this moment. Level 2 overrides this
  // with the moving light; here everything walkable is open.
  isOpen(nodeIndex) {
    return this.nodeGate ? this.nodeGate(nodeIndex) : true;
  }

  // Project a node to canvas-relative coordinates in 0..1, y down.
  projectNode(nodeIndex) {
    const v = this.level.nodes[nodeIndex].pos.clone().project(this.camera);
    return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, depth: v.z };
  }

  // Nearest REACHABLE node to a canvas-relative point. Preferring reachable
  // is what makes the generous hit area actually generous; when nothing
  // reachable is near, the click returns null and nothing happens at all.
  pickNode(nx, ny) {
    if (!this.level || this.currentNode < 0) return null;
    const reach = reachableSet(this.adjacency(), this.currentNode, (i) => this.isOpen(i));
    const aspect = this.internalW / this.internalH;
    let best = null;
    reach.forEach((i) => {
      const p = this.projectNode(i);
      // Measure in units of canvas height so the radius is one number.
      const d = Math.hypot((p.x - nx) * aspect, p.y - ny);
      if (d > this.pickRadius) return;
      if (!best || d < best.d - 0.012 || (Math.abs(d - best.d) <= 0.012 && p.depth < best.depth)) {
        best = { i, d, depth: p.depth };
      }
    });
    return best ? best.i : null;
  }

  // Click anywhere; nothing happens if there is no route. No error, no shake,
  // no sound — silence is this game's answer to "not here".
  moveToPoint(nx, ny) {
    // Mid-turn the projection is in motion, so a tap would resolve against a
    // frame that no longer exists a moment later. Ignore it silently.
    if (this._sweep) return null;
    const target = this.pickNode(nx, ny);
    if (target === null || target === this.currentNode) return null;
    const path = findPath(this.adjacency(), this.currentNode, target, (i) => this.isOpen(i));
    if (!path || path.length < 2) return null;
    this.path = path;
    this.pathIndex = 1;
    return path;
  }

  update(dt) {
    this.updateSweep(dt);
    if (!this.figure) return;
    let moved = 0;
    if (this.path && this.pathIndex < this.path.length) {
      const fromNode = this.path[this.pathIndex - 1];
      const toNode = this.path[this.pathIndex];
      // An illusory (screen-space) step joins two points that coincide on
      // screen but sit far apart in world space. A straight world lerp between
      // them projects to almost no screen motion, so the join reads as one
      // step — but the raw distance is large, so cover it fast to avoid a
      // stall, and don't spin the figure to face a heading the camera hides.
      const illusory = this.isScreenEdge(fromNode, toNode);
      const targetPos = this.level.nodes[toNode].pos;
      const pos = this.figure.group.position;
      const dx = targetPos.x - pos.x;
      const dy = targetPos.y - pos.y;
      const dz = targetPos.z - pos.z;
      const dist = Math.hypot(dx, dy, dz);
      const step = (illusory ? this.speed * 6 : this.speed) * dt;
      if (dist <= step || dist < 1e-5) {
        pos.copy(targetPos);
        moved = illusory ? 0 : dist;
        this.currentNode = toNode;
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) {
          this.path = null;
          if (this.onArrive) this.onArrive(this.currentNode);
        }
      } else {
        const k = step / dist;
        pos.x += dx * k;
        pos.y += dy * k;
        pos.z += dz * k;
        moved = illusory ? 0 : step;
      }
      if (!illusory) this.figure.faceToward(dx, dz, dt);
    }
    this.figure.update(dt, moved);
    this.followFigure(dt);
  }

  // Keep her in frame on a tall level. Safe for the puzzle: under orthographic
  // projection the screen-space OFFSET between two nodes is invariant to camera
  // translation, so following changes what you can see, never what connects.
  followFigure(dt) {
    if (!this.follow || !this.figure) return;
    const want = this.figure.group.position.y + (this.followLift || 0);
    const k = 1 - Math.exp(-(this.followLag || 2.2) * dt);
    const dy = want - this.target.y;
    if (Math.abs(dy) < 0.001) return;
    this.target.y += dy * k;
    this.updateCamera();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    if (this._running) return;
    this._running = true;
    const loop = () => {
      if (!this._running) return;
      this._frame = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = this._clock === null ? 0 : Math.min(0.05, (now - this._clock) / 1000);
      this._clock = now;
      this.update(dt);
      this.render();
    };
    loop();
  }

  stop() {
    this._running = false;
    this._clock = null;
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = null;
  }

  disposeLevel() {
    if (!this.level) return;
    this.scene.remove(this.level.group);
    this.level.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    this.level.materials.forEach((m) => m.dispose());
    this.level = null;
  }

  dispose() {
    this.stop();
    this.removeFigure();
    this.disposeLevel();
    while (this.debugGroup.children.length) {
      const c = this.debugGroup.children.pop();
      c.geometry.dispose();
      c.material.dispose();
    }
    window.removeEventListener('resize', this._onResize);
    if (this._ro) this._ro.disconnect();
    this.renderer.dispose();
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
