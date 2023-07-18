import { Component, For, JSX, createSignal } from "solid-js";

import styles from "./App.module.css";

const TW = 45 // TILE_WIDTH -> don't change this unless all pieces SVG updated

const ORTHOGONAL_OFFSETS = [-11, -1, 1, 11]

enum Piece {
  None = 0,
  King = 1,
  Pawn = 2,
  Knight = 3,
  Bishop = 4,
  Rook = 5,
  Queen = 6,

  White = 8,
  Black = 16
}

type MousePosition = {
  x: number,
  y: number
}

const isLightSquare = (index: number): boolean => (index + Math.floor(index / 11)) % 2 === 0 

// legal moves
const LEGAL_OFFSETS_KING = ORTHOGONAL_OFFSETS
const LEGAL_OFFSETS_PAWN = [-8, 8]
const LEGAL_OFFSETS_KNIGHT = [-17, -15, -10, -6, 6, 10, 15, 17]
const LEGAL_OFFSETS_BISHOP = [-7, -9, 7, 9]
const LEGAL_OFFSETS_ROOK = ORTHOGONAL_OFFSETS
const LEGAL_OFFSETS_QUEEN = [-9, -8, -7, -1, 1, 7, 8, 9]
const LEGAL_OFFSETS: { [key: number]: number[] } = {
  [Piece.King]: LEGAL_OFFSETS_KING,
  [Piece.Pawn]: LEGAL_OFFSETS_PAWN,
  [Piece.Knight]: LEGAL_OFFSETS_KNIGHT,
  [Piece.Bishop]: LEGAL_OFFSETS_BISHOP,
  [Piece.Rook]: LEGAL_OFFSETS_ROOK,
  [Piece.Queen]: LEGAL_OFFSETS_QUEEN,
}

const getXPositionFromBoardIndex = (index: number): number => ((index % 11) * TW)
const getYPositionFromBoardIndex = (index: number): number => ((Math.floor(index / 11) % 11) * TW)
const getBoardIndexFromRankFile = (rank: number, file: number): number => file + (rank * 11)

const NUM_SQUARES_TO_EDGE: { [key: number]: number }[] = Array(121).fill(0).map((n, i) => {
  const [x, y] = [(i % 11), (Math.floor(i / 11) % 11)]

  const numNorth = y
  const numSouth = (11 - 1) - y
  const numWest = x
  const numEast = (11 - 1) - x

  const numNorthEast = Math.min(numNorth, numEast)
  const numNorthWest = Math.min(numNorth, numWest)
  const numSouthEast = Math.min(numSouth, numEast)
  const numSouthWest = Math.min(numSouth, numWest)

  return {
    [-12]: numNorthWest,
    [-11]: numNorth,
    [-10]: numNorthEast,
    [-1]: numWest,
    [1]: numEast,
    [10]: numSouthWest,
    [11]: numSouth,
    [12]: numSouthEast
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

const getPieceType = (piece: number): Piece => piece & 7
const getPieceColor = (piece: number): Piece => piece & 24

const pieceIsWhite = (piece: number): boolean => getPieceColor(piece) === Piece.White
const pieceIsBlack = (piece: number): boolean => getPieceColor(piece) === Piece.Black

const renderPiece = (piece: number, index: number, pos?: MousePosition) => {
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


const getOppositeColor = (color: Piece): Piece => getPieceColor(color) === Piece.White ? Piece.Black : Piece.White

const Chess: Component<{ BOARD_SIZE_PX: number, previewOnly: boolean }> = ({ BOARD_SIZE_PX, previewOnly }) => {  
  const DRAG_SCALE_FACTOR = BOARD_SIZE_PX / (11 * TW) // idk why this is needed, but without it, dragging pieces doesn't follow mouse 1:1

  const [board, setBoard] = createSignal<number[]>(Array(121).fill(0))
  const [highlightedSquares, setHighlightedSquares] = createSignal<boolean[]>(Array(121).fill(false))
  const [exitFortSquares, setExitFortSquares] = createSignal<boolean[]>(Array(121).fill(false))
  const [kingSquares, setKingSquares] = createSignal<boolean[]>(Array(121).fill(false))
  const [throneIndex, setThroneIndex] = createSignal<number>(60)
  const [dragEnabled, setDragEnabled] = createSignal<boolean>(false)
  const [draggedIndex, setDraggedIndex] = createSignal<number>(-1)
  const [mousePosition, setMousePosition] = createSignal<MousePosition>({ x: 0, y: 0 })
  const [whiteToMove, setWhiteToMove] = createSignal<boolean>(false)
  const [colorToMove, setColorToMove] = createSignal<Piece>(Piece.Black)
  const [kingLocation, setKingLocation] = createSignal<{ [key: number]: number }>({ [Piece.Black]: 4, [Piece.White]: 60 })
  const [legalMoves, setLegalMoves] = createSignal<{ [key: number]: number[][] }>({ [Piece.White]: Array(121).fill([]), [Piece.Black]: Array(121).fill([]) })
  const [kingMoved, setKingMoved] = createSignal<{ [key: number]: boolean }>({ [Piece.White]: false, [Piece.Black]: false })
  const [winner, setWinner] = createSignal<string | null>(null)
  const [moveStack, setMoveStack] = createSignal<number[][]>([])

  const getBoardIndexFromMousePosition = (pos: MousePosition): number => {
    const x = pos.x
    const y = pos.y
  
    const TILE_SIZE_PX = BOARD_SIZE_PX / 11
    const file = Math.floor(x / TILE_SIZE_PX)
    const rank = Math.floor(y / TILE_SIZE_PX)
  
    const index = getBoardIndexFromRankFile(rank, file)
    // console.log(x, y, index)
    return index
  }

  const updateBoard = (newBoard: number[] = board()) => {
    setBoard(Array(121).fill(0))   // temporary solution to force board to rerender
    setBoard(newBoard)
  }

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || previewOnly) return; // exclude all mouse clicks except for left mouse button (button 0)
    const index = getBoardIndexFromMousePosition({ x: event.offsetX, y: event.offsetY })
    const piece = board()[index]
    const isCorrectColorToMove = whiteToMove() ? pieceIsWhite(piece) : pieceIsBlack(piece)
    if (isCorrectColorToMove) {
      setMousePosition({ x: event.offsetX, y: event.offsetY })
      setDraggedIndex(index)
      setDragEnabled(true)
      highlightLegalMoves(index)
      updateBoard()
    }
    else setDragEnabled(false)
  }

  const onMouseMove = (event: MouseEvent) => {
    if (dragEnabled()) setMousePosition({ x: event.offsetX, y: event.offsetY })
  }

  const isFriendlyPieceAtTarget = (index: number, pieceColor: Piece): boolean => getPieceColor(index) === pieceColor

  enum Direction {
    Horizontal = 1,
    Vertical = 8,
    NortheastToSouthwest = 7,
    NorthwestToSoutheast = 9
  }

  const highlightLegalMoves = (index: number): void => {
    const moves = legalMoves()[colorToMove()][index]
    // console.log('Legal Moves:', moves)
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
  const getNeighborEnemies = (board: number[], index: number) => ORTHOGONAL_OFFSETS.map(offset => ({ offset, target: index + offset})).filter(({ target: i }) => isEnemy(board, index, i))

  
  const movePiece = (prevIndex: number, newIndex: number, piece?: number): void => {
    piece ||= board()[prevIndex]
    const newBoard = board().slice()
    newBoard[prevIndex] = 0
    newBoard[newIndex] = piece
    const pieceColor = getPieceColor(piece)
    const pieceType = getPieceType(piece)

    if (pieceType === Piece.King) {
      if (!kingMoved()[pieceColor]) setKingMoved(prev => ({ ...prev, [pieceColor]: true }))
      setKingLocation(prev => ({ ...prev, [pieceColor]: newIndex }))
    }

    setWhiteToMove(prev => !prev)
    setColorToMove(prevColor => getOppositeColor(prevColor))

    // check if capture

    // for piece that just moved, get all neighboring enemy pieces
    const neighborEnemies: { offset: number, target: number }[] = getNeighborEnemies(newBoard, newIndex)
    
    // for each neighbor enemy, find the captures
    const capturedPieces = neighborEnemies.filter(({ offset, target }) => {
      // piece is captured if sandwiched
      return (isEnemy(newBoard, target, target + offset) || kingSquares()[target + offset] || (
        // throne is always hostile to attackers; only hostile to defenders if king is not on throne
        target + offset === throneIndex() && kingLocation()[colorToMove()] !== throneIndex()
      )) && getPieceType(newBoard[target]) !== Piece.King && NUM_SQUARES_TO_EDGE[target][offset]
    })

    // console.log(neighborEnemies, capturedPieces)

    capturedPieces.forEach(({ target }) => newBoard[target] = 0)

    const moves = calculateLegalMoves(newBoard, { colorToMove: colorToMove(), kingLocation: kingLocation() })

    // shield wall capture

    // check win conditions

    // is king captured?
    if (ORTHOGONAL_OFFSETS.every(offset => isEnemy(newBoard, kingLocation()[colorToMove()], kingLocation()[colorToMove()] + offset) ||
      kingLocation()[colorToMove()] + offset === throneIndex())) setWinner('Attackers win!')

    // no more legal moves
    console.log(moves)
    if (!moves[colorToMove()].filter(moves => moves?.length).length) setWinner('Attackers win!')
    
    // king reaches corner
    if (kingSquares()[kingLocation()[Piece.White]] && kingLocation()[Piece.White] !== 60) setWinner('Defenders win!')

    // all defenders surrounded?
    let fill: boolean[] = Array(121).fill(false)

    let foundEdge = false
    const floodFill = (index: number, condition: Function, stopWhenEdgeFound: boolean = true) => {
      if ((stopWhenEdgeFound && foundEdge) || fill[index]) return
      fill[index] = true;
      for (const offset of ORTHOGONAL_OFFSETS) {
        if (!NUM_SQUARES_TO_EDGE[index][offset]) {
          foundEdge = true
          return
        }
        if (condition(index + offset)) floodFill(index + offset, condition, stopWhenEdgeFound)
      }
    }

    newBoard.forEach((piece, index) => getPieceColor(piece) === Piece.White &&
      floodFill(index, (index: number) => getPieceColor(newBoard[index]) !== Piece.Black)
    )

    // if all defenders are surrounded
    if (!foundEdge) setWinner('Attackers win!')

    // exit fort
    const isKingOnEdge = ORTHOGONAL_OFFSETS.some(offset => !NUM_SQUARES_TO_EDGE[kingLocation()[Piece.White]][offset])
    const checkExitFort = (ignoredDefenders: number[] = []): boolean => {
      fill = Array(121).fill(false)
      floodFill(kingLocation()[Piece.White], (index: number) => getPieceColor(newBoard[index]) !== Piece.White || ignoredDefenders.includes(index), false)

      const filledSquares = fill.reduce((acc: number[], isFilled, index) => {
        if (isFilled) acc.push(index)
        return acc
      }, [])

      const filledSquaresContainAttackers = fill.some((isFilled, index) => isFilled && getPieceColor(newBoard[index]) === Piece.Black)

      const kingHasEmptySquareNeighbor = ORTHOGONAL_OFFSETS.some(offset => NUM_SQUARES_TO_EDGE[kingLocation()[Piece.White]][offset] && !newBoard[kingLocation()[Piece.White + offset]])

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
        ((NUM_SQUARES_TO_EDGE[defender][11] > 0 && !fill[defender + 11] && !newBoard[defender + 11]) && (NUM_SQUARES_TO_EDGE[defender][-11] > 0 && !fill[defender + -11] && !newBoard[defender + -11]))
      }

      // some defender can be captured
      const vulnerableDefenders = defenders.filter(defender => canBeCaptured(defender))

      console.log(vulnerableDefenders)

      fill = Array(121).fill(false)
      defenders.forEach(index => fill[index] = true)
      setHighlightedSquares(fill)

      return !vulnerableDefenders.length ? true : defenders.some(defender => checkExitFort([...ignoredDefenders, defender]));
    }

    if (checkExitFort()) setWinner('Defenders win!')

    // check for perpetual
    setMoveStack(stack => {
      stack.push(newBoard)
      console.log(stack)
      return stack
    })
    
    setLegalMoves(moves)
    
    updateBoard(newBoard)
  }

  const onMouseUp = (event: MouseEvent) => {
    // console.log('Dragged Index:', draggedIndex())
    setHighlightedSquares([])
    updateBoard()
    if (!dragEnabled()) return
    setDragEnabled(false)

    // Legal move logic here
    const index = getBoardIndexFromMousePosition({ x: mousePosition().x, y: mousePosition().y })
    const piece = board()[draggedIndex()]
    const legalMove = isLegalMove(draggedIndex(), index)

    // If legal move, move piece to new board index
    if (legalMove) movePiece(draggedIndex(), index, piece)
    else updateBoard()
  }

  const resetBoard = () => {
    setBoard(() => {
      const b = Array(121).fill(0)
      // attacking pieces
      b[3] = Piece.Rook | Piece.Black
      b[4] = Piece.Rook | Piece.Black
      b[5] = Piece.Rook | Piece.Black
      b[6] = Piece.Rook | Piece.Black
      b[7] = Piece.Rook | Piece.Black
      b[16] = Piece.Rook | Piece.Black

      b[33] = Piece.Rook | Piece.Black
      b[44] = Piece.Rook | Piece.Black
      b[55] = Piece.Rook | Piece.Black
      b[66] = Piece.Rook | Piece.Black
      b[77] = Piece.Rook | Piece.Black
      b[56] = Piece.Rook | Piece.Black

      b[43] = Piece.Rook | Piece.Black
      b[54] = Piece.Rook | Piece.Black
      b[65] = Piece.Rook | Piece.Black
      b[76] = Piece.Rook | Piece.Black
      b[87] = Piece.Rook | Piece.Black
      b[64] = Piece.Rook | Piece.Black

      b[104] = Piece.Rook | Piece.Black
      b[113] = Piece.Rook | Piece.Black
      b[114] = Piece.Rook | Piece.Black
      b[115] = Piece.Rook | Piece.Black
      b[116] = Piece.Rook | Piece.Black
      b[117] = Piece.Rook | Piece.Black

      // defending pieces
      b[38] = Piece.Rook | Piece.White
      b[48] = Piece.Rook | Piece.White
      b[49] = Piece.Rook | Piece.White
      b[50] = Piece.Rook | Piece.White
      b[58] = Piece.Rook | Piece.White
      b[59] = Piece.Rook | Piece.White

      b[60] = Piece.King | Piece.White

      b[61] = Piece.Rook | Piece.White
      b[62] = Piece.Rook | Piece.White
      b[70] = Piece.Rook | Piece.White
      b[71] = Piece.Rook | Piece.White
      b[72] = Piece.Rook | Piece.White
      b[82] = Piece.Rook | Piece.White


      // b[115] = Piece.King | Piece.White
      // b[112] = Piece.Rook | Piece.White
      // b[102] = Piece.Rook | Piece.White
      // b[92] = Piece.Rook | Piece.White
      // b[82] = Piece.Rook | Piece.White
      // b[83] = Piece.Rook | Piece.White
      // b[95] = Piece.Rook | Piece.White
      // b[107] = Piece.Rook | Piece.White
      // b[118] = Piece.Rook | Piece.White

  
      return b
    })
  
    const getKingLocation = (color: Piece): number => board().findIndex(piece => getPieceType(piece) === Piece.King && getPieceColor(piece) === color)
    setKingLocation(({ [Piece.Black]: getKingLocation(Piece.Black), [Piece.White]: getKingLocation(Piece.White) }))
    
    updateBoard()

    updateLegalMovesAndThreats()
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
    board[10] = true
    board[110] = true
    board[120] = true
    return board
  })

  resetBoard()

  return (
    <div class={`${styles.BoardWrapper} ${previewOnly ? styles.PreviewBoard : ''}`}>
      <svg height={BOARD_SIZE_PX} width={BOARD_SIZE_PX} viewBox={`0 0 ${11 * TW} ${11 * TW}`} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} oncontextmenu={(e) => e.preventDefault()}>
        {/* Chessboard alternating color pattern */}
        <rect width="100%" height="100%" fill="#a87156" />
        <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>{(y) => 
          <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>{(x) => <>
            {[0, 2, 4, 6, 8, 10].includes(x) && <rect fill="#ffd5ba" x={`${TW * (x + (y % 2))}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
            {highlightedSquares()[getBoardIndexFromRankFile(y, x)] && <rect fill="blue" opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
            {exitFortSquares()[getBoardIndexFromRankFile(y, x)] && <rect fill="red" opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
            {(kingSquares()[getBoardIndexFromRankFile(y, x)] || getBoardIndexFromRankFile(y, x) === throneIndex()) && <rect fill="#354d2f" opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />}
          </>
          }</For>
        }</For>

        {/* Pieces on board */}
        <For each={board()}>{(piece, i) => {
          if (!dragEnabled() || i() !== draggedIndex()) return renderPiece(piece, i())
        }}</For>

        {dragEnabled() && renderPiece(board()[draggedIndex()], draggedIndex(), { x: (mousePosition().x / DRAG_SCALE_FACTOR) - (TW / 2), y: (mousePosition().y / DRAG_SCALE_FACTOR) - (TW / 2) })}
      </svg>

      <div class={styles.sidebar}>{winner() ?? ''}</div>
    </div>
  );
};

export default Chess;
