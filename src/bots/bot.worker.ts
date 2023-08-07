/// <reference lib="WebWorker" />

enum Piece {
  None = 0,
  King = 1,
  Pawn = 2,
  Knight = 3,
  Bishop = 4,
  Rook = 5,
  Queen = 6,

  White = 8,
  Black = 16,

  Any = White | Black,
}

const getPieceType = (piece: Piece): Piece => piece & 7;
const getPieceColor = (piece: Piece): Piece => piece & 24;

const pieceIsWhite = (piece: Piece): boolean => !!(piece & Piece.White);
const pieceIsBlack = (piece: Piece): boolean => !!(piece & Piece.Black);

const getOppositeColor = (color: Piece): Piece.White | Piece.Black => (getPieceColor(color) === Piece.White ? Piece.Black : Piece.White);

const isEnemy = (board: number[], i1: number, i2: number) => board[i2] && getPieceColor(board[i1]) !== getPieceColor(board[i2]);

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

const hasNeighborEnemies = (board: number[], index: number, piece = board[index]) => {
  return ORTHOGONAL_OFFSETS.some(
    (offset) => NUM_SQUARES_TO_EDGE[index][offset] && getPieceColor(piece) !== getPieceColor(board[index + offset]),
  );
};

const getNeighborEnemies = (board: number[], index: number) =>
  ORTHOGONAL_OFFSETS.filter((offset) => NUM_SQUARES_TO_EDGE[index][offset])
    .map((offset) => ({ offset, target: index + offset }))
    .filter(({ target: i }) => isEnemy(board, index, i));

const kingSquares = [0, BW - 1, NUM_BOARD_SQUARES - BW, NUM_BOARD_SQUARES - 1];
const isKingSquare = (i: number) => kingSquares.includes(i);
const throneIndex = 60;

const allDefendersSurrounded = (board: number[]): boolean => {
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

  board.forEach(
    (piece, index) =>
      getPieceColor(piece) === Piece.White && floodFill(index, (index: number) => getPieceColor(board[index]) !== Piece.Black),
  );

  // if all defenders are surrounded
  return !foundEdge;
};

type MovePrediction = { toIndex: number; moveScoreGuess: number };

const guessMoveScore = (board: number[], fromIndex: number, toIndex: number, isKing: boolean, distance: number): number => {
  let guess = distance;
  if (isKing) guess += 100;

  if (hasNeighborEnemies(board, fromIndex)) guess += 50;
  if (hasNeighborEnemies(board, toIndex)) guess += 50;

  return guess;
};

const getLegalMovesForPiece = (board: number[], index: number, isKing: boolean, sortMoves = true): MovePrediction[] => {
  let legalMoves: MovePrediction[] = [];
  for (const offset of ORTHOGONAL_OFFSETS) {
    const numSquaresToEdge = NUM_SQUARES_TO_EDGE[index][offset];

    for (let i = 1; i <= numSquaresToEdge; i++) {
      const move = index + offset * i;
      const pieceAtTarget = board[move];
      if (pieceAtTarget || (!isKing && (isKingSquare(move) || move === throneIndex))) break;

      const moveScoreGuess = sortMoves ? guessMoveScore(board, index, move, isKing, i) : 0;

      legalMoves.push({ toIndex: move, moveScoreGuess });
    }
  }

  return legalMoves;
};

const calculateLegalMoves = (b: number[], colorToMove: Piece, piecesOnBoard: number[][] = [], sortMoves = true): number[][] => {
  let legalMovesOnBoard: number[][] = [];
  if (!piecesOnBoard.length) {
    b.forEach((piece, fromIndex) => {
      if (piece & colorToMove) {
        const isKing = getPieceType(piece) === Piece.King;
        const moves = getLegalMovesForPiece(b, fromIndex, isKing, sortMoves);
        legalMovesOnBoard.push(...moves.map(({ toIndex, moveScoreGuess }) => [fromIndex, toIndex, moveScoreGuess]));
      }
    });
  } else {
    piecesOnBoard.forEach(([piece, fromIndex]) => {
      const isKing = getPieceType(piece) === Piece.King;
      const moves = getLegalMovesForPiece(b, fromIndex, isKing, sortMoves);
      legalMovesOnBoard.push(...moves.map(({ toIndex, moveScoreGuess }) => [fromIndex, toIndex, moveScoreGuess]));
    });
  }

  // sort moves
  if (sortMoves) legalMovesOnBoard.sort((a, b) => b[2] - a[2]);

  return legalMovesOnBoard;
};

const checkCaptures = (newBoard: number[], newIndex: number) => {
  // for piece that just moved, get all neighboring enemy pieces
  const neighborEnemies: { offset: number; target: number }[] = getNeighborEnemies(newBoard, newIndex);

  // for each neighbor enemy, find the captures
  let capturedPieces = neighborEnemies.filter(({ offset, target }) => {
    // piece is captured if sandwiched
    return (
      (isEnemy(newBoard, target, target + offset) ||
        isKingSquare(target + offset) ||
        // throne is always hostile to attackers; only hostile to defenders if king is not on throne
        (target + offset === throneIndex && getPieceType(newBoard[throneIndex]) !== Piece.King)) &&
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
        ((newBoard[index] && !isEnemy(newBoard, newIndex, index)) || isKingSquare(index)) &&
        enemies.every((e) => isEnemy(newBoard, e.target, e.target - edgeOffset))
      ) {
        capturedPieces = capturedPieces.concat(enemies.filter(({ target }) => getPieceType(newBoard[target]) !== Piece.King));
      }
    }
  }

  return capturedPieces;
};

const isCornerEscape = new Array(NUM_BOARD_SQUARES).fill(false);
isCornerEscape[0] = true;
isCornerEscape[BW - 1] = true;
isCornerEscape[NUM_BOARD_SQUARES - BW] = true;
isCornerEscape[NUM_BOARD_SQUARES - 1] = true;

const isKingCaptured = (board: number[], kingIndex: number) =>
  ORTHOGONAL_OFFSETS.every(
    (offset) =>
      NUM_SQUARES_TO_EDGE[kingIndex][offset] &&
      (getPieceColor(board[kingIndex + offset]) === Piece.Black || kingIndex + offset === throneIndex),
  );

// each non-king white piece is worth twice as much as a black piece
const MINOR_PIECE_VALUE = 1000;
const BLACK_PIECE_VALUE = MINOR_PIECE_VALUE;
// const WHITE_PIECE_VALUE = (MINOR_PIECE_VALUE * 4) / 3;
// const KING_VALUE = BLACK_PIECE_VALUE * 8;
const WHITE_PIECE_VALUE = MINOR_PIECE_VALUE;
const KING_VALUE = BLACK_PIECE_VALUE * 12;

const SPACE_CONTROLLED_VALUE = 1;
const WIN_GAME_VALUE = 1_000_000_000;
const LOSE_GAME_VALUE = -WIN_GAME_VALUE;

const KING_MOBILITY_VALUE = 1;

const KING_LOCATION_SCORE = [
  0, 100_000_000, 75, 75, 75, 75, 75, 75, 75, 100_000_000, 0, 100_000_000, 80, 80, 80, 80, 80, 80, 80, 80, 80, 100_000_000, 75, 80, 60, 60,
  60, 60, 60, 60, 60, 80, 75, 75, 80, 60, 40, 40, 40, 40, 40, 60, 80, 75, 75, 80, 60, 40, 0, -10, 0, 40, 60, 80, 75, 75, 80, 60, 40, -10, 0,
  -10, 40, 60, 80, 75, 75, 80, 60, 40, 0, -10, 0, 40, 60, 80, 75, 75, 80, 60, 40, 40, 40, 40, 40, 60, 80, 75, 75, 80, 60, 60, 60, 60, 60,
  60, 60, 80, 75, 100_000_000, 80, 80, 80, 80, 80, 80, 80, 80, 80, 100_000_000, 0, 100_000_000, 75, 75, 75, 75, 75, 75, 75, 100_000_000, 0,
];

// Maybe only score based on space controlled instead of material count?
// black starting moves: 86
// white starting moves: 60
// to keep balanced, king would be worth 26?

/**
 * Infinity: white will win
 * Zero: Even odds
 * Negative Infinity: black will win
 */
const evaluatePosition = (board: number[], kingIndex: number): number => {
  // check win/lose conditions
  if (isCornerEscape[kingIndex]) WIN_GAME_VALUE;
  if (isKingCaptured(board, kingIndex)) return LOSE_GAME_VALUE;
  if (allDefendersSurrounded(board)) return LOSE_GAME_VALUE;
  // TODO: check for exit fort or perpetual

  let evaluation = 0;

  const piecesOnBoard: { [key: number]: number[][] } = { [Piece.White]: [], [Piece.Black]: [] };
  board.forEach((piece, index) => {
    if (piece) piecesOnBoard[getPieceColor(piece)].push([piece, index]);
  });

  const nWhitePieces = piecesOnBoard[Piece.White].length - 1; // exclude white king
  const nBlackPieces = piecesOnBoard[Piece.Black].length;
  let materialEvaluation = KING_VALUE + nWhitePieces * WHITE_PIECE_VALUE - nBlackPieces * BLACK_PIECE_VALUE;
  evaluation += materialEvaluation;

  // how much space is controlled
  const legalMovesForWhite = calculateLegalMoves(board, Piece.White, piecesOnBoard[Piece.White], false);
  const legalMovesForBlack = calculateLegalMoves(board, Piece.Black, piecesOnBoard[Piece.Black], false);
  let spaceControlledEvaluation = legalMovesForWhite.length * SPACE_CONTROLLED_VALUE - legalMovesForBlack.length * SPACE_CONTROLLED_VALUE;
  evaluation += spaceControlledEvaluation;

  // how many pieces are threatened

  // king position score
  evaluation += KING_LOCATION_SCORE[kingIndex];

  // king mobility score
  const kingMobilityEvaluation = legalMovesForWhite.filter(([fromIndex]) => fromIndex === kingIndex).length * KING_MOBILITY_VALUE;
  evaluation += kingMobilityEvaluation;

  return evaluation;
};

const SEARCH_DEPTH = 3;
let nPositionsEvaluated = 0;

const search = (
  board: number[],
  colorToMove: Piece,
  kingIndex: number,
  depth: number,
  alpha: number,
  beta: number,
): { evaluation: number; prevIndex?: number; newIndex?: number } => {
  const perspective = colorToMove & Piece.White ? 1 : -1;
  nPositionsEvaluated++;
  // if depth reached, evaluate current position
  if (!depth) return { evaluation: perspective * evaluatePosition(board, kingIndex) };

  // check win conditions; if winning sequence is found, depth value is added to favor quicker wins
  if (isCornerEscape[kingIndex]) return { evaluation: perspective * (WIN_GAME_VALUE + depth) };
  if (isKingCaptured(board, kingIndex)) return { evaluation: perspective * (LOSE_GAME_VALUE - depth) };
  if (allDefendersSurrounded(board)) return { evaluation: perspective * (LOSE_GAME_VALUE - depth) };
  // TODO: check for exit fort or perpetual

  // get all legal moves for color to move in current position
  const moves = calculateLegalMoves(board, colorToMove);

  // if no moves available, color to move has lost the game
  if (!moves.length) return { evaluation: -Infinity };

  // search for best move for color to move in current position
  let bestMove: { prevIndex?: number; newIndex?: number } = { prevIndex: undefined, newIndex: undefined };
  for (let move of moves) {
    const [fromIndex, toIndex] = move;
    const piece = board[fromIndex];
    // console.log(`${colorToMove === Piece.White ? 'White' : 'Black'} moves:`, toIndexes);
    // if (depth === SEARCH_DEPTH) console.log(`evaluating move ${toIndex}...`);
    // make the move
    const newBoard = board.slice();
    newBoard[fromIndex] = Piece.None;
    newBoard[toIndex] = piece;

    // check if capture
    const capturedPieces = checkCaptures(newBoard, toIndex);
    capturedPieces.forEach(({ target }) => (newBoard[target] = Piece.None));

    // evaluate position based on opponent's next best move
    const isKing = getPieceType(piece) === Piece.King;
    let { evaluation } = search(newBoard, getOppositeColor(colorToMove), isKing ? toIndex : kingIndex, depth - 1, -beta, -alpha);
    evaluation *= -1;
    // console.log(`move: ${toIndex}, evaluation: ${evaluation}, alpha: ${alpha}, beta: ${beta}`);
    if (evaluation >= beta) {
      // move was too good, opponent will avoid this position
      return { evaluation: beta, prevIndex: fromIndex, newIndex: toIndex };
    }
    if (evaluation > alpha) {
      // bestEval = evaluation;
      bestMove = { prevIndex: fromIndex, newIndex: toIndex };
    }
    alpha = Math.max(alpha, evaluation);
  }

  // const result = { evaluation: bestEval, prevIndex: bestMove.prevIndex, newIndex: bestMove.newIndex };
  const result = { evaluation: alpha, prevIndex: bestMove.prevIndex, newIndex: bestMove.newIndex };
  // console.log({ ...result, colorToMove: colorToMove === Piece.White ? "White" : "Black" });
  return result;
};

addEventListener("message", ({ data }) => {
  const { board, colorToMove, kingIndex }: { board: number[]; colorToMove: Piece; kingIndex: number } = JSON.parse(data);

  const { evaluation, prevIndex, newIndex } = search(board, colorToMove, kingIndex, SEARCH_DEPTH, -Infinity, Infinity);

  console.log("Positions evaluated:", nPositionsEvaluated);
  // console.log(payload)
  const perspective = colorToMove === Piece.White ? 1 : -1;
  postMessage(JSON.stringify({ type: "move", payload: { evaluation: evaluation * perspective, prevIndex, newIndex } }));
});
