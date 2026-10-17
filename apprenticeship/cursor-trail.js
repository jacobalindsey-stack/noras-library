// cursor-trail.js — gold "lore mote" cursor trail. Tasteful, performant, additive glow.
(function(){
  if (window.__loreTrailInstalled) return;
  window.__loreTrailInstalled = true;

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  // Disable on touch-only devices (iOS Edge rendering artifacts, no hover cursor anyway)
  if ('ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches) return;

  const canvas = document.createElement("canvas");
  canvas.id = "lore-trail";
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100%", height: "100%",
    pointerEvents: "none", zIndex: "99998",
  });
  const ctx = canvas.getContext("2d");
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function start(){
    if (!document.body) return void requestAnimationFrame(start);
    document.body.appendChild(canvas);
    resize();
    addEventListener("resize", resize);
    requestAnimationFrame(loop);
  }

  // Gold palette (matches the deck's --gold family)
  const GOLDS = ["#d4a14a", "#e6c06a", "#f0d488", "#c2863a"];

  const motes = [];
  const MAX = 140;
  let mx = innerWidth / 2, my = innerHeight / 2;
  let lastX = mx, lastY = my, hasMoved = false;
  let lastT = performance.now();

  function spawn(x, y, speed){
    const count = Math.min(2, 1 + Math.floor(speed / 20));
    for (let i = 0; i < count; i++){
      if (motes.length >= MAX) motes.shift();
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 0.5;
      motes.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.25,        // slight upward drift, like embers
        r: 1.2 + Math.random() * 2.4,
        life: 1,
        decay: 0.014 + Math.random() * 0.022,
        color: GOLDS[(Math.random() * GOLDS.length) | 0],
        spin: Math.random() * Math.PI,
      });
    }
  }

  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    const dx = mx - lastX, dy = my - lastY;
    const speed = Math.hypot(dx, dy);
    if (speed > 1.5){
      // Spawn along the path so fast moves leave a continuous ribbon
      const steps = Math.min(6, Math.ceil(speed / 10));
      for (let s = 0; s < steps; s++){
        const t = s / steps;
        spawn(lastX + dx * t, lastY + dy * t, speed);
      }
    }
    lastX = mx; lastY = my; hasMoved = true;
  }, { passive: true });

  // A soft click burst
  addEventListener("pointerdown", (e) => {
    for (let i = 0; i < 14; i++){
      if (motes.length >= MAX) motes.shift();
      const ang = (i / 14) * Math.PI * 2;
      const spd = 1.2 + Math.random() * 1.8;
      motes.push({
        x: e.clientX, y: e.clientY,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        r: 1.5 + Math.random() * 2.2,
        life: 1, decay: 0.02 + Math.random() * 0.02,
        color: GOLDS[(Math.random() * GOLDS.length) | 0],
        spin: Math.random() * Math.PI,
      });
    }
  });

  function loop(now){
    const dt = Math.min(2.5, (now - lastT) / 16.67);
    lastT = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = "lighter";

    for (let i = motes.length - 1; i >= 0; i--){
      const m = motes[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.vy -= 0.006 * dt;          // continue drifting up
      m.vx *= 0.97;
      m.life -= m.decay * dt;
      if (m.life <= 0){ motes.splice(i, 1); continue; }

      const a = m.life;
      const rad = m.r * (0.5 + m.life * 0.7);
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, rad * 3.2);
      g.addColorStop(0, hexA(m.color, 0.72 * a));
      g.addColorStop(0.4, hexA(m.color, 0.28 * a));
      g.addColorStop(1, hexA(m.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(m.x, m.y, rad * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // bright core
      ctx.fillStyle = hexA("#fff3d0", 0.64 * a);
      ctx.beginPath();
      ctx.arc(m.x, m.y, rad * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glow at the cursor head
    if (hasMoved){
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, 16);
      g.addColorStop(0, hexA("#f0d488", 0.4));
      g.addColorStop(1, hexA("#f0d488", 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mx, my, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(loop);
  }

  function hexA(hex, a){
    const c = hex.replace("#", "");
    const full = c.length === 3 ? c.split("").map(x => x + x).join("") : c;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  start();
})();
