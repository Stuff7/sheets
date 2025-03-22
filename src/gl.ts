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
