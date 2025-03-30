import { Mat4 } from "./math";

export const NUM_INST_ATTRS = 24;
export const INST_ATTR_SIZE = 4;
export const INST_STRIDE = NUM_INST_ATTRS * INST_ATTR_SIZE;

export type Instances = {
  data: Float32Array;
  len: number;

  resize(len: number): boolean;
  modelAt(index: number): Float32Array;
  colorAt(index: number): Float32Array;
  hasUVAt(index: number): Float32Array;
  uvAt(index: number): Float32Array;
};

function initData(data: Float32Array, len: number) {
  for (let i = 0; i < len * NUM_INST_ATTRS; i += NUM_INST_ATTRS) {
    data.set(Mat4.identity(), i);
    data.set([0, 0, 1, 1], i + 20);
  }
}

export function initInstances(len: number): Instances {
  const data = new Float32Array(len * NUM_INST_ATTRS);
  initData(data, len);

  return {
    data,
    len,
    resize(len) {
      if (len === this.len) return false;

      const size = len * NUM_INST_ATTRS;
      if (len < this.len) {
        this.data = this.data.subarray(0, size);
      } else {
        const data = new Float32Array(size);
        data.set(this.data);
        initData(data.subarray(this.data.length), len - this.len);
        this.data = data;
      }
      this.len = len;
      return true;
    },
    modelAt(index) {
      const start = index * NUM_INST_ATTRS;
      return this.data.subarray(start, start + 16);
    },
    colorAt(index) {
      const start = index * NUM_INST_ATTRS + 16;
      return this.data.subarray(start, start + 3);
    },
    hasUVAt(index) {
      const start = index * NUM_INST_ATTRS + 19;
      return this.data.subarray(start, start + 1);
    },
    uvAt(index) {
      const start = index * NUM_INST_ATTRS + 20;
      return this.data.subarray(start, start + 4);
    },
  };
}

type Mesh = {
  vertexData: Float32Array;
  indexData: Uint8Array;
};

export const NUM_VERT_ATTRS = 2;
export const VERT_ATTR_SIZE = 4;
export const VERT_STRIDE = NUM_VERT_ATTRS * VERT_ATTR_SIZE;

export const QUAD_MESH: Mesh = {
  // biome-ignore format:
  vertexData: new Float32Array([
 // position
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
  ]),
  indexData: new Uint8Array([0, 1, 2, 2, 3, 0]),
};
