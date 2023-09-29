const importObject = {
  imports: {
    imported_func(arg) {
      console.log(arg);
    },
  },
};

onmessage = (e) => {
  console.log("module received from main thread");
  const mod = e.data;

  WebAssembly.instantiate(mod, importObject).then((instance) => {
    let result = instance.exports.get_best_move();
    console.log(result);

    // const { board, colorToMove, kingIndex }: { board: number[]; colorToMove: Piece; kingIndex: number } = JSON.parse(data);

    // const { evaluation, prevIndex, newIndex } = search(board, colorToMove, kingIndex, SEARCH_DEPTH, -Infinity, Infinity);

    // console.log("Positions evaluated:", nPositionsEvaluated);
    // // console.log(payload)
    // const perspective = colorToMove === Piece.White ? 1 : -1;
    postMessage(JSON.stringify({ type: "move", payload: { evaluation: -1, prevIndex: -1, newIndex: -1 } }));
  });
};
