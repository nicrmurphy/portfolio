import { Accessor, Component, For, Setter, onMount, onCleanup, Ref } from "solid-js";
import styles from "./App.module.css";
import { Move, Piece } from "./constants";
import pieceMoveSFX from "./assets/sounds/piece-move.mp3";
import pieceCaptureSFX from "./assets/sounds/piece-capture.mp3";

type MoveStackProps = {
  moveStack: Accessor<Move[]>;
  highlightedMove: Accessor<Move>;
  setHighlightedMove: Setter<Move>;
  setPastBoardPosition: Setter<boolean>;
  getBoardFromFen: (fen: string) => number[];
  updateBoard: (newBoard?: number[], updateFen?: boolean, fenString?: string, color?: Piece) => void;
  startingBoardFen: string;
};

const MoveStack: Component<MoveStackProps> = ({
  moveStack,
  highlightedMove,
  setHighlightedMove,
  setPastBoardPosition,
  getBoardFromFen,
  updateBoard,
  startingBoardFen,
}) => {
  const startingMove = new Move({ prevIndex: -1, newIndex: -1, label: "", fenString: startingBoardFen, id: -1 });
  let wrapperRef: Ref<HTMLDivElement | ((el: HTMLDivElement) => void) | undefined>;

  const onMoveSelect = (move: Move) => {
    setHighlightedMove(move);
    setPastBoardPosition(highlightedMove().id !== moveStack().length - 1);
    updateBoard(getBoardFromFen(move.fenString));
    new Audio(move.capturedIndexes?.length ? pieceCaptureSFX : pieceMoveSFX).play();
  };

  const onKeyDown = ({ key }: KeyboardEvent) => {
    if ((key === "ArrowUp" && highlightedMove().id > -1) || (key === "ArrowLeft" && highlightedMove().id === 0)) onMoveSelect(startingMove);
    if (key === "ArrowLeft" && highlightedMove().id > 0) onMoveSelect(moveStack()[highlightedMove().id - 1]);
    if (key === "ArrowRight" && highlightedMove().id < moveStack().length - 1) onMoveSelect(moveStack()[highlightedMove().id + 1]);
    if (key === "ArrowDown" && highlightedMove().id < moveStack().length - 1) onMoveSelect(moveStack().at(-1)!);
  };

  onMount(() => {
    // TODO: debounce
    addEventListener("keydown", onKeyDown);
  });

  onCleanup(() => {
    removeEventListener("keydown", onKeyDown);
  });

  return (
    <div ref={wrapperRef} class={styles.MoveStackContainer}>
      <For each={moveStack()}>
        {(move, i) => (
          <>
            {i() % 2 === 0 && <div class={styles.MoveStackItem}>{i() / 2 + 1}.</div>}
            <div class={`${styles.MoveStackItem} ${styles.MoveStackMove} ${styles.noselect}`} onClick={() => onMoveSelect(move)}>
              <span class={move.id === highlightedMove().id ? styles.HighlightedMove : styles.NonHighlightedMove}>{move.label}</span>
            </div>
          </>
        )}
      </For>
    </div>
  );
};

export default MoveStack;
