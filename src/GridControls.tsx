import { ref } from "jsx";
import { canvasRect } from "./state";
import { aligned, asciiNumParser, getMousePosition } from "./utils";
import Dbg from "./Dbg";

const MAX_COLS = 1e5;
const MAX_ROWS = 2e5;
export const CELL_W = 100;
export const CELL_H = 30;

export const [toAlphaUpper] = asciiNumParser(26, "A".charCodeAt(0));
export const [toAlphaLower] = asciiNumParser(26, "a".charCodeAt(0));

type GridControlsProps = {
  onCellInput: (idx: number, text: string) => void;
  onCellClick: (idx: number, x: number, y: number) => void;
  scroll: { x: number; y: number };
  onScroll: (scroll: { x: number; y: number }) => void;
};

export default function GridControls(props: GridControlsProps) {
  let cellInput!: HTMLInputElement;
  const [isCellInputVisible, setIsCellInputVisible] = ref(false);
  const [cellPos, setCellPos] = ref({ x: 0, y: 0 });
  const [selectedCell, setSelectedCell] = ref({
    col: 0,
    row: 0,
    idx: 0,
    id: "Aa",
  });

  function selectCell(ev: MouseEvent) {
    setIsCellInputVisible(false);
    const cursor = getMousePosition(ev);
    const x = props.scroll.x % CELL_W;
    const y = props.scroll.y % CELL_H;
    const { x: offsetX, y: offsetY } = canvasRect();

    setCellPos.byRef((pos) => {
      pos.x = aligned(cursor.x + x - offsetX, CELL_W) - x + offsetX;
      pos.y = aligned(cursor.y + y - offsetY, CELL_H) - y + offsetY;
    });

    setSelectedCell.byRef((c) => {
      c.col = Math.floor((cursor.x + props.scroll.x - offsetX) / CELL_W);
      c.row = Math.floor((cursor.y + props.scroll.y - offsetY) / CELL_H);
      c.idx = c.row * MAX_COLS + c.col;
      c.id = `${toAlphaUpper(c.col)}${toAlphaLower(c.row)}`;
      props.onCellClick(
        c.idx,
        cursor.x + props.scroll.x,
        cursor.y + props.scroll.y,
      );
    });
  }

  return (
    <>
      <div
        class="overflow-auto absolute right-0 bottom-0"
        style:width={`${canvasRect().width}px`}
        style:height={`${canvasRect().height}px`}
        on:click={selectCell}
        on:dblclick={() => {
          setIsCellInputVisible(true);
          cellInput.focus();
        }}
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
        style:left={`${cellPos().x}px`}
        style:top={`${cellPos().y}px`}
      >
        <input
          $ref={cellInput}
          class="px-2 rounded-xs bg-zinc-50 text-zinc-900 outline-indigo-700 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-emerald-400 outline-dashed outline-2 h-full w-full"
          on:change={(e) =>
            props.onCellInput(selectedCell().idx, e.currentTarget.value)
          }
        />
        <strong class="absolute -top-7 -left-1 p-1">{selectedCell().id}</strong>
      </label>
      <Dbg>
        <p>Selected: {JSON.stringify(selectedCell())}</p>
        <p>Input: {isCellInputVisible()}</p>
      </Dbg>
    </>
  );
}
