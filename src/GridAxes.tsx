import { ref, watchFn } from "jsx";
import For from "jsx/components/For";
import {
  canvasRect,
  colOffsets,
  computeFirstVisibleColumn,
  computeFirstVisibleRow,
  getEffectiveCellHeight,
  getEffectiveCellWidth,
  rowOffsets,
  scroll,
  scrollEl,
  setLastSelectedRegions,
  setColOffsets,
  setRowOffsets,
  ctrlPressed,
} from "./state";
import {
  toAlphaUpper,
  toAlphaLower,
  fromAlphaUpper,
  getMousePosition,
  fromAlphaLower,
} from "./utils";
import { CELL_W, CELL_H, MAX_ROWS, MAX_COLS } from "./config";
import { carveRegion } from "./region";

const RESIZE_STYLE = "absolute z-1";

export default function GridAxes() {
  const [cellKeys, setCellKeys] = ref({
    cols: [] as string[],
    rows: [] as string[],
  });

  function computeVisibleRange(
    firstIndex: number,
    size: number,
    getEffectiveSize: (index: number) => number,
  ): number {
    let cumSize = 0;
    let count = 0;
    let currentIndex = firstIndex;

    while (cumSize < size + getEffectiveSize(firstIndex)) {
      cumSize += getEffectiveSize(currentIndex);
      currentIndex++;
      count++;
    }

    return count;
  }

  watchFn(
    () => [canvasRect(), scroll(), colOffsets(), rowOffsets()],
    () => {
      const { width, height } = canvasRect();
      const { index: firstCol } = computeFirstVisibleColumn(scroll().x);
      const { index: firstRow } = computeFirstVisibleRow(scroll().y);
      if (firstCol < 0 && firstRow < 0) return;

      const colCount = computeVisibleRange(
        firstCol,
        width,
        getEffectiveCellWidth,
      );
      const rowCount = computeVisibleRange(
        firstRow,
        height,
        getEffectiveCellHeight,
      );

      setCellKeys.byRef((k) => {
        if (firstCol >= 0) {
          k.cols.length = 0;
          for (let i = firstCol; i < firstCol + colCount; i++) {
            k.cols.push(toAlphaUpper(i));
          }
        }
        if (firstRow >= 0) {
          k.rows.length = 0;
          for (let i = firstRow; i < firstRow + rowCount; i++) {
            k.rows.push(toAlphaLower(i));
          }
        }
      });
    },
  );

  let lastPos = { x: 0, y: 0 };
  let resizedCol = -1;
  function startColResize(ev: MouseEvent | TouchEvent, colId: string) {
    lastPos = getMousePosition(ev);
    resizedCol = fromAlphaUpper(colId);
  }

  let resizedRow = -1;
  function startRowResize(ev: MouseEvent | TouchEvent, rowId: string) {
    lastPos = getMousePosition(ev);
    resizedRow = fromAlphaLower(rowId);
  }

  function resizeCell(
    ev: MouseEvent | TouchEvent,
    resizedIndex: number,
    setOffsets: (fn: (offsets: Record<number, number>) => void) => void,
    cellSize: number,
  ) {
    if (resizedIndex === -1) return;
    const pos = getMousePosition(ev);
    setOffsets((offsets) => {
      const newOffset =
        (offsets[resizedIndex] ?? 0) +
        (cellSize === CELL_W ? pos.x - lastPos.x : pos.y - lastPos.y);
      offsets[resizedIndex] = Math.max(-cellSize, newOffset);
      lastPos = pos;
    });
  }

  function endResize() {
    resizedCol = -1;
    resizedRow = -1;
  }

  let lastScrollX = scroll().x;
  let lastScrollY = scroll().x;
  const [headerOffset, setHeaderOffset] = ref(0);
  const [asideOffset, setAsideOffset] = ref(0);
  watchFn(
    () => scroll(),
    () => {
      if (scroll().x !== lastScrollX) {
        const offset = computeFirstVisibleColumn(scroll().x).remainder;
        if (offset >= 0) setHeaderOffset(offset);
        lastScrollX = scroll().x;
      }
      if (scroll().y !== lastScrollY) {
        const offset = computeFirstVisibleRow(scroll().y).remainder;
        if (offset >= 0) setAsideOffset(offset);
        lastScrollY = scroll().y;
      }
    },
  );

  function selectCol(ev: MouseEvent | TouchEvent, col: number) {
    if (ev.target !== ev.currentTarget) return;
    setLastSelectedRegions.byRef((sel) => {
      if (!ctrlPressed()) sel.clear();
      carveRegion(sel, col, 0, col, MAX_ROWS);
    });
  }

  function selectRow(ev: MouseEvent | TouchEvent, row: number) {
    if (ev.target !== ev.currentTarget) return;
    setLastSelectedRegions.byRef((sel) => {
      if (!ctrlPressed()) sel.clear();
      carveRegion(sel, 0, row, MAX_COLS, row);
    });
  }

  return (
    <>
      <button
        class="relative dark:bg-zinc-800 bg-zinc-200 z-11"
        data-icon
        type="button"
        title="Go to the 1st cell"
        on:click={() =>
          scrollEl().scrollTo({ top: 0, left: 0, behavior: "smooth" })
        }
      >
        
      </button>
      <header
        class="relative overflow-visible max-w-dvw whitespace-nowrap z-10 select-none"
        style:left={`-${headerOffset()}px`}
      >
        <For
          each={cellKeys().cols}
          do={(col, i) => (
            <button
              type="button"
              $tabindex={i === cellKeys().cols.length - 1 ? -1 : undefined}
              class="relative"
              on:click={(ev) => selectCol(ev, fromAlphaUpper(col()))}
              style:width={`${getEffectiveCellWidth(fromAlphaUpper(col()))}px`}
            >
              {col()}
              <div
                class={`${RESIZE_STYLE} cursor-col-resize top-0 right-0 h-full w-3`}
                on:mousedown={(ev) => startColResize(ev, col())}
                g:onmousemove={(ev) =>
                  resizeCell(ev, resizedCol, setColOffsets.byRef, CELL_W)
                }
                g:onmouseup={endResize}
                on:touchstart={(ev) => startColResize(ev, col())}
                g:ontouchmove={(ev) =>
                  resizeCell(ev, resizedCol, setColOffsets.byRef, CELL_W)
                }
                g:ontouchend={endResize}
              />
            </button>
          )}
        />
      </header>
      <aside
        class="relative overflow-visible max-h-dvh z-10 select-none"
        style:top={`-${asideOffset()}px`}
      >
        <For
          each={cellKeys().rows}
          do={(row, i) => (
            <button
              type="button"
              $tabindex={i === cellKeys().rows.length - 1 ? -1 : undefined}
              class="block w-full px-2 min-w-[56.5px] relative"
              on:click={(ev) => selectRow(ev, fromAlphaLower(row()))}
              style:height={`${getEffectiveCellHeight(fromAlphaLower(row()))}px`}
            >
              {row()}
              <div
                class={`${RESIZE_STYLE} cursor-row-resize left-0 bottom-0 w-full h-3`}
                on:mousedown={(ev) => startRowResize(ev, row())}
                g:onmousemove={(ev) =>
                  resizeCell(ev, resizedRow, setRowOffsets.byRef, CELL_H)
                }
                g:onmouseup={endResize}
                on:touchstart={(ev) => startRowResize(ev, row())}
                g:ontouchmove={(ev) =>
                  resizeCell(ev, resizedRow, setRowOffsets.byRef, CELL_H)
                }
                g:ontouchend={endResize}
              />
            </button>
          )}
        />
      </aside>
    </>
  );
}
