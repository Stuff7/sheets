import {
  NUM_INST_ATTRS,
  INST_ATTR_SIZE,
  INST_STRIDE,
  VERT_STRIDE,
} from "./instance";
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
  gl.clearColor(0.08, 0.08, 0.08, 1.0);

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
  drawMode: GLenum;
  vertex: Float32Array;
  index: Uint8Array;
  instance: Float32Array;
};

export type Shader = {
  id: WebGLVertexArrayObject;
  buf: WebGLBuffer;
  drawMode: GLenum;
  instanceData: Float32Array;
  numInstances: number;
  indexOffset: number;
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
  shaders: Shader[];
  staticBuf: WebGLBuffer;
  indexBuf: WebGLBuffer;

  draw(): void;
  initShaders(...shaders: ShaderData[]): Shader[];
  updateInstance(
    shader: Shader,
    index: number,
    instance: Float32Array,
  ): Float32Array;
  resizeInstances(shader: Shader, instances: Float32Array): void;
};

function aligned(v: number, alignment: number): number {
  return (v + (alignment - 1)) & ~(alignment - 1);
}

export async function initShaderSystem(
  canvas: HTMLCanvasElement,
  vert: string,
  frag: string,
): Promise<ShaderSystem | Error> {
  const result = initWebGL(canvas, vert, frag);
  if (result instanceof Error) return result;
  loadTextureAtlas(result.gl);

  const inputs = mapShader(result.gl, result.program);
  if (inputs instanceof Error) return inputs;

  return {
    gl: result.gl,
    inputs,
    shaders: [],
    staticBuf: result.gl.createBuffer(),
    indexBuf: result.gl.createBuffer(),
    initShaders(...shaders) {
      let staticBufSize = 0;
      let indexBufSize = 0;

      for (const data of shaders) {
        staticBufSize = aligned(staticBufSize + data.vertex.byteLength, 16);
        indexBufSize = aligned(indexBufSize + data.index.byteLength, 16);
      }

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.staticBuf);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        staticBufSize,
        this.gl.STATIC_DRAW,
      );

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        indexBufSize,
        this.gl.STATIC_DRAW,
      );

      let staticBufOffset = 0;
      let indexBufOffset = 0;

      this.shaders = shaders.map((data) => {
        const shader: Shader = {
          id: this.gl.createVertexArray(),
          drawMode: data.drawMode,
          buf: this.gl.createBuffer(),
          instanceData: data.instance,
          numInstances: data.instance.length / NUM_INST_ATTRS,
          indexOffset: indexBufOffset,
          numIndices: data.index.length,
        };

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shader.buf);
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          shader.instanceData.byteLength * 20,
          this.gl.DYNAMIC_DRAW,
        );

        this.gl.bindVertexArray(shader.id);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.staticBuf);
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          staticBufOffset,
          data.vertex,
        );

        this.gl.enableVertexAttribArray(this.inputs.position);
        this.gl.vertexAttribPointer(
          this.inputs.position,
          2,
          this.gl.FLOAT,
          false,
          VERT_STRIDE,
          staticBufOffset,
        );

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
        this.gl.bufferSubData(
          this.gl.ELEMENT_ARRAY_BUFFER,
          indexBufOffset,
          data.index,
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shader.buf);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, data.instance);

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
          3,
          this.gl.FLOAT,
          false,
          INST_STRIDE,
          16 * INST_ATTR_SIZE,
        );
        this.gl.vertexAttribDivisor(this.inputs.color, 1);

        this.gl.enableVertexAttribArray(this.inputs.hasUV);
        this.gl.vertexAttribPointer(
          this.inputs.hasUV,
          1,
          this.gl.FLOAT,
          false,
          INST_STRIDE,
          19 * INST_ATTR_SIZE,
        );
        this.gl.vertexAttribDivisor(this.inputs.hasUV, 1);

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

        staticBufOffset = aligned(staticBufOffset + data.vertex.byteLength, 16);
        indexBufOffset = aligned(indexBufOffset + data.index.byteLength, 16);

        return shader;
      });

      return this.shaders;
    },
    updateInstance(shader: Shader, index: number, instance: Float32Array) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shader.buf);
      this.gl.bufferSubData(
        this.gl.ARRAY_BUFFER,
        index * INST_STRIDE,
        instance,
      );

      return shader.instanceData;
    },
    resizeInstances(shader: Shader, instances: Float32Array) {
      shader.instanceData = instances;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shader.buf);
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, shader.instanceData);
    },
    draw() {
      if (!this.gl) return;

      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      for (const shader of this.shaders) {
        this.gl.bindVertexArray(shader.id);
        this.gl.drawElementsInstanced(
          shader.drawMode,
          shader.numIndices,
          this.gl.UNSIGNED_BYTE,
          shader.indexOffset,
          shader.instanceData.length / NUM_INST_ATTRS,
        );
      }
    },
  } satisfies ShaderSystem;
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
