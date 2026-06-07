import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "../ui/App";
import { applyTheme, readStoredTheme } from "../ui/store/themeStore";

// Apply the persisted theme before first paint to avoid a flash of the default.
applyTheme(readStoredTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
