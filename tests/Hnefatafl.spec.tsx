import { render } from "@solidjs/testing-library";
import Hnefatafl from "../src/Hnefatafl";
import { describe, expect, it } from "vitest";

describe("Hnefatafl", () => {
  it("should work", () => {
    const h = <Hnefatafl BOARD_SIZE_PX={800} previewOnly={false} />;

    expect(1 + 1).toBe(2);
  });
});
