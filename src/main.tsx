import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

/* import { TempoDevtools } from 'tempo-devtools'; [deprecated] */
/* TempoDevtools.init() [deprecated] */;

// Fix for routing in development environment
const basename = import.meta.env.DEV ? "/" : import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
