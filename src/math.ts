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

export function formatMatrix<
  T extends { length: number; [index: number]: number },
>(data: T, rows = 4, cols = 4, decimals = 4): string {
  if (data.length !== rows * cols) throw new Error("Invalid matrix dimensions");

  const colWidths = new Array(cols).fill(0);

  for (let i = 0; i < data.length; i++) {
    const row = Math.floor(i / cols);
    const formatted = data[i].toFixed(decimals);
    colWidths[row] = Math.max(colWidths[row], formatted.length);
  }

  let result = "";
  for (let c = 0; c < cols; c++) {
    const column = Array.from({ length: rows }, (_, r) =>
      data[r * cols + c].toFixed(decimals).padStart(colWidths[r]),
    ).join("  ");
    result += `[ ${column} ]\n`;
  }

  return result.trim();
}

export function formatVec<
  T extends { length: number; [index: number]: number },
>(data: T, decimals = 2): string {
  const colWidths = new Array(data.length).fill(0);

  for (let i = 0; i < data.length; i++) {
    const formatted = data[i].toFixed(decimals);
    colWidths[i] = Math.max(colWidths[i], formatted.length);
  }

  let result = "[ ";
  for (let i = 0; i < data.length; i++) {
    result += `${data[i].toFixed(decimals).padStart(colWidths[i])} `;
  }
  result += "]";

  return result.trim();
}
