import { Component, For, JSX, Ref, createSignal } from "solid-js";

import styles from "./App.module.css";
import { connectToGameServer } from "./services/api-service";
import { Socket } from "socket.io-client";

import svgPieces, { TW } from './svg/Pieces'
import { Wood as SvgWoodTexture } from "./svg/Textures"

/**
 * Short for "Board Width", this value represents the number of tiles/squares in a single
 * direction on a board.
 * 
 * For example, a chessboard would have a value of "8"
 * An 11x11 board would have a value of "11"
 */
const BW = 11

/**
 * The total number of tiles/squares on a board.
 */
const NUM_BOARD_SQUARES = BW * BW

const ORTHOGONAL_OFFSETS = [-BW, -1, 1, BW]

const DEFAULT_BOARD_FEN = 'e3b5e8be16be4we4b2e3w3e3b3ew2kw2eb3e3w3e3b2e4we4be16be8b5_b'
const EXIT_FORD_TESTING_FEN = 'e3b5e8be16be4we4b2e3w3e3b3e7b3e9b2e4w2e3be4we2we6wewe2we7ke2w_w'
const SHIELD_WALL_TESTING_FEN = 'e3b5e8be7we8bwe8b2we3w2e3b2we3kw2eb3we4we3b2we6be2we15be7b6_w'
const SHIELD_WALL_TESTING2_FEN = 'e3b5e8be7we8bwe8b2we3w2e3b2we3kw2eb3we8b2we9bwe9bwe3be8b5_w'
const SHIELD_WALL_TESTING3_FEN = 'e5b3e3wbe9kbe9wbe8bwbe3w2e3be2be3w2eb2wbe3w2e3bwbe8bwbe9be4be8b5_b'
const PERPETUAL_TESTING_FEN = 'e3bebebe7be4be7we2kebe4be5be3we5b3ew2e2web3e3w3e3b2e4we4be16be8b5_w'

// e25b5e5be2we2be3be2w3e2be2bew2kw2ebe2be2w3e2be2be6be4be2b3e6beb2e8bwb_b
// e26b4e6bewe2be4bew3e2be2bewekw2ebe2bew4e2be3be5be5beb3e5b2eb2e8bwb_b

/** shield wall tests (official)
 * e43we9wbe5ke3wbe8w_w -> i5-k5 -> e43we9we6ke3we11w_b (defender win via no moves)
 * e43we9wbe5ke3wbe32w_w -> k3-k5 -> e43we9we6ke3we11w_b (defender win via no moves)
 * e21we9wbe9wbe9wbe5ke3wbe8w_w -> i5-k5 -> e21we9we10we10we6ke3we11w_b (defender win via no moves)
 * e43be9bwe5ke3bwe8b_b -> i5-k5 -> e43be9be6ke3be11b_w
 * e20wbe9wbe8we18k_w -> i8-k8 -> e20we10we11we16k_b (defender win via no moves)
 * e54we5ke3wbe9wbe8we11wbe9wb_w -> i4-k4 -> e54we5ke3we10we11we9we10w_b (defender win via no moves)
 * e8b2e10kbe9wbe65w_w -> k3-k8 -> e8b2e10ke10we11w_b
 * e52ke11wbe9wbe10w_w -> i7-k7 -> e54ke9we10we11w_b (defender win via no moves)
 * e31be10bwe9bke9bwe10b_b -> j9-k9 -> e32be9be10bke9be11b_w
 * e65be31bke9bw_b -> k6-k4 -> e87be9bke9b_w
 * e32we9wbe8webe5ke4w_w -> i7-j7 -> e32we9wbe9wbe5ke4w_b (defender win via no moves)
 * e32we9wbe8wbe6ke2wb2e9we22w_w -> k3-k5 -> e32we9wbe8wbe6ke2wb2e9w2_b
 * e42we9wbe6ke2wbe32w_w -> j3-j5 -> e42we9wbe6ke2wbe10w_b
 * e31wbe9wbe8we7k_w -> i7-k7 -> e31wbe9wbe10we5k_b
 * e20be10wbe9wbe10be5k_b -> k7-j-7 -> e20be10wbe9wbe9be6k_w
 * e42w2e8kb2e8wb2e9we11w_w -> k3-k4 -> e42w2e8kb2e8wb2e9w2_b (defender win via no moves)
 * 
 * e8b2e21kbe7we2be53wbe9be9b_w -> j9-j10 ->
 *    e8b2e10ke11be7we2be53wbe9be9b_b -> k9-k10 ->
 *    e8b2e10kbe18we2be53wbe9be9b_w -> j3-j9 ->
 *    e8b2e10kbe9we8we2be54be9be9b_b -> k8-k9 ->
 *    e8b2e10kbe9wbe7we57be9be9b_w -> h8-k8 -> e8b2e10ke10we11we54be9be9b_b
 */

// e27ke15be5w2e3be6w2eb2e5w2e3be8beb_e

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

  Any = White | Black
}

enum Mode {
  Setup = 0,
  Local = 1,
  Online = 2,
  Computer = 3
}
const SELECTED_GAME_MODE = Mode.Local
// const SELECTED_GAME_MODE = Mode.Setup

type MousePosition = {
  x: number,
  y: number
}

enum WinCondition {
  Escape = 'Corner Escape',
  Fort = 'Exit Fort',
  Capture = 'King Captured',
  Moves = 'No Legal Moves',
  Surround = 'Surrounding All Defenders',
  Perpetual = 'Repeating Board Position Three Times',
  Resign = 'Resignation',
  Draw = 'Draw'
}

type Winner = Piece.Black | Piece.White | null

class Win {
  winner: Winner = null
  condition: WinCondition = WinCondition.Draw

  constructor(winner: Winner, condition: WinCondition) {
    this.winner = winner
    this.condition = condition
  }
}

const isLightSquare = (index: number): boolean => (index + Math.floor(index / BW)) % 2 === 0 

// legal moves
const LEGAL_OFFSETS_KING = ORTHOGONAL_OFFSETS
const LEGAL_OFFSETS_PAWN = [-BW, BW]
const LEGAL_OFFSETS_KNIGHT = [-17, -15, -10, -BW + 2, BW-1, BW+2, 15, 17]
const LEGAL_OFFSETS_BISHOP = [-BW-1, -BW+1, BW-1, BW+1]
const LEGAL_OFFSETS_ROOK = ORTHOGONAL_OFFSETS
const LEGAL_OFFSETS_QUEEN = [-BW-1, -BW, -BW+1, -1, 1, BW-1, BW, BW+1]
const LEGAL_OFFSETS: { [key: number]: number[] } = {
  [Piece.King]: LEGAL_OFFSETS_KING,
  [Piece.Pawn]: LEGAL_OFFSETS_PAWN,
  [Piece.Knight]: LEGAL_OFFSETS_KNIGHT,
  [Piece.Bishop]: LEGAL_OFFSETS_BISHOP,
  [Piece.Rook]: LEGAL_OFFSETS_ROOK,
  [Piece.Queen]: LEGAL_OFFSETS_QUEEN,
}

const getXPositionFromBoardIndex = (index: number): number => ((index % BW) * TW)
const getYPositionFromBoardIndex = (index: number): number => ((Math.floor(index / BW) % BW) * TW)
const getBoardIndexFromRankFile = (rank: number, file: number): number => file + (rank * BW)

const NUM_SQUARES_TO_EDGE: { [key: number]: number }[] = Array(NUM_BOARD_SQUARES).fill(0).map((n, i) => {
  const [x, y] = [(i % BW), (Math.floor(i / BW) % BW)]

  const numNorth = y
  const numSouth = (BW-1) - y
  const numWest = x
  const numEast = (BW-1) - x

  const numNorthEast = Math.min(numNorth, numEast)
  const numNorthWest = Math.min(numNorth, numWest)
  const numSouthEast = Math.min(numSouth, numEast)
  const numSouthWest = Math.min(numSouth, numWest)

  return {
    [-BW-1]: numNorthWest,
    [-BW]: numNorth,
    [-BW+1]: numNorthEast,
    [-1]: numWest,
    [1]: numEast,
    [BW-1]: numSouthWest,
    [BW]: numSouth,
    [BW+1]: numSouthEast
  }
})

//#region svg pieces
const PiecePlacer = (index: number, piece: JSX.Element, pos?: MousePosition) => <g transform={`translate(${pos?.x ? pos.x : getXPositionFromBoardIndex(index)}, ${pos?.y ? pos.y : getYPositionFromBoardIndex(index)})`} style="fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
  {piece}
</g>

const WhiteKing = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteKing(), pos)

const WhitePawn = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhitePawn(), pos)

const WhiteKnight = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteKnight(), pos)

const WhiteBishop = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteBishop(), pos)

const WhiteRook = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteRook(), pos)

const WhiteQueen = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.WhiteQueen(), pos)

const BlackKing = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackKing(), pos)

const BlackPawn = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackPawn(), pos)

const BlackKnight = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackKnight(), pos)

const BlackBishop = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackBishop(), pos)

const BlackRook = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackRook(), pos)

const BlackQueen = (index: number, pos?: MousePosition) => PiecePlacer(index, svgPieces.BlackQueen(), pos)
//#endregion svg pieces

const getPieceType = (piece: Piece): Piece => piece & 7
const getPieceColor = (piece: Piece): Piece => piece & 24

const pieceIsWhite = (piece: Piece): boolean => !!(piece & Piece.White)
const pieceIsBlack = (piece: Piece): boolean => !!(piece & Piece.Black)

const renderPiece = (piece: Piece, index: number, pos?: MousePosition) => {
  const pieceType = getPieceType(piece)
  const pieceColor = getPieceColor(piece)
  const isWhite = pieceColor === Piece.White
  if (pieceType === Piece.Queen) {
    if (isWhite) return WhiteQueen(index, pos)
    else return BlackQueen(index, pos)
  }
  if (pieceType === Piece.Rook) {
    if (isWhite) return WhitePawn(index, pos)
    else return BlackPawn(index, pos)
  }
  if (pieceType === Piece.Bishop) {
    if (isWhite) return WhiteBishop(index, pos)
    else return BlackBishop(index, pos)
  }
  if (pieceType === Piece.Knight) {
    if (isWhite) return WhiteKnight(index, pos)
    else return BlackKnight(index, pos)
  }
  if (pieceType === Piece.Pawn) {
    if (isWhite) return WhitePawn(index, pos)
    else return BlackPawn(index, pos)
  }
  if (pieceType === Piece.King) {
    if (isWhite) return WhiteKing(index, pos)
    else return BlackKing(index, pos)
  }
}

const getOppositeColor = (color: Piece): Piece.White | Piece.Black => getPieceColor(color) === Piece.White ? Piece.Black : Piece.White

const Hnefatafl: Component<{ BOARD_SIZE_PX: number, previewOnly: boolean }> = ({ BOARD_SIZE_PX, previewOnly }) => {  
  const [board, setBoard] = createSignal<number[]>(Array(NUM_BOARD_SQUARES).fill(0))
  const [highlightedSquares, setHighlightedSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false))
  const [exitFortSquares, setExitFortSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false))
  const [defenderSquares, setDefenderSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false))
  const [kingSquares, setKingSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false))
  const [throneIndex, setThroneIndex] = createSignal<number>(60)
  const [dragEnabled, setDragEnabled] = createSignal<boolean>(false)
  const [draggedIndex, setDraggedIndex] = createSignal<number>(-1)
  const [mousePosition, setMousePosition] = createSignal<MousePosition>({ x: 0, y: 0 })
  const [boardWidthPx, setBoardWidthPx] = createSignal<number>(BOARD_SIZE_PX)
  const [colorToMove, setColorToMove] = createSignal<Piece>(Piece.Any)
  const [playerColor, setPlayerColor] = createSignal<Piece>(Piece.Any)
  const [kingLocation, setKingLocation] = createSignal<{ [key: number]: number }>({ [Piece.Black]: 4, [Piece.White]: 60 })
  const [legalMoves, setLegalMoves] = createSignal<{ [key: number]: number[][] }>({ [Piece.White]: Array(NUM_BOARD_SQUARES).fill([]), [Piece.Black]: Array(NUM_BOARD_SQUARES).fill([]) })
  const [kingMoved, setKingMoved] = createSignal<{ [key: number]: boolean }>({ [Piece.White]: false, [Piece.Black]: false })
  const [winner, setWinner] = createSignal<Win | null>(null)
  const [moveStack, setMoveStack] = createSignal<string[]>([])
  const [boardPositions, setBoardPositions] = createSignal<{ [key: string]: number}>({})
  const [cursorStyle, setCursorStyle] = createSignal<'Default' | 'Grab' | 'Grabbing'>('Default')
  const [fenString, setFenString] = createSignal<string>('')
  const [importedFenString, setImportedFenString] = createSignal<string>('')
  const [gameMode, setGameMode] = createSignal<Mode>(SELECTED_GAME_MODE)
  const [gameInProgress, setGameInProgress] = createSignal<boolean>(false)
  const [gameRules, setGameRules] = createSignal({
    strongKing: true,
    exitFortWin: true,
    shieldWallCapture: true,
    defenderLossOnRepetition: true
  })

  const [lightSquareFill, setLightSquareFill] = createSignal<string>('#f0d9b5')
  const [darkSquareFill, setDarkSquareFill] = createSignal<string>('#f7e2bf')
  const [kingSquareFill, setKingSquareFill] = createSignal<string>('#ffffff')

  const [server, setServer] = createSignal<Socket>()

  let boardSvgRef: Ref<SVGSVGElement | ((el: SVGSVGElement) => void) | undefined>

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

  const isColorToMove = (piece: Piece) => piece & colorToMove()
  const isPlayerColor = (piece: Piece) => piece & playerColor()
  const canMovePiece = (piece: Piece) => isColorToMove(piece) && isPlayerColor(piece)

  const getKingLocation = (): number => kingLocation()[Piece.White]

  const getBoardIndexFromMousePosition = (pos: MousePosition, boardWidthPx: number): number => {
    const x = pos.x
    const y = pos.y

    const TILE_SIZE_PX = boardWidthPx / BW
    const file = Math.floor(x / TILE_SIZE_PX)
    const rank = Math.floor(y / TILE_SIZE_PX)
  
    const index = getBoardIndexFromRankFile(rank, file)
    return index
  }

  const getColorEncoding = (color: Piece) => color === Piece.White ? 'w' : color === Piece.Black ? 'b' : 'e'

  const calculateFenString = (board: number[], colorToMove: Piece): string => {
    // TODO: replace logic with bitboards
    let fen = ''
    let prevPiece = board[0]
    let count = -1
    for (const piece of board) {
      count++
      if (piece === prevPiece) {
        continue
      }
      const char = !prevPiece ? 'e' : getPieceType(prevPiece) === Piece.King ? 'k' : getColorEncoding(getPieceColor(prevPiece))
      fen += `${char}${count > 1 ? count : ''}`
      count = 0
      prevPiece = piece
    }
    return `${fen}_${getColorEncoding(colorToMove)}`
  }

  const updateBoard = (newBoard: number[] = board(), updateFen: boolean = false, fenString: string = '', color: Piece = colorToMove()) => {
    setBoard(Array(NUM_BOARD_SQUARES).fill(0))   // temporary solution to force board to rerender
    setBoard(newBoard)

    if (updateFen) {
      fenString ||= calculateFenString(newBoard, color)
      setFenString(fenString)
    }
  }

  const getPieceFromFenChar = (char: string): Piece => {
    if (char === 'w') return Piece.Rook | Piece.White
    if (char === 'b') return Piece.Rook | Piece.Black
    if (char === 'k') return Piece.King | Piece.White
    
    return 0
  }

  const importGameFromFen = (fen: string): void => {
    // TODO: replace logic with bitboards
    let pieceStr = ''
    let countStr = ''
    let boardIndex = -1
    const newBoard: number[] = Array(NUM_BOARD_SQUARES).fill(0)
    for (let index = 0; index < fen.length; index++) {
      const char = fen[index]
      if (isNaN(Number(char))) {
        const count = Number(countStr) || 1
        const piece = getPieceFromFenChar(pieceStr)
        for (let i = 0; i < count; i++) newBoard[boardIndex + i] = piece
        boardIndex += count
        countStr = ''
        pieceStr = char
      } else {
        countStr += char
      }
    }

    setColorToMove(gameMode() === Mode.Setup ? Piece.Any : (getPieceColor(getPieceFromFenChar(fen.at(-1) ?? '')) || 1))

    setBoard(newBoard)
    
    const findKingLocation = (color: Piece): number => board().findIndex(piece => getPieceType(piece) === Piece.King && getPieceColor(piece) === color)
    setKingLocation(({ [Piece.Black]: findKingLocation(Piece.Black), [Piece.White]: findKingLocation(Piece.White) }))
    
    updateBoard(newBoard, true, fen)

    if (gameMode() !== Mode.Setup) updateLegalMovesAndThreats()

    // TODO: reset all variables
    setMoveStack([])

    setBoardPositions({ [fen]: 1 })
  }

  const onMouseDown = (event: MouseEvent) => {
    if (dragEnabled()) {
      setDragEnabled(false)
      setHighlightedSquares([])
      setCursorStyle('Default')
      updateBoard()
      return
    }
    if (event.button !== 0 || previewOnly) return; // exclude all mouse clicks except for left mouse button (button 0)
    const target = boardSvgRef as SVGElement
    setBoardWidthPx(target.clientWidth)
    const index = getBoardIndexFromMousePosition({ x: event.offsetX, y: event.offsetY }, target.clientWidth)
    const piece = board()[index]
    if (canMovePiece(piece)) {
      setMousePosition({ x: event.offsetX, y: event.offsetY })
      setDraggedIndex(index)
      setDragEnabled(true)
      if (gameMode() !== Mode.Setup) highlightLegalMoves(index)
      setCursorStyle('Grabbing')
      updateBoard()
    }
    else setDragEnabled(false)
  }

  const onMouseMove = (event: MouseEvent) => {
    if (dragEnabled()) {
      setMousePosition({ x: event.offsetX, y: event.offsetY })
      if (cursorStyle() !== 'Grabbing') setCursorStyle('Grabbing')
    } else {
      const index = getBoardIndexFromMousePosition({ x: event.offsetX, y: event.offsetY }, (boardSvgRef as SVGElement).clientWidth)
      const pieceAtIndex = board()[index]
      setCursorStyle(canMovePiece(pieceAtIndex) ? 'Grab' : 'Default')
    }
  }

  const isFriendlyPieceAtTarget = (index: number, pieceColor: Piece): boolean => getPieceColor(index) === pieceColor

  enum Direction {
    Horizontal = 1,
    Vertical = BW,
    NortheastToSouthwest = BW-1,
    NorthwestToSoutheast = BW+1
  }

  const highlightLegalMoves = (index: number): void => {
    const moves = legalMoves()[colorToMove()][index]
    moves.forEach(index => setHighlightedSquares(squares => {
      squares[index] = true
      return [...squares]
    }))
  }

  /**
   * Return a array of legal moves for a given index
   * @param index Constraint: 0 <= index < 64
   * @param piece Optional; provide if available to avoid need to lookup
   * @param pieceType Optional; provide if available to avoid need to lookup
   * @returns 
   */
    const getLegalMovesAndThreatsForPiece = (board: number[], friendlyKingLocation: number, enemyKingLocation: number, index: number, piece?: number, pieceType?: Piece): number[] => {
      const thisPiece = piece ?? board[index]
      pieceType ||= getPieceType(thisPiece)

      let legalMoves: number[] = []
      let legalOffsets = LEGAL_OFFSETS[pieceType]
      for (const offset of legalOffsets) {
        const numSquaresToEdge = NUM_SQUARES_TO_EDGE[index][offset]
        
        for (let i = 1; i <= numSquaresToEdge; i++) {
          const move = index + (offset * i)
          const pieceAtTarget = board[move]
          if (pieceAtTarget) break
          legalMoves.push(move)
        }
      }
  
      return pieceType !== Piece.King ? legalMoves.filter(move => (!kingSquares()[move]) && move !== throneIndex()) : legalMoves
    }

  const calculateLegalMoves = (b: number[] = board(), properties: { colorToMove: Piece, kingLocation: { [key: number]: number } }): { [key: number]: number[][] } => {
    const { colorToMove, kingLocation } = properties
    const playerColor = colorToMove
    const enemyColor = getOppositeColor(playerColor)
    const legalMovesOnBoard: { [key: number]: number[][] } = { [playerColor]: Array(64).fill([]), [enemyColor]: Array(64).fill([])}
    const piecesOnBoard: { [key: number]: number[][] } = { [playerColor]: [], [enemyColor]: [] }
    b.forEach((piece, index) => {
      if (piece > 0) piecesOnBoard[getPieceColor(piece)].push([piece, index])
    })

    const numMoves = piecesOnBoard[playerColor].reduce((total, [piece, index]) => {
      const pieceType = getPieceType(piece)
      const moves = getLegalMovesAndThreatsForPiece(b, kingLocation[playerColor], kingLocation[enemyColor], index, piece, pieceType)
      legalMovesOnBoard[playerColor][index] = moves
      return total += moves.length
    }, 0)

    return legalMovesOnBoard
  }

  const isLegalMove = (prevIndex: number, newIndex: number): boolean => {
    return legalMoves()[colorToMove()][prevIndex].includes(newIndex)
  }

  const isEnemy = (board: number[], i1: number, i2: number) => board[i2] && getPieceColor(board[i1]) !== getPieceColor(board[i2])
  const getNeighborEnemies = (board: number[], index: number) => ORTHOGONAL_OFFSETS
    .filter(offset => NUM_SQUARES_TO_EDGE[index][offset])
    .map(offset => ({ offset, target: index + offset}))
    .filter(({ target: i }) => isEnemy(board, index, i));

  const checkCaptures = (newBoard: number[], newIndex: number) => {
    // for piece that just moved, get all neighboring enemy pieces
    const neighborEnemies: { offset: number, target: number }[] = getNeighborEnemies(newBoard, newIndex)
    
    // for each neighbor enemy, find the captures
    let capturedPieces = neighborEnemies.filter(({ offset, target }) => {
      // piece is captured if sandwiched
      return (isEnemy(newBoard, target, target + offset) || kingSquares()[target + offset] || (
        // throne is always hostile to attackers; only hostile to defenders if king is not on throne
        target + offset === throneIndex() && getKingLocation() !== throneIndex()
      )) && getPieceType(newBoard[target]) !== Piece.King && NUM_SQUARES_TO_EDGE[target][offset]
    })

    // shield wall capture
    const edgeOffset = ORTHOGONAL_OFFSETS.find(offset => NUM_SQUARES_TO_EDGE[newIndex][offset] === 0)
    if (edgeOffset) {
      for (const neighborEnemy of neighborEnemies.filter(({ offset }) => offset !== -edgeOffset)) {
        const { offset, target } = neighborEnemy
        const enemies = []
        let index = target
        while (index > 0 && index < NUM_BOARD_SQUARES - 1 && NUM_SQUARES_TO_EDGE[index][offset] > 0 && isEnemy(newBoard, newIndex, index)) {
          enemies.push(({ target: index, offset }))
          index += offset
        }

        // check if bookend friendly pieces
        if (((newBoard[index] && !isEnemy(newBoard, newIndex, index)) || kingSquares()[index]) && enemies.every(e => isEnemy(newBoard, e.target, e.target - edgeOffset))) {
          capturedPieces = capturedPieces.concat(enemies.filter(({ target }) => getPieceType(newBoard[target]) !== Piece.King))
        }
      }
    }

    return capturedPieces
  }

  const checkWinConditions = (newBoard: number[], moves: { [key: number]: number[][] }, newFenString: string): Win | null => {
    // is king captured?
    if (ORTHOGONAL_OFFSETS.every(offset => NUM_SQUARES_TO_EDGE[getKingLocation()][offset] && (isEnemy(newBoard, getKingLocation(), getKingLocation() + offset) ||
      getKingLocation() + offset === throneIndex()))) return new Win(Piece.Black, WinCondition.Capture)

    // no more legal moves
    if (!moves[colorToMove()].filter(moves => moves?.length).length) return new Win(getOppositeColor(colorToMove()), WinCondition.Moves)

    // check for perpetual moves loss
    if (boardPositions()[newFenString] > 2) return new Win(Piece.Black, WinCondition.Perpetual)

    // king reaches corner
    if (kingSquares()[getKingLocation()] && getKingLocation() !== throneIndex()) return new Win(Piece.White, WinCondition.Escape)

    // all defenders surrounded?
    let fill: boolean[] = Array(NUM_BOARD_SQUARES).fill(false)

    let foundEdge = false
    const floodFill = (index: number, condition: Function, stopWhenEdgeFound: boolean = true) => {
      if ((stopWhenEdgeFound && foundEdge) || fill[index]) return
      fill[index] = true;
      for (const offset of ORTHOGONAL_OFFSETS) {
        if (!NUM_SQUARES_TO_EDGE[index][offset]) {
          foundEdge = true
          if (stopWhenEdgeFound) return
        }
        else if (condition(index + offset)) floodFill(index + offset, condition, stopWhenEdgeFound)
      }
    }

    newBoard.forEach((piece, index) => getPieceColor(piece) === Piece.White &&
      floodFill(index, (index: number) => getPieceColor(newBoard[index]) !== Piece.Black)
    )

    // if all defenders are surrounded
    if (!foundEdge) return new Win(Piece.Black, WinCondition.Surround)

    // exit fort
    const isKingOnEdge = ORTHOGONAL_OFFSETS.some(offset => !NUM_SQUARES_TO_EDGE[getKingLocation()][offset])
    const checkExitFort = (ignoredDefenders: number[] = []): boolean => {
      fill = Array(NUM_BOARD_SQUARES).fill(false)
      floodFill(getKingLocation(), (index: number) => getPieceColor(newBoard[index]) !== Piece.White || ignoredDefenders.includes(index), false)

      const filledSquares = fill.reduce((acc: number[], isFilled, index) => {
        if (isFilled) acc.push(index)
        return acc
      }, [])

      const filledSquaresContainAttackers = fill.some((isFilled, index) => isFilled && getPieceColor(newBoard[index]) === Piece.Black)

      const kingHasEmptySquareNeighbor = ORTHOGONAL_OFFSETS.some(offset => NUM_SQUARES_TO_EDGE[getKingLocation()][offset] && !newBoard[kingLocation()[Piece.White + offset]])

      if (!isKingOnEdge || filledSquaresContainAttackers || filledSquares.length < 2 || !kingHasEmptySquareNeighbor) return false

      const defenders: number[] = []
      filledSquares.forEach(index => {
        const offsets = ORTHOGONAL_OFFSETS
        offsets.forEach(offset => {
          if (NUM_SQUARES_TO_EDGE[index][offset] && getPieceType(newBoard[index + offset]) === Piece.Rook && !fill[index + offset]) {
            if (offsets.every(o => !NUM_SQUARES_TO_EDGE[index + offset][o] || fill[index + offset + o])) fill[index + offset] = true
            else defenders.push(index + offset)
          }
        })
      })

      setExitFortSquares(fill)

      const canBeCaptured = (defender: number): boolean => {
        // left and right are exposed
        return ((NUM_SQUARES_TO_EDGE[defender][1] > 0 && !fill[defender + 1] && !newBoard[defender + 1]) && (NUM_SQUARES_TO_EDGE[defender][-1] > 0 && !fill[defender + -1] && !newBoard[defender + -1])) ||
        
        // top and bottom are exposed
        ((NUM_SQUARES_TO_EDGE[defender][BW] > 0 && !fill[defender + BW] && !newBoard[defender + BW]) && (NUM_SQUARES_TO_EDGE[defender][-BW] > 0 && !fill[defender + -BW] && !newBoard[defender + -BW]))
      }

      // some defender can be captured
      const vulnerableDefenders = defenders.filter(defender => canBeCaptured(defender))

      fill = Array(NUM_BOARD_SQUARES).fill(false)
      defenders.forEach(index => fill[index] = true)
      setHighlightedSquares(fill)

      return !vulnerableDefenders.length ? true : defenders.some(defender => checkExitFort([...ignoredDefenders, defender]));
    }

    if (checkExitFort()) return new Win(Piece.White, WinCondition.Fort)

    // no winner
    return null
  }
  
  const movePiece = (prevIndex: number, newIndex: number, piece?: number): void => {
    piece ||= board()[prevIndex]
    const newBoard = board().slice()
    newBoard[prevIndex] = Piece.None
    newBoard[newIndex] = piece
    const pieceColor = getPieceColor(piece)
    const pieceType = getPieceType(piece)

    if (pieceType === Piece.King) {
      if (!kingMoved()[pieceColor]) setKingMoved(prev => ({ ...prev, [pieceColor]: true }))
      setKingLocation(prev => ({ ...prev, [pieceColor]: newIndex }))
    }

    if (gameMode() === Mode.Setup) {
      setColorToMove(Piece.Any)
      const fen = calculateFenString(newBoard, Piece.Any)
      updateBoard(newBoard, true, fen)
    }
    else {
      setColorToMove(prevColor => getOppositeColor(prevColor))

      // check if capture
      const capturedPieces = checkCaptures(newBoard, newIndex)
      capturedPieces.forEach(({ target }) => newBoard[target] = Piece.None)

      const moves = calculateLegalMoves(newBoard, { colorToMove: colorToMove(), kingLocation: kingLocation() })

      // add move to move stack and board position history
      setMoveStack(stack => {
        // TODO: replace with piece movement
        stack.push('g5-g7')
        return stack
      })
      const newFenString = calculateFenString(newBoard, colorToMove())
      setBoardPositions(positions => {
        positions[newFenString] ??= 0
        positions[newFenString]++
        return positions
      })

      // check win conditions
      const win = checkWinConditions(newBoard, moves, newFenString)
      if (win) {
        setWinner(win)
        setColorToMove(1)
      }
      else setLegalMoves(moves)

      updateBoard(newBoard, true, newFenString)

      if (gameMode() === Mode.Online) {
        // TODO: handle disconnected
        if (server()?.active) {
          server()!.emit('move', { id: 1, prevIndex, newIndex, newFenString })
        }
      }
    }
  }

  const onMouseUp = ({ offsetX, offsetY }: MouseEvent) => {
    setHighlightedSquares([])
    // updateBoard()
    if (!dragEnabled()) return
    setDragEnabled(false)

    const index = getBoardIndexFromMousePosition({ x: offsetX, y: offsetY }, (boardSvgRef as SVGElement).clientWidth)
    const piece = board()[draggedIndex()]
    const legalMove = gameMode() === Mode.Setup || isLegalMove(draggedIndex(), index)

    setCursorStyle(canMovePiece(piece) ? 'Grab' : 'Default')
    
    // If legal move, move piece to new board index
    if (legalMove) movePiece(draggedIndex(), index, piece)
    else updateBoard()
  }

  const resetBoard = () => {
    importGameFromFen(DEFAULT_BOARD_FEN)
    if (gameMode() === Mode.Setup) setColorToMove(Piece.Any)
  }

  function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
  }

  const makeRandomMove = () => {
    const availableMoves: number[] = []
    const numMoves = legalMoves()[colorToMove()].reduce((nMoves, move, index) => {
      if (move.length) availableMoves.push(index)
      return nMoves + (move?.length ?? 0)
    }, 0)
    if (numMoves) {
      const randomPreviousIndex = availableMoves[getRandomInt(availableMoves.length)]
      const availableSquares = legalMoves()[colorToMove()][randomPreviousIndex]
      const randomNewIndex = availableSquares[getRandomInt(availableSquares.length)]

      movePiece(randomPreviousIndex, randomNewIndex)
    }
  }

  const updateLegalMovesAndThreats = () => {
    const moves = calculateLegalMoves(board(), { colorToMove: colorToMove(), kingLocation: kingLocation() })
    setLegalMoves(moves)

    if (previewOnly) {
      let depth = 0;
      const loop = setInterval(() => {
        if (depth++ < 10) makeRandomMove()
        else {
          clearInterval(loop)
          setTimeout(resetBoard, 2000)
        }
      }, 650);
    }
  }

  setKingSquares(board => {
    board[0] = true
    board[BW-1] = true
    board[NUM_BOARD_SQUARES-BW] = true
    board[NUM_BOARD_SQUARES-1] = true
    return board
  })

  resetBoard()
  
  setDefenderSquares(() => board().map(square => !!square))

  const offerDraw = () => {}
  const resign = () => {
    if (colorToMove() === Piece.Black || colorToMove() === Piece.White) {
      setWinner(new Win(getOppositeColor(colorToMove()), WinCondition.Resign))
      setColorToMove(Piece.None)
    }
  }

  const setGameModeToOnline = () => {
    if (gameMode() !== Mode.Online) {
      setGameMode(Mode.Online)
      setPlayerColor(Piece.Black)
      if (!server()?.active) {
        const socket = connectToGameServer()
        socket.on('move', data => {
          console.log('received a move!', data)
          const piece = board()[data.prevIndex]
          if (isColorToMove(piece) && isLegalMove(data.prevIndex, data.newIndex)) movePiece(data.prevIndex, data.newIndex, piece)
        })
        
        setServer(socket)
      }
    }
  }

  const setGameModeToSetup = () => {
    setGameMode(Mode.Setup)
  }
  const setGameModeToLocal = () => {}
  const setGameModeToComputer = () => {}

  return (
    <>
      <div class={`${styles.BoardWrapper} ${previewOnly ? styles.PreviewBoard : ''} ${styles[cursorStyle()] ?? ''}`}>
        <svg ref={boardSvgRef} class={styles.Board} height={BOARD_SIZE_PX} width={BOARD_SIZE_PX} viewBox={`0 0 ${BW * TW} ${BW * TW}`} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} oncontextmenu={(e) => e.preventDefault()}>
          <rect width="100%" height="100%" fill={lightSquareFill()} />
          <g>
            <SvgWoodTexture fill={darkSquareFill()} />
          </g>
          <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }>{(y) => 
            <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>{(x) => <>
              {[0, 2, 4, 6, 8, 10].includes(x) && <rect fill="gray" fill-opacity="0.01" stroke="#787272" stroke-width=".25" stroke-opacity=".75" x={`${TW * (x + (y % 2))}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
              {highlightedSquares()[getBoardIndexFromRankFile(y, x)] && <rect  fill="lightblue" opacity=".25" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
              {/* {exitFortSquares()[getBoardIndexFromRankFile(y, x)] && <rect fill="red" opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />} */}
              {(defenderSquares()[getBoardIndexFromRankFile(y, x)]) && <rect fill="brown" opacity=".05" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
              {(kingSquares()[getBoardIndexFromRankFile(y, x)] || getBoardIndexFromRankFile(y, x) === throneIndex()) && <rect class={styles.KingSquare} fill={kingSquareFill()} opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
            </>
            }</For>
          }</For>

          {/* Pieces on board */}
          <For each={board()}>{(piece, i) => {
            if (!dragEnabled() || i() !== draggedIndex()) return renderPiece(piece, i())
          }}</For>

          {dragEnabled() && renderPiece(board()[draggedIndex()], draggedIndex(), { x: (mousePosition().x / ((boardSvgRef as SVGElement).clientWidth / (BW * TW))) - (TW / 2), y: (mousePosition().y / ((boardSvgRef as SVGElement).clientWidth / (BW * TW))) - (TW / 2) })}
        </svg>
      </div>
      {
        !previewOnly &&
        <div class={styles.sidebar}>
          <div class={styles.Row}>{pieceIsWhite(colorToMove()) ? 'White' : pieceIsBlack(colorToMove()) ? 'Black' : 'Any'} to Move</div>
          <div class={styles.Row}>Player Color: {pieceIsWhite(playerColor()) ? 'White' : pieceIsBlack(playerColor()) ? 'Black' : 'Any'}</div>
          <div class={styles.Row}><button onClick={() => setPlayerColor(prev => getOppositeColor(prev))}>Change Player Color</button></div>
          {
            !gameInProgress() && <>
              <div class={styles.Row}>Game Mode Select:</div>
              <div class={styles.Row}><button onClick={setGameModeToLocal}>Local</button></div>
              <div class={styles.Row}><button onClick={setGameModeToOnline}>Host Online Game</button></div>
              <div class={styles.Row}><input type="text" value={importedFenString()} onChange={e => setImportedFenString(e.target.value)} /><button onClick={setGameModeToOnline}>Join Online Game</button></div>
              <div class={styles.Row}><button onClick={setGameModeToComputer}>Against Computer</button></div>
              <div class={styles.Row}><button onClick={setGameModeToSetup}>Setup</button></div>
            </>
          }
          <div class={styles.Row}>{winner() ? `${winner()?.winner === Piece.White ? 'Defenders' : 'Attackers'} win via ${winner()?.condition}!` : ''}</div>
          <div class={styles.Row}><button onClick={() => navigator.clipboard.writeText(fenString())}>Copy Game to Clipboard</button></div>
          <div class={styles.Row}>
            <button onClick={offerDraw}>Offer Draw</button>
            <button onClick={resign}>Resign</button>
          </div>
          <div class={styles.Row}><input type="text" value={importedFenString()} onChange={e => setImportedFenString(e.target.value)} /><button onClick={() => importGameFromFen(importedFenString())}>Import Game</button></div>
          <div class={styles.Row}>Light Squares: <input type="color" value={lightSquareFill()} onChange={(e) => setLightSquareFill(e.target.value)} /></div>
          <div class={styles.Row}>Dark Squares: <input type="color" value={darkSquareFill()} onChange={(e) => setDarkSquareFill(e.target.value)} /></div>
          <div class={styles.Row}>King Squares: <input type="color" value={kingSquareFill()} onChange={(e) => setKingSquareFill(e.target.value)} /></div>
        </div>
      }
    </>
  );
};

export default Hnefatafl;
