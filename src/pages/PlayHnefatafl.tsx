import { Component, For, JSX, createSignal } from "solid-js";

import styles from "../App.module.css";
import Chess from "../Chess";
import Hnefatafl from "../Hnefatafl";
import { BackgroundCircles } from "../BackgroundCircles";

function PlayHnefatafl() {
  return (
    <div class={`${styles.App} ${styles.Background} ${styles.SlideInBottom}`}>
      <div class={`${styles.Foreground}`}>
        <Hnefatafl BOARD_SIZE_PX={800} previewOnly={false} />
      </div>
      <BackgroundCircles />
    </div> )
}

export default PlayHnefatafl