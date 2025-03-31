export const Mat4 = {
  identity() {
    // biome-ignore format:
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  },

  ortho(
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
    dest[5] = 2 * tb;
    dest[10] = 2 * f_n;
    dest[12] = -(right + left) * rl;
    dest[13] = -(top + bottom) * tb;
    dest[14] = -(farZ + nearZ) * f_n;
    dest[15] = 1;
  },

  mulAdds(
    tx: number,
    ty: number,
    tz: number,
    tw: number,
    s: number,
    dest: Float32Array,
  ) {
    dest[0] += tx * s;
    dest[1] += ty * s;
    dest[2] += tz * s;
    dest[3] += tw * s;
  },

  translate(m4: Float32Array, tx: number, ty: number, tz: number) {
    m4[12] += tx;
    m4[13] += ty;
    m4[14] += tz;
  },

  translatePx(m4: Float32Array, tx: number, ty: number, tz: number) {
    return Mat4.translate(m4, tx * m4[0], ty * m4[5], tz * m4[10]);
  },

  translateTo(m4: Float32Array, tx: number, ty: number, tz: number) {
    m4[12] = tx;
    m4[13] = ty;
    m4[14] = tz;
  },

  translatePxTo(m4: Float32Array, tx: number, ty: number, tz: number) {
    return Mat4.translateTo(m4, tx * m4[0], ty * m4[5], tz * m4[10]);
  },

  scaleIdentity(m4: Float32Array, sx: number, sy: number, sz: number) {
    m4[0] = sx;
    m4[5] = sy;
    m4[10] = sz;
  },

  scale(m4: Float32Array, sx: number, sy: number, sz: number) {
    m4[0] *= sx;
    m4[1] *= sx;
    m4[2] *= sx;
    m4[3] *= sx;

    m4[4] *= sy;
    m4[5] *= sy;
    m4[6] *= sy;
    m4[7] *= sy;

    m4[8] *= sz;
    m4[9] *= sz;
    m4[10] *= sz;
    m4[11] *= sz;
  },

  toString<T extends { length: number; [index: number]: number }>(
    data: T,
    rows = 4,
    cols = 4,
    decimals = 4,
  ): string {
    if (data.length !== rows * cols)
      throw new Error("Invalid matrix dimensions");

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
  },
};

export const Vec = {
  toString<T extends { length: number; [index: number]: number }>(
    data: T,
    decimals = 2,
  ): string {
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
  },
};

export function aligned2(v: number, alignment: number): number {
  return (v + (alignment - 1)) & ~(alignment - 1);
}

export function aligned(v: number, alignment: number): number {
  return Math.floor(v / alignment) * alignment;
}

export function getMousePosition(ev: MouseEvent | TouchEvent) {
  let clientX: number;
  let clientY: number;

  if (ev instanceof MouseEvent) {
    clientX = ev.clientX;
    clientY = ev.clientY;
  } else if (ev instanceof TouchEvent && ev.touches.length > 0) {
    clientX = ev.touches[0].clientX;
    clientY = ev.touches[0].clientY;
  } else {
    return { x: -1, y: -1 };
  }

  return { x: clientX, y: clientY };
}

export function getRelativeMousePosition(ev: MouseEvent | TouchEvent) {
  const element = ev.currentTarget as HTMLElement;
  const rect = element.getBoundingClientRect();
  const clientPos = getMousePosition(ev);

  if (clientPos.x === -1 && clientPos.y === -1) {
    return clientPos;
  }

  const x = clientPos.x - rect.left;
  const y = clientPos.y - rect.top;

  return { x, y };
}
