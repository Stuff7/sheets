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
    gl.deleteShader(shader);
    return new Error(`Shader compile failed: ${gl.getShaderInfoLog(shader)}`);
  }

  return shader;
}

export function initWebGL(
  canvas: HTMLCanvasElement,
  vsSource: string,
  fsSource: string,
) {
  // biome-ignore lint/style/noNonNullAssertion:
  const gl = canvas.getContext("webgl")!;

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
