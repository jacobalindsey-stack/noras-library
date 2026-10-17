// ADRIATICA — layout -> meshes + walkable graph.
//
// One pass over the layout produces both. There is no registration step and
// no way for the geometry and the graph to disagree. Deterministic: no
// Math.random, no seeds, no run-to-run variation.

import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';
import { TYPE_COLORS } from './palette.js';

const STEP_RISE = 0.5;
const STEP_RUN = 1.0;
const DIRS = {
  N: [0, -1],
  S: [0, 1],
  E: [1, 0],
  W: [-1, 0],
};

// Walkable nodes live on a global half-integer lattice so pieces meeting in
// space share node positions without being told they do.
function latticeRange(min, max) {
  const out = [];
  let v = Math.floor(min) + 0.5;
  while (v < min - 1e-6) v += 1;
  while (v <= max + 1e-6) {
    if (v >= min - 1e-6) out.push(v);
    v += 1;
  }
  return out;
}

function snapLattice(v) {
  return Math.round(v - 0.5) + 0.5;
}

export function buildLevel(layout, palette, paletteName) {
  const group = new THREE.Group();
  group.name = 'levelGeometry';

  const materials = new Map();
  const typeColors = TYPE_COLORS[paletteName] || TYPE_COLORS.gap;
  const materialFor = (slot) => {
    if (!materials.has(slot)) {
      const hex = palette[slot];
      const m = new THREE.MeshLambertMaterial({
        color: hex === undefined ? 0xff00ff : hex,
        flatShading: true,
      });
      m.name = slot;
      materials.set(slot, m);
    }
    return materials.get(slot);
  };

  const rawNodes = [];
  const addNode = (x, y, z, pieceIndex) => {
    rawNodes.push({ x: snapLattice(x), y, z: snapLattice(z), piece: pieceIndex });
  };

  const box = (w, h, d, cx, cy, cz, slot, name) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materialFor(slot));
    mesh.position.set(cx, cy, cz);
    mesh.name = name;
    group.add(mesh);
    return mesh;
  };

  layout.pieces.forEach((piece, i) => {
    const slot = piece.color || typeColors[piece.type] || 'goldMid';

    if (piece.type === 'platform' || piece.type === 'pillar') {
      const [x, y, z] = piece.at;
      const [w, h, d] = piece.size;
      box(w, h, d, x, y - h / 2, z, slot, `${piece.type}${i}`);
      if (piece.type === 'platform' && piece.walkable !== false) {
        latticeRange(x - w / 2, x + w / 2).forEach((nx) => {
          latticeRange(z - d / 2, z + d / 2).forEach((nz) => addNode(nx, y, nz, i));
        });
      }
      return;
    }

    if (piece.type === 'stair') {
      const [dx, dz] = DIRS[piece.dir] || DIRS.E;
      const w = piece.width || 1.4;
      const treadH = piece.treadHeight || 0.5;
      let x = snapLattice(piece.at[0]);
      let y = piece.at[1];
      let z = snapLattice(piece.at[2]);
      for (let s = 0; s < piece.length; s++) {
        const sw = dx !== 0 ? STEP_RUN : w;
        const sd = dz !== 0 ? STEP_RUN : w;
        box(sw, treadH, sd, x, y - treadH / 2, z, slot, `stair${i}_${s}`);
        addNode(x, y, z, i);
        x += dx * STEP_RUN;
        z += dz * STEP_RUN;
        y += STEP_RISE;
      }
      return;
    }

    if (piece.type === 'span') {
      const [x0, y0, z0] = piece.from;
      const [x1, , z1] = piece.to;
      const w = piece.width || 1.6;
      const h = piece.thickness || 0.4;
      const horizontal = Math.abs(x1 - x0) > Math.abs(z1 - z0);
      const len = horizontal ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      box(horizontal ? len : w, h, horizontal ? w : len, cx, y0 - h / 2, cz, slot, `span${i}`);
      if (piece.walkable !== false) {
        if (horizontal) {
          latticeRange(Math.min(x0, x1), Math.max(x0, x1)).forEach((nx) => addNode(nx, y0, z0, i));
        } else {
          latticeRange(Math.min(z0, z1), Math.max(z0, z1)).forEach((nz) => addNode(x0, y0, nz, i));
        }
      }
      return;
    }

    if (piece.type === 'arch') {
      // Corbelled from boxes — chunky on purpose, no curves.
      const [x, y, z] = piece.at;
      const span = piece.span || 4;
      const height = piece.height || 4;
      const depth = piece.depth || 1.2;
      const t = piece.thickness || 0.8;
      const legH = height - t * 2;
      [-1, 1].forEach((side) => {
        box(t, legH, depth, x + side * (span / 2 + t / 2), y + legH / 2, z, slot, `archLeg${i}_${side}`);
        // two corbel steps stepping inward
        box(t, t, depth, x + side * (span / 2 + t / 2), y + legH + t / 2, z, slot, `archCorbelA${i}_${side}`);
        box(t, t, depth, x + side * (span / 2 - t / 2), y + legH + t * 1.5, z, slot, `archCorbelB${i}_${side}`);
      });
      box(span - t, t, depth, x, y + legH + t * 2.5, z, slot, `archLintel${i}`);
      return;
    }

    console.warn('[vision3d] unknown piece type:', piece.type);
  });

  // Merge nodes that landed in the same place (a stair top meeting a terrace).
  const nodes = [];
  const index = new Map();
  const key = (n) => `${n.x.toFixed(2)}|${n.y.toFixed(2)}|${n.z.toFixed(2)}`;
  rawNodes.forEach((n) => {
    const k = key(n);
    if (index.has(k)) return;
    index.set(k, nodes.length);
    nodes.push({ id: nodes.length, pos: new THREE.Vector3(n.x, n.y, n.z), piece: n.piece });
  });

  // World-space adjacency: one tile apart horizontally, at most one step up.
  const edges = [];
  const adjacency = nodes.map(() => []);
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const pa = nodes[a].pos;
      const pb = nodes[b].pos;
      const horiz = Math.hypot(pa.x - pb.x, pa.z - pb.z);
      const dy = Math.abs(pa.y - pb.y);
      if (horiz <= 1.05 && horiz > 0.01 && dy <= STEP_RISE + 0.05) {
        edges.push([a, b]);
        adjacency[a].push(b);
        adjacency[b].push(a);
      }
    }
  }

  const bounds = new THREE.Box3().setFromObject(group);

  return { group, nodes, edges, adjacency, materials, bounds };
}
