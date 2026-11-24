// Life with Cats — the camera's own look: a miniature-set depth of field
// (sharp where the cats are, soft above and below), a warm film grade,
// a gentle vignette and a little grain.
import * as THREE from '../lib/three.module.min.js';

const VS = `varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FS = `precision highp float;
uniform sampler2D tDiffuse; uniform vec2 res; uniform float focusY; uniform float band; uniform float blur; uniform float time;
uniform float exposure; uniform float vig; uniform float grain; uniform float warm; uniform float sat; uniform float flash;
varying vec2 vUv;
vec3 aces(vec3 x){ x *= 0.92; return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  float d = abs(vUv.y - focusY);
  float r = smoothstep(band, band + 0.32, d) * blur;
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  if (r > 0.3) {
    vec3 acc = c; float w = 1.0;
    for (int i = 0; i < 12; i++) {
      float fi = float(i);
      float a = fi * 2.39996; float rr = sqrt((fi + 0.5) / 12.0) * r;
      vec2 o = vec2(cos(a), sin(a)) * rr / res;
      acc += texture2D(tDiffuse, vUv + o).rgb; w += 1.0;
    }
    c = acc / w;
  }
  c *= exposure;
  c = aces(c);
  // a warm, slightly lifted film grade
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, sat);
  c += vec3(0.022, 0.012, -0.004) * warm * (1.0 - l);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);
  vec2 q = vUv - 0.5;
  c *= 1.0 - vig * dot(q * vec2(1.1, 1.3), q * vec2(1.1, 1.3)) * 1.6;
  c = toSRGB(clamp(c, 0.0, 1.0));
  c += (hash(vUv * res + time * 61.0) - 0.5) * grain;
  c = mix(c, vec3(1.0), flash);
  gl_FragColor = vec4(c, 1.0);
}`;

export class Post {
  constructor(renderer) {
    this.r = renderer;
    const gl = renderer.getContext();
    const hf = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
    this.samples = Math.min(4, renderer.capabilities.maxSamples || 0);
    this.rt = new THREE.WebGLRenderTarget(4, 4, { type: hf ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: this.samples, depthBuffer: true });
    this.u = {
      tDiffuse: { value: this.rt.texture }, res: { value: new THREE.Vector2(1, 1) }, focusY: { value: 0.45 }, band: { value: 0.2 }, blur: { value: 5 }, time: { value: 0 },
      exposure: { value: 1.0 }, vig: { value: 0.32 }, grain: { value: 0.035 }, warm: { value: 1 }, sat: { value: 1.04 }, flash: { value: 0 },
    };
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VS, fragmentShader: FS, depthTest: false, depthWrite: false });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.quad = new THREE.Mesh(g, this.mat); this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  setSize(w, h, pr) {
    const W = Math.max(1, Math.floor(w * pr)), H = Math.max(1, Math.floor(h * pr));
    this.rt.setSize(W, H); this.u.res.value.set(W, H);
    this.u.blur.value = 5.5 * pr;
  }
  render(scene, camera, t) {
    this.u.time.value = t % 100;
    this.r.setRenderTarget(this.rt); this.r.render(scene, camera);
    this.r.setRenderTarget(null); this.r.render(this.scene, this.cam);
  }
  rebuild() { const s = this.rt; const w = s.width, h = s.height; this.rt.dispose(); this.rt = new THREE.WebGLRenderTarget(w, h, { type: s.texture.type, samples: this.samples, depthBuffer: true }); this.u.tDiffuse.value = this.rt.texture; }
}
