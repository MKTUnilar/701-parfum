/* ============================================================
   701 PARFUM — Fondo del inicio: agujero negro
   Portado a JS puro desde el componente React de referencia.
   Los shaders (la parte que importa) van tal cual: son GLSL.

   Cada píxel dispara un rayo y lo camina hacia atrás por el
   espacio curvo hasta que cae por el horizonte, se va, o cruza
   el disco de gas. El halo de arriba, el de abajo y el anillo
   fino pegado a la sombra son el mismo disco visto de nuevo por
   la luz doblada: nadie los alineó, se alinean solos.
   ============================================================ */
(function () {
  'use strict';

  const host = document.querySelector('.parallax__visuals');
  const lienzo = document.getElementById('hero-agujero');
  const header = document.querySelector('.parallax__header');
  if (!host || !lienzo || !header) return;

  const menosMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esChico = matchMedia('(max-width: 700px)').matches;

  /* ---------- Ajustes ---------- */
  const CFG = {
    distancia: 24,
    elevacion: -5.5,        // casi de canto: es la toma con el halo arriba de la sombra
    azimut: 0,
    giroPorScroll: 26,      // grados que gira el punto de vista de punta a punta del scroll
    inclinacion: -18,       // el disco en diagonal
    fov: 42,
    discoDentro: 3,         // órbita estable más chica; abajo de eso el gas cae
    discoFuera: 15,
    espesor: 0.26,
    densidad: 1,
    brillo: 1,
    giroGas: 0.05,
    grano: 0.48,
    doppler: 0.35,
    caliente: '#FFF3DE',
    medio: '#FFB23C',
    frio: '#8E3A0B',
    estrellas: 0.55,
    resplandor: 1,
    exposicion: 0.9,
    vineta: 0.22,
    pasos: esChico ? 120 : 175,
    escala: esChico ? 0.42 : 0.46,
    dprMax: esChico ? 1.1 : 1.15,
    foco: [0.5, 0.46],
  };

  /* ============================================================
     SHADERS
     ============================================================ */
  const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }
`;

  const SCENE_FRAG = `
precision highp float;
#define MAX_STEPS 460
#define WIND_CYCLE 46.0
varying vec2 vUv;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uCamPos, uRight, uUp, uFwd;
uniform float uTanHalf; uniform vec2 uFocus; uniform float uSteps; uniform float uSkyR;
uniform float uDiskIn, uDiskOut, uThick, uDensity, uSpin, uGrain, uBright, uDoppler;
uniform vec3 uHot, uMid, uCool;
uniform float uStars, uEncode; uniform vec2 uJitter; uniform float uSeed;

float hash13(vec3 p){ p = fract(p*0.3183099 + vec3(0.1,0.2,0.3)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  float n000=hash13(i), n100=hash13(i+vec3(1,0,0)), n010=hash13(i+vec3(0,1,0)), n110=hash13(i+vec3(1,1,0));
  float n001=hash13(i+vec3(0,0,1)), n101=hash13(i+vec3(1,0,1)), n011=hash13(i+vec3(0,1,1)), n111=hash13(i+vec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y), mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);
}
float fbm(vec3 p, float lod){
  float a=0.5, s=0.0;
  for(int i=0;i<4;i++){ s += (i==3 ? a*lod : a)*vnoise(p); p = p*2.03 + vec3(11.3,7.1,3.7); a *= 0.5; }
  return s;
}

void gasAt(vec3 p, float rd, float dt, out float dens, out vec3 tint, out float heat){
  float rn = clamp((rd-uDiskIn)/max(0.001,uDiskOut-uDiskIn),0.0,1.0);
  float tk = uThick*(0.35+1.25*rn);
  float v = p.y/tk;
  float sheet = exp(-v*v);
  float lod = clamp(1.0 - dt*uGrain*14.0, 0.0, 1.0);
  float phi = atan(p.z,p.x);
  float omega = uSpin*pow(uDiskIn/rd,1.5);
  float lr = log(rd)*1.1 + uSpin*uTime*0.05;
  float u = uTime/WIND_CYCLE;
  float fA = fract(u), fB = fract(u+0.5), w = abs(2.0*fA-1.0);
  float cloudsA = fbm(vec3(vec2(cos(phi+omega*fA*WIND_CYCLE), sin(phi+omega*fA*WIND_CYCLE))*(rd*uGrain), lr), lod);
  float cloudsB = fbm(vec3(vec2(cos(phi+omega*fB*WIND_CYCLE), sin(phi+omega*fB*WIND_CYCLE))*(rd*uGrain), lr+40.0), lod);
  float clouds = mix(cloudsA, cloudsB, w);
  float filaments = clouds*clouds*1.75;
  float inner = smoothstep(0.0,0.07,rn);
  float outer = 1.0 - smoothstep(0.45,1.0,rn);
  float prof = inner*outer*pow(uDiskIn/rd,2.0);
  dens = max(0.0, filaments*1.5-0.30)*sheet*prof*uDensity*4.6;
  heat = pow(uDiskIn/rd,0.8)*(0.72+0.55*clouds);
  tint = mix(uCool,uMid,smoothstep(0.10,0.52,heat));
  tint = mix(tint,uHot,smoothstep(0.52,1.05,heat));
}

vec3 starField(vec3 d){
  vec3 a = abs(d); vec2 uv; float face;
  if(a.x>=a.y && a.x>=a.z){ uv=d.yz/a.x; face = d.x>0.0?0.0:1.0; }
  else if(a.y>=a.z){ uv=d.xz/a.y; face = d.y>0.0?2.0:3.0; }
  else { uv=d.xy/a.z; face = d.z>0.0?4.0:5.0; }
  vec3 col = vec3(0.0);
  for(int k=0;k<3;k++){
    float sc = 90.0*pow(2.2,float(k));
    vec2 p = uv*sc; vec2 id = floor(p); vec2 f = fract(p)-0.5;
    float h = hash13(vec3(id, face*19.0));
    if(h>0.965){
      vec2 off = vec2(hash13(vec3(id,face+11.0)), hash13(vec3(id,face+23.0)));
      float dd = length(f-(off-0.5)*0.7);
      float s = smoothstep(0.055,0.0,dd);
      float warm = hash13(vec3(id,face+51.0));
      col += s*(0.6+4.5*fract(h*97.0))*mix(vec3(0.72,0.82,1.0), vec3(1.0,0.88,0.72), warm)/pow(2.2,float(k));
    }
  }
  col += vec3(0.013,0.017,0.030)*fbm(d*2.6,1.0);
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy + uJitter - uFocus*uRes)/uRes.y;
  vec3 dir = normalize(uFwd + (uv.x*uRight + uv.y*uUp)*2.0*uTanHalf);
  vec3 pos = uCamPos; vec3 vel = dir;
  vec3 hv = cross(pos,vel);
  float h2 = dot(hv,hv); float h = sqrt(h2);
  float swept = 0.0;
  vec3 col = vec3(0.0); float transmit = 1.0; bool captured = false;
  float jitter = fract(sin(dot(gl_FragCoord.xy+uSeed, vec2(12.9898,78.233)))*43758.5453);

  for(int i=0;i<MAX_STEPS;i++){
    if(float(i)>=uSteps) break;
    float r2 = dot(pos,pos); float r = sqrt(r2);
    if(r<1.0){ captured = true; break; }
    if(r>uSkyR && dot(pos,vel)>0.0) break;
    if(transmit<0.004) break;
    float dt = clamp(0.14*(r-1.0), 0.025, 1.1);
    if(r < uDiskOut*1.25){
      float rn = clamp((r-uDiskIn)/max(0.001,uDiskOut-uDiskIn),0.0,1.0);
      float tk = uThick*(0.35+1.25*rn);
      dt = min(dt, max(tk*0.38, abs(pos.y)*0.5));
    }
    swept += h*dt/r2;
    float deep = exp(-1.3*max(0.0, swept-4.6));
    jitter = fract(jitter+0.6180339887);
    vec3 mid = pos + vel*(dt*jitter);
    float rd = length(mid.xz);
    if(rd>uDiskIn && rd<uDiskOut && abs(mid.y)<uThick*5.0){
      float dens, heat; vec3 tint;
      gasAt(mid, rd, dt, dens, tint, heat);
      if(dens>0.001){
        vec3 tang = normalize(cross(vec3(0,1,0), vec3(mid.x,0.0,mid.z)));
        float beta = min(0.85, sqrt(0.5/max(rd,1.5)));
        float gam = inversesqrt(max(1e-4, 1.0-beta*beta));
        vec3 toObs = -normalize(vel);
        float g = 1.0/(gam*(1.0-beta*dot(tang,toObs)));
        g *= sqrt(max(0.05, 1.0-1.0/rd));
        float boost = pow(max(g,0.02), 3.0*uDoppler);
        vec3 shift = mix(vec3(1.0), g>1.0 ? vec3(0.86,0.94,1.14) : vec3(1.15,0.82,0.62), clamp(abs(g-1.0)*1.6,0.0,1.0)*uDoppler);
        float emit = uBright*(0.26+2.0*heat*heat);
        col += tint*shift*(emit*boost*dens*transmit*dt*deep);
        transmit *= exp(-dens*0.30*dt);
      }
    }
    vec3 acc = -1.5*h2*pos/(r2*r2*r);
    vel += acc*dt; pos += vel*dt;
  }

  if(!captured && uStars>0.001){
    vec3 toHole = normalize(-uCamPos);
    float sI = length(cross(normalize(dir), toHole));
    float sS = length(cross(normalize(vel), toHole));
    float stretch = clamp(sI/max(1e-3,sS), 1.0, 40.0);
    col += starField(normalize(vel))*uStars*transmit/stretch;
  }
  if(uEncode>0.5) col = col/(1.0+col);
  gl_FragColor = vec4(col,1.0);
}
`;

  const BLEND_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uCur, uPrev; uniform float uAlpha;
void main(){ gl_FragColor = vec4(mix(texture2D(uPrev,vUv).rgb, texture2D(uCur,vUv).rgb, uAlpha), 1.0); }
`;

  const BRIGHT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex; uniform vec2 uTexel; uniform float uDecode, uPack, uThreshold;
void main(){
  vec3 s = texture2D(uTex, vUv+uTexel*vec2(-1,-1)).rgb + texture2D(uTex, vUv+uTexel*vec2(1,-1)).rgb
         + texture2D(uTex, vUv+uTexel*vec2(-1,1)).rgb + texture2D(uTex, vUv+uTexel*vec2(1,1)).rgb;
  s *= 0.25;
  if(uDecode>0.5) s = s/max(vec3(0.002), 1.0-s);
  float l = max(s.r,max(s.g,s.b));
  s *= max(0.0, l-uThreshold)/max(0.0001,l);
  gl_FragColor = vec4(s*uPack, 1.0);
}
`;

  const BLUR_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex; uniform vec2 uStep;
void main(){
  vec3 s = texture2D(uTex,vUv).rgb*0.2270270;
  s += (texture2D(uTex,vUv+uStep*1.3846154).rgb + texture2D(uTex,vUv-uStep*1.3846154).rgb)*0.3162162;
  s += (texture2D(uTex,vUv+uStep*3.2307692).rgb + texture2D(uTex,vUv-uStep*3.2307692).rgb)*0.0702702;
  gl_FragColor = vec4(s,1.0);
}
`;

  const COMPOSITE_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene, uBloom;
uniform float uDecode, uPack, uGlow, uExposure, uVignette, uSeed;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
void main(){
  vec3 scene = texture2D(uScene,vUv).rgb;
  if(uDecode>0.5) scene = scene/max(vec3(0.002), 1.0-scene);
  vec3 bloom = texture2D(uBloom,vUv).rgb/uPack;
  vec3 c = scene + bloom*uGlow;
  c = aces(c*uExposure);
  c = pow(max(c,0.0), vec3(0.4545));
  vec2 d = vUv-0.5;
  c *= 1.0 - uVignette*dot(d,d)*1.9;
  float n = fract(sin(dot(gl_FragCoord.xy+uSeed, vec2(12.9898,78.233)))*43758.5453);
  c += (n-0.5)/255.0;
  gl_FragColor = vec4(c,1.0);
}
`;

  /* ============================================================
     WebGL
     ============================================================ */
  const RAD = Math.PI / 180;

  function aLineal(hex) {
    const h = hex.trim().replace('#', '');
    const f = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h.slice(0, 6);
    const n = parseInt(f, 16);
    return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255]
      .map(v => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
  }

  const opciones = { alpha: false, antialias: false, depth: false, stencil: false,
                     powerPreference: 'high-performance', preserveDrawingBuffer: false };
  const gl = lienzo.getContext('webgl2', opciones) || lienzo.getContext('webgl', opciones);

  /* Si no hay WebGL, el lienzo se esconde y queda el fondo del CSS.
     Un canvas sin contexto no se queda callado: pinta blanco. */
  function rendirse(motivo) {
    host.dataset.webgl = motivo;
    lienzo.style.display = 'none';
  }
  if (!gl) { rendirse('sin-webgl'); return; }

  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const tarjeta = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
  const porSoftware = /swiftshader|llvmpipe|softpipe|software|microsoft basic/i.test(tarjeta);
  const esGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

  function compilar(tipo, src) {
    const sh = gl.createShader(tipo);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('agujero: shader —', gl.getShaderInfoLog(sh) || 'sin log');
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function programa(frag) {
    const vs = compilar(gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(p)); return null; }
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      if (info) u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  /* Medios flotantes: mantienen el gas lo bastante brillante como para
     que el resplandor funcione. Si no están, se empaqueta en 8 bits. */
  let hdr = true, tipoTex = gl.UNSIGNED_BYTE, interno = gl.RGBA;
  if (esGL2) {
    if (gl.getExtension('EXT_color_buffer_half_float') || gl.getExtension('EXT_color_buffer_float')) {
      tipoTex = gl.HALF_FLOAT; interno = gl.RGBA16F;
    } else hdr = false;
  } else {
    const hf = gl.getExtension('OES_texture_half_float');
    const cb = gl.getExtension('EXT_color_buffer_half_float');
    if (hf && cb) tipoTex = hf.HALF_FLOAT_OES; else hdr = false;
  }
  if (!hdr) { tipoTex = gl.UNSIGNED_BYTE; interno = gl.RGBA; }
  const filtro = (esGL2 || gl.getExtension('OES_texture_half_float_linear') || !hdr) ? gl.LINEAR : gl.NEAREST;
  const pack = hdr ? 1 : 0.12;

  function destino(w, h) {
    const tex = gl.createTexture(), fb = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, interno, w, h, 0, gl.RGBA, tipoTex, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok) { gl.deleteTexture(tex); gl.deleteFramebuffer(fb); return null; }
    return { fb, tex, w, h };
  }

  let pEscena, pMezcla, pBrillo, pDesenfoque, pFinal, vbo;
  let escena, histA, histB, bloomA, bloomB;
  let asentados = 0;
  let ancho = 0, alto = 0, eAncho = 0, eAlto = 0;

  function construir() {
    pEscena = programa(SCENE_FRAG);
    pMezcla = programa(BLEND_FRAG);
    pBrillo = programa(BRIGHT_FRAG);
    pDesenfoque = programa(BLUR_FRAG);
    pFinal = programa(COMPOSITE_FRAG);
    if (!pEscena || !pMezcla || !pBrillo || !pDesenfoque || !pFinal) return false;
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    return true;
  }

  function tirarDestinos() {
    [escena, histA, histB, bloomA, bloomB].forEach(t => {
      if (!t) return;
      gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb);
    });
    escena = histA = histB = bloomA = bloomB = null;
    asentados = 0;
  }

  function medir() {
    const r = host.getBoundingClientRect();
    const dpr = porSoftware ? 1 : Math.min(devicePixelRatio || 1, CFG.dprMax);
    const cw = Math.max(1, Math.round(r.width)), ch = Math.max(1, Math.round(r.height));
    const esc = porSoftware ? 0.34 : CFG.escala;
    const w = Math.max(2, Math.round(cw*dpr)), h = Math.max(2, Math.round(ch*dpr));
    const sw = Math.max(2, Math.round(w*esc)), sh = Math.max(2, Math.round(h*esc));
    if (w === ancho && h === alto && sw === eAncho && sh === eAlto) return;
    ancho = w; alto = h; eAncho = sw; eAlto = sh;
    lienzo.width = w; lienzo.height = h;
    lienzo.style.width = cw + 'px'; lienzo.style.height = ch + 'px';
    tirarDestinos();
    escena = destino(sw, sh); histA = destino(sw, sh); histB = destino(sw, sh);
    bloomA = destino(Math.max(2, sw>>2), Math.max(2, sh>>2));
    bloomB = destino(Math.max(2, sw>>2), Math.max(2, sh>>2));
  }

  /* Ocho puntos de mira dentro del píxel (Halton 2,3): se reparten
     mucho mejor que ocho al azar, y de eso vive el promediado. */
  const HALTON = [[0.5,0.333],[0.25,0.667],[0.75,0.111],[0.125,0.444],
                  [0.625,0.778],[0.375,0.222],[0.875,0.556],[0.0625,0.889]];

  function paso(prog, dest) {
    gl.useProgram(prog.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dest ? dest.fb : null);
    gl.viewport(0, 0, dest ? dest.w : ancho, dest ? dest.h : alto);
  }
  const pintar = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
  function usar(tex, i) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); }

  /* El scroll gira lentamente el punto de vista */
  function avance() {
    const r = header.getBoundingClientRect();
    const recorrido = r.height - innerHeight;
    return Math.min(1, Math.max(0, -r.top / (recorrido || 1)));
  }

  function dibujar(t) {
    if (!escena || !histA || !histB || !bloomA || !bloomB) return;

    const az = (CFG.azimut + avance() * CFG.giroPorScroll) * RAD;
    const el = Math.max(-88, Math.min(88, CFG.elevacion)) * RAD;
    const d = Math.max(2.2, CFG.distancia);
    const ce = Math.cos(el);
    const cx = d*ce*Math.cos(az), cy = d*Math.sin(el), cz = d*ce*Math.sin(az);

    const fx = -cx/d, fy = -cy/d, fz = -cz/d;
    let rx = fz, ry = 0, rz = -fx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl; ry /= rl; rz /= rl;
    const ux = ry*fz - rz*fy, uy = rz*fx - rx*fz, uz = rx*fy - ry*fx;
    const cr = Math.cos(CFG.inclinacion*RAD), sr = Math.sin(CFG.inclinacion*RAD);
    const RX = rx*cr+ux*sr, RY = ry*cr+uy*sr, RZ = rz*cr+uz*sr;
    const UX = -rx*sr+ux*cr, UY = -ry*sr+uy*cr, UZ = -rz*sr+uz*cr;

    const hot = aLineal(CFG.caliente), mid = aLineal(CFG.medio), cool = aLineal(CFG.frio);
    const fuera = Math.max(CFG.discoDentro + 0.5, CFG.discoFuera);

    paso(pEscena, escena);
    const u = pEscena.u;
    gl.uniform2f(u.uRes, escena.w, escena.h);
    gl.uniform1f(u.uTime, t);
    gl.uniform3f(u.uCamPos, cx, cy, cz);
    gl.uniform3f(u.uRight, RX, RY, RZ);
    gl.uniform3f(u.uUp, UX, UY, UZ);
    gl.uniform3f(u.uFwd, fx, fy, fz);
    gl.uniform1f(u.uTanHalf, Math.tan(CFG.fov*0.5*RAD));
    gl.uniform2f(u.uFocus, CFG.foco[0], 1 - CFG.foco[1]);
    gl.uniform1f(u.uSteps, porSoftware ? 110 : CFG.pasos);
    gl.uniform1f(u.uSkyR, Math.max(d*1.35, fuera*2.4));
    gl.uniform1f(u.uDiskIn, CFG.discoDentro);
    gl.uniform1f(u.uDiskOut, fuera);
    gl.uniform1f(u.uThick, CFG.espesor);
    gl.uniform1f(u.uDensity, CFG.densidad);
    gl.uniform1f(u.uSpin, CFG.giroGas * 6.2831853);
    gl.uniform1f(u.uGrain, CFG.grano);
    gl.uniform1f(u.uBright, CFG.brillo);
    gl.uniform1f(u.uDoppler, CFG.doppler);
    gl.uniform3f(u.uHot, hot[0], hot[1], hot[2]);
    gl.uniform3f(u.uMid, mid[0], mid[1], mid[2]);
    gl.uniform3f(u.uCool, cool[0], cool[1], cool[2]);
    gl.uniform1f(u.uStars, CFG.estrellas);
    gl.uniform1f(u.uEncode, hdr ? 0 : 1);
    const jj = HALTON[asentados % HALTON.length];
    gl.uniform2f(u.uJitter, jj[0]-0.5, jj[1]-0.5);
    gl.uniform1f(u.uSeed, (asentados % 64) * 17.13);
    pintar();

    const alfa = asentados === 0 ? 1 : 0.14;
    paso(pMezcla, histB);
    usar(escena.tex, 0); usar(histA.tex, 1);
    gl.uniform1i(pMezcla.u.uCur, 0);
    gl.uniform1i(pMezcla.u.uPrev, 1);
    gl.uniform1f(pMezcla.u.uAlpha, alfa);
    pintar();
    const visto = histB; const tmp = histA; histA = histB; histB = tmp;
    asentados++;

    paso(pBrillo, bloomA);
    usar(visto.tex, 0);
    gl.uniform1i(pBrillo.u.uTex, 0);
    gl.uniform2f(pBrillo.u.uTexel, 1/visto.w, 1/visto.h);
    gl.uniform1f(pBrillo.u.uDecode, hdr ? 0 : 1);
    gl.uniform1f(pBrillo.u.uPack, pack);
    gl.uniform1f(pBrillo.u.uThreshold, 0.85);
    pintar();

    const pasoDes = (src, dst, dx, dy) => {
      paso(pDesenfoque, dst);
      usar(src.tex, 0);
      gl.uniform1i(pDesenfoque.u.uTex, 0);
      gl.uniform2f(pDesenfoque.u.uStep, dx/dst.w, dy/dst.h);
      pintar();
    };
    pasoDes(bloomA, bloomB, 1, 0);
    pasoDes(bloomB, bloomA, 0, 1);
    pasoDes(bloomA, bloomB, 2.6, 0);
    pasoDes(bloomB, bloomA, 0, 2.6);

    paso(pFinal, null);
    usar(visto.tex, 0); usar(bloomA.tex, 1);
    gl.uniform1i(pFinal.u.uScene, 0);
    gl.uniform1i(pFinal.u.uBloom, 1);
    gl.uniform1f(pFinal.u.uDecode, hdr ? 0 : 1);
    gl.uniform1f(pFinal.u.uPack, pack);
    gl.uniform1f(pFinal.u.uGlow, CFG.resplandor * 0.26);
    gl.uniform1f(pFinal.u.uExposure, CFG.exposicion);
    gl.uniform1f(pFinal.u.uVignette, CFG.vineta);
    gl.uniform1f(pFinal.u.uSeed, (t*60) % 1000);
    pintar();
  }

  function asentar(veces) { for (let i = 0; i < veces; i++) dibujar(reloj); }

  /* ---------- Bucle ---------- */
  let reloj = menosMovimiento ? 6 : 0;
  let ultimo = 0, corriendo = true, visible = true, raf = 0;

  /* El gas gira muy despacio: dibujarlo 30 veces por segundo en vez de 60
     no se nota y libera la mitad del trabajo, que es lo que hace que el
     resto de la página (scroll, parallax, frasco) vaya suelto. */
  const MS_POR_CUADRO = 1000 / 30;
  let proximo = 0;

  function latido(ahora) {
    if (!corriendo) return;
    raf = requestAnimationFrame(latido);
    if (!visible) { ultimo = ahora; return; }
    if (ahora < proximo) return;
    proximo = ahora + MS_POR_CUADRO;
    const dt = ultimo ? Math.min(0.08, (ahora - ultimo)/1000) : 0;
    ultimo = ahora;
    if (!menosMovimiento) reloj += dt;
    dibujar(reloj);
  }

  if (!construir()) { rendirse('no-compila'); return; }
  medir();
  asentar(menosMovimiento ? 16 : 1);
  lienzo.classList.add('esta-listo');
  if (!menosMovimiento) raf = requestAnimationFrame(latido);

  new ResizeObserver(() => { medir(); if (menosMovimiento) asentar(16); }).observe(host);
  new IntersectionObserver(e => { visible = e[0] ? e[0].isIntersecting : true; }, { threshold: 0 }).observe(host);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; ultimo = 0; });

  lienzo.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); corriendo = false; cancelAnimationFrame(raf);
    lienzo.style.display = 'none';
  });
  lienzo.addEventListener('webglcontextrestored', () => {
    ancho = alto = eAncho = eAlto = 0;
    if (!construir()) { rendirse('no-compila'); return; }
    lienzo.style.display = ''; host.dataset.webgl = '';
    medir(); corriendo = true; ultimo = 0;
    asentar(menosMovimiento ? 16 : 1);
    if (!menosMovimiento) raf = requestAnimationFrame(latido);
  });
})();
