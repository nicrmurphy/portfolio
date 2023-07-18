import { Component, For, JSX, createSignal } from "solid-js";

import styles from "./App.module.css";
import Chess from "./Chess";
import { A } from "@solidjs/router";
import Hnefatafl from "./Hnefatafl";

import fonts from './Fonts.module.css'
import { isTouchEnabled } from "./utility";
import { BackgroundCircles } from "./BackgroundCircles";
import RoyalUr from "./RoyalUr";

const Header: Component<{ content: string }> = (props) => {
  return (
    // @ts-ignore
    <For each={props.content}>{(s, i) => <span>{s === ' ' ? '\xa0' : s}</span>}
    </For>
  )
}

const App: Component = () => {
  const [slideOut, setSlideOut] = createSignal<boolean>(false)
  const [hoverLabel, setHoverLabel] = createSignal<string | null>(null)
  const [displayCheckerText, setDisplayCheckerText] = createSignal<boolean>(false)

  isTouchEnabled() && setTimeout(() => setDisplayCheckerText(true), 1000)
  
  const onClick = (path: string) => {
    setSlideOut(true)
    window.history.pushState({ }, '', path)
    setTimeout(() => location.reload(), 250)
  }

  const onHover = (game: string) => {
    setHoverLabel(game)
  }

  return (
    <div class={`${styles.App} ${styles.SlideFromLeft} ${styles.Background} ${slideOut() ? styles.SlideOut : ''}`}>
      <div class={`${styles.HomeContainer} ${styles.Foreground}`} onMouseEnter={() => setDisplayCheckerText(true)} onMouseLeave={() => setDisplayCheckerText(false)}>
        <div class={`${styles.HeaderText} ${displayCheckerText() ? fonts.CheckerText : ''}`}><span style={{ color: 'white' }}>Choose a&nbsp;</span><Header content={'Game'}></Header></div>
        <div class={styles.GameSelectionWrapper}>
          <div class={styles.GamePreview} onClick={() => onClick('/chess')} onMouseOver={() => onHover('chess')} onMouseLeave={() => setHoverLabel(null)}>
            <Chess BOARD_SIZE_PX={1200} previewOnly={true} />
            <div class={`${styles.GameLabel} ${hoverLabel() === 'chess' ? styles.HoverGameLabel : ''}`}>Chess</div>
          </div>
          <div class={styles.GamePreview} onClick={() => onClick('/hnefatafl')} onMouseOver={() => onHover('hnefatafl')} onMouseLeave={() => setHoverLabel(null)}>
            <Hnefatafl BOARD_SIZE_PX={1200} previewOnly={true} />
            <div class={`${styles.GameLabel} ${hoverLabel() === 'hnefatafl' ? styles.HoverGameLabel : ''}`}>Hnefatafl</div>
          </div>
          {/* <div class={styles.GamePreview} onClick={() => onClick('/royalur')} onMouseOver={() => onHover('royalur')} onMouseLeave={() => setHoverLabel(null)}>
            <RoyalUr BOARD_SIZE_PX={1200} previewOnly={true} />
            <div class={`${styles.GameLabel} ${hoverLabel() === 'royalur' ? styles.HoverGameLabel : ''}`}>Royal Game of Ur</div>
          </div> */}
        </div>
      </div>
      <BackgroundCircles />
    </div>
  );
};

export default App;
