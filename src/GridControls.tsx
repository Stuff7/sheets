import { ref } from "jsx";
import { canvasRect } from "./state";
import {
  MAX_COLS,
  MAX_ROWS,
  aligned,
  getCellId,
  getMousePosition,
  isTouchscreen,
  type Cell,
  type CellMap,
  type Pos2D,
} from "./utils";
import Dbg from "./Dbg";

export const CELL_W = 100;
export const CELL_H = 30;

type GridControlsProps = {
  onCellInput: (idx: Cell, text: string) => void;
  onCellSelection: (cells: CellMap) => void;
  scroll: Pos2D;
  onScroll: (scroll: Pos2D) => void;
};

export const [touchSelection, setTouchSelection] = ref(false);

export default function GridControls(props: GridControlsProps) {
  let cellInput!: HTMLInputElement;
  let isSelecting = false;
  let ctrlPressed = isTouchscreen;
  const areaStart = {} as Cell;
  const [isCellInputVisible, setIsCellInputVisible] = ref(false);
  const [inputCellElem, setInputCellElem] = ref({ x: 0, y: 0, id: "Aa" });

  queueMicrotask(() => {
    props.onCellSelection({
      0: {
        x: 0,
        y: 0,
        width: CELL_W,
        height: CELL_H,
        text: "",
      },
    });
  });

  function doSelection(ev: MouseEvent | TouchEvent) {
    if (!isSelecting) return;
    updateSelection(ev);
  }

  let hasDragged = false;
  let selectedCells: CellMap = {};
  let newSelected: CellMap = {};
  let lastCell: Cell | null = null;
  let initialSelectedCells: CellMap = {};

  function startSelection(ev: MouseEvent | TouchEvent) {
    if (isTouchscreen && !touchSelection()) return;
    ev.preventDefault();
    getCellAtCursor(ev, areaStart);
    initialSelectedCells = { ...selectedCells };
    hasDragged = false;
    updateSelection(ev);
    isSelecting = true;
  }

  function updateSelection(ev: MouseEvent | TouchEvent) {
    const areaEnd = getCellAtCursor(ev);

    if (
      lastCell &&
      lastCell.col === areaEnd.col &&
      lastCell.row === areaEnd.row
    ) {
      return;
    }
    lastCell = { ...areaEnd };

    if (areaEnd.col !== areaStart.col || areaEnd.row !== areaStart.row) {
      hasDragged = true;
    }

    const startCol = Math.min(areaStart.col, areaEnd.col);
    const endCol = Math.max(areaStart.col, areaEnd.col);
    const startRow = Math.min(areaStart.row, areaEnd.row);
    const endRow = Math.max(areaStart.row, areaEnd.row);

    if (!ctrlPressed) {
      selectedCells = {};
      initialSelectedCells = {};
    }
    newSelected = { ...initialSelectedCells };

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellIdx = row * MAX_COLS + col;

        if (selectedCells[cellIdx] || newSelected[cellIdx]) {
          delete selectedCells[cellIdx];
          delete newSelected[cellIdx];
          continue;
        }

        newSelected[cellIdx] = {
          text: "",
          width: CELL_W,
          height: CELL_H,
          x: areaStart.x + (col - areaStart.col) * CELL_W,
          y: areaStart.y + (row - areaStart.row) * CELL_H,
        };
      }
    }

    props.onCellSelection({
      ...selectedCells,
      ...newSelected,
    });
  }

  function endSelection() {
    if (isTouchscreen && !touchSelection()) return;
    isSelecting = false;
    selectedCells = {
      ...newSelected,
      ...selectedCells,
    };
    props.onCellSelection(selectedCells);
    lastCell = null;
  }

  function getCellAtCursor(ev: MouseEvent | TouchEvent, c = {} as Cell) {
    const cursor = getMousePosition(ev);
    const { x: offsetX, y: offsetY } = canvasRect();

    c.col = Math.floor((cursor.x + props.scroll.x - offsetX) / CELL_W);
    c.row = Math.floor((cursor.y + props.scroll.y - offsetY) / CELL_H);
    c.x = cursor.x + props.scroll.x;
    c.y = cursor.y + props.scroll.y;

    return c;
  }

  const inputCell = {} as Cell;
  function showCellInput(ev: MouseEvent) {
    setIsCellInputVisible(true);
    const cursor = getMousePosition(ev);
    const x = props.scroll.x % CELL_W;
    const y = props.scroll.y % CELL_H;
    const { x: offsetX, y: offsetY } = canvasRect();

    setInputCellElem.byRef((pos) => {
      getCellAtCursor(ev, inputCell);
      pos.id = getCellId(inputCell.col, inputCell.row);
      pos.x = aligned(cursor.x + x - offsetX, CELL_W) - x + offsetX;
      pos.y = aligned(cursor.y + y - offsetY, CELL_H) - y + offsetY;
      cellInput.focus();
    });
  }

  return (
    <>
      <div
        class="absolute right-0 bottom-0"
        class:overflow-auto={!touchSelection()}
        style:width={`${canvasRect().width}px`}
        style:height={`${canvasRect().height}px`}
        g:onkeydown={
          isTouchscreen
            ? undefined
            : (e) => {
                if (e.key === "Control") ctrlPressed = true;
              }
        }
        g:onkeyup={
          isTouchscreen
            ? undefined
            : (e) => {
                if (e.key === "Control") ctrlPressed = false;
              }
        }
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
          on:click={() => setIsCellInputVisible(false)}
          on:mousedown={startSelection}
          on:mousemove={doSelection}
          on:mouseup={endSelection}
          on:touchstart={startSelection}
          on:touchmove={doSelection}
          on:touchend={endSelection}
          on:dblclick={showCellInput}
        />
      </div>
      <label
        class="absolute z-10 h-8 w-25"
        class:hidden={!isCellInputVisible()}
        style:left={`${inputCellElem().x}px`}
        style:top={`${inputCellElem().y}px`}
      >
        <input
          $ref={cellInput}
          class="px-2 rounded-xs bg-zinc-50 text-zinc-900 outline-indigo-700 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-emerald-400 outline-dashed outline-2 h-full w-full"
          on:change={(e) => {
            props.onCellInput(inputCell, e.currentTarget.value);
          }}
        />
        <strong class="absolute -top-7 -left-1 p-1">
          {inputCellElem().id}
        </strong>
      </label>
      <Dbg>
        <p>Input: {isCellInputVisible()}</p>
      </Dbg>
    </>
  );
}
