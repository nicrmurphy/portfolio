export enum Piece {
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

export enum Mode {
  Setup = 0,
  Local = 1,
  Online = 2,
  Computer = 3
}

export type MousePosition = {
  x: number,
  y: number
}

export class Move {
  prevIndex: number
  newIndex: number
  label: string
  fenString: string
  id: number
  piece?: Piece
  capturedIndexes?: number[]

  constructor(moveData: {
    prevIndex: number
    newIndex: number
    label: string
    fenString: string
    id: number
    piece?: Piece
    capturedIndexes?: number[]
  }) {
    this.prevIndex = moveData.prevIndex
    this.newIndex = moveData.newIndex
    this.label = moveData.label
    this.fenString = moveData.fenString
    this.piece = moveData.piece
    this.id = moveData.id
    this.capturedIndexes = moveData.capturedIndexes
  }
}

export enum WinCondition {
  Escape = 'Corner Escape',
  Fort = 'Exit Fort',
  Capture = 'King Capture',
  Moves = 'No Legal Moves',
  Surround = 'Surrounding All Defenders',
  Perpetual = 'Repeating Board Position Three Times',
  Resign = 'Resignation',
  Draw = 'Draw'
}

export type Winner = Piece.Black | Piece.White | null

export class Win {
  winner: Winner = null
  condition: WinCondition = WinCondition.Draw

  constructor(winner: Winner, condition: WinCondition) {
    this.winner = winner
    this.condition = condition
  }
}

export const ASCII_CHAR_A = 65  // ascii code for character 'A'