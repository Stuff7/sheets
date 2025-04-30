import { watchOnly } from "jsx";
import {
  addRegionToSet,
  parseRegion,
  regionToQuad,
  removeRegionFromSet,
} from "./region";
import {
  selectedColor,
  selectedRegions,
  setColorQuads,
  setSelectedColor,
  colorRegions,
  colOffsets,
  rowOffsets,
  setColorRegions,
  defaultCellColor,
  colorQuads,
} from "./state";

export default function CellColorPicker() {
  function onColorChange(color: string) {
    setSelectedColor(color);
    if (selectedRegions().size === 0) return;

    const regions = colorRegions()[color] ?? new Set();
    console.log(JSON.stringify([...regions], null, 2));
    for (const k of selectedRegions()) {
      const region = parseRegion(k);
      addRegionToSet(
        regions,
        region.startCol,
        region.startRow,
        region.endCol,
        region.endRow,
      );
    }

    setColorRegions.byRef((r) => {
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
            delete colorQuads()[c];
          }
        }
      }
      if (color !== defaultCellColor()) {
        r[color] = regions;

        setColorQuads.byRef((colors) => {
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

  watchOnly([colorRegions, colOffsets, rowOffsets], () => {
    setColorQuads.byRef((colors) => {
      for (const c in colors) {
        if (!colorRegions()[c]) {
          delete colors[c];
          continue;
        }

        const quads = colors[c];
        quads.length = 0;
        for (const r of colorRegions()[c]) {
          quads.push(...regionToQuad(parseRegion(r)));
        }
      }
    });
  });

  return (
    <fieldset
      data-button
      class="flex items-center gap-2 outline py-1 px-2 rounded-sm"
    >
      <button
        data-icon
        class:plain
        type="button"
        title="Clear cell color"
        on:click={() => onColorChange(defaultCellColor())}
      >
        
      </button>
      <input
        type="color"
        $value={selectedColor()}
        on:input={(ev) => onColorChange(ev.currentTarget.value)}
        class="w-4 h-4 cursor-pointer"
      />
    </fieldset>
  );
}
