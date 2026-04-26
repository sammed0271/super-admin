import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./App.css";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { CenterProvider } from "./context/CenterContext";

import { initializeDatabase } from "./services/seedData";

// Initialize mock DB on app load
initializeDatabase().then(() => {
  ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
  ).render(
    <AppProvider>
      <CenterProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CenterProvider>
    </AppProvider>

  );
});
