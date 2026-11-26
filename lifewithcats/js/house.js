// Life with Cats — the house on Nine Lives Lane: a row of rooms cut open like
// a dollhouse, each one a little stage set. Walls, windows, the light that
// pours through them, the furniture, and the map the cats walk by.
import * as THREE from '../lib/three.module.min.js';
import * as T from './tex.js';
import * as F from './furniture.js';
import * as C from './catstuff.js';
import { PAL, M } from './furniture.js';
import { rbox, wobble, mat, mesh, add, group, cyl, sphere, boxUV, puff } from './geo.js';
import { Backdrop } from './backdrop.js';
import { rng, clamp, lerp, shade, mix } from './util.js';

export const RW = 14, RD = 10, RH = 8, WT = 0.5, STRIDE = RW + WT, CELL = 0.5, DOOR_Z = 2.4, DOOR_W = 2.3, DOOR_H = 4.4;
export const roomX = i => i * STRIDE;

// ------------------------------------------------------------- the rooms
export const ROOMS = [
  {
    id: 'living', name: 'Living Room', price: 0, level: 1, backdrop: 'lane',
    wall: { kind: 'plaster', color: '#b7be98' }, wainscot: '#6f8f8a', floor: { kind: 'planks', color: '#bf9262', alt: '#a57a4c' },
    windows: [{ x: -2.6, w: 3.6, h: 3.1, sill: 3.4 }],
    furniture: [
      ['rug', { x: -2.4, z: -0.4, kind: 'persian', cols: [PAL.rust, PAL.cream, PAL.teal, PAL.mustard], w: 8, d: 5.2 }],
      ['sofa', { x: -2.6, z: -3.55, color: PAL.sage }],
      ['coffeeTable', { x: -2.3, z: -0.35 }],
      ['sideTable', { x: 1.45, z: -3.95 }],
      ['fireplace', { x: 4.4, z: -4.42 }],
      ['floorLamp', { x: -6.3, z: -4.1 }],
      ['bookshelf', { x: -6.45, z: 0.4, rot: Math.PI / 2 }],
      ['bigPlant', { x: 6.25, z: -3.9, kind: 'fig' }],
      ['desk', { x: 6.05, z: -0.6, rot: -Math.PI / 2 }],
    ],
    art: [{ kind: 'frame', x: 1.5, y: 4.4, w: 1.4, h: 1.1, art: 'hills' }, { kind: 'frame', x: 1.0, y: 6.0, w: 0.9, h: 0.75, art: 'sea', seed: 2 }, { kind: 'clock', x: 4.4, y: 6.4 }],
    slots: [
      { type: 'bowls', x: 1.0, z: 3.4 }, { type: 'litter', x: 4.6, z: 3.7 },
      { type: 's', x: 0.4, z: -1.6 }, { type: 's', x: 3.0, z: -2.3 }, { type: 's', x: -1.6, z: 2.8 }, { type: 's', x: -4.2, z: 3.4 },
      { type: 'l', x: -5.5, z: 3.4 },
      { type: 'window', win: 0 }, { type: 'outside', win: 0 },
    ],
  },
  {
    id: 'kitchen', name: 'Kitchen', price: 250, level: 2, backdrop: 'garden',
    wall: { kind: 'plaster', color: '#e2d3b0' }, tileBand: true, floor: { kind: 'checker', a: '#d9cfb3', b: '#7d9474' },
    windows: [{ x: -2.0, w: 3.0, h: 2.6, sill: 3.6 }],
    furniture: [
      ['counterRun', { x: -2.8, z: -4.05, w: 7.6, sinkX: 0.8 }],
      ['stove', { x: 2.2, z: -4.05 }],
      ['fridge', { x: 5.6, z: -4.0 }],
      ['shelfWall', { x: -5.2, y: 4.3, z: -4.62 }],
      ['diningTable', { x: -1.4, z: 0.6 }],
      ['trashCan', { x: 6.4, z: -1.6 }],
      ['foodSack', { x: 3.6, z: -2.3 }],
      ['rug', { x: -1.4, z: 0.6, kind: 'kilim', cols: [PAL.terracotta, PAL.cream, PAL.teal, PAL.mustard], w: 6.4, d: 4.2 }],
    ],
    art: [{ kind: 'frame', x: 4.0, y: 5.6, w: 1.0, h: 0.8, art: 'flowers', seed: 3 }],
    slots: [
      { type: 'bowls', x: 3.6, z: 3.2 }, { type: 'litter', x: -6.0, z: 3.8 },
      { type: 's', x: 6.0, z: 1.4 }, { type: 's', x: -5.8, z: -1.6 }, { type: 's', x: 1.6, z: 3.6 }, { type: 's', x: 4.2, z: -0.4 },
      { type: 'l', x: 5.8, z: 3.6 },
      { type: 'window', win: 0 }, { type: 'outside', win: 0 },
    ],
  },
  {
    id: 'bedroom', name: 'Bedroom', price: 600, level: 4, backdrop: 'rooftops',
    wall: { kind: 'wallpaper', pattern: 'flowers', a: '#8ea3ad', b: '#e6d8bd', c: '#c8684a' }, wainscot: '#e2d6bb', floor: { kind: 'carpet', color: '#a8836a' },
    windows: [{ x: 4.3, w: 3.0, h: 3.2, sill: 3.0 }],
    furniture: [
      ['rug', { x: -1.6, z: 2.4, kind: 'braided', cols: [PAL.terracotta, PAL.cream, PAL.sage, PAL.mustard, PAL.dusty], w: 5.8, d: 3.6 }],
      ['bed', { x: -1.7, z: -1.55 }],
      ['nightstand', { x: -5.0, z: -4.2, lamp: PAL.rose }],
      ['nightstand', { x: 1.6, z: -4.2, lamp: PAL.mustard, paint: PAL.sage }],
      ['dresser', { x: 6.25, z: -1.4, rot: -Math.PI / 2 }],
      ['armchair', { x: 4.3, z: -3.55, color: PAL.rose, pillow: PAL.cream }],
      ['laundryBasket', { x: 3.0, z: 1.2 }],
    ],
    art: [{ kind: 'frame', x: -1.7, y: 5.4, w: 2.0, h: 1.4, art: 'moon' }, { kind: 'frame', x: 1.3, y: 6.1, w: 0.8, h: 0.8, art: 'cat', gold: true }],
    slots: [
      { type: 'litter', x: 5.8, z: 3.8 }, { type: 'bowls', x: 3.0, z: 3.6 },
      { type: 's', x: -5.6, z: 2.4 }, { type: 's', x: 1.8, z: -1.6 }, { type: 's', x: -0.4, z: 3.8 }, { type: 's', x: 5.6, z: 1.4 },
      { type: 'l', x: -5.8, z: -1.2 },
      { type: 'window', win: 0 }, { type: 'outside', win: 0 },
    ],
  },
  {
    id: 'sunroom', name: 'Sunroom', price: 1200, level: 6, backdrop: 'meadow',
    wall: { kind: 'plaster', color: '#d8b56e' }, wainscot: null, floor: { kind: 'terracotta', a: '#b8613f', b: '#c98a5a' },
    windows: [{ x: -4.4, w: 3.0, h: 4.4, sill: 2.0 }, { x: 0, w: 3.0, h: 4.4, sill: 2.0 }, { x: 4.4, w: 3.0, h: 4.4, sill: 2.0 }],
    furniture: [
      ['rug', { x: 0, z: 0.4, kind: 'round', cols: [PAL.sage, PAL.cream, PAL.mustard, PAL.teal], w: 5.4, d: 5.4 }],
      ['wickerChair', { x: -3.0, z: -2.2, rot: 0.35, cushion: PAL.teal }],
      ['wickerChair', { x: 3.0, z: -2.3, rot: -0.35, cushion: PAL.terracotta }],
      ['plantStand', { x: 0, z: -4.3 }],
      ['bigPlant', { x: -6.3, z: -3.9, kind: 'monstera', seed: 9 }],
      ['bigPlant', { x: 6.3, z: -3.8, kind: 'snake', seed: 11, pot: PAL.cream }],
      ['hangingPlant', { x: -2.2, y: 7.2, z: -3.2 }],
      ['hangingPlant', { x: 2.2, y: 7.0, z: -3.4 }],
    ],
    art: [],
    slots: [
      { type: 'bowls', x: -3.0, z: 3.4 }, { type: 'litter', x: 5.8, z: 3.8 },
      { type: 's', x: 0, z: -1.6 }, { type: 's', x: -5.8, z: 0.6 }, { type: 's', x: 5.8, z: 0.4 }, { type: 's', x: 1.6, z: 3.6 },
      { type: 'l', x: -5.6, z: 3.2 }, { type: 'l', x: 0.2, z: 2.4 },
      { type: 'window', win: 0 }, { type: 'window', win: 2 }, { type: 'outside', win: 1 }, { type: 'outside', win: 0 },
    ],
  },
  {
    id: 'playroom', name: 'Playroom', price: 2400, level: 9, backdrop: 'treetop',
    wall: { kind: 'wallpaper', pattern: 'cats', a: '#e2b9a6', b: '#f1e3cc', c: '#c97a62' }, wainscot: '#f0e2c8', floor: { kind: 'planks', color: '#c49a64', alt: '#b08454' },
    windows: [{ x: -1.0, w: 2.8, h: 2.8, sill: 3.4 }],
    furniture: [
      ['playMats', { x: 0, z: 0.6, w: 11.2, d: 6.4 }],
      ['beanbag', { x: -4.8, z: -2.8, color: PAL.mustard }],
      ['teepee', { x: 4.9, z: -3.1 }],
      ['toyChest', { x: 1.9, z: -4.1 }],
      ['stringLights', { x: 0, y: 7.1, z: -4.9, len: 12 }],
    ],
    art: [{ kind: 'frame', x: -4.6, y: 5.4, w: 1.3, h: 1.0, art: 'shapes', seed: 5 }, { kind: 'frame', x: 2.6, y: 5.0, w: 1.0, h: 1.2, art: 'cat', seed: 6 }],
    slots: [
      { type: 'bowls', x: 3.2, z: 3.6 }, { type: 'litter', x: -6.0, z: 3.8 },
      { type: 's', x: -1.6, z: -1.6 }, { type: 's', x: 1.8, z: 0.4 }, { type: 's', x: -5.8, z: 0.8 }, { type: 's', x: 0, z: 3.6 },
      { type: 'l', x: 5.6, z: 2.4 }, { type: 'l', x: -2.6, z: 2.4 },
      { type: 'wall', x: -3.6 }, { type: 'window', win: 0 }, { type: 'outside', win: 0 },
    ],
  },
];

const BUILDERS = {
  sofa: F.sofa, armchair: F.armchair, coffeeTable: F.coffeeTable, sideTable: F.sideTable, floorLamp: F.floorLamp, bookshelf: F.bookshelf,
  bigPlant: F.bigPlant, fireplace: F.fireplace, desk: F.desk, counterRun: F.counterRun, stove: F.stove, fridge: F.fridge, shelfWall: F.shelfWall,
  diningTable: F.diningTable, trashCan: F.trashCan, foodSack: F.foodSack, bed: F.bed, nightstand: F.nightstand, dresser: F.dresser, wardrobe: F.wardrobe,
  laundryBasket: F.laundryBasket, wickerChair: F.wickerChair, plantStand: F.plantStand, hangingPlant: F.hangingPlant, beanbag: F.beanbag,
  toyChest: F.toyChest, teepee: F.teepee,
};

// --------------------------------------------------------------- the house
export class House {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group(); scene.add(this.root);
    this.rooms = [];
    this.perches = []; this.scratch = []; this.knock = []; this.chew = []; this.items = []; this.lamps = []; this.slots = [];
    this.obstacles = []; this.anim = []; this.shafts = [];
    this.nextId = 1;
  }
  get count() { return ROOMS.length; }
  roomOf(x) { return clamp(Math.round(x / STRIDE), 0, ROOMS.length - 1); }

  build(onProgress) {
    for (let i = 0; i < ROOMS.length; i++) { this.buildRoom(i); onProgress && onProgress(i / ROOMS.length); }
    this.buildExterior();
    this.root.updateMatrixWorld(true);
    for (const r of this.rooms) this.registerRoom(r);
  }

  // ------------------------------------------------------------ one room
  buildRoom(i) {
    const def = ROOMS[i], X = roomX(i), g = group({ pos: [X, 0, 0] });
    this.root.add(g);
    const room = { i, def, group: g, X, unlocked: i === 0, furniture: group(), reno: group(), windows: [], backdrop: null, lampSpots: [], wallMat: null };
    g.add(room.furniture); g.add(room.reno);
    this.rooms.push(room);
    const r = rng(i * 97 + 5);
    // materials
    const cut = M.plain('#3d2f27', 0.95);
    const outside = mat({ tex: T.grain('#7a8f86', 60 + i, { paint: '#8fa39a' }), scale: 3, rough: 0.8 });
    let wallM;
    if (def.wall.kind === 'wallpaper') wallM = mat({ tex: T.wallpaper(def.wall.pattern, def.wall.a, def.wall.b, def.wall.c, 3 + i), scale: 3.2, rough: 0.92, bumpScale: 0.6 });
    else wallM = mat({ tex: T.plaster(def.wall.color, 2 + i), scale: 4.5, rough: 0.95, bumpScale: 1.2 });
    room.wallMat = wallM;
    let floorM;
    const f = def.floor;
    if (f.kind === 'planks') floorM = mat({ tex: T.planks(f.color, 3 + i, { alt: f.alt, rows: 9 }), scale: 6.5, rough: 0.62, bumpScale: 1.4 });
    else if (f.kind === 'checker') floorM = mat({ tex: T.tiles(f.a, f.b, 9 + i), scale: 5.5, rough: 0.4, bumpScale: 1.2 });
    else if (f.kind === 'terracotta') floorM = mat({ tex: T.tiles(f.a, f.b, 12 + i, { kind: 'terracotta', grout: '#d8c6a8' }), scale: 5, rough: 0.7, bumpScale: 1.4 });
    else floorM = mat({ tex: T.carpet(f.color, 20 + i), scale: 3, rough: 1, bumpScale: 1.0 });
    room.floorMat = floorM;
    const ceilM = mat({ tex: T.plaster('#efe5cf', 40 + i), scale: 5, rough: 0.95, bumpScale: 0.8 });
    // floor slab and ceiling slab (with the cut faces showing at the front)
    const slab = (w, h, d, top, bottom, front, pos) => {
      const geo = boxUV(new THREE.BoxGeometry(w, h, d));
      const m = mesh(geo, [outside, outside, top, bottom, front, outside], { pos, cast: true });
      g.add(m); return m;
    };
    slab(STRIDE, 0.6, RD + 0.6, floorM, cut, mat({ tex: T.grain('#6b4a32', 70), scale: 1, rough: 0.9 }), [0, -0.3, 0.3 - 0.3 + 0.0]);
    slab(STRIDE, 0.55, RD + 0.6, cut, ceilM, cut, [0, RH + 0.275, 0]);
    // ceiling beams
    const beamM = M.wood(PAL.walnut, 71, 2.5);
    for (const bz of [-2.8, 0.4, 3.6]) add(g, wobble(rbox(RW, 0.45, 0.4, 0.05), 0.02, 0.8, bz), beamM, { pos: [0, RH - 0.22, bz], cast: false });
    // pendant lamp hanging from the middle beam
    const pend = group({ pos: [0, RH - 0.45, 0.4] });
    add(pend, cyl(0.015, 0.015, 1.2, 4), M.plain('#2e2622'), { pos: [0, -0.6, 0], cast: false });
    const pshade = add(pend, new THREE.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.enamel([PAL.mustard, PAL.teal, PAL.rose, PAL.cream, PAL.sage][i]), { pos: [0, -1.25, 0], cast: false });
    pshade.material = pshade.material.clone(); pshade.material.side = THREE.DoubleSide; pshade.material.emissive = new THREE.Color('#ffcf8a'); pshade.material.emissiveIntensity = 0;
    const pbulb = add(pend, sphere(0.16, 10, 8), M.glow('#ffe2a8', 0), { pos: [0, -1.4, 0], cast: false }); pbulb.material = pbulb.material.clone();
    g.add(pend);
    room.lampSpots.push({ pos: new THREE.Vector3(X, RH - 2.1, 0.4), kind: 'pendant', shade: pshade.material, bulb: pbulb.material, power: 1.0, range: 16 });

    // ---- back wall with windows
    const bz = -RD / 2 - WT / 2;
    const openings = def.windows.map(w => ({ a: w.x - w.w / 2, b: w.x + w.w / 2, y0: w.sill, y1: w.sill + w.h }));
    this.wallWithOpenings(g, RW + WT * 2, RH, WT, openings, [wallM, outside, cut], { z: bz, axis: 'x', x0: 0 });
    // side walls: the left one only for the first room; each room owns its right wall
    const sideOpen = [{ a: DOOR_Z - DOOR_W / 2, b: DOOR_Z + DOOR_W / 2, y0: 0, y1: DOOR_H }];
    if (i === 0) this.wallWithOpenings(g, RD + 0.3, RH, WT, [], [wallM, outside, cut], { x: -RW / 2 - WT / 2, axis: 'z', z0: 0.15, face: 1 });
    const last = i === ROOMS.length - 1;
    this.wallWithOpenings(g, RD + 0.3, RH, WT, last ? [] : sideOpen, [wallM, last ? outside : this.nextWallMat(i), cut], { x: RW / 2 + WT / 2, axis: 'z', z0: 0.15, face: -1 });
    // trims: baseboard, wainscot, picture rail along the back wall and side walls
    this.trims(g, room, def, openings, i);
    // doorway trim and the door that stays shut while the next room is for sale
    if (!last) {
      const tm = M.paint('#efe5cf', 72);
      const dx = RW / 2 + WT / 2;
      for (const s of [-1, 1]) {
        add(g, rbox(WT + 0.3, DOOR_H + 0.2, 0.22, 0.04), tm, { pos: [dx, (DOOR_H + 0.2) / 2, DOOR_Z + s * (DOOR_W / 2 + 0.08)], cast: false });
      }
      add(g, rbox(WT + 0.3, 0.25, DOOR_W + 0.6, 0.04), tm, { pos: [dx, DOOR_H + 0.12, DOOR_Z], cast: false });
      const door = group({ pos: [dx, 0, DOOR_Z] });
      add(door, wobble(rbox(0.16, DOOR_H - 0.05, DOOR_W - 0.05, 0.04), 0.01), M.paint(PAL.teal, 73), { pos: [0, DOOR_H / 2, 0] });
      for (const s of [-1, 1]) add(door, rbox(0.2, 1.4, DOOR_W * 0.6, 0.04), M.paint(shade(PAL.teal, -0.1), 74), { pos: [0, DOOR_H / 2 + s * 0.95, 0] });
      for (const s of [-1, 1]) add(door, sphere(0.09, 10, 8), M.brass(), { pos: [s * 0.14, DOOR_H * 0.45, DOOR_W * 0.36] });
      g.add(door); room.door = door;
    }
    // ---- windows: frames, sills, glass, curtains, and the view
    def.windows.forEach((w, wi) => room.windows.push(this.windowSet(g, room, w, wi, r)));
    room.backdrop = new Backdrop(def.backdrop, 11 + i * 3);
    room.backdrop.group.position.set(0, 0, 0);
    g.add(room.backdrop.group);
    // ---- furniture
    for (const [kind, o] of def.furniture) this.placeFurniture(room, kind, o);
    for (const a of def.art) this.placeArt(room, a);
    // ---- renovation props for a room still for sale
    this.renoSet(room);
    // slots for things you buy
    for (const s of def.slots) this.slots.push({ room: i, ...s, item: null });
  }
  nextWallMat(i) {
    const def = ROOMS[i + 1];
    if (def.wall.kind === 'wallpaper') return mat({ tex: T.wallpaper(def.wall.pattern, def.wall.a, def.wall.b, def.wall.c, 3 + i + 1), scale: 3.2, rough: 0.92, bumpScale: 0.6 });
    return mat({ tex: T.plaster(def.wall.color, 2 + i + 1), scale: 4.5, rough: 0.95, bumpScale: 1.2 });
  }
  // a wall made of boxes around its openings. axis 'x' runs left-right (back wall), 'z' front-back (side walls)
  wallWithOpenings(g, len, h, thick, openings, mats, o) {
    const [inner, outer, cut] = mats;
    const pieces = [];
    const sorted = [...openings].sort((p, q) => p.a - q.a);
    let cur = -len / 2;
    const off = o.axis === 'x' ? 0 : (o.z0 || 0);
    for (const op of sorted) {
      const a = op.a - off, b = op.b - off;
      if (a > cur) pieces.push([cur, a, 0, h]);
      if (op.y0 > 0) pieces.push([a, b, 0, op.y0]);
      if (op.y1 < h) pieces.push([a, b, op.y1, h]);
      cur = b;
    }
    if (cur < len / 2) pieces.push([cur, len / 2, 0, h]);
    for (const [a, b, y0, y1] of pieces) {
      const w = b - a, hh = y1 - y0; if (w <= 0.001 || hh <= 0.001) continue;
      const geo = boxUV(new THREE.BoxGeometry(o.axis === 'x' ? w : thick, hh, o.axis === 'x' ? thick : w));
      let mats6;
      if (o.axis === 'x') mats6 = [cut, cut, cut, cut, inner, outer]; // +z faces into the room
      else mats6 = o.face > 0 ? [inner, outer, cut, cut, cut, cut] : [outer === inner ? inner : inner, outer, cut, cut, cut, cut];
      if (o.axis === 'z' && o.face < 0) mats6 = [outer, inner, cut, cut, cut, cut];
      const m = mesh(geo, mats6, { cast: true, receive: true });
      if (o.axis === 'x') m.position.set((a + b) / 2 + (o.x0 || 0), (y0 + y1) / 2, o.z);
      else m.position.set(o.x, (y0 + y1) / 2, (a + b) / 2 + off);
      // front cut face of side walls
      if (o.axis === 'z' && b >= len / 2 - 0.01) m.material = mats6.map((mm, k) => (k === 4 ? cut : mm));
      g.add(m);
    }
  }
  trims(g, room, def, openings, i) {
    const base = M.paint(def.wainscot ? shade(def.wainscot, -0.15) : '#efe5cf', 75);
    const segs = (a, b, holes) => { const out = []; let cur = a; for (const [h0, h1] of holes.sort((p, q) => p[0] - q[0])) { if (h0 > cur) out.push([cur, Math.min(h0, b)]); cur = Math.max(cur, h1); } if (cur < b) out.push([cur, b]); return out; };
    const wy = 2.6;
    // back wall
    const backHolesLow = openings.filter(o => o.y0 < wy + 0.2).map(o => [o.a - 0.25, o.b + 0.25]);
    const z = -RD / 2 + 0.04;
    for (const [a, b] of segs(-RW / 2, RW / 2, backHolesLow)) {
      if (b - a < 0.2) continue;
      add(g, rbox(b - a, 0.45, 0.14, 0.03), base, { pos: [(a + b) / 2, 0.22, z + 0.04], cast: false });
      if (def.wainscot) this.wainscot(g, def.wainscot, a, b, z, 'x');
    }
    if (def.tileBand) {
      const tm = mat({ tex: T.tiles('#e9e1cf', '#7f98a5', 50, { kind: 'subway', n: 8 }), scale: 2.4, rough: 0.3, bumpScale: 1 });
      for (const [a, b] of segs(-RW / 2, RW / 2, openings.map(o => [o.a - 0.2, o.b + 0.2]))) add(g, rbox(b - a, 1.6, 0.06, 0.01), tm, { pos: [(a + b) / 2, 3.7, z + 0.02], cast: false });
    }
    // picture rail
    add(g, rbox(RW, 0.12, 0.1, 0.03), base, { pos: [0, 6.6, z + 0.03], cast: false });
    // side walls
    for (const side of [-1, 1]) {
      const sx = side * (RW / 2 - 0.04);
      const hasDoor = side > 0 ? i < ROOMS.length - 1 : i > 0;
      const holes = hasDoor ? [[DOOR_Z - DOOR_W / 2 - 0.3, DOOR_Z + DOOR_W / 2 + 0.3]] : [];
      for (const [a, b] of segs(-RD / 2, RD / 2, holes)) {
        const m = add(g, rbox(0.14, 0.45, b - a, 0.03), base, { pos: [sx, 0.22, (a + b) / 2], cast: false });
        if (def.wainscot) this.wainscot(g, def.wainscot, a, b, sx, 'z', side);
      }
      add(g, rbox(0.1, 0.12, RD, 0.03), base, { pos: [sx, 6.6, 0], cast: false });
    }
  }
  wainscot(g, col, a, b, fixed, axis, side = 1) {
    const pm = M.paint(col, 76), pm2 = M.paint(shade(col, -0.06), 77);
    const L = b - a, n = Math.max(1, Math.round(L / 1.6)), pw = L / n;
    if (axis === 'x') {
      add(g, rbox(L, 2.4, 0.06, 0.02), pm, { pos: [(a + b) / 2, 1.3, fixed + 0.03], cast: false });
      add(g, rbox(L, 0.14, 0.16, 0.04), pm, { pos: [(a + b) / 2, 2.55, fixed + 0.07], cast: false });
      for (let k = 0; k < n; k++) add(g, rbox(pw - 0.4, 1.5, 0.05, 0.02), pm2, { pos: [a + pw * (k + 0.5), 1.4, fixed + 0.07], cast: false });
    } else {
      const x = fixed - side * 0.03;
      add(g, rbox(0.06, 2.4, L, 0.02), pm, { pos: [x, 1.3, (a + b) / 2], cast: false });
      add(g, rbox(0.16, 0.14, L, 0.04), pm, { pos: [x - side * 0.04, 2.55, (a + b) / 2], cast: false });
      for (let k = 0; k < n; k++) add(g, rbox(0.05, 1.5, pw - 0.4, 0.02), pm2, { pos: [x - side * 0.04, 1.4, a + pw * (k + 0.5)], cast: false });
    }
  }
  windowSet(g, room, w, wi, r) {
    const z = -RD / 2, tm = M.paint('#efe5cf', 78);
    const x0 = w.x - w.w / 2, x1 = w.x + w.w / 2, y0 = w.sill, y1 = w.sill + w.h;
    // frame
    add(g, rbox(w.w + 0.4, 0.22, WT + 0.2, 0.04), tm, { pos: [w.x, y1 + 0.11, -RD / 2 - WT / 2] });
    for (const s of [x0 - 0.1, x1 + 0.1]) add(g, rbox(0.22, w.h + 0.2, WT + 0.2, 0.04), tm, { pos: [s, (y0 + y1) / 2, -RD / 2 - WT / 2] });
    // deep sill a cat can sit on
    add(g, wobble(rbox(w.w + 0.7, 0.16, WT + 0.75, 0.05), 0.01), M.wood(PAL.oak, 79), { pos: [w.x, y0 - 0.04, -RD / 2 - WT / 2 + 0.36] });
    // mullions: these cast the window-pane shadows on the floor
    const mm = M.paint('#efe5cf', 80);
    const cols = Math.max(1, Math.round(w.w / 1.5)), rows = Math.max(1, Math.round(w.h / 1.5));
    for (let k = 1; k < cols + 1; k++) if (k < cols + 1 && k !== cols + 0) { if (k < cols + 1 && k * w.w / (cols + 0) < w.w - 0.01) add(g, rbox(0.08, w.h, 0.1, 0.02), mm, { pos: [x0 + k * w.w / cols, (y0 + y1) / 2, -RD / 2 - WT / 2] }); }
    for (let k = 1; k < rows; k++) add(g, rbox(w.w, 0.08, 0.1, 0.02), mm, { pos: [w.x, y0 + k * w.h / rows, -RD / 2 - WT / 2] });
    const glass = add(g, new THREE.PlaneGeometry(w.w, w.h), mat({ key: 'winglass', color: '#dfe9ea', rough: 0.05, transparent: true, opacity: 0.12, depthWrite: false }), { pos: [w.x, (y0 + y1) / 2, -RD / 2 - WT / 2 - 0.02], cast: false, receive: false });
    // curtains on a rod
    const rodY = y1 + 0.45;
    add(g, cyl(0.04, 0.04, w.w + 1.8, 8), M.brass(), { pos: [w.x, rodY, z + 0.3], rot: [0, 0, Math.PI / 2], cast: false });
    for (const s of [-1, 1]) add(g, sphere(0.09, 10, 8), M.brass(), { pos: [w.x + s * (w.w / 2 + 0.9), rodY, z + 0.3], cast: false });
    const curtainCol = [PAL.ochre, PAL.rose, PAL.mustard, PAL.cream, PAL.teal][room.i];
    const cm = M.fab(curtainCol, { pattern: room.i === 3 ? 'stripe' : 'floral', b: PAL.cream, c: shade(curtainCol, -0.25), scale: 1.4 });
    const ccm = cm.clone(); ccm.side = THREE.DoubleSide;
    const curtains = [];
    const drop = Math.min(rodY - 0.1, w.h + 1.6);
    for (const s of [-1, 1]) {
      const cw = 1.0, geo = new THREE.PlaneGeometry(cw, drop, 12, 8);
      const P = geo.attributes.position.array;
      for (let k = 0; k < P.length; k += 3) { const u = P[k] / cw + 0.5, v = 0.5 - P[k + 1] / drop; P[k + 2] += Math.sin(u * Math.PI * 5) * 0.12 * (0.6 + v * 0.4); P[k] *= 1 - v * 0.15; }
      geo.computeVertexNormals(); boxUV(geo, 1);
      const c = add(g, geo, ccm, { pos: [w.x + s * (w.w / 2 + 0.45), rodY - drop / 2, z + 0.3] });
      curtains.push(c);
    }
    // light shaft (filled in by the lighting each frame)
    const shaft = this.makeShaft();
    g.add(shaft.mesh);
    const info = { def: w, wi, glass, curtains, shaft, center: new THREE.Vector3(room.X + w.x, (y0 + y1) / 2, -RD / 2), room: room.i, sillY: y0 + 0.04, perch: null, outside: null };
    this.shafts.push({ room, win: info });
    return info;
  }
  makeShaft() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(8 * 3), t = new Float32Array(8);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('fade', new THREE.BufferAttribute(t, 1));
    geo.setIndex([0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
    const m = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color('#ffe0a8') }, strength: { value: 0.0 } },
      vertexShader: 'attribute float fade; varying float vF; varying vec3 vP; void main(){ vF = fade; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 color; uniform float strength; varying float vF; varying vec3 vP; void main(){ float a = pow(1.0 - vF, 1.6) * strength * (0.75 + 0.25 * sin(vP.x * 3.1 + vP.y * 2.3)); gl_FragColor = vec4(color * a, a); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = 5;
    return { mesh, geo, mat: m };
  }
  placeFurniture(room, kind, o) {
    let obj;
    if (kind === 'rug') { obj = F.rugMesh(o.kind, o.cols, o.w, o.d, room.i * 7 + 1); obj.position.set(o.x, 0.03, o.z); room.furniture.add(obj); return null; }
    if (kind === 'playMats') { obj = F.playMats(o.w, o.d); obj.position.set(o.x, 0, o.z); room.furniture.add(obj); return null; }
    if (kind === 'stringLights') { obj = F.stringLights(o.len); obj.position.set(o.x, o.y, o.z); room.furniture.add(obj); room.stringLights = obj; room.lampSpots.push({ pos: new THREE.Vector3(room.X + o.x, o.y - 0.6, o.z + 1.5), kind: 'string', power: 0.8, range: 14, string: obj }); return null; }
    obj = BUILDERS[kind](o);
    obj.position.set(o.x, o.y || 0, o.z); obj.rotation.y = o.rot || 0;
    room.furniture.add(obj);
    const rec = { id: this.nextId++, kind, room: room.i, group: obj, wear: 0, wearable: !!obj.userData.wearable, decals: [], fixed: true };
    this.items.push(rec);
    obj.userData.rec = rec;
    // lamps become light spots: the scene keeps a small pool of real lights
    obj.traverse(c => { if (c.isPointLight) { c.updateMatrixWorld(); } });
    return rec;
  }
  placeArt(room, a) {
    let obj;
    if (a.kind === 'clock') { obj = F.wallClock(); obj.position.set(a.x, a.y, -RD / 2 + 0.07); room.clock = obj; }
    else { obj = F.frame(a); obj.position.set(a.x, a.y - a.h / 2, -RD / 2 + 0.06); }
    room.furniture.add(obj);
  }
  renoSet(room) {
    const g = room.reno;
    if (room.i === 0) return;
    const r = rng(room.i * 31);
    for (let k = 0; k < 5; k++) { const b = C.box({ w: 1.2 + r() * 0.6, d: 1.0 + r() * 0.5, h: 0.9 + r() * 0.5 }); b.position.set(-4 + k * 1.9 + r(), 0, -2 + (k % 2) * 2.5); b.rotation.y = r() - 0.5; g.add(b); }
    // ladder and paint tins
    const lad = group({ pos: [3.5, 0, -3.8] }); const wd = M.wood(PAL.pine, 82);
    for (const s of [-1, 1]) { const rail = add(lad, cyl(0.06, 0.06, 6.2, 6), wd, { pos: [s * 0.55, 3.0, 0] }); rail.rotation.x = 0.18; }
    for (let k = 0; k < 7; k++) add(lad, cyl(0.04, 0.04, 1.1, 6), wd, { pos: [0, 0.5 + k * 0.8, 0.09 - k * 0.14], rot: [0, 0, Math.PI / 2] });
    g.add(lad);
    for (let k = 0; k < 3; k++) { add(g, cyl(0.35, 0.35, 0.6, 16), M.metal('#b8b6aa'), { pos: [5.4 + k * 0.4, 0.3, 0.5 + k * 0.6] }); add(g, cyl(0.36, 0.36, 0.04, 16), M.plain([room.def.wall.color || room.def.wall.a, PAL.cream, PAL.teal][k]), { pos: [5.4 + k * 0.4, 0.62, 0.5 + k * 0.6] }); }
    const sheet = wobble(new THREE.SphereGeometry(1.8, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0.25, 0.9, room.i);
    add(g, sheet, M.fab('#efe9dc', { scale: 1.5 }), { pos: [-1, 0, 1.6], scale: [1.4, 0.7, 1] });
    // a sign: FOR SALE
    const c = T.canvas(512, 320), x = c.getContext('2d');
    x.fillStyle = '#efe5cf'; x.fillRect(0, 0, 512, 320); x.strokeStyle = '#5a3a1c'; x.lineWidth = 12; x.strokeRect(10, 10, 492, 300);
    x.fillStyle = '#c14b56'; x.font = 'bold 64px Georgia, serif'; x.textAlign = 'center'; x.fillText('FOR SALE', 256, 100);
    x.fillStyle = '#3c2614'; x.font = 'bold 44px Georgia, serif'; x.fillText(room.def.name, 256, 175);
    x.font = '38px Georgia, serif'; x.fillText(room.def.price + ' bleps', 256, 245);
    const sign = group({ pos: [0.2, 0, 3.2] });
    add(sign, cyl(0.06, 0.06, 2.6, 8), wd, { pos: [0, 1.3, -0.05] });
    add(sign, rbox(2.4, 1.5, 0.08, 0.03), new THREE.MeshStandardMaterial({ map: T.toTex(c, { clamp: true }), roughness: 0.9 }), { pos: [0, 2.2, 0.02] });
    sign.rotation.y = -0.15; g.add(sign);
  }
  buildExterior() {
    // the garden strip in front of the house, the facade band above, and the sky behind
    const n = ROOMS.length, len = n * STRIDE + 40, cx = (n - 1) * STRIDE / 2;
    const grass = mat({ tex: T.carpet('#7c8f55', 90), scale: 3, rough: 1, bumpScale: 1.5 });
    add(this.root, new THREE.PlaneGeometry(len, 40), grass, { pos: [cx, -0.62, 24], rot: [-Math.PI / 2, 0, 0], cast: false });
    // foundation band
    add(this.root, boxUV(new THREE.BoxGeometry(n * STRIDE + 0.6, 0.9, 0.3)), mat({ tex: T.brick('#8d8578', 91), scale: 2, rough: 0.95, bumpScale: 1 }), { pos: [cx, -0.95, RD / 2 + 0.45], cast: false });
    // facade above the rooms: siding and an eave with a gutter
    const siding = mat({ tex: T.grain('#7a8f86', 92, { paint: '#9bae9f' }), scale: 2.5, rough: 0.8 });
    add(this.root, boxUV(new THREE.BoxGeometry(n * STRIDE + 0.6, 1.6, 0.4)), siding, { pos: [cx, RH + 1.35, RD / 2 + 0.05], cast: false });
    add(this.root, boxUV(new THREE.BoxGeometry(n * STRIDE + 1.6, 0.3, 1.2)), M.paint('#efe5cf', 93), { pos: [cx, RH + 2.25, RD / 2 + 0.4], cast: false });
    const roof = mat({ tex: T.tiles('#7d5a44', '#8a4a3a', 94, { kind: 'subway', n: 6, grout: '#4a3426' }), scale: 2.5, rough: 0.9, bumpScale: 1.2 });
    const rf = add(this.root, boxUV(new THREE.BoxGeometry(n * STRIDE + 1.6, 0.3, 9)), roof, { pos: [cx, RH + 4.6, 0.6], cast: true });
    rf.rotation.x = -0.5;
    // foreground: a low fence and some tufts of garden, soft in the camera's blur
    const fm = M.paint('#efe5cf', 95), r = rng(5);
    for (let x = -12; x < n * STRIDE + 6; x += 0.7) add(this.root, rbox(0.22, 1.1 + (r() - 0.5) * 0.08, 0.1, 0.04), fm, { pos: [x, -0.1, 9.6], rot: [0, 0, (r() - 0.5) * 0.05], cast: false });
    for (const y of [0.1, 0.35]) add(this.root, rbox(n * STRIDE + 18, 0.12, 0.06, 0.02), fm, { pos: [cx, y, 9.5], cast: false });
    const leafM = mat({ tex: T.leaf('#6f8a4a', 'long', 96), alphaTest: 0.5, side: THREE.DoubleSide, rough: 0.7, clampTex: true });
    const tuft = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.9), leafM, 500);
    const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let k = 0; k < 500; k++) { e.set((r() - 0.5) * 0.6, r() * 6, (r() - 0.5) * 0.6); q.setFromEuler(e); const sc = 0.5 + r() * 0.6; mm.compose(new THREE.Vector3(-12 + r() * (n * STRIDE + 24), -0.62 + 0.4 * sc, 6.4 + r() * 4), q, new THREE.Vector3(sc, sc, sc)); tuft.setMatrixAt(k, mm); }
    tuft.castShadow = false; tuft.receiveShadow = false; this.root.add(tuft);
    const flowerM = [PAL.mustard, PAL.rose, PAL.cream, PAL.terracotta].map(c => M.felt(c));
    for (let k = 0; k < 140; k++) add(this.root, sphere(0.09 + r() * 0.06, 8, 6), flowerM[k % 4], { pos: [-12 + r() * (n * STRIDE + 24), 0.1 + r() * 0.5, 6.4 + r() * 4.5], cast: false });
    // end walls: the outside of the house at both ends
    // (sky behind everything lives in each room's backdrop)
  }

  // ------------------------------------------------------------ registry
  registerRoom(room) {
    room.furniture.updateMatrixWorld(true);
    const W = new THREE.Vector3();
    for (const rec of this.items.filter(it => it.room === room.i && !it.registered)) this.registerItem(rec);
    // windows sills are perches too
    for (const w of room.windows) {
      W.set(room.X + w.def.x, w.sillY + 0.1, -RD / 2 + 0.2);
      w.sill = this.addPerch({ room: room.i, x: W.x, y: W.y, z: W.z, kind: 'sill', cap: 1, nap: 1, sunny: true, window: w });
    }
    for (const ls of room.lampSpots) this.lamps.push({ ...ls, room: room.i });
    room.furniture.traverse(c => {
      if (c.userData && c.userData.light && c.userData.light.isPointLight) { /* table lamp groups */ }
    });
    // find point lights built into furniture, turn them into lamp spots
    const toRemove = [];
    room.furniture.traverse(c => { if (c.isPointLight) toRemove.push(c); });
    for (const L of toRemove) {
      const p = new THREE.Vector3(); L.getWorldPosition(p);
      const holder = findLampHolder(L);
      const isFire = holder && holder.userData.fire;
      this.lamps.push({ room: room.i, pos: p, kind: isFire ? 'fire' : 'lamp', shade: holder && holder.userData.shade, bulb: holder && holder.userData.bulb, fire: isFire ? holder.userData.fire : null, power: isFire ? 1.4 : 0.9, range: isFire ? 11 : 9 });
      L.parent.remove(L);
    }
  }
  registerItem(rec) {
    rec.registered = true;
    const g = rec.group, ud = g.userData;
    g.updateMatrixWorld(true);
    const P = new THREE.Vector3();
    if (ud.foot && ud.foot[0] > 0) {
      g.getWorldPosition(P);
      this.obstacles.push({ rec, x: P.x, z: P.z, w: ud.foot[0], d: ud.foot[1], rot: g.rotation.y });
    }
    for (const p of ud.perches || []) { P.set(p.x, p.y, p.z); g.localToWorld(P); this.addPerch({ room: rec.room, x: P.x, y: P.y, z: P.z, kind: p.kind, cap: p.cap || 1, nap: p.nap || 0, rec, inside: p.inside, low: p.low, sunny: p.sunny }); }
    for (const s of ud.scratch || []) {
      P.set(s.x, s.y, s.z); g.localToWorld(P);
      const n = new THREE.Vector3(s.nx, 0, s.nz).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y);
      this.scratch.push({ id: this.nextId++, room: rec.room, x: P.x, y: P.y, z: P.z, nx: n.x, nz: n.z, post: !!s.post, low: !!s.low, rec });
    }
    for (const k of ud.knock || []) {
      const obj = k.obj; const wp = new THREE.Vector3(); obj.getWorldPosition(wp);
      this.knock.push({ id: this.nextId++, room: rec.room, obj, kind: k.kind, rec, home: { parent: obj.parent, pos: obj.position.clone(), rot: obj.rotation.clone() }, world: wp, state: 'ok' });
    }
    if (ud.chew && ud.chew.length) this.chew.push({ room: rec.room, leaves: ud.chew, rec, eaten: 0 });
  }
  addPerch(p) { const rec = { id: this.nextId++, occ: 0, ...p }; this.perches.push(rec); return rec; }
  removeItem(rec) {
    this.obstacles = this.obstacles.filter(o => o.rec !== rec);
    this.perches = this.perches.filter(p => p.rec !== rec);
    this.scratch = this.scratch.filter(s => s.rec !== rec);
    this.items = this.items.filter(i => i !== rec);
    rec.group.parent && rec.group.parent.remove(rec.group);
  }

  // ------------------------------------------------------------ unlocking
  setUnlocked(i, on) {
    const room = this.rooms[i]; room.unlocked = on;
    room.furniture.visible = on; room.reno.visible = !on;
    for (const rm of this.rooms) if (rm.door) rm.door.visible = !(rm.unlocked && this.rooms[rm.i + 1] && this.rooms[rm.i + 1].unlocked);
  }

  // ------------------------------------------------------------ nav map
  buildNav() {
    const n = ROOMS.length;
    this.navX0 = roomX(0) - STRIDE / 2; this.navZ0 = -RD / 2;
    this.NX = Math.round(n * STRIDE / CELL); this.NZ = Math.round(RD / CELL);
    const NX = this.NX, NZ = this.NZ, g = new Uint8Array(NX * NZ);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const x = this.navX0 + (i + 0.5) * CELL, z = this.navZ0 + (j + 0.5) * CELL;
      const ri = this.roomOf(x), room = this.rooms[ri];
      let block = !room.unlocked;
      const lx = x - roomX(ri);
      if (Math.abs(lx) > RW / 2 - 0.3) { // in or next to a side wall
        const toRight = lx > 0, other = this.rooms[ri + (toRight ? 1 : -1)];
        const inDoor = Math.abs(z - DOOR_Z) < DOOR_W / 2 - 0.35;
        if (!(inDoor && other && other.unlocked && room.unlocked)) block = true;
      }
      if (z < -RD / 2 + 0.35 || z > RD / 2 - 0.45) block = true;
      if (!block) for (const o of this.obstacles) {
        if (this.roomOf(o.x) !== ri && Math.abs(o.x - x) > 4) continue;
        const dx = x - o.x, dz = z - o.z, c = Math.cos(-o.rot), s = Math.sin(-o.rot);
        const u = dx * c - dz * s, v = dx * s + dz * c;
        if (Math.abs(u) < o.w / 2 + 0.3 && Math.abs(v) < o.d / 2 + 0.3) { block = true; break; }
      }
      g[j * NX + i] = block ? 1 : 0;
    }
    this.nav = g;
    // approach points for perches and scratch spots: the nearest open floor
    for (const p of this.perches) { const a = this.nearestFree(p.x, p.z + (p.kind === 'sill' ? 0.6 : 0.2)); p.ax = a.x; p.az = a.z; }
    for (const s of this.scratch) { const a = this.nearestFree(s.x + s.nx * 0.7, s.z + s.nz * 0.7); s.ax = a.x; s.az = a.z; }
  }
  cellOf(x, z) { return [clamp(Math.floor((x - this.navX0) / CELL), 0, this.NX - 1), clamp(Math.floor((z - this.navZ0) / CELL), 0, this.NZ - 1)]; }
  free(i, j) { return i >= 0 && j >= 0 && i < this.NX && j < this.NZ && !this.nav[j * this.NX + i]; }
  centerOf(i, j) { return { x: this.navX0 + (i + 0.5) * CELL, z: this.navZ0 + (j + 0.5) * CELL }; }
  nearestFree(x, z) {
    const [ci, cj] = this.cellOf(x, z);
    if (this.free(ci, cj)) return this.centerOf(ci, cj);
    for (let rad = 1; rad < 30; rad++) {
      let best = null, bd = 1e9;
      for (let dj = -rad; dj <= rad; dj++) for (let di = -rad; di <= rad; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== rad) continue;
        if (this.free(ci + di, cj + dj)) { const c = this.centerOf(ci + di, cj + dj); const d = (c.x - x) ** 2 + (c.z - z) ** 2; if (d < bd) { bd = d; best = c; } }
      }
      if (best) return best;
    }
    return { x, z };
  }
  randomFree(room, r = Math.random) {
    for (let k = 0; k < 60; k++) {
      const x = roomX(room) + (r() - 0.5) * (RW - 1.5), z = (r() - 0.5) * (RD - 1.5);
      const [i, j] = this.cellOf(x, z); if (this.free(i, j)) return this.centerOf(i, j);
    }
    return this.nearestFree(roomX(room), 2);
  }
  // A* over the floor grid, then pull the string tight
  path(ax, az, bx, bz) {
    const NX = this.NX, NZ = this.NZ;
    let [si, sj] = this.cellOf(ax, az), [ti, tj] = this.cellOf(bx, bz);
    if (!this.free(si, sj)) { const c = this.nearestFree(ax, az); [si, sj] = this.cellOf(c.x, c.z); }
    if (!this.free(ti, tj)) { const c = this.nearestFree(bx, bz); [ti, tj] = this.cellOf(c.x, c.z); }
    const start = sj * NX + si, goal = tj * NX + ti;
    if (start === goal) return [{ x: bx, z: bz }];
    const gS = new Float32Array(NX * NZ).fill(1e9), came = new Int32Array(NX * NZ).fill(-1), closed = new Uint8Array(NX * NZ);
    const open = [start]; gS[start] = 0;
    const h = k => { const i = k % NX, j = (k / NX) | 0; const dx = Math.abs(i - ti), dz = Math.abs(j - tj); return Math.max(dx, dz) + 0.41 * Math.min(dx, dz); };
    const fS = new Float32Array(NX * NZ).fill(1e9); fS[start] = h(start);
    let found = false, guard = 0;
    while (open.length && guard++ < 6000) {
      let bi = 0; for (let k = 1; k < open.length; k++) if (fS[open[k]] < fS[open[bi]]) bi = k;
      const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (cur === goal) { found = true; break; }
      closed[cur] = 1;
      const ci = cur % NX, cj = (cur / NX) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj; if (!this.free(ni, nj)) continue;
        if (di && dj && (!this.free(ci + di, cj) || !this.free(ci, cj + dj))) continue;
        const nk = nj * NX + ni; if (closed[nk]) continue;
        const ng = gS[cur] + (di && dj ? 1.414 : 1);
        if (ng < gS[nk]) { gS[nk] = ng; fS[nk] = ng + h(nk); came[nk] = cur; if (!open.includes(nk)) open.push(nk); }
      }
    }
    if (!found) return null;
    const cells = []; for (let k = goal; k !== -1 && k !== start; k = came[k]) cells.push(k); cells.reverse();
    const pts = cells.map(k => this.centerOf(k % NX, (k / NX) | 0));
    pts[pts.length - 1] = this.free(...this.cellOf(bx, bz)) ? { x: bx, z: bz } : pts[pts.length - 1];
    // string pulling
    const out = []; let from = { x: ax, z: az }, idx = 0;
    while (idx < pts.length) {
      let far = idx;
      for (let k = pts.length - 1; k > idx; k--) if (this.los(from.x, from.z, pts[k].x, pts[k].z)) { far = k; break; }
      out.push(pts[far]); from = pts[far]; idx = far + 1;
    }
    return out;
  }
  los(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / (CELL * 0.5));
    for (let k = 1; k < n; k++) { const t = k / n; const [i, j] = this.cellOf(ax + (bx - ax) * t, az + (bz - az) * t); if (!this.free(i, j)) return false; }
    return true;
  }

  // ------------------------------------------------------------ per frame
  update(dt, t, env) {
    for (const room of this.rooms) {
      if (room.clock) { const h = env.minutes / 60; room.clock.userData.hour.rotation.z = -h / 12 * Math.PI * 2; room.clock.userData.minute.rotation.z = -(env.minutes % 60) / 60 * Math.PI * 2; }
      if (room.backdrop) room.backdrop.update(dt);
    }
    for (const it of this.items) {
      const ud = it.group.userData;
      if (ud.fire) for (let k = 0; k < ud.fire.flames.length; k++) { const f = ud.fire.flames[k]; const s = 0.8 + Math.sin(t * (9 + k) + k * 2) * 0.15 + Math.sin(t * 23 + k) * 0.08; f.scale.set(1 - (s - 1) * 0.5, s, 1 - (s - 1) * 0.5); f.material.opacity = env.fire * 0.85; }
      if (ud.fish) for (const f of ud.fish) { f.a += dt * f.s; f.m.position.set(Math.cos(f.a) * 0.85, f.y + Math.sin(f.a * 2.3) * 0.08, Math.sin(f.a) * 0.3); f.m.rotation.y = -f.a - Math.PI / 2 * Math.sign(Math.cos(f.a)); f.m.rotation.y = Math.atan2(-Math.cos(f.a) * 0.3, -Math.sin(f.a) * 0.85); }
      if (ud.bubble) { const s = 1 + Math.sin(t * 6) * 0.08; ud.bubble.scale.set(s, 0.7 + Math.sin(t * 6) * 0.1, s); }
      if (ud.pom) { ud.pom.position.x = (ud.pom.userData.x0 ??= ud.pom.position.x) + Math.sin(t * 1.7 + it.id) * 0.05; }
      if (ud.birds && ud.birdsOn !== undefined) { ud.birds.forEach((b, k) => { b.visible = ud.birdsOn > k; b.position.y = 2.4 + Math.abs(Math.sin(t * 6 + k)) * 0.03; b.rotation.y = Math.sin(t * 0.7 + k * 2) * 0.6; }); }
    }
  }
}
function findLampHolder(o) { let p = o.parent; while (p) { if (p.userData && (p.userData.shade || p.userData.fire)) return p; p = p.parent; } return null; }

// --------------------------------------------------------------- lighting
// One sun (with soft shadows) that follows the room you are looking at, a
// sky fill, and a small pool of warm lamps that hop to the lamps in view.
export class Lighting {
  constructor(scene, house) {
    this.scene = scene; this.house = house;
    this.sun = new THREE.DirectionalLight('#ffe2b0', 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const c = this.sun.shadow.camera; c.left = -14; c.right = 14; c.top = 14; c.bottom = -14; c.near = 1; c.far = 60;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03; this.sun.shadow.radius = 4;
    scene.add(this.sun); scene.add(this.sun.target);
    this.hemi = new THREE.HemisphereLight('#dfe6ee', '#a8865e', 1.2); scene.add(this.hemi);
    this.amb = new THREE.AmbientLight('#f3e3c8', 0.3); scene.add(this.amb);
    // a soft fill from the front so faces toward the camera are not muddy
    this.fill = new THREE.DirectionalLight('#f6e6cc', 0.6); this.fill.position.set(0, 8, 30); scene.add(this.fill); scene.add(this.fill.target);
    this.pool = [];
    for (let k = 0; k < 4; k++) { const L = new THREE.PointLight('#ffc27a', 0, 12, 1.6); scene.add(L); this.pool.push(L); }
    this.focus = -1;
  }
  // env from the clock: { minutes, dayPhase... }
  update(env, focusRoom, camX, t) {
    const h = env.minutes / 60; // 0..24
    // sun path: east (left) in the morning, west (right) in the evening
    const dayT = clamp((h - 6) / 14, 0, 1);
    const el = Math.sin(dayT * Math.PI) * 0.85 + 0.12, az = lerp(-0.9, 0.9, dayT);
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el) * 0.9, -Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
    // direction the light travels: from behind the house (−z) toward the camera
    const X = roomX(focusRoom);
    this.sun.target.position.set(X, 0, 0);
    this.sun.position.set(X - dir.x * 30, -dir.y * 30, -dir.z * 30);
    this.sun.target.updateMatrixWorld();
    const day = env.daylight; // 0 night .. 1 day
    const warmth = env.warmth; // 0 white .. 1 amber
    this.sun.color.set('#fff1d6').lerp(new THREE.Color('#ffb066'), warmth).lerp(new THREE.Color('#9fb4d8'), 1 - day);
    this.sun.intensity = lerp(0.55, 3.2, day) * (env.weather === 'rain' ? 0.35 : env.weather === 'snow' ? 0.6 : 1);
    this.hemi.color.set('#d6dfea').lerp(new THREE.Color('#5a6a90'), 1 - day);
    this.hemi.groundColor.set('#9a7a56').lerp(new THREE.Color('#3a2e3a'), 1 - day);
    this.hemi.intensity = lerp(0.45, 1.45, day);
    this.amb.intensity = lerp(0.14, 0.34, day);
    this.fill.intensity = lerp(0.2, 0.75, day);
    this.fill.position.set(X, 9, 30); this.fill.target.position.set(X, 2, 0); this.fill.target.updateMatrixWorld();
    // light shafts through every window (stronger in low warm sun)
    const shaftStrength = day * (env.weather === 'clear' ? 1 : 0.25) * (0.35 + warmth * 0.4);
    for (const { room, win } of this.house.shafts) {
      const w = win.def, z = -RD / 2 + 0.03, m = 0.1;
      const corners = [[w.x - w.w / 2 + m, w.sill + w.h - m], [w.x + w.w / 2 - m, w.sill + w.h - m], [w.x + w.w / 2 - m, w.sill + 0.2], [w.x - w.w / 2 + m, w.sill + 0.2]];
      const P = win.shaft.geo.attributes.position.array, F = win.shaft.geo.attributes.fade.array;
      const len = Math.min(16, (w.sill + w.h * 0.5) / Math.max(0.15, -dir.y));
      for (let k = 0; k < 4; k++) {
        P[k * 3] = corners[k][0]; P[k * 3 + 1] = corners[k][1]; P[k * 3 + 2] = z; F[k] = 0;
        const L = Math.min(len, corners[k][1] / Math.max(0.12, -dir.y));
        P[(k + 4) * 3] = corners[k][0] + dir.x * L; P[(k + 4) * 3 + 1] = Math.max(0, corners[k][1] + dir.y * L); P[(k + 4) * 3 + 2] = z + dir.z * L; F[k + 4] = 1;
      }
      win.shaft.geo.attributes.position.needsUpdate = true; win.shaft.geo.attributes.fade.needsUpdate = true;
      win.shaft.mat.uniforms.strength.value = room.unlocked ? shaftStrength * 0.22 : 0;
      win.shaft.mat.uniforms.color.value.copy(this.sun.color);
    }
    this.sunDir = dir;
    // lamps glow from dusk; the pool lights only the room in view
    const lampOn = env.lamps;
    for (const L of this.house.lamps) {
      const on = this.house.rooms[L.room].unlocked ? lampOn : 0;
      if (L.shade) L.shade.emissiveIntensity = on * 0.9;
      if (L.bulb) L.bulb.emissiveIntensity = on * 2.5;
      if (L.string) for (const b of L.string.userData.bulbs) b.material.color.set(on > 0.3 ? '#ffd27a' : '#8a7a5a');
    }
    const near = this.house.lamps.filter(L => L.room === focusRoom && this.house.rooms[L.room].unlocked)
      .sort((a, b) => (b.kind === 'fire') - (a.kind === 'fire') || (b.kind === 'pendant') - (a.kind === 'pendant'));
    for (let k = 0; k < this.pool.length; k++) {
      const P = this.pool[k], L = near[k];
      if (!L) { P.intensity = 0; continue; }
      P.position.copy(L.pos);
      const flick = L.kind === 'fire' ? (0.85 + Math.sin(t * 13) * 0.08 + Math.sin(t * 31) * 0.05) : 1;
      const on = L.kind === 'fire' ? Math.max(env.fire, lampOn) : lampOn;
      P.intensity = on * L.power * 9 * flick; P.distance = L.range;
      P.color.set(L.kind === 'fire' ? '#ff9a4a' : '#ffc27a');
    }
  }
}
