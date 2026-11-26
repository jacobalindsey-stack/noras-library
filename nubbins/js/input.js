// NUBBINS — controls: keyboard, gamepads and on-screen touch pads.
const SOLO = {
  l: ['ArrowLeft', 'KeyA'], r: ['ArrowRight', 'KeyD'], u: ['ArrowUp', 'KeyW'], d: ['ArrowDown', 'KeyS'],
  p: ['KeyJ', 'KeyZ'], k: ['KeyK', 'KeyX'], s: ['KeyL', 'KeyC'], b: ['KeyI', 'Space', 'KeyV'], x: ['KeyU', 'KeyB'],
};
const DUO = [
  { l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'], p: ['KeyF'], k: ['KeyG'], s: ['KeyH'], b: ['KeyR'], x: ['KeyT'] },
  { l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'], p: ['Numpad1', 'Comma'], k: ['Numpad2', 'Period'], s: ['Numpad3', 'Slash'], b: ['Numpad0', 'ShiftRight'], x: ['NumpadEnter', 'Semicolon'] },
];
const BLANK = () => ({ l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, b: 0, x: 0 });
export function pads() { try { return navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; } catch (e) { return []; } }

export class Input {
  constructor(layer) {
    this.keys = new Set();
    this.layer = layer;
    this.mode = 'none';
    this.touchState = [BLANK(), BLANK()];
    this.nav = null; // menu callback
    this.usedTouch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    this.lastPads = [{}, {}];
    this.typeHook = null; // a screen that takes typed letters (the room code)
    addEventListener('keydown', e => {
      if (this.typeHook && !e.metaKey && !e.ctrlKey && this.typeHook(e)) { e.preventDefault(); return; }
      if (e.repeat && this.keys.has(e.code)) { this._menuKey(e, true); return; }
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      this._menuKey(e, false);
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.releaseTouch(); });
    document.addEventListener('visibilitychange', () => { this.keys.clear(); this.releaseTouch(); });
    document.addEventListener('touchend', e => { if (e.touches.length === 0) this.releaseTouch(); }, { passive: true });
    document.addEventListener('touchstart', () => { if (!this.usedTouch) { this.usedTouch = true; this.onTouchSeen && this.onTouchSeen(); } }, { passive: true });
    this._build();
  }

  _menuKey(e, rep) {
    if (!this.nav) return;
    const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Enter: 'ok', NumpadEnter: 'ok', Space: 'ok', KeyJ: 'ok', KeyZ: 'ok', KeyF: 'ok', Escape: 'back', Backspace: 'back', KeyK: 'back', KeyX: 'back', KeyP: 'pause' };
    const a = map[e.code];
    if (a) { if (this.nav(a, rep, e.code) !== false) e.preventDefault(); }
  }

  // ------------------------------------------------------------- reading
  read(i, duo) {
    const o = BLANK();
    // players 1-2: keyboard halves, their touch pad and gamepads 1-2; players 3-4: gamepads 3-4 only
    const maps = duo ? (DUO[i] ? [DUO[i]] : []) : (i === 0 ? [SOLO] : []);
    for (const m of maps) for (const b in m) for (const code of m[b]) if (this.keys.has(code)) o[b] = 1;
    const pad = this.pad(duo ? i : (i === 0 ? -1 : 99));
    if (pad) for (const b in o) o[b] = o[b] || pad[b];
    const t = this.touchState[duo ? i : 0];
    if (t && (duo || i === 0)) for (const b in o) o[b] = o[b] || t[b];
    return o;
  }

  // gamepad for player i (-1: any pad)
  pad(i) {
    const gps = pads();
    const list = i === -1 ? gps : gps[i] ? [gps[i]] : [];
    if (!list.length) return null;
    const o = BLANK();
    for (const g of list) {
      const B = k => g.buttons[k] && g.buttons[k].pressed;
      const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
      o.l ||= +(B(14) || ax < -0.45); o.r ||= +(B(15) || ax > 0.45); o.u ||= +(B(12) || ay < -0.55); o.d ||= +(B(13) || ay > 0.55);
      o.p ||= +B(2); o.k ||= +B(0); o.s ||= +B(3); o.b ||= +(B(1) || B(4) || B(6)); o.x ||= +(B(5) || B(7));
    }
    return o;
  }

  // menu navigation from gamepads (edges)
  pollPadNav() {
    if (!this.nav) return;
    const gps = pads();
    gps.forEach((g, gi) => {
      const B = k => !!(g.buttons[k] && g.buttons[k].pressed);
      const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
      const now = { up: B(12) || ay < -0.6, down: B(13) || ay > 0.6, left: B(14) || ax < -0.6, right: B(15) || ax > 0.6, ok: B(0) || B(2), back: B(1), pause: B(9) };
      const last = this.lastPads[gi] || {};
      for (const k in now) if (now[k] && !last[k]) this.nav(k, false, 'pad' + gi);
      this.lastPads[gi] = now;
    });
  }

  // ---------------------------------------------------------- touch pads
  _build() {
    const L = this.layer;
    L.innerHTML = '';
    this.clusters = [0, 1].map(i => {
      const c = document.createElement('div'); c.className = 'tpad p' + (i + 1);
      c.innerHTML = `<div class="stick"><div class="ring"></div><div class="knob"></div><div class="stickHint">MOVE</div></div>
        <div class="btns">
          <button class="tb rush" data-b="x" aria-label="Sugar Rush">RUSH!</button>
          <button class="tb block" data-b="b" aria-label="Block">BLOCK</button>
          <button class="tb spec" data-b="s" aria-label="Special">★</button>
          <button class="tb punch" data-b="p" aria-label="Punch">PUNCH</button>
          <button class="tb kick" data-b="k" aria-label="Kick">KICK</button>
        </div>`;
      L.appendChild(c);
      const st = this.touchState[i];
      for (const b of c.querySelectorAll('.tb')) {
        const k = b.dataset.b;
        const down = e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} st[k] = 1; b.classList.add('on'); this.onTouchPress && this.onTouchPress(); };
        const up = e => { e.preventDefault(); st[k] = 0; b.classList.remove('on'); };
        b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
        b.addEventListener('contextmenu', e => e.preventDefault());
      }
      const stick = c.querySelector('.stick'), ring = c.querySelector('.ring'), knob = c.querySelector('.knob');
      let id = null, cx = 0, cy = 0;
      const R = () => Math.max(34, Math.min(62, stick.clientWidth * 0.22));
      const place = (x, y) => { const r = stick.getBoundingClientRect(); ring.style.left = (x - r.left) + 'px'; ring.style.top = (y - r.top) + 'px'; };
      const move = (x, y) => {
        const r = stick.getBoundingClientRect(), rad = R();
        let dx = (x - cx) / rad, dy = (y - cy) / rad; const m = Math.hypot(dx, dy);
        if (m > 1.6) { cx += (x - cx) * (1 - 1.6 / m) * 0.5; cy += (y - cy) * (1 - 1.6 / m) * 0.5; place(cx, cy); }
        const cl = Math.min(1, m); const kx = m ? dx / m * cl : 0, ky = m ? dy / m * cl : 0;
        knob.style.left = (cx - r.left + kx * rad) + 'px'; knob.style.top = (cy - r.top + ky * rad) + 'px';
        st.r = dx > 0.42 ? 1 : 0; st.l = dx < -0.42 ? 1 : 0;
        st.u = dy < -0.55 && Math.abs(dx) < Math.abs(dy) * 1.6 ? 1 : 0;
        st.d = dy > 0.5 && Math.abs(dx) < Math.abs(dy) * 1.9 ? 1 : 0;
      };
      stick.addEventListener('pointerdown', e => {
        e.preventDefault(); if (id !== null) return; id = e.pointerId; try { stick.setPointerCapture(id); } catch (_) {}
        cx = e.clientX; cy = e.clientY; place(cx, cy); stick.classList.add('active'); move(cx, cy); this.onTouchPress && this.onTouchPress();
      });
      stick.addEventListener('pointermove', e => { if (e.pointerId === id) { e.preventDefault(); move(e.clientX, e.clientY); } });
      const end = e => { if (e.pointerId !== id) return; id = null; st.l = st.r = st.u = st.d = 0; stick.classList.remove('active'); knob.style.left = ring.style.left; knob.style.top = ring.style.top; };
      stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end); stick.addEventListener('lostpointercapture', end);
      c._reset = () => { id = null; stick.classList.remove('active'); for (const b of c.querySelectorAll('.tb')) b.classList.remove('on'); knob.style.left = ring.style.left; knob.style.top = ring.style.top; };
      return c;
    });
  }

  releaseTouch() {
    for (const t of this.touchState) for (const k in t) t[k] = 0;
    if (this.clusters) for (const c of this.clusters) c._reset();
  }

  // 'none' | '1p' | '2p'
  setTouch(mode) {
    this.mode = mode;
    this.layer.dataset.mode = mode;
    this.clusters[0].hidden = mode === 'none';
    this.clusters[1].hidden = mode !== '2p';
    this.releaseTouch();
  }
  setRush(i, ready) { const b = this.clusters[i] && this.clusters[i].querySelector('.rush'); if (b) b.classList.toggle('ready', !!ready); }
}
