import { Component, createSignal } from "solid-js";
import styles from "./App.module.css";
import GameBoard from "./GameBoard";
import MoveStack from "./MoveStack";
import { ASCII_CHAR_A, Mode, Move, Piece, Win, WinCondition } from "./constants";
import { GameServerConnection, GameState, MoveData } from "./services/api-service";
import pieceMoveSFX from "./assets/sounds/piece-move.mp3";
import pieceCaptureSFX from "./assets/sounds/piece-capture.mp3";
import gameStartSFX from "./assets/sounds/game-start.mp3";
import { getRandomInt } from "./utility";

/**
 * Short for "Board Width", this value represents the number of tiles/squares in a single
 * direction on a board.
 *
 * For example, a chessboard would have a value of "8"
 * An 11x11 board would have a value of "11"
 */
const BW = 11;

/**
 * The total number of tiles/squares on a board.
 */
const NUM_BOARD_SQUARES = BW * BW;

const ORTHOGONAL_OFFSETS = [-BW, -1, 1, BW];

const DEFAULT_BOARD_FEN = "e3b5e8be16be4we4b2e3w3e3b3ew2kw2eb3e3w3e3b2e4we4be16be8b5_b";

const SELECTED_GAME_MODE = Mode.Local;
// const SELECTED_GAME_MODE = Mode.Setup

const isLightSquare = (index: number): boolean => (index + Math.floor(index / BW)) % 2 === 0;

// legal moves
const LEGAL_OFFSETS_KING = ORTHOGONAL_OFFSETS;
const LEGAL_OFFSETS_PAWN = [-BW, BW];
const LEGAL_OFFSETS_KNIGHT = [-17, -15, -10, -BW + 2, BW - 1, BW + 2, 15, 17];
const LEGAL_OFFSETS_BISHOP = [-BW - 1, -BW + 1, BW - 1, BW + 1];
const LEGAL_OFFSETS_ROOK = ORTHOGONAL_OFFSETS;
const LEGAL_OFFSETS_QUEEN = [-BW - 1, -BW, -BW + 1, -1, 1, BW - 1, BW, BW + 1];
const LEGAL_OFFSETS: { [key: number]: number[] } = {
  [Piece.King]: LEGAL_OFFSETS_KING,
  [Piece.Pawn]: LEGAL_OFFSETS_PAWN,
  [Piece.Knight]: LEGAL_OFFSETS_KNIGHT,
  [Piece.Bishop]: LEGAL_OFFSETS_BISHOP,
  [Piece.Rook]: LEGAL_OFFSETS_ROOK,
  [Piece.Queen]: LEGAL_OFFSETS_QUEEN,
};

const NUM_SQUARES_TO_EDGE: { [key: number]: number }[] = Array(NUM_BOARD_SQUARES)
  .fill(0)
  .map((n, i) => {
    const [x, y] = [i % BW, Math.floor(i / BW) % BW];

    const numNorth = y;
    const numSouth = BW - 1 - y;
    const numWest = x;
    const numEast = BW - 1 - x;

    const numNorthEast = Math.min(numNorth, numEast);
    const numNorthWest = Math.min(numNorth, numWest);
    const numSouthEast = Math.min(numSouth, numEast);
    const numSouthWest = Math.min(numSouth, numWest);

    return {
      [-BW - 1]: numNorthWest,
      [-BW]: numNorth,
      [-BW + 1]: numNorthEast,
      [-1]: numWest,
      [1]: numEast,
      [BW - 1]: numSouthWest,
      [BW]: numSouth,
      [BW + 1]: numSouthEast,
    };
  });

const getPieceType = (piece: Piece): Piece => piece & 7;
const getPieceColor = (piece: Piece): Piece => piece & 24;

const pieceIsWhite = (piece: Piece): boolean => !!(piece & Piece.White);
const pieceIsBlack = (piece: Piece): boolean => !!(piece & Piece.Black);

const getOppositeColor = (color: Piece): Piece.White | Piece.Black => (getPieceColor(color) === Piece.White ? Piece.Black : Piece.White);

const Hnefatafl: Component<{ BOARD_SIZE_PX: number; previewOnly: boolean }> = ({ BOARD_SIZE_PX, previewOnly }) => {
  // game logic (shared)
  const [board, setBoard] = createSignal<number[]>(Array(NUM_BOARD_SQUARES).fill(0));
  const [pastBoardPosition, setPastBoardPosition] = createSignal<boolean>(false);
  const [colorToMove, setColorToMove] = createSignal<Piece>(Piece.Any);
  const [playerColor, setPlayerColor] = createSignal<Piece>(Piece.Any);
  const [legalMoves, setLegalMoves] = createSignal<{ [key: number]: number[][] }>({
    [Piece.White]: Array(NUM_BOARD_SQUARES).fill([]),
    [Piece.Black]: Array(NUM_BOARD_SQUARES).fill([]),
  });
  const [winner, setWinner] = createSignal<Win | null>(null);
  const [moveStack, setMoveStack] = createSignal<Move[]>([]);
  const [kingLocation, setKingLocation] = createSignal<{ [key: number]: number }>({ [Piece.Black]: 4, [Piece.White]: 60 });
  const [gameMode, setGameMode] = createSignal<Mode>(SELECTED_GAME_MODE);
  const [roomCode, setRoomCode] = createSignal<string>("");
  const [fenString, setFenString] = createSignal<string>("");
  const [boardPositions, setBoardPositions] = createSignal<{ [key: string]: number }>({});
  const [gameInProgress, setGameInProgress] = createSignal<boolean>(false);
  // ui logic
  const [showColorSelect, setShowColorSelect] = createSignal<boolean>(false);
  const [importedFenString, setImportedFenString] = createSignal<string>("");
  // game logic (special)
  const [defenderSquares, setDefenderSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false));
  const [kingSquares, setKingSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false));
  const [throneIndex, setThroneIndex] = createSignal<number>(60);
  // other
  const [gameRules, setGameRules] = createSignal({
    strongKing: true,
    exitFortWin: true,
    shieldWallCapture: true,
    defenderLossOnRepetition: true,
  });

  const [lightSquareFill, setLightSquareFill] = createSignal<string>("#f0d9b5");
  const [darkSquareFill, setDarkSquareFill] = createSignal<string>("#f7e2bf");
  const [kingSquareFill, setKingSquareFill] = createSignal<string>("#ffffff");

  const [server, setServer] = createSignal<GameServerConnection>();

  const [highlightedMove, setHighlightedMove] = createSignal<Move>(
    new Move({ prevIndex: -1, newIndex: -1, label: "", fenString: "", id: -1 }),
  );

  /** Themes:
   * Default / Tournament:
   * LS: #f0d9b5
   * DS: #f7e2bf
   * KS: #ffffff
   *
   * Birchwood:
   * LS: #d4ad6e
   * DS: #c6a671
   * KS: #c2f8ff
   *
   * Ivory:
   * LS: #f0e2d5
   * DS: #eed5ba
   * KS: #ffffff
   *  OR: #00008b
   *  OR: #00008b (darkblue)
   *  OR: #dc143c (crimson)
   */

  const isColorToMove = (piece: Piece) => piece & colorToMove();

  const getKingLocation = (): number => kingLocation()[Piece.White];

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

  const getColorEncoding = (color: Piece) => (color === Piece.White ? "w" : color === Piece.Black ? "b" : "e");

  const calculateFenString = (board: number[], colorToMove: Piece): string => {
    // TODO: replace logic with bitboards
    let fen = "";
    let prevPiece = board[0];
    let count = -1;
    for (const piece of board) {
      count++;
      if (piece === prevPiece) {
        continue;
      }
      const char = !prevPiece ? "e" : getPieceType(prevPiece) === Piece.King ? "k" : getColorEncoding(getPieceColor(prevPiece));
      fen += `${char}${count > 1 ? count : ""}`;
      count = 0;
      prevPiece = piece;
    }
    return `${fen}_${getColorEncoding(colorToMove)}`;
  };

  const updateBoard = (newBoard: number[] = board(), updateFen: boolean = false, fenString: string = "", color: Piece = colorToMove()) => {
    setBoard(Array(NUM_BOARD_SQUARES).fill(0)); // temporary solution to force board to rerender
    setBoard(newBoard);

    if (updateFen) {
      fenString ||= calculateFenString(newBoard, color);
      setFenString(fenString);
    }
  };

  const getPieceFromFenChar = (char: string): Piece => {
    if (char === "w") return Piece.Rook | Piece.White;
    if (char === "b") return Piece.Rook | Piece.Black;
    if (char === "k") return Piece.King | Piece.White;

    return 0;
  };

  const getBoardFromFen = (fen: string): number[] => {
    // TODO: replace logic with bitboards
    let pieceStr = "";
    let countStr = "";
    let boardIndex = -1;
    const board: number[] = Array(NUM_BOARD_SQUARES).fill(0);
    for (let index = 0; index < fen.length; index++) {
      const char = fen[index];
      if (isNaN(Number(char))) {
        const count = Number(countStr) || 1;
        const piece = getPieceFromFenChar(pieceStr);
        for (let i = 0; i < count; i++) board[boardIndex + i] = piece;
        boardIndex += count;
        countStr = "";
        pieceStr = char;
      } else {
        countStr += char;
      }
    }

    return board;
  };

  const importGameFromFen = (fen: string): void => {
    const newBoard = getBoardFromFen(fen);

    setColorToMove(gameMode() === Mode.Setup ? Piece.Any : getPieceColor(getPieceFromFenChar(fen.at(-1) ?? "")) || 1);

    setBoard(newBoard);

    const findKingLocation = (color: Piece): number =>
      board().findIndex((piece) => getPieceType(piece) === Piece.King && getPieceColor(piece) === color);
    setKingLocation({ [Piece.Black]: findKingLocation(Piece.Black), [Piece.White]: findKingLocation(Piece.White) });

    updateBoard(newBoard, true, fen);

    if (gameMode() !== Mode.Setup) updateLegalMovesAndThreats();

    // TODO: reset all variables
    setMoveStack([]);

    setBoardPositions({ [fen]: 1 });
  };

  const isFriendlyPieceAtTarget = (index: number, pieceColor: Piece): boolean => getPieceColor(index) === pieceColor;

  enum Direction {
    Horizontal = 1,
    Vertical = BW,
    NortheastToSouthwest = BW - 1,
    NorthwestToSoutheast = BW + 1,
  }

  /**
   * Return a array of legal moves for a given index
   * @param index Constraint: 0 <= index < 64
   * @param piece Optional; provide if available to avoid need to lookup
   * @param pieceType Optional; provide if available to avoid need to lookup
   * @returns
   */
  const getLegalMovesAndThreatsForPiece = (
    board: number[],
    friendlyKingLocation: number,
    enemyKingLocation: number,
    index: number,
    piece?: number,
    pieceType?: Piece,
  ): number[] => {
    const thisPiece = piece ?? board[index];
    pieceType ||= getPieceType(thisPiece);

    let legalMoves: number[] = [];
    let legalOffsets = LEGAL_OFFSETS[pieceType];
    for (const offset of legalOffsets) {
      const numSquaresToEdge = NUM_SQUARES_TO_EDGE[index][offset];

      for (let i = 1; i <= numSquaresToEdge; i++) {
        const move = index + offset * i;
        const pieceAtTarget = board[move];
        if (pieceAtTarget) break;
        legalMoves.push(move);
      }
    }

    return pieceType !== Piece.King ? legalMoves.filter((move) => !kingSquares()[move] && move !== throneIndex()) : legalMoves;
  };

  const calculateLegalMoves = (
    b: number[] = board(),
    properties: { colorToMove: Piece; kingLocation: { [key: number]: number } },
  ): { [key: number]: number[][] } => {
    const { colorToMove, kingLocation } = properties;
    const playerColor = colorToMove;
    const enemyColor = getOppositeColor(playerColor);
    const legalMovesOnBoard: { [key: number]: number[][] } = { [playerColor]: Array(64).fill([]), [enemyColor]: Array(64).fill([]) };
    const piecesOnBoard: { [key: number]: number[][] } = { [playerColor]: [], [enemyColor]: [] };
    b.forEach((piece, index) => {
      if (piece > 0) piecesOnBoard[getPieceColor(piece)].push([piece, index]);
    });

    const numMoves = piecesOnBoard[playerColor].reduce((total, [piece, index]) => {
      const pieceType = getPieceType(piece);
      const moves = getLegalMovesAndThreatsForPiece(b, kingLocation[playerColor], kingLocation[enemyColor], index, piece, pieceType);
      legalMovesOnBoard[playerColor][index] = moves;
      return (total += moves.length);
    }, 0);

    return legalMovesOnBoard;
  };

  const isLegalMove = (prevIndex: number, newIndex: number): boolean => {
    return legalMoves()[colorToMove()][prevIndex].includes(newIndex);
  };

  const isEnemy = (board: number[], i1: number, i2: number) => board[i2] && getPieceColor(board[i1]) !== getPieceColor(board[i2]);
  const getNeighborEnemies = (board: number[], index: number) =>
    ORTHOGONAL_OFFSETS.filter((offset) => NUM_SQUARES_TO_EDGE[index][offset])
      .map((offset) => ({ offset, target: index + offset }))
      .filter(({ target: i }) => isEnemy(board, index, i));

  const checkCaptures = (newBoard: number[], newIndex: number) => {
    // for piece that just moved, get all neighboring enemy pieces
    const neighborEnemies: { offset: number; target: number }[] = getNeighborEnemies(newBoard, newIndex);

    // for each neighbor enemy, find the captures
    let capturedPieces = neighborEnemies.filter(({ offset, target }) => {
      // piece is captured if sandwiched
      return (
        (isEnemy(newBoard, target, target + offset) ||
          kingSquares()[target + offset] ||
          // throne is always hostile to attackers; only hostile to defenders if king is not on throne
          (target + offset === throneIndex() && getKingLocation() !== throneIndex())) &&
        getPieceType(newBoard[target]) !== Piece.King &&
        NUM_SQUARES_TO_EDGE[target][offset]
      );
    });

    // shield wall capture
    const edgeOffset = ORTHOGONAL_OFFSETS.find((offset) => NUM_SQUARES_TO_EDGE[newIndex][offset] === 0);
    if (edgeOffset) {
      for (const neighborEnemy of neighborEnemies.filter(({ offset }) => offset !== -edgeOffset)) {
        const { offset, target } = neighborEnemy;
        const enemies = [];
        let index = target;
        while (index > 0 && index < NUM_BOARD_SQUARES - 1 && NUM_SQUARES_TO_EDGE[index][offset] > 0 && isEnemy(newBoard, newIndex, index)) {
          enemies.push({ target: index, offset });
          index += offset;
        }

        // check if bookend friendly pieces
        if (
          ((newBoard[index] && !isEnemy(newBoard, newIndex, index)) || kingSquares()[index]) &&
          enemies.every((e) => isEnemy(newBoard, e.target, e.target - edgeOffset))
        ) {
          capturedPieces = capturedPieces.concat(enemies.filter(({ target }) => getPieceType(newBoard[target]) !== Piece.King));
        }
      }
    }

    return capturedPieces;
  };

  const checkWinConditions = (newBoard: number[], moves: { [key: number]: number[][] }, newFenString: string): Win | null => {
    // is king captured?
    if (
      ORTHOGONAL_OFFSETS.every(
        (offset) =>
          NUM_SQUARES_TO_EDGE[getKingLocation()][offset] &&
          (isEnemy(newBoard, getKingLocation(), getKingLocation() + offset) || getKingLocation() + offset === throneIndex()),
      )
    )
      return new Win(Piece.Black, WinCondition.Capture);

    // no more legal moves
    if (!moves[colorToMove()].filter((moves) => moves?.length).length) return new Win(getOppositeColor(colorToMove()), WinCondition.Moves);

    // check for perpetual moves loss
    if (boardPositions()[newFenString] > 2) return new Win(Piece.Black, WinCondition.Perpetual);

    // king reaches corner
    if (kingSquares()[getKingLocation()] && getKingLocation() !== throneIndex()) return new Win(Piece.White, WinCondition.Escape);

    // all defenders surrounded?
    let fill: boolean[] = Array(NUM_BOARD_SQUARES).fill(false);

    let foundEdge = false;
    const floodFill = (index: number, condition: Function, stopWhenEdgeFound: boolean = true) => {
      if ((stopWhenEdgeFound && foundEdge) || fill[index]) return;
      fill[index] = true;
      for (const offset of ORTHOGONAL_OFFSETS) {
        if (!NUM_SQUARES_TO_EDGE[index][offset]) {
          foundEdge = true;
          if (stopWhenEdgeFound) return;
        } else if (condition(index + offset)) floodFill(index + offset, condition, stopWhenEdgeFound);
      }
    };

    newBoard.forEach(
      (piece, index) =>
        getPieceColor(piece) === Piece.White && floodFill(index, (index: number) => getPieceColor(newBoard[index]) !== Piece.Black),
    );

    // if all defenders are surrounded
    if (!foundEdge) return new Win(Piece.Black, WinCondition.Surround);

    // exit fort
    const isKingOnEdge = ORTHOGONAL_OFFSETS.some((offset) => !NUM_SQUARES_TO_EDGE[getKingLocation()][offset]);
    const checkExitFort = (ignoredDefenders: number[] = []): boolean => {
      fill = Array(NUM_BOARD_SQUARES).fill(false);
      floodFill(
        getKingLocation(),
        (index: number) => getPieceColor(newBoard[index]) !== Piece.White || ignoredDefenders.includes(index),
        false,
      );

      const filledSquares = fill.reduce((acc: number[], isFilled, index) => {
        if (isFilled) acc.push(index);
        return acc;
      }, []);

      const filledSquaresContainAttackers = fill.some((isFilled, index) => isFilled && getPieceColor(newBoard[index]) === Piece.Black);

      const kingHasEmptySquareNeighbor = ORTHOGONAL_OFFSETS.some(
        (offset) => NUM_SQUARES_TO_EDGE[getKingLocation()][offset] && !newBoard[kingLocation()[Piece.White + offset]],
      );

      if (!isKingOnEdge || filledSquaresContainAttackers || filledSquares.length < 2 || !kingHasEmptySquareNeighbor) return false;

      const defenders: number[] = [];
      filledSquares.forEach((index) => {
        const offsets = ORTHOGONAL_OFFSETS;
        offsets.forEach((offset) => {
          if (NUM_SQUARES_TO_EDGE[index][offset] && getPieceType(newBoard[index + offset]) === Piece.Rook && !fill[index + offset]) {
            if (offsets.every((o) => !NUM_SQUARES_TO_EDGE[index + offset][o] || fill[index + offset + o])) fill[index + offset] = true;
            else defenders.push(index + offset);
          }
        });
      });

      const canBeCaptured = (defender: number): boolean => {
        // left and right are exposed
        return (
          (NUM_SQUARES_TO_EDGE[defender][1] > 0 &&
            !fill[defender + 1] &&
            !newBoard[defender + 1] &&
            NUM_SQUARES_TO_EDGE[defender][-1] > 0 &&
            !fill[defender + -1] &&
            !newBoard[defender + -1]) ||
          // top and bottom are exposed
          (NUM_SQUARES_TO_EDGE[defender][BW] > 0 &&
            !fill[defender + BW] &&
            !newBoard[defender + BW] &&
            NUM_SQUARES_TO_EDGE[defender][-BW] > 0 &&
            !fill[defender + -BW] &&
            !newBoard[defender + -BW])
        );
      };

      // some defender can be captured
      const vulnerableDefenders = defenders.filter((defender) => canBeCaptured(defender));

      fill = Array(NUM_BOARD_SQUARES).fill(false);
      defenders.forEach((index) => (fill[index] = true));

      return !vulnerableDefenders.length ? true : defenders.some((defender) => checkExitFort([...ignoredDefenders, defender]));
    };

    if (checkExitFort()) return new Win(Piece.White, WinCondition.Fort);

    // no winner
    return null;
  };

  const movePiece = (prevIndex: number, newIndex: number, piece?: number, playAudio: boolean = true): string => {
    piece ||= board()[prevIndex];
    const newBoard = board().slice();
    newBoard[prevIndex] = Piece.None;
    newBoard[newIndex] = piece;
    const pieceColor = getPieceColor(piece);
    const pieceType = getPieceType(piece);
    let audio = new Audio(pieceMoveSFX);
    let fenString: string = "";

    if (pieceType === Piece.King) setKingLocation((prev) => ({ ...prev, [pieceColor]: newIndex }));

    if (gameMode() === Mode.Setup) {
      setColorToMove(Piece.Any);
      fenString = calculateFenString(newBoard, Piece.Any);
      updateBoard(newBoard, true, fenString);
    } else {
      setColorToMove((prevColor) => getOppositeColor(prevColor));

      // check if capture
      const capturedPieces = checkCaptures(newBoard, newIndex);
      capturedPieces.forEach(({ target }) => (newBoard[target] = Piece.None));

      const moves = calculateLegalMoves(newBoard, { colorToMove: colorToMove(), kingLocation: kingLocation() });

      // add move to move stack and board position history
      fenString = calculateFenString(newBoard, colorToMove());
      const move = new Move({
        prevIndex,
        newIndex,
        label: getMoveLabel(prevIndex, newIndex),
        fenString,
        piece,
        id: moveStack().length,
        capturedIndexes: capturedPieces.map(({ target }) => target),
      });
      setPastBoardPosition(false);
      setHighlightedMove(move);
      setMoveStack((stack) => [...stack, move]);
      setBoardPositions((positions) => {
        positions[fenString] ??= 0;
        positions[fenString]++;
        return positions;
      });

      // check win conditions
      const win = checkWinConditions(newBoard, moves, fenString);
      if (win) {
        setWinner(win);
        setColorToMove(Piece.None);
        setGameInProgress(false);
        new Audio(gameStartSFX).play();
      } else setLegalMoves(moves);

      updateBoard(newBoard, true, fenString);

      if (gameMode() === Mode.Online) {
        // TODO: handle disconnected
        if (server()?.isActive()) {
          const moveData = { id: 1, prevIndex, newIndex, fenString };
          console.log("sending move to server", moveData);
          server()!.sendMove({ gameState: { roomCode: roomCode(), fenString, playerColor: 0, opponentColor: 0 }, moveData });
        }
      }
      if (capturedPieces.length) audio = new Audio(pieceCaptureSFX);
    }
    if (playAudio) audio.play();
    return fenString;
  };

  const resetBoard = () => {
    importGameFromFen(DEFAULT_BOARD_FEN);
    if (gameMode() === Mode.Setup) setColorToMove(Piece.Any);
  };

  const makeRandomMove = () => {
    const availableMoves: number[] = [];
    const numMoves = legalMoves()[colorToMove()].reduce((nMoves, move, index) => {
      if (move.length) availableMoves.push(index);
      return nMoves + (move?.length ?? 0);
    }, 0);
    if (numMoves) {
      const randomPreviousIndex = availableMoves[getRandomInt(availableMoves.length)];
      const availableSquares = legalMoves()[colorToMove()][randomPreviousIndex];
      const randomNewIndex = availableSquares[getRandomInt(availableSquares.length)];

      movePiece(randomPreviousIndex, randomNewIndex, board()[randomPreviousIndex], false);
    }
  };

  const updateLegalMovesAndThreats = () => {
    const moves = calculateLegalMoves(board(), { colorToMove: colorToMove(), kingLocation: kingLocation() });
    setLegalMoves(moves);

    if (previewOnly) {
      let depth = 0;
      const loop = setInterval(() => {
        if (depth++ < 10) makeRandomMove();
        else {
          clearInterval(loop);
          setTimeout(resetBoard, 2000);
        }
      }, 650);
    }
  };

  setKingSquares((board) => {
    board[0] = true;
    board[BW - 1] = true;
    board[NUM_BOARD_SQUARES - BW] = true;
    board[NUM_BOARD_SQUARES - 1] = true;
    return board;
  });

  resetBoard();

  setDefenderSquares(() => board().map((square) => !!square));

  const offerDraw = () => {
    alert("Not yet implemented!");
  };
  const resign = () => {
    if (gameInProgress()) {
      if (gameMode() === Mode.Online && server()?.isActive()) {
        server()?.sendResign({ roomCode: roomCode(), fenString: "temp", playerColor: 0, opponentColor: 0 });
        returnToMainScreen();
      }
      setWinner(new Win(getOppositeColor(colorToMove()), WinCondition.Resign));
      setColorToMove(Piece.None);
      setGameInProgress(false);
      new Audio(gameStartSFX).play();
    }
  };

  const getNextComputerMove = async (): Promise<{ prevIndex: number; newIndex: number }> => {
    // evaluate position

    // find best move

    // choose random move
    const availableMoves: number[] = [];
    legalMoves()[colorToMove()].forEach((move, index) => {
      if (move.length) availableMoves.push(index);
    });

    const randomPreviousIndex = availableMoves[getRandomInt(availableMoves.length)];
    const availableSquares = legalMoves()[colorToMove()][randomPreviousIndex];
    const randomNewIndex = availableSquares[getRandomInt(availableSquares.length)];
    return { prevIndex: randomPreviousIndex, newIndex: randomNewIndex };
  };

  const setGameModeToOnline = async (roomCode?: string) => {
    setWinner(null);
    if (gameMode() !== Mode.Online) {
      setGameMode(Mode.Online);
      setPlayerColor(Piece.Black);
      if (!server()?.isActive()) {
        const server = new GameServerConnection();
        try {
          if (roomCode) {
            // join room
            await server.joinRoom(roomCode);

            // get player color
            const { playerColor } = await server.gameStarted();
            setPlayerColor(playerColor);
          } else {
            // host new room
            const code = await server.createRoom();
            setRoomCode(code);
            await server.opponentPlayerJoin();
            server.sendStartGame({
              roomCode: code,
              fenString: "temp",
              playerColor: getOppositeColor(playerColor()),
              opponentColor: playerColor(),
            });
          }
          setServer(server);

          server.onOpponentMove = (data: { gameState: GameState; moveData: MoveData }) => {
            const { moveData } = data;
            console.log("received a move!", moveData);
            const piece = board()[moveData.prevIndex];
            // TODO: validate your fen board against opponent's
            if (isColorToMove(piece) && isLegalMove(moveData.prevIndex, moveData.newIndex)) {
              if (pastBoardPosition()) {
                setPastBoardPosition(false);
                setBoard(getBoardFromFen(moveStack().at(-1)!.fenString));
              }
              movePiece(moveData.prevIndex, moveData.newIndex, piece);
            }
          };

          server.onOpponentResign = () => {
            resign();
          };

          startGame(playerColor(), gameMode(), true);
        } catch (err) {
          alert("Failed to Connect - No room found at given code!");
          console.error(err);
          setGameMode(SELECTED_GAME_MODE);
        }
      }
    }
  };

  const returnToMainScreen = async () => {
    setGameMode(SELECTED_GAME_MODE);
    setRoomCode("");
    server()?.disconnect();
    setServer(undefined);
  };

  const setGameModeToSetup = () => {
    setGameMode(Mode.Setup);
    setGameInProgress(false);
    setColorToMove(Piece.Any);
    setPlayerColor(Piece.Any);
    setShowColorSelect(false);
  };

  const startGame = (selectedColor: Piece = playerColor(), mode: Mode = gameMode(), playSound: boolean = false) => {
    resetBoard();
    setMoveStack([]);
    setHighlightedMove(new Move({ prevIndex: -1, newIndex: -1, id: -1, label: "", fenString: "" }));
    setGameMode(mode);
    setShowColorSelect(false);
    setPlayerColor(selectedColor);
    setColorToMove(Piece.Black);
    setWinner(null);
    setGameInProgress(true);
    if (playSound) new Audio(gameStartSFX).play();

    if (mode === Mode.Computer && playerColor() !== colorToMove()) makeRandomMove();
  };

  return (
    <>
      <GameBoard
        BOARD_SIZE_PX={BOARD_SIZE_PX}
        NUM_BOARD_SQUARES={NUM_BOARD_SQUARES}
        previewOnly={previewOnly}
        updateBoard={updateBoard}
        board={board}
        pastBoardPosition={pastBoardPosition}
        colorToMove={colorToMove}
        playerColor={playerColor}
        kingSquares={kingSquares}
        throneIndex={throneIndex}
        defenderSquares={defenderSquares}
        gameMode={gameMode}
        getNextComputerMove={getNextComputerMove}
        legalMoves={legalMoves}
        isLegalMove={isLegalMove}
        winner={winner}
        gameInProgress={gameInProgress}
        moveStack={moveStack}
        setGameInProgress={setGameInProgress}
        movePiece={movePiece}
        highlightedMove={highlightedMove}
        setHighlightedMove={setHighlightedMove}
        useAltRookSvg={true}
        boardTheme={{
          backgroundFill: darkSquareFill(),
          textureFill: lightSquareFill(),
          specialTileFill: kingSquareFill(),
          checkerPatternFill: "none",
          checkerPatternOpacity: 0,
        }}
      />
      {!previewOnly && (
        <div class={styles.sidebar}>
          {(gameInProgress() || winner()) && (
            <>
              <MoveStack
                moveStack={moveStack}
                highlightedMove={highlightedMove}
                setHighlightedMove={setHighlightedMove}
                setPastBoardPosition={setPastBoardPosition}
                getBoardFromFen={getBoardFromFen}
                updateBoard={updateBoard}
                startingBoardFen={DEFAULT_BOARD_FEN}
              />
              {gameInProgress() && (
                <div class={styles.Row}>
                  {pieceIsWhite(colorToMove()) ? "White" : pieceIsBlack(colorToMove()) ? "Black" : "Any"} to Move
                </div>
              )}
            </>
          )}
          {!gameInProgress() && (
            <>
              <div class={styles.Row}>
                {winner() ? `${winner()?.winner === Piece.White ? "Defenders" : "Attackers"} win via ${winner()?.condition}!` : ""}
              </div>
              {gameMode() === Mode.Online ? (
                <>
                  {!winner() && (
                    <>
                      <div class={styles.Row}>Room Code: {roomCode()}</div>
                      <div class={styles.Row}>Waiting for opponent...</div>
                    </>
                  )}
                  <div class={styles.Row}>
                    <button onClick={returnToMainScreen}>Leave Room</button>
                  </div>
                  <div class={styles.Row}>
                    Player Color: {pieceIsWhite(playerColor()) ? "White" : pieceIsBlack(playerColor()) ? "Black" : "Any"}
                  </div>
                  <div class={styles.Row}>
                    <button onClick={() => setPlayerColor((prev) => getOppositeColor(prev))}>Change Player Color</button>
                  </div>
                </>
              ) : (
                <>
                  <div class={styles.Row}>
                    <button onClick={() => startGame(Piece.Any, Mode.Local, true)}>Start a Local Match</button>
                  </div>
                  <div class={styles.Row}>
                    <button onClick={() => startGame(Piece.Black, Mode.Computer, true)}>Play Black Against Computer</button>
                    <button onClick={() => startGame(Piece.White, Mode.Computer, true)}>Play White Against Computer</button>
                  </div>
                  <div class={styles.Row}>
                    <button onClick={() => setGameModeToOnline()}>Host Online Match</button>
                  </div>
                  <div class={styles.Row}>
                    <input type="text" placeholder="Enter Room Code" value={roomCode()} onInput={(e) => setRoomCode(e.target.value)} />
                    <button disabled={!roomCode()} onClick={() => setGameModeToOnline(roomCode())}>
                      Join Online Match
                    </button>
                  </div>
                  <div class={styles.Row}>
                    <button onClick={setGameModeToSetup}>Setup Custom Board</button>
                  </div>
                </>
              )}
            </>
          )}
          {gameInProgress() && (
            <div class={styles.Row}>
              <button onClick={offerDraw}>Offer Draw</button>
              <button onClick={resign}>Resign</button>
            </div>
          )}
          <div class={styles.Row}>
            <button onClick={() => navigator.clipboard.writeText(fenString())}>Copy Board Position to Clipboard</button>
          </div>
          {gameMode() === Mode.Setup && (
            <>
              <div class={styles.Row}>
                <input type="text" value={importedFenString()} onChange={(e) => setImportedFenString(e.target.value)} />
                <button onClick={() => importGameFromFen(importedFenString())}>Import Game</button>
              </div>
              <div class={styles.Row}>
                Light Squares: <input type="color" value={lightSquareFill()} onChange={(e) => setLightSquareFill(e.target.value)} />
              </div>
              <div class={styles.Row}>
                Dark Squares: <input type="color" value={darkSquareFill()} onChange={(e) => setDarkSquareFill(e.target.value)} />
              </div>
              <div class={styles.Row}>
                King Squares: <input type="color" value={kingSquareFill()} onChange={(e) => setKingSquareFill(e.target.value)} />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Hnefatafl;
