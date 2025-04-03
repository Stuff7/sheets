import { ref } from "jsx";
import { canvasRect } from "./state";
import {
  aligned,
  asciiNumParser,
  type CellMap,
  getMousePosition,
} from "./utils";
import Dbg from "./Dbg";

const MAX_COLS = 1e5;
const MAX_ROWS = 2e5;
export const CELL_W = 100;
export const CELL_H = 30;

export const [toAlphaUpper] = asciiNumParser(26, "A".charCodeAt(0));
export const [toAlphaLower] = asciiNumParser(26, "a".charCodeAt(0));

export type CellInfo = {
  col: number;
  row: number;
  idx: number;
  id: string;
  x: number;
  y: number;
};

type GridControlsProps = {
  onCellInput: (idx: CellInfo, text: string) => void;
  onCellSelection: (cells: CellMap) => void;
  scroll: { x: number; y: number };
  onScroll: (scroll: { x: number; y: number }) => void;
};

export default function GridControls(props: GridControlsProps) {
  let cellInput!: HTMLInputElement;
  let isSelecting = false;
  const areaStart = {} as CellInfo;
  const [isCellInputVisible, setIsCellInputVisible] = ref(false);
  const [cellInputPos, setCellInputPos] = ref({
    idx: 0,
    col: 0,
    row: 0,
    x: 0,
    y: 0,
    id: "Aa",
  });

  function doSelection(ev: MouseEvent | TouchEvent) {
    if (!isSelecting) return;
    updateSelection(ev);
  }

  function startSelection(ev: MouseEvent | TouchEvent) {
    props.onCellSelection({});
    getCellAtCursor(ev, areaStart);
    updateSelection(ev);
    isSelecting = true;
  }

  function updateSelection(ev: MouseEvent | TouchEvent) {
    const areaEnd = getCellAtCursor(ev);

    const startCol = Math.min(areaStart.col, areaEnd.col);
    const endCol = Math.max(areaStart.col, areaEnd.col);
    const startRow = Math.min(areaStart.row, areaEnd.row);
    const endRow = Math.max(areaStart.row, areaEnd.row);

    const cells = {} as CellMap;

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellIdx = row * MAX_COLS + col;
        cells[cellIdx] = {
          text: "",
          width: CELL_W,
          height: CELL_H,
          x: areaStart.x + (col - areaStart.col) * CELL_W,
          y: areaStart.y + (row - areaStart.row) * CELL_H,
        };
      }
    }

    props.onCellSelection(cells);
  }

  function endSelection(ev: MouseEvent | TouchEvent) {
    isSelecting = false;
    updateSelection(ev);
  }

  function getCellAtCursor(ev: MouseEvent | TouchEvent, c = {} as CellInfo) {
    const cursor = getMousePosition(ev);
    const { x: offsetX, y: offsetY } = canvasRect();

    c.col = Math.floor((cursor.x + props.scroll.x - offsetX) / CELL_W);
    c.row = Math.floor((cursor.y + props.scroll.y - offsetY) / CELL_H);
    c.idx = c.row * MAX_COLS + c.col;
    c.id = `${toAlphaUpper(c.col)}${toAlphaLower(c.row)}`;
    c.x = cursor.x + props.scroll.x;
    c.y = cursor.y + props.scroll.y;

    return c;
  }

  function showCellInput(ev: MouseEvent) {
    setIsCellInputVisible(true);
    const cursor = getMousePosition(ev);
    const x = props.scroll.x % CELL_W;
    const y = props.scroll.y % CELL_H;
    const { x: offsetX, y: offsetY } = canvasRect();

    setCellInputPos.byRef((pos) => {
      getCellAtCursor(ev, pos);
      pos.x = aligned(cursor.x + x - offsetX, CELL_W) - x + offsetX;
      pos.y = aligned(cursor.y + y - offsetY, CELL_H) - y + offsetY;
      cellInput.focus();
    });
  }

  return (
    <>
      <div
        class="overflow-auto absolute right-0 bottom-0"
        style:width={`${canvasRect().width}px`}
        style:height={`${canvasRect().height}px`}
        on:click={() => setIsCellInputVisible(false)}
        on:mousedown={startSelection}
        on:mousemove={doSelection}
        on:mouseup={endSelection}
        on:touchstart={startSelection}
        on:touchmove={doSelection}
        on:touchend={endSelection}
        on:dblclick={showCellInput}
        on:scroll={(ev) =>
          props.onScroll({
            x: ev.currentTarget.scrollLeft,
            y: ev.currentTarget.scrollTop,
          })
        }
      >
        <div
          style:width={`${CELL_W * MAX_COLS}px`}
          style:height={`${CELL_H * MAX_ROWS}px`}
        />
      </div>
      <label
        class="absolute z-10 h-8 w-25"
        class:hidden={!isCellInputVisible()}
        style:left={`${cellInputPos().x}px`}
        style:top={`${cellInputPos().y}px`}
      >
        <input
          $ref={cellInput}
          class="px-2 rounded-xs bg-zinc-50 text-zinc-900 outline-indigo-700 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-emerald-400 outline-dashed outline-2 h-full w-full"
          on:change={(e) => {
            props.onCellInput(cellInputPos(), e.currentTarget.value);
          }}
        />
        <strong class="absolute -top-7 -left-1 p-1">{cellInputPos().id}</strong>
      </label>
      <Dbg>
        <p>Input: {isCellInputVisible()}</p>
      </Dbg>
    </>
  );
}
