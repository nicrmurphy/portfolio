import { Component, For, JSX, createSignal } from "solid-js";

import styles from "./App.module.css";

const TW = 45 // TILE_WIDTH -> don't change this unless all pieces SVG updated

const BW = 11 // BOARD_WIDTH
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

const WhiteKing = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <path d="M 22.5,11.63 L 22.5,6" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
  <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
  <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" style="fill:#ffffff; stroke:#000000; stroke-linecap:butt; stroke-linejoin:miter;" />
  <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z " style="fill:#ffffff; stroke:#000000;" />
  <path d="M 11.5,30 C 17,27 27,27 32.5,30" style="fill:none; stroke:#000000;" />
  <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" style="fill:none; stroke:#000000;" />
  <path d="M 11.5,37 C 17,34 27,34 32.5,37" style="fill:none; stroke:#000000;" />
</>, pos)

const WhitePawn = (index: number, pos?: MousePosition) => PiecePlacer(index, <path
  d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z "
  style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"
/>, pos)

const WhiteKnight = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#ffffff; stroke:#000000;" />
  <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#ffffff; stroke:#000000;" />
  <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#000000; stroke:#000000;" />
  <path d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#000000; stroke:#000000;" />
</>, pos)

const WhiteBishop = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <g style="fill:#ffffff; stroke:#000000; stroke-linecap:butt;"> 
    <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
    <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
    <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
  </g>
  <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
</>, pos)

const WhiteRook = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <g style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
    <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" />
    <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" />
    <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" style="stroke-linecap:butt;" />
    <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
    <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" style="stroke-linecap:butt; stroke-linejoin:miter;" />
    <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
    <path d="M 11,14 L 34,14" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
  </g>
</>, pos)

const WhiteQueen = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <g style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
    <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(-1,-1)" />
    <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(15.5,-5.5)" />
    <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(32,-1)" />
    <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(7,-4.5)" />
    <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(24,-4)" />
    <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,11 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 9,26 z " style="stroke-linecap:butt;" />
    <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z " style="stroke-linecap:butt;" />
    <path d="M 11.5,30 C 15,29 30,29 33.5,30" style="fill:none;" />
    <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" style="fill:none;" />
  </g>
</>, pos)

const BlackKing = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <path d="M 22.5,11.63 L 22.5,6" style="fill:none; stroke:#000000; stroke-linejoin:miter;" id="path6570"/>
  <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" style="fill:#000000;fill-opacity:1; stroke-linecap:butt; stroke-linejoin:miter;"/>
  <path d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37" style="fill:#000000; stroke:#000000;"/>
  <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;"/>
  <path d="M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.5,26.6 L 22.5,24.5 C 20,18 10.85,14 6.97,19.85 C 4.5,25.5 13,29.5 13,29.5" style="fill:none; stroke:#ffffff;"/>
  <path d="M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37" style="fill:none; stroke:#ffffff;"/>
</>, pos)

const BlackPawn = (index: number, pos?: MousePosition) => PiecePlacer(index, <path
  d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z "
  style="opacity:1; fill:#000000; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"
/>, pos)

const BlackKnight = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#000000; stroke:#000000;" />
  <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#000000; stroke:#000000;" />
  <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#ffffff; stroke:#ffffff;" />
  <path d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#ffffff; stroke:#ffffff;" />
  <path d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z " style="fill:#ffffff; stroke:none;" />
</>, pos)

const BlackBishop = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <g style="fill:#000000; stroke:#000000; stroke-linecap:butt;"> 
    <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
    <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
    <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
  </g>
  <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="fill:none; stroke:#ffffff; stroke-linejoin:miter;" />
</>, pos)

const BlackRook = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <g style="opacity:1; fill:000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
    <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" />
    <path d="M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z " style="stroke-linecap:butt;" />
    <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" />
    <path d="M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z " style="stroke-linecap:butt;stroke-linejoin:miter;" />
    <path d="M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z " style="stroke-linecap:butt;" />
    <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z " style="stroke-linecap:butt;" />
    <path d="M 12,35.5 L 33,35.5 L 33,35.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
    <path d="M 13,31.5 L 32,31.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
    <path d="M 14,29.5 L 31,29.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
    <path d="M 14,16.5 L 31,16.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
    <path d="M 11,14 L 34,14" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
  </g>
</>, pos)

const BlackQueen = (index: number, pos?: MousePosition) => PiecePlacer(index, <>
  <g style="opacity:1; fill:000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
    <g style="fill:#000000; stroke:none;">
      <circle cx="6"    cy="12" r="2.75" />
      <circle cx="14"   cy="9"  r="2.75" />
      <circle cx="22.5" cy="8"  r="2.75" />
      <circle cx="31"   cy="9"  r="2.75" />
      <circle cx="39"   cy="12" r="2.75" />
    </g>
    <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" style="stroke-linecap:butt; stroke:#000000;" />
    <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" style="stroke-linecap:butt;" />
    <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" style="fill:none; stroke:#000000; stroke-linecap:butt;" />
    <path d="M 11,29 A 35,35 1 0 1 34,29" style="fill:none; stroke:#ffffff;" />
    <path d="M 12.5,31.5 L 32.5,31.5" style="fill:none; stroke:#ffffff;" />
    <path d="M 11.5,34.5 A 35,35 1 0 0 33.5,34.5" style="fill:none; stroke:#ffffff;" />
    <path d="M 10.5,37.5 A 35,35 1 0 0 34.5,37.5" style="fill:none; stroke:#ffffff;" />
  </g>
</>, pos)
//#endregion svg pieces

const getPieceType = (piece: Piece): Piece => piece & 7
const getPieceColor = (piece: Piece): Piece => piece & 24

const pieceIsWhite = (piece: Piece): boolean => getPieceColor(piece) === Piece.White
const pieceIsBlack = (piece: Piece): boolean => getPieceColor(piece) === Piece.Black

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

const Chess: Component<{ BOARD_SIZE_PX: number, previewOnly: boolean }> = ({ BOARD_SIZE_PX, previewOnly }) => {  
  const DRAG_SCALE_FACTOR = BOARD_SIZE_PX / (BW * TW) // idk why this is needed, but without it, dragging pieces doesn't follow mouse 1:1

  const [board, setBoard] = createSignal<number[]>(Array(NUM_BOARD_SQUARES).fill(0))
  const [highlightedSquares, setHighlightedSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false))
  const [exitFortSquares, setExitFortSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false))
  const [defenderSquares, setDefenderSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false))
  const [kingSquares, setKingSquares] = createSignal<boolean[]>(Array(NUM_BOARD_SQUARES).fill(false))
  const [throneIndex, setThroneIndex] = createSignal<number>(60)
  const [dragEnabled, setDragEnabled] = createSignal<boolean>(false)
  const [draggedIndex, setDraggedIndex] = createSignal<number>(-1)
  const [mousePosition, setMousePosition] = createSignal<MousePosition>({ x: 0, y: 0 })
  const [colorToMove, setColorToMove] = createSignal<Piece>(Piece.Any)
  const [kingLocation, setKingLocation] = createSignal<{ [key: number]: number }>({ [Piece.Black]: 4, [Piece.White]: 60 })
  const [legalMoves, setLegalMoves] = createSignal<{ [key: number]: number[][] }>({ [Piece.White]: Array(NUM_BOARD_SQUARES).fill([]), [Piece.Black]: Array(NUM_BOARD_SQUARES).fill([]) })
  const [kingMoved, setKingMoved] = createSignal<{ [key: number]: boolean }>({ [Piece.White]: false, [Piece.Black]: false })
  const [winner, setWinner] = createSignal<Win | null>(null)
  const [moveStack, setMoveStack] = createSignal<string[]>([])
  const [boardPositions, setBoardPositions] = createSignal<{ [key: string]: number}>({})
  const [cursorStyle, setCursorStyle] = createSignal<'Default' | 'Grab' | 'Grabbing'>('Default')
  const [fenString, setFenString] = createSignal<string>('')
  const [importedFenString, setImportedFenString] = createSignal<string>('')
  const [gameMode, setGameMove] = createSignal<Mode>(SELECTED_GAME_MODE)
  const [gameRules, setGameRules] = createSignal({
    strongKing: true,
    exitFortWin: true,
    shieldWallCapture: true,
    defenderLossOnRepetition: true
  })

  const [lightSquareFill, setLightSquareFill] = createSignal<string>('#f0d9b5')
  const [darkSquareFill, setDarkSquareFill] = createSignal<string>('#f7e2bf')
  const [kingSquareFill, setKingSquareFill] = createSignal<string>('#ffffff')

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

  const getKingLocation = (): number => kingLocation()[Piece.White]

  const getBoardIndexFromMousePosition = (pos: MousePosition): number => {
    const x = pos.x
    const y = pos.y
  
    const TILE_SIZE_PX = BOARD_SIZE_PX / BW
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
    const index = getBoardIndexFromMousePosition({ x: event.offsetX, y: event.offsetY })
    const piece = board()[index]
    if (isColorToMove(piece)) {
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
      const boardIndex = getBoardIndexFromMousePosition({ x: event.offsetX, y: event.offsetY })
      const pieceAtIndex = board()[boardIndex]
      setCursorStyle(isColorToMove(pieceAtIndex) ? 'Grab' : 'Default')
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
    }
  }

  const onMouseUp = (event: MouseEvent) => {
    setHighlightedSquares([])
    updateBoard()
    if (!dragEnabled()) return
    setDragEnabled(false)

    // Legal move logic here
    const index = getBoardIndexFromMousePosition({ x: mousePosition().x, y: mousePosition().y })
    const piece = board()[draggedIndex()]
    const legalMove = gameMode() === Mode.Setup || isLegalMove(draggedIndex(), index)

    setCursorStyle(isColorToMove(piece) ? 'Grab' : 'Default')
    
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

  return (
    <>
      <div class={`${styles.BoardWrapper} ${previewOnly ? styles.PreviewBoard : ''} ${styles[cursorStyle()] ?? ''}`}>
        <svg height={BOARD_SIZE_PX} width={BOARD_SIZE_PX} viewBox={`0 0 ${BW * TW} ${BW * TW}`} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} oncontextmenu={(e) => e.preventDefault()}>
          {/* Chessboard alternating color pattern */}
          <rect width="100%" height="100%" />
          <g>
            <path fill={lightSquareFill()} d="m0 256v-256h512v512h-512v-256z" />
            <path fill={darkSquareFill()} fill-opacity=".25" d="m6.8143 501.4c1.6784-123.55 12.837-247.16 3.7917-370.67-1.6764-43.565-3.3106-86.946-3.7207-130.54 11.824 34.893 4.1237 72.066 8.0547 108.01.60468 95.044 8.9642 190.32-.78216 285.16-2.341 36.731-3.8412 73.527-3.8271 110.34-2.6654 8.9807-5.2046 1.9548-3.5165-2.2947zm35.125-25.15c-3.179-125.7-9.012-251.66.349-377.23.092-33.006-1.399-66.074 1.236-99.02.40029 115.88 3.2765 218.66-2.8224 328.56 6.6409 65.97.29866 101.84 8.3481 155.6 1.1935 22.219-12.517 19.49-7.0943-.57906l.05501-3.6684zm10.498 32.5c-4.728-177.23-3.952-333.12-.185-496.2 14.787-3.9378 1.0795 33.058 5.2627 44.161-12.609 156.39 5.7067 302.75 1.7644 447.87-.93758 2.6058-3.7226 5.5428-6.842 4.1718zm12.043-6.7502c4.606-39.39 2.294-79.04-2.14-118.29-6.205-89.43-6.656-179.17-1.85-268.67 1.466-34.208-.025-69.561 5.559-102.96 5.268 18.734-.984 41.842-.843 62.327-1.55 24.817-2.751 49.713-1.544 74.573 5.35-47.15 1.795-94.968 9.52-141.9-1.506 67.218-8.65 134.23-8.433 201.53-1.3387 73.723 4.0988 147.37 12.6 220.53 1.2796 21.885.49109 60.196-2.4882 71.842-1.965-35.12 3.498-70.53-3.531-105.35-13.278-364.96-12.07-165.81.341 62.74-.43019 10.898 2.7794 45.058-7.1908 43.625zm-5.876-243.73c-3.0922 1.8163 3.2473 2.117 0 0zm33.89 251.19c4.425-77.77 2.776-155.73 6.418-233.54-22.893-60.04-14.117-125.35-10.715-187.84 8.721-22.85-8.336-74.557 12.203-79.139 4.531 40.003-7.3484 81.614 7.4198 120.54 11.974 25.458 13.775 53.397 12.792 81.153-4.8741 56.428 3.6921 127.48 11.28 190.78 3.1459 28.045 2.5397 56.222 5.1625 84.269 1.124 13.766-11.902 25.17-9.0542 4.0864-1.9295-29.52 2.8974-59.823-3.0796-88.867-20.623-2.2293-10.912 36.585-16.33 51.892-3.7655 18.858-.7261 44.373-12.081 58.666l-2.2887-.70552-1.7243-1.2879zm12.916-6.96c6.58-17.962.54699-66.886 16.939-66.208 3.2999 18.631 4.5318 53.828-.78751 62.681-1.3409-11.773 8.7762-49.667-7.2466-43.942-2.1392 14.22.63409 32.618-8.9046 47.469zm32.202 2.75c6.9793-76.491-4.4534-152.84-12.463-228.75-3.411-43.114-3.244-86.448-.95965-129.62-1.275-16.683-33.837-41.094-3.3051-41.474 9.5105-23.074-1.6144-48.772 1.1859-72.994 7.7925-38.624-8.461 33.789 9.9914 23.083.96897-11.832 6.4405-55.829 3.7019-22.398-11.982 108.2-17.345 218.41 2.5089 326.03 3.6582 39.01 3.6692 78.232 6.142 117.32-7.8233 7.4463 1.5081 22.79-6.8021 28.809zm5.6312 1.25c7.9157-25.138.16479-52.147 10.028-76.391 3.094-13.963-8.7217-54.714-1.6937-54.075 6.2425 42.613 4.2618 86.333-4.5438 128.25-.46325 1.9599-2.2665 1.792-3.7907 2.2123zm10.096 2.75c7.6755-26.102 4.4562-53.859 11.365-79.603-4.8938-88.305-24.949-176.65-23.29-259.32 3.2151-29.474-8.6239-60.189 4.2509-88.622 2.9457-22.438-4.532-50.67 5.37-68.464 15.181-25.055 3.8996 23.093 3.2487 32.228-8.4183 70.816-1.8641 117.84-3.3694 213.6 17.979 65.9 21.922 133.4 18.675 196.44-2.5582 12.532-4.7868 57.899-16.251 53.737zm38.261-6.5c5.8752-82.585 8.265-165.84-1.4217-248.24-2.9019 21.359-18.936 19.28-16.385-1.507-8.5391-44.68-17.351-91.262-4.4357-136.07 6.5386-29.721 16.617-58.917 18.188-89.525-4.202 8.26-14.673 46.27-8.3137 18.053-3.4416-11.568 15.979-52.29 14.283-21.81-2.1155 9.3007-9.4872 45.923-1.9641 39.745 2.6165-19.805-.73165-69.771 32.023-55.181 3.1544 35.664 4.5946 71.495 13.838 106.2-.32125 24.37 2.1102 57.667-12.691 76.003-8.2409-17.686 1.0899-45.603-13.005-58.379-18.686 32.417-4.312 49.207-7.1767 106.3-14.467 95.279 24.029 177.94 6.0477 266.79-3.9249-19.871-1.7575 10.484-6.4627-8.6764-3.1509-27.773 4.6472-55.988-4.6351-83.321-1.9273 29.802 7.5691 61.39-3.2442 90.315-5.7016 7.7385-4.7815 6.9607-4.645-.70374zm2.0057 2.5208c-3.0923 1.8163 3.2473 2.117 0 0zm7.0304-183.36c.30338-40.418-4.5346-92.033-7.6981-138.11-6.3417 8.397-7.3593 49.613-16.737 20.717-13.08-32.332 1.7725-66.349 11.635-97.324 4.8771-12.577-7.252-23.89-5.991-5.1611-8.0948 33.416-16.818 68.093-10.831 102.62-6.0313 21.587 20.958 33.752 21.243 11.959 6.5585 21.466 2.7681 45.281 6.0126 67.675 1.3275 25.592 1.9898 51.242 1.0273 76.86 1.5886-13.023.76792-26.166 1.3391-39.24zm-19.289-90.452c-2.8098-7.622 3.8112 4.1307 0 0zm33.474 271.04c-7.456-11.866 13.136-37.835 10.308-11.258 1.7931 7.5676-5.302 32.212-10.308 11.258zm13.16 8.25c3.3281-36.091-7.904-71.1-14.102-106.09-6.0956-74.271-10.707-149.43.12793-223.51 6.6915 5.1061 5.0522 49.114 14.632 29.026-1.2831-19.782 22.345-22.186 14.812.35181 5.5978 87.307 3.014 174.87 7.0056 262.24-6.4502-87.502-2.2421-175.48-10.546-262.88-14.248-6.6918-9.4765 44.191-22.06 17.023-12.612 38.854-6.7263 80.396-6.6181 120.46 3.4416 53.39 20.757 105.77 17.423 159.51zm25.566-26.5c-4.2194-65.566-5.7766-202.21-5.0257-303.65 7.02-59.598 10.791-119.88 5.7237-179.8 12.267 8.1926 2.0596 56.021 5.3445 21.018-1.4762-17.208 3.8795-18.466 2.5421-.81751-1.1683 61.606 2.0759 123.33-3.9253 184.78-2.0509 26.634 3.3331 52.874-1.1935 79.44-1.2598 73.539 5.137 147.02 4.4523 220.58-11.967 12.023-5.9967-16.65-7.918-21.552zm6.0394-8c-1.7306-14.482.0119-33.635-3.3208-45.221 1.0073 15.061-1.7861 30.643 3.3208 45.221zm13.299 33c-4.4426-78.11-1.9445-158.25-.48398-254.51 5.3151-69.448 11.485-139.38 2.459-208.81-2.8165-11.423 1.2812-58.307 3.8964-26.381 2.3967 39.385 4.0627 78.844 4.9146 118.3.17638 24.683-.19834 49.364-.50872 74.044 12.41-26.934 3.5229-57.918 6.1377-86.494-2.9607-34.912-3.5827-69.951-7.4495-104.7 9.3203-28.143 11.246 17.257 11.119 27.088 9.21 167.22-13.286 310.48-4.2743 461.46-22.072-95.888.31655-202.1-1.8334-292.62-13.288 34.965-3.817 66.052-11.49 122.71-1.1376 40.066-.3334 80.212 3.1391 120.15-11.518 17.904 13.867 33.03-5.6257 49.775zm41.186.5c-1.8814-42.287-12.358-83.945-9.8197-126.47-2.5729-122.29 9.1637-244.28 9.6891-366.53 9.7864-13.416 1.6916 30.528 2.4289 38.892-2.361 105.02-12.197 233.98-7.8488 351.65-3.2662 29.054 14.115 48.168 10.692 76.789-.77837 8.4086 7.3991 22.393-5.1417 25.675zm10.415-2.5c5.2934-44.249-4.9632-88.016-12.162-131.32-5.7934-58.265-1.1666-116.81.20906-175.17 6.1741 32.721-.10049 66.239 2.103 99.317-.12483 38.867 6.9953 77.176 13.135 115.32 2.3788 30.908 2.1949 62.067-1.4712 92.868l-1.1971.11927zm7.8837 3.2304c2.904-62.973 1.8064-126.6-11.188-188.44-5.0673-90.85-3.6527-182.2 7.7057-272.55-.71551-11.295-2.5077-49.041 14.404-37.913-1.2484 44.103-10.981 87.366-15.517 131.11-4.1094 150.87-2.3505 145.67 9.2654 191.47 2.5039 36.091 5.8708 72.559 5.9104 108.55-1.4848 22.941 7.7697 53.416-9.7028 66.913l-.31133.83993-.56598.0324zm15.99-68.98c1.5819-122.52-16.229-245.44.0659-367.56.01-16.439-1.273-60.105 3.9933-59.1-4.6046 111.34-10.617 222.94-2.464 334.26 1.8394 53.9 3.2333 107.83 2.5706 161.77-11.068-21.861-.32865-46.404-4.1658-69.376zm37.268 65.75c-.085-36.525 2.2162-73.034 6.2906-109.32 29.176 11.87 3.9328 49.079 9.5134 72.245-.45821 10.809 4.9228 45.08-15.804 37.079zm22.712 0c2.2459-12.724 5.0989-55.084 5.0672-21.311-.15453 7.3299-1.2016 14.93-5.0672 21.311zm31.552-3c-1.8686-128.49 20.836-257.1 4.0844-385.36-6.439-38.43-5.3879-77.314-3.8693-116.09 10.914 46.484 1.1245 96.792 9.1032 110.27 8.134 103 2.6237 206.36 1.1352 309.49-5.4687 27.125-2.3199 63.442-9.7756 85.429zm7.482-5c4.1164-33.418 14.722-66.42 8.0438-100.28-1.8106-81.171.0183-162.36.34586-243.53 1.3954 110.76 1.366 221.84 2.384 332.42.1606 7.1573-13.246 33.002-10.774 11.398zm8.2252-125.98c-3.0923 1.8163 3.2473 2.117 0 0zm16.608 115.51c5.3442-7.9098-5.2672-25.516-3.9657-6.6366 4.0483-67.882 11.287-136.44-.43743-203.97-3.112-59.168 2.573-118.39 1.412-177.65 2.2876-31.776-4.1165-66.116 4.9625-96.33 24.308-17.71 47.477 13.077 33.68 35.054 5.356 142.29 3.7322 284.71 2.4849 427.07 4.0139 20.134-6.7598 47.755-28.903 44.544-8.5136-3.5327-11.953-13.841-9.2331-22.087zm24.14-258.78c2.9765-63.817.90931-127.79-4.3387-191.44-12.492 24.572-2.4148 54.173-7.0552 80.695.33707 39.524 4.0331 78.963 9.7686 118.05.98038-2.3605 1.4728-4.7623 1.6253-7.3094zm-4.2831-9.4167c-1.3023-5.882 2.2803 1.8534 0 0zm17.525-96.312c-3.0923 1.8163 3.2473 2.117 0 0zm0-4c-3.0923 1.8163 3.2473 2.117 0 0zm-189.53 385.31c-1.3023-5.882 2.2803 1.8534 0 0zm-106.31-16.349c-5.1998-10.991 5.1196-.31473 0 0zm155.93-15.42c-13.027 2.8601 5.5943-20.978-9.077-12.262-2.2304-98.242-7.7917-196.49-6.4866-294.77 1.0834-25.638 4.3234-51.529 3.7146-76.958 15.618-19.028 10.098 23.307 13.74 34.129 1.3681 25.262 5.4087 50.115 11.002 74.683 14.127 57.126 19.2-58.224 22.851-77.716 4.8688-19.869-1.337-48.594 13.329-62.845 8.0537 21.594 6.4441 46.133 11.204 68.822 9.6672 76.18 12.966 154.72-2.3125 230.13-14.271-28.485-14.479-63.401-23.326-94.363 6.2231 20.138-10.51-17.431-10.756 7.9493-5.6101 40.494-10.868 81.078-16.488 121.6-3.5238 27.064-4.4953 54.742-6.3843 81.686l-1.0094-.0885zm-5.0811-86.538c-3.0923 1.8163 3.2473 2.117 0 0zm12.965-136.88c-4.8777-32.036-7.7602-64.371-13.83-96.223-10.144 32.581-4.5388 67.52-4.4916 101.09 1.4267 28.952.37404 58.122 4.916 86.845 20.886 13.332 14.012-83.322 13.406-91.714zm50.495 50.153c10.254-66.482 3.9743-134.29-8.1326-200.08-20.221 27.952-8.8552 63.891-14.174 95.514 1.8651 35.652 6.0387 72.245 22.306 104.56zm-276.08 172.52c-1.5635-7.663 3.6079 2.9801 0 0zm192.62-13.81c1.2852-13.411 1.8206 6.8683 0 0zm88.715-23.759c-2.505-14.372 4.3089-18.897 2.173-.72406.35584 12.562-3.8667 21.342-2.173.72406zm-20.449 16.318c-4.7256-12.203 2.302-39.546 1.206-10.868.047 3.645-.0345 7.3709-1.206 10.868zm-294.89-7.25c-1.2572-6.0804 3.19 2.8566 0 0zm161.19-5.06c-.11365-7.6687 1.4032 4.1773 0 0zm.0774-7.5c.75595-8.1264.75595 8.1264 0 0zm-145.19-1.4167c-1.3023-5.882 2.2803 1.8534 0 0zm145.15-6.58c.54961-6.8903.54961 6.8903 0 0zm-272.96-34.5c9.3987-119.26-1.1861-102.54 1.6233-3.73-.3118 8.81-2.0793 21.54-1.6233 3.73zm225.32 7.8732c.16656-18.87-12.146-67.601.49774-69.034 5.3888 22.42 10.012 44.973-.49774 69.034zm-187.94-17.12c-2.7286-24.204 3.8813-10.842.79153 5.4281zm4.015-23.917c-6.8314-4.1098 2.2762-6.6657 0 0zm94.333-15.22c-7.9961-51.204-7.7616-103.31-9.0726-155.01-.85321-54.347-4.8172-66.827 9.5815-172.57 6.2312 12.661-7.253 51.423-5.6843 73.579-2.4418 54.473-1.3542 109.1-.44951 163.58 13.904 26.911-19.879 73.65 5.625 90.411zm-101-66.78c-27.333 158.3-13.667 79.149 0 0zm148.39-14.75c-7.0815-5.5382 2.7399-7.2581 0 0zm92.685-30.001c-1.3023-5.882 2.2803 1.8534 0 0zm1-15c-1.3023-5.882 2.2803 1.8534 0 0zm-47-5c-1.3023-5.882 2.2803 1.8534 0 0zm200.92-14.14c3.8083-3.6006-.75385 6.9169 0 0zm-123.38-32.44c1.0242-51.604 3.1997-103.32 10.598-154.45 8.0933 27.809-7.0032 55.371-5.5553 83.467-1.8771 28.732-1.0874 57.663-5.1215 86.234-.3779-5.0811.11282-10.166.079-15.25zm197.45-8.4167c-1.3023-5.882 2.2803 1.8534 0 0zm-56.426-1.3354c-1.6491-38.762-9.5992-59.871-7.6601-142.93 13.432 3.7668 2.7812 39.721 6.6732 55.558.92313 29.101 4.3366 58.306.98691 87.376zm-2.0491-93.977c-3.0923 1.8163 3.2473 2.117 0 0zm58.68 86.737c.75595-8.1264.75595 8.1264 0 0zm-296.8-9.1007c-3.2541-13.074 3.9031 4.9153 0 0zm29.53-1.81c-5.41-40.435-10.33-80.937-15.03-121.46 11.342 19.39 5.6354 46.11 9.6796 68.329-1.0296 13.468 13.386 28.933 13.794 6.0984 3.3325-19.533-3.662-59.538.103-66.735 1.5822 37.562 4.3534 75.935-5.255 112.73 2.504-9.7228-1.1806.9922-3.2917 1.039zm96.667-.75811c.68618-21.219 3.7803-67.731 6.1727-72.615-.55773 24.305-3.0488 48.52-6.1727 72.615zm-180.41-5.62c.63451-12.321 10.085-40.219 5.2536-11.541-.63637 4.2001-2.0014 8.5792-5.2536 11.541zm349.74-14.21c1.2808-8.5005 1.5294 9.7299 0 0zm-264.86-10.41c-2.9166-4.7183 5.5545 1.9185 0 0zm265.11-10.59c.28529-9.3558.9918 6.1152 0 0zm-400.25-6.451c-6.37-41.204 3.36-106.66 7.3-32.543-1.33 10.862-1.66 22.856-7.3 32.543zm278.58-13.271c.87-18.835-14.6-66.11 8.73-64.037 6.03 21.837-7.16 42.595-8.73 64.037zm33.494-.19446c-1.3023-5.882 2.2803 1.8534 0 0zm-193.43-5.084c2.0221-4.3555.78979 7.2532 0 0zm-111.56-13.917c-1.3023-5.882 2.2803 1.8534 0 0zm211-26c-1.3023-5.882 2.2803 1.8534 0 0z" />
          </g>
          <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }>{(y) => 
            <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>{(x) => <>
              {[0, 2, 4, 6, 8, 10].includes(x) && <rect fill="gray" fill-opacity="0.01" stroke="#787272" stroke-width=".25" stroke-opacity=".75" x={`${TW * (x + (y % 2))}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
              {highlightedSquares()[getBoardIndexFromRankFile(y, x)] && <rect fill="lightblue" opacity=".25" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
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

          {dragEnabled() && renderPiece(board()[draggedIndex()], draggedIndex(), { x: (mousePosition().x / DRAG_SCALE_FACTOR) - (TW / 2), y: (mousePosition().y / DRAG_SCALE_FACTOR) - (TW / 2) })}
        </svg>
      </div>
      {
        !previewOnly &&
        <div class={styles.sidebar}>
          <div class={styles.Row}>Game Mode Select:</div>
          <div class={styles.Row}><button>Local</button></div>
          <div class={styles.Row}><button>Online</button></div>
          <div class={styles.Row}><button>Against Computer</button></div>
          <div class={styles.Row}><button>Setup</button></div>
          <div class={styles.Row}>{winner() ? `${winner()?.winner === Piece.White ? 'Defenders' : 'Attackers'} win via ${winner()?.condition}!` : ''}</div>
          <div class={styles.Row}><button onClick={() => navigator.clipboard.writeText(fenString())}>Copy Game to Clipboard</button></div>
          <div class={styles.Row}>
            <button onClick={offerDraw}>Offer Draw</button>
            <button onClick={resign}>Resign</button>
          </div>
          {/* @ts-ignore */}
          <div class={styles.Row}><input type="text" value={importedFenString()} onChange={e => setImportedFenString(e.target.value)} /><button onClick={() => importGameFromFen(importedFenString())}>Import Game</button></div>
          {/* @ts-ignore */}
          <div class={styles.Row}>Light Squares: <input type="color" value={lightSquareFill()} onChange={(e) => setLightSquareFill(e.target.value)} /></div>
          {/* @ts-ignore */}
          <div class={styles.Row}>Dark Squares: <input type="color" value={darkSquareFill()} onChange={(e) => setDarkSquareFill(e.target.value)} /></div>
          {/* @ts-ignore */}
          <div class={styles.Row}>King Squares: <input type="color" value={kingSquareFill()} onChange={(e) => setKingSquareFill(e.target.value)} /></div>
        </div>
      }
    </>
  );
};

export default Chess;
