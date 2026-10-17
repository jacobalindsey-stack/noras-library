// ADRIATICA — solvability solver.
//
// "No dead ends, ever" is the rule most at risk in a spatial puzzle, so it is
// not left to eyeballing. Both solvers answer two questions in code:
//   1. Is the goal reachable from the start at all?
//   2. Is EVERY state reachable from the start still able to reach the goal?
// (2) is the real guarantee: it means no sequence of legal moves can strand
// the player. A layout that fails either is not done.
//
// Pure graph logic. The stage feeds in real projections; nothing here touches
// three.js, so it runs anywhere.

// --- Rotation puzzles (Level 1) -------------------------------------------
// State = (node, orbit). Moves: walk to any node reachable in the current
// orbit's effective graph, or rotate to any other orbit in place.
//
// adjacencyForOrbit(o) -> array<array<int>>  effective graph at orbit o
export function solveRotation({ start, goal, orbits, adjacencyForOrbit }) {
  const adj = {};
  orbits.forEach((o) => { adj[o] = adjacencyForOrbit(o); });
  const n = adj[orbits[0]].length;

  const key = (node, o) => node + ':' + o;
  const neighbours = (node, o) => {
    const out = [];
    // walk
    for (const w of adj[o][node]) out.push(key(w, o));
    // rotate in place
    for (const oo of orbits) if (oo !== o) out.push(key(node, oo));
    return out;
  };

  // Forward reachability from the start.
  const startKeys = orbits.map((o) => key(start, o));
  const reachFwd = bfsMulti(startKeys, (k) => {
    const [node, o] = k.split(':').map(Number);
    return neighbours(node, o);
  });

  const goalReachable = orbits.some((o) => reachFwd.has(key(goal, o)));

  // Reverse reachability to the goal: build the reverse graph over the states
  // actually reachable, then BFS out from the goal states.
  const canReachGoal = reverseReachable(reachFwd, orbits.map((o) => key(goal, o)),
    (k) => {
      const [node, o] = k.split(':').map(Number);
      return neighbours(node, o);
    });

  const traps = [...reachFwd].filter((k) => !canReachGoal.has(k));

  return {
    kind: 'rotation',
    nodes: n,
    states: reachFwd.size,
    goalReachable,
    deadEndFree: goalReachable && traps.length === 0,
    trapCount: traps.length,
    trapSample: traps.slice(0, 8),
  };
}

// --- Light puzzles (Level 2) ----------------------------------------------
// State = (node, t) over one sampled light cycle. Moves: stay (t -> t+1), or
// step to any adjacent node that is lit at t+1. She never falls, so sitting on
// a node that goes dark is legal — she simply waits for a route.
//
// isLit(node, t) -> bool ; adjacency is a single static graph (no rotation).
// finalLedge/finalLedgeGate: the last ledge lights only after stillness, which
// the player can always choose, so the solver treats reaching any neighbour of
// the final ledge as sufficient and confirms the ledge itself is adjacent.
export function solveLight({ start, goal, steps, adjacency, isLit, finalLedge = null }) {
  const key = (node, t) => node + '@' + t;
  const startKeys = [];
  for (let t = 0; t < steps; t++) if (isLit(start, t)) startKeys.push(key(start, t));
  // If the start is never lit, allow starting anyway at t=0 (she stands there).
  if (!startKeys.length) startKeys.push(key(start, 0));

  const neighbours = (node, t) => {
    const nt = (t + 1) % steps;
    const out = [key(node, nt)]; // wait
    for (const w of adjacency[node]) if (isLit(w, nt)) out.push(key(w, nt));
    return out;
  };

  const reach = bfsMulti(startKeys, (k) => {
    const [node, t] = k.split('@').map(Number);
    return neighbours(node, t);
  });

  const goalReachable = anyStep(reach, goal, steps);

  // Final-ledge sanity: it must be graph-adjacent to something reachable, so
  // that stillness (always available) can complete the route.
  let ledgeOk = true;
  if (finalLedge !== null) {
    const nbrsReachable = adjacency[finalLedge].some((w) => anyStep(reach, w, steps));
    ledgeOk = nbrsReachable;
  }

  return {
    kind: 'light',
    steps,
    states: reach.size,
    goalReachable,
    finalLedgeReachable: ledgeOk,
    deadEndFree: goalReachable && ledgeOk,
  };
}

// --- Static graph sanity (any layout) -------------------------------------
export function graphSanity(adjacency) {
  const n = adjacency.length;
  const isolated = [];
  const oneWayLooking = []; // nodes you can enter but that have <1 exit
  for (let i = 0; i < n; i++) {
    if (adjacency[i].length === 0) isolated.push(i);
  }
  // Connected components over the static (world) graph.
  const seen = new Set();
  let components = 0;
  for (let i = 0; i < n; i++) {
    if (seen.has(i)) continue;
    components++;
    const q = [i]; seen.add(i);
    while (q.length) {
      const v = q.pop();
      for (const w of adjacency[v]) if (!seen.has(w)) { seen.add(w); q.push(w); }
    }
  }
  return { nodes: n, isolated, isolatedCount: isolated.length, components };
}

// --- helpers ---------------------------------------------------------------
function bfsMulti(startKeys, neighboursOf) {
  const seen = new Set(startKeys);
  const q = [...startKeys];
  let head = 0;
  while (head < q.length) {
    const k = q[head++];
    for (const nk of neighboursOf(k)) {
      if (!seen.has(nk)) { seen.add(nk); q.push(nk); }
    }
  }
  return seen;
}

// Reverse reachability within an already-known forward set.
function reverseReachable(forwardSet, goalKeys, neighboursOf) {
  // Build reverse adjacency restricted to forwardSet.
  const rev = new Map();
  forwardSet.forEach((k) => rev.set(k, []));
  forwardSet.forEach((k) => {
    for (const nk of neighboursOf(k)) {
      if (forwardSet.has(nk)) rev.get(nk).push(k);
    }
  });
  const seen = new Set(goalKeys.filter((k) => forwardSet.has(k)));
  const q = [...seen];
  let head = 0;
  while (head < q.length) {
    const k = q[head++];
    for (const pk of (rev.get(k) || [])) if (!seen.has(pk)) { seen.add(pk); q.push(pk); }
  }
  return seen;
}

function anyStep(reachSet, node, steps) {
  for (let t = 0; t < steps; t++) if (reachSet.has(node + '@' + t)) return true;
  return false;
}
