// ADRIATICA — pathing.
//
// Breadth-first search over the walkable node graph. No physics, no collision,
// no gravity: the graph is the only truth about where she can go, and it was
// generated from the same layout data as the geometry.

// Returns an array of node indices from `from` to `to` inclusive, or null if
// no route exists. Null means silence — the caller does nothing at all.
export function findPath(adjacency, from, to, isOpen) {
  if (from === to) return [from];
  const prev = new Map();
  prev.set(from, -1);
  const queue = [from];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head++];
    for (const w of adjacency[v]) {
      if (prev.has(w)) continue;
      if (isOpen && !isOpen(w)) continue;
      prev.set(w, v);
      if (w === to) {
        const path = [w];
        let cur = v;
        while (cur !== -1) { path.push(cur); cur = prev.get(cur); }
        return path.reverse();
      }
      queue.push(w);
    }
  }
  return null;
}

// Every node reachable from `from`. Used to decide what a click may target,
// and later by the mercy path.
export function reachableSet(adjacency, from, isOpen) {
  const seen = new Set([from]);
  const queue = [from];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head++];
    for (const w of adjacency[v]) {
      if (seen.has(w)) continue;
      if (isOpen && !isOpen(w)) continue;
      seen.add(w);
      queue.push(w);
    }
  }
  return seen;
}
