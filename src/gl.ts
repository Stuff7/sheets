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
  // biome-ignore lint/style/noNonNullAssertion:
  const gl = canvas.getContext("webgl2")!;

  if (!gl) return new Error("WebGL not supported.");

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
  index: Uint16Array;
  instance: Float32Array;
};

export type Shader = {
  id: WebGLVertexArrayObject;
  drawMode: GLenum;
  instanceData: Float32Array;
  instanceOffset: number;
  numInstances: number;
  numIndices: number;
};

type ShaderInputs = {
  position: GLint;
  color: GLint;
  transform: GLint;
  projection: WebGLUniformLocation;
};

export type ShaderSystem = {
  gl: WebGL2RenderingContext;
  inputs: ShaderInputs;
  shaders: Shader[];
  staticBuf: WebGLBuffer;
  dynamicBuf: WebGLBuffer;
  indexBuf: WebGLBuffer;

  draw(): void;
  initShaders(...shaders: ShaderData[]): Shader[];
  updateInstance(
    shader: Shader,
    index: number,
    x: number,
    y: number,
  ): Float32Array;
};

function mapShader(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): ShaderInputs | Error {
  const projection = gl.getUniformLocation(program, "projection");
  if (!projection) return new Error("Missing shader projection");

  return {
    position: gl.getAttribLocation(program, "position"),
    color: gl.getAttribLocation(program, "color"),
    transform: gl.getAttribLocation(program, "transform"),
    projection,
  };
}

function aligned(v: number, alignment: number): number {
  return (v + (alignment - 1)) & ~(alignment - 1);
}

export function initShaderSystem(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): ShaderSystem | Error {
  const inputs = mapShader(gl, program);
  if (inputs instanceof Error) return inputs;

  return {
    gl,
    inputs,
    shaders: [],
    staticBuf: gl.createBuffer(),
    dynamicBuf: gl.createBuffer(),
    indexBuf: gl.createBuffer(),
    initShaders(...shaders) {
      let staticBufSize = 0;
      let indexBufSize = 0;
      let dynamicBufSize = 0;

      for (const data of shaders) {
        staticBufSize = aligned(staticBufSize + data.vertex.byteLength, 16);
        indexBufSize = aligned(indexBufSize + data.index.byteLength, 16);
        dynamicBufSize = aligned(dynamicBufSize + data.instance.byteLength, 16);
      }
      console.log({ staticBufSize, indexBufSize, dynamicBufSize });

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

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dynamicBuf);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        dynamicBufSize,
        this.gl.DYNAMIC_DRAW,
      );

      let staticBufOffset = 0;
      let indexBufOffset = 0;
      let dynamicBufOffset = 0;

      this.shaders = shaders.map((data) => {
        const shader: Shader = {
          id: this.gl.createVertexArray(),
          drawMode: data.drawMode,
          instanceData: data.instance,
          instanceOffset: dynamicBufOffset,
          numInstances: data.instance.length / 2,
          numIndices: data.index.length,
        };

        this.gl.bindVertexArray(shader.id);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.staticBuf);
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          staticBufOffset,
          data.vertex,
        );

        const stride = 5 * 4;
        this.gl.enableVertexAttribArray(this.inputs.position);
        this.gl.vertexAttribPointer(
          this.inputs.position,
          2,
          this.gl.FLOAT,
          false,
          stride,
          0,
        );
        this.gl.enableVertexAttribArray(this.inputs.color);
        this.gl.vertexAttribPointer(
          this.inputs.color,
          3,
          this.gl.FLOAT,
          false,
          stride,
          2 * 4,
        );

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
        this.gl.bufferSubData(
          this.gl.ELEMENT_ARRAY_BUFFER,
          indexBufOffset,
          data.index,
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dynamicBuf);
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          dynamicBufOffset,
          data.instance,
        );
        this.gl.enableVertexAttribArray(this.inputs.transform);
        this.gl.vertexAttribPointer(
          this.inputs.transform,
          2,
          this.gl.FLOAT,
          false,
          2 * 4,
          0,
        );
        this.gl.vertexAttribDivisor(this.inputs.transform, 1);

        staticBufOffset = aligned(staticBufOffset + data.vertex.byteLength, 16);
        indexBufOffset = aligned(indexBufOffset + data.index.byteLength, 16);
        dynamicBufOffset = aligned(
          dynamicBufOffset + data.instance.byteLength,
          16,
        );

        return shader;
      });

      return this.shaders;
    },
    updateInstance(shader: Shader, index: number, x: number, y: number) {
      shader.instanceData[index * 2] += x;
      shader.instanceData[index * 2 + 1] += y;

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dynamicBuf);
      this.gl.bufferSubData(
        this.gl.ARRAY_BUFFER,
        shader.instanceOffset + index * 16,
        shader.instanceData.subarray(index * 4, index * 4 + 4),
      );

      return shader.instanceData;
    },
    draw() {
      if (!this.gl) return;

      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      for (const shader of this.shaders) {
        this.gl.bindVertexArray(shader.id);
        this.gl.drawElementsInstanced(
          shader.drawMode,
          shader.numIndices,
          this.gl.UNSIGNED_SHORT,
          0,
          shader.numInstances,
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
