import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import Display from "./Display";

import { initDb } from "./lib/db";
import { ThemeProvider } from "./lib/theme";

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Makes sure database is created on startup.
initDb();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/display/:id" element={<Display />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
