import { Accessor, Component, For, JSX, Ref, Setter, createSignal } from "solid-js";
import { ASCII_CHAR_A, Mode, Move, Piece, Win } from "./constants";
import { Wood as SvgWoodTexture } from "./svg/Textures";
import svgPieces, { TW } from "./svg/Pieces";
import styles from "./App.module.css";

type MousePosition = {
  x: number;
  y: number;
};

export type BoardTheme = {
  backgroundFill: string;
  textureFill: string;
  specialTileFill: string;
  checkerPatternFill: string;
  checkerPatternOpacity: number;
};

export type GameBoardProps = {
  BOARD_SIZE_PX: number;
  NUM_BOARD_SQUARES: number;
  previewOnly: boolean;
  updateBoard: Function;
  board: Accessor<number[]>;
  pastBoardPosition: Accessor<boolean>;
  isLegalMove: Function;
  setGameInProgress: Function;
  movePiece: Function;
  boardTheme: BoardTheme;
  useAltRookSvg: boolean;
  colorToMove: Accessor<Piece>;
  playerColor: Accessor<Piece>;
  gameMode: Accessor<Mode>;
  legalMoves: Accessor<{ [key: number]: number[][] }>;
  winner: Accessor<Win | null>;
  gameInProgress: Accessor<boolean>;
  moveStack: Accessor<Move[]>;
  kingSquares?: Accessor<boolean[]>;
  throneIndex?: Accessor<number>;
  defenderSquares?: Accessor<boolean[]>;
  highlightedMove: Accessor<Move>;
  setHighlightedMove: Setter<Move>;
};

const GameBoard: Component<GameBoardProps> = ({
  BOARD_SIZE_PX,
  NUM_BOARD_SQUARES,
  previewOnly,
  updateBoard,
  board,
  pastBoardPosition,
  isLegalMove,
  setGameInProgress,
  movePiece,
  boardTheme,
  useAltRookSvg,
  colorToMove,
  playerColor,
  gameMode,
  legalMoves,
  winner,
  gameInProgress,
  moveStack,
  kingSquares,
  throneIndex,
  defenderSquares,
  highlightedMove,
  setHighlightedMove,
}) => {
  const [dragPosition, setDragPosition] = createSignal<MousePosition>({ x: 0, y: 0 });
  const [dragEnabled, setDragEnabled] = createSignal<boolean>(false);
  const [draggedIndex, setDraggedIndex] = createSignal<number>(-1);
  const [highlightedSquares, setHighlightedSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false));
  const [showColorSelect, setShowColorSelect] = createSignal<boolean>(false);
  const [cursorStyle, setCursorStyle] = createSignal<"Default" | "Grab" | "Grabbing">("Default");
  const [importedFenString, setImportedFenString] = createSignal<string>("");
  let boardSvgRef: Ref<SVGSVGElement | ((el: SVGSVGElement) => void) | undefined>;

  //#region board util

  /**
   * Short for "Board Width", this value represents the number of tiles/squares in a single
   * direction on a board.
   *
   * For example, a chessboard would have a value of "8"
   * An 11x11 board would have a value of "11"
   */
  const BW = Math.sqrt(NUM_BOARD_SQUARES);
  if (BW !== Math.floor(BW))
    throw console.error(`Invalid NUM_BOARD_SQUARES value ${NUM_BOARD_SQUARES} provided! This value must be a perfect square.`);

  const isColorToMove = (piece: Piece) => piece & colorToMove();
  const isPlayerColor = (piece: Piece) => piece & playerColor();
  const canMovePiece = (piece: Piece) => !pastBoardPosition() && isColorToMove(piece) && isPlayerColor(piece);

  const getXPositionFromBoardIndex = (index: number): number => (index % BW) * TW;
  const getYPositionFromBoardIndex = (index: number): number => (Math.floor(index / BW) % BW) * TW;
  const getBoardIndexFromRankFile = (rank: number, file: number): number => file + rank * BW;
  const getRankFileFromBoardIndex = (index: number): { file: number; rank: number } => ({
    file: index % BW,
    rank: Math.floor(index / BW) % BW,
  });
  const getPositionLabelFromBoardIndex = (index: number): string => {
    const { rank, file } = getRankFileFromBoardIndex(index);
    return `${String.fromCharCode(ASCII_CHAR_A + file)}${BW - rank}`;
  };
  const getMoveLabel = (prevIndex: number, newIndex: number): string =>
    `${getPositionLabelFromBoardIndex(prevIndex)} → ${getPositionLabelFromBoardIndex(newIndex)}`;

  //#endregion board util

  const getBoardIndexFromMousePosition = (pos: MousePosition, boardWidthPx: number): number => {
    const x = pos.x;
    const y = pos.y;

    const TILE_SIZE_PX = boardWidthPx / BW;
    const file = Math.floor(x / TILE_SIZE_PX);
    const rank = Math.floor(y / TILE_SIZE_PX);

    const index = getBoardIndexFromRankFile(rank, file);
    return index;
  };

  //#region svg pieces
  const PiecePlacer = (index: number, piece: JSX.Element, pos?: MousePosition) => (
    <g
      transform={`translate(${pos?.x ? pos.x : getXPositionFromBoardIndex(index)}, ${pos?.y ? pos.y : getYPositionFromBoardIndex(index)})`}
      style="fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"
    >
      {piece}
    </g>
  );

  const WhiteKing = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteKing(), pos);
  const WhitePawn = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhitePawn(), pos);
  const WhiteKnight = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteKnight(), pos);
  const WhiteBishop = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteBishop(), pos);
  const WhiteRook = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteRook(), pos);
  const WhiteQueen = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteQueen(), pos);
  const BlackKing = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackKing(), pos);
  const BlackPawn = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackPawn(), pos);
  const BlackKnight = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackKnight(), pos);
  const BlackBishop = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackBishop(), pos);
  const BlackRook = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackRook(), pos);
  const BlackQueen = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackQueen(), pos);
  //#endregion svg pieces

  //#region piece util
  const getPieceType = (piece: Piece): Piece => piece & 7;
  const getPieceColor = (piece: Piece): Piece => piece & 24;

  const pieceIsWhite = (piece: Piece): boolean => !!(piece & Piece.White);
  const pieceIsBlack = (piece: Piece): boolean => !!(piece & Piece.Black);

  const renderPiece = (piece: Piece, index: number, pos?: MousePosition) => {
    const pieceType = getPieceType(piece);
    const pieceColor = getPieceColor(piece);
    const isWhite = pieceColor === Piece.White;
    if (pieceType === Piece.Queen) {
      if (isWhite) return WhiteQueen(index, pos);
      else return BlackQueen(index, pos);
    }
    if (pieceType === Piece.Rook) {
      if (isWhite) return useAltRookSvg ? WhitePawn(index, pos) : WhiteRook(index, pos);
      else return useAltRookSvg ? BlackPawn(index, pos) : BlackRook(index, pos);
    }
    if (pieceType === Piece.Bishop) {
      if (isWhite) return WhiteBishop(index, pos);
      else return BlackBishop(index, pos);
    }
    if (pieceType === Piece.Knight) {
      if (isWhite) return WhiteKnight(index, pos);
      else return BlackKnight(index, pos);
    }
    if (pieceType === Piece.Pawn) {
      if (isWhite) return WhitePawn(index, pos);
      else return BlackPawn(index, pos);
    }
    if (pieceType === Piece.King) {
      if (isWhite) return WhiteKing(index, pos);
      else return BlackKing(index, pos);
    }
  };
  //#endregion piece util

  const highlightLegalMoves = (index: number): void => {
    const moves = legalMoves()[colorToMove()][index];
    moves.forEach((index) =>
      setHighlightedSquares((squares) => {
        squares[index] = true;
        return [...squares];
      }),
    );
  };

  //#region mouse & touch listeners
  const resetDragInteraction = () => {
    setDragEnabled(false);
    setHighlightedSquares([]);
    setCursorStyle("Default");
    updateBoard();
  };

  const startDrag = (pos: MousePosition) => {
    const target = boardSvgRef as SVGElement;
    const index = getBoardIndexFromMousePosition(pos, target.clientWidth);
    const piece = board()[index];
    if (piece) {
      setDragPosition(pos);
      setDraggedIndex(index);
      setDragEnabled(true);
      if (gameMode() !== Mode.Setup && canMovePiece(piece)) highlightLegalMoves(index);
      setCursorStyle("Grabbing");
      updateBoard();
    } else setDragEnabled(false);
  };

  const dragPiece = (pos: MousePosition) => {
    if (dragEnabled()) {
      setDragPosition(pos);
      if (cursorStyle() !== "Grabbing") setCursorStyle("Grabbing");
    } else {
      const index = getBoardIndexFromMousePosition(pos, (boardSvgRef as SVGElement).clientWidth);
      const pieceAtIndex = board()[index];
      setCursorStyle(pieceAtIndex ? "Grab" : "Default");
    }
  };

  const stopDrag = (pos: MousePosition) => {
    setHighlightedSquares([]);
    // updateBoard()
    if (!dragEnabled()) return;
    setDragEnabled(false);

    const index = getBoardIndexFromMousePosition(pos, (boardSvgRef as SVGElement).clientWidth);
    const piece = board()[draggedIndex()];
    const legalMove = gameMode() === Mode.Setup || (canMovePiece(piece) && isLegalMove(draggedIndex(), index));

    setCursorStyle(piece ? "Grab" : "Default");

    // If legal move, move piece to new board index
    if (legalMove) {
      // moving piece on board without selecting game mode enters local game
      if (!winner() && !gameInProgress() && gameMode() === Mode.Local) {
        setGameInProgress(true);
      }
      movePiece(draggedIndex(), index, piece);
    } else updateBoard();
  };

  const onMouseDown = (event: MouseEvent) => {
    if (dragEnabled()) {
      resetDragInteraction();
      return;
    }
    if (event.button !== 0 || previewOnly) return; // exclude all mouse clicks except for left mouse button (button 0)
    startDrag({ x: event.offsetX, y: event.offsetY });
  };

  const onMouseMove = (event: MouseEvent) => {
    dragPiece({ x: event.offsetX, y: event.offsetY });
  };

  const onMouseUp = ({ offsetX, offsetY }: MouseEvent) => {
    stopDrag({ x: offsetX, y: offsetY });
  };

  const onTouchStart = (event: TouchEvent) => {
    // TODO: Touch controls not working as expected
    if (dragEnabled()) {
      resetDragInteraction();
      return;
    }
    const touch = event.touches[0];
    startDrag({ x: touch.clientX, y: touch.clientY });
  };

  const onTouchMove = (event: TouchEvent) => {
    // TODO: Touch controls not working as expected
    const touch = event.touches[0];
    dragPiece({ x: touch.clientX, y: touch.clientY });
  };

  const onTouchEnd = (event: TouchEvent) => {
    // TODO: Touch controls not working as expected
    const touch = event.changedTouches[0];
    stopDrag({ x: touch.clientX, y: touch.clientY });
  };

  const onTouchCancel = (event: TouchEvent) => {
    // TODO: Touch controls not working as expected
    setDragEnabled(false);
  };
  //#endregion mouse & touch listeners

  const boardIndices = new Array(BW).fill(undefined).map((_, i) => i);
  const evenBoardIndices = boardIndices.filter((i) => i % 2 === 0);

  const Pieces = ({ board }: { board: Accessor<number[]> }) => (
    <For each={board()}>
      {(piece, i) => {
        if (!dragEnabled() || i() !== draggedIndex())
          return (
            <>
              {renderPiece(piece, i())}
              {board().toString()}
            </>
          );
      }}
    </For>
  );

  return (
    <div class={`${styles.BoardWrapper} ${previewOnly ? styles.PreviewBoard : styles[cursorStyle()] ?? ""}`}>
      <svg
        // svg properties
        ref={boardSvgRef}
        class={styles.Board}
        height={BOARD_SIZE_PX}
        width={BOARD_SIZE_PX}
        viewBox={`0 0 ${BW * TW} ${BW * TW}`}
        // mouse events
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        oncontextmenu={(e) => e.preventDefault()}
        // touch events
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        <rect width="100%" height="100%" fill={boardTheme.backgroundFill} />
        <g>
          <SvgWoodTexture fill={boardTheme.textureFill} />
        </g>
        <For each={boardIndices}>
          {(y) => (
            <For each={boardIndices}>
              {(x) => (
                <>
                  {evenBoardIndices.includes(x) && (
                    <rect
                      fill={boardTheme.checkerPatternFill}
                      fill-opacity={boardTheme.checkerPatternOpacity}
                      stroke="#787272"
                      stroke-width=".25"
                      stroke-opacity=".75"
                      x={`${TW * (x + (y % 2))}`}
                      y={`${TW * y}`}
                      width={`${TW}`}
                      height={`${TW}`}
                    />
                  )}
                  {highlightedSquares()[getBoardIndexFromRankFile(y, x)] && (
                    <rect fill="lightblue" opacity=".25" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />
                  )}
                  {defenderSquares && defenderSquares()[getBoardIndexFromRankFile(y, x)] && (
                    <rect fill="brown" opacity=".05" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />
                  )}
                  {kingSquares &&
                    (kingSquares()[getBoardIndexFromRankFile(y, x)] ||
                      (throneIndex && getBoardIndexFromRankFile(y, x) === throneIndex())) && (
                      <rect
                        class={styles.KingSquare}
                        fill={boardTheme.specialTileFill}
                        opacity=".5"
                        x={`${TW * x}`}
                        y={`${TW * y}`}
                        width={`${TW}`}
                        height={`${TW}`}
                      />
                    )}
                  {highlightedMove()?.prevIndex === getBoardIndexFromRankFile(y, x) && (
                    <circle fill="goldenrod" opacity=".25" cx={`${TW * x + TW / 2}`} cy={`${TW * y + TW / 2}`} r={`${TW / 6}`} />
                  )}
                  {highlightedMove()?.newIndex === getBoardIndexFromRankFile(y, x) && (
                    <rect fill="goldenrod" opacity=".25" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />
                  )}
                  {/* {props.highlightThreats && threatenedSquares()[getOppositeColor(colorToMove())][getBoardIndexFromRankFile(y, x)] && <rect fill="red" opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />} */}
                  {/* {highlightedLinesOfCheckSquares()[getBoardIndexFromRankFile(y, x)] && <rect fill="yellow" opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />} */}
                </>
              )}
            </For>
          )}
        </For>
        {/* Pieces on board */}
        <Pieces board={board} />

        {dragEnabled() &&
          renderPiece(board()[draggedIndex()], draggedIndex(), {
            x: dragPosition().x / ((boardSvgRef as SVGElement).clientWidth / (BW * TW)) - TW / 2,
            y: dragPosition().y / ((boardSvgRef as SVGElement).clientWidth / (BW * TW)) - TW / 2,
          })}
        {/* {displayPromotionDialog() && <>
      <rect width="100%" height="100%" fill="#1f1f1f" opacity={.75} />
      <For each={[Piece.Queen, Piece.Knight, Piece.Rook, Piece.Bishop]}>{(piece, i) => <>
        <rect fill="white" opacity={.75} x={getXPositionFromBoardIndex(promotionSquare() + (8 * i() * (whiteToMove() ? 1 : -1)))} y={getYPositionFromBoardIndex(promotionSquare() + (8 * i() * (whiteToMove() ? 1 : -1)))} width={`${TW}`} height={`${TW}`} />
        {renderPiece(piece | (whiteToMove() ? Piece.White : Piece.Black), promotionSquare() + (8 * i() * (whiteToMove() ? 1 : -1)))}
      </>}</For> */}
        {/* <text x={`${TW * (4 + (4 % 2))}`} y={`${TW * 4}`} class={styles.PromotionText}>Escape or Click to Cancel</text> */}
        {/* </>} */}
      </svg>
    </div>
  );
};

export default GameBoard;
