/**
 * Тонкая обёртка над WebGL2 для заставки: программы, сетки, цели
 * рендера. Каждый созданный объект запоминается, и dispose() удаляет
 * их все, а потом отпускает сам контекст — после закрытия окна от
 * заставки в памяти видеокарты ничего не остаётся.
 */

import type { Geometry } from './geometry';
import type { Mat4 } from './math';

export interface Program {
  prog: WebGLProgram;
  loc: Map<string, WebGLUniformLocation | null>;
}

export interface Mesh {
  vao: WebGLVertexArrayObject;
  count: number;
  mode: number;
  indexType: number | null;
  /** Буфер позиций — для сеток, которые обновляются каждый кадр. */
  position: WebGLBuffer;
}

export interface Target {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  /** С мультисэмплингом рисуем сюда, потом переносим в tex через blit. */
  msaa: WebGLFramebuffer | null;
  w: number;
  h: number;
}

export type Uniform = number | readonly number[] | Float32Array | WebGLTexture;

export class GL {
  readonly gl: WebGL2RenderingContext;
  /** Можно ли рисовать в half-float: без этого свечение считается в 8 битах. */
  readonly floatTargets: boolean;
  private readonly programs: WebGLProgram[] = [];
  private readonly shaders: WebGLShader[] = [];
  private readonly buffers: WebGLBuffer[] = [];
  private readonly vaos: WebGLVertexArrayObject[] = [];
  private readonly textures: WebGLTexture[] = [];
  private readonly fbos: WebGLFramebuffer[] = [];
  private readonly rbos: WebGLRenderbuffer[] = [];
  private textureUnit = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.floatTargets = gl.getExtension('EXT_color_buffer_float') !== null;
  }

  /** Сколько объектов GPU сейчас живо — для отчёта об утечках. */
  live(): number {
    return (
      this.programs.length +
      this.shaders.length +
      this.buffers.length +
      this.vaos.length +
      this.textures.length +
      this.fbos.length +
      this.rbos.length
    );
  }

  program(vs: string, fs: string, defines: readonly string[] = []): Program {
    const { gl } = this;
    const head = '#version 300 es\n' + defines.map((d) => `#define ${d}\n`).join('');
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, head + src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        throw new Error('Шейдер заставки: ' + gl.getShaderInfoLog(sh));
      }
      this.shaders.push(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS) && !gl.isContextLost()) {
      throw new Error('Программа заставки: ' + gl.getProgramInfoLog(prog));
    }
    this.programs.push(prog);
    return { prog, loc: new Map() };
  }

  use(p: Program, uniforms: Record<string, Uniform>): void {
    const { gl } = this;
    gl.useProgram(p.prog);
    this.textureUnit = 0;
    for (const name in uniforms) {
      let loc = p.loc.get(name);
      if (loc === undefined) {
        loc = gl.getUniformLocation(p.prog, name);
        p.loc.set(name, loc);
      }
      if (loc === null) continue;
      const v = uniforms[name]!;
      if (typeof v === 'number') {
        gl.uniform1f(loc, v);
      } else if (v instanceof WebGLTexture) {
        gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, v);
        gl.uniform1i(loc, this.textureUnit);
        this.textureUnit += 1;
      } else if (v.length === 16) {
        gl.uniformMatrix4fv(loc, false, v as Mat4);
      } else if (v.length === 3) {
        gl.uniform3fv(loc, v as number[]);
      } else if (v.length === 2) {
        gl.uniform2fv(loc, v as number[]);
      } else if (v.length === 4) {
        gl.uniform4fv(loc, v as number[]);
      }
    }
  }

  /** Целое значение uniform (int) — у WebGL отдельный вызов. */
  int(p: Program, name: string, v: number): void {
    const loc = this.gl.getUniformLocation(p.prog, name);
    if (loc !== null) this.gl.uniform1i(loc, v);
  }

  mesh(g: Geometry, mode: number, dynamic = false): Mesh {
    const { gl } = this;
    const vao = gl.createVertexArray()!;
    this.vaos.push(vao);
    gl.bindVertexArray(vao);
    const attr = (loc: number, data: Float32Array, size: number) => {
      const buf = gl.createBuffer()!;
      this.buffers.push(buf);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, dynamic && loc === 0 ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return buf;
    };
    const position = attr(0, g.position, 3);
    attr(1, g.normal, 3);
    attr(2, g.extra, 4);
    let indexType: number | null = null;
    if (g.index !== undefined) {
      const buf = gl.createBuffer()!;
      this.buffers.push(buf);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.index, gl.STATIC_DRAW);
      indexType = g.index instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    }
    gl.bindVertexArray(null);
    return { vao, count: g.count, mode, indexType, position };
  }

  updatePositions(m: Mesh, data: Float32Array): void {
    const { gl } = this;
    gl.bindBuffer(gl.ARRAY_BUFFER, m.position);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  }

  draw(m: Mesh): void {
    const { gl } = this;
    gl.bindVertexArray(m.vao);
    if (m.indexType !== null) gl.drawElements(m.mode, m.count, m.indexType, 0);
    else gl.drawArrays(m.mode, 0, m.count);
  }

  target(w: number, h: number, opts: { float: boolean; depth: boolean; samples: number }): Target {
    const { gl } = this;
    const float = opts.float && this.floatTargets;
    const internal = float ? gl.RGBA16F : gl.RGBA8;
    const tex = gl.createTexture()!;
    this.textures.push(tex);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, internal, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    this.fbos.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    let msaa: WebGLFramebuffer | null = null;
    const samples = Math.min(opts.samples, gl.getParameter(gl.MAX_SAMPLES) as number);
    if (samples > 1) {
      msaa = gl.createFramebuffer()!;
      this.fbos.push(msaa);
      gl.bindFramebuffer(gl.FRAMEBUFFER, msaa);
      const color = gl.createRenderbuffer()!;
      this.rbos.push(color);
      gl.bindRenderbuffer(gl.RENDERBUFFER, color);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, internal, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
      if (opts.depth) {
        const depth = gl.createRenderbuffer()!;
        this.rbos.push(depth);
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      }
    } else if (opts.depth) {
      const depth = gl.createRenderbuffer()!;
      this.rbos.push(depth);
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, msaa, w, h };
  }

  /** Удалить цель (при смене размера). */
  dropTarget(t: Target): void {
    const { gl } = this;
    const fbos = t.msaa === null ? [t.fbo] : [t.fbo, t.msaa];
    for (const f of fbos) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      for (const att of [gl.COLOR_ATTACHMENT0, gl.DEPTH_ATTACHMENT]) {
        const rb = gl.getFramebufferAttachmentParameter(
          gl.FRAMEBUFFER,
          att,
          gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME,
        ) as WebGLRenderbuffer | WebGLTexture | null;
        if (rb instanceof WebGLRenderbuffer) {
          gl.deleteRenderbuffer(rb);
          this.rbos.splice(this.rbos.indexOf(rb), 1);
        }
      }
      gl.deleteFramebuffer(f);
      this.fbos.splice(this.fbos.indexOf(f), 1);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteTexture(t.tex);
    this.textures.splice(this.textures.indexOf(t.tex), 1);
  }

  /** Начать рисовать в цель (или на экран при null). */
  bind(t: Target | null, w?: number, h?: number): void {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t === null ? null : (t.msaa ?? t.fbo));
    gl.viewport(0, 0, t?.w ?? w!, t?.h ?? h!);
  }

  /** Перенести мультисэмпл в текстуру. */
  resolve(t: Target): void {
    if (t.msaa === null) return;
    const { gl } = this;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, t.msaa);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, t.fbo);
    gl.blitFramebuffer(0, 0, t.w, t.h, 0, 0, t.w, t.h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }

  dispose(): void {
    const { gl } = this;
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
    for (const v of this.vaos) gl.deleteVertexArray(v);
    for (const b of this.buffers) gl.deleteBuffer(b);
    for (const t of this.textures) gl.deleteTexture(t);
    for (const f of this.fbos) gl.deleteFramebuffer(f);
    for (const r of this.rbos) gl.deleteRenderbuffer(r);
    for (const p of this.programs) gl.deleteProgram(p);
    for (const s of this.shaders) gl.deleteShader(s);
    for (const list of [
      this.vaos,
      this.buffers,
      this.textures,
      this.fbos,
      this.rbos,
      this.programs,
      this.shaders,
    ]) {
      list.length = 0;
    }
    /* Отпустить сам контекст, не дожидаясь сборщика мусора. */
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
