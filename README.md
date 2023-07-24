## Chess
SVG Chess Pieces: https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces

## Usage

Those templates dependencies are maintained via [pnpm](https://pnpm.io) via `pnpm up -Lri`.

This is the reason you see a `pnpm-lock.yaml`. That being said, any package manager will work. This file can be safely be removed once you clone a template.

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm dev` or `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)


## Hnefatafl TODO
### Features
- Shield Wall
- Move Repetitions
- Online Multiplayer
- Play Against Bot
### Bugs
- Wrong cursor on preview
- Clicking Preview doesn't always open game

# Piece Binaries 

00000    0
00001    1   King
00010    2   Pawn
00011    3   Knight
00100    4   Bishop
00101    5   Rook
00110    6   Queen
00111    7   * PIECE TYPE MASK

01000    8   * WHITE MASK
01001    9   White King
01010   10   White Pawn
01011   11   White Knight
01100   12   White Bishop
01101   13   White Rook
01110   14   White Queen
01111   15   * ALL WHITE PIECES MASK

10000   16   * BLACK MASK
10001   17   Black King
10010   18   Black Pawn
10011   19   Black Knight
10100   20   Black Bishop
10101   21   Black Rook
10110   22   Black Queen
10111   23   * ALL BLACK PIECES MASK
11000   24   * PIECE COLOR MASK

# Chessboard

00 01 02 03 04 05 06 07
08 09 10 11 12 13 14 15
16 17 18 19 20 21 22 23
24 25 26 27 28 29 30 31
32 33 34 35 36 37 38 39
40 41 42 43 44 45 46 47
48 49 50 51 52 53 54 55
56 57 58 59 60 61 62 63