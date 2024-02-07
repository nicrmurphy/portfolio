/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./pages/App";
import { Navigate, Route, Router, Routes } from "@solidjs/router";
import PlayChess from "./pages/PlayChess";
import PlayHnefatafl from "./pages/PlayHnefatafl";
import PlayRoyalUr from "./pages/PlayRoyalUr";
import HnefataflRules from "./pages/HnefataflRules";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error("Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?");
}

render(
  () => (
    <Router>
      <Routes>
        <Route path="/" component={App} />
        <Route path="/chess" component={PlayChess} />
        <Route path="/hnefatafl" component={PlayHnefatafl} />
        <Route path="/hnefatafl/rules" component={HnefataflRules} />
        {/* <Route path="/royalur" component={PlayRoyalUr} />
      <Route path="/*ur" element={<Navigate href={"/royalur"}/>} /> */}
        {/* <Route path="/*" element={<Navigate href={"/"} />} /> */}
      </Routes>
    </Router>
  ),
  root!,
);
