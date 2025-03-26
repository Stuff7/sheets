import { Mat4 } from "./math";

export const numInstanceAttrs = 17;
export const instAttrSize = 4;
export const instStride = numInstanceAttrs * instAttrSize;

export type Instances = {
  data: Float32Array;
  len: number;

  modelAt(index: number): Float32Array;
  hasUVAt(index: number): Float32Array;
};

export function initInstances(len: number): Instances {
  const data = new Float32Array(len * instStride);

  for (let i = 0; i < len * numInstanceAttrs; i += numInstanceAttrs) {
    data.set(Mat4.identity(), i);
  }

  return {
    data,
    len,
    modelAt(index) {
      const start = index * numInstanceAttrs;
      return this.data.subarray(start, start + 16);
    },
    hasUVAt(index) {
      const start = index * numInstanceAttrs + 16;
      return this.data.subarray(start, start + 1);
    },
  };
}

type Mesh = {
  vertexData: Float32Array;
  indexData: Uint8Array;
};

export const numVertAttrs = 7;
export const instVertSize = 4;
export const vertStride = numVertAttrs * instVertSize;

export const LINE_MESH: Mesh = {
  // biome-ignore format:
  vertexData: new Float32Array([
 // position        color           uv
    0.0, 0.0,   1.0, 1.0, 0.0,   0.5, 0.0,
    0.0, 1.0,   1.0, 0.0, 0.0,   0.5, 1.0,
  ]),
  indexData: new Uint8Array([0, 1]),
};

export const QUAD_MESH: Mesh = {
  // biome-ignore format:
  vertexData: new Float32Array([
 // position        color           uv
    0.0, 0.0,   1.0, 1.0, 0.0,   0.0, 1.0,
    1.0, 0.0,   0.0, 1.0, 0.0,   1.0, 1.0,
    1.0, 1.0,   0.0, 1.0, 1.0,   1.0, 0.0,
    0.0, 1.0,   1.0, 0.0, 1.0,   0.0, 0.0,
  ]),
  indexData: new Uint8Array([0, 1, 2, 2, 3, 0]),
};
