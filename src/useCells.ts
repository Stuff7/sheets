import { ref } from "jsx";
import { aligned, type CellMap, type Color } from "./utils";
import {
  type Atlas,
  createTextureAtlas,
  loadTextureAtlas,
  renderTextToImage,
  type TileMap,
} from "./texture";
import type { Instances } from "./instance";
import { CELL_H, CELL_W, type CellInfo } from "./GridControls";
import { canvasRect, prefersDark } from "./state";
import { Mat4 } from "./math";

const COLOR_SELECTED_CELL_DARK: Color = [0.2, 0.83, 0.6, 0.4]; // emerald-400/40 #34d399
const COLOR_SELECTED_CELL_LIGHT: Color = [0.31, 0.27, 0.9, 0.4]; // indigo-600/40 #4f46e5

export function useCells(gl: () => WebGL2RenderingContext) {
  let atlas: Atlas;
  const tiles: TileMap = {};
  const [list, setList] = ref<CellMap>({});
  const [selected, setSelected] = ref<CellMap>({});

  async function addText(cellPos: CellInfo, value: string) {
    if (!value) return;
    const hasKey = value in tiles;

    if (!tiles[value]) {
      tiles[value] = await renderTextToImage(value, {
        font: "16px mono",
      });
    }

    if (hasKey) return;

    atlas = createTextureAtlas(tiles);
    loadTextureAtlas(gl());

    setList.byRef((cell) => {
      const c = createCell(cell, cellPos.idx);
      c.text = value;
      c.width = tiles[value].width;
      c.height = tiles[value].height;
      c.x = cellPos.x;
      c.y = cellPos.y;
    });
  }

  function createCell(c: CellMap, idx: number) {
    if (!c[idx]) {
      c[idx] = {
        text: "",
        width: CELL_W,
        height: CELL_H,
        x: 0,
        y: 0,
      };
    }
    return c[idx];
  }

  function draw(
    inst: Instances,
    cellMap: CellMap,
    offset: number,
    cellColor: Color,
    z = 0,
  ) {
    let i = offset;
    for (const k in cellMap) {
      const c = cellMap[k];

      if (c.text) {
        const uv = atlas.uvCoords[c.text];
        inst.uvAt(i).set(uv);
        inst.hasUVAt(i)[0] = 1;
        inst.colorAt(i).set(cellColor);
      } else {
        const color = prefersDark()
          ? COLOR_SELECTED_CELL_DARK
          : COLOR_SELECTED_CELL_LIGHT;
        inst.hasUVAt(i)[0] = 0;
        inst.colorAt(i).set(color);
      }

      const model = inst.modelAt(i);
      Mat4.scaleIdentity(model, c.width, c.height, 1);

      const { x: offsetX, y: offsetY } = canvasRect();
      const px = aligned(c.x - offsetX, CELL_W);
      const py = aligned(c.y - offsetY, CELL_H);
      Mat4.translateTo(model, px, py, z);
      i++;
    }
  }

  return {
    list,
    selected,
    draw,
    select: setSelected,
    addText,
  };
}
