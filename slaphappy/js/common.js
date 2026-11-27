// Shared bits: team colors, fun names, little helpers, and the confetti cannon.

export const COLORS = [
  { id: 'cherry', c: '#ff3d57' },
  { id: 'tangerine', c: '#ff8a1f' },
  { id: 'lemon', c: '#ffd319' },
  { id: 'lime', c: '#3ddc5f' },
  { id: 'aqua', c: '#19d3e6' },
  { id: 'blueberry', c: '#4f6bff' },
  { id: 'grape', c: '#a25bff' },
  { id: 'bubblegum', c: '#ff5fc1' },
];
export const colorOf = id => (COLORS.find(c => c.id === id) || COLORS[0]).c;
export function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.56 ? '#062027' : '#ffffff';
}
export function teamStyle(el, colorId) { const c = colorOf(colorId); el.style.setProperty('--tc', c); el.style.setProperty('--tink', inkOn(c)); }

export const NAMES = [
  'Whisker Wizards', 'The Know-It-Owls', 'Quiz Kittens', 'Brainy Bunch', 'Pickle Rockets', 'Noodle Ninjas',
  'Disco Llamas', 'Banana Brains', 'Galaxy Goats', 'The Buzzinators', 'Sock Monsters', 'Pizza Pirates',
  'Cosmic Cupcakes', 'Sneaky Sloths', 'Lightning Lemurs', 'Captain Clever', 'Thunder Snacks', 'Purrfect Storm',
  'Smarty Pants', 'Mighty Muffins', 'Turbo Turtles', 'Fuzzy Logic', 'Taco Titans', 'Jellybean Genius',
];
export const randomName = (not = []) => { const pool = NAMES.filter(n => !not.includes(n)); return pool[Math.floor(Math.random() * pool.length)] || NAMES[0]; };

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const q = new URLSearchParams(location.search);
export const SPEED = Math.max(0.05, Math.min(1, 1 / (parseFloat(q.get('speed')) || 1))); // tests: ?speed=8 runs the clock 8x faster
export const isPhone = () => Math.min(innerWidth, innerHeight) < 600;
export const isTouch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

// Stop iOS double-tap and pinch zoom (Safari ignores the viewport setting).
export function blockZoom() {
  document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  let last = 0;
  document.addEventListener('touchend', e => {
    const t = Date.now();
    if (t - last < 320 && !(e.target.closest && e.target.closest('input'))) e.preventDefault();
    last = t;
  }, { passive: false });
}

// Keep the screen awake while the show is on.
let lock = null, wanted = false;
export async function stayAwake() {
  wanted = true;
  try { if ('wakeLock' in navigator && (!lock || lock.released)) lock = await navigator.wakeLock.request('screen'); } catch (e) {}
}
// Safari only grants it from a tap, and drops it when the page is hidden: ask again
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wanted) stayAwake(); });
document.addEventListener('pointerup', () => { if (wanted && (!lock || lock.released)) stayAwake(); }, { passive: true });

// Taps fire on finger-lift over the same button (reliable on iPad Safari even
// when a tap would otherwise be eaten), and on Enter/Space from a keyboard.
export function bindTaps(root, acts) {
  let down = null;
  root.addEventListener('pointerdown', e => { down = e.target.closest('[data-act]'); if (down) down.classList.add('pressed'); });
  const clear = () => { if (down) down.classList.remove('pressed'); };
  root.addEventListener('pointerup', e => {
    const b = e.target.closest('[data-act]');
    clear();
    if (b && b === down && !b.disabled) { down = null; e.preventDefault(); fire(b); }
    down = null;
  });
  root.addEventListener('pointercancel', () => { clear(); down = null; });
  root.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && e.detail === 0 && !b.disabled) fire(b); });
  function fire(b) { const f = acts[b.dataset.act]; if (f) f(b.dataset.arg, b); }
}

// ---------- confetti ----------
const cv = document.getElementById('fx');
const cx = cv.getContext('2d');
let bits = [], running = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function size() { const d = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * d; cv.height = innerHeight * d; cx.setTransform(d, 0, 0, d, 0, 0); }
addEventListener('resize', size); size();
export function confetti({ x = innerWidth / 2, y = innerHeight / 2, n = 120, colors, spread = 1, up = 1 } = {}) {
  if (reduced) n = Math.min(n, 24);
  const pal = colors || ['#ffb81c', '#ff5fa2', '#3ddc8f', '#19d3e6', '#fff3d1', '#ff6a3d'];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 * spread, v = (6 + Math.random() * 10) * up;
    bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, w: 7 + Math.random() * 7, h: 4 + Math.random() * 5, c: pal[i % pal.length], life: 0 });
  }
  if (!running) { running = true; requestAnimationFrame(step); }
}
export function rain(n = 220, colors) {
  for (let i = 0; i < n; i++) setTimeout(() => confetti({ x: Math.random() * innerWidth, y: -20, n: 1, colors, up: -0.2, spread: 2 }), Math.random() * 1600);
}
function step() {
  cx.clearRect(0, 0, innerWidth, innerHeight);
  bits = bits.filter(b => b.y < innerHeight + 40 && b.life < 400);
  for (const b of bits) {
    b.life++; b.vy += 0.32; b.vx *= 0.985; b.vy *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
    cx.save(); cx.translate(b.x, b.y); cx.rotate(b.r); cx.scale(1, Math.cos(b.life * 0.15));
    cx.fillStyle = b.c; cx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); cx.restore();
  }
  if (bits.length) requestAnimationFrame(step); else { running = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
}
