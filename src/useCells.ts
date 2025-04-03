import { ref } from "jsx";
import {
  aligned,
  type Cell,
  type CellMap,
  type Color,
  type PartialCellMap,
} from "./utils";
import {
  type Atlas,
  createTextureAtlas,
  loadTextureAtlas,
  renderTextToImage,
  type TileMap,
} from "./texture";
import type { Instances } from "./instance";
import { CELL_H, CELL_W } from "./GridControls";
import { canvasRect } from "./state";
import { Mat4 } from "./math";

const COLOR_SELECTED_CELL: Color = [0.2, 0.83, 0.6, 0.4]; // emerald-400/40 #34d399

export function useCells(gl: () => WebGL2RenderingContext) {
  let atlas: Atlas;
  const tiles: TileMap = {};
  const [list, setList] = ref<CellMap>({});
  const [selected, setSelected] = ref<CellMap>({});

  async function addText(idx: number, value: string) {
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

    setCell(idx, (c) => {
      c.text = value;
      c.width = tiles[value].width;
      c.height = tiles[value].height;
    });
    setList.byRef((cell) => {
      const c = createCell(cell, idx);
      c.text = value;
      c.width = tiles[value].width;
      c.height = tiles[value].height;
      c.x = selected()[idx].x;
      c.y = selected()[idx].y;
    });
  }

  function select(cells: PartialCellMap) {
    const selected: CellMap = {};
    for (const idx in cells) {
      createCell(selected, +idx);
      selected[idx] = {
        ...selected[idx],
        ...cells[idx],
      };
    }

    setSelected(selected);
  }

  function setCell(idx: number, cb: (c: Cell) => void) {
    setSelected.byRef((c) => {
      createCell(c, idx);
      cb(c[idx]);
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
        inst.hasUVAt(i)[0] = 0;
        inst.colorAt(i).set(COLOR_SELECTED_CELL);
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
    select,
    addText,
  };
}
