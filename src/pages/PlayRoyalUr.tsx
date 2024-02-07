import { createSignal } from "solid-js";

import styles from "../App.module.css";
import { BackgroundCircles } from "../BackgroundCircles";
import RoyalUr from "../games/RoyalUr";

function PlayRoyalUr() {
  const [highlightMoves, setHighlightMoves] = createSignal<boolean>(true);
  const [highlightThreats, setHighlightThreats] = createSignal<boolean>(false);

  const [displayResetDialog, setDisplayResetDialog] = createSignal<boolean>(false);
  const [resetBoard, setResetBoard] = createSignal<boolean>(false);

  const onResetBoard = () => {
    setResetBoard(true);
    setDisplayResetDialog(false);
    setResetBoard(false);
  };

  const onReturnHome = () => {
    history.back();
  };

  return (
    <div class={`${styles.App} ${styles.Background} ${styles.SlideInBottom}`}>
      <div class={styles.Foreground}>
        <div class={styles.Header}>
          <div class={`${styles.FillerButton} ${styles.ResetButton}`} onClick={onReturnHome}>
            Return Home
          </div>
        </div>
        <div class={styles.BoardContainer}>
          <RoyalUr
            BOARD_SIZE_PX={750}
            previewOnly={false}
            highlightMoves={highlightMoves()}
            highlightThreats={highlightThreats()}
            resetBoard={resetBoard()}
          />
        </div>
        <div class={styles.BoardFooter}>
          <div class={styles.FooterRow}>
            <input type="checkbox" id="highlight-legal-moves" checked={true} onClick={() => setHighlightMoves((prev) => !prev)} />
            <label for="highlight-legal-moves" class={styles.BorderOption}>
              Highlight Legal Moves
            </label>
          </div>
          <div class={styles.FooterSpacer}></div>
          <div class={styles.FooterRow}>
            <input type="checkbox" id="highlight-threats" checked={false} onClick={() => setHighlightThreats((prev) => !prev)} />
            <label for="highlight-threats" class={styles.BorderOption}>
              Highlight Threats
            </label>
          </div>
        </div>
        <div class={`${styles.FillerButton} ${styles.ResetButton}`} onClick={() => setDisplayResetDialog(true)}>
          Reset Board
        </div>

        {displayResetDialog() && (
          <>
            <div class={styles.ConfirmReset}>
              <div class={styles.ConfirmHeader}>Are you sure?</div>
              <div class={`${styles.FillerButton} ${styles.ConfirmButton}`} onClick={onResetBoard}>
                Reset Board
              </div>
              <div class={`${styles.FillerButton} ${styles.ConfirmButton}`} onClick={() => setDisplayResetDialog(false)}>
                Cancel
              </div>
            </div>
            <div class={styles.Overlay}></div>
          </>
        )}
      </div>
      <BackgroundCircles />
    </div>
  );
}

export default PlayRoyalUr;
