/**
 * Blog Cosmic Orb — Three.js particle nebula background
 * Adapted from CosmoSense for Wester's blog homepage.
 *
 * Technique: InstancedBufferGeometry billboard quads
 * 3 particle layers: cream outer ring · golden disk · blue disk
 * Phyllotaxis (golden-angle) distribution for even coverage.
 */

import * as THREE from 'three';

// ─── Layer configs ──────────────────────────────────────────

const LAYERS = [
  {
    count: 350,   minRadius: 3.0, maxRadius: 5.3, ySpread: 3.0,
    color: '#fff8d0', opacity: 1.0,
    size: 0.018, sizeVariation: 0.26, sizeNoiseFreq: 1.19,
    rotSpeed: 0.00, rotVariation: 0.03,
    twist: { speed: 0.00, variation: 0.03, variationFreq: 0.5, freq: 1.0, amp: 1.2 },
    noise: { freq: 0.00, amp: 0.10, offset: 0.0 },
  },
  {
    count: 8000,  minRadius: 0.5, maxRadius: 5.0, ySpread: 0.40,
    color: '#ffe040', opacity: 0.36,
    size: 0.030, sizeVariation: 0.197, sizeNoiseFreq: 0.658,
    rotSpeed: 0.10, rotVariation: 0.168,
    twist: { speed: 1.76, variation: 0.30, variationFreq: 1.196, freq: 0.2136, amp: 0.5 },
    noise: { freq: 0.69, amp: 0.092, offset: 0.6 },
  },
  {
    count: 16000, minRadius: 0.5, maxRadius: 5.0, ySpread: 0.40,
    color: '#90bcdf', opacity: 0.28,
    size: 0.0184, sizeVariation: 0.144, sizeNoiseFreq: 1.62,
    rotSpeed: 0.12, rotVariation: 0.010,
    twist: { speed: 0.12, variation: 1.30, variationFreq: 0.720, freq: 0.183, amp: 0.0 },
    noise: { freq: 1.37, amp: 0.188, offset: 2.22 },
  },
];

// ─── GLSL helpers ───────────────────────────────────────────

const NOISE_GLSL = /* glsl */`
vec3 _p3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 _p4(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 _pm(vec4 x){return _p4(((x*34.)+10.)*x);}
vec4 _ti(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float perlinNoise(vec3 P){
  vec3 i0=floor(P),i1=i0+vec3(1.);
  i0=_p3(i0);i1=_p3(i1);
  vec3 f0=fract(P),f1=f0-vec3(1.);
  vec4 ix=vec4(i0.x,i1.x,i0.x,i1.x);
  vec4 iy=vec4(i0.yy,i1.yy);
  vec4 iz0=i0.zzzz,iz1=i1.zzzz;
  vec4 ixy=_pm(_pm(ix)+iy);
  vec4 ixy0=_pm(ixy+iz0),ixy1=_pm(ixy+iz1);
  vec4 gx0=ixy0/7.;
  vec4 gy0=fract(floor(gx0)/7.)-.5;gx0=fract(gx0);
  vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0);
  vec4 s0=step(gz0,vec4(0.));gx0-=s0*(step(0.,gx0)-.5);gy0-=s0*(step(0.,gy0)-.5);
  vec4 gx1=ixy1/7.;
  vec4 gy1=fract(floor(gx1)/7.)-.5;gx1=fract(gx1);
  vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1);
  vec4 s1=step(gz1,vec4(0.));gx1-=s1*(step(0.,gx1)-.5);gy1-=s1*(step(0.,gy1)-.5);
  vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);
  vec4 n0=_ti(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000*=n0.x;g010*=n0.y;g100*=n0.z;g110*=n0.w;
  vec4 n1=_ti(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001*=n1.x;g011*=n1.y;g101*=n1.z;g111*=n1.w;
  float n000=dot(g000,f0),n100=dot(g100,vec3(f1.x,f0.yz));
  float n010=dot(g010,vec3(f0.x,f1.y,f0.z)),n110=dot(g110,vec3(f1.xy,f0.z));
  float n001=dot(g001,vec3(f0.xy,f1.z)),n101=dot(g101,vec3(f1.x,f0.y,f1.z));
  float n011=dot(g011,vec3(f0.x,f1.yz)),n111=dot(g111,f1);
  vec3 fade=f0*f0*f0*(f0*(f0*6.-15.)+10.);
  vec4 nz=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade.z);
  vec2 nyz=mix(nz.xy,nz.zw,fade.y);
  return 2.2*mix(nyz.x,nyz.y,fade.x);
}

vec3 fbm3(vec3 p,float freq,float off){
  return vec3(
    perlinNoise((p+off)*freq),
    perlinNoise((p+off+19.7)*freq),
    perlinNoise((p+off-27.4)*freq)
  );
}
mat3 rotateY(float a){float s=sin(a),c=cos(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
`;

// ─── Shader ─────────────────────────────────────────────────

const VERT = /* glsl */`
precision highp float;
attribute vec3  aWorldPos;
uniform float   uTime,uSize,uSizeVariation,uSizeNoiseFreq;
uniform float   uRotSpeed,uRotVariation;
uniform float   uTwistSpeed,uTwistVariation,uTwistVariationFreq,uTwistFreq,uTwistAmp;
uniform float   uNoiseFreq,uNoiseAmp,uNoiseOffset;
uniform vec3    uCA,uCB;
varying vec3    vColor;
varying float   vAlpha;

${NOISE_GLSL}

void main(){
  float rnd=perlinNoise(aWorldPos*uSizeNoiseFreq)*0.5+0.5;
  vec3 rotated=rotateY(5.*uTime*(uRotSpeed+rnd*uRotVariation))*aWorldPos;
  float twistScale=perlinNoise(aWorldPos*uTwistVariationFreq)*0.5+0.5;
  vec3 twistPos=rotateY(uTime*(uTwistSpeed+twistScale*uTwistVariation)+length(aWorldPos.xz))*rotated;
  vec3 twistOffset=fbm3(twistPos,uTwistFreq,0.)*uTwistAmp;
  vec3 noiseOffset=fbm3(rotated+twistOffset,uNoiseFreq,uNoiseOffset)*uNoiseAmp;
  vec3 wp=(modelMatrix*vec4(rotated+twistOffset+noiseOffset,1.)).xyz;
  vec4 vp=viewMatrix*vec4(wp,1.);
  vp.xyz+=position*(uSize+rnd*uSizeVariation);
  gl_Position=projectionMatrix*vp;
  vColor=mix(uCA,uCB,clamp(rnd,0.,1.));
  vAlpha=0.35+rnd*0.65;
}
`;

const FRAG = /* glsl */`
precision mediump float;
uniform sampler2D uTex;
uniform float     uOpacity;
varying vec3  vColor;
varying float vAlpha;
void main(){
  float a=texture2D(uTex,gl_PointCoord).r;
  gl_FragColor=vec4(vColor,a*vAlpha*uOpacity);
}
`;

// ─── Geometry ───────────────────────────────────────────────

function buildGeometry(count, minR, maxR, ySpread) {
  const GA   = Math.PI * 2 * 0.618033984;
  const quad = new THREE.PlaneGeometry(1, 1);
  const geo  = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', quad.getAttribute('position'));
  geo.index = quad.index;

  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r  = Math.sqrt(i / Math.max(count - 1, 1));
    const a  = GA * i;
    const nx = r * Math.cos(a), nz = r * Math.sin(a);
    const len = Math.sqrt(nx * nx + nz * nz) || 1e-9;
    const fr  = r * (maxR - minR) + minR;
    const sc  = fr / len;
    pos[i * 3]     = nx * sc + (Math.random() - 0.5) * 0.05;
    pos[i * 3 + 1] = (Math.random() - 0.5) * ySpread;
    pos[i * 3 + 2] = nz * sc + (Math.random() - 0.5) * 0.05;
  }
  geo.setAttribute('aWorldPos', new THREE.InstancedBufferAttribute(pos, 3));
  geo.instanceCount = count;
  return geo;
}

// ─── Init ───────────────────────────────────────────────────

function init() {
  const canvas = document.getElementById('blog-cosmic-orb');
  if (!canvas) return;

  const W = window.innerWidth, H = window.innerHeight;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(68, W / H, 0.001, 100);
  camera.position.set(0, 4, 7);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false,
    powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);

  const texture  = new THREE.TextureLoader().load('/images/static/particle.webp');

  const materials = LAYERS.map(cfg => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: texture },
        uOpacity:            { value: cfg.opacity },
        uTime:               { value: 0 },
        uSize:               { value: cfg.size },
        uSizeVariation:      { value: cfg.sizeVariation },
        uSizeNoiseFreq:      { value: cfg.sizeNoiseFreq },
        uRotSpeed:           { value: cfg.rotSpeed },
        uRotVariation:       { value: cfg.rotVariation },
        uTwistSpeed:         { value: cfg.twist.speed },
        uTwistVariation:     { value: cfg.twist.variation },
        uTwistVariationFreq: { value: cfg.twist.variationFreq },
        uTwistFreq:          { value: cfg.twist.freq },
        uTwistAmp:           { value: cfg.twist.amp },
        uNoiseFreq:          { value: cfg.noise.freq },
        uNoiseAmp:           { value: cfg.noise.amp },
        uNoiseOffset:        { value: cfg.noise.offset },
        uCA: { value: new THREE.Color(cfg.color) },
        uCB: { value: new THREE.Color('#ffffff') },
      },
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    scene.add(new THREE.Mesh(buildGeometry(cfg.count, cfg.minRadius, cfg.maxRadius, cfg.ySpread), mat));
    return mat;
  });

  scene.rotation.z = 0.15;

  // ── Animation ──
  let elapsed = 0, rafId = 0;

  function tick() {
    elapsed += 0.05;
    const t = elapsed * 0.01;
    materials.forEach(m => { m.uniforms.uTime.value = t; });
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  function pause()  { cancelAnimationFrame(rafId); }
  function resume() { rafId = requestAnimationFrame(tick); }

  resume();
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());

  // ── Resize ──
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    renderer.setSize(w, h, false);
  }, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
