import { Component, createEffect, createSignal, on } from "solid-js";
import styles from "./App.module.css";
import GameBoard from "./GameBoard";
import { Mode, MousePosition, Piece, Win } from "./constants";

const TW = 45 // TILE_WIDTH -> don't change this unless all pieces SVG updated

const isLightSquare = (index: number): boolean => (index + Math.floor(index / 8)) % 2 === 0 

// legal moves
const LEGAL_OFFSETS_KING = [-9, -8, -7, -1, 1, 7, 8, 9]
const LEGAL_OFFSETS_PAWN = [-8, 8]
const LEGAL_OFFSETS_KNIGHT = [-17, -15, -10, -6, 6, 10, 15, 17]
const LEGAL_OFFSETS_BISHOP = [-7, -9, 7, 9]
const LEGAL_OFFSETS_ROOK = [-8, -1, 1, 8]
const LEGAL_OFFSETS_QUEEN = [-9, -8, -7, -1, 1, 7, 8, 9]
const LEGAL_OFFSETS: { [key: number]: number[] } = {
  [Piece.King]: LEGAL_OFFSETS_KING,
  [Piece.Pawn]: LEGAL_OFFSETS_PAWN,
  [Piece.Knight]: LEGAL_OFFSETS_KNIGHT,
  [Piece.Bishop]: LEGAL_OFFSETS_BISHOP,
  [Piece.Rook]: LEGAL_OFFSETS_ROOK,
  [Piece.Queen]: LEGAL_OFFSETS_QUEEN,
}

const CASTLE_SQUARES = [0, 7, 56, 63]

const getXPositionFromBoardIndex = (index: number): number => ((index % 8) * TW)
const getYPositionFromBoardIndex = (index: number): number => ((Math.floor(index / 8) % 8) * TW)

const NUM_SQUARES_TO_EDGE: { [key: number]: number }[] = Array(64).fill(0).map((n, i) => {
  const [x, y] = [(i % 8), (Math.floor(i / 8) % 8)]

  const numNorth = y
  const numSouth = 7 - y
  const numWest = x
  const numEast = 7 - x

  const numNorthEast = Math.min(numNorth, numEast)
  const numNorthWest = Math.min(numNorth, numWest)
  const numSouthEast = Math.min(numSouth, numEast)
  const numSouthWest = Math.min(numSouth, numWest)

  return {
    [-9]: numNorthWest,
    [-8]: numNorth,
    [-7]: numNorthEast,
    [-1]: numWest,
    [1]: numEast,
    [7]: numSouthWest,
    [8]: numSouth,
    [9]: numSouthEast
  }
})

const getPieceType = (piece: number): Piece => piece & 7
const getPieceColor = (piece: number): Piece => piece & 24

const getOppositeColor = (color: Piece): Piece => getPieceColor(color) === Piece.White ? Piece.Black : Piece.White

const Chess: Component<{ BOARD_SIZE_PX: number, previewOnly?: boolean, highlightMoves?: boolean, highlightThreats?: boolean, resetBoard?: boolean }> = (props) => {  
  const { BOARD_SIZE_PX, previewOnly } = props

  console.log(localStorage)

  const cache: {
    board: number[],
    highlightedSquares: boolean[],
    dragEnabled: boolean,
    draggedIndex: number,
    mousePosition: MousePosition,
    whiteToMove: boolean,
    colorToMove: Piece,
    checkmate: boolean,
    inCheck: boolean,
    kingLocation: { [key: number]: number },
    displayPromotionDialog: boolean,
    promotionSquare: number,
    promotionPreviousIndex: number,
    legalMoves: { [key: number]: number[][] },
    threatenedSquares: { [key: number]: boolean[] },
    lineOfCheckSquares: { [key: number]: number[][] },
    highlightedLinesOfCheckSquares: boolean[],
    enPassantSquare: number,
    kingMoved: { [key: number]: boolean },
    rookMoved: { [key: number]: boolean },
    moveStack: string[],
    isDraw: boolean,
    hoverFriendlyPiece: boolean
  } = previewOnly ? {} : JSON.parse(localStorage.getItem('chess') || '{}')

  console.log(cache)

  // game logic (shared)
  const [board, setBoard] = createSignal<number[]>(cache.board ?? Array(64).fill(0))
  const [highlightedSquares, setHighlightedSquares] = createSignal<boolean[]>(cache.highlightedSquares ?? Array(64).fill(false))
  const [dragEnabled, setDragEnabled] = createSignal<boolean>(cache.dragEnabled ?? false)
  const [draggedIndex, setDraggedIndex] = createSignal<number>(cache.draggedIndex ?? -1)
  const [mousePosition, setMousePosition] = createSignal<MousePosition>(cache.mousePosition ?? { x: 0, y: 0 })
  const [colorToMove, setColorToMove] = createSignal<Piece>(cache.colorToMove ?? Piece.White)
  const [legalMoves, setLegalMoves] = createSignal<{ [key: number]: number[][] }>(cache.legalMoves ?? { [Piece.White]: Array(64).fill([]), [Piece.Black]: Array(64).fill([]) })
  const [moveStack, setMoveStack] = createSignal<string[]>(cache.moveStack ?? [])
  const [kingLocation, setKingLocation] = createSignal<{ [key: number]: number }>(cache.kingLocation ?? { [Piece.Black]: 4, [Piece.White]: 60 })
  const [gameMode, setGameMode] = createSignal<Mode>(Mode.Local)
  const [winner, setWinner] = createSignal<Win | null>(null)
  const [gameInProgress, setGameInProgress] = createSignal<boolean>(false)
  // game logic (special)
  const [checkmate, setCheckmate] = createSignal<boolean>(cache.checkmate ?? false)
  const [inCheck, setInCheck] = createSignal<boolean>(cache.inCheck ?? false)
  const [displayPromotionDialog, setDisplayPromotionDialog] = createSignal<boolean>(cache.displayPromotionDialog ?? false)
  const [promotionSquare, setPromotionSquare] = createSignal<number>(cache.promotionSquare ?? -1)
  const [promotionPreviousIndex, setPromotionPreviousIndex] = createSignal<number>(cache.promotionPreviousIndex ?? -1)
  const [threatenedSquares, setThreatenedSquares] = createSignal<{ [key: number]: boolean[] }>(cache.threatenedSquares ?? { [Piece.White]: Array(64).fill(false), [Piece.Black]: Array(64).fill(false) })
  const [lineOfCheckSquares, setLineOfCheckSquares] = createSignal<{ [key: number]: number[][] }>(cache.lineOfCheckSquares ?? { [Piece.White]: [], [Piece.Black]: [] })
  const [highlightedLinesOfCheckSquares, setHighlightedLinesOfCheckSquares] = createSignal<boolean[]>(cache.highlightedLinesOfCheckSquares ?? Array(64).fill(false))
  const [enPassantSquare, setEnPassantSquare] = createSignal<number>(cache.enPassantSquare ?? -1)
  const [kingMoved, setKingMoved] = createSignal<{ [key: number]: boolean }>(cache.kingMoved ?? { [Piece.White]: false, [Piece.Black]: false })
  const [rookMoved, setRookMoved] = createSignal<{ [key: number]: boolean }>(cache.rookMoved ?? CASTLE_SQUARES.reduce((obj, square) => ({ ...obj, [square]: false }), {}))
  const [isDraw, setIsDraw] = createSignal<boolean>(cache.isDraw ?? false)
  // other
  const [whiteToMove, setWhiteToMove] = createSignal<boolean>(cache.whiteToMove ?? true)
  
  const [lightSquareFill, setLightSquareFill] = createSignal<string>('#f0d9b5')
  const [darkSquareFill, setDarkSquareFill] = createSignal<string>('#b58863')

  createEffect(on(() => props.resetBoard, (shouldReset) => {
    if (shouldReset) {
      setBoard(Array(64).fill(0))
      setHighlightedSquares(Array(64).fill(false))
      setDragEnabled(false)
      setDraggedIndex(-1)
      setMousePosition({ x: 0, y: 0 })
      setWhiteToMove(true)
      setColorToMove(Piece.White)
      setCheckmate(false)
      setInCheck(false)
      setKingLocation({ [Piece.Black]: 4, [Piece.White]: 60 })
      setDisplayPromotionDialog(false)
      setPromotionSquare(-1)
      setPromotionPreviousIndex(-1)
      setLegalMoves({ [Piece.White]: Array(64).fill([]), [Piece.Black]: Array(64).fill([]) })
      setThreatenedSquares({ [Piece.White]: Array(64).fill(false), [Piece.Black]: Array(64).fill(false) })
      setLineOfCheckSquares({ [Piece.White]: [], [Piece.Black]: [] })
      setHighlightedLinesOfCheckSquares(Array(64).fill(false))
      setEnPassantSquare(-1)
      setKingMoved({ [Piece.White]: false, [Piece.Black]: false })
      setRookMoved(CASTLE_SQUARES.reduce((obj, square) => ({ ...obj, [square]: false }), {}))
      setMoveStack([])
      setIsDraw(false)
      
      resetBoard()
      setTimeout(() => updateBoard())

      localStorage.removeItem('chess')
    }
  }))

  const getMoveString = (pieceType: Piece, prevIndex: number, newIndex: number): string => {
    return `${pieceType}-${prevIndex}-${newIndex}`
  }

  const updateBoard = (newBoard: number[] = board()) => {
    setBoard(Array(64).fill(0))   // temporary solution to force board to rerender
    setBoard(newBoard)
  }

  const movePiece = (prevIndex: number, newIndex: number, piece?: number): void => {
    // console.log(board())
    piece ||= board()[prevIndex]
    const newBoard = board().slice()
    newBoard[prevIndex] = 0
    newBoard[newIndex] = piece
    const pieceColor = getPieceColor(piece)
    const pieceType = getPieceType(piece)
    const isPawn = pieceType === Piece.Pawn
    const offset = prevIndex - newIndex
    let resetEnPassant = true

    if (isPawn) {
      const capturedEnPassant = isPawn && enPassantSquare() === newIndex
      if (capturedEnPassant) newBoard[enPassantSquare() + (offset < 0 ? -8 : 8)] = 0
      else if (Math.abs(offset) === 16) {  // if a pawn moved 2 squares forward, allow future en passant on skipped square
        setEnPassantSquare((prevIndex + newIndex) / 2)
        resetEnPassant = false
      }
    }
    else if (pieceType === Piece.King) {
      if (Math.abs(offset) === 2) {
        // castled
        newBoard[((newIndex + prevIndex) / 2)] = getPieceColor(piece) | Piece.Rook
        const rookIndex = prevIndex + (offset < 0 ? 3 : -4)
        newBoard[rookIndex] = 0
      }

      if (!kingMoved()[pieceColor]) setKingMoved(prev => ({ ...prev, [pieceColor]: true }))
      setKingLocation(prev => ({ ...prev, [pieceColor]: newIndex }))
    }
    
    if (CASTLE_SQUARES.includes(prevIndex) && !rookMoved()[prevIndex]) setRookMoved(prev => ({ ...prev, [prevIndex]: true }))
    if (CASTLE_SQUARES.includes(newIndex) && !rookMoved()[newIndex]) setRookMoved(prev => ({ ...prev, [newIndex]: true }))
    if (resetEnPassant) setEnPassantSquare(-1)

    setWhiteToMove(prev => !prev)
    setColorToMove(prevColor => getOppositeColor(prevColor))

    // calculate new board moves and threats
    const { moves, threats } = calculateLegalMoves(newBoard, { colorToMove: colorToMove(), kingLocation: kingLocation(), lineOfCheckSquares: lineOfCheckSquares(), enPassantSquare: enPassantSquare() })

    // look for checks
    const playerKingInCheck = threats[colorToMove()][kingLocation()[pieceColor]]
    const enemyKingInCheck = threats[pieceColor][kingLocation()[colorToMove()]]

    // console.log({ playerKingInCheck, enemyKingInCheck, kingLocation: kingLocation()[pieceColor], threats: threats[colorToMove()] })

    setInCheck(playerKingInCheck || enemyKingInCheck)

    setLegalMoves(moves)
    setThreatenedSquares(threats)

    if (!moves[pieceColor].length) setCheckmate(true)

    // check for draw due to repeated moves
    setMoveStack(stack => [...stack, getMoveString(pieceType, prevIndex, newIndex)])
    if (moveStack().length > 7) {
      let isDraw = true
      for (let i = 0; i < 4; i++) {
        if (moveStack()[i] !== moveStack()[i + 4]) {
          isDraw = false
          break;
        }
      }
      setIsDraw(isDraw)
    }
    
    updateBoard(newBoard)

    if (!previewOnly) localStorage.setItem('chess', JSON.stringify({
      board: board(),
      highlightedSquares: highlightedSquares(),
      dragEnabled: dragEnabled(),
      draggedIndex: draggedIndex(),
      mousePosition: mousePosition(),
      whiteToMove: whiteToMove(),
      colorToMove: colorToMove(),
      checkmate: checkmate(),
      inCheck: inCheck(),
      kingLocation: kingLocation(),
      displayPromotionDialog: displayPromotionDialog(),
      promotionSquare: promotionSquare(),
      promotionPreviousIndex: promotionPreviousIndex(),
      legalMoves: legalMoves(),
      threatenedSquares: threatenedSquares(),
      lineOfCheckSquares: lineOfCheckSquares(),
      highlightedLinesOfCheckSquares: highlightedLinesOfCheckSquares(),
      enPassantSquare: enPassantSquare(),
      kingMoved: kingMoved(),
      rookMoved: rookMoved(),
      moveStack: moveStack(),
      isDraw: isDraw(),
    }))
  }

  const isFriendlyPieceAtTarget = (index: number, pieceColor: Piece): boolean => getPieceColor(index) === pieceColor

  enum Direction {
    Horizontal = 1,
    Vertical = 8,
    NortheastToSouthwest = 7,
    NorthwestToSoutheast = 9
  }

  /**
   * Returns index of an enemy piece that is causing the pin; 0 if no pin
   * @param board 
   * @param threatsOnBoard 
   * @param kingLocation 
   * @param index 
   * @param ignoreThreatCheck only set to true when checking for en passant pin
   * @returns 
   */
  const checkForPin = (board: number[], threatsOnBoard: boolean[], kingLocation: number, index: number, ignoreThreatCheck: boolean = false): { isPinned: boolean, pinIndex: number, legalPinnedSlideMoves: number[] } => {
    const pinResult = { isPinned: false, pinIndex: 0, legalPinnedSlideMoves: [] }
    
    // if this piece is not being threatened, it is not pinned
    if (!threatsOnBoard[index] && !ignoreThreatCheck) return pinResult

    // if this piece is the king, it is in check, not a pin
    if (index === kingLocation) return pinResult
    
    // this is a pinned piece if it is on same rank/file/diag as friendly king & sliding enemy piece with line of sight
    const [kingLocationX, kingLocationY] = [getXPositionFromBoardIndex(kingLocation), getYPositionFromBoardIndex(kingLocation)]
    const [pieceLocationX, pieceLocationY] = [getXPositionFromBoardIndex(index), getYPositionFromBoardIndex(index)]
    const pieceColor = getPieceColor(board[index])
    const legalPinnedSlideMoves: number[] = []

    const checkOrthogonalPin = (direction: Direction): number => {
      let directionOfKing: 1 | -1
      if (direction === Direction.Horizontal && pieceLocationY === kingLocationY) directionOfKing = pieceLocationX < kingLocationX ? 1 : -1
      else if (direction === Direction.Vertical && pieceLocationX === kingLocationX) directionOfKing = pieceLocationY < kingLocationY ? 1 : -1
      else if (direction === Direction.NorthwestToSoutheast || direction === Direction.NortheastToSouthwest) directionOfKing = index < kingLocation ? 1 : -1
      else return 0

      // search in direction of king to verify no other pieces would block potential check if this piece moved
      const nSquaresBetweenPieceAndKing = Math.abs(index - kingLocation) / direction
      for (let offset = 1; offset < nSquaresBetweenPieceAndKing; offset++) {
        const targetIndex = index + (offset * directionOfKing * direction)
        const pieceAtTarget = board[targetIndex]
        legalPinnedSlideMoves.push(targetIndex)
        if (pieceAtTarget) return 0
      }

      // if reached this point, then no pieces are between this piece & king; pin is possible
      const enemyPieceType = direction === Direction.Horizontal || direction === Direction.Vertical ? Piece.Rook : Piece.Bishop

      // search in opposite direction as king; stop if piece is found; if found piece is enemy Rook or Queen, this piece is pinned
      const directionAwayFromKing = directionOfKing * -1
      for (let offset = 1; offset <= NUM_SQUARES_TO_EDGE[index][directionAwayFromKing * direction]; offset++) {
        const targetIndex = index + (offset * directionAwayFromKing * direction)
        const pieceAtTarget = board[targetIndex]
        const pieceType = getPieceType(pieceAtTarget)
        legalPinnedSlideMoves.push(targetIndex)
        if (pieceAtTarget > 0) {
          if (!isFriendlyPieceAtTarget(pieceAtTarget, pieceColor) && (pieceType === enemyPieceType || pieceType === Piece.Queen)) {
            legalPinnedSlideMoves.push(targetIndex)
            return targetIndex
          }
          return 0
        }
      }
      return 0
    }

    let pinIndex: number = checkOrthogonalPin(Direction.Horizontal)
    if (pinIndex) return { isPinned: true, pinIndex, legalPinnedSlideMoves }
    pinIndex = checkOrthogonalPin(Direction.Vertical)
    if (pinIndex) return { isPinned: true, pinIndex, legalPinnedSlideMoves }

    // on same diag as king? look for Bishops/Queens
    const diff = Math.max(index, kingLocation) - Math.min(index, kingLocation)

    // Northwest to Southeast or Southeast to Northwest
    if (diff % 9 === 0) {
      pinIndex = checkOrthogonalPin(Direction.NorthwestToSoutheast)
      if (pinIndex) return { isPinned: true, pinIndex, legalPinnedSlideMoves } 
    }
    if (diff % 7 === 0) {
      pinIndex = checkOrthogonalPin(Direction.NortheastToSouthwest)
      if (pinIndex) return { isPinned: true, pinIndex, legalPinnedSlideMoves } 
    }

    return { isPinned: false, pinIndex: 0, legalPinnedSlideMoves: [] }
  }

  /**
   * Return a array of legal moves for a given index
   * @param index Constraint: 0 <= index < 64
   * @param piece Optional; provide if available to avoid need to lookup
   * @param pieceType Optional; provide if available to avoid need to lookup
   * @returns 
   */
  const getLegalMovesAndThreatsForPiece = (board: number[], threatsOnBoard: boolean[], linesOfCheck: number[][], friendlyKingLocation: number, enemyKingLocation: number, index: number, piece?: number, pieceType?: Piece, enPassantSquare?: number): { moves: number[], threats: number[], checkSquares: number[] } => {
    const thisPiece = piece ?? board[index]
    pieceType ||= getPieceType(thisPiece)
    const pieceColor = getPieceColor(thisPiece)
    const isPawn = pieceType === Piece.Pawn
    const canSlide = isPawn || pieceType === Piece.Bishop || pieceType === Piece.Rook || pieceType === Piece.Queen
    let maxPawnSquares = 999
    if (isPawn) maxPawnSquares = (pieceColor === Piece.Black && 8 <= index && index <= 15) || (pieceColor === Piece.White && 48 <= index && index <= 55) ? 2 : 1

    let legalMoves: number[] = []
    const threats: number[] = []
    let checkSquares: number[] = []

    const { pinIndex, legalPinnedSlideMoves } = checkForPin(board, threatsOnBoard, friendlyKingLocation, index)

    let legalOffsets = LEGAL_OFFSETS[pieceType]
    if (isPawn) {
      // handle pawn color directionality move restrictions (pawns can't move backwards)
      legalOffsets = legalOffsets.filter(offset => {
        if (pieceColor === Piece.Black) return offset > 0 // Black: only allow moving "down" vertically (south) on board
        return offset < 0 // White: only allow moving "up" vertically (north) on board
      })

      // handle diagonal pawn capture (include en passant)
      const captureOffsets = pieceColor === Piece.White ? [-9, -7] : [7, 9]
      for (const captureOffset of captureOffsets) {
        const move = index + captureOffset
        const isEnPassantCapture = move === enPassantSquare
        const enPassantPawnIndex = index + (captureOffset === 9 || captureOffset === -7 ? 1 : -1)
        const pieceAtTarget = board[isEnPassantCapture ? enPassantPawnIndex : move]

        let canCaptureEnPassant = false
        if (isEnPassantCapture && getPieceType(pieceAtTarget) === Piece.Pawn && getPieceColor(pieceAtTarget) !== pieceColor) {
          // handle en passant pinned scenario
          const enPassantBoard = board.slice()
          enPassantBoard[enPassantPawnIndex] = 0
          const { isPinned } = checkForPin(enPassantBoard, [], friendlyKingLocation, index, true)
          canCaptureEnPassant = !isPinned
        }

        if ((pieceAtTarget && !isEnPassantCapture && !isFriendlyPieceAtTarget(pieceAtTarget, pieceColor)) || canCaptureEnPassant) legalOffsets.push(captureOffset)
        if (NUM_SQUARES_TO_EDGE[index][captureOffset]) threats.push(move)
      }
    }

    for (const offset of legalOffsets) {
      const numSquaresToEdge = NUM_SQUARES_TO_EDGE[index][offset]
      const lineOfCheckOnEnemyKing = []

      // Pawn, Bishop, Rook, Queen
      if (canSlide) {
        let xRayKing = false  // continue slide loop but don't add to legal moves; only add to threats to threaten through king square
        for (let i = 1; i <= Math.min(numSquaresToEdge, maxPawnSquares); i++) {
          const move = index + (offset * i)
          const pieceAtTarget = board[move]
          if (pieceType !== Piece.Pawn) threats.push(move)
          // console.log({ move, offset, index, squaresToEdge: numSquaresToEdge })
          if (pieceAtTarget) {
            if (!xRayKing && !isFriendlyPieceAtTarget(pieceAtTarget, pieceColor) && !(isPawn && Math.abs(offset) === 8)) {
              legalMoves.push(move)
              // console.log(move, enemyKingLocation)
              if (move === enemyKingLocation) checkSquares = lineOfCheckOnEnemyKing
            }

            if (!isFriendlyPieceAtTarget(pieceAtTarget, pieceColor) && getPieceType(pieceAtTarget) === Piece.King) {
              xRayKing = true
              continue;
            } else break;
          }
          if (!xRayKing) {
            legalMoves.push(move)
            lineOfCheckOnEnemyKing.push(move)
          }
        }
      }
      
      // King, Knight
      else if (numSquaresToEdge || pieceType === Piece.Knight) {  // not on an edge
        const move = index + offset

        // Prevent knight from jumping off board
        if (pieceType === Piece.Knight && (isLightSquare(index) === isLightSquare(move) || move < 0 || move > 63)) continue;

        threats.push(move)

        // Prevent king from moving into check
        if (pieceType === Piece.King && threatsOnBoard[move]) continue;

        const pieceAtTarget = board[move]
        if (pieceAtTarget && isFriendlyPieceAtTarget(pieceAtTarget, pieceColor)) continue;
        legalMoves.push(move)
      }
    }

    if (threats.includes(enemyKingLocation)) checkSquares.push(index)

    // TODO: CAN CASTLE OUT OF CHECK
    const checkCanCastleAtOffset = (castleOffset: number) => {
      const castleSquare = index + castleOffset
      if (!rookMoved()[castleSquare]) {
        const kingStepDirection = castleOffset < 0 ? -1 : 1
        let canCastle = true
        for (let offset = kingStepDirection; offset !== castleOffset; offset += kingStepDirection) {
          // console.log({ offset, castleOffset, kingStepDirection })
          const pieceAtTarget = board[index + offset]
          if (pieceAtTarget || threatsOnBoard[index + offset]) {
            canCastle = false
            break
          }
        }
        if (canCastle) legalMoves.push(index + (kingStepDirection * 2))
      }
    }

    // castling
    if (pieceType === Piece.King && !kingMoved()[pieceColor]) {
      checkCanCastleAtOffset(-4)
      checkCanCastleAtOffset(3)
    }

    // if in check, legal move must resolve check
    if (linesOfCheck.length && pieceType !== Piece.King) {
      // console.log(linesOfCheck)
      // if king is checked by more than one piece simultaneously; king must move, because no other piece can block
      if (linesOfCheck.length > 1) legalMoves = []
      else legalMoves = legalMoves.filter(move => linesOfCheck[0].includes(move)) // directly access index 0 because we know there is exactly 1 element in array
    }

    if (checkSquares.length) checkSquares.push(index)

    return { moves: pinIndex ? (canSlide ? legalMoves.filter(move => legalPinnedSlideMoves.includes(move)) : []) : legalMoves, threats, checkSquares }
  }

  const isLegalMove = (prevIndex: number, newIndex: number): boolean => {
    return legalMoves()[colorToMove()][prevIndex].includes(newIndex)
  }

  const calculateLegalMoves = (b: number[] = board(), properties: { colorToMove: Piece, kingLocation: { [key: number]: number }, lineOfCheckSquares: { [key: number]: number[][] }, enPassantSquare?: number }): { moves: { [key: number]: number[][] }, threats: { [key: number]: boolean[] }, isCheckmate: boolean } => {
    const { colorToMove, kingLocation, lineOfCheckSquares, enPassantSquare } = properties
    const playerColor = colorToMove
    const enemyColor = getOppositeColor(playerColor)
    const legalMovesOnBoard: { [key: number]: number[][] } = { [playerColor]: Array(64).fill([]), [enemyColor]: Array(64).fill([])}
    const attackedSquares: { [key: number]: boolean[] } = { [playerColor]: Array(64).fill(false), [enemyColor]: Array(64).fill(false) }
    const piecesOnBoard: { [key: number]: number[][] } = { [playerColor]: [], [enemyColor]: [] }
    b.forEach((piece, index) => {
      if (piece > 0) piecesOnBoard[getPieceColor(piece)].push([piece, index])
    })

    const linesOfCheck: number[][] = []

    // Find all squares that enemy color threatens
    piecesOnBoard[enemyColor].forEach(([piece, index]) => {
      const pieceType = getPieceType(piece)
      const { threats, checkSquares } = getLegalMovesAndThreatsForPiece(b, Array(64).fill(false), lineOfCheckSquares[enemyColor], kingLocation[enemyColor], kingLocation[playerColor], index, piece, pieceType, enPassantSquare)
      threats.forEach(threatIndex => attackedSquares[enemyColor][threatIndex] = true)
      if (checkSquares.length) {
        // console.log('hit', checkSquares)
        linesOfCheck.push(checkSquares)
      }
    })
    
    setLineOfCheckSquares(prev => ({ ...prev, [enemyColor]: linesOfCheck}))
    setHighlightedLinesOfCheckSquares(Array(64).fill(false))
    linesOfCheck.flat().forEach(index => setHighlightedLinesOfCheckSquares(squares => {
      squares[index] = true
      return [...squares]
    }))

    // Find all legal moves for player color
    const numMoves = piecesOnBoard[playerColor].reduce((total, [piece, index]) => {
      const pieceType = getPieceType(piece)
      const { moves, threats, checkSquares } = getLegalMovesAndThreatsForPiece(b, attackedSquares[enemyColor], linesOfCheck, kingLocation[playerColor], kingLocation[enemyColor], index, piece, pieceType, enPassantSquare)
      legalMovesOnBoard[playerColor][index] = moves
      threats.forEach(threatIndex => attackedSquares[playerColor][threatIndex] = true)
      return total += moves.length
    }, 0)

    // console.log(`${numMoves} moves`)
    // console.table(attackedSquares[enemyColor])
    if (!numMoves) setCheckmate(true)
    return { moves: legalMovesOnBoard, threats: attackedSquares, isCheckmate: !numMoves }
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

  const resetBoard = () => {
    setBoard(() => {
      const b = Array(64).fill(0)
      b[0] = Piece.Rook | Piece.Black
      b[1] = Piece.Knight | Piece.Black
      b[2] = Piece.Bishop | Piece.Black
      b[3] = Piece.Queen | Piece.Black
      b[4] = Piece.King | Piece.Black
      b[5] = Piece.Bishop | Piece.Black
      b[6] = Piece.Knight | Piece.Black
      b[7] = Piece.Rook | Piece.Black
      for (let i = 8; i < 16; i++) b[i] = Piece.Pawn | Piece.Black
      for (let i = 48; i < 56; i++) b[i] = Piece.Pawn | Piece.White
      b[56] = Piece.Rook | Piece.White
      b[57] = Piece.Knight | Piece.White
      b[58] = Piece.Bishop | Piece.White
      b[59] = Piece.Queen | Piece.White
      b[60] = Piece.King | Piece.White
      b[61] = Piece.Bishop | Piece.White
      b[62] = Piece.Knight | Piece.White
      b[63] = Piece.Rook | Piece.White
  
      return b
    })
  
    const getKingLocation = (color: Piece): number => board().findIndex(piece => getPieceType(piece) === Piece.King && getPieceColor(piece) === color)
    setKingLocation(({ [Piece.Black]: getKingLocation(Piece.Black), [Piece.White]: getKingLocation(Piece.White) }))
  
    updateBoard()
  
    updateLegalMovesAndThreats()
  }

  const updateLegalMovesAndThreats = () => {
    const { moves, threats } = calculateLegalMoves(board(), { colorToMove: colorToMove(), kingLocation: kingLocation(), lineOfCheckSquares: lineOfCheckSquares(), enPassantSquare: enPassantSquare() })
    setLegalMoves(moves)
    // console.log(threats)
    setThreatenedSquares(threats)

    if (previewOnly) {
      let depth = 0;
      const loop = setInterval(() => {
        if (depth++ < 6) makeRandomMove()
        else {
          clearInterval(loop)
          setTimeout(resetBoard, 2000)
        }
      }, 600);
    }
  }

  if (!board()?.filter(v => v)?.length) resetBoard()

  return (<>
    <GameBoard
      BOARD_SIZE_PX={BOARD_SIZE_PX}
      NUM_BOARD_SQUARES={64}
      previewOnly={previewOnly ?? false}
      updateBoard={updateBoard}
      board={board}
      colorToMove={colorToMove}
      playerColor={colorToMove} // TODO: ❎ DO NOT FORGET TO CHANGE THIS OR YOU WILL HATE YOURSELF LATER❗❗❗
      gameMode={gameMode}
      legalMoves={legalMoves}
      isLegalMove={isLegalMove}
      winner={winner}
      gameInProgress={gameInProgress}
      setGameInProgress={setGameInProgress}
      movePiece={movePiece}
      useAltRookSvg={false}
      boardTheme={{
        backgroundFill: darkSquareFill(),
        textureFill: darkSquareFill(),
        specialTileFill: lightSquareFill(),
        checkerPatternFill: lightSquareFill(),
        checkerPatternOpacity: 1,
      }}
    />
    {!previewOnly && <div class={styles.sidebar}>
      {checkmate() && <div>Checkmate!</div>}
      {isDraw() && <div>Draw!</div>}
      {!checkmate() && !isDraw() && <>
        <div>{whiteToMove() ? 'White' : 'Black'} to move</div>
        <div>{inCheck() ? 'In Check!' : ''}</div>
        <div>Available Moves: {legalMoves()[colorToMove()].reduce((nMoves, move) => nMoves + (move?.length ?? 0), 0)}</div>
      </>}
      {/* @ts-ignore */}
      Light Squares: <input type="color" value={lightSquareFill()} onChange={(e) => setLightSquareFill(e.target.value)} />
      {/* @ts-ignore */}
      Dark Squares: <input type="color" value={darkSquareFill()} onChange={(e) => setDarkSquareFill(e.target.value)} />
    </div>}
    </>
  );
};

export default Chess;
