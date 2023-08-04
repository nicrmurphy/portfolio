import { Accessor, Component, For } from "solid-js";
import styles from './App.module.css'

const MoveStack: Component<{ moveStack: Accessor<string[]>}> = ({ moveStack }) => {
  return <div class={styles.MoveStackContainer}>
    <For each={moveStack()}>{(move, i) => <>
      {i() % 2 === 0 && <div class={styles.MoveStackItem}>{(i() / 2) + 1  }.</div>}
      <div class={styles.MoveStackItem}>
        <span class={i() === moveStack().length - 1 ? styles.HighlightedMove : ''}>{move}</span>
      </div>
    </>}
    </For>
  </div>
}

export default MoveStack