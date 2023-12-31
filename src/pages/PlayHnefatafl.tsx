import styles from "../App.module.css";
import Hnefatafl from "../Hnefatafl";
import { BackgroundCircles } from "../BackgroundCircles";

function PlayHnefatafl() {
  return (
    <div class={`${styles.App} ${styles.Background} ${styles.SlideInBottom}`}>
      <div class={`${styles.Foreground} ${styles.PlayGame}`}>
        <Hnefatafl BOARD_SIZE_PX={800} previewOnly={false} />
      </div>
      <BackgroundCircles />
    </div>
  );
}

export default PlayHnefatafl;
