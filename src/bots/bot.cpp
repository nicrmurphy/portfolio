#include <emscripten.h>

#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif
/*

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

  Any = static_cast<int>(White) | static_cast<int>(Black),
};

Piece getPieceType(Piece piece) { return static_cast<Piece>(piece & 7); }
Piece getPieceColor(Piece piece) { return static_cast<Piece>(static_cast<int>(piece) & 24); }

bool pieceIsWhite(Piece piece) { return (static_cast<int>(piece) & static_cast<int>(Piece::White)) != 0; }
bool pieceIsBlack(Piece piece) { return (static_cast<int>(piece) & static_cast<int>(Piece::Black)) != 0; }

Piece getOppositeColor(Piece color) { return (getPieceColor(color) == Piece::White) ? Piece::Black : Piece::White; }

bool isEnemy(const std::vector<int>& board, int i1, int i2) {
    return board[i2] && (getPieceColor(static_cast<Piece>(board[i1])) != getPieceColor(static_cast<Piece>(board[i2])));
}

const int BW = 11;
const int NUM_BOARD_SQUARES = BW * BW;
const int ORTHOGONAL_OFFSETS[4] = {-BW, -1, 1, BW};

const int LEGAL_OFFSETS_KING[] = { -BW, -1, 1, BW };
const int LEGAL_OFFSETS_PAWN[] = { -BW, BW };
const int LEGAL_OFFSETS_KNIGHT[] = { -17, -15, -10, -BW + 2, BW - 1, BW + 2, 15, 17 };
const int LEGAL_OFFSETS_BISHOP[] = { -BW - 1, -BW + 1, BW - 1, BW + 1 };
const int LEGAL_OFFSETS_ROOK[] = { -BW, -1, 1, BW };
const int LEGAL_OFFSETS_QUEEN[] = { -BW - 1, -BW, -BW + 1, -1, 1, BW - 1, BW, BW + 1 };

const int* LEGAL_OFFSETS[Piece::Any] = {
    nullptr, LEGAL_OFFSETS_KING, LEGAL_OFFSETS_PAWN, LEGAL_OFFSETS_KNIGHT,
    LEGAL_OFFSETS_BISHOP, LEGAL_OFFSETS_ROOK, LEGAL_OFFSETS_QUEEN
};

std::vector<std::vector<int>> NUM_SQUARES_TO_EDGE(NUM_BOARD_SQUARES, std::vector<int>(8, 0));

void initializeNumSquaresToEdge() {
    for (int i = 0; i < NUM_BOARD_SQUARES; ++i) {
        const int x = i % BW;
        const int y = i / BW % BW;

        const int numNorth = y;
        const int numSouth = BW - 1 - y;
        const int numWest = x;
        const int numEast = BW - 1 - x;

        const int numNorthEast = std::min(numNorth, numEast);
        const int numNorthWest = std::min(numNorth, numWest);
        const int numSouthEast = std::min(numSouth, numEast);
        const int numSouthWest = std::min(numSouth, numWest);

        NUM_SQUARES_TO_EDGE[i][-BW - 1] = numNorthWest;
        NUM_SQUARES_TO_EDGE[i][-BW] = numNorth;
        NUM_SQUARES_TO_EDGE[i][-BW + 1] = numNorthEast;
        NUM_SQUARES_TO_EDGE[i][-1] = numWest;
        NUM_SQUARES_TO_EDGE[i][1] = numEast;
        NUM_SQUARES_TO_EDGE[i][BW - 1] = numSouthWest;
        NUM_SQUARES_TO_EDGE[i][BW] = numSouth;
        NUM_SQUARES_TO_EDGE[i][BW + 1] = numSouthEast;
    }
}
bool hasNeighborEnemies(const std::vector<int>& board, int index, int piece = 0) {
    if (piece == 0) {
        piece = board[index];
    }

    bool hasNeighbor = false;
    for (int offset : ORTHOGONAL_OFFSETS) {
        if (NUM_SQUARES_TO_EDGE[index][offset] && getPieceColor(piece) != getPieceColor(board[index + offset])) {
            hasNeighbor = true;
            break;
        }
    }

    return hasNeighbor;
}

std::vector<std::pair<int, int>> getNeighborEnemies(const std::vector<int>& board, int index) {
    std::vector<std::pair<int, int>> neighborEnemies;

    for (int offset : ORTHOGONAL_OFFSETS) {
        if (NUM_SQUARES_TO_EDGE[index][offset]) {
            int target = index + offset;
            if (isEnemy(board, index, target)) {
                neighborEnemies.push_back(std::make_pair(offset, target));
            }
        }
    }

    return neighborEnemies;
}

std::vector<int> kingSquares = {0, BW - 1, NUM_BOARD_SQUARES - BW, NUM_BOARD_SQUARES - 1};
bool isKingSquare(int i) {
    return std::find(kingSquares.begin(), kingSquares.end(), i) != kingSquares.end();
}

const int throneIndex = 60;

bool allDefendersSurrounded(const std::vector<int>& board) {
    std::vector<bool> fill(NUM_BOARD_SQUARES, false);
    bool foundEdge = false;

    auto floodFill = [&](int index, std::function<bool(int)> condition, bool stopWhenEdgeFound = true) {
        if ((stopWhenEdgeFound && foundEdge) || fill[index]) return;
        fill[index] = true;
        for (int offset : ORTHOGONAL_OFFSETS) {
            if (!NUM_SQUARES_TO_EDGE[index][offset]) {
                foundEdge = true;
                if (stopWhenEdgeFound) return;
            } else if (condition(index + offset)) {
                floodFill(index + offset, condition, stopWhenEdgeFound);
            }
        }
    };

    for (int index = 0; index < NUM_BOARD_SQUARES; ++index) {
        int piece = board[index];
        if (getPieceColor(piece) == Piece::White) {
            floodFill(index, [&](int index) {
                return getPieceColor(board[index]) != Piece::Black;
            });
        }
    }

    return !foundEdge;
}
*/

// EXTERN EMSCRIPTEN_KEEPALIVE
int *get_best_move(int board[], int color_to_move, int kingIndex) {
    int arr[2] = { 1, 2 };

    return arr;
}

int main() {
    return 0;
}

// https://github.com/michaelg29/webassembly-tutorial/blob/main/exported_func/exported.html
// https://www.youtube.com/watch?v=NMUXoqF8SuE&list=PLysLvOneEETPM_YbEyZcJ35_3pSdrj33O&index=5