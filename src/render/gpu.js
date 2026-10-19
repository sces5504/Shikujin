// Batched GPU sprites + analytic projectile particles. Simulation never depends
// on this layer; Canvas remains a functional fallback after context loss.
const VS = `attribute vec2 aPosition;attribute vec2 aUV;attribute vec4 aColor;uniform vec2 uResolution;uniform vec3 uCamera;varying vec2 vUV;varying vec4 vColor;void main(){vec2 p=(aPosition-uCamera.xy)*uCamera.z+uResolution*.5;gl_Position=vec4(p/uResolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);vUV=aUV;vColor=aColor;}`;
const FS = `precision mediump float;uniform sampler2D uTexture;varying vec2 vUV;varying vec4 vColor;void main(){vec4 t=texture2D(uTexture,vUV);if(t.a<.01)discard;gl_FragColor=t*vColor;}`;
const PVS = `attribute vec4 aPoint;attribute vec4 aStyle;uniform vec2 uResolution;uniform vec3 uCamera;uniform float uDpr;varying vec4 vStyle;void main(){vec2 p=(aPoint.xy-uCamera.xy)*uCamera.z+uResolution*.5;gl_Position=vec4(p/uResolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);gl_PointSize=aPoint.z*uCamera.z*uDpr;vStyle=vec4(aPoint.w,aStyle.xyz);}`;
const PFS = `precision mediump float;varying vec4 vStyle;void main(){vec2 q=(gl_PointCoord-.5)*2.;float r2=dot(q,q);if(r2>1.)discard;vec3 color;float a;if(vStyle.x<.5){float core=1.-smoothstep(.06,.19,r2);float rim=1.-smoothstep(.25,.48,r2);color=mix(vec3(1.,.46,.1),vec3(1.,.99,.75),core);a=max(rim*.95,(1.-r2)*.2);}else if(vStyle.x<1.5){vec2 d=vec2(vStyle.y,-vStyle.z);float along=dot(q,d),across=abs(q.x*d.y-q.y*d.x);a=(1.-smoothstep(.1,.25,across))*(1.-smoothstep(.65,1.,abs(along)));color=mix(vec3(.12,.52,1.),vec3(.8,1.,1.),1.-smoothstep(.02,.12,across));}else if(vStyle.x<2.5){color=vec3(1.,.66,.25);a=(1.-smoothstep(.1,.3,abs(q.x)))*(1.-r2);}else if(vStyle.x<3.5){float diamond=abs(q.x)+abs(q.y);a=1.-smoothstep(.4,.75,diamond);color=vec3(.4,1.,.8);}else{a=(1.-r2)*vStyle.w;color=vec3(1.,.55,.14);}gl_FragColor=vec4(color,a);}`;

export class GPULayer {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "gpuBattlefield";
    this.canvas.setAttribute("aria-hidden", "true");
    document.getElementById("battlefield").after(this.canvas);
    this.gl = this.canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    this.available = !!this.gl;
    this.groups = new Map();
    this.textures = new WeakMap();
    this.points = new Float32Array(4096 * 8);
    this.pointCount = 0;
    if (!this.gl) return;
    try {
      this.initialize();
    } catch (error) {
      this.error = error.message;
      this.available = false;
    }
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.available = false;
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      try {
        this.textures = new WeakMap();
        this.groups.clear();
        this.initialize();
        this.available = true;
      } catch (error) {
        this.error = error.message;
        this.available = false;
      }
    });
  }
  initialize() {
    const g = this.gl;
    const program = (vs, fs) => {
      const p = g.createProgram();
      for (const [type, source] of [
        [g.VERTEX_SHADER, vs],
        [g.FRAGMENT_SHADER, fs],
      ]) {
        const s = g.createShader(type);
        g.shaderSource(s, source);
        g.compileShader(s);
        if (!g.getShaderParameter(s, g.COMPILE_STATUS))
          throw Error("GPU shader compilation failed");
        g.attachShader(p, s);
      }
      g.linkProgram(p);
      if (!g.getProgramParameter(p, g.LINK_STATUS))
        throw Error("GPU shader linking failed");
      return p;
    };
    this.spriteProgram = program(VS, FS);
    this.pointProgram = program(PVS, PFS);
    this.buffer = g.createBuffer();
    g.enable(g.BLEND);
    g.disable(g.DEPTH_TEST);
    this.readback = new Uint8Array(4);
  }
  resize(W, H, dpr) {
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(W * dpr));
    this.canvas.height = Math.max(1, Math.round(H * dpr));
    if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  begin(W, H, x, y, scale) {
    this.W = W;
    this.H = H;
    this.camera = [x, y, scale];
    this.pointCount = 0;
    for (const group of this.groups.values()) group.count = 0;
    if (this.available) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
  }
  sprite(image, x, y, size, angle = 0, alpha = 1, black = false) {
    if (!image || !this.available) return;
    let group = this.groups.get(image);
    if (!group) {
      group = { data: new Float32Array(1024 * 6 * 8), count: 0 };
      this.groups.set(image, group);
    }
    if (group.count + 48 > group.data.length) return;
    const co = (Math.cos(angle) * size) / 2,
      si = (Math.sin(angle) * size) / 2;
    for (const [cx, cy, u, v] of [
      [-1, -1, 0, 0],
      [1, -1, 1, 0],
      [-1, 1, 0, 1],
      [-1, 1, 0, 1],
      [1, -1, 1, 0],
      [1, 1, 1, 1],
    ]) {
      let o = group.count;
      group.data[o++] = x + cx * co - cy * si;
      group.data[o++] = y + cx * si + cy * co;
      group.data[o++] = u;
      group.data[o++] = v;
      group.data[o++] = black ? 0 : 1;
      group.data[o++] = black ? 0 : 1;
      group.data[o++] = black ? 0 : 1;
      group.data[o++] = alpha;
      group.count = o;
    }
  }
  point(x, y, size, type = 0, dx = 0, dy = 0, alpha = 1) {
    if (this.pointCount >= 4096) return;
    const o = this.pointCount++ * 8;
    this.points.set([x, y, size, type, dx, dy, alpha, 0], o);
  }
  uniforms(p) {
    const g = this.gl;
    g.uniform2f(g.getUniformLocation(p, "uResolution"), this.W, this.H);
    g.uniform3f(g.getUniformLocation(p, "uCamera"), ...this.camera);
  }
  attribute(p, name, size, stride, offset) {
    const g = this.gl,
      i = g.getAttribLocation(p, name);
    if (i < 0) return;
    g.enableVertexAttribArray(i);
    g.vertexAttribPointer(i, size, g.FLOAT, false, stride, offset);
  }
  flush() {
    if (!this.available) return;
    const g = this.gl;
    g.bindBuffer(g.ARRAY_BUFFER, this.buffer);
    g.useProgram(this.spriteProgram);
    this.uniforms(this.spriteProgram);
    g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
    for (const [image, group] of this.groups) {
      if (!group.count) continue;
      let texture = this.textures.get(image);
      if (!texture) {
        texture = g.createTexture();
        g.bindTexture(g.TEXTURE_2D, texture);
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, image);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
        this.textures.set(image, texture);
      } else g.bindTexture(g.TEXTURE_2D, texture);
      g.bufferData(
        g.ARRAY_BUFFER,
        group.data.subarray(0, group.count),
        g.DYNAMIC_DRAW,
      );
      this.attribute(this.spriteProgram, "aPosition", 2, 32, 0);
      this.attribute(this.spriteProgram, "aUV", 2, 32, 8);
      this.attribute(this.spriteProgram, "aColor", 4, 32, 16);
      g.drawArrays(g.TRIANGLES, 0, group.count / 8);
    }
    g.useProgram(this.pointProgram);
    this.uniforms(this.pointProgram);
    g.uniform1f(g.getUniformLocation(this.pointProgram, "uDpr"), this.dpr);
    g.blendFunc(g.SRC_ALPHA, g.ONE);
    g.bufferData(
      g.ARRAY_BUFFER,
      this.points.subarray(0, this.pointCount * 8),
      g.DYNAMIC_DRAW,
    );
    this.attribute(this.pointProgram, "aPoint", 4, 32, 0);
    this.attribute(this.pointProgram, "aStyle", 4, 32, 16);
    g.drawArrays(g.POINTS, 0, this.pointCount);
  }
  readPixels() {
    if (this.available)
      this.gl.readPixels(
        0,
        0,
        1,
        1,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        this.readback,
      );
  }
}
