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
  setColOffsets,
  setRowOffsets,
} from "./state";
import {
  type Pos2D,
  toAlphaUpper,
  toAlphaLower,
  fromAlphaUpper,
  getMousePosition,
  fromAlphaLower,
  CELL_W,
  CELL_H,
} from "./utils";
import Dbg from "./Dbg";

const RESIZE_STYLE = "absolute z-1";
const CELL_HEADER_DARK =
  "dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-emerald-400 dark:active:bg-emerald-100 dark:hover:text-zinc-800 dark:active:text-zinc-800";
const CELL_HEADER_LIGHT =
  "border-zinc-300 bg-zinc-200 hover:bg-indigo-700 active:bg-indigo-900 hover:text-zinc-200 active:text-zinc-200";
const CELL_HEADER_STYLE = `relative border ${CELL_HEADER_DARK} ${CELL_HEADER_LIGHT}`;

type GridAxesProps = {
  scroll: Pos2D;
};

export default function GridAxes(props: GridAxesProps) {
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
    () => [canvasRect(), props.scroll, colOffsets(), rowOffsets()],
    () => {
      const { width, height } = canvasRect();
      const { index: firstCol } = computeFirstVisibleColumn(props.scroll.x);
      const { index: firstRow } = computeFirstVisibleRow(props.scroll.y);
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

  let lastScrollX = props.scroll.x;
  let lastScrollY = props.scroll.x;
  const [headerOffset, setHeaderOffset] = ref(0);
  const [asideOffset, setAsideOffset] = ref(0);
  watchFn(
    () => props.scroll,
    () => {
      if (props.scroll.x !== lastScrollX) {
        const offset = computeFirstVisibleColumn(props.scroll.x).remainder;
        if (offset >= 0) setHeaderOffset(offset);
        lastScrollX = props.scroll.x;
      }
      if (props.scroll.y !== lastScrollY) {
        const offset = computeFirstVisibleRow(props.scroll.y).remainder;
        if (offset >= 0) setAsideOffset(offset);
        lastScrollY = props.scroll.y;
      }
    },
  );

  return (
    <>
      <header
        class="relative overflow-visible max-w-dvw whitespace-nowrap z-10 select-none"
        style:left={`-${headerOffset()}px`}
      >
        <For
          each={cellKeys().cols}
          do={(col) => (
            <button
              type="button"
              class={`${CELL_HEADER_STYLE}`}
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
          do={(row) => (
            <button
              type="button"
              class={`block w-full px-2 min-w-[56.5px] ${CELL_HEADER_STYLE}`}
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
      <Dbg>
        <p>ColOffsets: {JSON.stringify(colOffsets())}</p>
        <p>RowOffsets: {JSON.stringify(rowOffsets())}</p>
      </Dbg>
    </>
  );
}
