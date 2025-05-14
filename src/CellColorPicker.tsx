import { watchFn } from "jsx";
import {
  addRegionToSet,
  parseRegion,
  regionToQuad,
  removeRegionFromSet,
} from "./region";
import {
  selectedColor,
  setSelectedColor,
  defaultCellColor,
  currentSheet,
} from "./state";
import ColorPicker from "./ColorPicker";

export default function CellColorPicker() {
  function onColorChange(color: string) {
    setSelectedColor(color);
    if (currentSheet().selectedRegions().size === 0) return;

    const regions = currentSheet().colorRegions()[color] ?? new Set();
    console.log(JSON.stringify([...regions], null, 2));
    for (const k of currentSheet().selectedRegions()) {
      const region = parseRegion(k);
      addRegionToSet(
        regions,
        region.startCol,
        region.startRow,
        region.endCol,
        region.endRow,
      );
    }

    currentSheet().setColorRegions.byRef((r) => {
      for (const c in r) {
        if (c === color) continue;
        for (const regionStr of regions) {
          const region = parseRegion(regionStr);
          removeRegionFromSet(
            r[c],
            region.startCol,
            region.startRow,
            region.endCol,
            region.endRow,
          );
          if (r[c].size === 0) {
            delete r[c];
            delete currentSheet().colorQuads()[c];
          }
        }
      }
      if (color !== defaultCellColor()) {
        r[color] = regions;

        currentSheet().setColorQuads.byRef((colors) => {
          const c = colors[color] ?? [];
          c.length = 0;
          for (const k of regions) {
            c.push(...regionToQuad(parseRegion(k)));
          }
          colors[color] = c;
        });
      }
    });
  }

  watchFn(
    () => [
      currentSheet().colorRegions(),
      currentSheet().colOffsets(),
      currentSheet().rowOffsets(),
    ],
    () => {
      currentSheet().setColorQuads.byRef((colors) => {
        for (const c in colors) {
          if (!currentSheet().colorRegions()[c]) {
            delete colors[c];
            continue;
          }

          const quads = colors[c];
          quads.length = 0;
          for (const r of currentSheet().colorRegions()[c]) {
            quads.push(...regionToQuad(parseRegion(r)));
          }
        }
      });
    },
  );

  return (
    <ColorPicker
      defaultColor={defaultCellColor()}
      color={selectedColor()}
      onChange={onColorChange}
    >
      <i></i>
    </ColorPicker>
  );
}
