// ADRIATICA — vision level controller.
//
// The isolated module the 2D game mounts and forgets. State in (a layout name
// and the shared AudioContext), a flag out (via onComplete). It owns a
// VisionStage, the input, the mercy path, the two figures of set dressing, and
// the win condition. Delete this folder and the 2D game is untouched; stub
// mount() to call onComplete immediately and nothing else changes.
//
// Two modes, one per level, chosen by layout.mode:
//   'rotate' — LOOK. The camera turns in 90° steps; connection is a fact about
//              the projected image, so turning changes where she can walk.
//   'light'  — WAIT. Two shafts of light move on fixed paths; she may only
//              stand on lit stone, and the last ledge lights only after she
//              has been still for several seconds.

import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';
import { VisionStage } from './stage.js';
import { LAYOUTS } from './layouts.js';
import { Figure } from './figure.js';
import { findPath, reachableSet } from './pathing.js';

const MERCY_DELAY = 90;          // seconds of unproductive wandering
const STILL_TO_LIGHT = 6;        // seconds of stillness to raise the last ledge

export class VisionLevel {
  constructor(container, opts = {}) {
    this.container = container;
    this.layout = opts.layout || LAYOUTS[opts.layoutName];
    if (!this.layout) throw new Error('[vision3d] no layout given');
    this.audioCtx = opts.audioCtx || null;   // shared context, for continuity checks
    this.onComplete = opts.onComplete || (() => {});
    this.flag = opts.flag || this.layout.flag || 'visionComplete';

    this.mode = this.layout.mode || 'rotate';
    this._done = false;
    this._lastProductive = 0;
    this._elapsed = 0;
    this._stillFor = 0;
    this._mercyNode = -1;
    this._finalLit = false;
    this._extraFigures = [];
    this._lightMeshes = [];
    this._teardown = [];
  }

  mount() {
    const stage = new VisionStage(this.container, {
      viewSize: this.layout.viewSize,
      // Tall levels track her vertically so the next terrace is always in
      // frame; flat ones stay locked to their authored framing.
      follow: this.layout.follow ?? false,
      followLift: this.layout.followLift,
      fogNear: this.layout.fogNear,
      fogFar: this.layout.fogFar,
    });
    this.stage = stage;
    stage.setLayout(this.layout);

    this.start = stage.resolveNode(this.layout.start || [0, 0, 0]);
    this.goal = stage.resolveNode(this.layout.goal || [0, 0, 0]);
    stage.spawnFigure(this.start);
    this._lastProductive = 0;

    if (this.layout.figures) this.placeFigures(this.layout.figures);
    if (this.mode === 'light') this.setupLights();

    stage.onArrive = (n) => this.onArrive(n);

    // Fold mercy / lights / stillness into the stage's frame loop.
    this.patchUpdate();

    this.wireInput();
    stage.start();
    return this;
  }

  // Fold our per-frame logic into the stage loop without the stage knowing
  // about levels: wrap update().
  patchUpdate() {
    const stage = this.stage;
    const baseUpdate = stage.update.bind(stage);
    stage.update = (dt) => {
      this.tick(dt);
      baseUpdate(dt);
    };
  }

  // --- input ---------------------------------------------------------------
  wireInput() {
    const el = this.container;
    const stage = this.stage;

    const pointerTo = (e) => {
      const r = stage.canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: (p.clientX - r.left) / r.width, y: (p.clientY - r.top) / r.height };
    };

    // Track press start for swipe-vs-tap.
    let downX = 0, downY = 0, downT = 0, moved = false;
    const onDown = (e) => { const p = e.touches ? e.touches[0] : e; downX = p.clientX; downY = p.clientY; downT = performance.now(); moved = false; };
    const onMove = (e) => { const p = e.touches ? e.touches[0] : e; if (Math.hypot(p.clientX - downX, p.clientY - downY) > 24) moved = true; };
    const onUp = (e) => {
      const p = e.changedTouches ? e.changedTouches[0] : e;
      const dx = p.clientX - downX;
      const dy = p.clientY - downY;
      // Horizontal swipe rotates (rotate mode only).
      if (this.mode === 'rotate' && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        this.rotate(dx < 0 ? 1 : -1);
        return;
      }
      if (moved) return; // a drag that wasn't a rotate: ignore
      const { x, y } = pointerTo(e.changedTouches ? { clientX: p.clientX, clientY: p.clientY } : e);
      this.tapMove(x, y);
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    this._teardown.push(() => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
    });

    if (this.mode === 'rotate') this.buildRotateControls();
  }

  buildRotateControls() {
    const make = (side) => {
      const b = document.createElement('div');
      b.style.cssText =
        'position:absolute;bottom:0;top:0;' + side + ':0;width:16%;min-width:64px;' +
        'display:flex;align-items:center;justify-content:center;z-index:6;cursor:pointer;' +
        '-webkit-tap-highlight-color:transparent;user-select:none;';
      const chev = document.createElement('div');
      chev.textContent = side === 'left' ? '\u2039' : '\u203a';
      chev.style.cssText =
        'font:300 54px/1 Georgia,serif;color:rgba(242,207,118,0.0);' +
        'text-shadow:0 2px 12px rgba(0,0,0,0.7);transition:color 0.4s ease;padding:0 6px;';
      b.appendChild(chev);
      b.addEventListener('pointerenter', () => { chev.style.color = 'rgba(242,207,118,0.9)'; });
      b.addEventListener('pointerleave', () => { chev.style.color = 'rgba(242,207,118,0.28)'; });
      // Faintly present at rest so a first-time player knows they exist.
      chev.style.color = 'rgba(242,207,118,0.28)';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.stage.sweeping) return;
        // Touch has no hover, so the chevron itself has to acknowledge the tap
        // and then settle back as the sweep lands.
        chev.style.color = 'rgba(255,232,168,1)';
        setTimeout(() => { chev.style.color = 'rgba(242,207,118,0.28)'; }, 620);
        this.rotate(side === 'left' ? -1 : 1);
      });
      this.container.appendChild(b);
      this._teardown.push(() => b.remove());
      return b;
    };
    make('left');
    make('right');
  }

  rotate(dir) {
    if (this._done) return;
    // Ignore a second input mid-sweep so a fast double-tap can't stack turns
    // and leave the player unable to tell where the camera ended up.
    if (this.stage.sweeping) return;
    this.stage.rotate(dir);
    // Rotating is itself a kind of progress: it defers the mercy hint.
    this._lastProductive = this._elapsed;
    this.clearMercy();
  }

  tapMove(x, y) {
    if (this._done) return;
    const path = this.stage.moveToPoint(x, y);
    if (path) {
      this._lastProductive = this._elapsed;
      this.clearMercy();
    }
  }

  // --- figures (set dressing) ---------------------------------------------
  // The three-together-and-one-apart arrangement from the Klis relief. Faceless
  // still poses; the player is meant to work out, in Level 2, that the empty
  // place among them is hers.
  placeFigures(defs) {
    const slot = this.stage.paletteName === 'light' ? 'greyBrown' : 'goldDeep';
    defs.forEach((d) => {
      const fig = new Figure(this.stage.palette[d.color ? d.color : slot]);
      fig.group.position.set(d.at[0], d.at[1], d.at[2]);
      fig.yaw = d.yaw ?? 0;
      fig.update(0, 0); // settle into the still pose
      if (d.scale) fig.group.scale.setScalar(d.scale);
      this.stage.scene.add(fig.group);
      this._extraFigures.push(fig);
    });
  }

  // --- moving light (Level 2) ---------------------------------------------
  setupLights() {
    const stage = this.stage;
    this.lights = (this.layout.lights || []).map((L) => ({
      path: L.path.map((p) => new THREE.Vector2(p[0], p[1])),
      radius: L.radius || 3,
      period: L.period || 18,
      phase: L.phase || 0,
      pos: new THREE.Vector2(L.path[0][0], L.path[0][1]),
    }));
    this.finalLedge = this.layout.finalLedge != null
      ? stage.resolveNode(this.layout.finalLedge) : -1;

    // A node is walkable when a light circle is over it; the final ledge is
    // dark until stillness raises it.
    stage.nodeGate = (i) => {
      if (i === this.finalLedge) return this._finalLit;
      const p = stage.level.nodes[i].pos;
      return this.lights.some((L) => Math.hypot(p.x - L.pos.x, p.z - L.pos.y) <= L.radius);
    };

    // Visible shafts: a translucent cylinder from the roof and a bright floor
    // disc, both riding each light's moving centre. The shafts are the subject
    // of the frame, so they get the one warm-white the palette allows.
    const warm = stage.palette.warmWhite ?? 0xfff6e2;
    this.lights.forEach((L) => {
      const shaftGeo = new THREE.CylinderGeometry(L.radius * 0.9, L.radius, 26, 20, 1, true);
      const shaftMat = new THREE.MeshBasicMaterial({
        color: warm, transparent: true, opacity: 0.16, side: THREE.DoubleSide,
        depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
      });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      const discGeo = new THREE.CircleGeometry(L.radius, 28);
      const discMat = new THREE.MeshBasicMaterial({
        color: warm, transparent: true, opacity: 0.5, fog: false, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.x = -Math.PI / 2;
      stage.scene.add(shaft);
      stage.scene.add(disc);
      this._lightMeshes.push({ shaft, disc, L });
    });
    this.buildLitMarkers(stage, warm);
  }

  // The shafts are vertical columns but the stone descends eight units, so a
  // floor disc never lands on the step she is actually judging. One small warm
  // tile per walkable node, lit only when its node is open, makes the moving
  // walkable SET the thing you read — which is the puzzle.
  buildLitMarkers(stage, warm) {
    const geo = new THREE.PlaneGeometry(1.04, 1.04);
    this._litMarkers = [];
    stage.level.nodes.forEach((n, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: warm, transparent: true, opacity: 0, fog: false,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(n.pos.x, n.pos.y + 0.045, n.pos.z);
      stage.scene.add(m);
      this._litMarkers.push({ mesh: m, mat, i });
    });
    this._litGeo = geo;
  }

  updateLitMarkers(dt) {
    if (!this._litMarkers) return;
    const gate = this.stage.nodeGate;
    this._litMarkers.forEach(({ mat, i }) => {
      const want = gate(i) ? 0.26 : 0;
      mat.opacity += (want - mat.opacity) * Math.min(1, dt * 6);
    });
  }

  updateLights(dt) {
    if (!this.lights) return;
    this.lights.forEach((L) => {
      L.phase = (L.phase + dt / L.period) % 1;
      // Piecewise-linear loop through the path points.
      const n = L.path.length;
      const f = L.phase * n;
      const i = Math.floor(f) % n;
      const t = f - Math.floor(f);
      const a = L.path[i], b = L.path[(i + 1) % n];
      L.pos.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    });
    this._lightMeshes.forEach(({ shaft, disc, L }) => {
      shaft.position.set(L.pos.x, 13, L.pos.y);
      disc.position.set(L.pos.x, 0.06, L.pos.y);
    });
  }

  // --- per-frame -----------------------------------------------------------
  tick(dt) {
    if (this._done) return;
    this._elapsed += dt;
    const walking = !!this.stage.path;

    if (this.mode === 'light') {
      this.updateLights(dt);
      this.updateLitMarkers(dt);
      // Stillness raises the final ledge — she cannot chase it.
      if (!walking && this.nearFinalLedge()) {
        this._stillFor += dt;
        if (this._stillFor >= STILL_TO_LIGHT && !this._finalLit) this.raiseFinalLedge();
      } else if (walking) {
        this._stillFor = 0;
      }
    }

    // Mercy: after long unproductive wandering, warm the next useful node.
    if (!this._done && this._mercyNode < 0 &&
        (this._elapsed - this._lastProductive) > MERCY_DELAY) {
      this.offerMercy();
    }
    if (this._mercyMesh) {
      const k = 0.5 + 0.5 * Math.sin(this._elapsed * 2.2);
      this._mercyMesh.material.opacity = 0.25 + 0.35 * k;
    }
  }

  nearFinalLedge() {
    if (this.finalLedge < 0) return false;
    // Standing on any graph-neighbour of the final ledge.
    return this.stage.level.adjacency[this.finalLedge].includes(this.stage.currentNode);
  }

  raiseFinalLedge() {
    this._finalLit = true;
    // A quiet arrival: the ledge gets its own soft disc of light.
    const p = this.stage.level.nodes[this.finalLedge].pos;
    const warm = this.stage.palette.warmWhite ?? 0xfff6e2;
    const geo = new THREE.CircleGeometry(1.6, 24);
    const mat = new THREE.MeshBasicMaterial({ color: warm, transparent: true, opacity: 0, fog: false, depthWrite: false });
    const disc = new THREE.Mesh(geo, mat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(p.x, p.y + 0.06, p.z);
    this.stage.scene.add(disc);
    const t0 = this._elapsed;
    const grow = () => {
      const k = Math.min(1, (this._elapsed - t0) / 1.5);
      mat.opacity = 0.3 * k;
      if (k < 1 && !this._done) requestAnimationFrame(grow);
    };
    grow();
  }

  // --- mercy path ----------------------------------------------------------
  offerMercy() {
    const stage = this.stage;
    const path = findPath(stage.adjacency(), stage.currentNode, this.goal, (i) => stage.isOpen(i));
    if (!path || path.length < 2) return;
    this._mercyNode = path[1];
    const p = stage.level.nodes[this._mercyNode].pos;
    const geo = new THREE.BoxGeometry(0.5, 0.06, 0.5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf2cf76, transparent: true, opacity: 0.3, fog: false, depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(p).setY(p.y + 0.06);
    stage.scene.add(m);
    this._mercyMesh = m;
  }

  clearMercy() {
    this._mercyNode = -1;
    if (this._mercyMesh) {
      this.stage.scene.remove(this._mercyMesh);
      this._mercyMesh.geometry.dispose();
      this._mercyMesh.material.dispose();
      this._mercyMesh = null;
    }
  }

  onArrive(node) {
    this.clearMercy();
    this._lastProductive = this._elapsed;
    if (this._done) return;
    if (node === this.goal || this.atGoal(node)) this.finish();
  }

  // Reaching the top IS reaching the top. Requiring the one exact node the
  // layout names left players standing on the summit platform, visibly done,
  // with the game waiting for a step they had no way to know was missing — and
  // no way to discover, because from up there every remaining node looks the
  // same. Any node on the goal's platform counts.
  atGoal(node) {
    const nodes = this.stage && this.stage.level && this.stage.level.nodes;
    if (!nodes || !nodes[node] || !nodes[this.goal]) return false;
    const a = nodes[node].pos, b = nodes[this.goal].pos;
    return Math.abs(a.y - b.y) < 0.5 &&
      Math.hypot(a.x - b.x, a.z - b.z) <= 2.2;
  }

  finish() {
    this._done = true;
    this.clearMercy();
    // Let her stand in the gap a moment before handing the flag back.
    setTimeout(() => this.onComplete(this.flag), 2600);
  }

  // --- teardown ------------------------------------------------------------
  dispose() {
    this._done = true;
    this.clearMercy();
    this._teardown.forEach((fn) => { try { fn(); } catch (e) {} });
    this._teardown = [];
    this._extraFigures.forEach((f) => { this.stage.scene.remove(f.group); f.dispose(); });
    this._extraFigures = [];
    if (this._litMarkers) {
      this._litMarkers.forEach(({ mesh, mat }) => { this.stage.scene.remove(mesh); mat.dispose(); });
      this._litMarkers = null;
      if (this._litGeo) { this._litGeo.dispose(); this._litGeo = null; }
    }
    this._lightMeshes.forEach(({ shaft, disc }) => {
      this.stage.scene.remove(shaft); this.stage.scene.remove(disc);
      shaft.geometry.dispose(); shaft.material.dispose();
      disc.geometry.dispose(); disc.material.dispose();
    });
    this._lightMeshes = [];
    if (this.stage) this.stage.dispose();
    this.stage = null;
  }
}
