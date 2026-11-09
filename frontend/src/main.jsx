import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Home } from "./Home";

// Punto de entrada: React dibuja la aplicación dentro del <div id="root"> de index.html
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);