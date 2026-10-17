// ADRIATICA — the figure.
//
// Built from boxes. No skeleton, no animation library, no imported model, no
// inverse kinematics. Faceless: the head is a plain box, consistent with the
// rule that every figure in this game is seen from behind and has no features.
//
// Two named states. 'walking' is sine-driven limb rotation with a bob and a
// forward lean. 'still' is a pose in its own right — standing, arms a little
// out from the sides, head tilted very slightly up — because in Level 2
// stopping is the verb, and it must not look like the walk cycle switched off.

import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';

const HEIGHT = 1.5;

export class Figure {
  constructor(colorHex) {
    this.material = new THREE.MeshLambertMaterial({ color: colorHex, flatShading: true });
    this.material.name = 'figure';

    // Outer group owns world position and facing. Inner group owns lean and
    // bob, so the two never fight each other.
    this.group = new THREE.Group();
    this.group.name = 'figure';
    this.body = new THREE.Group();
    this.group.add(this.body);

    const box = (w, h, d, parent, y) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.material);
      m.position.y = y;
      parent.add(m);
      return m;
    };

    this.torso = box(0.42, 0.56, 0.26, this.body, 0.94);
    this.head = new THREE.Group();
    this.head.position.y = 1.24;
    this.body.add(this.head);
    box(0.30, 0.30, 0.28, this.head, 0.15);

    // Limbs hang from pivot groups so rotation happens at shoulder and hip.
    const limb = (w, h, d, x, y) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      this.body.add(pivot);
      box(w, h, d, pivot, -h / 2);
      return pivot;
    };

    this.armL = limb(0.13, 0.50, 0.13, -0.29, 1.16);
    this.armR = limb(0.13, 0.50, 0.13, 0.29, 1.16);
    this.legL = limb(0.16, 0.62, 0.17, -0.11, 0.66);
    this.legR = limb(0.16, 0.62, 0.17, 0.11, 0.66);

    this.phase = 0;
    this.yaw = 0;
    this.state = 'still';
    this.blend = 0; // 0 = still pose, 1 = walking
  }

  get height() { return HEIGHT; }

  setState(name) { this.state = name; }

  // dt seconds, distance moved this frame in world units.
  update(dt, distance) {
    const walking = distance > 1e-5;
    this.state = walking ? 'walking' : 'still';

    // Ease between the two poses so stopping settles instead of snapping.
    const target = walking ? 1 : 0;
    const rate = walking ? 6 : 3.2;
    this.blend += (target - this.blend) * Math.min(1, dt * rate);

    // Phase advances with ground covered, not with time, so feet never slide.
    this.phase += distance * 3.0;

    const s = Math.sin(this.phase);
    const c = Math.cos(this.phase);
    const b = this.blend;

    this.legL.rotation.x = s * 0.70 * b;
    this.legR.rotation.x = -s * 0.70 * b;
    this.armL.rotation.x = -s * 0.55 * b;
    this.armR.rotation.x = s * 0.55 * b;

    // Stillness pose: arms out from the sides, head tilted very slightly up.
    const still = 1 - b;
    this.armL.rotation.z = 0.22 * still;
    this.armR.rotation.z = -0.22 * still;
    this.head.rotation.x = -0.13 * still;

    this.body.rotation.x = 0.07 * b;
    this.body.position.y = Math.abs(c) * 0.055 * b;

    this.group.rotation.y = this.yaw;
  }

  // Shortest-way-round turn toward a heading.
  faceToward(dx, dz, dt) {
    if (Math.abs(dx) < 1e-6 && Math.abs(dz) < 1e-6) return;
    const target = Math.atan2(dx, dz);
    let delta = target - this.yaw;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.yaw += delta * Math.min(1, dt * 9);
  }

  dispose() {
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.material.dispose();
  }
}
