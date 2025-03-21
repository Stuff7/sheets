export function identity() {
  // biome-ignore format:
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

export function ortho(
  left: number,
  right: number,
  bottom: number,
  top: number,
  nearZ: number,
  farZ: number,
  dest: Float32Array,
) {
  dest.fill(0);

  const rl = 1 / (right - left);
  const tb = 1 / (top - bottom);
  const f_n = -1 / (farZ - nearZ);

  dest[0] = 2 * rl;
  dest[1 * 4 + 1] = 2 * tb;
  dest[2 * 4 + 2] = 2 * f_n;
  dest[3 * 4 + 0] = -(right + left) * rl;
  dest[3 * 4 + 1] = -(top + bottom) * tb;
  dest[3 * 4 + 2] = -(farZ + nearZ) * f_n;
  dest[3 * 4 + 3] = 1;
}
