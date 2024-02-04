import { Component, For, JSXElement } from "solid-js";
import Hnefatafl from "./Hnefatafl";
import { Piece } from "./constants";
import styles from "./Rules.module.css";

const ruleData: {
  title: string;
  body: string;
  board: JSXElement;
}[] = [
  {
    title: "Game Overview",
    body: `
Hnefatafl, also known as "Viking Chess", is a board game played with two opposing players.

Unlike traditional Chess, which simulates two armies of equal strength and size, Hnefatafl presents an asynchronous scenario in which an attacking side (24 dark pieces) is laying seige upon a defending side (12 light pieces and 1 king).

The goal of the attacking pieces is to capture the light king, whereas the goal of the defending pieces is guarantee the king's safety.

Players take turns moving one piece at a time, starting with the attacking side.`,
    board: <Hnefatafl BOARD_SIZE_PX={500} previewOnly={true} hideSidePanel={true} hideFooter={false} />,
  },
  {
    title: "The Board",
    body: `
The game is played on an 11x11 game board with squares that cannot hold more than one piece at a time.

There are 5 "restricted" tiles on the board; one in each of the four corners, and one in the center. The King is the only piece that can occupy any of these 5 squares.

The center square is called the "Throne" and is occupied by the King at the start of the game.`,
    board: <Hnefatafl BOARD_SIZE_PX={500} hideSidePanel={true} hideFooter={false} />,
  },
  {
    title: "How Pieces Move",
    body: `
All pieces move like rook in Chess; meaning, they can move any number of unobstructed squares either vertically or horizontally.

Pieces cannot jump other pieces. Pieces cannot move diagonally.

Although the King is the only piece is that can occupy the Throne (or any other restricted square), all pieces can pass through the throne as long as it is not occupied by the King.

In the example to the side, click and drag a piece to move it to a new square. Alternate moving dark and light pieces and take note of how pieces interact with the Throne.`,
    board: <Hnefatafl BOARD_SIZE_PX={500} hideSidePanel={true} hideFooter={false} initialFen="e19be14we3we17be6kwe19wb2e12w_e" />,
  },
  {
    title: "How Pieces Capture",
    body: `
Unlike Chess, pieces (except for the King) are captured via a flanking maneuver.  A piece is captured when an aggressor moves to sandwich it between two pieces of the opposing side.

Pieces cannot be captured diagonally.  The King may participate in captures.

A player's own pieces cannot be captured during their own turn.  This means that pieces can move into a vacant square between two enemies without being captured.

In the example to the side, use the dark piece to capture the vulnerable light piece.  Then, move the light piece to capture back with help from the King.  Finally, move the dark piece to the square between the white pieces, and note that it is not captured.`,
    board: <Hnefatafl BOARD_SIZE_PX={500} hideSidePanel={true} hideFooter={false} initialFen="e12ke10be10we3we17be17be20wew_e" />,
  },
  {
    title: "Captures (Continued)",
    body: `
Multiple pieces can be captured at the same time.

The King is not captured when flanked between only 2 pieces.

Pieces are not captured against the board edge.

In the example to the side, use a dark piece to simultaneously capture two light pieces.  Then, use the light piece to simultaneously capture three dark pieces.  Finally, use a dark piece to simultaneously capture two light more light pieces.

Note that the King is not captured and the white piece along the board edge is not captured.`,
    board: (
      <Hnefatafl
        BOARD_SIZE_PX={500}
        hideSidePanel={true}
        hideFooter={false}
        initialFen="e14be10we8bke2be8we10be15we8wbebwe3be4be3bwewbe2we5w_e"
      />
    ),
  },
  {
    title: "Hostile Squares",
    body: `
Restricted Squares are hostile when a piece is flanked against them.  This means pieces can be captured against any of the four corners or against the Throne.

The Throne is only hostile to defenders when it is not occupied by the King.

In the example to the side, use the dark piece to capture the light piece against the corner square.  Then, use the King to capture the dark piece against the Throne.

Next, use a dark piece to capture a light piece against the Throne.  Then move the King onto the Throne, capturing the dark piece flanked against the light piece.

Finally, move the last dark piece to the square adjacent the light piece, and note that the Throne is not hostile because it is occupied by the King.`,
    board: <Hnefatafl BOARD_SIZE_PX={500} hideSidePanel={true} hideFooter={false} initialFen="ewe11be25be7kewe9bewe9bebe8w_e" />,
  },
  {
    title: "King Escape",
    body: `
The primary objective for the defending side is to get the King to safety.  If the King occupies one of the four corner squares, the defending side wins.

In the example to the side, use the King to capture the dark piece against the corner square.  Defenders are guaranteed victory in this scenario, because the King has forked two exit squares.

Block either of the exit squares using a dark piece, then win the game for the defenders by moving the King to the open corner.`,
    board: (
      <Hnefatafl
        BOARD_SIZE_PX={500}
        hideSidePanel={true}
        hideFooter={false}
        initialColorToMove={Piece.White}
        initialFen="ebe10bke6bebe9be55be9bebe7be3be5b_e"
      />
    ),
  },
  {
    title: "Exit Forts",
    body: `
Building an Exit Fort is an additional win condition for the defending side.  This is to combat the attacking side strategy of blocking off all four exit squares.

An Exit Fort is an impenetrable group of defenders surrounding the King, in which the King is on a board edge and there is at least one vacant square adjacent to the King.

In the example to the side, there are two Exit Forts prepared.  Complete the top Exit Fort by moving the light piece one square to the right.

The bottom Exit Fort can be completed by first moving the king to the bottommost square on the board, then sealing the fort by moving one of the light pieces one square horizontally.`,
    board: (
      <Hnefatafl
        BOARD_SIZE_PX={500}
        hideSidePanel={true}
        hideFooter={false}
        initialColorToMove={Piece.White}
        initialFen="e2bewkewbe3be2wewbebebe9be48be6be2bwewe3bebebwewe2be3b2wewb2_e"
      />
    ),
  },
  {
    title: "Capturing the King",
    body: `
The primary win condition for the attacking side is to capture the King.  The King is by being surrounding with attackers on all four cardinal sides.

The King is also captured when adjacent to the Throne and surrounded by three attackers.

The King is not captured when on a board edge and surrounded by three attackers.

In the example to the side, move the dark piece to capture the king against the Throne.

Reset the example, move one of the dark pieces blocking a corner, move the King adjacent one square, and capture the King by surrounding it all on four sides.`,
    board: (
      <Hnefatafl
        BOARD_SIZE_PX={500}
        hideSidePanel={true}
        hideFooter={false}
        initialFen="e2be5be3be7bebe9be5b2e8bkebe7bebe9be16bewe7bebe7be3be5b_e"
      />
    ),
  },
  {
    title: "Defenders Surrounded",
    body: `
Surrounding all remaining defenders is an additional win condition for the attacking side.  This guarantees that the King will never reach a corner and prevents the building of an Exit Fort.

Attacking side does not win if there is at least one defender that has an open path to an edge.

In the example to the side, move the dark piece to win the game for the attackers.

Note that even though defenders have built an impenetrable fort, there is no Exit Fort because is the King is not on an edge.`,
    board: (
      <Hnefatafl
        BOARD_SIZE_PX={500}
        hideSidePanel={true}
        hideFooter={false}
        initialFen="e26b4e6bewe2be4bew3e2be2bewekw2ebe2bew4e2be3be5be5bweb2e4be3b_e"
      />
    ),
  },
  {
    title: "Triple Board Repitition",
    body: `
If an exact board position is repeated three times, the attackers win.  This is to prevent the defenders from perpetually threatening a corner escape being blocked by a defender.

It the the responsibility of the defender's side to find new moves and avoid this, as board repetitions are in favor of the attackers.

In the example to the side, move the dark piece one square to the left to trap the King and guarantee victory for the attackers.

Then, alternate between moving the King to threaten a corner escape and blocking with the attacker until the board position is repeated three times.`,
    board: <Hnefatafl BOARD_SIZE_PX={500} hideSidePanel={true} hideFooter={false} initialFen="e3wbe7bkbe10b_e" />,
  },
  {
    title: "Shieldwall Captures",
    body: `
A Shieldwall Capture is a way to capture multiple pieces against the board edge.  All pieces must be against the edge, in a row, and surrounded by attackers when a flanking attack is executed on the board edge.

A corner square can be used as one side of the Shieldwall.

The King is not captured even when inside a Shieldwall.

In the example to the side, on the left side of the board, move the dark piece two squares to the left to complete the Shieldwall and capture the two light pieces.

Then, at the top of the board, move the light piece on square to the left and capture the three dark pieces.

Finally, execute a double Shieldwall by moving the dark piece two squares to the right.  Note that the King is note captured.`,
    board: (
      <Hnefatafl
        BOARD_SIZE_PX={500}
        hideSidePanel={true}
        hideFooter={false}
        initialFen="eb3ewe6w3e5bwe9bwe9bwe9bwe2be5be2wbe7bw2be7bkbe8bwe10b_e"
      />
    ),
  },
  {
    title: "Shieldwall (Continued)",
    body: `
The King may participate in a Shieldwall capture.

In the example to the side, on the top of the board, move the dark piece up one square.  Note that this is not a Shieldwall capture, because the the aggressor did not execute the flank on the board edge.

Next, move the light piece two squares to the left to execute a Shieldwall with help from the King.

Finally, move the dark piece one square to the right to surround the two light pieces.  Note that this is not a Shieldwall capture, because the pieces are not against the board edge.`,
    board: (
      <Hnefatafl
        BOARD_SIZE_PX={500}
        hideSidePanel={true}
        hideFooter={false}
        initialFen="e3bw3be7b2e7we3be4bwe9bwe7b3ke5bew2bwe7b3we9bwe9bw_e"
      />
    ),
  },
  {
    title: "Running Out of Moves",
    body: `
If a player is unable to make a move on their turn, they lose the game.

In the example to the side, move the dark piece down one square to prevent the defenders from having any more valid moves.

Note that this is not a win by surrounding all defenders, because there is a defender on an edge.

Note that this is not a win by capturing the King, because the King cannot be captured using only three attackers unless against the Throne.`,
    board: <Hnefatafl BOARD_SIZE_PX={500} hideSidePanel={true} hideFooter={false} initialFen="e19be9be9bw2be7bw2be8b2e38be9bkb_e" />,
  },
];

const Card: Component<{ ruleTitle: string; ruleBody: string; board: JSXElement }> = ({ ruleTitle, ruleBody, board }) => {
  return (
    <div class={styles.RuleContainer}>
      <div class={styles.RuleText}>
        <div class={styles.RuleTitle}>{ruleTitle}</div>
        <div class={styles.RuleBody}>{ruleBody}</div>
      </div>
      <div>
        <div class={styles.BoardContainer}>{board}</div>
      </div>
    </div>
  );
};

const HnefataflRules: Component = () => {
  return (
    <>
      <div class={styles.RuleContainer}>
        <div class={styles.RuleTitle}>Hnefatafl - Copenhagen Rules</div>
      </div>
      <For each={ruleData}>{(rule) => <Card ruleTitle={rule.title} ruleBody={rule.body} board={rule.board} />}</For>
    </>
  );
};

export default HnefataflRules;
