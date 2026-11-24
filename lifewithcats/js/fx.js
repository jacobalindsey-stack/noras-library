// Life with Cats — little floating things: hearts, Zzz, sparkles, tufts of
// fur, puffs of dust. Paper cut-outs on sprites.
import * as THREE from '../lib/three.module.min.js';
import * as T from './tex.js';

function icon(draw) { const c = T.canvas(64), x = c.getContext('2d'); draw(x); const t = T.toTex(c, { clamp: true }); return t; }
const TEX = {};
function tex(k) {
  if (TEX[k]) return TEX[k];
  const outline = (x, path, fill) => { x.lineJoin = 'round'; x.fillStyle = fill; x.strokeStyle = '#3b2a24'; x.lineWidth = 4; path(); x.stroke(); x.fill(); };
  const draws = {
    heart: x => outline(x, () => { x.beginPath(); x.moveTo(32, 54); x.bezierCurveTo(4, 36, 6, 10, 22, 12); x.bezierCurveTo(28, 12, 32, 18, 32, 22); x.bezierCurveTo(32, 18, 36, 12, 42, 12); x.bezierCurveTo(58, 10, 60, 36, 32, 54); x.closePath(); }, '#e0707a'),
    z: x => { x.font = 'bold 44px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 5; x.strokeStyle = '#3b2a24'; x.strokeText('z', 32, 32); x.fillStyle = '#efe5cf'; x.fillText('z', 32, 32); },
    spark: x => outline(x, () => { x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, r = i % 2 ? 10 : 26; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.closePath(); }, '#f2c14e'),
    puff: x => { const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(240,232,215,.9)'); g.addColorStop(1, 'rgba(240,232,215,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); },
    fur: x => { x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 2; for (let i = 0; i < 26; i++) { const a = Math.random() * 6.283, r = 6 + Math.random() * 20; x.beginPath(); x.moveTo(32, 32); x.quadraticCurveTo(32 + Math.cos(a + 0.5) * r * 0.6, 32 + Math.sin(a + 0.5) * r * 0.6, 32 + Math.cos(a) * r, 32 + Math.sin(a) * r); x.stroke(); } },
    note: x => { x.font = 'bold 42px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 5; x.strokeStyle = '#3b2a24'; x.strokeText('♪', 32, 32); x.fillStyle = '#f2c14e'; x.fillText('♪', 32, 32); },
    snip: x => outline(x, () => { x.beginPath(); x.moveTo(20, 50); x.lineTo(32, 10); x.lineTo(44, 50); x.closePath(); }, '#efe5cf'),
    treat: x => outline(x, () => { x.beginPath(); x.ellipse(32, 34, 20, 13, 0, 0, 6.3); }, '#c98b4a'),
    bang: x => { x.font = 'bold 50px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 6; x.strokeStyle = '#3b2a24'; x.strokeText('!', 32, 34); x.fillStyle = '#e0707a'; x.fillText('!', 32, 34); },
  };
  return (TEX[k] = icon(draws[k]));
}
export class FX {
  constructor(scene) {
    this.scene = scene; this.list = [];
  }
  spawn(k, x, y, z, o = {}) {
    const m = new THREE.SpriteMaterial({ map: tex(k), transparent: true, depthWrite: false, color: o.color ? new THREE.Color(o.color) : 0xffffff, fog: false });
    const s = new THREE.Sprite(m); s.position.set(x, y, z); s.scale.setScalar(o.size || 0.45); s.renderOrder = 10;
    this.scene.add(s);
    this.list.push({ s, vx: o.vx ?? (Math.random() - 0.5) * 0.6, vy: o.vy ?? 0.9, vz: o.vz ?? 0, life: o.life || 1.4, t: 0, size: o.size || 0.45, grav: o.grav || 0, spin: o.spin || 0, grow: o.grow ?? 0.3 });
  }
  head(a) { const p = new THREE.Vector3(); a.rig.head.getWorldPosition(p); return p; }
  hearts(a, n = 3) { const p = this.head(a); for (let i = 0; i < n; i++) this.spawn('heart', p.x + (Math.random() - 0.5) * 0.4, p.y + 0.3 + i * 0.1, p.z + 0.2, { vy: 0.8 + Math.random() * 0.5, size: 0.32 + Math.random() * 0.12, life: 1.4 + Math.random() * 0.4 }); }
  zzz(a) { const p = this.head(a); this.spawn('z', p.x + 0.2, p.y + 0.3, p.z, { vx: 0.25, vy: 0.45, size: 0.3, life: 2.2, grow: 0.6 }); }
  notes(a) { const p = this.head(a); this.spawn('note', p.x, p.y + 0.4, p.z, { vy: 0.7, size: 0.35, life: 1.4 }); }
  sparkle(x, y, z, n = 6) { for (let i = 0; i < n; i++) this.spawn('spark', x + (Math.random() - 0.5) * 0.8, y + Math.random() * 0.5, z + (Math.random() - 0.5) * 0.6, { vy: 0.6 + Math.random(), size: 0.22 + Math.random() * 0.15, life: 0.9 }); }
  puff(x, y, z, n = 6) { for (let i = 0; i < n; i++) this.spawn('puff', x + (Math.random() - 0.5) * 0.6, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.5, { vx: (Math.random() - 0.5) * 1.4, vy: 0.3 + Math.random() * 0.5, size: 0.6 + Math.random() * 0.4, life: 0.9, grow: 1.2 }); }
  fur(x, y, z, color, n = 5) { for (let i = 0; i < n; i++) this.spawn('fur', x + (Math.random() - 0.5) * 0.5, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.5, { color, vx: (Math.random() - 0.5) * 1.6, vy: 0.4 + Math.random() * 0.8, size: 0.35 + Math.random() * 0.3, life: 1.6, grav: -0.5 }); }
  snip(x, y, z) { this.spawn('snip', x, y, z, { vy: 1.2, size: 0.25, life: 0.7, grav: 3 }); }
  bang(a) { const p = this.head(a); this.spawn('bang', p.x, p.y + 0.5, p.z, { vy: 0.2, size: 0.5, life: 0.8, grow: 0.1 }); }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i]; f.t += dt;
      f.vy -= f.grav * dt;
      f.s.position.x += f.vx * dt; f.s.position.y += f.vy * dt; f.s.position.z += f.vz * dt;
      const k = f.t / f.life;
      f.s.material.opacity = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4);
      f.s.scale.setScalar(f.size * (1 + f.grow * k));
      if (k >= 1) { this.scene.remove(f.s); f.s.material.dispose(); this.list.splice(i, 1); }
    }
  }
}
