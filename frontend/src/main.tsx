import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { applyThemeClass, getStoredTheme } from "./lib/theme";

// Применяем тему до рендера, иначе при перезагрузке мелькнёт светлая
applyThemeClass(getStoredTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
