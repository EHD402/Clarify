import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initDb } from "./lib/db";

// Makes sure database is created on startup.
initDb();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
