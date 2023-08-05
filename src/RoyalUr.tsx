import { Component, For, JSX, createEffect, createSignal, on } from "solid-js";

import styles from "./App.module.css";

const TW = 45; // TILE_WIDTH -> don't change this unless all pieces SVG updated

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
}

type MousePosition = {
  x: number;
  y: number;
};

const isLightSquare = (index: number): boolean => (index + Math.floor(index / 8)) % 2 === 0;

// legal moves
const LEGAL_OFFSETS_KING = [-9, -8, -7, -1, 1, 7, 8, 9];
const LEGAL_OFFSETS_PAWN = [-8, 8];
const LEGAL_OFFSETS_KNIGHT = [-17, -15, -10, -6, 6, 10, 15, 17];
const LEGAL_OFFSETS_BISHOP = [-7, -9, 7, 9];
const LEGAL_OFFSETS_ROOK = [-8, -1, 1, 8];
const LEGAL_OFFSETS_QUEEN = [-9, -8, -7, -1, 1, 7, 8, 9];
const LEGAL_OFFSETS: { [key: number]: number[] } = {
  [Piece.King]: LEGAL_OFFSETS_KING,
  [Piece.Pawn]: LEGAL_OFFSETS_PAWN,
  [Piece.Knight]: LEGAL_OFFSETS_KNIGHT,
  [Piece.Bishop]: LEGAL_OFFSETS_BISHOP,
  [Piece.Rook]: LEGAL_OFFSETS_ROOK,
  [Piece.Queen]: LEGAL_OFFSETS_QUEEN,
};

const CASTLE_SQUARES = [0, 7, 56, 63];

const getXPositionFromBoardIndex = (index: number): number => (index % 8) * TW;
const getYPositionFromBoardIndex = (index: number): number => (Math.floor(index / 8) % 8) * TW;
const getBoardIndexFromRankFile = (rank: number, file: number): number => file + rank * 8;

const NUM_SQUARES_TO_EDGE: { [key: number]: number }[] = Array(64)
  .fill(0)
  .map((n, i) => {
    const [x, y] = [i % 8, Math.floor(i / 8) % 8];

    const numNorth = y;
    const numSouth = 7 - y;
    const numWest = x;
    const numEast = 7 - x;

    const numNorthEast = Math.min(numNorth, numEast);
    const numNorthWest = Math.min(numNorth, numWest);
    const numSouthEast = Math.min(numSouth, numEast);
    const numSouthWest = Math.min(numSouth, numWest);

    return {
      [-9]: numNorthWest,
      [-8]: numNorth,
      [-7]: numNorthEast,
      [-1]: numWest,
      [1]: numEast,
      [7]: numSouthWest,
      [8]: numSouth,
      [9]: numSouthEast,
    };
  });

//#region svg pieces
const PiecePlacer = (index: number, piece: JSX.Element, pos?: MousePosition) => (
  <g
    transform={`translate(${pos?.x ? pos.x : getXPositionFromBoardIndex(index)}, ${pos?.y ? pos.y : getYPositionFromBoardIndex(index)})`}
    style="fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"
  >
    {piece}
  </g>
);

const WhiteKing = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <path d="M 22.5,11.63 L 22.5,6" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
      <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
      <path
        d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"
        style="fill:#ffffff; stroke:#000000; stroke-linecap:butt; stroke-linejoin:miter;"
      />
      <path
        d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z "
        style="fill:#ffffff; stroke:#000000;"
      />
      <path d="M 11.5,30 C 17,27 27,27 32.5,30" style="fill:none; stroke:#000000;" />
      <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" style="fill:none; stroke:#000000;" />
      <path d="M 11.5,37 C 17,34 27,34 32.5,37" style="fill:none; stroke:#000000;" />
    </>,
    pos,
  );

const WhitePawn = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <path
      d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z "
      style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"
    />,
    pos,
  );

const WhiteKnight = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#ffffff; stroke:#000000;" />
      <path
        d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
        style="fill:#ffffff; stroke:#000000;"
      />
      <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#000000; stroke:#000000;" />
      <path
        d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z"
        transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
        style="fill:#000000; stroke:#000000;"
      />
    </>,
    pos,
  );

const WhiteBishop = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <g style="fill:#ffffff; stroke:#000000; stroke-linecap:butt;">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
        <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
      </g>
      <path
        d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18"
        style="fill:none; stroke:#000000; stroke-linejoin:miter;"
      />
    </>,
    pos,
  );

const WhiteRook = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <g style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" />
        <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" />
        <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" style="stroke-linecap:butt;" />
        <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
        <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" style="stroke-linecap:butt; stroke-linejoin:miter;" />
        <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
        <path d="M 11,14 L 34,14" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
      </g>
    </>,
    pos,
  );

const WhiteQueen = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <g style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(-1,-1)" />
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(15.5,-5.5)" />
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(32,-1)" />
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(7,-4.5)" />
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(24,-4)" />
        <path
          d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,11 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 9,26 z "
          style="stroke-linecap:butt;"
        />
        <path
          d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z "
          style="stroke-linecap:butt;"
        />
        <path d="M 11.5,30 C 15,29 30,29 33.5,30" style="fill:none;" />
        <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" style="fill:none;" />
      </g>
    </>,
    pos,
  );

const BlackKing = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <path d="M 22.5,11.63 L 22.5,6" style="fill:none; stroke:#000000; stroke-linejoin:miter;" id="path6570" />
      <path
        d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"
        style="fill:#000000;fill-opacity:1; stroke-linecap:butt; stroke-linejoin:miter;"
      />
      <path
        d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37"
        style="fill:#000000; stroke:#000000;"
      />
      <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
      <path
        d="M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.5,26.6 L 22.5,24.5 C 20,18 10.85,14 6.97,19.85 C 4.5,25.5 13,29.5 13,29.5"
        style="fill:none; stroke:#ffffff;"
      />
      <path
        d="M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37"
        style="fill:none; stroke:#ffffff;"
      />
    </>,
    pos,
  );

const BlackPawn = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <path
      d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z "
      style="opacity:1; fill:#000000; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"
    />,
    pos,
  );

const BlackKnight = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#000000; stroke:#000000;" />
      <path
        d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
        style="fill:#000000; stroke:#000000;"
      />
      <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#ffffff; stroke:#ffffff;" />
      <path
        d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z"
        transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
        style="fill:#ffffff; stroke:#ffffff;"
      />
      <path
        d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z "
        style="fill:#ffffff; stroke:none;"
      />
    </>,
    pos,
  );

const BlackBishop = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <g style="fill:#000000; stroke:#000000; stroke-linecap:butt;">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
        <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
      </g>
      <path
        d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18"
        style="fill:none; stroke:#ffffff; stroke-linejoin:miter;"
      />
    </>,
    pos,
  );

const BlackRook = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <g style="opacity:1; fill:000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" />
        <path d="M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z " style="stroke-linecap:butt;" />
        <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" />
        <path d="M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z " style="stroke-linecap:butt;stroke-linejoin:miter;" />
        <path d="M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z " style="stroke-linecap:butt;" />
        <path
          d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z "
          style="stroke-linecap:butt;"
        />
        <path d="M 12,35.5 L 33,35.5 L 33,35.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
        <path d="M 13,31.5 L 32,31.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
        <path d="M 14,29.5 L 31,29.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
        <path d="M 14,16.5 L 31,16.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
        <path d="M 11,14 L 34,14" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
      </g>
    </>,
    pos,
  );

const BlackQueen = (index: number, pos?: MousePosition) =>
  PiecePlacer(
    index,
    <>
      <g style="opacity:1; fill:000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
        <g style="fill:#000000; stroke:none;">
          <circle cx="6" cy="12" r="2.75" />
          <circle cx="14" cy="9" r="2.75" />
          <circle cx="22.5" cy="8" r="2.75" />
          <circle cx="31" cy="9" r="2.75" />
          <circle cx="39" cy="12" r="2.75" />
        </g>
        <path
          d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z"
          style="stroke-linecap:butt; stroke:#000000;"
        />
        <path
          d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"
          style="stroke-linecap:butt;"
        />
        <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" style="fill:none; stroke:#000000; stroke-linecap:butt;" />
        <path d="M 11,29 A 35,35 1 0 1 34,29" style="fill:none; stroke:#ffffff;" />
        <path d="M 12.5,31.5 L 32.5,31.5" style="fill:none; stroke:#ffffff;" />
        <path d="M 11.5,34.5 A 35,35 1 0 0 33.5,34.5" style="fill:none; stroke:#ffffff;" />
        <path d="M 10.5,37.5 A 35,35 1 0 0 34.5,37.5" style="fill:none; stroke:#ffffff;" />
      </g>
    </>,
    pos,
  );
//#endregion svg pieces

const getPieceType = (piece: number): Piece => piece & 7;
const getPieceColor = (piece: number): Piece => piece & 24;

const pieceIsWhite = (piece: number): boolean => getPieceColor(piece) === Piece.White;
const pieceIsBlack = (piece: number): boolean => getPieceColor(piece) === Piece.Black;

const renderPiece = (piece: number, index: number, pos?: MousePosition) => {
  const pieceType = getPieceType(piece);
  const pieceColor = getPieceColor(piece);
  const isWhite = pieceColor === Piece.White;
  if (pieceType === Piece.Queen) {
    if (isWhite) return WhiteQueen(index, pos);
    else return BlackQueen(index, pos);
  }
  if (pieceType === Piece.Rook) {
    if (isWhite) return WhiteRook(index, pos);
    else return BlackRook(index, pos);
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

const getOppositeColor = (color: Piece): Piece => (getPieceColor(color) === Piece.White ? Piece.Black : Piece.White);

const RoyalUr: Component<{
  BOARD_SIZE_PX: number;
  previewOnly?: boolean;
  highlightMoves?: boolean;
  highlightThreats?: boolean;
  resetBoard?: boolean;
}> = (props) => {
  const { BOARD_SIZE_PX, previewOnly } = props;
  const DRAG_SCALE_FACTOR = BOARD_SIZE_PX / (8 * TW); // idk why this is needed, but without it, dragging pieces doesn't follow mouse 1:1

  console.log(localStorage);

  const cache: {
    board: number[];
    highlightedSquares: boolean[];
    dragEnabled: boolean;
    draggedIndex: number;
    mousePosition: MousePosition;
    whiteToMove: boolean;
    colorToMove: Piece;
    checkmate: boolean;
    inCheck: boolean;
    kingLocation: { [key: number]: number };
    displayPromotionDialog: boolean;
    promotionSquare: number;
    promotionPreviousIndex: number;
    legalMoves: { [key: number]: number[][] };
    threatenedSquares: { [key: number]: boolean[] };
    lineOfCheckSquares: { [key: number]: number[][] };
    highlightedLinesOfCheckSquares: boolean[];
    enPassantSquare: number;
    kingMoved: { [key: number]: boolean };
    rookMoved: { [key: number]: boolean };
    moveStack: string[];
    isDraw: boolean;
    hoverFriendlyPiece: boolean;
  } = previewOnly ? {} : JSON.parse(localStorage.getItem("chess") || "{}");

  console.log(cache);

  const [board, setBoard] = createSignal<number[]>(cache.board ?? Array(64).fill(0));
  const [highlightedSquares, setHighlightedSquares] = createSignal<boolean[]>(cache.highlightedSquares ?? Array(64).fill(false));
  const [dragEnabled, setDragEnabled] = createSignal<boolean>(cache.dragEnabled ?? false);
  const [draggedIndex, setDraggedIndex] = createSignal<number>(cache.draggedIndex ?? -1);
  const [mousePosition, setMousePosition] = createSignal<MousePosition>(cache.mousePosition ?? { x: 0, y: 0 });
  const [whiteToMove, setWhiteToMove] = createSignal<boolean>(cache.whiteToMove ?? true);
  const [colorToMove, setColorToMove] = createSignal<Piece>(cache.colorToMove ?? Piece.White);
  const [checkmate, setCheckmate] = createSignal<boolean>(cache.checkmate ?? false);
  const [inCheck, setInCheck] = createSignal<boolean>(cache.inCheck ?? false);
  const [kingLocation, setKingLocation] = createSignal<{ [key: number]: number }>(
    cache.kingLocation ?? { [Piece.Black]: 4, [Piece.White]: 60 },
  );
  const [displayPromotionDialog, setDisplayPromotionDialog] = createSignal<boolean>(cache.displayPromotionDialog ?? false);
  const [promotionSquare, setPromotionSquare] = createSignal<number>(cache.promotionSquare ?? -1);
  const [promotionPreviousIndex, setPromotionPreviousIndex] = createSignal<number>(cache.promotionPreviousIndex ?? -1);
  const [legalMoves, setLegalMoves] = createSignal<{ [key: number]: number[][] }>(
    cache.legalMoves ?? { [Piece.White]: Array(64).fill([]), [Piece.Black]: Array(64).fill([]) },
  );
  const [threatenedSquares, setThreatenedSquares] = createSignal<{ [key: number]: boolean[] }>(
    cache.threatenedSquares ?? { [Piece.White]: Array(64).fill(false), [Piece.Black]: Array(64).fill(false) },
  );
  const [lineOfCheckSquares, setLineOfCheckSquares] = createSignal<{ [key: number]: number[][] }>(
    cache.lineOfCheckSquares ?? { [Piece.White]: [], [Piece.Black]: [] },
  );
  const [highlightedLinesOfCheckSquares, setHighlightedLinesOfCheckSquares] = createSignal<boolean[]>(
    cache.highlightedLinesOfCheckSquares ?? Array(64).fill(false),
  );
  const [enPassantSquare, setEnPassantSquare] = createSignal<number>(cache.enPassantSquare ?? -1);
  const [kingMoved, setKingMoved] = createSignal<{ [key: number]: boolean }>(
    cache.kingMoved ?? { [Piece.White]: false, [Piece.Black]: false },
  );
  const [rookMoved, setRookMoved] = createSignal<{ [key: number]: boolean }>(
    cache.rookMoved ?? CASTLE_SQUARES.reduce((obj, square) => ({ ...obj, [square]: false }), {}),
  );
  const [moveStack, setMoveStack] = createSignal<string[]>(cache.moveStack ?? []);
  const [isDraw, setIsDraw] = createSignal<boolean>(cache.isDraw ?? false);
  const [hoverFriendlyPiece, setHoverFriendlyPiece] = createSignal<boolean>(cache.hoverFriendlyPiece ?? false);

  const [lightSquareFill, setLightSquareFill] = createSignal<string>("#ffd5ba");
  const [darkSquareFill, setDarkSquareFill] = createSignal<string>("#a87156");

  createEffect(
    on(
      () => props.resetBoard,
      (shouldReset) => {
        if (shouldReset) {
          setBoard(Array(64).fill(0));
          setHighlightedSquares(Array(64).fill(false));
          setDragEnabled(false);
          setDraggedIndex(-1);
          setMousePosition({ x: 0, y: 0 });
          setWhiteToMove(true);
          setColorToMove(Piece.White);
          setCheckmate(false);
          setInCheck(false);
          setKingLocation({ [Piece.Black]: 4, [Piece.White]: 60 });
          setDisplayPromotionDialog(false);
          setPromotionSquare(-1);
          setPromotionPreviousIndex(-1);
          setLegalMoves({ [Piece.White]: Array(64).fill([]), [Piece.Black]: Array(64).fill([]) });
          setThreatenedSquares({ [Piece.White]: Array(64).fill(false), [Piece.Black]: Array(64).fill(false) });
          setLineOfCheckSquares({ [Piece.White]: [], [Piece.Black]: [] });
          setHighlightedLinesOfCheckSquares(Array(64).fill(false));
          setEnPassantSquare(-1);
          setKingMoved({ [Piece.White]: false, [Piece.Black]: false });
          setRookMoved(CASTLE_SQUARES.reduce((obj, square) => ({ ...obj, [square]: false }), {}));
          setMoveStack([]);
          setIsDraw(false);
          setHoverFriendlyPiece(false);

          resetBoard();
          setTimeout(() => updateBoard());

          localStorage.removeItem("chess");
        }
      },
    ),
  );

  const getBoardIndexFromMousePosition = (pos: MousePosition): number => {
    const x = pos.x;
    const y = pos.y;

    const TILE_SIZE_PX = BOARD_SIZE_PX / 8;
    const file = Math.floor(x / TILE_SIZE_PX);
    const rank = Math.floor(y / TILE_SIZE_PX);

    const index = getBoardIndexFromRankFile(rank, file);
    // console.log(x, y, index)
    return index;
  };

  const getMoveString = (pieceType: Piece, prevIndex: number, newIndex: number): string => {
    return `${pieceType}-${prevIndex}-${newIndex}`;
  };

  const updateBoard = (newBoard: number[] = board()) => {
    setBoard(Array(64).fill(0)); // temporary solution to force board to rerender
    setBoard(newBoard);
  };

  const movePiece = (prevIndex: number, newIndex: number, piece?: number): void => {
    // console.log(board())
    piece ||= board()[prevIndex];
    const newBoard = board().slice();
    newBoard[prevIndex] = 0;
    newBoard[newIndex] = piece;
    const pieceColor = getPieceColor(piece);
    const pieceType = getPieceType(piece);
    const isPawn = pieceType === Piece.Pawn;
    const offset = prevIndex - newIndex;
    let resetEnPassant = true;

    if (isPawn) {
      const capturedEnPassant = isPawn && enPassantSquare() === newIndex;
      if (capturedEnPassant) newBoard[enPassantSquare() + (offset < 0 ? -8 : 8)] = 0;
      else if (Math.abs(offset) === 16) {
        // if a pawn moved 2 squares forward, allow future en passant on skipped square
        setEnPassantSquare((prevIndex + newIndex) / 2);
        resetEnPassant = false;
      }
    } else if (pieceType === Piece.King) {
      if (Math.abs(offset) === 2) {
        // castled
        newBoard[(newIndex + prevIndex) / 2] = getPieceColor(piece) | Piece.Rook;
        const rookIndex = prevIndex + (offset < 0 ? 3 : -4);
        newBoard[rookIndex] = 0;
      }

      if (!kingMoved()[pieceColor]) setKingMoved((prev) => ({ ...prev, [pieceColor]: true }));
      setKingLocation((prev) => ({ ...prev, [pieceColor]: newIndex }));
    }

    if (CASTLE_SQUARES.includes(prevIndex) && !rookMoved()[prevIndex]) setRookMoved((prev) => ({ ...prev, [prevIndex]: true }));
    if (CASTLE_SQUARES.includes(newIndex) && !rookMoved()[newIndex]) setRookMoved((prev) => ({ ...prev, [newIndex]: true }));
    if (resetEnPassant) setEnPassantSquare(-1);

    setWhiteToMove((prev) => !prev);
    setColorToMove((prevColor) => getOppositeColor(prevColor));

    // calculate new board moves and threats
    const { moves, threats } = calculateLegalMoves(newBoard, {
      colorToMove: colorToMove(),
      kingLocation: kingLocation(),
      lineOfCheckSquares: lineOfCheckSquares(),
      enPassantSquare: enPassantSquare(),
    });

    // look for checks
    const playerKingInCheck = threats[colorToMove()][kingLocation()[pieceColor]];
    const enemyKingInCheck = threats[pieceColor][kingLocation()[colorToMove()]];

    // console.log({ playerKingInCheck, enemyKingInCheck, kingLocation: kingLocation()[pieceColor], threats: threats[colorToMove()] })

    setInCheck(playerKingInCheck || enemyKingInCheck);

    setLegalMoves(moves);
    setThreatenedSquares(threats);

    if (!moves[pieceColor].length) setCheckmate(true);

    // check for draw due to repeated moves
    setMoveStack((stack) => [...stack, getMoveString(pieceType, prevIndex, newIndex)]);
    if (moveStack().length > 7) {
      let isDraw = true;
      for (let i = 0; i < 4; i++) {
        if (moveStack()[i] !== moveStack()[i + 4]) {
          isDraw = false;
          break;
        }
      }
      setIsDraw(isDraw);
    }

    updateBoard(newBoard);

    if (!previewOnly)
      localStorage.setItem(
        "chess",
        JSON.stringify({
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
        }),
      );
  };

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || previewOnly) return; // exclude all mouse clicks except for left mouse button (button 0)
    const index = getBoardIndexFromMousePosition({ x: event.offsetX, y: event.offsetY });

    // promotion
    if (displayPromotionDialog()) {
      const promotionPieces: { [key: number]: Piece } = {};

      [Piece.Queen, Piece.Knight, Piece.Rook, Piece.Bishop].forEach((piece, i) => {
        const promotionKey = promotionSquare() + 8 * i * (whiteToMove() ? 1 : -1);
        promotionPieces[promotionKey] = piece;
      });

      if (promotionPieces[index]) movePiece(promotionPreviousIndex(), promotionSquare(), promotionPieces[index] | colorToMove());

      setDisplayPromotionDialog(false);
      updateBoard();
      return;
    }

    const piece = board()[index];
    const isCorrectColorToMove = whiteToMove() ? pieceIsWhite(piece) : pieceIsBlack(piece);
    if (isCorrectColorToMove) {
      setMousePosition({ x: event.offsetX, y: event.offsetY });
      setDraggedIndex(index);
      setDragEnabled(true);
      highlightLegalMoves(index);
      updateBoard();
    } else setDragEnabled(false);
  };

  const onMouseMove = (event: MouseEvent) => {
    if (previewOnly) return;
    if (dragEnabled() || displayPromotionDialog()) {
      setMousePosition({ x: event.offsetX, y: event.offsetY });
      setHoverFriendlyPiece(true);
    } else {
      const boardIndex = getBoardIndexFromMousePosition({ x: event.offsetX, y: event.offsetY });
      const pieceAtIndex = board()[boardIndex];
      setHoverFriendlyPiece(getPieceColor(pieceAtIndex) === colorToMove());
    }
  };

  const isFriendlyPieceAtTarget = (index: number, pieceColor: Piece): boolean => getPieceColor(index) === pieceColor;

  enum Direction {
    Horizontal = 1,
    Vertical = 8,
    NortheastToSouthwest = 7,
    NorthwestToSoutheast = 9,
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
  const checkForPin = (
    board: number[],
    threatsOnBoard: boolean[],
    kingLocation: number,
    index: number,
    ignoreThreatCheck: boolean = false,
  ): { isPinned: boolean; pinIndex: number; legalPinnedSlideMoves: number[] } => {
    const pinResult = { isPinned: false, pinIndex: 0, legalPinnedSlideMoves: [] };

    // if this piece is not being threatened, it is not pinned
    if (!threatsOnBoard[index] && !ignoreThreatCheck) return pinResult;

    // if this piece is the king, it is in check, not a pin
    if (index === kingLocation) return pinResult;

    // this is a pinned piece if it is on same rank/file/diag as friendly king & sliding enemy piece with line of sight
    const [kingLocationX, kingLocationY] = [getXPositionFromBoardIndex(kingLocation), getYPositionFromBoardIndex(kingLocation)];
    const [pieceLocationX, pieceLocationY] = [getXPositionFromBoardIndex(index), getYPositionFromBoardIndex(index)];
    const pieceColor = getPieceColor(board[index]);
    const legalPinnedSlideMoves: number[] = [];

    const checkOrthogonalPin = (direction: Direction): number => {
      let directionOfKing: 1 | -1;
      if (direction === Direction.Horizontal && pieceLocationY === kingLocationY) directionOfKing = pieceLocationX < kingLocationX ? 1 : -1;
      else if (direction === Direction.Vertical && pieceLocationX === kingLocationX)
        directionOfKing = pieceLocationY < kingLocationY ? 1 : -1;
      else if (direction === Direction.NorthwestToSoutheast || direction === Direction.NortheastToSouthwest)
        directionOfKing = index < kingLocation ? 1 : -1;
      else return 0;

      // search in direction of king to verify no other pieces would block potential check if this piece moved
      const nSquaresBetweenPieceAndKing = Math.abs(index - kingLocation) / direction;
      for (let offset = 1; offset < nSquaresBetweenPieceAndKing; offset++) {
        const targetIndex = index + offset * directionOfKing * direction;
        const pieceAtTarget = board[targetIndex];
        legalPinnedSlideMoves.push(targetIndex);
        if (pieceAtTarget) return 0;
      }

      // if reached this point, then no pieces are between this piece & king; pin is possible
      const enemyPieceType = direction === Direction.Horizontal || direction === Direction.Vertical ? Piece.Rook : Piece.Bishop;

      // search in opposite direction as king; stop if piece is found; if found piece is enemy Rook or Queen, this piece is pinned
      const directionAwayFromKing = directionOfKing * -1;
      for (let offset = 1; offset <= NUM_SQUARES_TO_EDGE[index][directionAwayFromKing * direction]; offset++) {
        const targetIndex = index + offset * directionAwayFromKing * direction;
        const pieceAtTarget = board[targetIndex];
        const pieceType = getPieceType(pieceAtTarget);
        legalPinnedSlideMoves.push(targetIndex);
        if (pieceAtTarget > 0) {
          if (!isFriendlyPieceAtTarget(pieceAtTarget, pieceColor) && (pieceType === enemyPieceType || pieceType === Piece.Queen)) {
            legalPinnedSlideMoves.push(targetIndex);
            return targetIndex;
          }
          return 0;
        }
      }
      return 0;
    };

    let pinIndex: number = checkOrthogonalPin(Direction.Horizontal);
    if (pinIndex) return { isPinned: true, pinIndex, legalPinnedSlideMoves };
    pinIndex = checkOrthogonalPin(Direction.Vertical);
    if (pinIndex) return { isPinned: true, pinIndex, legalPinnedSlideMoves };

    // on same diag as king? look for Bishops/Queens
    const diff = Math.max(index, kingLocation) - Math.min(index, kingLocation);

    // Northwest to Southeast or Southeast to Northwest
    if (diff % 9 === 0) {
      pinIndex = checkOrthogonalPin(Direction.NorthwestToSoutheast);
      if (pinIndex) return { isPinned: true, pinIndex, legalPinnedSlideMoves };
    }
    if (diff % 7 === 0) {
      pinIndex = checkOrthogonalPin(Direction.NortheastToSouthwest);
      if (pinIndex) return { isPinned: true, pinIndex, legalPinnedSlideMoves };
    }

    return { isPinned: false, pinIndex: 0, legalPinnedSlideMoves: [] };
  };

  /**
   * Return a array of legal moves for a given index
   * @param index Constraint: 0 <= index < 64
   * @param piece Optional; provide if available to avoid need to lookup
   * @param pieceType Optional; provide if available to avoid need to lookup
   * @returns
   */
  const getLegalMovesAndThreatsForPiece = (
    board: number[],
    threatsOnBoard: boolean[],
    linesOfCheck: number[][],
    friendlyKingLocation: number,
    enemyKingLocation: number,
    index: number,
    piece?: number,
    pieceType?: Piece,
    enPassantSquare?: number,
  ): { moves: number[]; threats: number[]; checkSquares: number[] } => {
    const thisPiece = piece ?? board[index];
    pieceType ||= getPieceType(thisPiece);
    const pieceColor = getPieceColor(thisPiece);
    const isPawn = pieceType === Piece.Pawn;
    const canSlide = isPawn || pieceType === Piece.Bishop || pieceType === Piece.Rook || pieceType === Piece.Queen;
    let maxPawnSquares = 999;
    if (isPawn)
      maxPawnSquares =
        (pieceColor === Piece.Black && 8 <= index && index <= 15) || (pieceColor === Piece.White && 48 <= index && index <= 55) ? 2 : 1;

    let legalMoves: number[] = [];
    const threats: number[] = [];
    let checkSquares: number[] = [];

    const { pinIndex, legalPinnedSlideMoves } = checkForPin(board, threatsOnBoard, friendlyKingLocation, index);

    let legalOffsets = LEGAL_OFFSETS[pieceType];
    if (isPawn) {
      // handle pawn color directionality move restrictions (pawns can't move backwards)
      legalOffsets = legalOffsets.filter((offset) => {
        if (pieceColor === Piece.Black) return offset > 0; // Black: only allow moving "down" vertically (south) on board
        return offset < 0; // White: only allow moving "up" vertically (north) on board
      });

      // handle diagonal pawn capture (include en passant)
      const captureOffsets = pieceColor === Piece.White ? [-9, -7] : [7, 9];
      for (const captureOffset of captureOffsets) {
        const move = index + captureOffset;
        const isEnPassantCapture = move === enPassantSquare;
        const enPassantPawnIndex = index + (captureOffset === 9 || captureOffset === -7 ? 1 : -1);
        const pieceAtTarget = board[isEnPassantCapture ? enPassantPawnIndex : move];

        let canCaptureEnPassant = false;
        if (isEnPassantCapture && getPieceType(pieceAtTarget) === Piece.Pawn && getPieceColor(pieceAtTarget) !== pieceColor) {
          // handle en passant pinned scenario
          const enPassantBoard = board.slice();
          enPassantBoard[enPassantPawnIndex] = 0;
          const { isPinned } = checkForPin(enPassantBoard, [], friendlyKingLocation, index, true);
          canCaptureEnPassant = !isPinned;
        }

        if ((pieceAtTarget && !isEnPassantCapture && !isFriendlyPieceAtTarget(pieceAtTarget, pieceColor)) || canCaptureEnPassant)
          legalOffsets.push(captureOffset);
        if (NUM_SQUARES_TO_EDGE[index][captureOffset]) threats.push(move);
      }
    }

    for (const offset of legalOffsets) {
      const numSquaresToEdge = NUM_SQUARES_TO_EDGE[index][offset];
      const lineOfCheckOnEnemyKing = [];

      // Pawn, Bishop, Rook, Queen
      if (canSlide) {
        let xRayKing = false; // continue slide loop but don't add to legal moves; only add to threats to threaten through king square
        for (let i = 1; i <= Math.min(numSquaresToEdge, maxPawnSquares); i++) {
          const move = index + offset * i;
          const pieceAtTarget = board[move];
          if (pieceType !== Piece.Pawn) threats.push(move);
          // console.log({ move, offset, index, squaresToEdge: numSquaresToEdge })
          if (pieceAtTarget) {
            if (!xRayKing && !isFriendlyPieceAtTarget(pieceAtTarget, pieceColor) && !(isPawn && Math.abs(offset) === 8)) {
              legalMoves.push(move);
              // console.log(move, enemyKingLocation)
              if (move === enemyKingLocation) checkSquares = lineOfCheckOnEnemyKing;
            }

            if (!isFriendlyPieceAtTarget(pieceAtTarget, pieceColor) && getPieceType(pieceAtTarget) === Piece.King) {
              xRayKing = true;
              continue;
            } else break;
          }
          if (!xRayKing) {
            legalMoves.push(move);
            lineOfCheckOnEnemyKing.push(move);
          }
        }
      }

      // King, Knight
      else if (numSquaresToEdge || pieceType === Piece.Knight) {
        // not on an edge
        const move = index + offset;

        // Prevent knight from jumping off board
        if (pieceType === Piece.Knight && (isLightSquare(index) === isLightSquare(move) || move < 0 || move > 63)) continue;

        threats.push(move);

        // Prevent king from moving into check
        if (pieceType === Piece.King && threatsOnBoard[move]) continue;

        const pieceAtTarget = board[move];
        if (pieceAtTarget && isFriendlyPieceAtTarget(pieceAtTarget, pieceColor)) continue;
        legalMoves.push(move);
      }
    }

    if (threats.includes(enemyKingLocation)) checkSquares.push(index);

    const checkCanCastleAtOffset = (castleOffset: number) => {
      const castleSquare = index + castleOffset;
      if (!rookMoved()[castleSquare]) {
        const kingStepDirection = castleOffset < 0 ? -1 : 1;
        let canCastle = true;
        for (let offset = kingStepDirection; offset !== castleOffset; offset += kingStepDirection) {
          // console.log({ offset, castleOffset, kingStepDirection })
          const pieceAtTarget = board[index + offset];
          if (pieceAtTarget || threatsOnBoard[index + offset]) {
            canCastle = false;
            break;
          }
        }
        if (canCastle) legalMoves.push(index + kingStepDirection * 2);
      }
    };

    // castling
    if (pieceType === Piece.King && !kingMoved()[pieceColor]) {
      checkCanCastleAtOffset(-4);
      checkCanCastleAtOffset(3);
    }

    // console.log({ index, piece, numLegalMoves: legalMoves.length, legalMoves })

    // if in check, legal move must resolve check
    if (linesOfCheck.length && pieceType !== Piece.King) {
      // console.log(linesOfCheck)
      // if king is checked by more than one piece simultaneously; king must move, because no other piece can block
      if (linesOfCheck.length > 1) legalMoves = [];
      else legalMoves = legalMoves.filter((move) => linesOfCheck[0].includes(move)); // directly access index 0 because we know there is exactly 1 element in array
    }

    if (checkSquares.length) checkSquares.push(index);

    return {
      moves: pinIndex ? (canSlide ? legalMoves.filter((move) => legalPinnedSlideMoves.includes(move)) : []) : legalMoves,
      threats,
      checkSquares,
    };
  };

  const highlightLegalMoves = (index: number): void => {
    const moves = legalMoves()[colorToMove()][index];
    // console.log('Legal Moves:', moves)
    moves.forEach((index) =>
      setHighlightedSquares((squares) => {
        squares[index] = true;
        return [...squares];
      }),
    );
  };

  const isLegalMove = (prevIndex: number, newIndex: number): boolean => {
    return legalMoves()[colorToMove()][prevIndex].includes(newIndex);
  };

  const onMouseUp = (event: MouseEvent) => {
    // console.log('Dragged Index:', draggedIndex())
    setHighlightedSquares([]);
    updateBoard();
    if (!dragEnabled()) return;
    setDragEnabled(false);

    // Legal move logic here
    const index = getBoardIndexFromMousePosition({ x: mousePosition().x, y: mousePosition().y });
    const piece = board()[draggedIndex()];
    const legalMove = isLegalMove(draggedIndex(), index);

    // If legal move, move piece to new board index
    if (legalMove) {
      const pieceType = getPieceType(piece);
      const isPawn = pieceType === Piece.Pawn;
      if (isPawn && (index < 8 || index > 55)) {
        // promotion
        setPromotionSquare(index);
        setDisplayPromotionDialog(true);
        setPromotionPreviousIndex(draggedIndex());
        return;
      }
      movePiece(draggedIndex(), index, piece);
    } else updateBoard();
  };

  const calculateLegalMoves = (
    b: number[] = board(),
    properties: {
      colorToMove: Piece;
      kingLocation: { [key: number]: number };
      lineOfCheckSquares: { [key: number]: number[][] };
      enPassantSquare?: number;
    },
  ): { moves: { [key: number]: number[][] }; threats: { [key: number]: boolean[] }; isCheckmate: boolean } => {
    const { colorToMove, kingLocation, lineOfCheckSquares, enPassantSquare } = properties;
    const playerColor = colorToMove;
    const enemyColor = getOppositeColor(playerColor);
    const legalMovesOnBoard: { [key: number]: number[][] } = { [playerColor]: Array(64).fill([]), [enemyColor]: Array(64).fill([]) };
    const attackedSquares: { [key: number]: boolean[] } = { [playerColor]: Array(64).fill(false), [enemyColor]: Array(64).fill(false) };
    const piecesOnBoard: { [key: number]: number[][] } = { [playerColor]: [], [enemyColor]: [] };
    b.forEach((piece, index) => {
      if (piece > 0) piecesOnBoard[getPieceColor(piece)].push([piece, index]);
    });

    const linesOfCheck: number[][] = [];

    // Find all squares that enemy color threatens
    piecesOnBoard[enemyColor].forEach(([piece, index]) => {
      const pieceType = getPieceType(piece);
      const { threats, checkSquares } = getLegalMovesAndThreatsForPiece(
        b,
        Array(64).fill(false),
        lineOfCheckSquares[enemyColor],
        kingLocation[enemyColor],
        kingLocation[playerColor],
        index,
        piece,
        pieceType,
        enPassantSquare,
      );
      threats.forEach((threatIndex) => (attackedSquares[enemyColor][threatIndex] = true));
      if (checkSquares.length) {
        // console.log('hit', checkSquares)
        linesOfCheck.push(checkSquares);
      }
    });

    setLineOfCheckSquares((prev) => ({ ...prev, [enemyColor]: linesOfCheck }));
    setHighlightedLinesOfCheckSquares(Array(64).fill(false));
    linesOfCheck.flat().forEach((index) =>
      setHighlightedLinesOfCheckSquares((squares) => {
        squares[index] = true;
        return [...squares];
      }),
    );

    // Find all legal moves for player color
    const numMoves = piecesOnBoard[playerColor].reduce((total, [piece, index]) => {
      const pieceType = getPieceType(piece);
      const { moves, threats, checkSquares } = getLegalMovesAndThreatsForPiece(
        b,
        attackedSquares[enemyColor],
        linesOfCheck,
        kingLocation[playerColor],
        kingLocation[enemyColor],
        index,
        piece,
        pieceType,
        enPassantSquare,
      );
      legalMovesOnBoard[playerColor][index] = moves;
      threats.forEach((threatIndex) => (attackedSquares[playerColor][threatIndex] = true));
      return (total += moves.length);
    }, 0);

    // console.log(`${numMoves} moves`)
    // console.table(attackedSquares[enemyColor])
    if (!numMoves) setCheckmate(true);
    return { moves: legalMovesOnBoard, threats: attackedSquares, isCheckmate: !numMoves };
  };

  function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
  }

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

      movePiece(randomPreviousIndex, randomNewIndex);
    }
  };

  const resetBoard = () => {
    setBoard(() => {
      const b = Array(64).fill(0);
      b[0] = Piece.Rook | Piece.Black;
      b[1] = Piece.Knight | Piece.Black;
      b[2] = Piece.Bishop | Piece.Black;
      b[3] = Piece.Queen | Piece.Black;
      b[4] = Piece.King | Piece.Black;
      b[5] = Piece.Bishop | Piece.Black;
      b[6] = Piece.Knight | Piece.Black;
      b[7] = Piece.Rook | Piece.Black;
      for (let i = 8; i < 16; i++) b[i] = Piece.Pawn | Piece.Black;
      for (let i = 48; i < 56; i++) b[i] = Piece.Pawn | Piece.White;
      b[56] = Piece.Rook | Piece.White;
      b[57] = Piece.Knight | Piece.White;
      b[58] = Piece.Bishop | Piece.White;
      b[59] = Piece.Queen | Piece.White;
      b[60] = Piece.King | Piece.White;
      b[61] = Piece.Bishop | Piece.White;
      b[62] = Piece.Knight | Piece.White;
      b[63] = Piece.Rook | Piece.White;

      return b;
    });

    const getKingLocation = (color: Piece): number =>
      board().findIndex((piece) => getPieceType(piece) === Piece.King && getPieceColor(piece) === color);
    setKingLocation({ [Piece.Black]: getKingLocation(Piece.Black), [Piece.White]: getKingLocation(Piece.White) });

    updateBoard();

    updateLegalMovesAndThreats();
  };

  const updateLegalMovesAndThreats = () => {
    const { moves, threats } = calculateLegalMoves(board(), {
      colorToMove: colorToMove(),
      kingLocation: kingLocation(),
      lineOfCheckSquares: lineOfCheckSquares(),
      enPassantSquare: enPassantSquare(),
    });
    setLegalMoves(moves);
    // console.log(threats)
    setThreatenedSquares(threats);

    if (previewOnly) {
      let depth = 0;
      const loop = setInterval(() => {
        if (depth++ < 6) makeRandomMove();
        else {
          clearInterval(loop);
          setTimeout(resetBoard, 2000);
        }
      }, 600);
    }
  };

  if (!board()?.filter((v) => v)?.length) resetBoard();

  return (
    <>
      <div
        class={`${styles.BoardWrapper} ${previewOnly ? styles.PreviewBoard : ""} ${hoverFriendlyPiece() ? styles.Pointer : ""} ${
          displayPromotionDialog() ? styles.GreyBoard : ""
        }`}
      >
        <svg
          height={BOARD_SIZE_PX}
          width={BOARD_SIZE_PX}
          viewBox={`0 0 ${8 * TW} ${8 * TW}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          oncontextmenu={(e) => e.preventDefault()}
        >
          {/* Chessboard alternating color pattern */}
          <rect width="100%" height="100%" fill={"transparent"} />
          <For each={[0, 1, 2, 3, 4, 5, 6, 7]}>
            {(y) => (
              <For each={[0, 1, 2]}>
                {(x) => (
                  <>
                    {[0, 1, 2, 3, 4, 5, 6, 7].includes(x) &&
                      !(y == 4 && x === 0) &&
                      !(y == 5 && x === 0) &&
                      !(y == 4 && x === 2) &&
                      !(y == 5 && x === 2) && (
                        <rect fill={lightSquareFill()} x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />
                      )}
                    {props.highlightMoves && highlightedSquares()[getBoardIndexFromRankFile(y, x)] && (
                      <rect fill="blue" opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />
                    )}
                    {props.highlightThreats && threatenedSquares()[getOppositeColor(colorToMove())][getBoardIndexFromRankFile(y, x)] && (
                      <rect fill="red" opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />
                    )}
                    {/* {highlightedLinesOfCheckSquares()[getBoardIndexFromRankFile(y, x)] && <rect fill="yellow" opacity=".5" x={`${TW * x}`} y={`${TW * y}`} width={`${TW}`} height={`${TW}`} />} */}
                  </>
                )}
              </For>
            )}
          </For>

          {/* Pieces on board */}
          <For each={board()}>
            {(piece, i) => {
              if (!dragEnabled() || i() !== draggedIndex()) return renderPiece(piece, i());
            }}
          </For>

          {dragEnabled() &&
            renderPiece(board()[draggedIndex()], draggedIndex(), {
              x: mousePosition().x / DRAG_SCALE_FACTOR - TW / 2,
              y: mousePosition().y / DRAG_SCALE_FACTOR - TW / 2,
            })}

          {displayPromotionDialog() && (
            <>
              <rect width="100%" height="100%" fill="#1f1f1f" opacity={0.75} />
              <For each={[Piece.Queen, Piece.Knight, Piece.Rook, Piece.Bishop]}>
                {(piece, i) => (
                  <>
                    <rect
                      fill="white"
                      opacity={0.75}
                      x={getXPositionFromBoardIndex(promotionSquare() + 8 * i() * (whiteToMove() ? 1 : -1))}
                      y={getYPositionFromBoardIndex(promotionSquare() + 8 * i() * (whiteToMove() ? 1 : -1))}
                      width={`${TW}`}
                      height={`${TW}`}
                    />
                    {renderPiece(
                      piece | (whiteToMove() ? Piece.White : Piece.Black),
                      promotionSquare() + 8 * i() * (whiteToMove() ? 1 : -1),
                    )}
                  </>
                )}
              </For>
              {/* <text x={`${TW * (4 + (4 % 2))}`} y={`${TW * 4}`} class={styles.PromotionText}>Escape or Click to Cancel</text> */}
            </>
          )}
        </svg>
      </div>
      {!previewOnly && (
        <div class={styles.sidebar}>
          {checkmate() && <div>Checkmate!</div>}
          {isDraw() && <div>Draw!</div>}
          {!checkmate() && !isDraw() && (
            <>
              <div>{whiteToMove() ? "White" : "Black"} to move</div>
              <div>{inCheck() ? "In Check!" : ""}</div>
              <div>Available Moves: {legalMoves()[colorToMove()].reduce((nMoves, move) => nMoves + (move?.length ?? 0), 0)}</div>
            </>
          )}
          {/* @ts-ignore */}
          Light Squares: <input type="color" value={lightSquareFill()} onChange={(e) => setLightSquareFill(e.target.value)} />
          {/* @ts-ignore */}
          Dark Squares: <input type="color" value={darkSquareFill()} onChange={(e) => setDarkSquareFill(e.target.value)} />
        </div>
      )}
    </>
  );
};

export default RoyalUr;
