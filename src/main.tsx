import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

import { ExtensionProvider } from './context/ExtensionContext';

// Całkowita blokada błędu "cancelation" z Monaco Editora
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason && event.reason.type === "cancelation") {
    event.preventDefault(); // Ucisza konsolę
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ExtensionProvider>
      <App />
    </ExtensionProvider>
  </React.StrictMode>
);