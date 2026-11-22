// NUBBINS — pose helpers.
// Poses are written facing-agnostic: N = the limb nearer the camera, F = the
// far one. Limb directions are [out from the body, up, forward].

export const STANCE = {
  y: 0, x: 0, sq: 1, lean: 0.1, twist: 0, roll: 0, turn: 1,
  chest: [0.05, 0, 0], head: [0.02, 0, 0],
  aN: [0.45, -0.35, 0.85], aNs: 0.95, aNf: 1.1,
  aF: [0.5, -0.1, 0.9], aFs: 0.9, aFf: 1.1,
  lN: [0.3, -1, 0.14], lNs: 1, lF: [0.25, -1, -0.14], lFs: 1,
  brow: 0, eyeS: 1,
};

export function P(over) {
  const p = {};
  for (const k in STANCE) { const v = STANCE[k]; p[k] = Array.isArray(v) ? v.slice() : v; }
  if (over) for (const k in over) { const v = over[k]; p[k] = Array.isArray(v) ? v.slice() : v; }
  return p;
}

const ease = t => t * t * (3 - 2 * t);

export function mix(a, b, t, out = {}) {
  for (const k in a) {
    const va = a[k], vb = b[k] === undefined ? va : b[k];
    if (Array.isArray(va)) out[k] = [va[0] + (vb[0] - va[0]) * t, va[1] + (vb[1] - va[1]) * t, va[2] + (vb[2] - va[2]) * t];
    else out[k] = va + (vb - va) * t;
  }
  return out;
}

// keyframes: [[frame, pose], ...] (poses already full)
export function kf(keys, t, easeIt = true) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) { const u = (t - t0) / Math.max(1e-6, t1 - t0); return mix(a, b, easeIt ? ease(u) : u); }
  }
  return keys[keys.length - 1][1];
}

// turn the abstract pose into the bear's own left/right pose
export function resolve(p, facing, out) {
  const nearR = facing > 0; // facing right: the bear's right side faces the camera
  const arm = (d, sign) => [d[0] * sign, d[1], d[2]];
  const n = nearR ? -1 : 1, fsg = -n;
  out.y = p.y; out.x = p.x; out.sq = p.sq; out.lean = p.lean; out.twist = p.twist * (nearR ? 1 : -1);
  out.roll = p.roll * (nearR ? 1 : -1);
  out.chest = [p.chest[0], p.chest[1] * (nearR ? 1 : -1), p.chest[2] * (nearR ? 1 : -1)];
  out.head = [p.head[0], p.head[1] * (nearR ? 1 : -1), p.head[2] * (nearR ? 1 : -1)];
  const aN = arm(p.aN, n), aF = arm(p.aF, fsg), lN = arm(p.lN, n), lF = arm(p.lF, fsg);
  if (nearR) {
    out.armR = aN; out.armRs = p.aNs; out.armRf = p.aNf; out.armL = aF; out.armLs = p.aFs; out.armLf = p.aFf;
    out.legR = lN; out.legRs = p.lNs; out.legL = lF; out.legLs = p.lFs;
  } else {
    out.armL = aN; out.armLs = p.aNs; out.armLf = p.aNf; out.armR = aF; out.armRs = p.aFs; out.armRf = p.aFf;
    out.legL = lN; out.legLs = p.lNs; out.legR = lF; out.legRs = p.lFs;
  }
  out.brow = p.brow; out.eyeS = p.eyeS;
  return out;
}

// ---- a small library of shared poses
export const POSES = {
  stance: P(),
  crouch: P({ sq: 0.7, lean: 0.25, aN: [0.5, -0.1, 0.9], aF: [0.55, 0.05, 0.85], lN: [0.75, -1, 0.3], lF: [0.7, -1, -0.2], head: [-0.1, 0, 0] }),
  jump: P({ sq: 1.12, lean: -0.05, aN: [0.6, 0.6, 0.4], aF: [0.7, 0.7, 0.3], lN: [0.3, -0.7, 0.6], lF: [0.3, -0.9, -0.3] }),
  tuck: P({ sq: 0.88, lean: 0.35, aN: [0.4, 0.1, 0.9], aF: [0.4, 0.2, 0.9], lN: [0.25, -0.35, 0.9], lF: [0.25, -0.5, 0.8], lNs: 0.85, lFs: 0.85 }),
  block: P({ lean: -0.08, turn: 0.75, aN: [-0.15, 0.55, 1], aNs: 0.95, aNf: 1.25, aF: [-0.05, 0.75, 1], aFs: 0.95, aFf: 1.25, head: [0.2, 0, 0], eyeS: 0.45, brow: 0.1 }),
  crouchBlock: P({ sq: 0.7, lean: 0.15, aN: [-0.1, 0.5, 1], aNf: 1.25, aF: [0, 0.65, 1], aFf: 1.25, lN: [0.75, -1, 0.3], lF: [0.7, -1, -0.2], eyeS: 0.45 }),
  hurtHigh: P({ lean: -0.4, sq: 0.9, head: [-0.45, 0, 0.1], aN: [0.95, 0.35, -0.3], aF: [0.95, 0.5, -0.2], aNs: 1.15, aFs: 1.15, lN: [0.3, -1, 0.35], lF: [0.3, -1, -0.1], eyeS: 0.15, brow: 0 }),
  hurtLow: P({ lean: 0.55, sq: 0.85, head: [0.3, 0, 0], aN: [0.8, -0.2, 0.6], aF: [0.8, -0.1, 0.5], lN: [0.4, -1, -0.2], lF: [0.4, -1, 0.2], eyeS: 0.15 }),
  airHit: P({ lean: -0.9, sq: 1.05, aN: [0.9, 0.8, -0.2], aF: [0.8, 0.9, -0.4], lN: [0.3, -0.4, 0.9], lF: [0.4, -0.3, 0.8], eyeS: 0.15, head: [-0.4, 0, 0] }),
  down: P({ y: 0.06, lean: -1.5, sq: 0.82, turn: 0.6, aN: [0.95, 0.3, -0.1], aF: [0.95, 0.4, -0.1], lN: [0.5, -0.6, 0.6], lF: [0.45, -0.7, 0.5], head: [-0.2, 0, 0], eyeS: 0.15 }),
  dizzy: P({ lean: -0.1, aN: [0.9, -0.5, 0.2], aF: [0.9, -0.4, 0.1], aNs: 1.1, aFs: 1.1, lN: [0.35, -1, 0.1], lF: [0.35, -1, -0.1], eyeS: 0.8, brow: -0.5, head: [-0.1, 0, 0] }),
  win: P({ sq: 1.1, lean: -0.15, turn: 1.4, aN: [0.45, 1, 0.1], aF: [0.45, 1, 0.1], aNs: 1.35, aFs: 1.35, aNf: 1.3, aFf: 1.3, lN: [0.3, -1, 0.1], lF: [0.3, -1, -0.1], brow: -0.55, eyeS: 1.05 }),
  flex: P({ sq: 1.05, lean: -0.1, turn: 1.5, aN: [1, 0.35, 0.05], aF: [1, 0.35, 0.05], aNs: 1.1, aFs: 1.1, aNf: 1.6, aFf: 1.6, brow: 0.3 }),
  taunt: P({ turn: 1.6, lean: 0.05, aN: [0.6, -0.5, 0.6], aF: [0.25, 0.4, 1], aFs: 1.5, aFf: 1.3, brow: 0.5 }),
};
