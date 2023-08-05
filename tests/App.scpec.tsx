import { render } from "@solidjs/testing-library";
import App from "../src/App";
import { describe, expect, it } from "vitest";

describe("App", () => {
  it("should render the app", () => {
    const { getByText } = render(() => <App />);
    expect(getByText("Chess"));
  });

  const EXIT_FORD_TESTING_FEN = "e3b5e8be16be4we4b2e3w3e3b3e7b3e9b2e4w2e3be4we2we6wewe2we7ke2w_w";
  const SHIELD_WALL_TESTING_FEN = "e3b5e8be7we8bwe8b2we3w2e3b2we3kw2eb3we4we3b2we6be2we15be7b6_w";
  const SHIELD_WALL_TESTING2_FEN = "e3b5e8be7we8bwe8b2we3w2e3b2we3kw2eb3we8b2we9bwe9bwe3be8b5_w";
  const SHIELD_WALL_TESTING3_FEN = "e5b3e3wbe9kbe9wbe8bwbe3w2e3be2be3w2eb2wbe3w2e3bwbe8bwbe9be4be8b5_b";
  const PERPETUAL_TESTING_FEN = "e3bebebe7be4be7we2kebe4be5be3we5b3ew2e2web3e3w3e3b2e4we4be16be8b5_w";

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
});
