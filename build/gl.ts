

import {
  NUM_INST_ATTRS,
  INST_ATTR_SIZE,
  INST_STRIDE,
  VERT_STRIDE,
} from "./instance";
import { aligned2 } from "./utils";
import type { KeysWithValue } from "./types";
import { loadTextureAtlas } from "./texture";

export function compileShader(
  gl: WebGLRenderingContext,
  source: string,
  type: GLenum,
): WebGLShader | Error {
  const shader = gl.createShader(type);
  if (shader == null) {
    return new Error(
      `Could not create shader\n\ttype: ${type}\n\tsource: ${source}`,
    );
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const compileLog = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    return new Error(
      `[${glEnumToString(type)}] Shader compilation failed: ${compileLog}`,
    );
  }

  return shader;
}

export function initWebGL(
  canvas: HTMLCanvasElement,
  vsSource: string,
  fsSource: string,
) {
  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
  if (!gl) return new Error("WebGL not supported.");

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  const vert = compileShader(gl, vsSource, gl.VERTEX_SHADER);
  if (vert instanceof Error) return vert;
  const frag = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
  if (frag instanceof Error) return frag;

  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
  }

  gl.useProgram(program);

  return { gl, program };
}

type ShaderData = {
  drawMode: KeysWithValue<WebGL2RenderingContext, GLenum>;
  vertex: Float32Array;
  index: Uint8Array;
  instance: Float32Array;
};

export type Shader = {
  id: WebGLVertexArrayObject;
  drawMode: GLenum;
  instanceData: Float32Array;
  numInstances: number;
  numIndices: number;
};

type ShaderInputs = {
  position: GLint;
  color: GLint;
  model: GLint;
  projection: WebGLUniformLocation;
  uv: GLint;
  hasUV: GLint;
};

function mapShader(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): ShaderInputs | Error {
  const projection = gl.getUniformLocation(program, "projection");
  if (!projection) return new Error("Missing shader projection");

  return {
    projection,
    position: gl.getAttribLocation(program, "position"),
    model: gl.getAttribLocation(program, "instModel"),
    color: gl.getAttribLocation(program, "instColor"),
    hasUV: gl.getAttribLocation(program, "instHasUV"),
    uv: gl.getAttribLocation(program, "instUV"),
  };
}

export type ShaderSystem = {
  gl: WebGL2RenderingContext;
  inputs: ShaderInputs;
  shader: Shader;
  staticBuf: WebGLBuffer;
  indexBuf: WebGLBuffer;
  dynamicBuf: WebGLBuffer;
  dynamicCap: number;
  shouldRedraw: boolean;

  requestRedraw(): void;
  draw(): void;
  render(): void;
  initDynamicBuffer(this: ShaderSystem): void;
  resizeDynamicBuffer(newSize: number, usage: GLenum): WebGLBuffer;
  resizeInstances(shader: Shader, instances: Float32Array): void;
};

export async function initShaderSystem(
  canvas: HTMLCanvasElement,
  vert: string,
  frag: string,
  data: ShaderData,
): Promise<ShaderSystem | Error> {
  const result = initWebGL(canvas, vert, frag);
  if (result instanceof Error) return result;
  loadTextureAtlas(result.gl);

  const inputs = mapShader(result.gl, result.program);
  if (inputs instanceof Error) return inputs;
  const gl = result.gl;
  const staticBuf = gl.createBuffer();
  const indexBuf = gl.createBuffer();
  const dynamicBuf = gl.createBuffer();

  let staticBufSize = 0;
  let indexBufSize = 0;

  staticBufSize = aligned2(staticBufSize + data.vertex.byteLength, 16);
  indexBufSize = aligned2(indexBufSize + data.index.byteLength, 16);

  gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
  gl.bufferData(gl.ARRAY_BUFFER, staticBufSize, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufSize, gl.STATIC_DRAW);

  const shader: Shader = {
    id: gl.createVertexArray(),
    drawMode: gl[data.drawMode],
    instanceData: data.instance,
    numInstances: data.instance.length / NUM_INST_ATTRS,
    numIndices: data.index.length,
  };

  gl.bindVertexArray(shader.id);

  gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.vertex);

  gl.enableVertexAttribArray(inputs.position);
  gl.vertexAttribPointer(inputs.position, 2, gl.FLOAT, false, VERT_STRIDE, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, data.index);

  const self: ShaderSystem = {
    gl: result.gl,
    inputs,
    shader,
    staticBuf,
    indexBuf,
    dynamicBuf,
    dynamicCap: INST_STRIDE * 10000,
    shouldRedraw: false,
    initDynamicBuffer,
    resizeDynamicBuffer,
    resizeInstances,
    requestRedraw,
    draw,
    render,
  };

  self.initDynamicBuffer();

  return self;
}

function resizeDynamicBuffer(
  this: ShaderSystem,
  newSize: number,
  usage: GLenum,
) {
  const buffer = this.dynamicBuf;
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
  const newBuffer = this.gl.createBuffer();
  if (!newBuffer) throw new Error("Failed to create a new buffer");

  console.log("RESIZE FROM %d TO %d", this.dynamicCap, newSize);
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, newBuffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, newSize, usage);
  this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.shader.instanceData);
  this.gl.deleteBuffer(buffer);
  this.dynamicBuf = newBuffer;
  this.dynamicCap = newSize;
  this.initDynamicBuffer();

  return newBuffer;
}

function initDynamicBuffer(this: ShaderSystem) {
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dynamicBuf);
  this.gl.bufferData(
    this.gl.ARRAY_BUFFER,
    this.dynamicCap,
    this.gl.DYNAMIC_DRAW,
  );
  this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.shader.instanceData);

  for (let i = 0; i < 4; i++) {
    const loc = this.inputs.model + i;
    this.gl.enableVertexAttribArray(loc);
    this.gl.vertexAttribPointer(
      loc,
      4,
      this.gl.FLOAT,
      false,
      INST_STRIDE,
      i * 16,
    );
    this.gl.vertexAttribDivisor(loc, 1);
  }

  this.gl.enableVertexAttribArray(this.inputs.color);
  this.gl.vertexAttribPointer(
    this.inputs.color,
    4,
    this.gl.FLOAT,
    false,
    INST_STRIDE,
    16 * INST_ATTR_SIZE,
  );
  this.gl.vertexAttribDivisor(this.inputs.color, 1);

  this.gl.enableVertexAttribArray(this.inputs.uv);
  this.gl.vertexAttribPointer(
    this.inputs.uv,
    4,
    this.gl.FLOAT,
    false,
    INST_STRIDE,
    20 * INST_ATTR_SIZE,
  );
  this.gl.vertexAttribDivisor(this.inputs.uv, 1);

  this.gl.enableVertexAttribArray(this.inputs.hasUV);
  this.gl.vertexAttribPointer(
    this.inputs.hasUV,
    1,
    this.gl.FLOAT,
    false,
    INST_STRIDE,
    24 * INST_ATTR_SIZE,
  );
  this.gl.vertexAttribDivisor(this.inputs.hasUV, 1);
}

function resizeInstances(
  this: ShaderSystem,
  shader: Shader,
  instances: Float32Array,
) {
  shader.instanceData = instances;
  if (shader.instanceData.byteLength >= this.dynamicCap) {
    const newSize = shader.instanceData.byteLength * 2;
    this.resizeDynamicBuffer(newSize, this.gl.DYNAMIC_DRAW);
  }

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dynamicBuf);
  this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, shader.instanceData);
}

function requestRedraw(this: ShaderSystem) {
  this.shouldRedraw = true;
}

function draw(this: ShaderSystem) {
  if (!this.gl) return;

  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

  this.gl.bindVertexArray(this.shader.id);
  this.gl.drawElementsInstanced(
    this.shader.drawMode,
    this.shader.numIndices,
    this.gl.UNSIGNED_BYTE,
    0,
    this.shader.instanceData.length / NUM_INST_ATTRS,
  );
}

function render(this: ShaderSystem) {
  if (this.shouldRedraw) {
    this.draw();
    this.shouldRedraw = false;
  }
  requestAnimationFrame(this.render.bind(this));
}

function glEnumToString(glEnum: GLenum) {
  switch (glEnum) {
    case WebGLRenderingContext.VERTEX_SHADER:
      return "VERTEX_SHADER";
    case WebGLRenderingContext.FRAGMENT_SHADER:
      return "FRAGMENT_SHADER";
    case WebGLRenderingContext.TEXTURE_2D:
      return "TEXTURE_2D";
    case WebGLRenderingContext.TEXTURE_CUBE_MAP:
      return "TEXTURE_CUBE_MAP";
    case WebGLRenderingContext.COLOR_BUFFER_BIT:
      return "COLOR_BUFFER_BIT";
    case WebGLRenderingContext.DEPTH_BUFFER_BIT:
      return "DEPTH_BUFFER_BIT";
    case WebGLRenderingContext.STENCIL_BUFFER_BIT:
      return "STENCIL_BUFFER_BIT";
    case WebGLRenderingContext.ARRAY_BUFFER:
      return "ARRAY_BUFFER";
    case WebGLRenderingContext.ELEMENT_ARRAY_BUFFER:
      return "ELEMENT_ARRAY_BUFFER";
    case WebGLRenderingContext.STREAM_DRAW:
      return "STREAM_DRAW";
    case WebGLRenderingContext.STATIC_DRAW:
      return "STATIC_DRAW";
    case WebGLRenderingContext.DYNAMIC_DRAW:
      return "DYNAMIC_DRAW";
    case WebGLRenderingContext.FLOAT:
      return "FLOAT";
    case WebGLRenderingContext.UNSIGNED_BYTE:
      return "UNSIGNED_BYTE";
    case WebGLRenderingContext.UNSIGNED_SHORT:
      return "UNSIGNED_SHORT";
    case WebGLRenderingContext.UNSIGNED_INT:
      return "UNSIGNED_INT";
    case WebGLRenderingContext.DEPTH_TEST:
      return "DEPTH_TEST";
    case WebGLRenderingContext.LEQUAL:
      return "LEQUAL";
    case WebGLRenderingContext.LESS:
      return "LESS";
    case WebGLRenderingContext.EQUAL:
      return "EQUAL";
    case WebGLRenderingContext.GREATER:
      return "GREATER";
    case WebGLRenderingContext.NOTEQUAL:
      return "NOTEQUAL";
    case WebGLRenderingContext.GEQUAL:
      return "GEQUAL";
    case WebGLRenderingContext.ALWAYS:
      return "ALWAYS";
    case WebGLRenderingContext.NEVER:
      return "NEVER";
    default:
      return `Unknown GLenum (0x${glEnum.toString(16)})`;
  }
}
