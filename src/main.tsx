import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerAppServiceWorker } from "./pwaUpdate";
import "./styles.css";
import "./theme-overrides.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerAppServiceWorker();
